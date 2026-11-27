const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const url = process.env.PHOENIXES_URL || 'http://127.0.0.1:8393/';
const output = process.env.PHOENIXES_QA_DIR || path.join(process.cwd(), 'qa-final-quality');
const profileFilter = process.env.PHOENIXES_PROFILE;
const profiles = [
  ['desktop-1080', { viewport: { width: 1920, height: 1080 } }],
  ['desktop-1440', { viewport: { width: 2560, height: 1440 } }],
  ['narrow', { viewport: { width: 720, height: 900 } }],
  ['iphone-portrait', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ['iphone-landscape', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
];

function action(page, label) {
  return page.getByRole('button', { name: label, exact: true });
}

function checks(page) {
  const report = { errors: [], warnings: [], httpErrors: [], failedRequests: [] };
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text());
    if (message.type() === 'warning') report.warnings.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) report.httpErrors.push([response.status(), response.url()]);
  });
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure?.errorText === 'net::ERR_ABORTED' && /\/card-preview\/\d{2}\.webp/.test(request.url())) return;
    report.failedRequests.push([failure?.errorText, request.url()]);
  });
  return () => report;
}

async function start(page) {
  await page.addInitScript(() => { Math.random = () => .99; });
  await page.goto(url);
  await page.waitForFunction(() => Promise.all([packReady, cardBackReady]).then(values => values.every(Boolean)));
  await page.waitForLoadState('load');
}

async function frameSample(page, duration = 1600) {
  return page.evaluate(duration => new Promise(resolve => {
    const frames = [];
    let started = 0;
    let last = 0;
    function tick(now) {
      if (!started) started = last = now;
      else {
        frames.push(now - last);
        last = now;
      }
      if (now - started < duration) requestAnimationFrame(tick);
      else {
        const sorted = [...frames].sort((a, b) => a - b);
        const worst = Math.max(...frames);
        const worstIndex = frames.indexOf(worst);
        resolve({
          frames: frames.length,
          averageFps: Math.round(frames.length * 1000 / Math.max(1, now - started)),
          p95FrameMs: +sorted[Math.max(0, Math.ceil(sorted.length * .95) - 1)].toFixed(2),
          worstFrameMs: +worst.toFixed(2),
          worstAtMs: +frames.slice(0, worstIndex + 1).reduce((sum, value) => sum + value, 0).toFixed(2),
          slowFrames: frames.filter(value => value > 34).length,
        });
      }
    }
    requestAnimationFrame(tick);
  }), duration);
}

async function layoutSnapshot(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { left: +box.left.toFixed(1), top: +box.top.toFixed(1), right: +box.right.toFixed(1), bottom: +box.bottom.toFixed(1), width: +box.width.toFixed(1), height: +box.height.toFixed(1) };
    };
    const viewport = { width: innerWidth, height: innerHeight, visualWidth: visualViewport?.width || innerWidth, visualHeight: visualViewport?.height || innerHeight };
    const selectors = ['main>header', '.brand-logo', '#book', '#stage', '#pack', '.actions', 'main>footer:not(#status)', '.footer-version', '#progress', '.footer-edition'];
    const boxes = Object.fromEntries(selectors.map(selector => [selector, rect(selector)]));
    const visible = Object.fromEntries(Object.entries(boxes).map(([selector, box]) => [selector, !!box && box.right >= 0 && box.left <= viewport.width && box.bottom >= 0 && box.top <= viewport.height]));
    return { viewport, boxes, visible, scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight } };
  });
}

async function canvasSnapshot(page) {
  return page.evaluate(() => [...document.querySelectorAll('canvas')].map(canvas => {
    const box = canvas.getBoundingClientRect();
    return {
      id: canvas.id || canvas.parentElement?.className || 'canvas',
      css: [Math.round(box.width), Math.round(box.height)],
      buffer: [canvas.width, canvas.height],
      density: [box.width ? +(canvas.width / box.width).toFixed(2) : 0, box.height ? +(canvas.height / box.height).toFixed(2) : 0],
    };
  }));
}

