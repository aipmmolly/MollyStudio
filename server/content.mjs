export const STYLES=['知识科普','轻松分享','观点评论','故事叙述'];
export const PLATFORMS=['抖音','小红书','视频号','B站'];
export const DURATIONS=[30,60,90,180];
export function cleanScript(value){
 return String(value??'').replace(/```[a-z]*\n?/gi,'').replace(/^\s*#{1,6}\s+.*$/gm,'').replace(/\*\*|__/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/^\s*[-*]\s+/gm,'').trim();
}
export function splitSentences(script){
 const cleaned=cleanScript(script).replace(/\r/g,'').replace(/[→+]/g,'，');
 const sentences=cleaned.match(/[^。！？!?\n]+[。！？!?]?[”」’"]?/gu)||[];
 return sentences.flatMap(s=>{
  const text=s.trim();if(!/[\p{L}\p{N}]/u.test(text))return [];
  // Very long unpunctuated input still needs short, readable shots.
  if([...text].length<=95)return [text];
  return text.match(/.{1,70}(?:[，,；;：:]|$)|.{1,70}/gu)||[text];
 });
}
function short(text,n){return [...text].slice(0,n).join('');}
export function makePlan(script,topic=''){
 const sentences=splitSentences(script);
 if(!sentences.length)throw Error('文稿中没有可朗读的内容。');
 const manifest=sentences.map((text,i)=>({index:i+1,id:`s_${String(i+1).padStart(3,'0')}`,filename:`s_${String(i+1).padStart(3,'0')}.mp3`,text,charCount:[...text].length}));
 // The existing visual library receives short extracts, never invented summaries.
 const groups=[];let group=[],size=0;
 for(const s of manifest){if(group.length&&(size+s.charCount>115||group.length>=3)){groups.push(group);group=[];size=0;}group.push(s);size+=s.charCount;}if(group.length)groups.push(group);
 const shots=groups.map((g,i)=>{
  const clauses=g.flatMap(s=>s.text.split(/[，,；;：:。！？!?“”「」]/)).map(s=>s.trim()).filter(s=>[...s].length>=2);
  const title=short(i===0&&topic?topic:clauses[0]||g[0].text,13);
  const items=(clauses.length?clauses:[g[0].text]).slice(0,4).map(s=>short(s,22));
  const kind=items.length>=3?'process':items.length===2?'shift':(i===groups.length-1?'final':'statement');
  return {id:i+1,title,kicker:`MOLLY STUDIO / ${String(i+1).padStart(2,'0')}`,kind,items,footer:i===0?'从一个想法，开始表达':`${String(i+1).padStart(2,'0')} · ${short(topic||'内容创作',22)}`,sentences:g.map(s=>s.index),semanticSignature:`${kind} / 原文提取 / 正常语速`};
 });
 return {manifest,plan:{videoType:'explainer',shots}};
}
export function contentPrompt({topic,style,platform,duration}){
 const target=Math.round(duration*3.5);
 return [{role:'system',content:'你是中文短视频口播编导。只输出可直接朗读的中文口播正文，不要标题、Markdown、分镜、时间码、表情、括号旁白或解释。开头抓住注意力，随后给出具体、有用的内容，结尾自然。短句为主，使用完整中文标点。不要编造数据、引用、亲身经历或产品能力。不要输出思考过程。'},
 {role:'user',content:`选题：${topic}\n风格：${style}\n平台：${platform}\n目标时长：${duration}秒，约${target}个中文字（语速和最终配音会影响实际时长）。直接给出口播正文。`}];
}
