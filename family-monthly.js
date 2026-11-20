(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const E=node?require('./pro-engine.js'):root.ProEngine;
const B=node?require('./world-engine.js'):root.WorldEngine;
const round=Math.round, discount=.05;
const definitions={
 birth:['添丁，需要更大的住处','搬家费当月到期，住房和育儿支出随后上升。'],
 school:['孩子入学','准备书本、校服和交通费用。'],
 care:['长辈需要照料','首次支出增加，之后还有一段照护开支。'],
 layoff:['收入中断','从本月起暂停工资，找到工作之后才恢复。'],
 rehire:['找到新工作','本月恢复工资，之后按新工资结算。'],
 promotion:['调岗加薪','新工资从本月开始。'],
 bonus:['年终奖金','奖金到账，成为可用现金。'],
 inheritance:['遗产到账','办完手续后，这笔钱才到账。'],
 lottery:['彩票中奖','低频的意外收入。'],
 medical:['临时住院','先垫付医疗费，保障赔款两个月后到账。'],
 accident:['交通事故','本月有额外交通和善后费用。'],
 car:['车辆大修','维修费需要当月支付。'],
 house:['住房维修','住房维修账单当月到期。'],
 payout:['医疗赔款到账','此前垫付的医疗费现在获得赔付。']
};
const mix=(s,year,salt)=>B.noise(s.seed,30000+year*139+salt);
const each=(n,m)=>Math.floor(n/12)+(m<=n%12?1:0);
function timeline(s){
 const y=s.turn, roll=i=>mix(s,y,i), schedule=[], annual=(kind,i,p,lo,hi,condition=true)=>{
  if(condition&&roll(i)%1000<p)push(kind,1+roll(i+1)%12,lo,hi,i+2);
 };
 const push=(kind,month,lo=0,hi=lo,salt=0)=>{
  const units=lo+(hi-lo)*(roll(salt)%101)/100;
  schedule.push({kind,month,amount:round(s.pending.month*units),title:definitions[kind][0],text:definitions[kind][1]});
 };
 const birthYear=2+mix(s,0,91)%11;
 if(mix(s,0,92)%100<78&&y===birthYear)push('birth',1+roll(20)%12,1,2,21);
 if(s.monthlyFamily.childAge>=60&&s.monthlyFamily.childAge<72&&!s.monthlyFamily.school)
  push('school',9,1,2,24);
 if(y===10+mix(s,0,93)%18&&mix(s,0,94)%100<65)push('care',1+roll(25)%12,.7,2,26);
 if(y===12+mix(s,0,95)%17&&mix(s,0,96)%100<33)push('inheritance',1+roll(27)%12,3,11,28);
 annual('layoff',30,135,0,0);
 annual('promotion',35,120,0,0);
 annual('accident',40,95,1.8,6.5);
 annual('medical',45,140,1.5,7);
 annual('car',50,195,1,4);
 annual('house',55,170,2,6);
 annual('lottery',60,8,8,32);
 if(roll(65)%1000<430)push('bonus',12,1.2,3.8,66);
 return schedule.sort((a,b)=>a.month-b.month);
}
function newFamily(){
 return {childAge:-1,school:false,care:0,unemployed:0,raise:0,claims:[]};
}
function settle(open,n,b,market){
 const f=n.monthlyFamily, schedule=timeline(open), annualWage=open.pending.income;
 const out={gain:0,fees:0,income:0,expense:0,mortgagePayment:0,principal:0,interest:0,bill:0,covered:0,forcedSale:0,stockLiquidation:0,stockDiscount:0,repaid:0,gap:0,netSale:0,events:[],monthly:[]};
 let lowestCash=Infinity, firstShortage=null;
 for(const point of market){
  const m=point.month,openingCash=n.cash,openingDebt=n.debt;
  const before=E.financial(n);
  E.keys.forEach((k,i)=>n[k]=round(n[k]*point.factors[i]));
  const gain=E.financial(n)-before;
  const month={month:m,date:point.date,gain,openingCash,openingDebt,income:0,expense:0,bill:0,mortgagePayment:0,covered:0,forcedSale:0,stockDiscount:0,repaid:0,gap:0,netSale:0,events:[]};
  const receive=amount=>{
   const repaid=Math.min(amount,n.debt);n.debt-=repaid;n.cash+=amount-repaid;
   month.repaid+=repaid;
  };
  const pay=amount=>{
   if(amount>n.cash&&firstShortage===null)firstShortage=m;
   const p=E.pay(n,amount,discount);
   month.forcedSale+=p.sale;month.stockDiscount+=p.discount;month.gap+=p.gap;month.netSale+=p.sale-p.fee;
   out.fees+=p.fee;out.stockLiquidation+=p.stockSale;
  };
  const record=(kind,amount,direction)=>{
   const [title,text]=definitions[kind];
   const entry={kind,month:m,amount,direction,title,text};
   month.events.push(entry);out.events.push(entry);
  };
  for(const claim of f.claims)claim.wait--;
  const due=f.claims.filter(c=>c.wait===0);
  f.claims=f.claims.filter(c=>c.wait>0);
  for(const c of due){receive(c.amount);month.covered+=c.amount;record('payout',c.amount,'in');}
  const recovering=f.unemployed===1;
  if(recovering){f.unemployed=0;f.raise=Math.max(-.4,f.raise-.04+mix(open,open.turn,103)%9/100);record('rehire',0,'change');}
  const dueEvents=schedule.filter(e=>e.month===m);
  for(const e of dueEvents){
   if(e.kind==='layoff'&&!f.unemployed){f.unemployed=3+mix(open,open.turn,75)%6;record(e.kind,0,'change');}
   if(e.kind==='promotion'&&!f.unemployed){f.raise+=.08;record(e.kind,0,'change');}
   if(e.kind==='birth')f.childAge=0;
   if(e.kind==='school')f.school=true;
   if(e.kind==='care')f.care=12+mix(open,open.turn,77)%25;
  }
  const missed=f.unemployed>0;
  const wage=missed?0:round(each(annualWage,m)*(1+f.raise));
  month.income+=wage;receive(wage);
  if(f.unemployed>1)f.unemployed--;
  const child=f.childAge>=0&&f.childAge<216;
  const household=round(open.pending.month*((child?.19:0)+(f.care>0?.15:0)+(f.childAge>=0&&!n.house?.1:0)));
  if(f.care>0)f.care--;
  if(f.childAge>=0)f.childAge++;
  month.expense=each(b.expense,m)+household;pay(month.expense);
  const principal=each(b.principal,m);
  month.mortgagePayment=principal+each(b.interest,m);pay(month.mortgagePayment);n.mortgage-=principal;
  for(const e of dueEvents){
   if(['layoff','promotion'].includes(e.kind))continue;
   if((e.kind==='house'&&!n.house)||(e.kind==='car'&&!n.car))continue;
   if(['bonus','lottery','inheritance'].includes(e.kind)){
    if(e.kind==='bonus'&&missed)continue;
    month.income+=e.amount;receive(e.amount);record(e.kind,e.amount,'in');
   }else{
    month.bill+=e.amount;pay(e.amount);record(e.kind,e.amount,'out');
    if(e.kind==='medical'){
     const covered=round(e.amount*[0,.5,.8][n.coverage]);
     if(covered)f.claims.push({wait:2,amount:covered});
    }
   }
  }
  month.cash=n.cash;month.debt=n.debt;month.financial=E.financial(n);month.holdings=E.keys.map(k=>n[k]);
  if(openingCash+month.income+month.covered-month.expense-month.bill-month.mortgagePayment+month.gap+month.netSale-month.repaid!==month.cash)
   throw Error('月度现金收付不守恒');
  if(openingDebt+month.gap-month.repaid!==n.debt)throw Error('月度欠款余额不守恒');
  lowestCash=Math.min(lowestCash,n.cash);
  for(const k of ['gain','income','expense','mortgagePayment','covered','forcedSale','stockDiscount','repaid','gap','netSale'])out[k]+=month[k];
  out.bill+=month.bill-month.covered;
  out.monthly.push(month);
 }
 out.lowestCash=lowestCash;out.firstShortage=firstShortage;out.principal=b.principal;out.interest=b.interest;
 return out;
}
function budget(s){
 const month=E.month(s),f=s.monthlyFamily;
 const rent=f.childAge>=0&&!s.house?.1:0;
 const childMonths=f.childAge>=0?Math.max(0,Math.min(12,216-f.childAge)):0;
 const careMonths=Math.min(12,f.care);
 const expense=round(month*(rent+(childMonths?.19:0)+(careMonths?.15:0)));
 const annualExpense=round(month*(rent*12+childMonths*.19+careMonths*.15));
 return {expense,annualExpense,blocked:Math.min(12,Math.max(0,f.unemployed-1)),raise:f.raise};
}
const api={budget,newFamily,timeline,settle,definitions};
if(node)module.exports=api;else root.FamilyMonthly=api;
})(globalThis);
