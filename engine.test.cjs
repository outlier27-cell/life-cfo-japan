'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('./engine.js'),C=require('./content.js');
const play=(seed,scenario,route,p)=>{let s=E.start(seed,scenario);for(let i=0;i<7;i++)s=E.advance(s,{turn:i,choice:C.chapters[i].choices[(route>>i)&1].id,percent:p});return s;};
test('1989 年全股票、加班路线可手算；年账本守恒',()=>{
 const s=E.advance(E.start(1989,'family'),{turn:0,choice:'overtime',percent:0});
 const expected=Math.round(1000000*3891587/3015900);
 assert.equal(s.stock,expected);assert.equal(s.cash,480000);
 assert.equal(E.net(s),expected+480000);assert.equal(s.mood,57);
});
test('两种背景、128 条生活路线、全部 101 个比例完整通关且资产负债守恒',()=>{
 for(const scenario of Object.keys(C.scenarios))for(let route=0;route<128;route++)for(let p=0;p<=100;p++){
  const s=play(1989+route,scenario,route,p);assert.equal(s.turn,7);
  for(const r of s.history){assert.equal(r.net,r.opening-r.cost+r.gain+r.flow-r.bill);assert.equal(r.net,r.cash+r.stock-r.debt);assert.ok(r.cash>=0&&r.stock>=0&&r.debt>=0);assert.ok(Number.isSafeInteger(r.net));}
 }
});
test('存档只信任命令，回放重算并保持外生事件相同',()=>{
 const s=play(1989,'family',43,60),packed=E.pack(s);
 assert.deepEqual(E.restore({...packed,cash:999999999}),s);
 const alt=E.counterfactual(s,1,0);
 assert.deepEqual(alt.history.map(r=>r.shock),s.history.map(r=>r.shock));
 assert.deepEqual(alt.commands.filter((_,i)=>i!==1),s.commands.filter((_,i)=>i!==1));
 assert.deepEqual(E.restore(E.pack(s)),s);
 assert.notEqual(E.net(s),E.net(alt));
});
test('技能、保障和住房的选择会影响后续年度',()=>{
 const insured=play(1989,'family',0,60),uninsured=play(1989,'family',2,60);
 assert.equal(insured.history[1].insurance,insured.history[1].shock.gross/2);
 assert.equal(uninsured.history[1].insurance,0);
 assert.equal(insured.history[1].income,C.scenarios.family.income+120000);
 assert.equal(insured.history[3].avoided,360000);
 const modest=play(1989,'family',4,60);
 assert.equal(insured.history[3].expense-modest.history[3].expense,240000);
});
test('不足支付时保留未付款，后续结余先偿还',()=>{
 let s=E.start(1989,'family');s.cash=0;s.stock=0;s.debt=800000;
 s=E.advance(s,{turn:0,choice:'overtime',percent:100});
 assert.equal(s.debt,320000);assert.equal(s.cash,0);assert.equal(s.history[0].repaid,480000);
});
test('拒绝重复命令、错误年份、越界比例、损坏存档和终局操作',()=>{
 const s=E.start();const command={turn:0,choice:'study',percent:60},n=E.advance(s,command);
 assert.throws(()=>E.advance(n,command));assert.throws(()=>E.advance(s,{...command,choice:'trip'}));
 for(const p of [-1,101,NaN,12.5,'60'])assert.throws(()=>E.advance(s,{...command,percent:p}));
 assert.throws(()=>E.restore({version:'old',commands:[]}));assert.throws(()=>E.start(0));assert.throws(()=>E.start(1989,'__proto__'));
 assert.throws(()=>E.advance(play(1,'solo',0,60),{turn:7,choice:'quiet',percent:0}));
});
