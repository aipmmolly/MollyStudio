export type Caption = {text:string;startMs:number;endMs:number;sentenceIndex:number;audioFile:string;charCount:number;startFrame:number;durationFrames:number};
export type Shot = {id:number;title:string;kicker:string;kind:string;items:string[];footer:string;sentences:number[];semanticSignature:string;startFrame:number;durationFrames:number;captionIndices:number[];audioFiles:string[]};
export type VideoProps = {plan:{videoType:string;shots:Shot[]};captions:Caption[]};
