'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const E=require('./pro-engine'),D=require('./pro-data'),C=require('./pro-content'),S=require('./pro-social'),H=require('./pro-history'),B=require('./world-engine');
const life=(s,choice=1)=>E.dispatch(s,{type:'life',choice,revision:s.revision});
const settle=(s,p=E.defaultPolicy(s))=>E.dispatch(s,{type:'allocate',policy:p,revision:s.revision});
function findSeed(fn){for(let seed=1;seed<100000;seed++){const s=E.start(seed);if(fn(s))return seed;}throw Error('fixture missing');}
function allCash(s){return{...E.defaultPolicy(s),w:[100,0,0,0],coverage:0,rebalance:'none'};}
function run(seed,policyFn=(s)=>E.defaultPolicy(s)){let s=E.start(seed);for(let t=0;t<30;t++){s=life(s,t%2);s=settle(s,policyFn(s,t));}return s;}
test('18个来源文件哈希匹配；517个月与44个Q4完整、无填补，黄金原工作簿可追溯',()=>{
 const m=require('./data/v4/manifest.json');assert.equal(m.series.length,18);assert.equal(D.dates.length,517);
 for(const item of m.series){const bytes=fs.readFileSync(path.join(__dirname,item.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.equal(item.count,item.type==='housing'?44:517);}
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,m.workbook.workbook))).digest('hex'),m.workbook.sha256);
 for(const c of Object.values(D.countries)){for(const k of ['stock','cpi','fx'])assert.ok(c[k].every(v=>Number.isFinite(v)&&v>0));assert.equal(c.house.length,44);}
});
test('全现金无意外的第一年可手算，生活选择不会提前推进市场',()=>{
 const seed=findSeed(s=>s.country==='US'&&s.household===0&&B.shock(s).kind==='none');let s=E.start(seed),initial=s.cash,m=E.month(s);s=life(s,1);assert.equal(s.turn,0);assert.equal(s.cash,initial);s=settle(s,allCash(s));assert.equal(s.cash,initial+Math.round(m*(15+.8))-Math.round(m*12));assert.equal(s.history[0].gain,0);assert.equal(s.history[0].fees,0);
});
test('票息现金流估值：平价100、利率上升价格下降；固定5%收益率的全年含再投票息为5.0625%',()=>{
 assert.ok(Math.abs(E.bondPrice(5,5,0)-100)<1e-9);assert.ok(E.bondPrice(5,8,0)<100);assert.ok(E.bondPrice(5,2,0)>100);
 const s=E.start(findSeed(s=>s.country==='US')),i=E.index(s),old=D.yield.slice(i,i+13);try{D.yield.fill(5,i,i+13);const total=E.marketPath(s,0).reduce((a,m)=>a*m.factors[2],1);assert.ok(Math.abs(total-1.050625)<1e-10);}finally{D.yield.splice(i,13,...old);}
});
test('月度股票路径累乘等于同年度四国本币价格因子，黄金换汇方向正确',()=>{
 for(let seed=1;seed<=40;seed++){const s=E.start(seed),c=D.countries[s.country],i=E.index(s),p=E.marketPath(s,1);assert.ok(Math.abs(p.reduce((a,m)=>a*m.factors[1],1)-B.market(s).global)<1e-10);const gold=D.gold[i+12]/D.gold[i]*c.fx[i+12]/c.fx[i];assert.ok(Math.abs(p.reduce((a,m)=>a*m.factors[3],1)-gold)<1e-10);}
});
test('止损按实际月度观测触发，跌25%不会伪装只亏10%；后续再平衡不会买回',()=>{
 const seed=findSeed(s=>s.country==='US'),base=E.start(seed),i=E.index(base),old=D.countries.US.stock.slice(i,i+13);
 try{D.countries.US.stock.fill(100,i,i+13);D.countries.US.stock[i+1]=75;base.cash=100000;let s=life(base);s=settle(s,{...E.defaultPolicy(s),w:[0,100,0,0],basket:0,loss:10,rebalance:'quarter'});const stop=s.history[0].trades.find(t=>t.kind==='止损');assert.equal(stop.month,1);assert.equal(stop.change,-.25);assert.ok(s.history[0].monthly.every(m=>m.holdings[1]===0));assert.equal(s.history[0].monthly[0].holdings[0],Math.round(99900*.75)-Math.round(Math.round(99900*.75)*.001));}
 finally{D.countries.US.stock.splice(i,13,...old);}
});
test('止盈后该仓当年保持现金；关闭止盈则继续持仓',()=>{
 const seed=findSeed(s=>s.country==='US'),base=E.start(seed),i=E.index(base),old=D.countries.US.stock.slice(i,i+13);
 try{D.countries.US.stock.fill(100,i,i+13);D.countries.US.stock[i+1]=125;base.cash=100000;const s=life(base),p={...E.defaultPolicy(s),w:[0,100,0,0],basket:0,profit:20,rebalance:'none'},on=settle(s,p),off=settle(s,{...p,profit:0});assert.equal(on.history[0].trades[0].kind,'止盈');assert.ok(on.history[0].monthly.every(m=>m.holdings[1]===0));assert.ok(off.history[0].monthly.at(-1).holdings[1]>0);assert.ok(E.net(on)>E.net(off));}
 finally{D.countries.US.stock.splice(i,13,...old);}
});
test('买房首付是资产负债转换；房贷本金不重复计损，费用与利息单列',()=>{
 let s=E.start(500);s.cash=E.housePrice(s)*2;s=life(s);const p={...allCash(s),house:'buy'},before=E.net(s),a=E.preview(s,p),price=E.housePrice(s);assert.equal(a.state.house,price);assert.equal(a.state.mortgage,Math.round(price*.7));assert.equal(E.net(a.state),before-Math.round(price*.03));const next=settle(s,p),row=next.history[0];assert.equal(next.mortgage,a.state.mortgage-row.principal);assert.equal(row.mortgagePayment,row.interest+row.principal);assert.ok(row.principal>0);assert.equal(row.interest,Math.round(a.state.mortgage*.05));
 const nextLife=life(next),sold=E.preview(nextLife,{...allCash(nextLife),house:'sell'});assert.equal(sold.state.house,0);assert.equal(sold.state.mortgage,0);assert.ok(sold.state.cash>0);
});
test('汽车实际转为资产，价格/汇率参考与15%折旧分开；不足不借首付',()=>{
 let base=E.start(101);base.cash=E.carPrice(base);let s=life(base,0); // exact price minus course cost: should not borrow to buy
 let preview=E.preview(s,{...allCash(s),car:'buy'});assert.equal(preview.state.car,0);assert.ok(preview.notes.some(x=>x.includes('未执行')));
 base=E.start(101);base.cash=E.carPrice(base);s=life(base,1);preview=E.preview(s,{...allCash(s),car:'buy'});assert.equal(preview.state.car,E.carPrice(s));assert.equal(E.net(preview.state),E.net(s));const next=settle(s,{...allCash(s),car:'buy'}),a=next.history[0];assert.equal(next.car,Math.round((preview.state.car+a.carGain)*.85));assert.equal(a.depreciation,preview.state.car+a.carGain-next.car);
 s=life(E.start(1));preview=E.preview(s,{...allCash(s),house:'buy'});assert.equal(preview.state.house,0);assert.equal(preview.state.mortgage,0);
});
test('保险收取保费并减少同一医疗账单，不产生可赎回资产',()=>{
 const seed=findSeed(s=>B.shock(s).kind==='medical');const s=life(E.start(seed)),none=settle(s,allCash(s)),covered=settle(s,{...allCash(s),coverage:2}),m=E.month(s),gross=B.shock(s).gross;assert.equal(covered.history[0].premium,Math.round(m*1.2));assert.equal(covered.history[0].covered,Math.round(gross*.8));assert.equal(covered.history[0].bill,gross-Math.round(gross*.8));assert.equal(none.history[0].covered,0);assert.equal(covered.insuranceAsset,undefined);
});
test('512局30年逐月执行守恒，覆盖36种背景、全部执行规则及房车路径',()=>{
 const identities=new Set(),kinds=new Set();let buys=0,sells=0,unpaid=0;
 for(let seed=1;seed<=512;seed++){let s=E.start(seed);identities.add([s.country,s.era,s.household].join('|'));for(let t=0;t<30;t++){s=life(s,(seed+t)%2);const p={...E.defaultPolicy(s),w:[...C.presets[(seed+t)%3].weights],loss:[0,10,20,30][seed%4],profit:[0,20,40,60][(seed+t)%4],rebalance:['none','quarter','band'][seed%3],coverage:(seed+t)%3,house:t===22?'sell':t>=5&&t<=18?'buy':'keep',car:t===18?'sell':t===3||t===9?'buy':'keep'};if(seed%11===0)p.w=[0,100,0,0];s=settle(s,p);const a=s.history.at(-1);assert.equal(a.monthly.length,12);for(const k of [...E.keys,'house','car','mortgage','debt'])assert.ok(Number.isSafeInteger(s[k])&&s[k]>=0);for(const trade of a.trades)kinds.add(trade.kind);buys+=a.notes.some(n=>n.includes('已购入住房'));sells+=a.notes.some(n=>n.includes('已出售住房'));unpaid+=a.debt>0;}assert.equal(s.revision,60);assert.equal(s.phase,'ended');}
 assert.equal(identities.size,36);assert.deepEqual([...kinds].sort(),['再平衡','止损','止盈'].sort());assert.ok(buys>0&&sells>0&&unpaid>0);
});
test('每一阶段都能重放；错误版本、重复操作与越界规则被拒绝',()=>{
 let s=E.start(89);for(let t=0;t<30;t++){const rev=s.revision;s=life(s,t%2);assert.deepEqual(E.restore(E.pack(s)),s);assert.throws(()=>E.dispatch(s,{type:'life',choice:0,revision:rev}));s=settle(s);assert.deepEqual(E.restore(E.pack(s)),s);}assert.throws(()=>settle(s));assert.throws(()=>E.restore({...E.pack(s),version:'other'}));assert.throws(()=>E.validatePolicy({...E.defaultPolicy(s),w:[0,100,100,0]}));assert.throws(()=>E.validatePolicy({...E.defaultPolicy(s),loss:-20}));assert.throws(()=>E.restore({...E.pack(s),commands:[...s.commands,0]}));
});
test('模型保持生活/意外/家庭计划一致；趋势决策不读取未来，单年对照仅改一个命令',()=>{
 const s=run(1989,(s,t)=>({...E.defaultPolicy(s),coverage:t%3,house:t===15?'buy':'keep',car:t===8?'buy':'keep'}));for(const model of C.models){const other=E.compare(s,model.id);assert.deepEqual(other.commands.filter((_,i)=>i%2===0),s.commands.filter((_,i)=>i%2===0));assert.deepEqual(other.history.map(r=>r.shock),s.history.map(r=>r.shock));for(let i=0;i<30;i++)for(const key of ['house','car','coverage'])assert.equal(other.commands[i*2+1][key],s.commands[i*2+1][key]);}
 const initial=life(E.start(1989)),p=E.defaultPolicy(initial),before=E.modelPolicy(initial,'trend',p),i=E.index(initial)+1,old=D.countries.JP.stock[i];try{D.countries.JP.stock[i]=old*100;assert.deepEqual(E.modelPolicy(initial,'trend',p),before);}finally{D.countries.JP.stock[i]=old;}
 const turn=15,changed=E.counterfactual(s,turn,{...s.commands[turn*2+1],w:[100,0,0,0]});for(let j=0;j<60;j++)if(j!==turn*2+1)assert.deepEqual(changed.commands[j],s.commands[j]);
});
test('4.0成绩/八人榜单跨设备重算；拒绝损坏比例与旧版本，不相信自填资产',()=>{
 const s=run(77),url=S.scoreUrl(s,'测试者'),rows=S.read(url);assert.equal(rows[0].metrics.net,E.net(s));assert.ok(url.length<1000);const packet=S.compact(s,'测试者');assert.equal(S.verify({...packet,net:99999999999}).metrics.net,E.net(s));const board=S.boardUrl(Array.from({length:8},(_,i)=>S.compact(s,'朋友'+i)));assert.equal(S.read(board).length,8);assert.throws(()=>S.verify({...packet,v:3}));assert.throws(()=>S.verify({...packet,c:packet.c.slice(0,-1)}));assert.throws(()=>S.verify({...packet,c:'1zzzzzz'+packet.c.slice(7)}));assert.throws(()=>S.compact(E.start(77),'未完成'));assert.throws(()=>S.read('CF4:'+S.encode(null)));assert.throws(()=>S.boardUrl([packet,S.compact(run(78),'其他场')]));
});
test('每个决策年份都有带出处的事件，只展示已过去的年份',()=>{
 for(let year=1978;year<=2019;year++){assert.ok(H.briefing(year).length>0);assert.ok(H.briefing(year).every(x=>x.year===year&&x.source.startsWith('https://')));assert.ok(H.available(year).every(x=>x.year<=year));}assert.equal(C.flavor.length,30);
});
