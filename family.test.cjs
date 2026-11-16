'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./family-engine'),E=require('./pro-engine'),D=require('./pro-data'),B=require('./world-engine'),S=require('./family-social'),G=require('./family-charts');
const act=(s,c)=>F.dispatch(s,{...c,revision:s.revision});
function play(seed,mode=0){let s=F.start(seed),route=[],guard=0;while(s.phase!=='ended'&&guard++<91){
 if(s.phase==='life'){const ev=F.event(s);let choice=mode===1?1:0;if(!F.affordable(s,ev.choices[choice]))choice=1-choice;route.push(['life',choice,ev.kind]);s=act(s,{type:'life',choice});}
 else if(s.phase==='allocate'){const p=F.defaultPolicy(s);p.w=[...F.presets[mode%3].w];p.coverage=mode===2?2:s.coverage;s=act(s,{type:'allocate',policy:p});}
 else {const action=F.rescuePreview(s).canRecover?'liquidate':'bankrupt';route.push(['resolve',action]);s=act(s,{type:'resolve',action});}
 }assert.equal(s.phase,'ended');return{s,route};}
test('首年全现金的收入、支出与资产负债可手算，生活选择不提前推进年份',()=>{
 let seed=1;while(B.shock(F.start(seed)).kind!=='none')seed++;
 let s=F.start(seed),opening=F.net(s),b=F.budget(s);s=act(s,{type:'life',choice:1});assert.equal(s.turn,0);
 s=act(s,{type:'allocate',policy:{...F.defaultPolicy(s),w:[100,0,0,0]}});
 assert.equal(F.net(s),opening+b.income+Math.round(b.month*.8)-b.expense);assert.equal(F.totalAssets(s)-F.totalDebt(s),F.net(s));assert.equal(s.turn,1);assert.equal(s.history[0].fees,0);
});
test('年度收支为负但仍有储备不会误判破产；欠款则必须停止常规推进',()=>{
 let s=F.start(1989);s.cash=F.month(s)*50;s=act(s,{type:'life',choice:1});s.pending.income=0;s.pending.extra=0;
 s=act(s,{type:'allocate',policy:{...F.defaultPolicy(s),w:[100,0,0,0]}});assert.ok(s.history[0].familySurplus<0);assert.equal(s.phase,'life');assert.equal(s.debt,0);
 let t=F.start(1989);t.cash=0;t=act(t,{type:'life',choice:1});t.pending.income=0;t.pending.extra=0;
 t=act(t,{type:'allocate',policy:{...F.defaultPolicy(t),w:[100,0,0,0]}});assert.equal(t.phase,'crisis');assert.ok(t.debt>0);assert.throws(()=>act(t,{type:'life',choice:1}));assert.equal(F.rescuePreview(t).canRecover,false);
 assert.throws(()=>act(t,{type:'resolve',action:'liquidate'}));t=act(t,{type:'resolve',action:'bankrupt'});assert.equal(t.outcome,'bankrupt');assert.throws(()=>act(t,{type:'life',choice:1}));
});
test('资产变现能清偿时可恢复，手续费降低净资产，处置不可重复',()=>{
 let s=act(F.start(1989),{type:'life',choice:1});s=act(s,{type:'allocate',policy:F.defaultPolicy(s)});
 Object.assign(s,{phase:'crisis',cash:0,stock:0,bond:0,gold:0,house:100000,car:10000,mortgage:30000,debt:20000,mortgagePayment:2000});Object.assign(s.history[0],F.snapshot(s),{net:F.net(s)});
 const before=F.net(s),a=F.rescuePreview(s);assert.equal(a.canRecover,true);assert.equal(a.fees,3000);assert.equal(a.net,before-3000);
 s=act(s,{type:'resolve',action:'liquidate'});assert.equal(s.phase,'life');assert.equal(s.house+s.car+s.mortgage+s.debt,0);assert.equal(F.net(s),before-3000);assert.equal(s.history[0].net,F.net(s));assert.throws(()=>act(s,{type:'resolve',action:'liquidate'}));
});
test('基础篇拒绝止盈止损和年内再平衡，默认及所有模型均无这些规则',()=>{
 let s=act(F.start(1989),{type:'life',choice:1}),p=F.defaultPolicy(s);
 assert.throws(()=>F.policy({...p,loss:10}));assert.throws(()=>F.policy({...p,profit:20}));assert.throws(()=>F.policy({...p,rebalance:'quarter'}));
 for(const m of F.models)assert.equal(F.modelPolicy(s,m.id,p).rebalance,undefined);
 const before=structuredClone(s);F.preview(s,p);assert.deepEqual(s,before);s=act(s,{type:'allocate',policy:p});assert.equal(s.history[0].monthly.length,12);
});
test('年度现金图由实际付款和收付构成，欠款不假装已支出，处置后也闭合',()=>{
 for(let seed=1;seed<=80;seed++)for(const mode of [0,1,2]){const {s}=play(seed,mode);for(const r of s.history){const rows=G.cashRows(r);assert.equal(rows[0].value+rows[1].value+rows[2].value+rows[3].value,rows[4].value);assert.ok(rows[2].value<=0);assert.equal(r.net,F.totalAssets(r)-F.totalDebt(r));const expected=r.opening+r.gift-r.cost+r.gain+r.houseGain+r.carGain-r.depreciation+r.income-r.expense-r.interest-r.bill-r.fees;assert.equal(r.net,expected);}}
});
test('随机事件有实际和延后影响，继承至多一次，休整后出现重返工作',()=>{
 const seen=new Set();let job=false,returning=false;for(let seed=1;seed<=150;seed++){
  const {s}=play(seed,seed%3);assert.ok(s.history.filter(r=>r.lifeEvent.kind==='inheritance').length<=1);
  for(const r of s.history){seen.add(r.lifeEvent.kind);if(r.lifeEvent.kind==='inheritance')assert.equal(r.gift,Math.round(D.countries[s.country].monthly*D.countries[s.country].cpi[(s.era-1977+r.year-s.era-1)*12]/D.countries[s.country].cpi[(s.era-1977)*12])*8);}
 }
 for(let seed=1;seed<1000&&(!job||!returning);seed++){
  let s=F.start(seed);s.turn=7;s.cash=F.month(s)*100;const ev=F.event(s),income=F.budget(s).income;
  if(ev.kind==='job'){const n=act(s,{type:'life',choice:0});assert.equal(n.pending.income,income);assert.equal(F.budget(n).income,income+F.month(s));job=true;}
  if(ev.kind==='layoff'){let n=act(s,{type:'life',choice:1});assert.equal(n.pending.income,Math.round(income*.25));n=act(n,{type:'allocate',policy:F.defaultPolicy(n)});assert.equal(F.event(n).kind,'return');returning=true;}
 }
 for(const k of ['inheritance','layoff','job','return'])assert.ok(seen.has(k),k);assert.ok(job&&returning);
});
test('360局覆盖36种背景，提前结束与通关可重放，保存金额不能伪造',()=>{
 const backgrounds=new Set(),outcomes=new Set();for(let seed=1;seed<=360;seed++){const {s}=play(seed,seed%3);backgrounds.add([s.country,s.era,s.household].join());outcomes.add(s.outcome);assert.deepEqual(F.restore(F.pack(s)),s);assert.equal(s.commands.filter(c=>c.type==='allocate').length,s.turn);assert.ok(s.turn<=30);assert.ok(Object.values(F.snapshot(s)).every(n=>Number.isSafeInteger(n)&&n>=0));}
 assert.equal(backgrounds.size,36);assert.ok(outcomes.has('completed')&&outcomes.has('bankrupt'));
 const {s}=play(1989),raw=F.pack(s);raw.cash=999999999;assert.deepEqual(F.restore(raw),s);assert.throws(()=>F.restore({...raw,version:'pro-4.0.0'}));
});
test('模型不读取未来，保持相同生活计划并在失败年份停止；原状态不变',()=>{
 const {s}=play(1989,1),copy=structuredClone(s);for(const m of F.models){const other=F.compare(s,m.id);assert.ok(other.turn<=s.turn);for(let i=0;i<other.history.length;i++){assert.equal(other.history[i].title,s.history[i].title);assert.deepEqual(other.history[i].lifeEvent,s.history[i].lifeEvent);}}
 assert.deepEqual(s,copy);const n=act(F.start(3),{type:'life',choice:0}),p=F.defaultPolicy(n),before=F.models.map(m=>F.modelPolicy(n,m.id,p)),idx=E.index(n),saved=D.countries[n.country].stock.slice();try{D.countries[n.country].stock.fill(999999,idx+1);assert.deepEqual(F.models.map(m=>F.modelPolicy(n,m.id,p)),before);}finally{D.countries[n.country].stock.splice(0,saved.length,...saved);}
});
test('已结束的通关与破产成绩均可重算，未结束、损坏、跨版本记录被拒绝',()=>{
 const samples=[];for(let seed=1;seed<=100&&new Set(samples.map(s=>s.outcome)).size<2;seed++){const {s}=play(seed,seed%3);samples.push(s);}assert.equal(new Set(samples.map(s=>s.outcome)).size,2);
 for(const s of samples){const p=S.compact(s,'体验者'),v=S.verify(p);assert.deepEqual(v.run,s);assert.equal(S.read(S.scoreUrl(s,'体验者'))[0].metrics.net,F.net(s));assert.throws(()=>S.verify({...p,v:4}));assert.throws(()=>S.verify({...p,c:p.c+'L1'}));}
 assert.throws(()=>S.compact(F.start(1),'未完成'));assert.throws(()=>S.verify({v:5,r:F.version,d:D.version,s:1,n:'x',c:'Azzzzzz1000'}));
});
test('曲线只画到实际结束，表格不制造延长数据或NaN，现金图提供文字金额',()=>{
 const html=G.line([{name:'玩家',color:'#852d26',values:[10,20,30]},{name:'模型',color:'#37596b',values:[10,-2]}],[1990,1991,1992],'美元');assert.ok(html.includes('已结束'));assert.ok(!html.includes('NaN')&&!html.includes('undefined'));const {s}=play(1989);const cash=G.cash(s.history[0],x=>String(x));assert.ok(cash.includes('年初现金')&&cash.includes('年末现金'));
});

