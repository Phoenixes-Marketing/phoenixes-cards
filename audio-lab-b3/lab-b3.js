(()=>{
'use strict';

const BASE_VARIANTS=['a','b','c','d','e'];
const EXPANDED_VARIANTS=[...BASE_VARIANTS,'f','g','h','i','j'];
const CUES=[
  {id:'intro',label:'開場 Duel Start.',volume:42,variants:EXPANDED_VARIANTS,names:['祕法序列','柔亮符文','短促咒印','深色和聲','高階魔紋','療癒法術一','植物魔法長尾','水系法術長尾','風系法術長尾','療癒法術六']},
  {id:'click',label:'按鈕操作',volume:20,names:['柔和選取','乾淨點按','細小刻度','木質撥弦','低調切換']},
  {id:'charge',label:'拖曳／開包蓄力',volume:34,variants:EXPANDED_VARIANTS,names:['空靈漸升','介面展開','魔法升階','暗色蓄能','場景轉換','療癒蓄能','植物蓄能','水系蓄能','風系蓄能','短版療癒蓄能']},
  {id:'tear',label:'卡包撕開',volume:46,names:['真實紙張撕裂','卡包薄膜一','卡包薄膜二','俐落切面','厚布摩擦']},
  {id:'burst',label:'能量擴散',volume:38,variants:EXPANDED_VARIANTS,names:['柔長掃過','寬幅掠過','魔法釋放','法術擴散','風系擴散','療癒擴散','植物擴散','水系擴散','風系擴散二','短版療癒擴散']},
  {id:'fly',label:'卡牌飛出',volume:28,names:['輕柔氣流','安靜掠過','短距離揮動','中距離揮動','長距離揮動']},
  {id:'flip',label:'N 卡翻面',volume:34,names:['薄牌滑動','卡面落定','真實紙張','抽牌動作','輕點卡面']},
  {id:'srcharge',label:'SR 登場蓄力',volume:36,names:['電影感漸升','空間回聲','療癒光流','風系長尾','祕法長尾']},
  {id:'sr',label:'SR 正面揭曉',volume:45,names:['低沉鐘鳴','玻璃泛音','柔亮確認','金屬餘韻','三角清響']},
  {id:'srfast',label:'全部揭曉中的 SR',volume:30,names:['短玻璃光','短撥弦','短確認音','細珠泛音','柔鐘提示']},
  {id:'inspect',label:'卡牌檢視／返回',volume:25,names:['卡牌推移','卡牌滑行','卡包取出','卡牌放置','介面捲動']},
  {id:'book',label:'圖鑑開關',volume:30,names:['書本開啟','書本闔上','翻頁一','翻頁二','翻頁三']},
  {id:'next',label:'下一包',volume:32,names:['展牌一','展牌二','洗牌','取出新包','紙牌洗動']}
];
const BGM=[
  {id:'a',name:'A｜Dark Shrine 神殿低鳴（保留）'},
  {id:'b',name:'B｜Cathedral Forest 空間環境'},
  {id:'c',name:'C｜Ancient Caverns 洞窟氛圍'},
  {id:'d',name:'D｜Dungeon Ambience 地城空氣'},
  {id:'e',name:'E｜Tallbeard 神祕配樂（保留）'},
  {id:'f',name:'F｜Tallbeard Loop 30-02（新）'},
  {id:'g',name:'G｜Tallbeard Loop 30-03（新）'},
  {id:'h',name:'H｜Tallbeard Loop 32-05（新）'},
  {id:'i',name:'I｜Tallbeard Loop 38-08（新）'},
  {id:'j',name:'J｜Tallbeard Patreon 04（新）'}
];
const KEY='phoenixes-audio-lab-b3-settings-v1';
const DEFAULT_SELECTIONS={intro:{volume:30,variant:'a',delay:0,rate:1},click:{volume:20,variant:'b',delay:0,rate:.8},charge:{volume:60,variant:'d',delay:0,rate:.7},tear:{volume:46,variant:'c',delay:0,rate:1},burst:{volume:38,variant:'e',delay:0,rate:1.2},fly:{volume:25,variant:'b',delay:0,rate:1.3},flip:{volume:35,variant:'b',delay:0,rate:1.1},srcharge:{volume:40,variant:'c',delay:0,rate:.8},sr:{volume:15,variant:'b',delay:250,rate:.7},srfast:{volume:30,variant:'d',delay:0,rate:.8},inspect:{volume:25,variant:'b',delay:0,rate:.7},book:{volume:30,variant:'a',delay:0,rate:.7},next:{volume:32,variant:'d',delay:0,rate:.9}};
const variantsFor=cue=>cue.variants||BASE_VARIANTS;
const defaults=()=>({master:100,muted:false,cues:Object.fromEntries(CUES.map(c=>[c.id,{on:true,...DEFAULT_SELECTIONS[c.id]}])),bgm:{on:true,volume:70,variant:'e'}});
let cfg=defaults();
try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved){
    cfg.master=number(saved.master,0,100,cfg.master);cfg.muted=!!saved.muted;
    for(const cue of CUES){const v=saved.cues?.[cue.id];if(!v)continue;cfg.cues[cue.id]={on:v.on!==false,volume:number(v.volume,0,100,cue.volume),variant:variantsFor(cue).includes(v.variant)?v.variant:'a',delay:number(v.delay,0,1000,0),rate:number(v.rate,.7,1.35,1)}}
    if(saved.bgm)cfg.bgm={on:!!saved.bgm.on,volume:number(saved.bgm.volume,0,100,24),variant:BGM.some(x=>x.id===saved.bgm.variant)?saved.bgm.variant:'a'};
  }
}catch{}

