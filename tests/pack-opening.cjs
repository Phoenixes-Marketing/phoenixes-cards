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
const tearAnimations = [
  'packExpose', 'packDrop', 'packReleaseBand', 'packUnseal', 'packSealTear',
  'packLight', 'drawFromPack', 'drawReflection',
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
  const cy = y + height / 2;
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
  page.on('requestfailed', request => report.failedRequests.push([request.failure().errorText, request.url()]));
  return () => {
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.httpErrors, []);
    assert.deepEqual(report.failedRequests, []);
    return { ...report, images: report.images.size };
  };
}

async function shot(page, name) {
  if (output) await page.screenshot({ path: path.join(output, name + '.png') });
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
    if (name === 'mobile') await drag(page, name, 0, -100);
    else await page.locator('#pack').click();
    const metrics = await finishOpening(page);
    assert(metrics.durationMs > 2100 && metrics.frames > 20);
    const first = page.locator('#hand .slot').first();
    if (name === 'mobile') await first.tap();
    else await first.click();
    await page.waitForFunction(() => !!document.querySelector('#hand .slot.open .label')?.textContent);
    const flip = await first.locator('.inner').evaluate(node => ({
      angle: new DOMMatrix(getComputedStyle(node).transform).m11,
      style: getComputedStyle(node).transformStyle,
      cull: getComputedStyle(node.querySelector('.front')).backfaceVisibility,
    }));
    assert.deepEqual(flip, { angle: -1, style: 'preserve-3d', cull: 'hidden' });
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
    await action(page, '開啟卡包').click();
    await page.locator('.charge').waitFor({ state: 'attached' });
    const charge = ['packChargeBand'];
    assert.equal(await seek(page, charge, 560), 2);
    await page.evaluate(() => { window.originalSlots = [...document.querySelector('#hand').children]; });
    await shot(page, name + '-01-charge');
    await resume(page, charge);
    await page.locator('.tear').waitFor({ state: 'attached' });
    await seek(page, tearAnimations, 165);
    const phases = [['02-tear', 165], ['03-volume-light', 310], ['04-extract', 540], ['05-drop', 870], ['06-spread', 1160]];
    const sample = [];
    for (const [stage, time] of phases) {
      await seek(page, tearAnimations, time);
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
          shown: slots.every(slot => {
            const style = getComputedStyle(slot);
            return style.display !== 'none' && style.visibility === 'visible' && style.opacity === '1' && style.zIndex === 'auto';
          }),
          mouthAligned: getComputedStyle(pocket).transform === getComputedStyle(emitter).transform,
          plumeAlpha: +getComputedStyle(plume).opacity * +getComputedStyle(emitter).opacity,
          pocketTop: Math.round(pocket.getBoundingClientRect().top),
          top: slots.map(slot => Math.round(slot.getBoundingClientRect().top)),
        };
      }));
    }
    assert(sample.every(stage => stage.same && stage.shown && stage.mouthAligned));
    for (const stage of sample) assert.deepEqual(stage.layers, [4, 3, 2]);
    assert(sample[3].pocketTop - sample[2].pocketTop > 40);
    assert(sample[1].plumeAlpha > .7 && sample[3].plumeAlpha > .45);
    assert(sample[2].top[0] < sample[1].top[0] - 55);
    await resume(page, tearAnimations);
    await finishOpening(page);
    assert(await page.evaluate(() => window.originalSlots.every((slot, i) => slot === document.querySelector('#hand').children[i])));
    await shot(page, name + '-07-fan');
    const srPage = await context.newPage();
    const srNetwork = pageChecks(srPage);
    await start(srPage, 0);
    await action(srPage, '開啟卡包').click();
    await finishOpening(srPage);
    await srPage.locator('#hand .slot').first().click();
    await srPage.locator('.scene.hold .hero.open').waitFor();
    await srPage.waitForFunction(() => document.querySelector('.scene.active') && document.getElementById('message').textContent.includes('雙指'));
    await shot(srPage, name + '-08-sr');
    await srPage.mouse.click(12, 160);
    await srPage.waitForFunction(() => !document.querySelector('.scene.active'));
    assert(await srPage.locator('#hand .slot.sr-revealed').count());
    return { sample, network: result(), srNetwork: srNetwork() };
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
  return report;
}

async function checkCollection(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const result = pageChecks(page);
  const drawn = new Set();
  const names = new Set();
  try {
    await start(page);
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
        await page.waitForFunction(() => document.querySelector('.scene.active') && document.getElementById('message').textContent.includes('雙指'));
        if (name === 'mobile') await page.touchscreen.tap(12, 160);
        else await page.mouse.click(12, 160);
        await page.waitForFunction(() => !document.querySelector('.scene.active'));
      }
      await action(page, '下一包').waitFor();
      assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('phoenixes-portable'))).length), pack * 4);
    }
    assert.equal(drawn.size, 40);
    assert.equal(names.size, 37);
    await page.reload();
    await action(page, '收藏圖鑑').click();
    assert.equal(await page.locator('.tile:not(:disabled) .thumb').count(), 40);
    return { packs: 10, cards: drawn.size, names: names.size, network: result() };
  } finally {
    await context.close();
  }
}

async function main() {
  if (output) await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  const results = { browser: browser.version(), devices: {}, stages: {} };
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
    for (const [name, options] of sizes) {
      results.devices[name] = { ...options, ...await playOpening(browser, name, options) };
      console.log(name, results.devices[name]);
      if (output) {
        results.stages[name] = await inspectStages(browser, name, options);
        await playOpening(browser, name, options, true);
      }
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
