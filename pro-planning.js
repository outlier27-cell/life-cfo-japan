(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const E=node?require('./pro-engine.js'):root.ProEngine;
const D=node?require('./pro-data.js'):root.ProData;
const C=node?require('./pro-content.js'):root.ProContent;
const version='planning-1';
const reasons=[
 {id:'reserve',label:'留好应急金',text:'先留出能随时支付账单的钱。'},
 {id:'family',label:'照顾家庭开支',text:'保障、住房和家里的安排优先。'},
 {id:'diversify',label:'分散风险',text:'不把所有资金放在同一类资产。'},
 {id:'patient',label:'为长期打算',text:'接受波动，按计划持有和调整。'},
 {id:'view',label:'试试我的判断',text:'根据已读到的消息，记录自己的判断。'}
];
const scenarios=[
 {id:'medical',name:'跌市碰上医疗账单',returns:[0,-.25,-.05,-.10],billMonths:3,kind:'medical'},
 {id:'double',name:'股债齐跌，还要维修',returns:[0,-.20,-.12,0],billMonths:2,kind:'repair'},
 {id:'bill',name:'行情不变，账单先到',returns:[0,0,0,0],billMonths:3,kind:'medical'}
];
function floorValue(v){if(!Number.isInteger(v)||v<0||v>100)throw Error('现金底线须为0至100的整数');return v;}
function weights(w){if(!Array.isArray(w)||w.length!==4||w.some(x=>!Number.isInteger(x)||x<0||x>100)||w.reduce((a,b)=>a+b,0)!==100)throw Error('资产比例须合计100%');return [...w];}
function applyFloor(input,value){
 const w=weights(input),floor=floorValue(value);if(w[0]>=floor)return w;
 const total=100-w[0],room=100-floor,exact=w.slice(1).map(x=>x/total*room),out=exact.map(Math.floor);
 const order=exact.map((x,i)=>({i,f:x-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let rest=room-out.reduce((a,b)=>a+b,0),i=0;i<rest;i++)out[order[i].i]++;
 return [floor,...out];
}
function setWeight(input,i,value,floor=0){
 const w=applyFloor(input,floor);if(![1,2,3].includes(i)||!Number.isInteger(value))throw Error('请输入整数比例');
 const other=w.slice(1).reduce((a,v,j)=>a+(j+1===i?0:v),0);
 w[i]=Math.max(0,Math.min(value,100-floor-other));w[0]=100-w[1]-w[2]-w[3];return w;
}
function emptyEntry(floor=0){return{reason:'',note:'',floor:floorValue(floor),stress:''};}
function entry(raw){
 if(raw===undefined||raw===null)return emptyEntry();
 if(typeof raw!=='object'||Array.isArray(raw))throw Error('决策便签格式无效');
 const reason=raw.reason??'',stress=raw.stress??'',note=raw.note??'';
 if(typeof reason!=='string'||(reason&&!reasons.some(r=>r.id===reason))||typeof stress!=='string'||(stress&&!scenarios.some(s=>s.id===stress))||typeof note!=='string')throw Error('决策便签内容无效');
 const clean=note.normalize('NFC').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,' ').trim();
 if(Array.from(clean).length>80)throw Error('补充理由最多80个字');
 return{reason,note:clean,floor:floorValue(raw.floor??0),stress};
}
function journal(raw,run){
 if(raw===undefined)return [];
 if(!raw||raw.version!==version||!Array.isArray(raw.entries)||raw.entries.length>run.turn)throw Error('决策记录版本或年份不兼容');
 return raw.entries.map((x,i)=>{
  if(x===null)return null;const value=entry(x);
  if(value.floor>run.history[i].policy.w[0])throw Error('现金底线与已确认比例不一致');
  return value;
 });
}
function reasonText(value){const v=entry(value),label=reasons.find(r=>r.id===v.reason)?.label;return[label,v.note].filter(Boolean).join('：')||'当年没有记录理由';}
function catalog(s,policy){
 const p=E.validatePolicy(policy),c=D.countries[s.country],currency={JP:'日元',US:'美元',GB:'英镑',CA:'加元'}[s.country];
 return [
  {id:'cash',group:'金融资产',name:'现金',market:c.name,currency,liquidity:'随时支付账单',basis:'本币不计息；购买力随CPI变化。',source:'sources.html'},
  {id:'stock',group:'金融资产',name:'股票',market:p.basket?'日本、美国、英国、加拿大':c.name,currency:p.basket?'四个市场，折算为'+currency:currency,liquidity:'可卖出，教学交易费0.1%',basis:'OECD月度价格指数，不含股息。四国组合为每年起点等权的教学组合。',source:'sources.html'},
  {id:'bond',group:'金融资产',name:'债券',market:'美元10年国债模型',currency:s.country==='US'?'美元':'美元，折算为'+currency,liquidity:'可卖出；利率上升可能跌价',basis:'用美联储真实收益率估算固定票息债券，含模拟票息；不是实际基金净值。',source:'sources.html'},
  {id:'gold',group:'金融资产',name:'黄金',market:'世界银行美元金价参考',currency:s.country==='US'?'美元':'美元，折算为'+currency,liquidity:'可卖出，教学交易费0.1%',basis:'美元月均价，不产生利息；非美国玩家同时承担汇率变化。',source:'sources.html'},
  {id:'coverage',group:'家庭保障',name:'保险',market:'教学医疗保障',currency,liquidity:'没有可赎回现金价值',basis:'保费支出换取医疗账单保障，自付比例为100%、50%或20%。',source:'guide.html'},
  {id:'house',group:'实物资产',name:'住房',market:c.name+'住宅指数参考',currency,liquidity:'需主动出售，不自动卖房付账',basis:'按BIS国家指数估值；房贷本金、利息、交易费和维护费分别处理。',source:'sources.html'},
  {id:'car',group:'实物资产',name:'汽车',market:'美国新车价格教学参考',currency,liquidity:'需主动出售，不自动卖车付账',basis:'美国BLS价格和汇率作参考，每年另计15%教学折旧及养车费。',source:'sources.html'},
  {id:'debt',group:'负债',name:'房贷与未付款',market:'家庭负债',currency,liquidity:'需要偿还，不计入可投资金额',basis:'房贷按约定还本付息；未付款单列，后续正收支先偿还。',source:'guide.html'}
 ];
}
function stress(s,policy,id){
 const scenario=scenarios.find(x=>x.id===id);if(!scenario)throw Error('请选择一个假设情景');
 const p=E.validatePolicy(policy),preview=E.preview(s,p),n=structuredClone(preview.state),opening=E.net(n);
 let gain=0;E.keys.forEach((key,i)=>{const before=n[key];n[key]=Math.round(before*(1+scenario.returns[i]));gain+=n[key]-before;});
 const gross=Math.round(E.month(s)*scenario.billMonths),covered=scenario.kind==='medical'?Math.round(gross*[0,.5,.8][p.coverage]):0;
 const bill=gross-covered,premium=preview.budget.premium,oldDebt=n.debt,needed=bill+premium+oldDebt,cashBefore=n.cash;
 // Reserve one annual premium now; settle old payables and the hypothetical bill once.
 n.debt=0;const payment=E.pay(n,needed);
 const result={scenario:id,opening,initialFees:preview.fees+preview.trade.fee,gain,gross,covered,bill,premium,oldDebt,needed,cashBefore,cashGap:Math.max(0,needed-cashBefore),cash:n.cash,financial:E.financial(n),net:E.net(n),sale:payment.sale,fees:payment.fee,unpaid:n.debt,months:n.cash/preview.budget.monthlyExpense,holdings:E.keys.map(k=>n[k]),notes:preview.notes};
 if(result.net!==opening+gain-bill-premium-payment.fee)throw Error('压力情景账本不守恒');
 return result;
}
function compareStress(s,p,id){return{personal:stress(s,p,id),balanced:stress(s,E.modelPolicy(s,'balanced',p),id)};}
function review(run,entries){
 const checked=journal({version,entries},run),out=[];let s=E.start(run.seed);
 for(let t=0;t<run.turn;t++){
  s=E.dispatch(s,{type:'life',choice:run.commands[t*2],revision:s.revision});const p=run.commands[t*2+1],value=checked[t];
  out.push(value?{...value,year:run.era+t+1,result:value.stress?stress(s,p,value.stress):null}:null);
  s=E.dispatch(s,{type:'allocate',policy:p,revision:s.revision});
 }
 return out;
}
const api={version,reasons,scenarios,applyFloor,setWeight,emptyEntry,entry,journal,reasonText,catalog,stress,compareStress,review};
if(node)module.exports=api;else root.ProPlanning=api;
})(globalThis);