function number(value,min,max,fallback){value=Number(value);return Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch{}updateExport()}

let ctx,master,sfxBus,bgmBus,limiter,statusEl,enablePromise;
const buffers=new Map(),loading=new Map(),active=new Set(),activeByCue=new Map(),reversedBuffers=new WeakMap();
let chargeSource=null,chargeProgress=0,chargeDirection=0,chargeKey='',chargeLoadingKey='',chargeDelayTimer=0,chargeDelayReady=false,bgmSource=null,bgmOffset=0,bgmStarted=0,bgmWanted=cfg.bgm.on,hiddenPause=false,replayStop=null;

function status(text){if(statusEl)statusEl.textContent=text}
function setGains(){if(!ctx)return;master.gain.setTargetAtTime(cfg.muted?0:cfg.master/100,ctx.currentTime,.025);bgmBus.gain.setTargetAtTime(cfg.bgm.volume/100*.42,ctx.currentTime,.08)}
function makeContext(){
  if(ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw new Error('這個瀏覽器不支援 Web Audio');
  ctx=new AC();master=ctx.createGain();sfxBus=ctx.createGain();bgmBus=ctx.createGain();limiter=ctx.createDynamicsCompressor();
  limiter.threshold.value=-8;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.18;
  sfxBus.connect(master);bgmBus.connect(master);master.connect(limiter);limiter.connect(ctx.destination);setGains();
}
async function load(key,url){
  if(buffers.has(key))return buffers.get(key);
  if(loading.has(key))return loading.get(key);
  const promise=(async()=>{const response=await fetch(url);if(!response.ok)throw new Error(`${key} HTTP ${response.status}`);const buffer=await ctx.decodeAudioData(await response.arrayBuffer());buffers.set(key,buffer);loading.delete(key);return buffer})().catch(error=>{loading.delete(key);throw error});
  loading.set(key,promise);return promise;
}
const sfxUrl=(cue,variant)=>`audio-lab-b3/sfx/${cue}-${variant}.ogg`;
const bgmUrl=variant=>`audio-lab-b3/bgm/bgm-${variant}.ogg`;

async function enable(){
  if(enablePromise)return enablePromise;
  enablePromise=(async()=>{
    try{
      makeContext();await ctx.resume();
      const selected=CUES.map(c=>load(`sfx:${c.id}:${cfg.cues[c.id].variant}`,sfxUrl(c.id,cfg.cues[c.id].variant)));
      selected.push(load(`bgm:${cfg.bgm.variant}`,bgmUrl(cfg.bgm.variant)));
      const results=await Promise.allSettled(selected);const ok=results.filter(x=>x.status==='fulfilled').length;
      status(`已啟用音訊，預載 ${ok}/${results.length} 個目前選項`);
      return true;
    }catch(error){status(`無法啟用音訊：${error.message}`);return false}
    finally{enablePromise=null}
  })();
  return enablePromise;
}

function forget(node){active.delete(node);const list=activeByCue.get(node.cue);if(list){list.delete(node);if(!list.size)activeByCue.delete(node.cue)}}
function stopNode(node,fade=.04){
  if(!ctx||node.stopped)return;node.stopped=true;const now=ctx.currentTime;
  try{node.gain.gain.cancelScheduledValues(now);node.gain.gain.setTargetAtTime(.0001,now,Math.max(.005,fade/3));node.source.stop(now+fade)}catch{}
  if(node===chargeSource)chargeSource=null;
}
function stopCue(id){for(const node of activeByCue.get(id)||[])stopNode(node)}
function stopSfx(){for(const node of [...active])stopNode(node,.025);clearTimeout(chargeDelayTimer);chargeDelayTimer=0;chargeDelayReady=false;chargeSource=null;chargeProgress=0;chargeDirection=0;chargeKey=''}

async function emit(id,delay=0,pan=0,preview=false,variantOverride=null){
  const cue=cfg.cues[id];if(!cue||(!cue.on&&!preview))return false;
  if(!ctx||ctx.state!=='running')return false;
  const variant=variantOverride||cue.variant,key=`sfx:${id}:${variant}`;
  let buffer=buffers.get(key);
  if(!buffer){load(key,sfxUrl(id,variant)).catch(error=>status(`載入 ${id.toUpperCase()}-${variant.toUpperCase()} 失敗：${error.message}`));return false}
  const poly=id==='fly'||id==='flip'||id==='srfast';if(!poly)stopCue(id);
  const existing=activeByCue.get(id);if(existing&&existing.size>4)stopNode(existing.values().next().value,.015);
  const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=buffer;source.playbackRate.value=cue.rate;filter.type='lowpass';filter.frequency.value=id==='tear'||id==='flip'?11000:id==='click'?8500:12500;source.connect(filter);filter.connect(gain);
  let end=gain;if(ctx.createStereoPanner&&pan){const p=ctx.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(p);end=p}end.connect(sfxBus);
  const at=ctx.currentTime+Math.max(0,(delay+cue.delay)/1000),volume=(preview?Math.max(cue.volume,28):cue.volume)/100;
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+Math.min(.035,buffer.duration*.12));gain.gain.setValueAtTime(volume,at+Math.max(.04,buffer.duration-.07));gain.gain.linearRampToValueAtTime(.0001,at+buffer.duration);
  const node={source,gain,cue:id,stopped:false};active.add(node);if(!activeByCue.has(id))activeByCue.set(id,new Set());activeByCue.get(id).add(node);source.onended=()=>forget(node);source.start(at);
  return true;
}
function reversedBuffer(buffer){
  if(reversedBuffers.has(buffer))return reversedBuffers.get(buffer);
  const copy=ctx.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
  for(let channel=0;channel<buffer.numberOfChannels;channel++){const input=buffer.getChannelData(channel),output=copy.getChannelData(channel);for(let i=0,j=input.length-1;i<input.length;i++,j--)output[i]=input[j]}
  reversedBuffers.set(buffer,copy);return copy;
}
function shapeCharge(node,progress,direction){
  const cue=cfg.cues.charge,now=ctx.currentTime,p=Math.max(0,Math.min(1,progress));
  const volume=cue.volume/100*(.12+.88*Math.pow(p,.72)),rate=cue.rate*(direction<0?.38+.48*p:.65+.85*p),brightness=500+12500*Math.pow(p,1.45);
  node.gain.gain.setTargetAtTime(volume,now,.025);node.source.playbackRate.setTargetAtTime(rate,now,.025);node.filter.frequency.setTargetAtTime(brightness,now,.035);
}
function startCharge(buffer,key,progress,direction){
  if(chargeSource)stopNode(chargeSource,.035);stopCue('charge');
  const reverse=direction<0,source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),playback=reverse?reversedBuffer(buffer):buffer;
  source.buffer=playback;source.loop=true;filter.type='lowpass';source.connect(filter);filter.connect(gain);gain.connect(sfxBus);
  const node={source,gain,filter,cue:'charge',direction,stopped:false};chargeSource=node;chargeKey=key;active.add(node);if(!activeByCue.has('charge'))activeByCue.set('charge',new Set());activeByCue.get('charge').add(node);source.onended=()=>forget(node);
  gain.gain.setValueAtTime(.0001,ctx.currentTime);filter.frequency.setValueAtTime(500,ctx.currentTime);
  shapeCharge(node,progress,direction);source.start(0,Math.max(0,Math.min(playback.duration-.01,(reverse?1-progress:progress)*playback.duration)));
}
function charge(progress){
  const cue=cfg.cues.charge,p=Math.max(0,Math.min(1,Number(progress)||0)),delta=p-chargeProgress;
  if(delta>.003)chargeDirection=1;else if(delta<-.003)chargeDirection=-1;chargeProgress=p;
  if(p<.015||!cue.on||!ctx||ctx.state!=='running'){if(chargeSource)stopNode(chargeSource,.055);if(p<.015){clearTimeout(chargeDelayTimer);chargeDelayTimer=0;chargeDelayReady=false;chargeProgress=0;chargeDirection=0;chargeKey=''}return}
  if(!chargeSource&&cue.delay>0&&!chargeDelayReady){if(!chargeDelayTimer)chargeDelayTimer=setTimeout(()=>{chargeDelayTimer=0;chargeDelayReady=true;charge(chargeProgress)},cue.delay);return}
  const key=`sfx:charge:${cue.variant}`,buffer=buffers.get(key),direction=chargeDirection||1;
  if(!buffer){if(chargeLoadingKey!==key){chargeLoadingKey=key;load(key,sfxUrl('charge',cue.variant)).then(loaded=>{if(chargeProgress>=.015&&cfg.cues.charge.on&&key===`sfx:charge:${cfg.cues.charge.variant}`)startCharge(loaded,key,chargeProgress,chargeDirection||1)}).catch(error=>status(`載入互動蓄力音效失敗：${error.message}`)).finally(()=>{if(chargeLoadingKey===key)chargeLoadingKey=''})}return}
  if(!chargeSource||chargeSource.direction!==direction||chargeKey!==key)startCharge(buffer,key,p,direction);else shapeCharge(chargeSource,p,direction);
}
function endCharge(){clearTimeout(chargeDelayTimer);chargeDelayTimer=0;chargeDelayReady=false;if(chargeSource)stopNode(chargeSource,.08);chargeSource=null;chargeProgress=0;chargeDirection=0;chargeKey=''}
function chargeDebug(){return {active:!!chargeSource&&!chargeSource.stopped,progress:chargeProgress,direction:chargeDirection,looping:!!chargeSource?.source.loop,rate:chargeSource?.source.playbackRate.value||0,gain:chargeSource?.gain.gain.value||0,frequency:chargeSource?.filter.frequency.value||0}}
window.labAudio={emit,charge,endCharge,debug:chargeDebug};

