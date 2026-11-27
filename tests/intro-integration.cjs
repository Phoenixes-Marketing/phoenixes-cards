const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const url='http://127.0.0.1:8394/';
async function done(p){await p.waitForFunction(()=>window.phoenixesIntroDone===true,{},{timeout:8000});assert.equal(await p.locator('#intro-cover').count(),0);assert.equal(await p.locator('main').evaluate(e=>e.inert),false);assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('intro-pending')),false)}
(async()=>{const browser=await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const mobile of [false,true]){
const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:850},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1});
const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(url,{waitUntil:'domcontentloaded'});assert.equal(await p.locator('main').evaluate(e=>e.inert),true);await done(p);
const first=await p.evaluate(()=>performance.now()-window.phoenixesIntroBoot);assert(first<6600);
await p.locator('#book').click();await p.locator('#collection').waitFor({state:'visible'});assert.equal(await p.locator('#intro-cover').count(),0);
await p.reload({waitUntil:'domcontentloaded'});assert.equal(await p.locator('#intro-cover').count(),1);await p.locator('#intro-cover').click({force:true});await done(p);assert.equal(await p.evaluate(()=>localStorage.getItem('phoenixes-portable')),null);
await p.reload({waitUntil:'domcontentloaded'});await p.keyboard.press('Escape');await done(p);
await p.locator('#action').click();await p.waitForFunction(()=>document.querySelectorAll('#hand .slot').length===4,{},{timeout:30000});await p.waitForFunction(()=>document.querySelector('#action').disabled===false,{},{timeout:15000});await p.locator('#action').click();await p.waitForFunction(()=>document.querySelector('#action').textContent.includes('下一包'),{},{timeout:15000});assert.equal(await p.locator('#intro-cover').count(),0);
assert.deepEqual(errors,[]);console.log(JSON.stringify({mobile,first,repeat:true,skip:true,keyboard:true,collection:true,draw:true,errors}));await c.close();
}
const reduced=await browser.newContext({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(url,{waitUntil:'domcontentloaded'});await done(rp);console.log('reduced-motion passed');await reduced.close();
const slow=await browser.newContext();const sp=await slow.newPage();await sp.route('**/assets/vfx-purple/background.webp',async route=>{await new Promise(r=>setTimeout(r,3500));await route.abort()});await sp.goto(url,{waitUntil:'domcontentloaded'});await done(sp);console.log('slow failed background: fail-open passed');await slow.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
