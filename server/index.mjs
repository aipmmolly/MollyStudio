import http from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {readFile,writeFile,mkdir,readdir,stat,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,extname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {STYLES,PLATFORMS,DURATIONS,contentPrompt,cleanScript} from './content.mjs';
import {renderVideo,killProcess,VOICES,RATES} from './video.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
if(existsSync(join(root,'.env')))process.loadEnvFile(join(root,'.env'));
const port=Number(process.env.PORT||3210);
const baseURL=(process.env.LLM_BASE_URL||'https://openrouter.ai/api/v1').replace(/\/$/,'');
const model=process.env.LLM_MODEL||'qwen/qwen3.5-35b-a3b';
const envKey=process.env.LLM_API_KEY||(new URL(baseURL).hostname==='openrouter.ai'?process.env.OPENROUTER_API_KEY:'')||'';
const jobs=new Map();let active=null;const queue=[];const writes=new Map();
const dataDir=process.env.MOLLY_DATA_DIR?resolve(process.env.MOLLY_DATA_DIR):join(root,'.mollystudio');const jobsDir=join(dataDir,'jobs');const draftsDir=join(dataDir,'drafts');await mkdir(jobsDir,{recursive:true});await mkdir(draftsDir,{recursive:true});
for(const id of await readdir(jobsDir)){try{const job=JSON.parse(await readFile(join(jobsDir,id,'job.json'),'utf8'));if(['queued','running'].includes(job.status)){Object.assign(job,{status:'failed',stage:'failed',message:'服务已重启，任务已中断，请重新生成。',error:'服务重启导致任务中断'});await writeFile(join(jobsDir,id,'job.json'),JSON.stringify(job));}jobs.set(id,job);}catch{}}
function publicJob(job){const {script,child,folder,...data}=job;if(job.status==='completed'&&existsSync(join(jobsDir,job.id,'poster.jpg')))data.posterUrl=`/api/jobs/${job.id}/poster`;return data;}
function persist(job){const payload=JSON.stringify({...publicJob(job),script:job.script},null,2);const file=join(jobsDir,job.id,'job.json');const next=(writes.get(job.id)||Promise.resolve()).then(async()=>{await writeFile(file+'.tmp',payload);await rename(file+'.tmp',file);}).catch(e=>console.error('任务状态保存失败：'+e.message));writes.set(job.id,next);}
function update(job,patch){if(job.status==='cancelled')return;Object.assign(job,patch,{updatedAt:new Date().toISOString()});persist(job);}
async function drain(){if(active||!queue.length)return;const job=jobs.get(queue.shift());if(!job||job.status!=='queued'){void drain();return;}active=job;update(job,{status:'running'});try{await renderVideo(job,root,patch=>update(job,patch),jobsDir);}catch(e){if(job.status!=='cancelled')update(job,{status:'failed',stage:'failed',message:'视频生成失败，请查看错误后重试',error:String(e.message).slice(-3000)});}finally{active=null;void drain();}}
const tools={};for(const bin of ['edge-tts','ffmpeg','ffprobe','python3']){try{execFileSync(bin,['--version'],{stdio:'ignore',timeout:10000});tools[bin]=true;}catch(e){tools[bin]=e.code!=='ENOENT';}}
tools.remotion=existsSync(join(root,'node_modules/@remotion/cli/remotion-cli.js'));
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function error(message,status=400){return Object.assign(new Error(message),{status});}
async function body(req){let text='';for await(const b of req){text+=b;if(Buffer.byteLength(text)>50000)throw error('请求过大。',413);}try{return JSON.parse(text||'{}');}catch{throw error('请求不是有效的 JSON。');}}
function text(value,max){return typeof value==='string'?value.trim().slice(0,max):'';}
async function sendFile(req,res,path,type,download){let size;try{size=(await stat(path)).size;}catch{throw error('文件不存在。',404);}const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-cache'};if(download)headers['Content-Disposition']=`attachment; filename="${download}"`;const range=req.headers.range;if(range){const m=range.match(/^bytes=(\d+)-(\d*)$/);if(!m){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),size-1):size-1;if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});createReadStream(path,{start,end}).pipe(res);}else{res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')res.end();else createReadStream(path).pipe(res);}}
const server=http.createServer(async(req,res)=>{
 try{
  const allowedHosts=new Set([`localhost:${port}`,`127.0.0.1:${port}`]);if(!allowedHosts.has(req.headers.host))throw error('仅支持本机访问。',403);
  if(req.headers.origin&&!new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]).has(req.headers.origin))throw error('请求来源不受信任。',403);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url,`http://localhost:${port}`);const path=url.pathname;
  if(path==='/api/config'&&req.method==='GET')return json(res,200,{baseURL,model,keyConfigured:!!envKey,tools,styles:STYLES,platforms:PLATFORMS,durations:DURATIONS,voices:VOICES});
  if(path==='/api/generate'&&req.method==='POST'){
   const b=await body(req);const topic=text(b.topic,300);if(!topic)throw error('请先输入选题。');
   if(!STYLES.includes(b.style)||!PLATFORMS.includes(b.platform)||!DURATIONS.includes(Number(b.duration)))throw error('请选择有效的风格、平台和时长。');
   const endpoint=text(b.baseURL,500).replace(/\/$/,'')||baseURL;let u;try{u=new URL(endpoint);}catch{throw error('API 地址无效。');}
   if(u.username||u.password||u.search||u.hash||(!['https:'].includes(u.protocol)&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))))throw error('API 地址需使用 HTTPS；本地模型可使用 localhost HTTP。');
   const key=text(b.apiKey,1000)||(endpoint===baseURL?envKey:'');if(!key&&!['localhost','127.0.0.1'].includes(u.hostname))throw error('尚未配置 API Key。可打开模型设置，或直接手动输入文稿。',422);
   const requestedModel=text(b.model,150)||model;
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),120000);res.on('close',()=>{if(!res.writableEnded)controller.abort();});
   try{
    const upstream=await fetch(endpoint+'/chat/completions',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify({model:requestedModel,messages:contentPrompt({...b,topic}),temperature:0.75,max_tokens:3000,...(u.hostname==='openrouter.ai'?{reasoning:{enabled:false}}:{})}),signal:controller.signal});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok||data.error){const providerMessage=typeof data.error?.message==='string'?data.error.message:'';const detail=(key?providerMessage.replaceAll(key,'[隐藏密钥]'):providerMessage).replace(/sk-[\w-]+/g,'[隐藏密钥]').slice(0,500);throw error(`模型服务返回错误（${upstream.status}）${detail?'：'+detail:''}`,502);}
    const content=data.choices?.[0]?.message?.content;const script=cleanScript(typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):'');
    if(data.choices?.[0]?.finish_reason==='length')throw error('模型输出超出长度限制，请减少时长或更换模型后重试。',502);if(!script)throw error('模型没有返回文稿，请重试或更换模型。',502);
    return json(res,200,{script,model:data.model||requestedModel,usage:data.usage||null,generatedAt:new Date().toISOString()});
   }catch(e){if(e.name==='AbortError'||e.name==='TimeoutError')throw error('模型请求超时或已取消，请重试。',504);if(e.status)throw e;throw error('无法连接模型服务，请检查 API 地址和网络。',502);}finally{clearTimeout(timeout);}
  }
  if(path==='/api/drafts'&&req.method==='POST'){const b=await body(req);const script=text(b.script,6000);if(!script)throw error('文稿为空，无法保存。');const id=/^[a-z0-9-]{1,80}$/.test(b.id||'')?b.id:randomUUID();const draft={id,topic:text(b.topic,300),script,style:b.style,platform:b.platform,duration:b.duration,savedAt:new Date().toISOString()};await writeFile(join(draftsDir,id+'.json'),JSON.stringify(draft,null,2));return json(res,200,draft);}
  if(path==='/api/drafts'&&req.method==='GET'){const drafts=[];for(const file of await readdir(draftsDir)){try{drafts.push(JSON.parse(await readFile(join(draftsDir,file),'utf8')));}catch{}}return json(res,200,drafts.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)));}
  if(path==='/api/jobs'&&req.method==='GET')return json(res,200,[...jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(publicJob));
  if(path==='/api/jobs'&&req.method==='POST'){
   const b=await body(req);if(typeof b.script!=='string'||b.script.length>6000)throw error('文稿不能超过 6000 字。');const script=cleanScript(b.script);if(!/[\p{L}\p{N}]/u.test(script))throw error('请输入可朗读的文稿。');if(!(b.voice in VOICES)||!(b.rate in RATES))throw error('请选择有效的声音和语速。');
   if(Object.values(tools).some(v=>!v))throw error('视频依赖不完整，请检查环境状态。',503);
   if(queue.length>=3)throw error('等待中的任务过多，请稍后再试。',429);
   const job={id:randomUUID(),topic:text(b.topic,300),script,voice:b.voice,rate:b.rate,status:'queued',stage:'queued',progress:0,message:active?'等待前一个任务完成':'正在准备生成',createdAt:new Date().toISOString()};await mkdir(join(jobsDir,job.id),{recursive:true});jobs.set(job.id,job);persist(job);queue.push(job.id);json(res,202,publicJob(job));void drain();return;
  }
  const match=path.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/(video|subtitles|poster|cancel))?$/);
  if(match){const job=jobs.get(match[1]);if(!job)throw error('找不到这个任务。',404);const action=match[2];
   if(!action&&req.method==='GET')return json(res,200,publicJob(job));
   if(action==='cancel'&&req.method==='POST'){if(['queued','running'].includes(job.status)){Object.assign(job,{status:'cancelled',stage:'cancelled',message:'任务已取消'});killProcess(job.child);persist(job);}return json(res,200,publicJob(job));}
   if(['video','subtitles','poster'].includes(action)&&['GET','HEAD'].includes(req.method)){if(job.status!=='completed')throw error('视频尚未生成成功。',409);const fileMap={video:['final.mp4','video/mp4'],subtitles:['subtitles.srt','text/plain; charset=utf-8'],poster:['poster.jpg','image/jpeg']};return sendFile(req,res,join(jobsDir,job.id,fileMap[action][0]),fileMap[action][1],url.searchParams.has('download')?(action==='video'?'mollystudio.mp4':fileMap[action][0]):null);}
  }
  if(path.startsWith('/api/'))throw error('接口不存在。',404);
  if(!['GET','HEAD'].includes(req.method))throw error('不支持的请求方法。',405);
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};if(!files[path])throw error('页面不存在。',404);
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  return sendFile(req,res,join(root,'web',files[path]),({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[extname(files[path])]);
 }catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'服务出错，请查看终端后重试。'});else res.end();if(!e.status)console.error(e.message);}
});
server.listen(port,'127.0.0.1',()=>console.log(`MollyStudio 已启动：http://localhost:${port}`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已占用，可通过 PORT 更改。`:e.message);process.exit(1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(active){killProcess(active.child);update(active,{status:'failed',stage:'failed',message:'服务关闭，任务已中断。'});}server.close();setTimeout(()=>process.exit(0),300);});