async function audition(id,variant){
  if(!await enable())return;
  const key=`sfx:${id}:${variant}`;status(`載入並試聽 ${id.toUpperCase()}-${variant.toUpperCase()}…`);
  try{await load(key,sfxUrl(id,variant));await emit(id,0,0,true,variant);status(`正在試聽 ${id.toUpperCase()}-${variant.toUpperCase()}`)}catch(error){status(`試聽失敗：${error.message}`)}
}

function stopBgm(reset=false){
  if(!ctx||!bgmSource){if(reset)bgmOffset=0;return}
  bgmOffset=(ctx.currentTime-bgmStarted+bgmOffset)%Math.max(.001,bgmSource.buffer.duration);
  try{bgmSource.stop()}catch{}bgmSource=null;if(reset)bgmOffset=0;
}
async function playBgm(){
  if(!cfg.bgm.on||document.hidden)return;
  if(!await enable()||bgmSource)return;
  try{
    const key=`bgm:${cfg.bgm.variant}`,buffer=await load(key,bgmUrl(cfg.bgm.variant));
    const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(bgmBus);bgmStarted=ctx.currentTime;source.start(0,bgmOffset%buffer.duration);bgmSource=source;bgmWanted=true;status(`背景音樂播放中：${BGM.find(x=>x.id===cfg.bgm.variant).name}`);
  }catch(error){status(`背景音樂載入失敗：${error.message}`)}
}
function pauseBgm(){bgmWanted=false;stopBgm(false);status('背景音樂已暫停')}
async function changeBgm(variant){stopBgm(true);cfg.bgm.variant=variant;save();if(cfg.bgm.on&&bgmWanted)await playBgm()}
function stopAll(){stopSfx();stopBgm(true);bgmWanted=false;status('所有聲音已停止')}

