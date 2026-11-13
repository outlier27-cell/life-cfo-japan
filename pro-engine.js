(function(r){'use strict';
const node=typeof module!=='undefined'&&module.exports,C=node?require('./pro-content.js'):r.ProContent,D=node?require('./pro-data.js'):r.ProData,B=node?require('./world-engine.js'):r.WorldEngine,L=node?require('./world-content.js'):r.WorldContent;
const keys=['cash','stock','bond','gold'],copy=x=>structuredClone(x),round=Math.round,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const financial=s=>keys.reduce((a,k)=>a+s[k],0),net=s=>financial(s)+s.house+s.car-s.mortgage-s.debt;
const index=(s,t=s.turn)=>(s.era-1977+t)*12;
const inflation=(s,t=s.turn)=>D.countries[s.country].cpi[index(s,t)]/D.countries[s.country].cpi[index(s,0)];
const month=(s,t=s.turn)=>round(D.countries[s.country].monthly*inflation(s,t));
const real=s=>round(net(s)/inflation(s));
function payment(principal,years=C.mortgageYears){return round(principal*C.mortgageRate/(1-Math.pow(1+C.mortgageRate,-years)));}
function budget(s){
 const m=month(s),h=L.households[s.household],child=s.flags.child&&s.turn<23;
 const premium=m*[0,.6,1.2][s.coverage],living=round(m*(h.expense+(s.flags.housing?2.4:0)+(child?2:0)-(s.house?3:0)+(s.house?.5:0)+(s.car?.6:0)));
 const interest=round(s.mortgage*C.mortgageRate),mortgagePayment=s.mortgage?Math.min(s.mortgage+interest,s.mortgagePayment):0;
 return{month:m,income:round(m*(h.income+s.flags.skill*.8)),living,premium:round(premium),expense:living+round(premium),interest,mortgagePayment,principal:Math.max(0,mortgagePayment-interest),monthlyExpense:(living+round(premium)+mortgagePayment)/12,child};
}
const buffer=s=>s.cash/budget(s).monthlyExpense;
function start(seed){const s=B.start(seed);return{...s,version:C.version,dataVersion:D.version,bond:0,gold:0,house:0,car:0,mortgage:0,mortgagePayment:0,coverage:0,policy:null};}
function validatePolicy(p){
 if(!p||!Array.isArray(p.w)||p.w.length!==4||p.w.some(x=>!Number.isInteger(x)||x<0||x>100)||p.w.reduce((a,b)=>a+b,0)!==100||![0,1].includes(p.basket)||![0,10,20,30].includes(p.loss)||![0,20,40,60].includes(p.profit)||!['none','quarter','band'].includes(p.rebalance)||![0,1,2].includes(p.coverage)||!['keep','buy','sell'].includes(p.house)||!['keep','buy','sell'].includes(p.car))throw Error('配置无效：比例须合计100%，规则与家庭安排须有效');
 return{w:[...p.w],basket:p.basket,loss:p.loss,profit:p.profit,rebalance:p.rebalance,coverage:p.coverage,house:p.house,car:p.car};
}
function defaultPolicy(s){return{w:s.policy?[...s.policy.w]:[20,40,30,10],basket:s.policy?.basket??1,loss:s.policy?.loss??0,profit:s.policy?.profit??0,rebalance:s.policy?.rebalance??'quarter',coverage:s.coverage,house:'keep',car:'keep'};}
function pay(s,amount){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('无效支付');
 const cash=Math.min(s.cash,amount);s.cash-=cash;let remaining=amount-cash,sale=0,fee=0;
 for(const k of ['bond','gold','stock']){if(!remaining)break;const x=Math.min(s[k],Math.ceil(remaining/(1-C.financialFee)));const f=round(x*C.financialFee),proceeds=x-f;s[k]-=x;sale+=x;fee+=f;const used=Math.min(remaining,proceeds);remaining-=used;s.cash+=proceeds-used;}
 s.debt+=remaining;return{sale,fee,gap:remaining};
}
function receive(s,amount){const repay=Math.min(s.debt,amount);s.debt-=repay;s.cash+=amount-repay;return repay;}
function event(s){const ch=B.event(s);ch.story=C.flavor[s.turn]+' '+ch.story;
 if(s.turn===2||s.turn===13){ch.choices[0].text='把家庭保障列入计划；下一步可选基础或加强保障，保费与赔付比例会清楚列出。';ch.choices[1].text='暂由自己的储备承担；下一步仍可复核保障级别。';}
 return ch;
}
function chooseLife(s,choice){
 if(s.phase!=='life'||s.turn>=30||![0,1].includes(choice))throw Error('生活选择无效或已提交');
 const ch=event(s),o=ch.choices[choice],n=copy(s),b=budget(s),cost=round((o.cost||0)*b.month),paid=pay(n,cost);
 n.pending={choice,title:o.title,chapter:ch.title,opening:net(s),cost,payment:paid,income:b.income,extra:round((o.extra||0)*b.month),month:b.month,skillBefore:s.flags.skill};
 if(o.skill)n.flags.skill+=o.skill;
 for(const[k,v]of Object.entries(o.set||{})){if(k==='maintenance')n.flags.maintenanceUntil=s.turn+5;else{n.flags[k]=v;if(k==='insured')n.coverage=v?Math.max(1,n.coverage):0;}}
 n.mood=clamp(n.mood+(o.mood||0),0,100);n.phase='allocate';n.commands.push(choice);n.revision++;return n;
}
function housePrice(s){const c=D.countries[s.country],j=s.era-1977;return round(c.monthly*C.houseMonths*c.house[j+s.turn]/c.house[j]);}
function carPrice(s){const c=D.countries[s.country],i=index(s),j=index(s,0);return round(c.monthly*C.carMonths*D.car[i]/D.car[j]*c.fx[i]/c.fx[j]);}
function plans(s,p){
 const n=copy(s),notes=[],result={fees:0,plannedSale:0,notes,houseBought:false,carBought:false};n.coverage=p.coverage;n.flags.insured=p.coverage>0;
 const purchase=(cost)=>{if(n.debt)return false;const trial=copy(n),paid=pay(trial,cost);if(paid.gap)return false;keys.forEach(k=>n[k]=trial[k]);result.fees+=paid.fee;result.plannedSale+=paid.sale;return true;};
 if(p.house==='sell'&&n.house){const proceeds=n.house-round(n.house*C.propertyFee),fee=n.house-proceeds,owed=n.mortgage;n.house=0;n.mortgage=0;n.mortgagePayment=0;result.fees+=fee;if(proceeds>=owed)receive(n,proceeds-owed);else{const paid=pay(n,owed-proceeds);result.fees+=paid.fee;result.plannedSale+=paid.sale;}notes.push('已出售住房并结清对应房贷；交易费计入账本。');}
 if(p.car==='sell'&&n.car){receive(n,n.car);n.car=0;notes.push('已按当前折旧后估值出售汽车。');}
 if(p.house==='buy'&&!n.house){const price=housePrice(s),loan=round(price*.7),down=price-loan,fee=round(price*C.propertyFee);if(purchase(down+fee)){n.house=price;n.mortgage=loan;n.mortgagePayment=payment(loan);result.fees+=fee;result.houseBought=true;notes.push('已购入住房：首付30%，固定5%利率、20年等额年付教学房贷。');}else notes.push('住房计划未执行：金融资产需覆盖首付、交易费，且不能有未付款。');}
 if(p.car==='buy'&&!n.car){const price=carPrice(n);if(purchase(price)){n.car=price;result.carBought=true;notes.push('已全款购入教学汽车；估值随美国新车价格参考及汇率变化，再计每年15%折旧。');}else notes.push('购车计划未执行：可动用资产不足或仍有未付款。');}
 return{state:n,...result};
}
function rebalance(s,w){
 const total=financial(s);if(!total)return{fee:0,turnover:0};
 const target=t=>{const a=w.map((v,i)=>i?Math.floor(t*v/100):0);a[0]=t-a[1]-a[2]-a[3];return a;};
 const feeAt=t=>round(keys.slice(1).reduce((a,k,j)=>a+Math.abs(target(t)[j+1]-s[k]),0)*C.financialFee);
 let lo=0,hi=total;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(mid+feeAt(mid)<=total)lo=mid;else hi=mid-1;}
 const a=target(lo),fee=feeAt(lo);a[0]+=total-lo-fee;const turnover=keys.slice(1).reduce((sum,k,j)=>sum+Math.abs(a[j+1]-s[k]),0);keys.forEach((k,i)=>s[k]=a[i]);return{fee,turnover};
}
function preview(s,policy){
 if(s.phase!=='allocate')throw Error('请先完成生活选择');const p=validatePolicy(policy),plan=plans(s,p),b=budget(plan.state),trade=rebalance(plan.state,p.w);
 return{...plan,trade,budget:b,months:buffer(plan.state),financial:financial(plan.state),housePrice:housePrice(s),carPrice:carPrice(s),knownFlow:s.pending.income+s.pending.extra-b.expense-b.mortgagePayment};
}
function bondPrice(coupon,yieldRate,elapsed){let price=0;for(let k=1;k<=20;k++){const time=k/2-elapsed;if(time>1e-10)price+=(coupon/2+(k===20?100:0))/Math.pow(1+yieldRate/200,time*2);}return price;}
function marketPath(s,basket=1){
 const startIndex=index(s),c=D.countries[s.country],coupon=D.yield[startIndex],rows=[];let lastStock=1,lastGold=1,lastBond=100,bondLevel=1;
 for(let m=1;m<=12;m++){const i=startIndex+m,fx=c.fx[i]/c.fx[startIndex];
  const stock=basket===0?c.stock[i]/c.stock[startIndex]:Object.values(D.countries).reduce((v,p)=>v+(p.stock[i]/p.stock[startIndex])*(c.fx[i]/p.fx[i])/(c.fx[startIndex]/p.fx[startIndex]),0)/4;
  const gold=D.gold[i]/D.gold[startIndex]*fx,price=bondPrice(coupon,D.yield[i],m/12),couponPaid=m===6||m===12?coupon/2:0;
  const bondFactor=(price+couponPaid)/lastBond*c.fx[i]/c.fx[i-1];
  bondLevel*=bondFactor;rows.push({month:m,date:D.dates[i].slice(0,7),factors:[1,stock/lastStock,bondFactor,gold/lastGold],stock,gold,bond:bondLevel,yield:D.yield[i]});lastStock=stock;lastGold=gold;lastBond=price;
 }return rows;
}
function known(s){const i=index(s),c=D.countries[s.country],prev=i-12;
 const global=Object.values(D.countries).reduce((a,p)=>a+(p.stock[i]/p.stock[prev])*(c.fx[i]/p.fx[i])/(c.fx[prev]/p.fx[prev]),0)/4-1;
 return{year:s.era+s.turn,local:c.stock[i]/c.stock[prev]-1,global,gold:D.gold[i]/D.gold[prev]*c.fx[i]/c.fx[prev]-1,cpi:c.cpi[i]/c.cpi[prev]-1,yield:D.yield[i],yieldChange:D.yield[i]-D.yield[prev],house:c.house[s.era-1977+s.turn]/c.house[s.era-1977+s.turn-1]-1};
}
function allocate(s,policy){
 if(s.phase!=='allocate'||s.turn>=30)throw Error('配置已处理或阶段不符');const p=validatePolicy(policy),plan=plans(s,p),n=plan.state,pending=s.pending,b=budget(n),initial=rebalance(n,p.w);
 let gain=0,fees=pending.payment.fee+plan.fees+initial.fee,turnover=plan.plannedSale+initial.turnover,rebalanceCount=1;const trades=[],monthly=[],locked=new Set(),reference={stock:1,bond:1,gold:1};
 for(const row of marketPath(n,p.basket)){
  const before=financial(n);keys.forEach((k,i)=>n[k]=round(n[k]*row.factors[i]));const marketGain=financial(n)-before;gain+=marketGain;let monthFee=0;
  for(const k of ['stock','bond','gold']){if(locked.has(k)||!n[k])continue;const change=row[k]/reference[k]-1,loss=p.loss&&change<=-p.loss/100+1e-12,profit=p.profit&&change>=p.profit/100-1e-12;if(loss||profit){const sold=n[k],fee=round(sold*C.financialFee);n.cash+=sold-fee;n[k]=0;monthFee+=fee;turnover+=sold;locked.add(k);trades.push({month:row.month,kind:loss?'止损':'止盈',asset:k,change,amount:sold,fee});}}
  const effective=[...p.w];for(const k of locked){const j=keys.indexOf(k);effective[0]+=effective[j];effective[j]=0;}
  const total=financial(n),drift=total?Math.max(...keys.map((k,i)=>Math.abs(n[k]/total*100-effective[i]))):0;
  if((p.rebalance==='quarter'&&row.month%3===0)||(p.rebalance==='band'&&drift>=10-1e-9)){
   const reb=rebalance(n,effective);monthFee+=reb.fee;turnover+=reb.turnover;rebalanceCount++;trades.push({month:row.month,kind:'再平衡',amount:reb.turnover,fee:reb.fee});
  }
  fees+=monthFee;monthly.push({month:row.month,date:row.date,gain:marketGain,fees:monthFee,financial:financial(n),holdings:keys.map(k=>n[k])});
 }
 const previousHouse=n.house,previousCar=n.car,hp=D.countries[n.country].house,j=n.era-1977+n.turn;
 if(n.house)n.house=round(n.house*hp[j+1]/hp[j]);const ci=index(s),currency=D.countries[s.country];const carMarked=round(n.car*D.car[ci+12]/D.car[ci]*currency.fx[ci+12]/currency.fx[ci]);n.car=round(carMarked*(1-C.carDepreciation));const houseGain=n.house-previousHouse,carGain=carMarked-previousCar,depreciation=carMarked-n.car;
 const surprise=B.shock(s);let income=pending.income+pending.extra,bill=surprise.gross,covered=0,avoided=0;
 if(surprise.kind==='income'){avoided=Math.min(surprise.gross,round(pending.month*(Math.min(pending.skillBefore,4)*.2+(n.flags.network?.5:0))));income-=surprise.gross-avoided;bill=0;}
 else if(surprise.kind==='medical'){covered=round(bill*[0,.5,.8][n.coverage]);bill-=covered;}
 else if(surprise.kind==='repair'&&n.flags.maintenanceUntil>s.turn){avoided=round(bill/2);bill-=avoided;}
 const flow=income-b.expense-b.mortgagePayment;let flowPayment={sale:0,fee:0,gap:0},repaid=0;
 if(flow>=0)repaid=receive(n,flow);else flowPayment=pay(n,-flow);n.mortgage-=b.principal;
 const billPayment=pay(n,bill);fees+=flowPayment.fee+billPayment.fee;turnover+=flowPayment.sale+billPayment.sale;
 n.turn++;n.revision++;n.phase=n.turn===30?'ended':'life';n.pending=null;n.policy=p;n.commands.push(copy(p));
 const row={year:s.era+n.turn,choice:pending.choice,title:pending.title,chapter:pending.chapter,opening:pending.opening,cost:pending.cost,policy:copy(p),income,expense:b.expense,premium:b.premium,mortgagePayment:b.mortgagePayment,principal:b.principal,interest:b.interest,flow,bill,covered,avoided,shock:surprise,gain,houseGain,depreciation,fees,turnover,rebalanceCount,trades,monthly,notes:plan.notes,forcedSale:flowPayment.sale+billPayment.sale,plannedSale:pending.payment.sale+plan.plannedSale,newDebt:pending.payment.gap+flowPayment.gap+billPayment.gap,repaid,net:net(n),real:real(n),financial:financial(n),cash:n.cash,stock:n.stock,bond:n.bond,gold:n.gold,house:n.house,car:n.car,mortgage:n.mortgage,debt:n.debt,mood:n.mood,buffer:buffer(n)};
 row.carGain=carGain;const expected=pending.opening-pending.cost+gain+houseGain+carGain-depreciation+income-b.expense-b.interest-bill-fees;
 if(expected!==row.net)throw Error('账本校验失败：资产变化不守恒');
 if([...keys,'house','car','mortgage','debt'].some(k=>!Number.isSafeInteger(n[k])||n[k]<0)||!Number.isSafeInteger(row.net))throw Error('资产超出有效范围');
 n.history.push(row);for(const[t,target]of [[10,6],[20,9],[30,12]])if(n.turn===t&&n.flags['goal'+t])n.goals.push({turn:t,target,months:buffer(n),met:buffer(n)+1e-9>=target});return n;
}
function dispatch(s,c){if(!c||c.revision!==s.revision)throw Error('操作已过期，请刷新进度');if(c.type==='life')return chooseLife(s,c.choice);if(c.type==='allocate')return allocate(s,c.policy);throw Error('未知操作');}
function pack(s){return{schema:C.schema,version:C.version,dataVersion:D.version,seed:s.seed,commands:copy(s.commands)};}
function restore(raw){if(!raw||raw.schema!==C.schema||raw.version!==C.version||raw.dataVersion!==D.version||!Array.isArray(raw.commands)||raw.commands.length>60)throw Error('存档版本或选择记录不兼容');let s=start(raw.seed);for(const[i,c]of raw.commands.entries())s=i%2?allocate(s,c):chooseLife(s,c);return s;}
function modelPolicy(s,id,personal){const p={...validatePolicy(personal),basket:1,loss:0,profit:0,rebalance:'quarter'};if(id==='reserve'){p.w=[100,0,0,0];p.rebalance='none';}else if(id==='balanced')p.w=[20,40,30,10];else if(id==='trend'){p.w=known(s).global>0?[20,50,20,10]:[40,10,40,10];p.loss=20;}else throw Error('未知模型');return p;}
function compare(s,id){let other=start(s.seed);for(let i=0;i<s.commands.length;i++)other=i%2?allocate(other,modelPolicy(other,id,s.commands[i])):chooseLife(other,s.commands[i]);return other;}
function counterfactual(s,turn,p){if(!Number.isInteger(turn)||turn<0||turn>=s.turn)throw Error('请选择已经完成的年份');const raw=pack(s);raw.commands[turn*2+1]=validatePolicy(p);return restore(raw);}
function metrics(s){let peak=net(start(s.seed)),drawdown=0;for(const row of s.history){peak=Math.max(peak,row.net);if(peak>0)drawdown=Math.max(drawdown,(peak-row.net)/peak*100);}const sum=k=>s.history.reduce((a,r)=>a+r[k],0);return{net:net(s),real:real(s),financial:financial(s),buffer:buffer(s),mood:s.mood,debt:s.debt,mortgage:s.mortgage,drawdown,fees:sum('fees'),forced:sum('forcedSale'),covered:sum('covered'),turnover:sum('turnover'),gain:sum('gain'),timely:s.history.filter(r=>!r.debt).length,goals:s.goals.filter(g=>g.met).length,triggers:s.history.reduce((a,r)=>a+r.trades.filter(t=>t.kind!=='再平衡').length,0)};}
const api={version:C.version,keys,validSeed:B.validSeed,identity:B.identity,noise:B.noise,start,financial,net,real,month,index,inflation,budget,buffer,defaultPolicy,validatePolicy,event,housePrice,carPrice,preview,pay,bondPrice,marketPath,known,dispatch,pack,restore,modelPolicy,compare,counterfactual,metrics};
if(node)module.exports=api;else r.ProEngine=api;
})(globalThis);
