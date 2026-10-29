import {readFileSync,statSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8'));
const voice=process.argv[3] || 'zh-CN-XiaoxiaoNeural';
const rate=process.argv[4] || '+0%';
let next=0;
async function worker(){while(next<manifest.length){const s=manifest[next++];const file=`public/audio/${s.filename}`;try{if(statSync(file).size>500)continue;}catch{}
for(let attempt=1;attempt<=3;attempt++){try{await run('edge-tts',['--voice',voice,`--rate=${rate}`,'--text',s.text,'--write-media',file],{timeout:90000});if(statSync(file).size<500)throw Error('Empty audio');console.log(`${s.index}/${manifest.length} ${s.filename}`);break;}catch(e){if(attempt===3)throw e;}}}}
await Promise.all(Array.from({length:4},worker));
