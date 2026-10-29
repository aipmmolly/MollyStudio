// Real integrations: requires running server, a usable LLM Key, and Edge TTS access.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const base=process.env.TEST_BASE_URL||'http://localhost:3210';
const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();assert.ok(r.ok,j.error);return j;};
const generated=await post('/api/generate',{topic:'为什么把任务拆小，更容易开始行动？',style:'知识科普',platform:'小红书',duration:30});assert.ok(generated.script.length>30);console.log('真实文稿生成通过：',generated.model,generated.script.length,'字');
const draft=await post('/api/drafts',{topic:'真实端到端测试：把任务拆小',script:generated.script});const drafts=await(await fetch(base+'/api/drafts')).json();assert.ok(drafts.some(d=>d.id===draft.id&&d.script===generated.script));
let job=await post('/api/jobs',{topic:'真实端到端测试：把任务拆小',script:generated.script,voice:'zh-CN-XiaoxiaoNeural',rate:'normal'});console.log('真实视频任务：',job.id);const deadline=Date.now()+600000;let lastStage='';
while(['queued','running'].includes(job.status)){assert.ok(Date.now()<deadline,'导出超过十分钟');if(job.stage!==lastStage){console.log('阶段：',job.stage);lastStage=job.stage;}await new Promise(r=>setTimeout(r,1500));job=await(await fetch(base+'/api/jobs/'+job.id)).json();}
assert.equal(job.status,'completed',job.error||job.message);const r=await fetch(base+job.videoUrl);assert.equal(r.headers.get('content-type'),'video/mp4');await mkdir('out/mollystudio',{recursive:true});await writeFile('out/mollystudio/e2e-video.mp4',Buffer.from(await r.arrayBuffer()));
const range=await fetch(base+job.videoUrl,{headers:{Range:'bytes=0-99'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,100);
const download=await fetch(base+job.videoUrl+'?download=1',{method:'HEAD'});assert.match(download.headers.get('content-disposition'),/attachment/);
const subtitle=await(await fetch(base+job.subtitlesUrl)).text();assert.match(subtitle,/-->/);await writeFile('out/mollystudio/e2e-subtitles.srt',subtitle);
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height,r_frame_rate','-of','json','out/mollystudio/e2e-video.mp4'],{encoding:'utf8'}));assert.ok(probe.streams.some(s=>s.width===1080&&s.height===1920&&s.r_frame_rate==='30/1'));assert.ok(probe.streams.some(s=>s.codec_type==='audio'));execFileSync('ffmpeg',['-v','error','-i','out/mollystudio/e2e-video.mp4','-f','null','-'],{stdio:'pipe'});
await writeFile('out/mollystudio/e2e-report.json',JSON.stringify({testedAt:new Date().toISOString(),model:generated.model,script:generated.script,job,probe,checks:['real-llm','saved-draft','real-tts','wordmotion-render','video-download','range-playback','srt-download','full-decode']},null,2));console.log('全部通过：',job.duration,'秒，',job.size,'bytes；报告：out/mollystudio/e2e-report.json');
