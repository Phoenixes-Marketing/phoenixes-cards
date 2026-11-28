const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const base = process.env.PHOENIXES_URL || 'http://127.0.0.1:8394/';
const url = new URL('audio-lab-b3.html', base).href;
const output = process.env.PHOENIXES_QA_DIR || path.resolve(__dirname, '..', '.qa-audio-lab-b3');
const sizes = [
  ['desktop',{viewport:{width:1366,height:850}}],
  ['mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]
];

async function sha(text){return crypto.createHash('sha256').update(text).digest('hex')}
function monitor(page){
  const report={errors:[],warnings:[],httpErrors:[],failed:[]};
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());if(message.type()==='warning')report.warnings.push(message.text())});
  page.on('response',response=>{if(response.status()>=400)report.httpErrors.push([response.status(),response.url()])});
  page.on('requestfailed',request=>report.failed.push([request.failure()?.errorText,request.url()]));
  return report;
}
async function skipIntro(page){const cover=page.locator('#intro-cover');if(await cover.count())await cover.click();await page.waitForFunction(()=>!document.getElementById('intro-cover'))}
async function openPanel(page){const panel=page.locator('#audio-lab-b3-panel');if(await panel.isHidden())await page.getByRole('button',{name:'♫ AUDIO LAB B3',exact:true}).click();await panel.waitFor({state:'visible'});return panel}
async function enable(page){const panel=await openPanel(page);await panel.getByRole('button',{name:'啟用／恢復音訊',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent.includes('已啟用音訊'));return panel}

async function testDesktop(page){
  await page.goto(url);await skipIntro(page);
  const production=await page.evaluate(()=>({flight:v5Flight.toString(),styles:[...document.querySelectorAll('style')].filter(x=>!x.textContent.includes('#audio-lab-b3-launch')).map(x=>x.textContent).join('\n')}));
  const formalPage=await page.context().newPage(),formalReport=monitor(formalPage);await formalPage.goto(new URL('index.html',base).href);await skipIntro(formalPage);
  const formal=await formalPage.evaluate(()=>({flight:v5Flight.toString(),styles:[...document.querySelectorAll('style')].map(x=>x.textContent).join('\n')}));
  assert.equal(await sha(production.flight),await sha(formal.flight));assert.equal(await sha(production.styles),await sha(formal.styles));
  await formalPage.getByRole('button',{name:'開啟卡包',exact:true}).click();await formalPage.waitForFunction(()=>state==='reveal',{timeout:12000});const formalMetrics=await formalPage.evaluate(()=>window.phoenixesOpeningMetrics);assert(formalMetrics.durationMs>2000);assert.deepEqual(formalReport.errors,[]);assert.deepEqual(formalReport.httpErrors,[]);assert.deepEqual(formalReport.failed,[]);await formalPage.close();
  assert.equal(await page.locator('#audio-lab-b3-panel details').count(),13);
  assert.equal(await page.locator('#audio-lab-b3-panel [data-variant]').count(),65);
  assert.equal(await page.locator('[data-bgm-select] option').count(),5);
  const panel=await enable(page);
  const decoded=await page.evaluate(async()=>{
    const AC=window.AudioContext||window.webkitAudioContext,ctx=new AC();await ctx.resume();
    const urls=[...Array(13)].flatMap((_,i)=>['a','b','c','d','e'].map(v=>`audio-lab-b3/sfx/${['intro','click','charge','tear','burst','fly','flip','srcharge','sr','srfast','inspect','book','next'][i]}-${v}.ogg`)).concat(['a','b','c','d','e'].map(v=>`audio-lab-b3/bgm/bgm-${v}.ogg`));
    const durations=[];for(const file of urls){const response=await fetch(file);if(!response.ok)throw new Error(`${file} ${response.status}`);const buffer=await ctx.decodeAudioData(await response.arrayBuffer());durations.push(buffer.duration)}await ctx.close();return {count:durations.length,min:Math.min(...durations),max:Math.max(...durations)};
  });
  assert.equal(decoded.count,70);assert(decoded.min>0);assert(decoded.max>50);
  await page.screenshot({path:path.join(output,'desktop-panel.png'),fullPage:true});

  await panel.getByRole('button',{name:'重播開場',exact:true}).click();
  const replay=page.locator('#audio-lab-b3-replay');await replay.waitFor();await page.waitForTimeout(500);
  assert(Number(await replay.locator('span').evaluate(el=>getComputedStyle(el).opacity))>.7);
  await page.waitForTimeout(1250);assert(Number(await replay.locator('span').evaluate(el=>getComputedStyle(el).opacity))<.7);
  await page.waitForTimeout(650);const backdrop=Number(await replay.locator('i').evaluate(el=>getComputedStyle(el).opacity));assert(backdrop>0&&backdrop<1);
  await replay.waitFor({state:'detached',timeout:2000});
  await openPanel(page);await page.getByRole('button',{name:'重播開場',exact:true}).click();await page.locator('#audio-lab-b3-replay').waitFor();await page.locator('#audio-lab-b3-replay').click();await page.locator('#audio-lab-b3-replay').waitFor({state:'detached'});

  const before=await page.evaluate(()=>({formal:localStorage.getItem('phoenixes-portable'),b1:localStorage.getItem('phoenixes-audio-lab-portable'),b2:localStorage.getItem('phoenixes-audio-lab-v2-portable'),b3:localStorage.getItem('phoenixes-audio-lab-b3-portable')}));
  await openPanel(page);await page.getByRole('button',{name:'完整流程測試 N 包',exact:true}).click();await page.waitForTimeout(400);
  const during=await page.evaluate(()=>({progress:window.phoenixesPackProgress,gesture:document.getElementById('stage').classList.contains('gesture-active')}));assert(during.progress>0&&during.progress<1);assert(during.gesture);
  await page.waitForFunction(()=>state==='reveal',{timeout:12000});assert(await page.evaluate(()=>draw.every(card=>card.rank==='N')));
  const nMetrics=await page.evaluate(()=>window.phoenixesOpeningMetrics);assert(nMetrics.durationMs>2000);assert(nMetrics.frames>30);
  await page.screenshot({path:path.join(output,'desktop-normal-pack.png'),fullPage:true});
  await page.evaluate(async()=>{await revealAll();await arrival()});
  await openPanel(page);await page.getByRole('button',{name:'完整流程測試含 SR 包',exact:true}).click();await page.waitForFunction(()=>state==='reveal',{timeout:12000});assert(await page.evaluate(()=>draw.some(card=>card.rank==='SR')));
  await openPanel(page);await page.getByRole('button',{name:'重播開場',exact:true}).click();assert(await page.locator('#audio-lab-b3-panel').isVisible());await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('下一包'));
  await page.screenshot({path:path.join(output,'desktop-sr-blocked-replay.png'),fullPage:true});
  const after=await page.evaluate(()=>({formal:localStorage.getItem('phoenixes-portable'),b1:localStorage.getItem('phoenixes-audio-lab-portable'),b2:localStorage.getItem('phoenixes-audio-lab-v2-portable'),b3:localStorage.getItem('phoenixes-audio-lab-b3-portable')}));
  assert.deepEqual(after,before);

  await panel.locator('[data-bgm-on]').check();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('背景音樂播放中'));await panel.getByRole('button',{name:'暫停',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('已暫停'));
  await panel.getByRole('button',{name:'顯示／複製設定',exact:true}).click();const exported=await panel.locator('[data-export]').inputValue();assert(exported.includes('377b890b38c4e6610eb1adbe941a7108710f484b'));assert(JSON.parse(exported).settings.cues.intro);
  return {decoded,nMetrics,formalMetrics,productionMatch:{flightHash:await sha(production.flight),styleHash:await sha(production.styles)},formalBrowser:formalReport};
}

async function testMobile(page){
  await page.goto(url);await skipIntro(page);const panel=await enable(page);
  const box=await panel.boundingBox();assert(box.x>=0&&box.x+box.width<=390);assert(box.y>=0&&box.y+box.height<=844);
  await panel.locator('details').first().click();await panel.locator('[data-variant="e"]').first().click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('正在試聽'));
  await page.screenshot({path:path.join(output,'mobile-panel.png'),fullPage:true});
  return {panel:{x:Math.round(box.x),y:Math.round(box.y),width:Math.round(box.width),height:Math.round(box.height)}};
}

(async()=>{
  await fs.mkdir(output,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});const result={};
  try{for(const [name,options] of sizes){const context=await browser.newContext(options);const page=await context.newPage();const report=monitor(page);result[name]=name==='desktop'?await testDesktop(page):await testMobile(page);result[name].browser=report;assert.deepEqual(report.errors,[]);assert.deepEqual(report.httpErrors,[]);assert.deepEqual(report.failed,[]);await context.close()}}
  finally{await browser.close()}
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
