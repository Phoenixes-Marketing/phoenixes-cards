const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const url = process.env.PHOENIXES_URL || 'http://127.0.0.1:8392/';
const output = process.env.PHOENIXES_QA_DIR;
const sizes = [
  ['desktop', { viewport: { width: 1366, height: 850 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
];
function action(page, label) {
  return page.getByRole('button', { name: label, exact: true });
}

async function start(page, random = .75) {
  await page.addInitScript(value => { Math.random = () => value; }, random);
  await page.goto(url);
  await page.waitForFunction(() => Promise.all([packReady, cardBackReady]).then(results => results.every(Boolean)));
}

async function drag(page, device, dx, dy) {
  const { x, y, width, height } = await page.locator('#pack').boundingBox();
  const cx = x + width / 2;
  const cy = y + height * (dy < 0 ? .82 : .5);
  if (device === 'desktop') {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
    await page.mouse.up();
    return;
  }
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
  for (let i = 1; i <= 12; i++) {
    const x = cx + dx * i / 12;
    const y = cy + dy * i / 12;
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

async function progressGesture(page, device) {
  const { x, y, width, height } = await page.locator('#pack').boundingBox();
  const cx = x + width / 2;
  const cy = y + height * .82;
  if (device === 'desktop') {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    const distance = await page.evaluate(() => swipeDistance);
    return {
      move: progress => page.mouse.move(cx, cy - distance * progress, { steps: 6 }),
      end: () => page.mouse.up(),
    };
  }
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
  const distance = await page.evaluate(() => swipeDistance);
  return {
    move: progress => session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - distance * progress }] }),
    end: async () => {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    },
    cancel: async () => {
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await session.detach();
    },
  };
}

async function expectPackAngle(page, angle) {
  await page.waitForFunction(angle => {
    const turn = document.getElementById('packTurn');
    const matrix = new DOMMatrix(getComputedStyle(turn).transform);
    return turn.style.getPropertyValue('--pack-angle') === angle + 'deg' &&
      Math.abs(matrix.m11 - Math.cos(angle * Math.PI / 180)) < .001 &&
      Math.abs(matrix.m13) < .001;
  }, angle);
  await action(page, '開啟卡包').waitFor();
}

function pageChecks(page) {
  const report = { errors: [], warnings: [], httpErrors: [], failedRequests: [], images: new Set() };
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text());
    if (message.type() === 'warning') report.warnings.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) report.httpErrors.push([response.status(), response.url()]);
    if (response.request().resourceType() === 'image' && response.ok()) report.images.add(new URL(response.url()).pathname);
  });
  page.on('requestfailed', request => {
    const error = request.failure().errorText;
    // Intentional reloads may cancel the optional background preview warmer.
    if (error === 'net::ERR_ABORTED' && request.resourceType() === 'image' && /\/card-preview\/\d{2}\.webp(?:\?|$)/.test(request.url())) return;
    report.failedRequests.push([error, request.url()]);
  });
  return () => {
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.httpErrors, []);
    assert.deepEqual(report.failedRequests, []);
    return { ...report, images: report.images.size };
  };
}

async function runtimeSnapshot(page, session) {
  await session.send('HeapProfiler.collectGarbage');
  const { metrics } = await session.send('Performance.getMetrics');
  const values = Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));
  const dom = await page.evaluate(() => ({
    elements: document.querySelectorAll('*').length,
    animations: document.getAnimations().length,
    transientObjects: document.getElementById('particles').children.length,
    canvases: document.querySelectorAll('canvas').length,
    decodedImages: decodedCards.size,
    resources: performance.getEntriesByType('resource').length,
  }));
  return {
    ...dom,
    documents: values.Documents,
    nodes: values.Nodes,
    listeners: values.JSEventListeners,
    jsHeapUsedMB: +(values.JSHeapUsedSize / 1048576).toFixed(2),
    jsHeapTotalMB: +(values.JSHeapTotalSize / 1048576).toFixed(2),
    taskDurationMs: Math.round(values.TaskDuration * 1000),
  };
}

async function shot(page, name) {
  if (output) await page.screenshot({ path: path.join(output, name + '.png') });
}

