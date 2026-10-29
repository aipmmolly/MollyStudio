import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import data from '../../data/captions.json';
import type {Caption} from '../../types';
export const Subtitles:React.FC<{captions?:Caption[]}>=({captions=data})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();const ms=frame/fps*1000;
 const cap=captions.find(c=>ms>=c.startMs&&ms<c.endMs);if(!cap)return null;
 const chars=[...cap.text]; const chunkSize=19; const total=chars.length;
 const progress=Math.min(.999,(ms-cap.startMs)/(cap.endMs-cap.startMs));const count=progress*total;
 const chunk=Math.floor(count/chunkSize); const start=chunk*chunkSize;
 return <AbsoluteFill style={{justifyContent:'flex-end',alignItems:'center',paddingBottom:72,pointerEvents:'none',zIndex:100}}><div style={{fontFamily:'"Noto Serif SC","Songti SC",serif',fontSize:44,fontWeight:600,lineHeight:1.5,textAlign:'center',padding:'18px 28px',background:'#0a0a0fee',borderRadius:14,whiteSpace:'nowrap',textShadow:'0 3px 12px #000'}}>{chars.slice(start,start+chunkSize).map((c,i)=><span key={i} style={{color:start+i<count?'#f59e0b':'#e5e7eb'}}>{c}</span>)}</div></AbsoluteFill>
};