function replayStateReason(state){
  if(document.getElementById('audio-lab-b3-replay')||document.getElementById('intro-cover'))return '開場目前正在播放';
  if(!state)return '遊戲尚未完成載入';
  if(state.busy||state.auto)return '卡包或翻牌動畫進行中，請等動畫結束';
  if(state.book)return '請先關閉收藏圖鑑';
  if(state.stress)return '效能測試進行中，請先停止測試';
  if(state.state!=='idle')return '請先按「下一包」回到未開包主畫面';
  return '';
}
async function replayIntro(){
  const state=window.labAudioReplayState?.(),reason=replayStateReason(state);
  if(reason){status(`無法重播：${reason}`);return false}
  if(!await enable())return false;
  const main=document.querySelector('main');if(!main){status('無法重播：找不到主畫面');return false}
  stopSfx();
  const cover=document.createElement('button');cover.id='audio-lab-b3-replay';cover.type='button';cover.setAttribute('aria-label','略過開場動畫');cover.innerHTML='<i aria-hidden="true"></i><span>Duel Start.</span>';document.body.append(cover);main.inert=true;
  const backdrop=cover.querySelector('i'),label=cover.querySelector('span'),animations=[];
  animations.push(label.animate([{opacity:0},{opacity:1}],{duration:400,easing:'ease-out',fill:'both'}));
  animations.push(label.animate([{opacity:1},{opacity:0}],{duration:600,delay:1400,easing:'ease-in-out',fill:'forwards'}));
  animations.push(backdrop.animate([{opacity:1},{opacity:0}],{duration:1000,delay:2050,easing:'cubic-bezier(.22,.65,.25,1)',fill:'both'}));
  emit('intro');
  let timer=0,done=false;
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);document.removeEventListener('keydown',key,true);animations.forEach(a=>a.cancel());cover.remove();main.inert=false;replayStop=null;status('開場重播完成，可再次重播')};
  const key=event=>{if(['Escape','Enter',' '].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();finish()}};
  cover.onclick=finish;document.addEventListener('keydown',key,true);replayStop=finish;timer=setTimeout(finish,3200);status('正在重播原 V5.3.4 開場');return true;
}