test('房车买卖与房贷跨年度入账，保障和危机处置后现金与净资产继续闭合',()=>{
 const seen=new Set();
 for(let seed=1;seed<=48;seed++){
  let s=F.start(seed);
  while(s.phase!=='ended'){
   if(s.phase==='life'){const e=F.event(s);s=act(s,{type:'life',choice:F.affordable(s,e.choices[0])?0:1});}
   else if(s.phase==='allocate'){
    const p={...F.defaultPolicy(s),w:[100,0,0,0],coverage:seed%3,house:s.house?(s.turn%7===0?'sell':'keep'):'buy',car:s.car?(s.turn%5===0?'sell':'keep'):'buy'};
    const a=F.preview(s,p);if(a.state.house)seen.add('house');if(a.state.car)seen.add('car');if(a.budget.mortgagePayment)seen.add('loan');
    s=act(s,{type:'allocate',policy:p});
   }else{s=act(s,{type:'resolve',action:F.rescuePreview(s).canRecover?'liquidate':'bankrupt'});seen.add('crisis');}
   const r=s.history.at(-1);if(!r)continue;
   const cash=G.cashRows(r);assert.ok(cash[2].value<=0);assert.equal(cash[0].value+cash[1].value+cash[2].value+cash[3].value,cash[4].value);
   assert.equal(r.net,F.totalAssets(r)-F.totalDebt(r));assert.equal(r.net,r.opening+r.gift-r.cost+r.gain+r.houseGain+r.carGain-r.depreciation+r.income-r.expense-r.interest-r.bill-r.fees);
  }
  assert.deepEqual(F.restore(F.pack(s)),s);
 }
 for(const k of ['house','car','loan','crisis'])assert.ok(seen.has(k),k);
});