async function closeScene(page, mobile) {
  await page.locator('.scene.view-ready').waitFor();
  const scene = await page.locator('#scene').boundingBox();
  const x = scene.x + 12;
  const y = scene.y + Math.min(150, scene.height / 3);
  const started = Date.now();
  if (mobile) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await page.waitForFunction(() => !document.querySelector('.scene.active'));
  return Date.now() - started;
}

async function waitCollectionVisible(page) {
  await page.locator('#collection').waitFor({ state: 'visible' });
  await page.waitForFunction(() => +getComputedStyle(document.getElementById('collection')).opacity > .99);
}

async function revealAllNormal(page) {
  await action(page, '開啟卡包').click();
  await action(page, '全部揭曉').waitFor();
  const opening = await page.evaluate(() => window.phoenixesOpeningMetrics);
  await action(page, '全部揭曉').click();
  await action(page, '下一包').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('#hand .slot.revealed-flat').length === 4);
  return opening;
}

async function previewSnapshot(page, mobile) {
  await page.locator('#hand .slot').first().click();
  await page.locator('.scene.view-ready').waitFor();
  await page.waitForFunction(() => document.querySelector('#hero .front img')?.complete);
  const layout = await page.evaluate(() => {
    const box = node => {
      const value = node.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
    };
    const card = box(document.getElementById('hero'));
    const message = box(document.getElementById('message'));
    const header = box(document.querySelector('main>header'));
    const footer = box(document.querySelector('main>footer:not(#status)'));
    const image = document.querySelector('#hero .front img');
    return {
      card, message, header, footer,
      overlap: { header: card.top < header.bottom, footer: card.bottom > footer.top, message: card.bottom > message.top },
      image: { natural: [image.naturalWidth, image.naturalHeight], display: [image.getBoundingClientRect().width, image.getBoundingClientRect().height], source: image.src.includes('/cards/') ? 'full' : 'preview' },
      inputIsolation: getComputedStyle(document.querySelector('.actions')).pointerEvents,
    };
  });
  assert(!layout.overlap.header && !layout.overlap.footer && !layout.overlap.message);
  assert.equal(layout.inputIsolation, 'none');
  if (!mobile) {
    const hero = await page.locator('#hero').boundingBox();
    await page.mouse.move(hero.x + hero.width * .85, hero.y + hero.height * .2, { steps: 12 });
    await page.waitForTimeout(80);
    layout.tilt = await page.locator('#tilt').evaluate(node => getComputedStyle(node).transform);
  } else {
    const hero = await page.locator('#hero').boundingBox();
    const session = await page.context().newCDPSession(page);
    const cx = hero.x + hero.width / 2;
    const cy = hero.y + hero.height / 2;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 30, y: cy }, { x: cx + 30, y: cy }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 70, y: cy }, { x: cx + 70, y: cy }] });
    await page.waitForFunction(() => document.getElementById('scene').classList.contains('zoomed'));
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await session.detach();
    layout.pinchCancel = await page.evaluate(() => ({ zoom, pointers: pointers.size, drag, scene: scene.className }));
    assert(layout.pinchCancel.zoom > 1 && layout.pinchCancel.pointers === 0 && !layout.pinchCancel.drag);
    await page.evaluate(() => changeZoom(1));
  }
  layout.frames = await frameSample(page, 1200);
  layout.closeMs = await closeScene(page, mobile);
  const returned = await page.locator('#hand .slot').first().evaluate(slot => ({
    flat: slot.classList.contains('revealed-flat'),
    front: getComputedStyle(slot.querySelector('.front')).display,
    back: getComputedStyle(slot.querySelector('.back')).display,
  }));
  assert.deepEqual(returned, { flat: true, front: 'block', back: 'none' });
  return layout;
}