const style=document.createElement('style');
style.textContent=`
#audio-lab-b3-launch{position:fixed!important;right:12px;bottom:max(48px,env(safe-area-inset-bottom));z-index:9997;max-width:90vw;background:#251b34!important;border:1px solid #c7a66d!important;color:#f4dfb9!important;border-radius:9px!important;padding:10px 14px!important;box-shadow:0 4px 18px #0008!important;font:700 12px system-ui!important}
#audio-lab-b3-panel{position:fixed;z-index:9998;right:12px;bottom:max(92px,calc(env(safe-area-inset-bottom) + 44px));width:min(470px,calc(100vw - 24px));max-height:min(78vh,740px);overflow:auto;background:#15111ff7;color:#e8dfed;border:1px solid #ad8a59;border-radius:12px;padding:13px;font:13px/1.45 system-ui;box-shadow:0 12px 45px #000b;overscroll-behavior:contain;color-scheme:dark;touch-action:pan-y}
#audio-lab-b3-panel[hidden]{display:none!important}#audio-lab-b3-panel *{box-sizing:border-box}#audio-lab-b3-panel button,#audio-lab-b3-panel select{font:12px system-ui!important;background:#30243d!important;border:1px solid #766085!important;color:#f1dfc1!important;border-radius:5px!important;padding:7px!important;min-height:32px!important;cursor:pointer!important;box-shadow:none!important;clip-path:none!important;min-width:0!important}#audio-lab-b3-panel button:after,#audio-lab-b3-panel button:before{display:none!important}
#audio-lab-b3-panel .lab-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:7px 0}#audio-lab-b3-panel .lab-muted{font-size:11px;color:#c1b3cb;line-height:1.55}#audio-lab-b3-panel label{display:flex;align-items:center;gap:5px}#audio-lab-b3-panel input[type=range]{accent-color:#d3b07b;min-width:70px;flex:1;width:110px}#audio-lab-b3-panel input[type=number]{width:65px;background:#21192b;color:#eee;border:1px solid #675574;border-radius:4px;padding:5px}#audio-lab-b3-panel details{border-top:1px solid #493950;padding:8px 0}#audio-lab-b3-panel summary{cursor:pointer;color:#e8d4ae;font-weight:700}#audio-lab-b3-panel .variants{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:8px 0}#audio-lab-b3-panel .variants button{padding:6px 3px!important}#audio-lab-b3-panel .variants button.active{border-color:#f0ca86!important;background:#5a3d70!important;color:#fff3d6!important}#audio-lab-b3-panel textarea{width:100%;height:120px;background:#20182b;color:#e7dded;font:11px monospace}
#audio-lab-b3-replay{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:10002!important;border:0!important;padding:0!important;margin:0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;isolation:isolate;cursor:pointer}#audio-lab-b3-replay i{position:absolute;inset:0;background:#000;pointer-events:none;opacity:1}#audio-lab-b3-replay span{position:absolute;top:50%;left:0;right:0;transform:translateY(-50%);padding:0 16px;text-align:center;color:#e7d7b6;font:500 clamp(24px,3.2vw,36px) Georgia,'Times New Roman',serif;letter-spacing:.16em;text-shadow:0 0 12px rgba(231,215,182,.3);pointer-events:none}
@media(max-width:520px){#audio-lab-b3-panel{right:8px;width:calc(100vw - 16px);bottom:max(84px,calc(env(safe-area-inset-bottom) + 42px));max-height:76vh}#audio-lab-b3-panel .variants{grid-template-columns:repeat(5,1fr)}}`;
document.head.append(style);