async function closeScene(page, mobile = false) {
  await page.locator('.scene.view-ready').waitFor();
  const box = await page.locator('#scene').boundingBox();
  const x = box.x + 12;
  const y = box.y + Math.min(160, box.height / 3);
  if (mobile) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await page.waitForFunction(() => !document.querySelector('.scene.active'));
}

async function finishOpening(page) {
  await action(page, '全部揭曉').waitFor();
  await page.waitForFunction(() => !document.getElementById('action').disabled && document.getElementById('action').textContent === '全部揭曉');
  const hand = page.locator('#hand .slot');
  assert.equal(await hand.count(), 4);
  const finalCards = await hand.evaluateAll(slots => slots.map(slot => {
    const card = slot.getBoundingClientRect();
    const back = slot.querySelector('.back img');
    const front = slot.querySelector('.front img');
    return {
      left: card.left, right: card.right, angle: slot.style.getPropertyValue('--r'),
      back: back.complete && back.naturalWidth > 0 && back.src.endsWith('/00.webp'),
      front: front.complete && front.naturalWidth > 0,
    };
  }));
  assert.deepEqual(finalCards.map(card => card.angle), ['-13.5deg', '-4.5deg', '4.5deg', '13.5deg']);
  assert(finalCards.every(card => card.back && card.front && card.left >= 0 && card.right <= page.viewportSize().width));
  return page.evaluate(() => window.phoenixesOpeningMetrics);
}

async function playOpening(browser, name, options, video = false) {
  const context = await browser.newContext({
    ...options,
    ...(video ? { recordVideo: { dir: output, size: options.viewport } } : {}),
  });
  const page = await context.newPage();
  const result = pageChecks(page);
  try {
    await start(page);
    await drag(page, name, 145, 0);
    await expectPackAngle(page, 180);
    assert.equal(await page.locator('.pack-back').evaluate(node => getComputedStyle(node).backfaceVisibility), 'hidden');
    if (video) await shot(page, name + '-back');
    await drag(page, name, -145, 0);
    await expectPackAngle(page, 0);
    if (video) await shot(page, name + '-front');
    const full = await progressGesture(page, name);
    await full.move(1.06);
    await full.end();
    const metrics = await finishOpening(page);
    assert(metrics.durationMs > 1200 && metrics.frames > 20);
    const first = page.locator('#hand .slot').first();
    await first.click();
    await page.waitForFunction(() => document.querySelector('#hand .slot')?.classList.contains('revealed-flat'));
    const flip = await first.locator('.inner').evaluate(node => ({
      angle: new DOMMatrix(getComputedStyle(node).transform).m11,
      style: getComputedStyle(node).transformStyle,
      front: getComputedStyle(node.querySelector('.front')).display,
      back: getComputedStyle(node.querySelector('.back')).display,
    }));
    assert.deepEqual(flip, { angle: 1, style: 'flat', front: 'block', back: 'none' });
    if (video) await shot(page, name + '-flip');
    await action(page, '全部揭曉').click();
    await action(page, '下一包').waitFor();
    await page.waitForFunction(() => Object.keys(JSON.parse(localStorage.getItem('phoenixes-portable'))).length === 4);
    if (!video) {
      await page.reload();
      await action(page, '收藏圖鑑').click();
      assert.equal(await page.locator('.tile:not(:disabled) .thumb').count(), 4);
    } else {
      await page.waitForTimeout(550);
    }
    return { metrics, network: result() };
  } finally {
    const record = page.video();
    await context.close();
    if (record) {
      await record.saveAs(path.join(output, name + '-opening.webm'));
      await record.delete();
    }
  }
}

