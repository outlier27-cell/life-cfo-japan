'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('./family-engine'),N=require('./family-story-engine'),L=require('./family-ledger'),S=require('./family-social');
const act=(s,c)=>F.dispatch(s,{...c,revision:s.revision});
function play(seed=4,decisions={},stop=30){let s=F.start(seed),events=[];for(let g=0;g<91&&s.phase!=='ended'&&s.turn<stop;g++){
 if(s.phase==='life'){const e=F.event(s),requested=decisions[e.eventId]??0;let choice=e.choices.findIndex(o=>o.id===requested);if(choice<0)choice=typeof requested==='number'?requested:0;if(!F.affordable(s,e.choices[choice]))choice=e.choices.findIndex(o=>F.affordable(s,o));events.push(e);s=act(s,{type:'life',choice});}
 else if(s.phase==='allocate')s=act(s,{type:'allocate',policy:F.defaultPolicy(s)});
 else s=act(s,{type:'resolve',action:F.rescuePreview(s).canRecover?'liquidate':'bankrupt'});
 }return{s,events};}
test('三条故事都能跨年完成，人物与事件身份稳定，原选择有后续回收',()=>{
 const{s,events}=play();assert.equal(s.turn,30);assert.equal(s.outcome,'completed');
 for(const chain of ['project','care','trip']){assert.equal(s.story.threads[chain].status,'closed');assert.ok(s.story.memories.some(m=>m.id===chain+':echo'));}
 assert.ok(events.find(e=>e.eventId==='project:follow').story.includes(String(s.era+2)));assert.ok(events.find(e=>e.eventId==='care:review').story.includes('联系电话'));
 assert.equal(new Set(s.story.memories.map(m=>m.id)).size,s.story.memories.length);assert.equal(s.story.callbacks.length,0);
 for(const r of s.history){const a=L.audit(r);for(const k of ['balance','change','cash','opening','nonnegative'])assert.equal(a[k],true);assert.ok(r.storyFeedback.log);}
});
test('拒绝项目仍有返场，照料可改约，旅行可延期后本地兑现或取消',()=>{
 const routes=[['short'],['delay','local'],['delay','cancel']];
 for(const route of routes){const{s,events}=play(4,{'project:offer':'decline','project:follow':'weekday','care:offer':'personal','care:review':'shared-paid','trip:offer':'promise','trip:due':route[0],'trip:last':route[1]});
  assert.equal(s.turn,30);assert.ok(events.find(e=>e.eventId==='project:follow').story.includes('工作日'));assert.ok(events.find(e=>e.eventId==='care:review').story.includes('名字'));
  const care=events.find(e=>e.eventId==='care:review');assert.ok(care.choices.find(o=>o.id==='shared-paid').title.includes('请人协助'));assert.ok(!care.choices.find(o=>o.id==='shared-paid').title.includes('继续'));
  const t=s.story.threads.trip;assert.equal(t.status,'closed');assert.equal(!!t.fulfilled,route.at(-1)!=='cancel');assert.ok(s.story.memories.some(m=>m.id==='trip:reminder'));
  if(route.at(-1)==='cancel')assert.ok(t.outcome.includes('没有成行'));
  if(route.at(-1)==='local'){assert.ok(s.story.objects.includes('trip-day-note'));assert.ok(!s.story.objects.includes('trip-ticket'));const row={year:s.history.at(-1).year,storyReplies:[]};const copy=structuredClone(s);copy.story.closed=false;copy.story.threads.trip.status='open';N.finalize(copy,row,'结束');assert.ok(row.storyReplies[0].text.includes('抽屉'));assert.ok(!row.storyReplies[0].text.includes('车票'));}
 }
 const{s}=play(4,{'project:offer':'decline','project:follow':'decline-again'});assert.ok(s.story.memories.some(m=>m.text.includes('没有断掉')));
});
test('孩子按真实出生记录出现，无孩子的旅行使用已经存在的亲人',()=>{
 for(const choices of [{},{'year-3-life':1}]){const{s,events}=play(4,choices);const e=events.find(x=>x.chain==='trip');assert.ok(e);if(s.flags.child){assert.equal(e.personId,'child');assert.equal(s.story.people.child.born,s.era+6);const row=s.history.find(r=>r.lifeEvent.chain==='trip');assert.ok(row.year-s.story.people.child.born>=4);}else{assert.notEqual(e.personId,'child');assert.equal(s.story.people.child.born,null);assert.equal(N.journal(s).people.some(p=>p.id==='child'),false);}}
 require('./family-scenes');const{s,events}=play(4,{'trip:offer':'promise','trip:due':'delay','trip:last':'local'}),e=events.find(x=>x.chain==='trip');const old=globalThis.FamilyScenes.render(s,{...e,displayYear:s.story.people.child.born+8});assert.ok(old.includes('scale(0.78)'));assert.ok(old.includes('留在抽屉里的画'));assert.ok(!old.includes('留下来的车票'));const adult=globalThis.FamilyScenes.render(s,{...e,displayYear:s.story.people.child.born+20});assert.ok(!adult.includes('scale(0.78)'));
});
test('每次生活费用预览与实际扣款一致，重复提交不重复写入记忆',()=>{
 let s=F.start(4);for(let i=0;i<12&&s.phase!=='ended';i++){
  if(s.phase==='crisis'){s=act(s,{type:'resolve',action:'bankrupt'});break;}
  const e=F.event(s),choice=e.choices.findIndex(o=>F.affordable(s,o)),before=structuredClone(s),p=F.lifePreview(s,choice),command={type:'life',choice,revision:s.revision};
  assert.deepEqual(s,before);s=F.dispatch(s,command);assert.equal(s.pending.cost,p.cost);assert.equal(s.cash,p.cash);assert.equal(s.pending.payment.sale,p.sale);assert.equal(s.pending.payment.fee,p.fee);assert.throws(()=>F.dispatch(s,command));
  s=act(s,{type:'allocate',policy:F.defaultPolicy(s)});
 }
});
test('故事重放校验内容版本和事件标识，导入伪造的人物及金额没有作用',()=>{
 const{s}=play(),packet=F.pack(s);assert.deepEqual(F.restore(packet),s);
 assert.deepEqual(F.restore({...packet,story:{memories:[{text:'虚构'}]},cash:9999999}),s);
 for(const key of ['storyVersion','comparisonVersion'])assert.throws(()=>F.restore({...packet,[key]:'old'}));
 const bad=structuredClone(packet);bad.commands.find(c=>c.type==='life').eventId='fake';assert.throws(()=>F.restore(bad));
 const missing=structuredClone(packet);delete missing.commands[0].choiceId;assert.throws(()=>F.restore(missing));
});
test('金融策略比较沿用生活事件、人物决定与外生账单；故事绘制不改变随机源',()=>{
 const{s}=play(),before=structuredClone(s);for(const m of F.models){const other=F.compare(s,m.id);for(let i=0;i<other.turn;i++){assert.deepEqual(other.history[i].lifeEvent,s.history[i].lifeEvent);assert.equal(other.history[i].choice,s.history[i].choice);assert.equal(other.history[i].shock.kind,s.history[i].shock.kind);assert.deepEqual(other.history[i].storyFeedback,s.history[i].storyFeedback);}}
 assert.deepEqual(s,before);let t=F.start(4);t=act(t,{type:'life',choice:0});t=act(t,{type:'allocate',policy:F.defaultPolicy(t)});const e=F.event(t);for(let i=0;i<20;i++)assert.deepEqual(F.event(t),e);assert.deepEqual(F.restore(F.pack(t)),t);
});
test('到期故事遇到固定节点顺延，超期关闭，普通回响不增加必选操作',()=>{
 let s=play(4,{},2).s;assert.equal(s.turn,2);assert.equal(F.event(s).eventId,'year-2-life');assert.equal(s.story.callbacks.find(c=>c.chain==='project').dueTurn,2);
 const run=play().s;assert.ok(run.history.some(r=>r.storyReplies.some(x=>x.chain==='project')));assert.equal(run.commands.filter(c=>c.type==='life').length,30);assert.equal(run.commands.filter(c=>c.type==='allocate').length,30);
 s=F.start(4);s.story.threads.care={title:'父亲的照料安排',status:'open',stage:'offer'};s.story.callbacks=[{id:'care:review',chain:'care',nodeId:'review',mode:'choice',dueTurn:1,latestTurn:2}];s.turn=3;const row={year:s.era+3,necessaryMonthly:1};N.afterYear(s,row);assert.equal(s.story.threads.care.status,'closed');assert.equal(s.story.callbacks.length,0);assert.ok(row.storyReplies[0].text.includes('约定时间'));
});
test('破产在当前年份关闭未完故事，资金不足不产生幽灵费用或旅行回忆',()=>{
 let s=play(4,{},2).s;s.cash=0;s.stock=0;s.bond=0;s.gold=0;s=act(s,{type:'life',choice:1});s.pending.income=0;s.pending.extra=0;s=act(s,{type:'allocate',policy:F.defaultPolicy(s)});assert.equal(s.phase,'crisis');s=act(s,{type:'resolve',action:'bankrupt'});assert.equal(s.story.closed,true);assert.equal(s.story.callbacks.length,0);assert.equal(s.story.threads.project.status,'closed');assert.equal(s.story.memories.some(m=>m.id==='trip:echo'),false);assert.throws(()=>act(s,{type:'life',choice:0}));
});
test('v7成绩和好友榜保留故事版本，v6旧记录只能在冻结入口使用',()=>{
 const{s}=play(),packet=S.compact(s,'测试者'),v=S.verify(packet);assert.deepEqual(v.run,s);assert.equal(packet.v,7);assert.equal(S.read(S.boardUrl([packet]))[0].run.story.version,N.version);assert.throws(()=>S.verify({...packet,t:'unknown'}));
 const Old=require('./family-v6-engine');const raw=Old.pack(Old.start(4));assert.equal(Old.restore(raw).version,'family-6.0.0');assert.throws(()=>F.restore(raw));assert.throws(()=>Old.restore(F.pack(s)));
});

