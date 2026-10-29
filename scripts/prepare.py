import re,json,pathlib
p=pathlib.Path('.')
text=(p/'article.md').read_text()
paras=[re.sub(r'\*\*','',x.strip()).replace('\n',' ') for x in re.split(r'\n\s*\n',text) if x.strip() and not x.startswith('#') and x.strip()!='---']
ranges=[(0,2),(2,4),(4,5),(5,7),(7,11),(11,13),(13,16),(16,19),(19,22),(22,25),(25,29),(29,31),(31,34),(34,37),(37,39),(39,41),(41,43),(43,44),(44,46),(46,47)]
visuals=[
('两种 Agent 思路','MUSE / GROK BOT','hero',['Muse','Grok Bot'],'一个管家 · 一支团队'),
('AI 开始替你干活','FROM ANSWERS TO ACTIONS','shift',['回答问题','完成任务'],'从对话，走向行动'),
('同样是 Agent','TWO DIRECTIONS','compare',['个人 AI 管家','AI 员工团队'],'产品思路，走向两端'),
('一个长期陪伴的管家','01 / MUSE','orbit',['你','记忆','工具','执行'],'不用自己搭复杂工作流'),
('把生活交给一句话','MUSE / EVERYDAY','requests',['规划下周行程','寻找适合的活动','预订餐厅'],'说出需求，开始执行'),
('从理解到完成','MUSE / EXECUTION','process',['理解任务','制定计划','调用应用','完成任务'],'浏览器 + 应用 + 云端电脑'),
('始终是同一个 Muse','MUSE / PERSONAL AGENT','formula',['一个 Agent','长期记忆','工具','持续执行'],'越用，越懂你'),
('组建一支 AI 团队','02 / GROK BOT','team',['Research','Content','Career'],'不同角色，各司其职'),
('每个角色都有任务','GROK BOT / ROLES','roles',['Research Bot|寻找 AI 信息','Content Bot|整理选题和内容','Career Bot|跟踪岗位信息'],'分工，让工作持续流转'),
('分工，也共享环境','GROK BOT / WORKFLOW','formula',['多个 Agent','不同角色','Workflow','自动执行'],'任务独立 · 工具共享'),
('一个懂你 · 一群分工','03 / THE DIFFERENCE','compare',['一个越来越懂你的 AI','一群各司其职的 AI 员工'],'Muse / Grok Bot'),
('核心差异在这里','PERSONAL / MULTI-AGENT','compare',['Personal Agent','Multi-Agent Workflow'],'长期陪伴 / 角色协作'),
('生活事务，交给管家','04 / HOW TO CHOOSE','choice',['生活','行程','购物','信息整理'],'Muse 的产品逻辑更自然'),
('重复工作，交给团队','04 / HOW TO CHOOSE','choice',['找选题','监控信息','整理资料','生成内容'],'Grok Bot 的分工方式更适合'),
('值得关注的是变化','05 / THE BIGGER SHIFT','statement',['AI 产品','正在改变'],'从谁更强，看到如何工作'),
('过去：一问一答','BEFORE','dialog',['人提出问题','AI 回答'],'以聊天窗口为中心'),
('现在：目标驱动执行','AFTER','process',['提出目标','拆解任务','调用工具','执行任务','持续工作'],'围绕目标，形成行动链'),
('不必打开十几个窗口','A NEW WAY TO WORK','windows',['一个目标','持续推进'],'减少来回切换'),
('你说「我要什么」','YOU SET THE GOAL','shift',['你决定目标','AI 决定怎么完成'],'从提问者，成为目标制定者'),
('Agent 的有趣之处','THE NEXT INTERFACE','final',['告诉 AI 目标','让行动持续发生'],'Muse × Grok Bot · 两种产品思路')]
manifest=[]; shots=[]
for sid,((a,b),v) in enumerate(zip(ranges,visuals),1):
    title,kicker,kind,items,footer=v
    narration=''.join(paras[a:b]).replace('→','，').replace('+','，')
    sentences=re.findall(r'[^。！？!?]+[。！？!?]*[”」"]?',narration)
    ids=[]
    for s in sentences:
        s=s.strip(' ”」')
        if not re.search(r'[\w\u4e00-\u9fff]',s):continue
        idx=len(manifest)+1; name=f's_{idx:03}'
        manifest.append(dict(index=idx,id=name,filename=name+'.mp3',text=s,charCount=len(s)))
        ids.append(idx)
    shots.append(dict(id=sid,title=title,kicker=kicker,kind=kind,items=items,footer=footer,sentences=ids,semanticSignature=f'{kind} / 清晰理性 / 稳定中速'))
(p/'public/audio/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(p/'src/data/shot-plan.json').write_text(json.dumps(dict(videoType='product',shots=shots),ensure_ascii=False,indent=2))
print(f'{len(manifest)} sentences; {len(shots)} shots')
