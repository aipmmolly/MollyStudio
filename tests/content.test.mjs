import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,splitSentences,contentPrompt,cleanScript} from '../server/content.mjs';
test('用户的新文稿产生对应分镜，不混入原来的 Muse 示例',()=>{const script='先写下今天最重要的一件事。把手机放远一点，然后专心做十分钟。做完后停下来，看看自己的进展。';const {manifest,plan}=makePlan(script,'专注练习');assert.equal(manifest.map(s=>s.text).join(''),script);assert.equal(plan.shots[0].title,'专注练习');assert.ok(!JSON.stringify(plan).includes('Muse'));assert.deepEqual(plan.shots.flatMap(s=>s.sentences),manifest.map(s=>s.index));});
test('中文引号、换行和空白不会生成空音频',()=>{const s=splitSentences('“现在开始。”\n\n第二步！\n！？\n---');assert.deepEqual(s,['“现在开始。”','第二步！']);});
test('没有标点的长文稿不会形成超长字幕或单个巨型画面',()=>{const {manifest,plan}=makePlan('每天留一点时间观察生活'.repeat(70));assert.ok(manifest.length>4);assert.ok(plan.shots.length>3);assert.ok(manifest.every(s=>s.charCount<=95));assert.ok(plan.shots.every(s=>s.items.every(x=>[...x].length<=22)));});
test('空文稿和纯标点被拒绝',()=>{assert.throws(()=>makePlan('。！？\n---'),/没有可朗读/);});
test('模型提示词包含用户指定的风格、平台及目标时长',()=>{const p=contentPrompt({topic:'读书',style:'轻松分享',platform:'小红书',duration:30});assert.match(p[1].content,/轻松分享/);assert.match(p[1].content,/小红书/);assert.match(p[1].content,/30秒/);assert.equal(cleanScript('# 标题\n\n**正文**。'),'正文。');});
