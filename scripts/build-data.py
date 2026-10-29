import json,subprocess,pathlib,math
p=pathlib.Path('.')
manifest=json.loads((p/'public/audio/manifest.json').read_text());plan=json.loads((p/'src/data/shot-plan.json').read_text())
fps=30;cursor=0;captions=[]
for s in manifest:
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',f'public/audio/{s["filename"]}']))
    frames=math.ceil(duration*fps)
    captions.append(dict(text=s['text'],startMs=cursor*1000/fps,endMs=(cursor+duration*fps)*1000/fps,sentenceIndex=s['index'],audioFile=s['filename'],charCount=s['charCount'],startFrame=cursor,durationFrames=frames))
    cursor+=frames
for shot in plan['shots']:
    cs=[captions[i-1] for i in shot['sentences']]
    shot.update(startFrame=cs[0]['startFrame'],durationFrames=sum(c['durationFrames'] for c in cs),captionIndices=[i-1 for i in shot['sentences']],audioFiles=[c['audioFile'] for c in cs])
(p/'src/data/captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2))
(p/'src/data/shots.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))
(p/'src/data/cards-used.json').write_text('[]\n')
print(f'Duration: {cursor/fps:.2f}s, {cursor} frames')
