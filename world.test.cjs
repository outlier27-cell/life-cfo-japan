'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const E=require('./world-engine'),C=require('./world-content'),D=require('./world-data'),S=require('./world-social'),V=require('./world-charts');
function play(seed=1989,route=()=>0,allocation=()=>[60,1]){let s=E.start(seed);for(let t=0;t<30;t++){s=E.dispatch(s,{type:'life',choice:route(t,s),revision:s.revision});const[p,b]=allocation(t,s);s=E.dispatch(s,{type:'allocate',percent:p,basket:b,revision:s.revision});}return s;}
test('11 个冻结数据序列的哈希、43 个完整观测年份和字段全部可追溯',()=>{
 const manifest=require('./data/manifest.json');assert.equal(manifest.series.length,11);
 for(const x of manifest.series){const raw=fs.readFileSync(path.join(__dirname,x.file),'utf8');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),x.sha256);}
 for(const [id,c]of Object.entries(D.countries))for(const key of ['prices','cpiValues','fxValues']){assert.equal(c[key].length,43,id+key);assert.ok(c[key].every(v=>Number.isFinite(v)&&v>0));}
 assert.equal(D.countries.JP.prices[1988-1978],148.4266);assert.equal(D.countries.GB.fxValues[1988-1978],.547390005);
});
test('2,048 局 × 60 次选择守恒、无负持仓，覆盖 36 个国家年代家庭组合',()=>{
 const identities=new Set(),events=new Set();
 for(let seed=1;seed<=2048;seed++){
  const s=play(seed,(t)=>E.noise(seed,t+500)%2,(t)=>[E.noise(seed,t+800)%101,E.noise(seed,t+900)%2]);
  identities.add(s.country+s.era+s.household);assert.equal(s.revision,60);assert.equal(s.phase,'ended');assert.equal(s.commands.length,60);assert.equal(s.history.length,30);
  for(const r of s.history){events.add(r.shock.kind);assert.equal(r.net,r.opening-r.cost+r.gain+r.flow-r.bill);assert.equal(r.net,r.cash+r.stock-r.debt);assert.ok(r.cash>=0&&r.stock>=0&&r.debt>=0);assert.ok(Number.isSafeInteger(r.net));assert.ok(Number.isFinite(r.real));}
 }
 assert.equal(identities.size,36);assert.equal(events.size,4);
});
test('每一步都可重放，生活选择后刷新不重复支付，重复提交被拒绝',()=>{
 let s=E.start(97);for(let i=0;i<60;i++){const old=s;const command=i%2?{type:'allocate',percent:40,basket:1,revision:i}:{type:'life',choice:0,revision:i};s=E.dispatch(s,command);assert.deepEqual(E.restore(E.pack(s)),s);assert.equal(old.revision,i);assert.throws(()=>E.dispatch(s,command));}
 assert.throws(()=>E.dispatch(s,{type:'life',choice:0,revision:60}));
});
test('现金比例 0/100、技能延后生效、育儿期限、住房和保障效果明确',()=>{
 let a=E.start(10),b=E.start(10);a=E.dispatch(a,{type:'life',choice:0,revision:0});b=E.dispatch(b,{type:'life',choice:1,revision:0});assert.equal(a.pending.income,b.pending.income);
 a=E.dispatch(a,{type:'allocate',percent:100,basket:0,revision:1});assert.equal(a.stock,0);assert.equal(a.history[0].gain,0);
 let s=play(1989);assert.ok(s.flags.child);assert.ok(E.budget({...s,turn:22}).child);assert.equal(E.budget({...s,turn:23}).child,false);assert.ok(s.flags.skill>0);
 for(let t=0;t<30;t++)assert.equal(s.history[t].covered,s.history[t].shock.kind==='medical'?Math.round(s.history[t].shock.gross/2):0);
});
test('四国组合的汇率换算与等权计算可独立复核',()=>{
 const s=E.start(1989),i=s.era-1978,home=D.countries[s.country];
 const expected=Object.values(D.countries).reduce((a,c)=>a+c.prices[i+1]/c.prices[i]*(home.fxValues[i+1]/c.fxValues[i+1])/(home.fxValues[i]/c.fxValues[i]),0)/4;
 assert.equal(E.market(s).global,expected);assert.equal(E.market(s).local,home.prices[i+1]/home.prices[i]);
});
test('对照只改变一个资产命令，保留全部生活选择与外生事件',()=>{
 const s=play(1989),o=E.counterfactual(s,11,0,0);assert.deepEqual(s.commands.filter((_,i)=>i!==23),o.commands.filter((_,i)=>i!==23));assert.deepEqual(s.history.map(r=>r.shock),o.history.map(r=>r.shock));assert.deepEqual(s.history.slice(0,11),o.history.slice(0,11));assert.notEqual(E.net(s),E.net(o));
});
test('成绩与榜单跨设备往返，只信任命令，不接受自报资产或不完整成绩',()=>{
 const s=play(1989),url=S.scoreUrl(s,'笑看人生'),row=S.read(url)[0];assert.equal(row.name,'笑看人生');assert.deepEqual(row.run,s);
 assert.equal(S.verify({...row.packet,net:999999999}).metrics.net,E.net(s));
 assert.throws(()=>S.compact(E.start(1),'未完成'));assert.throws(()=>S.verify({...row.packet,c:'0'.repeat(119)}));assert.throws(()=>S.verify({...row.packet,c:'0zz1'+row.packet.c.slice(4)}));
 const other=S.compact(play(1989,()=>1),'另一位'),board=S.boardUrl([row.packet,other]);assert.equal(S.read(board).length,2);assert.ok(board.length<4000);
 const merged=S.merge([row.packet],[other,row.packet]);assert.equal(merged.length,2);assert.equal(S.ranking(merged,1989).length,2);assert.equal(S.ranking(merged,1).length,0);
 assert.throws(()=>S.boardUrl([row.packet,S.compact(play(1),'异场')]));assert.throws(()=>S.read('https://example.com/#score=invalid'));
});
test('错误输入、不同版本、超长存档被拒绝；市场不提前展开',()=>{
 for(const seed of [0,-1,NaN,1.1,1e10,'1989'])assert.throws(()=>E.start(seed));
 const s=E.start(1),raw=E.pack(s);assert.throws(()=>E.restore({...raw,version:'future'}));assert.throws(()=>E.restore({...raw,dataVersion:'future'}));assert.throws(()=>E.restore({...raw,commands:Array(61).fill(0)}));assert.throws(()=>E.dispatch(s,{type:'allocate',percent:60,basket:1,revision:0}));
 const a=E.dispatch(s,{type:'life',choice:0,revision:0});for(const percent of [-1,101,1.1,'60',NaN])assert.throws(()=>E.preview(a,percent));assert.equal(E.marketHistory(a).years.length,1);
 assert.equal(E.marketHistory(play()).years.length,31);assert.equal(C.chapters.length,30);
});
test('图表支持负资产、长序列、空变动与精确数据，不产生坏值',()=>{
 const html=V.line([{name:'<测试>',color:'#852d26',values:[-100,0,200]}],[1990,1991,1992]);assert.ok(html.includes('&lt;测试&gt;'));assert.ok(!/NaN|undefined|Infinity/.test(html));assert.ok(V.bars([{label:'账单',value:0,text:'0'}]).includes('0%'));assert.ok(!V.split(0).includes('NaN'));
});
