import React from 'react';
import {AbsoluteFill,Audio,Composition,Sequence,staticFile,useCurrentFrame} from 'remotion';
import originalPlan from './data/shots.json';
import originalCaptions from './data/captions.json';
import {Slide} from './components/Slide';
import {Subtitles} from './components/shared/Subtitles';
import type {VideoProps} from './types';
import './style.css';
const defaultProps:VideoProps={plan:originalPlan,captions:originalCaptions};
const getDuration=(props:VideoProps)=>props.plan.shots.reduce((n,s)=>n+s.durationFrames,0);
export const Video:React.FC<VideoProps>=({plan,captions})=>{
 const frame=useCurrentFrame();const duration=getDuration({plan,captions});
 return <AbsoluteFill style={{backgroundColor:'#0a0a0f'}}>
  {plan.shots.map(s=><Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationFrames}>
   <Slide shot={s} total={plan.shots.length}/>
   {s.captionIndices.map(i=><Sequence key={i} from={captions[i].startFrame-s.startFrame} durationInFrames={captions[i].durationFrames}>
    <Audio src={staticFile('audio/'+captions[i].audioFile)}/>
   </Sequence>)}
  </Sequence>)}
  <Subtitles captions={captions}/>
  <div style={{position:'absolute',top:0,left:0,height:5,width:`${100*frame/duration}%`,backgroundColor:'#f59e0b'}}/>
 </AbsoluteFill>;
};
export const Root:React.FC=()=> <Composition id="Wordmotion" component={Video} defaultProps={defaultProps} width={1080} height={1920} fps={30} durationInFrames={getDuration(defaultProps)} calculateMetadata={({props})=>({durationInFrames:getDuration(props)})}/>;