const launch=document.createElement('button');launch.id='audio-lab-b3-launch';launch.textContent='♫ AUDIO LAB B3';
const panel=document.createElement('aside');panel.id='audio-lab-b3-panel';panel.hidden=true;panel.setAttribute('aria-label','V5.4 Audio Lab B3 設定');
panel.innerHTML=`
  <div class="lab-line"><strong style="color:#e6c99b;font-size:17px">V5.4 AUDIO LAB B3</strong><button data-act="close" style="margin-left:auto">關閉</button></div>
  <p class="lab-muted">已保存目前暫定設定。蓄力音效會跟著拉動百分比升降，拉住時持續，退回時反向；開場、蓄力、能量擴散各有 10 款候選。收藏與正式站完全分開。</p>
  <div class="lab-line"><button data-act="enable">啟用／恢復音訊</button><button data-act="stop">全部停止</button><button data-act="intro">重播開場</button></div>
  <div class="lab-line"><button data-act="normal">完整流程測試 N 包</button><button data-act="sr">完整流程測試含 SR 包</button></div>
  <div class="lab-line"><label><input type="checkbox" data-master-mute> 靜音</label><span>總音量</span><input data-master type="range" min="0" max="100"><output data-master-out></output></div>
  <section style="border-top:1px solid #7a6345;padding-top:8px"><strong>背景音樂／環境配樂</strong><div class="lab-line"><label><input type="checkbox" data-bgm-on> 啟用</label><select data-bgm-select>${BGM.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div><div class="lab-line"><button data-act="bgm-play">播放／繼續</button><button data-act="bgm-pause">暫停</button><button data-act="bgm-stop">停止並回到開頭</button></div><div class="lab-line"><span>音量</span><input data-bgm-volume type="range" min="0" max="100"><output data-bgm-out></output></div></section>
  <div data-status class="lab-muted" role="status">尚未啟用音訊；瀏覽器要求先由你點一下啟用。</div>
  <div data-rows></div>
  <div class="lab-line"><button data-act="export">顯示／複製設定</button><button data-act="reset">恢復預設</button><a href="./audio-lab-b3/SOURCES.md" target="_blank" rel="noopener" style="color:#e7c99a">來源與授權</a></div><textarea data-export hidden readonly></textarea>`;
