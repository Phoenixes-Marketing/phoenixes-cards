(()=>{
'use strict';
const D=[
['intro','Duel Start.（重播開場）',38,2.8,['echo','swoosh','bell']],
['click','按鈕點擊',18,.22,['click-a','click-b','bell']],
['charge','拖曳／開包蓄力',30,1.4,['riser','echo','quiet-whoosh']],
['tear','卡包撕開',48,.85,['pack-a','pack-b','take-a']],
['burst','能量擴散',43,1.65,['swoosh','echo','riser']],
['fly','卡牌飛出（每張）',29,.55,['quiet-whoosh','take-a','take-b']],
['flip','N 卡翻面',36,.6,['slide-a','slide-b','take-b']],
['srcharge','SR 登場蓄力',32,.9,['echo','riser','swoosh']],
['sr','SR 正面揭曉',48,2.2,['bell','swoosh','echo']],
['srfast','全部揭曉中的 SR',32,.6,['bell','slide-a','slide-b']],
['inspect','卡片檢視／返回',25,.7,['quiet-whoosh','swoosh','take-a']],
['book','圖鑑開關',23,.7,['quiet-whoosh','swoosh','click-b']],
['next','下一包',29,.85,['take-a','take-b','quiet-whoosh']]
];
const names={'pack-a':'Kenney 卡包 A','pack-b':'Kenney 卡包 B','slide-a':'Kenney 紙牌 A','slide-b':'Kenney 紙牌 B','take-a':'Kenney 取卡 A','take-b':'Kenney 取卡 B','click-a':'Kenney 介面 A','click-b':'Kenney 介面 B','swoosh':'Halgrimm 空間掠過','echo':'DylanTheFish 弦樂共鳴','quiet-whoosh':'Sadiquecat 輕柔掠過','bell':'LegitCheese 柔和鐘聲','riser':'syntheffects 漸強氣流'};
const defaults=()=>({master:55,muted:false,cues:Object.fromEntries(D.map(d=>[d[0],{on:true,volume:d[2],variant:d[4][0],delay:0,rate:1}]))});
let cfg=defaults();const key='phoenixes-audio-lab-config-v1';const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x){cfg.master=clamp(x.master,0,100,55);cfg.muted=!!x.muted;for(const d of D){const c=x.cues?.[d[0]];if(!c)continue;cfg.cues[d[0]]={on:c.on!==false,volume:clamp(c.volume,0,100,d[2]),variant:d[4].includes(c.variant)?c.variant:d[4][0],delay:clamp(c.delay,0,500,0),rate:clamp(c.rate,.65,1.5,1)}}}}catch(e){}
const save=()=>{try{localStorage.setItem(key,JSON.stringify(cfg))}catch(e){}};
let ctx,master,limiter,loading,ready=false,statusEl,chargeActive=false,replayStop=null,active=new Set(),buffers=new Map();const say=t=>{if(statusEl)statusEl.textContent=t};
function setMaster(){if(master)master.gain.setTargetAtTime(cfg.muted?0:cfg.master/100*.7,ctx.currentTime,.025)}
async function enable(){
if(loading)return loading;
try{if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('不支援 Web Audio');ctx=new AC();master=ctx.createGain();limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=4;master.connect(limiter);limiter.connect(ctx.destination);setMaster()}
await ctx.resume();if(ctx.state!=='running')throw Error('瀏覽器尚未允許播放');
if(ready){say('音效已啟用，可以抽卡');return true}
say('正在載入音效…');
loading=(async()=>{const results=await Promise.allSettled(Object.keys(names).map(async id=>{const u=new URL('audio-lab/sfx/'+id+'.ogg',document.baseURI);const r=await fetch(u);if(!r.ok)throw Error(id+' HTTP '+r.status);const b=await ctx.decodeAudioData(await r.arrayBuffer());buffers.set(id,b)}));ready=buffers.size>0;say('已載入 '+buffers.size+'/'+results.length+' 個音效'+(ready?'，可以抽卡':'；請換用 Chrome 或 Edge'));return ready})();
return await loading;
}catch(e){say('啟用失敗：'+e.message);return false}finally{loading=null}
}
function stopVoice(v){try{v.g.gain.cancelScheduledValues(ctx.currentTime);v.g.gain.setTargetAtTime(.0001,ctx.currentTime,.012);v.src.stop(ctx.currentTime+.04)}catch(e){}}
function stopAll(){for(const v of active)stopVoice(v);active.clear();chargeActive=false}
function emit(id,baseDelay=0,pan=0,preview=false){
try{if(!ready||!ctx||ctx.state!=='running'||document.hidden||cfg.muted)return;
const d=D.find(x=>x[0]===id),c=cfg.cues[id];if(!d||!c||(!c.on&&!preview)||!c.volume)return;
const b=buffers.get(c.variant);if(!b){say('缺少音效 '+names[c.variant]);return}
while(active.size>=10){const v=active.values().next().value;stopVoice(v);active.delete(v)}
const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=b;src.playbackRate.value=c.rate;src.connect(g);let p=null;if(ctx.createStereoPanner&&pan){p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(master)}else g.connect(master);
const t=ctx.currentTime+Math.max(0,baseDelay+c.delay)/1000;const len=Math.min(b.duration/c.rate,d[3]);const v={src,g,p,id};active.add(v);src.onended=()=>{active.delete(v);try{src.disconnect();g.disconnect();p?.disconnect()}catch(e){}};
const gain=c.volume/100*.70;const fade=Math.min(.13,len*.30);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,gain),t+Math.min(.018,len*.15));g.gain.setValueAtTime(Math.max(.0001,gain),t+Math.max(.02,len-fade));g.gain.linearRampToValueAtTime(.0001,t+len);src.start(t);src.stop(t+len+.01);
}catch(e){say('音效播放失敗：'+e.message)}
}
function endCharge(){for(const v of active)if(v.id==='charge')stopVoice(v);chargeActive=false}
function charge(p){if(p>.035&&!chargeActive){chargeActive=true;emit('charge')}else if(p<=.005&&chargeActive)endCharge()}
window.labAudio={emit,charge,endCharge};
function replay(){
if(document.getElementById('intro-cover')||!window.labAudioCanReplay?.()){say('請在未開包的主畫面重播開場');return}
const main=document.querySelector('main');if(!main)return;stopAll();const cover=document.createElement('button');cover.id='audio-lab-replay';cover.type='button';cover.setAttribute('aria-label','略過測試開場');cover.innerHTML='<i></i><span>Duel Start.</span>';document.body.append(cover);main.inert=true;
const bg=cover.querySelector('i'),label=cover.querySelector('span');label.animate([{opacity:0},{opacity:1,offset:.125},{opacity:1,offset:.4375},{opacity:0,offset:.625},{opacity:0}],{duration:3200,fill:'both',easing:'linear'});bg.animate([{opacity:1},{opacity:0}],{duration:1000,delay:2050,fill:'both',easing:'cubic-bezier(.22,.65,.25,1)'});emit('intro');
let timer=0;const done=()=>{clearTimeout(timer);document.removeEventListener('keydown',skip,true);cover.remove();main.inert=false;replayStop=null};const skip=e=>{if(['Escape','Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();stopAll();done()}};cover.onclick=()=>{stopAll();done()};document.addEventListener('keydown',skip,true);replayStop=done;timer=setTimeout(done,3200);
}
function build(){
const style=document.createElement('style');style.textContent='#audio-lab-launch{position:fixed!important;right:12px;bottom:48px;z-index:9997;max-width:90vw;background:#261d36!important;border:1px solid #c4a16b!important;color:#f4dfb9!important;border-radius:9px!important;padding:10px 14px!important;box-shadow:0 4px 18px #0008!important;font:600 12px system-ui!important}#audio-lab-panel{position:fixed;z-index:9998;right:12px;bottom:92px;width:min(440px,calc(100vw - 24px));max-height:min(76vh,680px);overflow:auto;background:#15111ff5;color:#e8dfed;border:1px solid #ad8a59;border-radius:12px;padding:13px;font:13px system-ui;box-shadow:0 12px 45px #000b;overscroll-behavior:contain;color-scheme:dark;touch-action:pan-y}#audio-lab-panel[hidden]{display:none!important}#audio-lab-panel *{box-sizing:border-box}#audio-lab-panel button,#audio-lab-panel select{font:12px system-ui!important;background:#30243d!important;border:1px solid #766085!important;color:#f1dfc1!important;border-radius:5px!important;padding:7px!important;min-height:30px!important;cursor:pointer!important;box-shadow:none!important;clip-path:none!important;min-width:0!important}#audio-lab-panel button:after,#audio-lab-panel button:before{display:none!important}#audio-lab-panel .lab-row{border-top:1px solid #493950;padding:10px 0;display:grid;gap:6px}#audio-lab-panel .lab-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap}#audio-lab-panel input[type=range]{accent-color:#d3b07b;min-width:55px;flex:1;width:100px}#audio-lab-panel .lab-muted{font-size:11px;color:#c1b3cb;line-height:1.55}#audio-lab-panel label{display:flex;align-items:center;gap:5px}#audio-lab-panel textarea{width:100%;height:100px;background:#20182b;color:#e7dded;font:11px monospace}#audio-lab-replay{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:10002!important;border:0!important;padding:0!important;margin:0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;isolation:isolate;cursor:pointer}#audio-lab-replay i{position:absolute;inset:0;background:#000;pointer-events:none}#audio-lab-replay span{position:absolute;top:50%;left:0;right:0;transform:translateY(-50%);text-align:center;color:#e7d7b6;font:500 clamp(24px,3.2vw,36px) Georgia,serif;letter-spacing:.16em;text-shadow:0 0 12px #e7d7b64d;pointer-events:none}';
document.head.append(style);
const launch=document.createElement('button');launch.id='audio-lab-launch';launch.textContent='♫ AUDIO LAB · 測試版';const panel=document.createElement('aside');panel.id='audio-lab-panel';panel.hidden=true;panel.setAttribute('aria-label','Audio Lab 音效設定');panel.innerHTML='<div class="lab-line"><strong style="color:#e6c99b;font-size:17px">V5.4 AUDIO LAB</strong><button data-act="close" style="margin-left:auto">關閉</button></div><p class="lab-muted">獨立收藏 · CC0 音效 · 不影響正式版。先啟用音效，等載入完成後關閉面板抽卡。設定自動保存在此測試頁。</p><div class="lab-line"><button data-act="enable">啟用／恢復音效</button><button data-act="stop">停止聲音</button><button data-act="intro">重播開場</button></div><div class="lab-line"><button data-act="normal">測試 N 包</button><button data-act="sr">測試含 SR 包</button><span class="lab-muted">SR 請逐張點擊揭曉</span></div><div class="lab-line"><label><input type="checkbox" data-master-mute> 靜音</label><span>總音量</span><input data-master type="range" min="0" max="100"><output data-master-out></output></div><div data-status class="lab-muted" role="status">尚未啟用音效</div><div data-rows></div><div class="lab-line"><button data-act="export">匯出設定</button><button data-act="reset">恢復預設</button><a href="./audio-lab/SOURCES.md" target="_blank" rel="noopener" style="color:#e7c99a">音效來源</a></div><textarea data-export hidden readonly></textarea>';document.body.append(launch,panel);statusEl=panel.querySelector('[data-status]');
const masterInput=panel.querySelector('[data-master]'),mute=panel.querySelector('[data-master-mute]'),masterOut=panel.querySelector('[data-master-out]'),rows=panel.querySelector('[data-rows]');
function render(){masterInput.value=cfg.master;masterOut.textContent=cfg.master+'%';mute.checked=cfg.muted;rows.innerHTML='';
for(const d of D){const c=cfg.cues[d[0]],row=document.createElement('div');row.className='lab-row';row.innerHTML='<div class="lab-line"><label><input data-on type="checkbox"> <strong>'+d[1]+'</strong></label><button data-preview style="margin-left:auto">試聽</button></div><select data-variant aria-label="'+d[1]+' 素材">'+d[4].map(v=>'<option value="'+v+'">'+names[v]+'</option>').join('')+'</select><div class="lab-line"><span>音量</span><input data-volume type="range" min="0" max="100"><output data-v></output></div><div class="lab-line"><span>延後</span><input data-delay type="range" min="0" max="500" step="25"><output data-d></output><span>速度</span><select data-rate>'+[.65,.8,.9,1,1.1,1.25,1.5].map(v=>'<option value="'+v+'">'+v+'×</option>').join('')+'</select></div>';
const get=s=>row.querySelector(s);get('[data-on]').checked=c.on;get('[data-variant]').value=c.variant;get('[data-volume]').value=c.volume;get('[data-v]').textContent=c.volume+'%';get('[data-delay]').value=c.delay;get('[data-d]').textContent=c.delay+' ms';get('[data-rate]').value=c.rate;
get('[data-on]').onchange=e=>{c.on=e.target.checked;save()};get('[data-variant]').onchange=e=>{c.variant=e.target.value;save()};get('[data-volume]').oninput=e=>{c.volume=+e.target.value;get('[data-v]').textContent=c.volume+'%';save()};get('[data-delay]').oninput=e=>{c.delay=+e.target.value;get('[data-d]').textContent=c.delay+' ms';save()};get('[data-rate]').onchange=e=>{c.rate=+e.target.value;save()};get('[data-preview]').onclick=async()=>{if(await enable()){stopAll();emit(d[0],0,0,true);say('試聽 '+d[1]+'：'+names[c.variant])}};rows.append(row);
}}
render();masterInput.oninput=e=>{cfg.master=+e.target.value;masterOut.textContent=cfg.master+'%';setMaster();save()};mute.onchange=e=>{cfg.muted=e.target.checked;setMaster();if(cfg.muted)stopAll();save()};launch.onclick=()=>panel.hidden=!panel.hidden;panel.querySelector('[data-act=close]').onclick=()=>panel.hidden=true;
panel.querySelector('[data-act=enable]').onclick=enable;panel.querySelector('[data-act=stop]').onclick=()=>{stopAll();say('聲音已停止')};
panel.querySelector('[data-act=intro]').onclick=async()=>{if(await enable()){panel.hidden=true;replay()}};
for(const mode of ['normal','sr'])panel.querySelector('[data-act='+mode+']').onclick=async()=>{if(await enable()){panel.hidden=true;window.labAudioPack?.(mode)}};
panel.querySelector('[data-act=reset]').onclick=()=>{stopAll();cfg=defaults();setMaster();render();save();say('已恢復預設')};
panel.querySelector('[data-act=export]').onclick=async()=>{const t=panel.querySelector('[data-export]');t.hidden=false;t.value=JSON.stringify(cfg,null,2);t.select();try{await navigator.clipboard.writeText(t.value);say('設定已複製')}catch(e){say('請手動複製設定')}};document.addEventListener('click',e=>{const b=e.target.closest?.('main button');if(b&&!b.disabled&&!b.classList.contains('tile'))emit('click')},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAll();if(replayStop)replayStop()}});
})();