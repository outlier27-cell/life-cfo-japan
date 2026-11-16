'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./family-engine'),L=require('./family-ledger'),D=require('./pro-data'),E=require('./pro-engine'),T=require('./family-stories');
const act=(s,c)=>F.dispatch(s,{...c,revision:s.revision});
function play(seed,choice=0,preset=0){let s=F.start(seed);while(s.phase!=='ended'){if(s.phase==='life'){const e=F.event(s);s=act(s,{type:'life',choice:F.affordable(s,e.choices[choice])?choice:1-choice});}else if(s.phase==='allocate')s=act(s,{type:'allocate',policy:{...F.defaultPolicy(s),w:F.presets[preset].w}});else s=act(s,{type:'resolve',action:F.rescuePreview(s).canRecover?'liquidate':'bankrupt'});}return s;}
test('全部年度资产负债、年初余额、净资产变动与独立现金收付记录闭合',()=>{
 for(const seed of [1,4,9,27,56,1989,168907847])for(const preset of [0,1,2]){const s=play(seed,0,preset);let prior=F.snapshot(F.start(seed));for(const r of s.history){const a=L.audit(r);assert.deepEqual(r.openingBalance,prior);for(const k of ['balance','change','cash','opening','nonnegative'])assert.equal(a[k],true,seed+':'+r.year+':'+k);assert.equal(r.assetFlow,Object.values(r.cashMovements).reduce((a,b)=>a+b,0));prior=F.snapshot(r);}const damaged=structuredClone(s.history[0]);damaged.cash+=1;assert.equal(L.audit(damaged).cash,false);assert.equal(L.audit(damaged).balance,false);}
});
test('截图开局不会越过未清偿年份；终止后的账表保留空白',()=>{
 for(const mode of [0,1,2]){const s=play(168907847,0,mode);for(let i=0;i<s.history.length-1;i++){assert.equal(s.history[i].debt,0);assert.ok(s.history[i].net>=0);}const timeline=L.timeline(s);assert.equal(timeline.length,30);for(const t of timeline.slice(s.turn)){assert.equal(t.row,null);assert.equal(t.status,'已终止，未发生');}}
});
test('规则智能体响应家庭责任和收入空档，仅使用决策时已知信息',()=>{
 const s=act(F.start(4),{type:'life',choice:0}),p=F.defaultPolicy(s);const base=F.advice(s,p);assert.equal(base.months,6);
 const parent=structuredClone(s);parent.flags.child=true;assert.equal(F.advice(parent,p).months,9);
 const layoff=structuredClone(parent);layoff.pending.incomeFactor=.25;layoff.pending.income=Math.round(s.pending.income*.25);const low=F.advice(layoff,p);assert.equal(low.months,12);assert.ok(low.target>base.target);assert.ok(low.policy.w[0]>=base.policy.w[0]);assert.equal(low.policy.w.reduce((a,b)=>a+b),100);
 const start=E.index(s)+1,saved=D.countries[s.country].stock.slice();try{D.countries[s.country].stock.fill(1,start);assert.deepEqual(F.advice(s,p),base);}finally{D.countries[s.country].stock.splice(0,saved.length,...saved);}const actual=F.preview(s,base.policy).state.cash;assert.equal(base.shortfall,Math.max(0,base.target-actual));assert.ok(actual>=base.target||base.policy.w[0]===100);
});
test('同年对照以共同日期为界，失败模型不冒充当前年余额',()=>{
 const s=play(4);for(const m of F.models){const other=F.compare(s,m.id);for(let t=0;t<=s.turn;t++){const c=L.compareAt(s,other,t);assert.equal(c.year,s.era+t);assert.equal(c.common,t<=other.turn);if(t>other.turn)assert.equal(c.other,null);else assert.equal(F.net(c.other),t?other.history[t-1].net:F.net(F.start(s.seed)));}if(m.id==='adaptive')for(const r of other.history){assert.ok(r.agentDecision.reason);assert.deepEqual(r.policy,r.agentDecision.policy);}}
 const stopped={...s,turn:1,history:s.history.slice(0,1)};assert.equal(L.compareAt(s,stopped,2).other,null);assert.throws(()=>L.compareAt(s,stopped,s.turn+1));
});
test('决策历史图只有截止年末13个观测，黄金汇率换算与原始序列一致',()=>{
 for(const seed of [1,4,27,1989]){const s=F.start(seed),p=L.past(s),end=E.index(s),start=end-12,c=D.countries[s.country];assert.equal(p.dates.length,13);assert.equal(p.asOf,String(s.era)+'-12');assert.equal(p.series[0].values[0],100);assert.equal(p.series[1].values[0],100);assert.equal(p.series[0].values[12],c.stock[end]/c.stock[start]*100);assert.equal(p.series[1].values[12],D.gold[end]/D.gold[start]*c.fx[end]/c.fx[start]*100);assert.ok(p.dates.every(x=>x<=p.asOf));}
});
test('CSV每个角色30行48列，日元用基础单位，未发生年份无数值',()=>{
 const s=play(1),runs=[{name:'我的选择',run:s},...F.models.map(m=>({name:m.name,run:F.compare(s,m.id)}))],csv=L.csv(runs),lines=csv.slice(1).split('\r\n');assert.equal(csv.charCodeAt(0),0xfeff);assert.equal(lines.length,121);for(const line of lines)assert.equal(line.split(',').length,48);for(const line of lines.slice(1)){const cells=line.slice(1,-1).split('","');if(cells[2].includes('未发生'))assert.ok(cells.slice(4).every(x=>x===''));else assert.equal(cells.at(-1),'一致');}
});
test('新增随机剧情可覆盖，编号相同事件相同，连续同类场景可避开',()=>{
 const seen=new Set();for(let seed=1;seed<250;seed++){let s=F.start(seed);s.turn=7;s.cash=F.month(s)*100;const a=F.event(s);assert.deepEqual(a,F.event(structuredClone(s)));seen.add(a.kind);if(T.extra.some(x=>x.kind===a.kind)){s.history=[{lifeEvent:a}];assert.notEqual(F.event(s).kind,a.kind);}}
 for(const k of T.extra.map(x=>x.kind))assert.ok(seen.has(k),k);assert.equal(T.gallery.length,15);
});
test('旧5.0记录仍由冻结引擎读取，新引擎拒绝跨版本混算',()=>{
 const old=require('./family-v5-engine');const raw=old.pack(old.start(4));assert.equal(old.restore(raw).version,'family-5.0.0');assert.throws(()=>F.restore(raw));
});
if(process.env.CFO_ROUTE_REPORT){const fs=require('node:fs');fs.writeFileSync(process.env.CFO_ROUTE_REPORT,JSON.stringify([1,4,1989,168907847].map(seed=>{const s=play(seed);return{seed,turn:s.turn,outcome:s.outcome,country:s.country,era:s.era,net:F.net(s),events:s.history.map(r=>r.lifeEvent.kind),models:F.models.map(m=>{const n=F.compare(s,m.id);return{id:m.id,turn:n.turn,outcome:n.outcome,net:F.net(n)};})};}),null,2));}