test('确认配置时修改医疗保障，年末回忆反映最终保单',()=>{
 let s=F.start(2);
 for(let i=0;i<3;i++){
  s=act(s,{type:'life',choice:i===2?1:0});
  const policy=F.defaultPolicy(s);
  if(i===2)policy.coverage=2;
  s=act(s,{type:'allocate',policy});
 }
 const row=s.history.at(-1);
 assert.equal(row.covered,1066);
 assert.equal(row.bill,266);
 assert.match(row.storyFeedback.log,/改选了加强医疗保障/);
 assert.ok(F.journal(s).memories.some(m=>m.year===1991&&m.text===row.storyFeedback.log));
 assert.deepEqual(F.restore(F.pack(s)),s);
});

test('处置住房后按最后的年末现金重新核对目标，回忆只写一次',()=>{
 let s=F.start(2);
 for(let i=0;i<10;i++){
  s=act(s,{type:'life',choice:i%2});
  s=act(s,{type:'allocate',policy:{...F.defaultPolicy(s),w:[10,65,15,10],coverage:2,house:s.house?'keep':'buy'}});
 }
 assert.equal(s.phase,'crisis');
 assert.match(s.story.memories.find(m=>m.id==='goal10').text,/还没有达到/);
 s=act(s,{type:'resolve',action:'liquidate'});
 assert.equal(s.cash,69946);
 const memory=s.story.memories.filter(m=>m.id==='goal10');
 assert.equal(memory.length,1);
 assert.match(memory[0].text,/兑现了/);
 assert.equal(s.history.at(-1).storyReplies.find(r=>r.id==='goal10').text,memory[0].text);
 assert.deepEqual(F.restore(F.pack(s)),s);
});