async function collectionCycle(page) {
  const openStart = Date.now();
  await action(page, '收藏圖鑑').click();
  await waitCollectionVisible(page);
  const openMs = Date.now() - openStart;
  const state = await page.evaluate(() => ({
    display: getComputedStyle(document.getElementById('collection')).display,
    opacity: getComputedStyle(document.getElementById('collection')).opacity,
    book: document.getElementById('stage').classList.contains('collection-open'),
    tiles: document.querySelectorAll('#grid .tile').length,
  }));
  const closeStart = Date.now();
  await action(page, '返回').click();
  await page.waitForFunction(() => getComputedStyle(document.getElementById('collection')).display === 'none');
  return { openMs, closeMs: Date.now() - closeStart, state };
}

async function runtime(page, session) {
  await session.send('HeapProfiler.collectGarbage');
  const { metrics } = await session.send('Performance.getMetrics');
  const values = Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));
  return page.evaluate(() => ({
    elements: document.querySelectorAll('*').length,
    animations: document.getAnimations().length,
    canvases: document.querySelectorAll('canvas').length,
    transientParticles: document.getElementById('particles').children.length,
  })).then(dom => ({ ...dom, nodes: values.Nodes, listeners: values.JSEventListeners, jsHeapUsedMB: +(values.JSHeapUsedSize / 1048576).toFixed(2) }));
}

async function repeatCycles(page, mobile, session) {
  const before = await runtime(page, session);
  for (let i = 0; i < 8; i++) {
    await page.locator('#hand .slot').first().click();
    await page.locator('.scene.view-ready').waitFor();
    await closeScene(page, mobile);
    await page.waitForTimeout(500);
    await collectionCycle(page);
  }
  await page.waitForTimeout(400);
  return { before, after: await runtime(page, session) };
}

async function runProfile(browser, name, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send('Performance.enable');
  const report = checks(page);
  try {
    await start(page);
    const result = {
      options,
      idleLayout: await layoutSnapshot(page),
      idleFrames: await frameSample(page),
      canvases: await canvasSnapshot(page),
    };
    await page.screenshot({ path: path.join(output, `${name}-idle.png`) });
    result.opening = await revealAllNormal(page);
    result.canvasesAfterOpening = await canvasSnapshot(page);
    await page.screenshot({ path: path.join(output, `${name}-hand.png`) });
    if (process.env.PHOENIXES_PREVIEW_LEVEL) await page.evaluate(level => setLevel(+level), process.env.PHOENIXES_PREVIEW_LEVEL);
    result.preview = await previewSnapshot(page, options.isMobile);
    await page.screenshot({ path: path.join(output, `${name}-returned.png`) });
    await page.waitForTimeout(500);
    await action(page, '收藏圖鑑').click();
    await waitCollectionVisible(page);
    await page.screenshot({ path: path.join(output, `${name}-collection.png`) });
    await action(page, '返回').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('collection')).display === 'none');
    result.collection = await collectionCycle(page);
    const nextStart = Date.now();
    await action(page, '下一包').click();
    await action(page, '開啟卡包').waitFor();
    result.nextPackMs = Date.now() - nextStart;
    if (name === 'iphone-portrait') {
      await page.setViewportSize({ width: 390, height: 650 });
      await page.waitForTimeout(150);
      result.dynamicViewportCompact = await layoutSnapshot(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      result.dynamicViewportRestored = await layoutSnapshot(page);
    }
    if (name === 'desktop-1080') {
      await revealAllNormal(page);
      result.repeatCycles = await repeatCycles(page, false, session);
    }
    result.network = report();
    assert.deepEqual(result.network.errors, []);
    assert.deepEqual(result.network.httpErrors, []);
    assert.deepEqual(result.network.failedRequests, []);
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
  const results = { url, browser: browser.version(), generatedAt: new Date().toISOString(), profiles: {} };
  try {
    for (const [name, options] of profiles) {
      if (profileFilter && name !== profileFilter) continue;
      results.profiles[name] = await runProfile(browser, name, options);
      console.log(name, results.profiles[name].opening, results.profiles[name].idleFrames);
    }
  } finally {
    await browser.close();
  }
  await fs.writeFile(path.join(output, 'quality-results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log('Final quality checks passed');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