async function checkProgressControl(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const result = pageChecks(page);
  try {
    await start(page);
    const gesture = await progressGesture(page, name);
    for (const progress of [.25, .5, .75]) {
      await gesture.move(progress);
      await page.waitForFunction(expected => Math.abs(window.phoenixesPackProgress - expected) < .035, progress);
      await page.waitForFunction(() => +getComputedStyle(document.querySelector('.swipe-cue')).opacity < .05);
      const visual = await page.evaluate(() => ({
        progress: window.phoenixesPackProgress,
        preview: document.getElementById('stage').classList.contains('drag-preview'),
        light: +getComputedStyle(document.querySelector('.pack-light-origin')).opacity,
        cue: +getComputedStyle(document.querySelector('.swipe-cue')).opacity,
      }));
      assert(visual.preview && visual.light > 0 && visual.cue < .05);
      await shot(page, `${name}-progress-${progress * 100}`);
    }
    await gesture.move(.25);
    await page.waitForFunction(() => Math.abs(window.phoenixesPackProgress - .25) < .035);
    if (name === 'mobile') await gesture.cancel();
    else await gesture.end();
    await page.waitForFunction(() => window.phoenixesPackProgress === 0 && !document.getElementById('stage').classList.contains('gesture-active'));
    assert.equal(await page.locator('#hand .slot').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('phoenixes-portable')), null);
    await page.waitForTimeout(300);
    assert(+await page.locator('.swipe-cue').evaluate(node => getComputedStyle(node).opacity) > .9);
    await shot(page, `${name}-progress-reset`);

    const full = await progressGesture(page, name);
    await full.move(1.06);
    await full.end();
    await finishOpening(page);
    assert.equal(await page.evaluate(() => window.phoenixesOpeningCount), 1);
    return { network: result() };
  } finally {
    await context.close();
  }
}

async function seek(page, names, time) {
  return page.evaluate(({ names, time }) => {
    const matches = document.getAnimations().filter(animation => names.includes(animation.animationName));
    for (const animation of matches) {
      animation.pause();
      animation.currentTime = time;
    }
    return matches.length;
  }, { names, time });
}

async function resume(page, names) {
  await page.evaluate(names => {
    for (const animation of document.getAnimations()) {
      if (names.includes(animation.animationName)) animation.play();
    }
  }, names);
}

async function inspectStages(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const result = pageChecks(page);
  try {
    await start(page);
    await page.locator('#pack').focus();
    await page.keyboard.press('Enter');
    await page.locator('.charge').waitFor({ state: 'attached' });
    const charge = ['packChargeBand'];
    assert.equal(await seek(page, charge, 560), 2);
    await page.evaluate(() => { window.originalSlots = [...document.querySelector('#hand').children]; });
    await shot(page, name + '-01-charge');
    await resume(page, charge);
    await page.locator('.tear').waitFor({ state: 'attached' });
    const phases = [['02-tear', 150], ['03-extract', 350], ['04-offscreen-turn', 400], ['05-depth-glide', 650], ['06-settle', 700]];
    const sample = [];
    for (const [stage, delay] of phases) {
      await page.waitForTimeout(delay);
      await shot(page, name + '-' + stage);
      sample.push(await page.evaluate(() => {
        const slots = [...document.querySelector('#hand').children];
        const pocket = document.querySelector('.pack-pocket');
        const emitter = document.querySelector('.pack-light-origin');
        const plume = document.querySelector('.pack-plume');
        return {
          layers: [pocket.closest('.zone'), document.getElementById('hand'), emitter.closest('.pack-rear')]
            .map(node => +getComputedStyle(node).zIndex),
          same: slots.every((slot, i) => slot === window.originalSlots[i]),
          mouthAligned: getComputedStyle(pocket).transform === getComputedStyle(emitter).transform,
          plumeAlpha: +getComputedStyle(plume).opacity * +getComputedStyle(emitter).opacity,
          pocketTop: Math.round(pocket.getBoundingClientRect().top),
          top: slots.map(slot => Math.round(slot.getBoundingClientRect().top)),
        };
      }));
    }
    assert(sample.every(stage => stage.same && stage.mouthAligned));
    for (const stage of sample) assert.deepEqual(stage.layers, [4, 3, 2]);
    await finishOpening(page);
    assert(await page.evaluate(() => window.originalSlots.every((slot, i) => slot === document.querySelector('#hand').children[i])));
    await shot(page, name + '-07-fan');
    const srPage = await context.newPage();
    const srNetwork = pageChecks(srPage);
    await start(srPage, 0);
    await action(srPage, '開啟卡包').click();
    await finishOpening(srPage);
    await srPage.locator('#hand .slot').first().click();
    await srPage.locator('.scene.hold.view-ready .hero.open').waitFor();
    await shot(srPage, name + '-08-sr');
    await closeScene(srPage, options.isMobile);
    assert(await srPage.locator('#hand .slot.sr-revealed').count());
    return { sample, network: result(), srNetwork: srNetwork() };
  } finally {
    await context.close();
  }
}

