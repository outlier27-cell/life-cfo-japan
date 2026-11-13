'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('./pro-engine'),P=require('./pro-planning'),D=require('./pro-data'),C=require('./pro-content'),S=require('./pro-social');
const life=(s,c=1)=>E.dispatch(s,{type:'life',choice:c,revision:s.revision});
const settle=(s,p)=>E.dispatch(s,{type:'allocate',policy:p,revision:s.revision});
const policy=(s,w=[100,0,0,0])=>({...E.defaultPolicy(s),w,coverage:0});
test('现金底线在最终比例和扣费后成立，预设、边界与连续调整都守恒',()=>{
 for(let seed=1;seed<=30;seed++)for(const floor of [0,1,20,40,99,100])for(const preset of C.presets){
  const s=life(E.start(seed)),w=P.applyFloor(preset.weights,floor);assert.equal(w.reduce((a,b)=>a+b),100);assert.ok(w[0]>=floor);assert.ok(w.every(Number.isInteger));
  for(const i of [1,2,3]){const next=P.setWeight(w,i,100,floor);assert.equal(next.reduce((a,b)=>a+b),100);assert.ok(next[0]>=floor);const a=E.preview(s,policy(s,next));assert.ok(!a.financial||a.state.cash/a.financial*100+1e-9>=floor);}
 }
 assert.deepEqual(P.applyFloor([20,40,30,10],40),[40,30,23,7]);
 assert.deepEqual(P.applyFloor([100,0,0,0],100),[100,0,0,0]);
 assert.throws(()=>P.applyFloor([20,40,30,10],101));assert.throws(()=>P.applyFloor([20,40,30,20],0));
});
test('三类假设场景的全现金结果可手算，保费与医疗赔付仅计一次',()=>{
 const s=life(E.start(1989));s.cash=E.month(s)*20;
 for(let coverage=0;coverage<=2;coverage++){
  const p={...policy(s),coverage},a=P.stress(s,p,'medical'),m=E.month(s);
  const gross=Math.round(3*m),cover=Math.round(gross*[0,.5,.8][coverage]),premium=Math.round(m*[0,.6,1.2][coverage]);
  assert.equal(a.gain,0);assert.equal(a.cash,s.cash-(gross-cover)-premium);assert.equal(a.covered,cover);assert.equal(a.premium,premium);assert.equal(a.sale,0);assert.equal(a.unpaid,0);
  const repair=P.stress(s,p,'double');assert.equal(repair.covered,0);assert.equal(repair.cash,s.cash-Math.round(2*m)-premium);
 }
});
test('现金不足按既有顺序变现计费；旧未付款不重复增加净资产损失',()=>{
 const s=life(E.start(8));s.cash=100;s.bond=0;s.stock=0;s.gold=0;s.debt=200;
 const p=policy(s),a=P.stress(s,p,'bill');assert.equal(a.oldDebt,200);assert.equal(a.unpaid,a.bill+200-100);assert.equal(a.net,E.net(s)-a.bill);
 const wealthy=life(E.start(8));wealthy.cash=E.month(wealthy)*5;
 const b=P.stress(wealthy,policy(wealthy,[0,100,0,0]),'medical');assert.ok(b.sale>0);assert.equal(b.fees,Math.round(b.sale*.001));assert.equal(b.net,b.opening+b.gain-b.bill-b.premium-b.fees);
});
test('假设不改变原状态，不读未来行情、下年账单或未来房车估值',()=>{
 const s=life(E.start(89)),p={...policy(s,[20,40,30,10]),coverage:2},before=structuredClone(s),a=P.compareStress(s,p,'medical'),saved=[];
 const change=(arr,start)=>{saved.push([arr,arr.slice()]);for(let i=start;i<arr.length;i++)arr[i]=9999999;};
 try{
  for(const c of Object.values(D.countries)){for(const key of ['stock','cpi','fx'])change(c[key],E.index(s)+1);change(c.house,s.era-1977+s.turn+1);}
  for(const key of ['yield','gold','car'])change(D[key],E.index(s)+1);
  assert.deepEqual(P.compareStress(s,p,'medical'),a);
 }finally{for(const [arr,values]of saved)arr.splice(0,arr.length,...values);}
 assert.deepEqual(s,before);assert.deepEqual(p,{...policy(s,[20,40,30,10]),coverage:2});
});
test('止损与再平衡不被假设为瞬间成交；模型使用相同家庭计划',()=>{
 const s=life(E.start(9)),p={...policy(s,[20,40,30,10]),coverage:2,house:'buy',car:'buy'};
 const pair=P.compareStress(s,p,'double');assert.deepEqual(pair.personal,pair.balanced);
 assert.deepEqual(P.stress(s,{...p,loss:10,profit:20,rebalance:'quarter'},'double'),P.stress(s,{...p,loss:0,profit:0,rebalance:'none'},'double'));
});
test('36种背景与房车计划的压力账本守恒、金额非负且安全',()=>{
 const ids=new Set();for(let seed=1;seed<=200;seed++){
  const s=life(E.start(seed));ids.add([s.country,s.era,s.household].join('|'));if(seed%2===0)s.cash=E.housePrice(s)*2;
  for(const scenario of P.scenarios){const p={...policy(s,C.presets[seed%3].weights),coverage:seed%3,house:'buy',car:'buy'},a=P.stress(s,p,scenario.id);assert.equal(a.net,a.opening+a.gain-a.bill-a.premium-a.fees);for(const x of [...a.holdings,a.unpaid,a.fees,a.sale])assert.ok(Number.isSafeInteger(x)&&x>=0);}
 }assert.equal(ids.size,36);
});
test('理由与看过的假设完整重放；旧存档与旧成绩不依赖新便签',()=>{
 let run=E.start(77),entries=[];for(let t=0;t<30;t++){run=life(run,t%2);entries.push({reason:t%2?'family':'reserve',note:'第'+t+'年保留原话',floor:20,stress:t%2?'medical':''});run=settle(run,policy(run,[20,40,30,10]));}
 const old=E.pack(run),record={version:P.version,entries},restored=E.restore(old);assert.deepEqual(restored,run);assert.deepEqual(P.journal(undefined,restored),[]);
 const replay=P.review(restored,P.journal(JSON.parse(JSON.stringify(record)),restored));assert.equal(replay.length,30);assert.equal(replay[1].note,'第1年保留原话');assert.ok(replay[1].result);assert.equal(replay[0].result,null);
 const packet=S.compact(run,'老玩家');assert.equal(S.verify(packet).metrics.net,E.net(run));assert.ok(!JSON.stringify(packet).includes('保留原话'));
 assert.throws(()=>P.journal({version:P.version,entries:[{...entries[0],floor:50}]},run));assert.throws(()=>P.journal({version:'wrong',entries:[]},run));
});
test('便签输入有长度、类型、场景与控制符校验，未记录年份可以恢复',()=>{
 assert.deepEqual(P.entry(),P.emptyEntry());assert.equal(P.entry({note:'  原因\u202e\n保留  '}).note,'原因  保留');
 assert.throws(()=>P.entry({reason:'unknown'}));assert.throws(()=>P.entry({stress:'future'}));assert.throws(()=>P.entry({note:'字'.repeat(81)}));assert.throws(()=>P.entry({floor:2.5}));
 let s=life(E.start(3));s=settle(s,policy(s));assert.deepEqual(P.journal({version:P.version,entries:[null]},s),[null]);
 assert.equal(P.reasonText({reason:'reserve',note:'家里要用钱'}),'留好应急金：家里要用钱');
});
test('资产目录涵盖金融、保障、房车和负债，本地/四国股票及币种准确',()=>{
 for(let seed=1;seed<=100;seed++){const s=life(E.start(seed)),p=policy(s),local=P.catalog(s,{...p,basket:0}),global=P.catalog(s,{...p,basket:1});assert.deepEqual(local.map(x=>x.id),['cash','stock','bond','gold','coverage','house','car','debt']);assert.equal(local[1].market,D.countries[s.country].name);assert.ok(global[1].market.includes('日本'));assert.ok(local[2].market.includes('美元'));assert.ok(local[4].liquidity.includes('没有'));}
});
