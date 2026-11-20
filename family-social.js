(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,F=node?require('./family-engine.js'):root.FamilyEngine,S=node?require('./pro-social.js'):root.ProSocial,D=node?require('./pro-data.js'):root.ProData;
const edition='8.1.0';
const base='https://outlier27-cell.github.io/life-cfo-japan/';
function compact(s,name){if(s.phase!=='ended'||!['completed','bankrupt'].includes(s.outcome))throw Error('结束这一局后才能分享');return{v:7,r:F.version,d:D.version,t:F.storyVersion,b:F.comparisonVersion,n:S.cleanName(name),s:s.seed,...(s.mode?{m:s.mode}:{}),c:s.commands.map(c=>c.type==='auto'?'U':c.type==='life'?'L'+c.choice:c.type==='resolve'?'R'+(c.action==='liquidate'?0:1):(c.policy.response?'B':'A')+c.policy.w.slice(1).map(x=>x.toString(36).padStart(2,'0')).join('')+c.policy.basket+c.policy.coverage+['keep','buy','sell'].indexOf(c.policy.house)+['keep','buy','sell'].indexOf(c.policy.car)+(c.policy.response?['home','work','care'].indexOf(c.policy.response):'')).join('')};}
function checkHeader(p){
 if(!p||p.v!==7||(p.m!==undefined&&!['auto','monthly','briefing'].includes(p.m))||p.r!==F.version||p.d!==D.version||p.t!==F.storyVersion||p.b!==F.comparisonVersion||!F.validSeed(p.s)||typeof p.c!=='string'||p.c.length>450)throw Error('成绩版本或记录无效');
 return {v:p.v,r:p.r,d:p.d,t:p.t,b:p.b,s:p.s,...(p.m?{m:p.m}:{}),c:p.c,n:S.cleanName(p.n)};
}
const summaries=new Map();
function remember(run,packet,metrics){
 const key=(packet.m||'story')+'|'+packet.s+'|'+packet.c;
 if(!summaries.has(key)&&summaries.size>=80)summaries.delete(summaries.keys().next().value);
 summaries.set(key,{run:Object.freeze({seed:run.seed,country:run.country,era:run.era,turn:run.turn,outcome:run.outcome,mode:run.mode}),metrics:Object.freeze({...metrics})});
}
function summary(p){
 const packet=checkHeader(p),key=(packet.m||'story')+'|'+packet.s+'|'+packet.c;
 if(!summaries.has(key))verify(packet);
 return {...summaries.get(key),name:packet.n,packet};
}
function verify(p){
 p=checkHeader(p);
 const commands=[];for(let i=0;i<p.c.length;){const t=p.c[i++];if(t==='U'){commands.push({type:'auto'});}else if(t==='L'||t==='R'){const v=p.c[i++];if(!/^[01]$/.test(v))throw Error('选择记录损坏');commands.push(t==='L'?{type:'life',choice:Number(v)}:{type:'resolve',action:v==='0'?'liquidate':'bankrupt'});}else if(t==='A'||t==='B'){const len=t==='B'?11:10,v=p.c.slice(i,i+len);i+=len;if(!/^[0-9a-z]{6}[01][0-2]{3}$/.test(v.slice(0,10))||(t==='B'&&(p.m!=='briefing'||!/[0-2]/.test(v[10]||''))))throw Error('配置记录损坏');const w=[0,...[0,2,4].map(j=>parseInt(v.slice(j,j+2),36))];w[0]=100-w[1]-w[2]-w[3];commands.push({type:'allocate',policy:F.policy({w,basket:Number(v[6]),coverage:Number(v[7]),house:['keep','buy','sell'][v[8]],car:['keep','buy','sell'][v[9]],...(t==='B'?{response:['home','work','care'][v[10]]}:{})})});}else throw Error('选择类型无效');}
 let run=F.start(p.s,p.m);for(const c of commands)run=F.dispatch(run,{...c,revision:run.revision});const packet=compact(run,p.n),metrics=F.metrics(run);
 remember(run,packet,metrics);return{run,name:packet.n,packet,metrics};
}
const scoreUrl=(s,name)=>base+'?v='+edition+'#score='+S.encode(compact(s,name));
function challenge(seed,mode='briefing'){if(!F.validSeed(seed))throw Error('编号无效');return base+'?v='+edition+'&run='+seed+'&mode='+mode;}
function read(text,inspect=verify){if(typeof text!=='string'||text.length>30000)throw Error('链接过长');const m=text.trim().match(/#(?:score|board)=([A-Za-z0-9_-]+)/);if(!m)throw Error('请粘贴完整成绩链接');const p=S.decode(m[1]);if(p.kind==='board'){if(p.v!==7||!Array.isArray(p.entries)||!p.entries.length||p.entries.length>8)throw Error('榜单格式无效');const rows=p.entries.map(inspect);if(new Set(rows.map(x=>x.run.seed+'|'+(x.run.mode||'story'))).size!==1)throw Error('榜单开局不同');return rows;}return[inspect(p)];}
function merge(old,added){
 const map=new Map();
 for(const stored of old){const p=checkHeader(stored);map.set((p.m||'story')+'|'+p.s+'|'+p.n,p);}
 for(const addition of added){const p=summary(addition).packet,key=(p.m||'story')+'|'+p.s+'|'+p.n;map.delete(key);map.set(key,p);}
 return [...map.values()].slice(-64);
}
function boardUrl(packets){if(!packets.length||packets.length>8)throw Error('一次分享1至8位');const rows=packets.map(summary);if(new Set(rows.map(x=>x.run.seed+'|'+(x.run.mode||'story'))).size!==1)throw Error('请分享同一开局');return base+'?v='+edition+'#board='+S.encode({v:7,kind:'board',entries:rows.map(x=>x.packet)});}
const api={edition,compact,verify,summary,scoreUrl,challenge,read,merge,boardUrl,cleanName:S.cleanName};if(node)module.exports=api;else root.FamilySocial=api;
})(globalThis);