async function inspectPreview(browser, name, options, rank) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const result = pageChecks(page);
  try {
    await start(page, rank === 'SR' ? 0 : .99);
    await action(page, '開啟卡包').click();
    await finishOpening(page);
    const first = page.locator('#hand .slot').first();
    await first.click();
    if (rank === 'SR') {
      await page.locator('.scene.view-ready').waitFor();
      await shot(page, `${name}-preview-sr-summon`);
      await closeScene(page, options.isMobile);
      await page.waitForFunction(() => document.querySelector('#hand .slot.sr-revealed'));
      await page.waitForTimeout(500);
    } else {
      await page.waitForFunction(() => document.querySelector('#hand .slot.revealed-flat'));
    }
    await first.click();
    await page.locator('.scene.view-ready').waitFor();
    await page.waitForFunction(() => document.querySelector('#hero .front img')?.src.endsWith('.png'));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => {
      const rect = node => {
        const box = node.getBoundingClientRect();
        return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
      };
      const vv = window.visualViewport;
      const card = rect(document.getElementById('hero'));
      const titleNode = document.querySelector('.scene.active .title');
      const messageNode = document.getElementById('message');
      const header = rect(document.querySelector('main>header'));
      const footer = rect(document.querySelector('main>footer:not(#status)'));
      const title = rect(titleNode);
      const message = rect(messageNode);
      const titleVisible = getComputedStyle(titleNode).display !== 'none';
      const image = document.querySelector('#hero .front img');
      return {
        viewport: { left: vv?.offsetLeft || 0, top: vv?.offsetTop || 0, width: vv?.width || innerWidth, height: vv?.height || innerHeight },
        card, title, message, header, footer, titleVisible,
        titleOverlap: titleVisible && card.top < title.bottom,
        messageOverlap: card.bottom > message.top,
        titleChromeOverlap: titleVisible && title.top < header.bottom,
        messageChromeOverlap: message.bottom > footer.top,
        cardWidthRatio: card.width / (vv?.width || innerWidth),
        topClearance: card.top - (titleVisible ? title.bottom : (vv?.offsetTop || 0)),
        bottomClearance: message.top - card.bottom,
        image: { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, displayWidth: image.getBoundingClientRect().width, src: image.src.split('/').at(-2) },
      };
    });
    assert(!layout.titleOverlap && !layout.messageOverlap && !layout.titleChromeOverlap && !layout.messageChromeOverlap);
    assert(layout.cardWidthRatio <= (options.isMobile ? .8 : .35));
    assert(layout.topClearance >= 12 && layout.bottomClearance >= 12);
    assert(layout.image.naturalWidth >= layout.image.displayWidth);
    await shot(page, `${name}-preview-${rank.toLowerCase()}`);
    await page.locator('#hero').dblclick();
    await page.waitForFunction(() => document.getElementById('scene').classList.contains('zoomed'));
    layout.zoomed = await page.evaluate(() => ({ zoom: getComputedStyle(document.getElementById('hero')).getPropertyValue('--zoom'), scene: document.getElementById('scene').className }));
    return { layout, network: result() };
  } finally {
    await context.close();
  }
}

async function checkLoadCache(browser, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const read = () => page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
      loadMs: Math.round(navigation.loadEventEnd),
      resources: resources.length,
      transferKB: Math.round(resources.reduce((sum, item) => sum + item.transferSize, 0) / 1024),
      decodedKB: Math.round(resources.reduce((sum, item) => sum + item.decodedBodySize, 0) / 1024),
      cachedResources: resources.filter(item => item.transferSize === 0 && item.decodedBodySize > 0).length,
    };
  });
  try {
    await start(page);
    await page.waitForLoadState('load');
    const first = await read();
    await page.reload();
    await page.waitForFunction(() => Promise.all([packReady, cardBackReady]).then(results => results.every(Boolean)));
    await page.waitForLoadState('load');
    return { first, repeat: await read() };
  } finally {
    await context.close();
  }
}