test('按揭预览按实际取整逐期计算，包括最后一笔尾款',()=>{
 let s=F.start(2),original;
 const decisions=[0,0,0,1,1,1,0,0,0,1,0,0,1,0,1,1,1,0,0,0,1,1,0,0,0,0,0,1];
 for(const choice of decisions){
  s=act(s,{type:'life',choice});
  const policy={...F.defaultPolicy(s),w:[10,65,15,10],house:s.house?'keep':'buy'};
  if(s.turn===8)original=F.mortgageSchedule(F.preview(s,policy).state);
  s=act(s,{type:'allocate',policy});
 }
 assert.deepEqual(original,{remaining:21,lastPayment:12});
 assert.equal(s.mortgage,11);
 assert.deepEqual(F.mortgageSchedule(s),{remaining:1,lastPayment:12});
});

test('好友榜只合并新提交的成员，重算缓存仍核对命令和协议',()=>{
 const a=play().s,first=S.compact(a,'甲'),second=S.compact(a,'乙');
 const forged={...second,net:999999999};
 assert.equal(S.summary(first).metrics.net,F.net(a));
 assert.equal(S.summary(forged).metrics.net,F.net(a));
 assert.throws(()=>S.summary({...first,r:'old'}));
 assert.throws(()=>S.summary({...first,c:first.c+'R1'}));
 const result=S.merge([first],[second]);
 assert.deepEqual(result,[first,second]);
});


