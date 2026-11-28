const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'index.html');
const target = path.join(root, 'audio-lab-b3.html');
let html = fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
const gitBlob = crypto.createHash('sha1').update(`blob ${Buffer.byteLength(html)}\0`).update(html).digest('hex');
if (gitBlob !== '377b890b38c4e6610eb1adbe941a7108710f484b') {
  throw new Error(`Refusing to build from unexpected production index blob ${gitBlob}`);
}

const once = (from, to) => {
  const count = html.split(from).length - 1;
  if (count !== 1) throw new Error(`Expected one match, got ${count}: ${from.slice(0, 80)}`);
  html = html.replace(from, to);
};

once('<title>Draw! Duel Start. — Phoenixes: Internal Edition</title>', '<title>V5.4 Audio Lab B3 — Draw! Duel Start.</title><meta name="robots" content="noindex,nofollow"><script defer src="./audio-lab-b3/lab-b3.js"></script>');
html = html.replaceAll('phoenixes-round', 'phoenixes-audio-lab-b3-round');
html = html.replaceAll('phoenixes-portable', 'phoenixes-audio-lab-b3-portable');

once("async function opening(mode='random',fromGesture=false){\n  if(busy||auto||book)return;", "async function opening(mode='random',fromGesture=false){\n  if(busy||auto||book)return;\n  if(mode==='random'&&window.labAudioNextMode){mode=window.labAudioNextMode;window.labAudioNextMode=null;preparedPack=null}");
once("if(reducePackMotion.matches){opening();return}", "if(reducePackMotion.matches){await opening();return}");
once("const flights=[...hand.children].map((slot,i)=>v5Flight(slot,i,hand.children.length));", "const flights=[...hand.children].map((slot,i)=>{window.labAudio?.emit('fly',160+i*150,(i-1.5)*.25);return v5Flight(slot,i,hand.children.length)});");
once("stage.classList.add('tear',...(fromGesture?['gesture-commit']:[]));", "stage.classList.add('tear',...(fromGesture?['gesture-commit']:[]));window.labAudio?.endCharge();window.labAudio?.emit('tear');window.labAudio?.emit('burst',80);");
once("function setPackProgress(value){packProgress=Math.max(0,Math.min(1,value));", "function setPackProgress(value){packProgress=Math.max(0,Math.min(1,value));window.labAudio?.charge(packProgress);");
once("async function arrival(){\n  busy=true;", "async function arrival(){\n  window.labAudio?.emit('next');busy=true;");
once("async function summon(c,slot){", "async function summon(c,slot){window.labAudio?.emit('srcharge');");
once("burst(true);hero.classList.add('open');scene.classList.add('hold');", "burst(true);window.labAudio?.emit('sr');hero.classList.add('open');scene.classList.add('hold');");
once("async function preview(c){", "async function preview(c){window.labAudio?.emit('inspect');");
once("function close(){if(!resume)return;", "function close(){if(!resume)return;window.labAudio?.emit('inspect');");
once("async function ordinary(i,fast){\n  const slot=hand.children[i],duration=fast?420:550;", "async function ordinary(i,fast){\n  const slot=hand.children[i],duration=fast?420:550;window.labAudio?.emit(draw[i].rank==='SR'?'srfast':'flip');");
once("q('book').onclick=()=>{if(book||busy)return;", "q('book').onclick=()=>{if(book||busy)return;window.labAudio?.emit('book');");
once("q('back').onclick=()=>{const panel=q('collection');", "q('back').onclick=()=>{const panel=q('collection');window.labAudio?.emit('book');");

const oldControls = "q('test').onclick=async()=>{await opening('sr');await revealAll()};q('normal').onclick=async()=>{await opening('normal');await revealAll()};q('next').onclick=arrival;";
const newControls = "async function labForcedPack(mode,reveal=false){if(busy||auto||book||stress||state!=='idle')return false;window.labAudioNextMode=mode;await buttonOpening();if(reveal)await revealAll();return true}q('test').onclick=()=>labForcedPack('sr',true);q('normal').onclick=()=>labForcedPack('normal',true);q('next').onclick=arrival;window.labAudioPack=mode=>labForcedPack(mode,false);window.labAudioReplayState=()=>({ok:!busy&&!auto&&!book&&!stress&&state==='idle',busy,auto,book,stress,state});";
once(oldControls, newControls);

fs.writeFileSync(target, html);
console.log(`Built ${path.basename(target)} from production blob ${gitBlob}`);
