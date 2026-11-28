const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || (ffmpeg === 'ffmpeg' ? 'ffprobe' : path.join(path.dirname(ffmpeg), 'ffprobe.exe'));
const files = ['sfx','bgm'].flatMap(folder=>fs.readdirSync(path.join(root,'audio-lab-b3',folder)).filter(name=>name.endsWith('.ogg')).map(name=>path.join(root,'audio-lab-b3',folder,name)));

function run(command,args){
  const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:16*1024*1024});
  if(result.status!==0)throw new Error(`${path.basename(command)} failed for ${args.at(-1)}\n${result.stderr}`);
  return `${result.stdout||''}\n${result.stderr||''}`;
}
function lastNumber(text,regex,fallback=null){const values=[...text.matchAll(regex)].map(match=>Number(match[1])).filter(Number.isFinite);return values.length?values.at(-1):fallback}
function round(value,digits=2){return Number.isFinite(value)?Number(value.toFixed(digits)):null}

const analysis=[];
for(const file of files.sort()){
  const probe=JSON.parse(run(ffprobe,['-v','error','-show_entries','format=duration:stream=sample_rate,channels','-of','json',file]));
  const duration=Number(probe.format.duration),stream=probe.streams[0]||{};
  const loud=run(ffmpeg,['-hide_banner','-nostats','-i',file,'-af','ebur128=peak=true','-f','null','NUL']);
  const volume=run(ffmpeg,['-hide_banner','-nostats','-i',file,'-af','volumedetect','-f','null','NUL']);
  const spectral=run(ffmpeg,['-hide_banner','-nostats','-i',file,'-af','silencedetect=noise=-55dB:d=0.005,aspectralstats=measure=centroid,ametadata=print:key=lavfi.aspectralstats.1.centroid','-f','null','NUL']);
  const centroids=[...spectral.matchAll(/lavfi\.aspectralstats\.1\.centroid=([\d.]+)/g)].map(match=>Number(match[1])).filter(value=>value>20);
  const starts=[...spectral.matchAll(/silence_start: ([\d.]+)/g)].map(match=>Number(match[1]));
  const ends=[...spectral.matchAll(/silence_end: ([\d.]+)/g)].map(match=>Number(match[1]));
  const leading=starts[0]===0&&ends.length?ends[0]:0;
  const lastStart=starts.at(-1);const trailing=Number.isFinite(lastStart)&&lastStart>duration*.5?Math.max(0,duration-lastStart):0;
  const bytes=fs.readFileSync(file);
  analysis.push({
    file:path.relative(root,file).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    durationSeconds:round(duration,3),sampleRate:Number(stream.sample_rate),channels:stream.channels,
    integratedLufs:round(lastNumber(loud,/Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS/g),1),meanVolumeDb:round(lastNumber(volume,/mean_volume: (-?[\d.]+) dB/g),1),maxVolumeDb:round(lastNumber(volume,/max_volume: (-?[\d.]+) dB/g),1),truePeakDbfs:round(lastNumber(loud,/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/g),1),
    spectralCentroidHz:round(centroids.reduce((sum,value)=>sum+value,0)/Math.max(1,centroids.length),0),
    leadingSilenceMs:round(leading*1000,0),trailingSilenceMs:round(trailing*1000,0)
  });
}
const report={generatedAt:new Date().toISOString(),method:{sfx:'FFmpeg silenceremove, EBU R128 loudnorm target -18 LUFS, limiter ceiling -2 dBFS, Vorbis q5',bgm:'FFmpeg EBU R128 loudnorm target -24 LUFS, limiter ceiling -2 dBFS, Vorbis q5',analysis:'ffprobe duration/sample format; FFmpeg ebur128 true peak; volumedetect mean/max; aspectralstats centroid; silencedetect onset/trailing silence. EBU integrated LUFS is reported as -70 for clips shorter than its measurement gate; use meanVolumeDb and truePeakDbfs for those short clips.'},counts:{sfx:analysis.filter(x=>x.file.includes('/sfx/')).length,bgm:analysis.filter(x=>x.file.includes('/bgm/')).length},files:analysis};
fs.writeFileSync(path.join(root,'audio-lab-b3','ANALYSIS.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Analyzed ${analysis.length} audio files`);
