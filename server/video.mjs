import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {makePlan} from './content.mjs';
export const VOICES={'zh-CN-XiaoxiaoNeural':'晓晓 · 中文女声','zh-CN-YunxiNeural':'云希 · 中文男声'};
export const RATES={normal:'+0%',slow:'-15%',fast:'+15%'};
export function command(job,cmd,args,{cwd,timeout=600000,onLine=()=>{}}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(cmd,args,{cwd,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});job.child=child;
  let tail='',pending='';let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;killProcess(child);},timeout);
  const output=buffer=>{const s=buffer.toString();tail=(tail+s).slice(-7000);pending+=s;const lines=pending.split(/[\r\n]/);pending=lines.pop();for(const line of lines)onLine(line);};
  child.stdout.on('data',output);child.stderr.on('data',output);
  child.on('error',e=>{clearTimeout(timer);job.child=null;reject(new Error(`无法启动 ${cmd}：${e.message}`));});
  child.on('close',code=>{clearTimeout(timer);job.child=null;if(code===0&&!timedOut)resolve(tail);else reject(new Error(timedOut?`${cmd} 执行超时，请重试。`:`${cmd} 执行失败（${code}）：${tail.slice(-2400)}`));});
 });
}
export function killProcess(child){if(!child)return;try{if(process.platform==='win32')child.kill('SIGKILL');else process.kill(-child.pid,'SIGKILL');}catch{}}
export async function renderVideo(job,root,update,jobsDir=join(root,'.mollystudio/jobs')){
 const folder=join(jobsDir,job.id);job.folder=folder;
 await mkdir(join(folder,'public/audio'),{recursive:true});await mkdir(join(folder,'src/data'),{recursive:true});
 const {manifest,plan}=makePlan(job.script,job.topic);
 await writeFile(join(folder,'article.md'),job.script);
 await writeFile(join(folder,'public/audio/manifest.json'),JSON.stringify(manifest,null,2));
 await writeFile(join(folder,'src/data/shot-plan.json'),JSON.stringify(plan,null,2));
 update({stage:'audio',progress:8,message:`正在配音，0 / ${manifest.length} 句`});
 await command(job,process.execPath,[join(root,'scripts/generate-audio.mjs'),'article.md',job.voice,RATES[job.rate]],{cwd:folder,timeout:600000,onLine:line=>{const m=line.match(/^(\d+)\/(\d+)/);if(m)update({progress:8+Math.round(Number(m[1])/Number(m[2])*30),message:`正在配音，${m[1]} / ${m[2]} 句`});}});
 if(job.status==='cancelled')return;
 update({stage:'timing',progress:40,message:'测量音频，生成字幕和分镜时间轴'});
 await command(job,'python3',[join(root,'scripts/build-data.py')],{cwd:folder,timeout:120000});
 const fullPlan=JSON.parse(await readFile(join(folder,'src/data/shots.json'),'utf8'));const captions=JSON.parse(await readFile(join(folder,'src/data/captions.json'),'utf8'));
 const frames=fullPlan.shots.reduce((n,s)=>n+s.durationFrames,0);
 const props={plan:fullPlan,captions};await writeFile(join(folder,'props.json'),JSON.stringify(props));
 const stamp=ms=>{const n=Math.round(ms);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')},${String(n%1000).padStart(3,'0')}`;};
 await writeFile(join(folder,'subtitles.srt'),captions.map((c,i)=>`${i+1}\n${stamp(c.startMs)} --> ${stamp(c.endMs)}\n${c.text}`).join('\n\n'));
 if(job.status==='cancelled')return;
 update({stage:'render',progress:45,message:'正在使用 Wordmotion 渲染视频',duration:frames/30,shotCount:fullPlan.shots.length});
 await command(job,process.execPath,[join(root,'node_modules/@remotion/cli/remotion-cli.js'),'render',join(root,'src/index.ts'),'Wordmotion',join(folder,'final.mp4'),'--props',join(folder,'props.json'),'--public-dir',join(folder,'public'),'--codec=h264','--crf=20','--concurrency=4'],{cwd:root,timeout:1800000,onLine:line=>{const m=line.match(/Rendered\s+(\d+)\/(\d+)/);if(m){const progress=45+Math.floor(Number(m[1])/Number(m[2])*47);if(progress!==job.progress)update({progress,message:`正在渲染画面 ${m[1]} / ${m[2]}`});}if(/Encoded/.test(line)&&job.progress>=92)update({progress:95,message:'正在编码 MP4'});}});
 if(job.status==='cancelled')return;
 update({stage:'verify',progress:97,message:'正在校验视频与音轨'});
 const info=JSON.parse(await command(job,'ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',join(folder,'final.mp4')],{cwd:root,timeout:30000}));
 if(!info.streams.some(s=>s.codec_type==='audio')||!info.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920))throw Error('导出校验失败：未检测到正确的视频或音轨。');
 await command(job,'ffmpeg',['-v','error','-y','-ss','0.8','-i',join(folder,'final.mp4'),'-vf','scale=540:-1','-frames:v','1','-update','1',join(folder,'poster.jpg')],{cwd:root,timeout:30000});
 const file=await stat(join(folder,'final.mp4'));
 update({status:'completed',stage:'completed',progress:100,message:'视频已生成，可以预览和下载',duration:Number(info.format.duration),size:file.size,videoUrl:`/api/jobs/${job.id}/video`,posterUrl:`/api/jobs/${job.id}/poster`,subtitlesUrl:`/api/jobs/${job.id}/subtitles`});
}
