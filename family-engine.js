(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const E=node?require('./pro-engine.js'):root.ProEngine,D=node?require('./pro-data.js'):root.ProData;
const B=node?require('./world-engine.js'):root.WorldEngine,L=node?require('./world-content.js'):root.WorldContent;
const Stories=node?require('./family-stories.js'):root.FamilyStories;
const N=node?require('./family-story-engine.js'):root.FamilyNarrative;
const M=node?require('./family-monthly.js'):root.FamilyMonthly;
const comparisonVersion='comparison-7.0.0';
const version='family-7.0.0',schema=7,keys=E.keys,clone=x=>structuredClone(x),round=Math.round;
const presets=[{id:'reserve',name:'现金优先',w:[60,15,20,5],text:'多留一些随时可用的钱，投资仓位较少。'},{id:'balanced',name:'均衡配置',w:[20,40,30,10],text:'在四类金融资产之间分散安排。'},{id:'growth',name:'成长配置',w:[10,65,15,10],text:'股票仓位较多，接受更大的市场起伏。'}];
const models=[{id:'adaptive',name:'现金流管家',text:'规则智能体：按当时的收入缺口、必要支出和家庭责任预留现金，再分配投资。逐年公开理由，不调用大模型预测。'},{id:'balanced',name:'均衡模型',text:'每年现金20%、四国股票40%、美元国债模型30%、黄金10%。年内不调仓。'},{id:'reserve',name:'现金储备模型',text:'金融资产全部留现金，仍尝试与你相同的生活、保险和房车安排。'}];
const totalAssets=s=>E.financial(s)+s.house+s.car,totalDebt=s=>s.mortgage+s.debt;
function budget(s){const b=E.budget(s);return{...b,income:b.income+round(E.month(s)*(s.flags.salaryBonus||0))};}
function start(seed,mode='story'){if(!['story','auto','monthly','briefing'].includes(mode))throw Error('无效玩法');const s=E.start(seed);return{...s,...(mode!=='story'?{mode}:{}),...(['monthly','briefing'].includes(mode)?{monthlyFamily:M.newFamily()}:{}),version,commands:[],outcome:null,story:N.initial(s),flags:{...s.flags,salaryBonus:0,inherited:false,returning:false}};}
function policy(p){
 if(!p||p.loss||p.profit||(p.rebalance&&p.rebalance!=='none'))throw Error('基础篇不使用止盈止损或年内再平衡');
 const v=E.validatePolicy({...p,basket:p.basket??1,loss:0,profit:0,rebalance:'none'});
 if(p.response!==undefined&&!['home','work','care'].includes(p.response))throw Error('无效家庭应对');
 return{w:v.w,basket:v.basket,coverage:v.coverage,house:v.house,car:v.car,...(p.response?{response:p.response}:{})};
}
const legacy=p=>({...policy(p),loss:0,profit:0,rebalance:'none'});
const defaultPolicy=s=>({w:s.policy?[...s.policy.w]:[60,15,20,5],basket:s.policy?.basket??1,coverage:s.coverage,house:'keep',car:'keep'});
function receive(s,amount){const repaid=Math.min(s.debt,amount);s.debt-=repaid;s.cash+=amount-repaid;return repaid;}
function affordable(s,o){const n=clone(s);receive(n,round((o.gift||0)*E.month(s)));return E.pay(n,round((o.cost||0)*E.month(s))).gap===0;}
function event(s){
 if(s.phase!=='life'||s.turn>=30)throw Error('当前没有待选生活事件');
 let ch={...B.event(s),kind:'life',image:'family'};const r=B.noise(s.seed,600+s.turn)%100;
 // Anchor family responsibilities and anniversary goals; random scenes fill other years.
 const anchored=[0,2,3,4,5,6,9,12,13,15,18,19,21,25,29].includes(s.turn);
 if(s.flags.returning){ch={kind:'return',image:'career',title:'重新出发的这一年',story:'休整之后，你重新打开通讯录。简历上这一段空白，需要由新的工作慢慢填上。',choices:[{title:'先回到稳定岗位',text:'本年获得正常收入的90%；明年恢复正常。',incomeFactor:.9,set:{returning:false},mood:2},{title:'边接项目边进修',text:'本年获得正常收入的65%；技能+1，从明年起增加收入。',incomeFactor:.65,skill:1,set:{returning:false},mood:5}]};}
 else if(!anchored&&s.turn>=8&&!s.flags.inherited&&r<12){ch={kind:'inheritance',image:'inheritance',title:'长辈留下的一份托付',story:'整理长辈遗物时，一份存款手续终于办妥。照片和旧信留下来，这笔钱也需要一个去处。',choices:[{title:'把这份积蓄留给家庭',text:'收到8个月基础预算的遗产，先偿还欠款，其余进入现金。',gift:8,set:{inherited:true},mood:1},{title:'分出一半支持亲人',text:'收到8个月预算，再支出4个月支持亲人；其余留作储备。',gift:8,cost:4,set:{inherited:true},mood:7}]};}
 else if(!anchored&&s.turn>=1&&r<30){ch={kind:'layoff',image:'layoff',title:'公司裁员了',story:'会议只开了十分钟，你却要重新安排接下来一整年。纸箱装得下桌上的东西，装不下对明天的担心。',choices:[{title:'尽快寻找新工作',text:'按3个月求职空档模拟，本年获得正常收入的75%；明年恢复。',incomeFactor:.75,mood:-3},{title:'先休整，再慢慢找',text:'本年只获得正常收入的25%；下一年会出现重返工作的选择。',incomeFactor:.25,set:{returning:true},mood:5}]};}
 else if(!anchored&&r<50){ch={kind:'job',image:'career',title:'一份新工作的邀请',story:'朋友把招聘信息推了过来。职位听起来不错，但换环境和重新学习，也需要付出时间。',choices:[{title:'接受机会，学着适应',text:'花0.4个月预算；从明年起，每年工资增加1个月基础预算。',cost:.4,salaryBonus:1,mood:-2},{title:'留在熟悉的团队',text:'工资结构保持不变，生活节奏更从容。',mood:5}]};}
 else if(!anchored&&r>=50){let i=Math.floor((r-50)/10);if(s.history.at(-1)?.lifeEvent.kind===Stories.extra[i].kind)i=(i+1)%Stories.extra.length;ch=Stories.random(i);}
 ch=N.select(s,ch);
 if(!ch.choices.some(o=>affordable(s,o)))ch.choices[1]={id:'defer',title:'先缓一缓',text:'暂不新增支出。',reply:'我说明了眼前的困难，这次安排先缓一缓。',log:'资金不够，我暂缓了这次安排。',deferred:true};
 return ch;
}
function chooseLife(s,choice,forcedEvent){
 if(s.phase!=='life'||![0,1].includes(choice))throw Error('生活选择无效或已提交');
 const ch=forcedEvent||event(s),o=ch.choices[choice];if(!affordable(s,o))throw Error('当前资金不足，请选择另一项安排');
 const n=clone(s),b=budget(s),gift=round((o.gift||0)*b.month),cost=round((o.cost||0)*b.month);receive(n,gift);const paid=E.pay(n,cost);
 n.pending={choice,title:o.title,chapter:ch.title,event:clone(ch),opening:E.net(s),openingCash:s.cash,openingBalance:snapshot(s),gift,cost,payment:paid,income:round(b.income*(o.incomeFactor??1)),extra:round((o.extra||0)*b.month),month:b.month,skillBefore:s.flags.skill,incomeFactor:o.incomeFactor??1};
 n.flags.skill+=o.skill||0;n.flags.salaryBonus+=o.salaryBonus||0;
 for(const[k,v]of Object.entries(o.set||{})){if(k==='maintenance')n.flags.maintenanceUntil=s.turn+5;else{n.flags[k]=v;if(k==='insured')n.coverage=v?Math.max(1,n.coverage):0;}}
 n.pending.storyFeedback=N.onChoice(n,ch,o);n.phase='allocate';n.commands.push({type:'life',choice,eventId:ch.eventId,choiceId:o.id});n.revision++;return n;
}
function householdYear(s){
 if(!s.mode||s.phase!=='life')throw Error('当前无法进入配置');
 const n=clone(s),m=E.month(s),b=budget(s),birth=3+B.noise(s.seed,991)%8;
 const child=s.mode==='auto'&&s.turn===birth&&B.noise(s.seed,992)%100<75;
 if(child){n.flags.child=true;n.flags.housing=true;n.story.people.child.born=s.era+s.turn+1;}
 const title=child?'孩子出生了，需要更大的住处':'新一年的家庭安排';
 const story=child?'家里需要换一套更大的住处。系统计入搬家费用和更高的住房与育儿预算。房屋是否买入仍由你在配置时决定。':'家庭收入与开支按现有安排估算，意外账单和工资变化在年末揭晓。';
 n.pending={choice:null,title,chapter:title,event:{kind:'household',title,story},opening:E.net(s),openingCash:s.cash,openingBalance:snapshot(s),gift:0,cost:0,payment:{sale:0,fee:0,gap:0},income:b.income,extra:0,month:m,skillBefore:s.flags.skill,incomeFactor:1,householdBill:child?round(2*m):0};
 n.phase='allocate';n.commands.push({type:'auto'});n.revision++;
 return n;
}
function annualShock(s){
 if(s.mode!=='auto'){
  const shock=B.shock(s);return {...shock,gross:round(shock.gross/B.month(s)*E.month(s))};
 }
 const roll=B.noise(s.seed,7300+s.turn),month=E.month(s);
 const scenarios=[
  [9,'lottery','彩票中了小奖','中奖金到账，先进入家庭资金。',[4,8,16]],
  [21,'accident','一次交通事故','修理、交通和其他费用临时增加。',[2,4,6]],
  [36,'income','工资断了一段','工资延迟或求职空档拉长，实际收入减少。',[2,3,5]],
  [48,'medical','一张医疗账单','保障合同会降低这笔医疗自付。',[1.5,3,5]],
  [59,'repair','突然要修理家里的东西','维修不能拖到下一年。',[1,2,4]],
  [70,'bonus','这年多发了一笔奖金','实际收入高于年初估算。',[2,3,5]],
 ];
 const hit=scenarios.find(row=>roll%100<row[0]);
 return hit?{kind:hit[1],title:hit[2],text:hit[3],gross:round(month*hit[4][(roll>>>8)%3])}:{kind:'none',title:'平稳的一年',text:'没有额外收支。',gross:0};
}
function preview(s,p){
 if(p.response&&s.mode!=='briefing')throw Error('当前玩法未开放家庭应对');
 const a=E.preview(s,legacy(p));
 const arrangement=p.response?M.plan(s,a.state,p.response):null;
 const household=s.monthlyFamily?M.budget(a.state):{expense:0,annualExpense:0,blocked:0,raise:0};
 const income=round(s.pending.income*(1+household.raise)*(12-household.blocked)/12)+s.pending.extra;
 const necessaryMonthly=a.budget.monthlyExpense+household.expense;
 return {...a,arrangement,household,income,necessaryMonthly,months:a.state.cash/necessaryMonthly,knownFlow:income-a.budget.expense-a.budget.mortgagePayment-household.annualExpense-(arrangement?.cost||0)-(s.pending.householdBill||0)};
}
function mortgageSchedule(s){
 let balance=s.mortgage,remaining=0,lastPayment=0;
 while(balance>0){
  const due=E.budget({...s,mortgage:balance});
  if(due.principal<=0)throw Error('年供不足以偿还本金');
  balance-=due.principal;remaining++;lastPayment=due.mortgagePayment;
 }
 return {remaining,lastPayment};
}
function snapshot(s){return Object.fromEntries([...keys,'house','car','mortgage','debt'].map(k=>[k,s[k]]));}
function crisis(s){return s.debt>0||E.net(s)<0;}
function allocate(s,input){
 if(s.phase!=='allocate'||s.turn>=30)throw Error('配置已处理或阶段不符');
 const p=policy(input),a=preview(s,p),n=a.state,b=a.budget,pending=s.pending,monthly=[];
 const planCash=n.cash-s.cash;
 const market=E.marketPath(s,p.basket);
 const ledger=s.monthlyFamily?M.settle(s,n,b,market,a.arrangement):null;
 let gain=ledger?.gain||0,fees=pending.payment.fee+a.fees+a.trade.fee+(ledger?.fees||0);
 if(ledger)monthly.push(...ledger.monthly);
 if(!ledger)for(const row of market){const before=E.financial(n);keys.forEach((k,i)=>n[k]=round(n[k]*row.factors[i]));const g=E.financial(n)-before;gain+=g;monthly.push({month:row.month,date:row.date,gain:g,holdings:keys.map(k=>n[k]),financial:E.financial(n)});}
 const previousHouse=n.house,previousCar=n.car,j=s.era-1977+s.turn,c=D.countries[s.country],i=E.index(s);
 if(n.house)n.house=round(n.house*c.house[j+1]/c.house[j]);
 const markedCar=round(n.car*D.car[i+12]/D.car[i]*c.fx[i+12]/c.fx[i]);n.car=round(markedCar*.85);
 const houseGain=n.house-previousHouse,carGain=markedCar-previousCar,depreciation=markedCar-n.car;
 // Shock amounts use this edition's monthly CPI scale, not the old annual dataset.
 const surprise=ledger?{kind:'none',gross:0}:annualShock(s),discount=s.mode==='auto'?.05:0;
 let income=pending.income+pending.extra,bill=surprise.gross,covered=0,avoided=0,incomeShortfall=0;
 if(surprise.kind==='income'){avoided=Math.min(bill,round(pending.month*(Math.min(pending.skillBefore,4)*.2+(n.flags.network?.5:0))));incomeShortfall=Math.min(income,bill-avoided);income=Math.max(0,income-bill+avoided);bill=0;}
 if(['lottery','bonus'].includes(surprise.kind)){income+=bill;bill=0;}
 if(surprise.kind==='medical'){covered=round(bill*[0,.5,.8][n.coverage]);bill-=covered;}
 if(surprise.kind==='repair'&&n.flags.maintenanceUntil>s.turn){avoided=round(bill/2);bill-=avoided;}
 bill+=pending.householdBill||0;
 let paid={sale:0,fee:0,gap:0},billed=paid,repaid=0;
 if(ledger){
  income=ledger.income;bill=ledger.bill;covered=ledger.covered;
  paid={sale:ledger.forcedSale,fee:ledger.fees,gap:ledger.gap,stockSale:ledger.stockLiquidation,discount:ledger.stockDiscount};
  repaid=ledger.repaid;
 }else{
  const flow=income-b.expense-b.mortgagePayment;
  if(flow>=0)repaid=receive(n,flow);else paid=E.pay(n,-flow,discount);
  n.mortgage-=b.principal;billed=E.pay(n,bill,discount);fees+=paid.fee+billed.fee;
 }
 const expense=ledger?.expense??b.expense,flow=income-expense-b.mortgagePayment;
 n.turn++;n.revision++;n.pending=null;n.policy=p;n.commands.push({type:'allocate',policy:clone(p)});
 n.phase=crisis(n)?'crisis':n.turn===30?'ended':'life';n.outcome=n.phase==='ended'?'completed':null;
 const row={storyFeedback:pending.storyFeedback,necessaryMonthly:b.monthlyExpense,year:s.era+n.turn,title:pending.title,chapter:pending.chapter,lifeEvent:pending.event,choice:pending.choice,opening:pending.opening,openingCash:pending.openingCash,openingBalance:pending.openingBalance,familyUnpaid:paid.gap+billed.gap,cost:pending.cost,gift:pending.gift,policy:p,...(s.mode?{stockLiquidation:(paid.stockSale||0)+(billed.stockSale||0),stockDiscount:(paid.discount||0)+(billed.discount||0),householdBill:pending.householdBill,incomeShortfall}:{}),housePurchase:a.housePurchase??null,income,expense,premium:b.premium,mortgagePayment:b.mortgagePayment,principal:b.principal,interest:b.interest,flow,bill,covered,avoided,shock:surprise,gain,houseGain,carGain,depreciation,fees,monthly,notes:a.notes,forcedSale:paid.sale+billed.sale,plannedSale:pending.payment.sale+a.plannedSale,repaid,...snapshot(n),net:E.net(n),real:E.real(n),buffer:E.buffer(n)};
 if(s.mode==='briefing')Object.assign(row,{arrangement:a.arrangement,expectedIncome:a.income,expectedExpense:a.budget.expense+a.household.annualExpense,expectedBills:a.arrangement?.cost||0,entryHousePrice:E.housePrice(s),afterPlanCash:s.cash+planCash});
 if(ledger)Object.assign(row,{events:ledger.events,lowestCash:ledger.lowestCash,firstShortage:ledger.firstShortage,shock:{kind:'none',gross:0},necessaryMonthly:monthly.at(-1).expense+b.mortgagePayment/12,buffer:n.cash/(monthly.at(-1).expense+b.mortgagePayment/12)});
 row.familySurplus=income+pending.gift-expense-b.mortgagePayment-bill-pending.cost;
 row.cashMovements={lifeSales:pending.payment.sale-pending.payment.fee,plans:planCash,forcedSales:paid.sale+billed.sale-paid.fee-billed.fee,debtRepaid:-repaid,rescue:0};
 row.assetFlow=Object.values(row.cashMovements).reduce((sum,value)=>sum+value,0);
 const actualPayment=row.expense+row.mortgagePayment+row.bill+row.cost-row.familyUnpaid;
 if(row.openingCash+row.income+row.gift-actualPayment+row.assetFlow!==row.cash)throw Error('现金收付不守恒');
 const expected=pending.opening+pending.gift-pending.cost+gain+houseGain+carGain-depreciation +income-expense-b.interest-bill-fees;
 if(expected!==row.net)throw Error('年度账本不守恒');
 if(Object.values(snapshot(n)).some(x=>!Number.isSafeInteger(x)||x<0))throw Error('资产超出有效范围');
 n.history.push(row);if(!s.mode)N.afterYear(n,row);return n;
}
function rescuePreview(s){
 if(s.phase!=='crisis')throw Error('当前不需要危机处理');
 const p={w:[100,0,0,0],basket:1,coverage:s.coverage,house:'sell',car:'sell'};
 const a=E.preview({...clone(s),phase:'allocate',pending:{income:0,extra:0}},legacy(p)),n=a.state;
 if(n.debt){const owed=n.debt;n.debt=0;const paid=E.pay(n,owed);a.fees+=paid.fee;}
 return{state:n,canRecover:n.debt===0&&E.net(n)>=0,fees:a.fees+a.trade.fee,soldHouse:s.house,soldCar:s.car,unpaid:n.debt,net:E.net(n)};
}
function resolve(s,action){
 if(s.phase!=='crisis'||!['liquidate','bankrupt'].includes(action))throw Error('当前没有待处理的财务危机');
 const a=rescuePreview(s);if(action==='liquidate'&&!a.canRecover)throw Error('变卖后仍无法清偿，不能继续');
 const n=action==='liquidate'?a.state:clone(s);n.commands.push({type:'resolve',action});n.revision++;
 if(action==='liquidate'){
  n.policy=defaultPolicy(n);n.policy.w=[100,0,0,0];n.phase=n.turn===30?'ended':'life';n.outcome=n.turn===30?'completed':null;
  const row=n.history.at(-1);row.resolution={action,fees:a.fees,soldHouse:a.soldHouse,soldCar:a.soldCar,netBefore:row.net};row.fees+=a.fees;
  if(row.cashMovements){row.cashMovements.rescue+=n.cash-s.cash+row.familyUnpaid;row.assetFlow=Object.values(row.cashMovements).reduce((sum,v)=>sum+v,0);}
  Object.assign(row,snapshot(n),{net:E.net(n),real:E.real(n),buffer:E.buffer(n),familyUnpaid:0});
  if(!s.mode)N.recordCashGoal(n,row);
  if(row.net!==row.resolution.netBefore-a.fees)throw Error('处置账本不守恒');
 }else{n.phase='ended';n.outcome='bankrupt';n.history.at(-1).resolution={action,unpaid:s.debt,net:E.net(s)};}
 if(n.phase==='ended'&&!s.mode)N.finalize(n,n.history.at(-1),'本局在财务危机后结束');
 return n;
}
function dispatch(s,c){if(!c||c.revision!==s.revision||s.phase==='ended')throw Error('操作已过期或人生已结束');if(c.type==='auto')return householdYear(s);if(c.type==='life'){if(s.mode)throw Error('本局自动经历家庭事件');const e=event(s);if((c.eventId&&c.eventId!==e.eventId)||(c.choiceId&&c.choiceId!==e.choices[c.choice]?.id))throw Error('故事版本或选择标识不匹配');return chooseLife(s,c.choice);}if(c.type==='allocate')return allocate(s,c.policy);if(c.type==='resolve')return resolve(s,c.action);throw Error('未知操作');}
function pack(s){return{schema,version,dataVersion:D.version,storyVersion:N.version,comparisonVersion,seed:s.seed,...(s.mode?{mode:s.mode}:{}),commands:clone(s.commands)};}
function restore(raw){if(!raw||raw.schema!==schema||raw.version!==version||raw.dataVersion!==D.version||raw.storyVersion!==N.version||raw.comparisonVersion!==comparisonVersion||!Array.isArray(raw.commands)||raw.commands.length>90)throw Error('存档版本或选择记录不兼容');let s=start(raw.seed,raw.mode);for(const c of raw.commands){if(c.type==='life'&&(!c.eventId||!c.choiceId))throw Error('故事记录缺少事件或选择标识');s=dispatch(s,{...c,revision:s.revision});}return s;}
function advice(s,input){
 if(s.phase!=='allocate')throw Error('先完成生活选择再安排资金');
 const p=policy(input),base=preview(s,{...p,w:[100,0,0,0]}),b=base.budget,available=E.financial(base.state),income=base.income;
 const gap=Math.max(0,-base.knownFlow),interrupted=(s.pending.incomeFactor??1)<1||base.household.blocked>0;
 const months=interrupted?12:(b.child||base.state.monthlyFamily?.childAge>=0||base.state.mortgage)?9:6,target=round(base.necessaryMonthly*months+gap);
 let cash=available?Math.min(100,Math.max(20,Math.ceil(target/available*100))):100;
 const rest=100-cash,stock=Math.floor(rest*(interrupted?.4:.6)),bond=Math.floor(rest*(interrupted?.45:.3)),gold=rest-stock-bond;
 // Trading costs can make a nominal target miss its cash amount; verify the actual preview.
 let w=[cash,stock,bond,gold];
 while(w[0]<100&&preview(s,{...p,basket:1,w}).state.cash<target){const left=99-w[0];w=[w[0]+1,Math.floor(left*(interrupted?.4:.6)),Math.floor(left*(interrupted?.45:.3)),0];w[3]=100-w[0]-w[1]-w[2];}
 return{policy:{...p,basket:1,w},months,target,gap,available,income,expense:base.necessaryMonthly*12,interrupted,reason:interrupted?'本年收入受影响，先争取留足12个月必要支出和已知年度缺口。':months===9?'家中有孩子或房贷，先争取留足9个月必要支出和已知缺口。':'先争取留足6个月必要支出和已知年度缺口，再安排投资。',shortfall:Math.max(0,target-preview(s,{...p,basket:1,w}).state.cash)};
}
function modelPolicy(s,id,p){if(!models.some(m=>m.id===id))throw Error('未知模型');return id==='adaptive'?advice(s,p).policy:{...policy(p),basket:1,w:id==='reserve'?[100,0,0,0]:[20,40,30,10]};}
function compare(run,id){
 let s=start(run.seed,run.mode);
 for(const row of run.history){
  if(s.phase==='ended')break;
  try{s=s.mode?householdYear(s):chooseLife(s,row.choice,row.lifeEvent);}catch(e){if(!e.message.includes('资金不足'))throw e;s.phase='ended';s.outcome='plan_unaffordable';s.endNote='第'+(s.turn+1)+'年资金不足，无法执行相同生活选择';break;}
  const equivalent={...row.policy};
  if(equivalent.response&&M.response(s)?.id!==equivalent.response)delete equivalent.response;
  const explanation=id==='adaptive'?advice(s,equivalent):null;
  s=allocate(s,explanation?explanation.policy:modelPolicy(s,id,equivalent));if(explanation)s.history.at(-1).agentDecision=explanation;
  if(s.phase==='crisis')s=resolve(s,rescuePreview(s).canRecover?'liquidate':'bankrupt');
 }
 return s;
}
function metrics(s){let peak=E.net(start(s.seed)),drawdown=0;for(const row of s.history){peak=Math.max(peak,row.net);if(peak>0)drawdown=Math.max(drawdown,(peak-row.net)/peak*100);}return{net:E.net(s),real:E.real(s),cash:s.cash,buffer:E.buffer(s),assets:totalAssets(s),liabilities:totalDebt(s),debt:s.debt,mortgage:s.mortgage,years:s.turn,outcome:s.outcome,drawdown,fees:s.history.reduce((a,r)=>a+r.fees,0),forced:s.history.reduce((a,r)=>a+r.forcedSale,0)};}
function lifePreview(s,choice){const e=event(s),o=e.choices[choice];if(!o)throw Error('选择无效');const b=budget(s),n=clone(s),gift=round((o.gift||0)*b.month),cost=round((o.cost||0)*b.month);receive(n,gift);const paid=E.pay(n,cost);return{cost,gift,sale:paid.sale,fee:paid.fee,unpaid:paid.gap,cash:n.cash,incomeDelta:round(b.income*((o.incomeFactor??1)-1)+(o.extra||0)*b.month),nextIncome:round(b.month*((o.skill||0)*.8+(o.salaryBonus||0))),coverage:o.set?.insured,maintenance:!!o.set?.maintenance,housing:o.set?.housing,child:o.set?.child};}
function retryYear(run,index,input){
 if(!run.monthlyFamily||!Number.isInteger(index)||index<0||index>=run.turn)throw Error('请选择已结算年度');
 const commands=run.commands;
 let count=0,stop=commands.findIndex(cmd=>cmd.type==='allocate'&&count++===index);
 const opening=restore({...pack(run),commands:commands.slice(0,stop)});
 return allocate(opening,input).history.at(-1);
}
const api={retryYear,response:M.response,version,schema,storyVersion:N.version,comparisonVersion,lifePreview,mortgageSchedule,journal:N.journal,presets,models,keys,start,budget,event,affordable,defaultPolicy,policy,preview,allocate,dispatch,pack,restore,crisis,rescuePreview,modelPolicy,advice,compare,metrics,totalAssets,totalDebt,snapshot,net:E.net,financial:E.financial,real:E.real,month:E.month,buffer:E.buffer,known:E.known,identity:E.identity,validSeed:E.validSeed,housePrice:E.housePrice,carPrice:E.carPrice};
if(node)module.exports=api;else root.FamilyEngine=api;
})(globalThis);