test('购房预览与结算一致，未成交不扣款，成交后房贷跨年保留',()=>{
 const begin=s=>{
  const i=F.event(s).choices.findIndex(x=>F.affordable(s,x));
  return act(s,{type:'life',choice:i<0?'skip':i});
 };
 const first=begin(F.start(4)), base=F.defaultPolicy(first);
 const early=F.allocate(first,{...base,house:'buy'});
 const denied=early.history[0].housePurchase;
 assert.equal(denied.ok,false);
 assert.ok(denied.shortfall>0);
 assert.equal(early.mortgage,0);
 assert.deepEqual(F.snapshot(early),F.snapshot(F.allocate(first,base)));

 const ready=begin(play(4,{},24).s), buy={...F.defaultPolicy(ready),house:'buy'};
 const preview=F.preview(ready,buy), settled=F.allocate(ready,buy), row=settled.history.at(-1);
 assert.equal(preview.housePurchase.ok,true);
 assert.deepEqual(row.housePurchase,preview.housePurchase);
 assert.equal(row.mortgage,row.housePurchase.loan-row.principal);
 assert.ok(row.mortgagePayment>0);
 assert.equal(row.mortgagePayment,row.principal+row.interest);
 const next=begin(F.restore(F.pack(settled)));
 assert.equal(next.mortgage,row.mortgage);
 assert.equal(F.budget(next).mortgagePayment,row.mortgagePayment);
});


test('自动家庭事件可回放，同场冲击一致，急售折价计入账本',()=>{
 const run=(seed,weights)=>{
  let s=F.start(seed,'auto');
  while(s.phase!=='ended'){
   if(s.phase==='life')s=act(s,{type:'auto'});
   else if(s.phase==='allocate')s=act(s,{type:'allocate',policy:{...F.defaultPolicy(s),w:weights}});
   else s=act(s,{type:'resolve',action:F.rescuePreview(s).canRecover?'liquidate':'bankrupt'});
  }
  return s;
 };
 const player=run(4,[10,65,15,10]);
 assert.equal(player.outcome,'completed');
 const sales=player.history.filter(row=>row.stockDiscount);
 assert.ok(sales.length);
 for(const row of sales){
  assert.ok(Math.abs(row.stockDiscount-row.stockLiquidation*.05)<=2);
  assert.ok(row.fees>=row.stockDiscount);
 }
 const model=F.compare(player,'adaptive');
 assert.ok(model.history.length);
 for(const [i,row] of model.history.entries()){
  assert.deepEqual(row.shock,player.history[i].shock);
  assert.equal(row.householdBill,player.history[i].householdBill);
 }
 const withChild=run(1,[60,15,20,5]);
 assert.ok(withChild.history.some(row=>row.householdBill>0));
 for(const s of [player,withChild]){
  assert.deepEqual(F.restore(F.pack(s)),s);
  assert.deepEqual(S.verify(S.compact(s,'验收')).run,s);
  for(const row of s.history)assert.ok(Object.values(L.audit(row)).filter(v=>typeof v==='boolean').every(Boolean));
 }
 const old=play(4).s;
 const oldPacket=S.compact(old,'验收'),currentPacket=S.compact(player,'验收');
 assert.equal(S.merge([oldPacket],[currentPacket]).length,2);
 assert.throws(()=>S.boardUrl([oldPacket,currentPacket]));
});


test('按月过账保留先急售后到账的因果，单年重算不改原局',()=>{
 let run=F.start(7,'monthly');
 for(let i=0;i<12;i++){
  run=act(run,{type:'auto'});
  run=F.allocate(run,{...F.defaultPolicy(run),coverage:1});
 }
 const saved=F.pack(run), original=run.history[3];
 const alternative=F.retryYear(run,3,{...original.policy,w:[0,100,0,0]});
 assert.equal(original.year,1992);
 assert.equal(original.firstShortage,null);
 assert.equal(alternative.firstShortage,1);
 assert.ok(alternative.stockDiscount>0);
 assert.deepEqual(alternative.events,original.events);
 assert.deepEqual(F.pack(run),saved);
 assert.ok(run.history.some(r=>r.events.some(e=>e.kind==='birth')));
 assert.ok(original.events.some(e=>e.kind==='payout'&&e.month===3));
 assert.ok(original.events.some(e=>e.kind==='bonus'&&e.month===12));
 assert.deepEqual(F.restore(saved),run);
 for(const r of [...run.history,alternative]){
  assert.ok(Object.values(L.audit(r)).filter(v=>typeof v==='boolean').every(Boolean));
  assert.equal(r.monthly.length,12);
 }
 assert.equal(L.monthlyCsv(run).split('\r\n').length,145);
 assert.throws(()=>F.retryYear(run,12,original.policy));
});