async function checkFallbacks(browser) {
  const report = {};
  for (const settings of ['low', 'reduced']) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: settings === 'reduced' ? 'reduce' : 'no-preference',
    });
    try {
      const page = await context.newPage();
      const check = pageChecks(page);
      await start(page);
      if (settings === 'low') await page.evaluate(() => { quality = 3; setLevel(2); });
      await action(page, '開啟卡包').tap();
      const metrics = await finishOpening(page);
      if (settings === 'reduced') assert.equal(metrics.frames, 0);
      else assert(metrics.frames > 0);
      await shot(page, settings + '-320-fan');
      report[settings] = { metrics, network: check() };
    } finally {
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1024, height: 720 } });
  try {
    const page = await context.newPage();
    const check = pageChecks(page);
    await start(page);
    const pack = page.getByRole('button', { name: /向上拖動約三分之一螢幕/ });
    await pack.focus();
    await page.keyboard.press('Enter');
    report.keyboard = { metrics: await finishOpening(page), network: check() };
  } finally {
    await context.close();
  }
  return report;
}

async function checkCollection(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Performance.enable');
  const result = pageChecks(page);
  const drawn = new Set();
  const names = new Set();
  try {
    await start(page);
    const before = await runtimeSnapshot(page, session);
    for (let pack = 1; pack <= 10; pack++) {
      if (pack > 1) {
        await action(page, '下一包').click();
        await page.waitForFunction(() => !document.getElementById('action').disabled && document.getElementById('action').textContent === '開啟卡包');
      }
      await action(page, '開啟卡包').click();
      await finishOpening(page);
      const cards = await page.locator('#hand .front img').evaluateAll(images => images.map(image => ({
        name: image.alt, id: image.src.split('/').at(-1),
      })));
      for (const card of cards) {
        assert(!drawn.has(card.id));
        drawn.add(card.id);
        names.add(card.name);
      }
      const rare = await page.locator('#hand .slot.sr').count();
      await action(page, '全部揭曉').click();
      for (let i = 0; i < rare; i++) {
        await page.locator('.scene.view-ready').waitFor();
        await closeScene(page, name === 'mobile');
      }
      await action(page, '下一包').waitFor();
      assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('phoenixes-portable'))).length), pack * 4);
    }
    assert.equal(drawn.size, 40);
    assert.equal(names.size, 37);
    await page.evaluate(() => fullQueue);
    await page.waitForLoadState('networkidle');
    const afterPacks = await runtimeSnapshot(page, session);
    await page.reload();
    await action(page, '收藏圖鑑').click();
    assert.equal(await page.locator('.tile:not(:disabled) .thumb').count(), 40);
    const afterReload = await runtimeSnapshot(page, session);
    return { packs: 10, cards: drawn.size, names: names.size, runtime: { before, afterPacks, afterReload }, network: result() };
  } finally {
    await context.close();
  }
}

async function main() {
  if (output) await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  const results = { browser: browser.version(), devices: {}, stages: {}, previews: {} };
  try {
    if (process.env.PHOENIXES_COLLECTION === '1') {
      const collection = Object.fromEntries(await Promise.all(sizes.map(async ([name, options]) => {
        const result = await checkCollection(browser, name, options);
        console.log(name, result);
        return [name, result];
      })));
      if (output) await fs.writeFile(path.join(output, 'collection-results.json'), JSON.stringify(collection, null, 2) + '\n');
      return;
    }
    if (output) results.loads = await checkLoadCache(browser, sizes[0][1]);
    for (const [name, options] of sizes) {
      results.devices[name] = { ...options, ...await playOpening(browser, name, options) };
      console.log(name, results.devices[name]);
      if (output) {
        results.stages[name] = await inspectStages(browser, name, options);
        await playOpening(browser, name, options, true);
        results.previews[name] = {
          normal: await inspectPreview(browser, name, options, 'N'),
          sr: await inspectPreview(browser, name, options, 'SR'),
        };
      }
      results.devices[name].progress = await checkProgressControl(browser, name, options);
    }
    if (output) {
      const compact = { viewport: { width: 480, height: 568 }, isMobile: true, hasTouch: true };
      results.previews.compact = {
        normal: await inspectPreview(browser, 'compact', compact, 'N'),
        sr: await inspectPreview(browser, 'compact', compact, 'SR'),
      };
    }
    results.fallbacks = await checkFallbacks(browser);
    if (output) await fs.writeFile(path.join(output, 'test-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log('Pack opening checks passed');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
