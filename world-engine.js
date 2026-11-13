(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const C=node?require('./world-content.js'):root.WorldContent,D=node?require('./world-data.js'):root.WorldData;
const validSeed=n=>Number.isInteger(n)&&n>=1&&n<=999999999;
const percent=n=>Number.isInteger(n)&&n>=0&&n<=100;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function noise(seed,salt){let n=(seed^Math.imul(salt+1,0x9e3779b1))>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return(n^(n>>>16))>>>0;}
function identity(seed){
 if(!validSeed(seed))throw Error('人生编号必须是 1–999999999 的整数');
 const country=Object.keys(D.countries)[noise(seed,101)%4],era=C.eras[noise(seed,102)%C.eras.length],household=noise(seed,103)%C.households.length;
 return{country,era,household,birth:era-24};
}
function start(seed){
 const id=identity(seed),c=D.countries[id.country],h=C.households[id.household];
 return{version:C.version,dataVersion:D.version,seed,...id,revision:0,turn:0,phase:'life',cash:c.monthly*h.cash,stock:0,debt:0,mood:60,flags:{skill:0,insured:false,partner:false,child:false,housing:false,network:false,maintenanceUntil:0},pending:null,goals:[],history:[],commands:[]};
}
const net=s=>s.cash+s.stock-s.debt;
const index=(s,turn=s.turn)=>s.era-D.years[0]+turn;
function inflation(s,turn=s.turn){const c=D.countries[s.country];return c.cpiValues[index(s,turn)]/c.cpiValues[index(s,0)];}
function month(s,turn=s.turn){return Math.round(D.countries[s.country].monthly*inflation(s,turn));}
function budget(s){
 const m=month(s),h=C.households[s.household],child=s.flags.child&&s.turn<23;
 const expense=Math.round(m*(h.expense+(s.flags.housing?2.4:0)+(child?2:0)+(s.flags.insured?.6:0)));
 return{month:m,income:Math.round(m*(h.income+s.flags.skill*.8)),expense,monthlyExpense:expense/12,child};
}
const buffer=s=>s.cash/budget(s).monthlyExpense;
const real=s=>Math.round(net(s)/inflation(s));
function event(s){
 if(s.turn>=30)throw Error('这一局已完成');
 const ch=structuredClone(C.chapters[s.turn]);
 if(s.turn===5&&!s.flags.partner){
  ch.title='一个人，也有新的方向';ch.story='你保留了独立生活的节奏。现在，你想把这段时间投入学习，还是留给自己的日常？';
  ch.choices=[{id:0,title:'完成一门进阶课程',text:'花 0.8 个月预算；技能 +1，从明年起增加收入。',cost:.8,skill:1,mood:2},{id:1,title:'把空闲留给自己的生活',text:'没有额外开支；满意度 +5。',mood:5}];
 }
 if([12,18].includes(s.turn)&&!s.flags.child){
  ch.title=s.turn===12?'把一个兴趣变成日常':'人生中途，再学一点东西';ch.story='你没有承担育儿支出。留出的空间，可以换成新的学习，也可以换成更安稳的日常。';
  ch.choices=[{id:0,title:'参加一次系统学习',text:'花 0.7 个月预算；技能 +1，收入加成从明年开始。',cost:.7,skill:1,mood:3},{id:1,title:'保持当前节奏，留住余钱',text:'没有额外支出；满意度 +4。',mood:4}];
 }
 if(s.turn===13)ch.choices[0].title=s.flags.insured?'继续保留家庭保障':'现在补上家庭保障';
 if(s.turn===21&&!s.flags.housing){ch.choices[0]={id:0,title:'整理房间，给生活留空间',text:'花 0.1 个月预算；满意度 +2。当前已是基础住房开支，不会再减少租金。',cost:.1,mood:2};}
 return ch;
}
function pay(s,amount){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('无效的支付金额');
 const cash=Math.min(s.cash,amount),sale=Math.min(s.stock,amount-cash),gap=amount-cash-sale;
 s.cash-=cash;s.stock-=sale;s.debt+=gap;return{cash,sale,gap};
}
function receive(s,amount){const repaid=Math.min(s.debt,amount);s.debt-=repaid;s.cash+=amount-repaid;return repaid;}
function shock(s){
 const n=noise(s.seed,s.turn),roll=n%100,m=month(s);
 if(roll<20)return{kind:'medical',title:'一张医疗账单',text:'家人需要一笔额外医疗支出。先前的保障安排，现在会体现在自付金额里。',gross:Math.round(m*[1,2,3][(n>>>8)%3])};
 if(roll<35)return{kind:'repair',title:'计划之外的维修',text:'日常设备出了问题，需要尽快修好。这笔支出并不会等市场回暖。',gross:Math.round(m*[.4,.8,1.2][(n>>>8)%3])};
 if(roll<48)return{kind:'income',title:'一段收入减少的日子',text:'工作安排出现变化，今年的一部分收入没能如期到账。已有技能和互助关系可以减轻影响。',gross:Math.round(m*[1,2,3][(n>>>8)%3])};
 return{kind:'none',title:'平常日子，也在积累',text:'这一年没有额外的突发账单。持续的生活选择，仍然影响着你的收入、开支和余地。',gross:0};
}
function market(s,turn=s.turn){
 if(turn<0||turn>=30)throw Error('无效的市场年度');
 const i=index(s,turn),c=D.countries[s.country],local=c.prices[i+1]/c.prices[i];
 // Convert each country's price-only return into the player's currency, then
 // equally weight four markets at the start of each annual observation period.
 const parts=Object.entries(D.countries).map(([id,p])=>({id,factor:(p.prices[i+1]/p.prices[i])*(c.fxValues[i+1]/p.fxValues[i+1])/(c.fxValues[i]/p.fxValues[i])}));
 const global=parts.reduce((a,p)=>a+p.factor,0)/parts.length;
 return{local,global,parts,inflation:c.cpiValues[i+1]/c.cpiValues[i],open:c.prices[i],close:c.prices[i+1],year:s.era+turn+1};
}
function chooseLife(s,choice){
 if(s.phase!=='life'||s.turn>=30||![0,1].includes(choice))throw Error('这次生活选择无效或已处理');
 const ch=event(s),option=ch.choices[choice],n=structuredClone(s),b=budget(s),cost=Math.round((option.cost||0)*b.month),payment=pay(n,cost);
 const pending={choice,title:option.title,chapter:ch.title,opening:net(s),cost,payment,month:b.month,income:b.income,extra:Math.round((option.extra||0)*b.month),skillBefore:s.flags.skill};
 if(option.skill)n.flags.skill+=option.skill;
 for(const [k,v] of Object.entries(option.set||{})){if(k==='maintenance')n.flags.maintenanceUntil=s.turn+5;else n.flags[k]=v;}
 n.mood=clamp(n.mood+(option.mood||0),0,100);n.phase='allocate';n.pending=pending;n.commands.push(choice);n.revision++;
 return n;
}
function preview(s,p,basket=1){
 if(s.phase!=='allocate'||!percent(p)||![0,1].includes(basket))throw Error('无效的配置预览');
 const total=s.cash+s.stock,cash=Math.round(total*p/100),stock=total-cash,b=budget(s);
 return{cash,stock,basket,expense:b.expense,months:cash/b.monthlyExpense,trade:stock-s.stock,knownIncome:s.pending.income+s.pending.extra,knownFlow:s.pending.income+s.pending.extra-b.expense};
}
function allocate(s,p,basket){
 const a=preview(s,p,basket),n=structuredClone(s),pending=s.pending,b=budget(s),prices=market(s),surprise=shock(s);
 n.cash=a.cash;n.stock=a.stock;
 const factor=basket===0?prices.local:prices.global,close=Math.round(n.stock*factor),gain=close-n.stock;n.stock=close;
 let income=pending.income+pending.extra,bill=surprise.gross,covered=0,avoided=0;
 if(surprise.kind==='income'){
  avoided=Math.min(surprise.gross,Math.round(pending.month*(Math.min(pending.skillBefore,4)*.2+(n.flags.network?.5:0))));
  income-=surprise.gross-avoided;bill=0;
 }else if(surprise.kind==='medical'&&n.flags.insured){covered=Math.round(bill/2);bill-=covered;}
 else if(surprise.kind==='repair'&&n.flags.maintenanceUntil>s.turn){avoided=Math.round(bill/2);bill-=avoided;}
 const flow=income-b.expense;
 let flowPayment={sale:0,gap:0},repaid=0;
 if(flow>=0)repaid=receive(n,flow);else flowPayment=pay(n,-flow);
 const billPayment=pay(n,bill);
 n.turn++;n.revision++;n.phase=n.turn===30?'ended':'life';n.pending=null;n.commands.push([p,basket]);
 const row={year:s.era+n.turn,age:24+n.turn,choice:pending.choice,title:pending.title,chapter:pending.chapter,percent:p,basket,opening:pending.opening,cost:pending.cost,allocatedCash:a.cash,allocatedStock:a.stock,trade:a.trade,plannedSale:pending.payment.sale,gain,priceChange:(factor-1)*100,income,expense:b.expense,flow,bill,covered,avoided,shock:surprise,forcedSale:flowPayment.sale+billPayment.sale,newDebt:pending.payment.gap+flowPayment.gap+billPayment.gap,repaid,cash:n.cash,stock:n.stock,debt:n.debt,net:net(n),real:real(n),mood:n.mood,buffer:buffer(n),cpi:inflation(n)};
 n.history.push(row);
 for(const [turn,target] of [[10,6],[20,9],[30,12]])if(n.turn===turn&&n.flags['goal'+turn])n.goals.push({turn,target,months:buffer(n),met:buffer(n)+1e-9>=target});
 if(![n.cash,n.stock,n.debt,net(n)].every(Number.isSafeInteger)||n.cash<0||n.stock<0||n.debt<0)throw Error('资产超出有效范围');
 return n;
}
function dispatch(s,command){
 if(!command||command.revision!==s.revision)throw Error('操作已过期，请刷新进度');
 if(command.type==='life')return chooseLife(s,command.choice);
 if(command.type==='allocate')return allocate(s,command.percent,command.basket);
 throw Error('未知操作');
}
function pack(s){return{schema:C.schema,version:C.version,dataVersion:D.version,seed:s.seed,commands:structuredClone(s.commands)};}
function restore(raw){
 if(!raw||raw.schema!==C.schema||raw.version!==C.version||raw.dataVersion!==D.version||!Array.isArray(raw.commands)||raw.commands.length>60)throw Error('存档格式、规则或数据版本不兼容');
 let s=start(raw.seed);
 for(const [i,c] of raw.commands.entries()){
  if(i%2===0){if(!Number.isInteger(c)||![0,1].includes(c))throw Error('无效的生活选择');s=chooseLife(s,c);}
  else {if(!Array.isArray(c)||c.length!==2)throw Error('无效的资产安排');s=allocate(s,c[0],c[1]);}
 }
 return s;
}
function counterfactual(s,turn,p,basket){
 if(!Number.isInteger(turn)||turn<0||turn>=s.turn||!percent(p)||![0,1].includes(basket))throw Error('只能修改已经完成的年度');
 const raw=pack(s);raw.commands[turn*2+1]=[p,basket];return restore(raw);
}
function metrics(s){
 return{net:net(s),real:real(s),buffer:buffer(s),mood:s.mood,debt:s.debt,forced:s.history.reduce((a,r)=>a+r.forcedSale,0),gain:s.history.reduce((a,r)=>a+r.gain,0),timely:s.history.filter(r=>r.debt===0).length,goals:s.goals.filter(g=>g.met).length};
}
function marketHistory(s){
 const local=[100],global=[100],cpi=[100];for(let t=0;t<s.turn;t++){const m=market(s,t);local.push(local.at(-1)*m.local);global.push(global.at(-1)*m.global);cpi.push(inflation(s,t+1)*100);}
 return{years:Array.from({length:s.turn+1},(_,i)=>s.era+i),local,global,cpi};
}
const api={validSeed,percent,noise,identity,start,net,real,month,budget,buffer,event,shock,market,marketHistory,preview,dispatch,pack,restore,counterfactual,metrics};
if(node)module.exports=api;else root.WorldEngine=api;
})(globalThis);
