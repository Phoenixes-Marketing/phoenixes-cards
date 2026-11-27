(()=>{
const key='phoenixes-intro-prototype-seen';
const params=new URLSearchParams(location.search);
let seen=false;try{seen=localStorage.getItem(key)==='1'}catch{}
const full=params.get('intro')==='full'||(!seen&&params.get('intro')!=='short');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const main=document.querySelector('main');main.inert=true;
const cover=document.createElement('button');cover.id='intro-cover';cover.setAttribute('aria-label','略過開場動畫');cover.innerHTML='<span>點一下略過</span>';document.body.append(cover);
const animations=[];let ended=false,timer;
function finish(){if(ended)return;ended=true;clearTimeout(timer);animations.forEach(a=>a.cancel());document.documentElement.classList.remove('intro-loading');cover.remove();main.inert=false;try{localStorage.setItem(key,'1')}catch{}window.introDone=true;}
cover.addEventListener('click',finish);document.addEventListener('keydown',e=>{if(!ended&&['Escape','Enter',' '].includes(e.key)){e.preventDefault();finish()}});
function animate(selector,frames,duration,delay=0){document.querySelectorAll(selector).forEach(el=>animations.push(el.animate(frames,{duration,delay,easing:'cubic-bezier(.22,.65,.25,1)',fill:'both'})))}
async function play(){
 const assets=['./assets/vfx-purple/background.webp','./assets/pack-v39/pack-front.webp','./assets/ui/phoenixes-logo.webp'].map(src=>{const img=new Image();img.src=src;return img.decode().catch(()=>{})});
 await Promise.race([Promise.all(assets),new Promise(r=>setTimeout(r,5000))]);if(ended)return;
 document.documentElement.classList.remove('intro-loading');
 if(reduced||!full){cover.firstChild.hidden=true;animate('#intro-cover',[{backgroundColor:'#080510'},{backgroundColor:'transparent'}],reduced?150:400);timer=setTimeout(finish,reduced?150:400);return;}
 animate('#intro-cover',[{backgroundColor:'#080510'},{backgroundColor:'rgba(8,5,16,.65)',offset:.28},{backgroundColor:'transparent'}],2300);
 animate('.idle-sigil',[{opacity:0},{opacity:1}],1000,150);
 animate('#zone,#packRear',[{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],1200,550);
 animate('main>header,main>footer:not(#status),.actions',[{opacity:0},{opacity:1}],650,1650);
 timer=setTimeout(finish,2300);
}
play();
})();
