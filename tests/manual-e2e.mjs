// Real video render with every LLM credential explicitly removed.
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'mollystudio-manual-'));const base='http://localhost:33220';
const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'33220',MOLLY_DATA_DIR:dir,LLM_API_KEY:'',OPENROUTER_API_KEY:'',LLM_BASE_URL:'https://openrouter.ai/api/v1'},stdio:'ignore'});
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/api/config')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const config=await(await fetch(base+'/api/config')).json();assert.equal(config.keyConfigured,false);
 const request=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:'无 Key 手动文稿测试',script:'给自己一个小目标。先做十分钟，让想法成为作品。',voice:'zh-CN-XiaoxiaoNeural',rate:'normal'})});let job=await request.json();assert.equal(request.status,202);const deadline=Date.now()+240000;
 while(['queued','running'].includes(job.status)){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,1000));job=await(await fetch(base+'/api/jobs/'+job.id)).json();}
 assert.equal(job.status,'completed',job.error);await mkdir('out/mollystudio',{recursive:true});await writeFile('out/mollystudio/manual-no-key.mp4',Buffer.from(await(await fetch(base+job.videoUrl)).arrayBuffer()));assert.equal((await fetch(base+job.posterUrl)).status,200);execFileSync('ffmpeg',['-v','error','-i','out/mollystudio/manual-no-key.mp4','-f','null','-'],{stdio:'pipe'});
 const fail=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:'取消任务测试',script:'这个任务用于验证取消。不会被报告成生成成功。',voice:'zh-CN-XiaoxiaoNeural',rate:'normal'})});const pending=await fail.json();const cancel=await(await fetch(base+'/api/jobs/'+pending.id+'/cancel',{method:'POST'})).json();assert.equal(cancel.status,'cancelled');assert.equal((await fetch(base+'/api/jobs/'+pending.id+'/video')).status,409);
 console.log('无模型 Key 的真实视频导出通过：',job.duration,'秒；任务取消和未完成视频拒绝访问也通过。');await writeFile('out/mollystudio/manual-report.json',JSON.stringify({keyConfigured:config.keyConfigured,job,cancelled:cancel.status},null,2));
}finally{child.kill('SIGTERM');await new Promise(r=>child.once('close',r));await rm(dir,{recursive:true,force:true});}