document.body.append(launch,panel);statusEl=panel.querySelector('[data-status]');

const rows=panel.querySelector('[data-rows]');
for(const cue of CUES){
  const c=cfg.cues[cue.id],variants=variantsFor(cue),details=document.createElement('details');details.innerHTML=`<summary>${cue.label} <small data-selected style="color:#bda9c8"></small></summary><div class="variants">${variants.map((v,i)=>`<button data-variant="${v}" title="${cue.names[i]}">${v.toUpperCase()}</button>`).join('')}</div><div class="lab-muted" data-name></div><div class="lab-line"><label><input type="checkbox" data-on> 啟用</label><span>音量</span><input data-volume type="range" min="0" max="100"><output data-volume-out></output></div><div class="lab-line"><span>延後</span><input data-delay type="number" min="0" max="1000" step="10"><span>ms</span><span>速度</span><input data-rate type="number" min="0.7" max="1.35" step="0.05"></div>`;
  const selected=details.querySelector('[data-selected]'),name=details.querySelector('[data-name]'),buttons=[...details.querySelectorAll('[data-variant]')],on=details.querySelector('[data-on]'),volume=details.querySelector('[data-volume]'),volumeOut=details.querySelector('[data-volume-out]'),delay=details.querySelector('[data-delay]'),rate=details.querySelector('[data-rate]');
  const render=()=>{buttons.forEach(b=>b.classList.toggle('active',b.dataset.variant===c.variant));const i=variants.indexOf(c.variant);selected.textContent=`${c.variant.toUpperCase()} · ${cue.names[i]}`;name.textContent=`點 A–${variants.at(-1).toUpperCase()} 可立即切換並試聽：${cue.names.join('／')}`;on.checked=c.on;volume.value=c.volume;volumeOut.textContent=c.volume+'%';delay.value=c.delay;rate.value=c.rate};
  buttons.forEach(button=>button.onclick=async()=>{c.variant=button.dataset.variant;save();render();await audition(cue.id,c.variant)});on.onchange=()=>{c.on=on.checked;save()};volume.oninput=()=>{c.volume=Number(volume.value);volumeOut.textContent=c.volume+'%';save()};delay.onchange=()=>{c.delay=number(delay.value,0,1000,0);delay.value=c.delay;save()};rate.onchange=()=>{c.rate=number(rate.value,.7,1.35,1);rate.value=c.rate;save()};render();rows.append(details);
}

