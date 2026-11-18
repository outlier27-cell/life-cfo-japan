(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,F=node?require('./family-engine.js'):root.FamilyEngine,S=node?require('./pro-social.js'):root.ProSocial,D=node?require('./pro-data.js'):root.ProData;
const base='https://outlier27-cell.github.io/life-cfo-japan/';
function compact(s,name){if(s.phase!=='ended'||!['completed','bankrupt'].includes(s.outcome))throw Error('结束这一局后才能分享');return{v:7,r:F.version,d:D.version,t:F.storyVersion,b:F.comparisonVersion,n:S.cleanName(name),s:s.seed,c:s.commands.map(c=>c.type==='life'?'L'+c.choice:c.type==='resolve'?'R'+(c.action==='liquidate'?0:1):'A'+c.policy.w.slice(1).map(x=>x.toString(36).padStart(2,'0')).join('')+c.policy.basket+c.policy.coverage+['keep','buy','sell'].indexOf(c.policy.house)+['keep','buy','sell'].indexOf(c.policy.car)).join('')};}
function verify(p){
 if(!p||p.v!==7||p.r!==F.version||p.d!==D.version||p.t!==F.storyVersion||p.b!==F.comparisonVersion||!F.validSeed(p.s)||typeof p.c!=='string'||p.c.length>450)throw Error('成绩版本或记录无效');
 const commands=[];for(let i=0;i<p.c.length;){const t=p.c[i++];if(t==='L'||t==='R'){const v=p.c[i++];if(!/^[01]$/.test(v))throw Error('选择记录损坏');commands.push(t==='L'?{type:'life',choice:Number(v)}:{type:'resolve',action:v==='0'?'liquidate':'bankrupt'});}else if(t==='A'){const v=p.c.slice(i,i+10);i+=10;if(!/^[0-9a-z]{6}[01][0-2]{3}$/.test(v))throw Error('配置记录损坏');const w=[0,...[0,2,4].map(j=>parseInt(v.slice(j,j+2),36))];w[0]=100-w[1]-w[2]-w[3];commands.push({type:'allocate',policy:F.policy({w,basket:Number(v[6]),coverage:Number(v[7]),house:['keep','buy','sell'][v[8]],car:['keep','buy','sell'][v[9]]})});}else throw Error('选择类型无效');}
 let run=F.start(p.s);for(const c of commands)run=F.dispatch(run,{...c,revision:run.revision});return{run,name:S.cleanName(p.n),packet:compact(run,p.n),metrics:F.metrics(run)};
}
const scoreUrl=(s,name)=>base+'?v=7.1.0#score='+S.encode(compact(s,name));
function challenge(seed){if(!F.validSeed(seed))throw Error('编号无效');return base+'?v=7.1.0&run='+seed;}
function read(text){if(typeof text!=='string'||text.length>30000)throw Error('链接过长');const m=text.trim().match(/#(?:score|board)=([A-Za-z0-9_-]+)/);if(!m)throw Error('请粘贴完整成绩链接');const p=S.decode(m[1]);if(p.kind==='board'){if(p.v!==7||!Array.isArray(p.entries)||!p.entries.length||p.entries.length>8)throw Error('榜单格式无效');const rows=p.entries.map(verify);if(new Set(rows.map(x=>x.run.seed)).size!==1)throw Error('榜单开局不同');return rows;}return[verify(p)];}
function merge(old,added){const map=new Map();for(const p of [...old,...added]){const v=verify(p);map.set(v.run.seed+'|'+v.name,v.packet);}return[...map.values()].slice(-64);}
function boardUrl(packets){if(!packets.length||packets.length>8)throw Error('一次分享1至8位');const rows=packets.map(verify);if(new Set(rows.map(x=>x.run.seed)).size!==1)throw Error('请分享同一开局');return base+'?v=7.1.0#board='+S.encode({v:7,kind:'board',entries:rows.map(x=>x.packet)});}
const api={compact,verify,scoreUrl,challenge,read,merge,boardUrl,cleanName:S.cleanName};if(node)module.exports=api;else root.FamilySocial=api;
})(globalThis);
