(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./content.js'):root.CFOContent;
  const percent=n=>Number.isInteger(n)&&n>=0&&n<=100;
  const validSeed=s=>Number.isInteger(s)&&s>=1&&s<=999999;
  function start(seed=1989,scenario='family'){
    if(!validSeed(seed)||!Object.hasOwn(C.scenarios,scenario))throw Error('无效的人生编号或家庭背景');
    return {version:C.version,seed,scenario,turn:0,cash:1000000,stock:0,debt:0,mood:65,flags:{},history:[],commands:[]};
  }
  const net=s=>s.cash+s.stock-s.debt;
  function annualExpense(s){return C.scenarios[s.scenario].expense+(s.flags.housing||0)+(s.flags.insured?60000:0);}
  function buffer(s){return s.cash/(annualExpense(s)/12);}
  function noise(seed,turn){let n=(seed ^ Math.imul(turn+1,0x9e3779b1))>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);return (n^(n>>>13))>>>0;}
  function shock(s){
    const n=noise(s.seed,s.turn)%3;
    if(s.turn===1)return {kind:'medical',gross:[300000,420000,540000][n],label:'家庭医疗账单'};
    if(s.turn===3)return {kind:'income',gross:[480000,600000,720000][n],label:'工时减少带来的收入损失'};
    if(s.turn===6)return {kind:'repair',gross:[120000,180000,240000][n],label:'临时维修账单'};
    return {kind:'none',gross:0,label:'没有额外意外支出'};
  }
  // Each payment is a balance-sheet transfer. Any uncovered bill stays as payable debt.
  function pay(s,amount){
    const cash=Math.min(s.cash,amount);s.cash-=cash;
    const sale=Math.min(s.stock,amount-cash);s.stock-=sale;
    const gap=amount-cash-sale;s.debt+=gap;
    return {cash,sale,gap};
  }
  function receive(s,amount){const repaid=Math.min(s.debt,amount);s.debt-=repaid;s.cash+=amount-repaid;return repaid;}
  function preparation(s,choiceId){
    if(s.turn>=7)throw Error('这一局已经结束');
    const ch=C.chapters[s.turn].choices.find(x=>x.id===choiceId);
    if(!ch)throw Error('选择不属于当前年份');
    const next=structuredClone(s);const before=net(s);
    const upfront=pay(next,ch.cost||0);
    for(const key of ['skill','insured','housing','reskill','goal','care'])if(ch[key])next.flags[key]=ch[key];
    next.mood=Math.max(0,Math.min(100,next.mood+(ch.mood||0)));
    return {next,ch,upfront,before};
  }
  function preview(s,choiceId,p){
    if(!percent(p))throw Error('现金比例必须在 0–100 之间');
    const {next,ch,upfront}=preparation(s,choiceId);
    const liquid=next.cash+next.stock;
    return {cash:Math.round(liquid*p/100),stock:liquid-Math.round(liquid*p/100),debt:next.debt,expense:annualExpense(next),cost:ch.cost||0,plannedSale:upfront.sale};
  }
  function advance(s,command){
    if(command.turn!==s.turn||s.turn>=7||!percent(command.percent))throw Error('这次操作已过期或无效');
    const {next:n,ch,upfront,before}=preparation(s,command.choice);
    const total=n.cash+n.stock;
    const allocatedCash=Math.round(total*command.percent/100),allocatedStock=total-allocatedCash;
    const trade=allocatedStock-n.stock;n.cash=allocatedCash;n.stock=allocatedStock;
    const close=C.prices[s.turn+1],open=C.prices[s.turn];
    const marketEnd=Math.round(n.stock*close/open),gain=marketEnd-n.stock;n.stock=marketEnd;
    let income=C.scenarios[s.scenario].income+(ch.extra||0)+(s.flags.skill?120000:0);
    const surprise=shock(s);let insurance=0,avoided=0,bill=0;
    if(surprise.kind==='income'){avoided=Math.min(surprise.gross,(n.flags.skill?120000:0)+(n.flags.reskill?240000:0));income-=surprise.gross-avoided;}
    else {bill=surprise.gross;if(surprise.kind==='medical'&&n.flags.insured){insurance=Math.round(bill/2);bill-=insurance;}}
    const expense=annualExpense(n),flow=income-expense;
    let repaid=0,annualPay={sale:0,gap:0};
    if(flow>=0)repaid=receive(n,flow);else annualPay=pay(n,-flow);
    const billPay=pay(n,bill);
    const forcedSale=annualPay.sale+billPay.sale;
    const row={year:C.years[s.turn+1],choice:ch.id,title:ch.title,percent:command.percent,opening:before,cost:ch.cost||0,allocatedCash,allocatedStock,trade,plannedSale:upfront.sale,gain,income,expense,flow,shock:surprise,insurance,avoided,bill,forcedSale,newDebt:upfront.gap+annualPay.gap+billPay.gap,repaid,cash:n.cash,stock:n.stock,debt:n.debt,net:net(n),mood:n.mood,buffer:buffer(n)};
    n.history.push(row);n.commands.push({turn:s.turn,choice:ch.id,percent:command.percent});n.turn++;
    return n;
  }
  function restore(raw){
    if(!raw||raw.version!==C.version||!Array.isArray(raw.commands)||raw.commands.length>7)throw Error('存档版本或内容不兼容');
    let s=start(raw.seed,raw.scenario);
    for(const command of raw.commands)s=advance(s,command);
    return s;
  }
  function pack(s){return {version:C.version,seed:s.seed,scenario:s.scenario,commands:s.commands};}
  function counterfactual(s,turn,p){
    if(!Number.isInteger(turn)||turn<0||turn>=s.commands.length||!percent(p))throw Error('请选择已经经历的年份');
    const raw=pack(s);raw.commands=s.commands.map((c,i)=>i===turn?{...c,percent:p}:c);return restore(raw);
  }
  const api={start,net,buffer,annualExpense,preview,advance,restore,pack,counterfactual,shock,percent,validSeed};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CFOEngine=api;
})(globalThis);