const masterInput=panel.querySelector('[data-master]'),masterOut=panel.querySelector('[data-master-out]'),masterMute=panel.querySelector('[data-master-mute]'),bgmOn=panel.querySelector('[data-bgm-on]'),bgmSelect=panel.querySelector('[data-bgm-select]'),bgmVolume=panel.querySelector('[data-bgm-volume]'),bgmOut=panel.querySelector('[data-bgm-out]'),exportBox=panel.querySelector('[data-export]');
function renderGlobal(){masterInput.value=cfg.master;masterOut.textContent=cfg.master+'%';masterMute.checked=cfg.muted;bgmOn.checked=cfg.bgm.on;bgmSelect.value=cfg.bgm.variant;bgmVolume.value=cfg.bgm.volume;bgmOut.textContent=cfg.bgm.volume+'%';setGains()}
function updateExport(){if(!exportBox)return;exportBox.value=JSON.stringify({version:'V5.4 Audio Lab B3',productionBase:{commit:'38f10f07d65b789524034436f13224eb15d68d05',indexBlob:'377b890b38c4e6610eb1adbe941a7108710f484b'},settings:cfg},null,2)}
renderGlobal();updateExport();

launch.onclick=()=>{panel.hidden=!panel.hidden};panel.querySelector('[data-act=close]').onclick=()=>{panel.hidden=true};panel.querySelector('[data-act=enable]').onclick=async()=>{if(await enable()&&bgmWanted&&cfg.bgm.on)await playBgm()};panel.querySelector('[data-act=stop]').onclick=stopAll;
panel.querySelector('[data-act=intro]').onclick=async()=>{if(await replayIntro())panel.hidden=true};
for(const mode of ['normal','sr'])panel.querySelector(`[data-act=${mode}]`).onclick=async()=>{const state=window.labAudioReplayState?.(),reason=replayStateReason(state);if(reason){status(`無法開始：${reason}`);return}if(await enable()){panel.hidden=true;const ok=await window.labAudioPack?.(mode);if(!ok){panel.hidden=false;status('無法開始：遊戲狀態已改變')}}};
panel.querySelector('[data-act=bgm-play]').onclick=async()=>{cfg.bgm.on=true;bgmOn.checked=true;bgmWanted=true;save();await playBgm()};panel.querySelector('[data-act=bgm-pause]').onclick=pauseBgm;panel.querySelector('[data-act=bgm-stop]').onclick=()=>{bgmWanted=false;stopBgm(true);status('背景音樂已停止並回到開頭')};
masterInput.oninput=()=>{cfg.master=Number(masterInput.value);masterOut.textContent=cfg.master+'%';setGains();save()};masterMute.onchange=()=>{cfg.muted=masterMute.checked;setGains();save()};bgmOn.onchange=async()=>{cfg.bgm.on=bgmOn.checked;bgmWanted=cfg.bgm.on;save();if(cfg.bgm.on)await playBgm();else stopBgm(true)};bgmSelect.onchange=()=>changeBgm(bgmSelect.value);bgmVolume.oninput=()=>{cfg.bgm.volume=Number(bgmVolume.value);bgmOut.textContent=cfg.bgm.volume+'%';setGains();save()};
panel.querySelector('[data-act=export]').onclick=async()=>{updateExport();exportBox.hidden=false;exportBox.select();try{await navigator.clipboard.writeText(exportBox.value);status('設定已顯示並複製到剪貼簿')}catch{status('設定已顯示；此網址不允許自動複製，請手動複製')}};
panel.querySelector('[data-act=reset]').onclick=()=>{if(!confirm('恢復 Audio Lab B3 預設設定？正式收藏不會受影響。'))return;cfg=defaults();save();location.reload()};

document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.closest('#audio-lab-b3-panel')||button===launch||button.id==='intro-cover'||button.id==='audio-lab-b3-replay'||button.closest('.slot')||button.id==='pack')return;emit('click')},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSfx();if(replayStop)replayStop();if(bgmSource){hiddenPause=true;stopBgm(false)}}else if(hiddenPause&&cfg.bgm.on){hiddenPause=false;bgmWanted=true;playBgm()}});
window.addEventListener('pagehide',()=>{stopSfx();stopBgm(false)});
})();
