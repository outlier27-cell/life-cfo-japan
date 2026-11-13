(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,E=node?require('./world-engine.js'):root.WorldEngine,C=node?require('./world-content.js'):root.WorldContent,D=node?require('./world-data.js'):root.WorldData;
const BASE='https://outlier27-cell.github.io/life-cfo-japan/';
function cleanName(name){if(typeof name!=='string')throw Error('请填写昵称');const n=name.normalize('NFC').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'').trim();if(!n||Array.from(n).length>16)throw Error('昵称需为 1–16 个字');return n;}
function compact(s,name){
 if(s.phase!=='ended'||s.revision!==60)throw Error('完成 60 次选择后才能分享成绩');
 const code=Array.from({length:30},(_,i)=>s.commands[i*2]+s.commands[i*2+1][0].toString(36).padStart(2,'0')+s.commands[i*2+1][1]).join('');
 return{v:3,r:C.version,d:D.version,n:cleanName(name),s:s.seed,c:code};
}
function verify(p){
 if(!p||p.v!==3||p.r!==C.version||p.d!==D.version||!E.validSeed(p.s)||typeof p.c!=='string'||p.c.length!==120)throw Error('成绩版本或选择记录不兼容');
 const commands=[];
 for(let i=0;i<120;i+=4){const c=p.c.slice(i,i+4);if(!/^[01][0-9a-z]{2}[01]$/.test(c))throw Error('成绩中的选择记录无效');const percent=parseInt(c.slice(1,3),36);if(!E.percent(percent))throw Error('成绩中的现金比例无效');commands.push(Number(c[0]),[percent,Number(c[3])]);}
 const run=E.restore({schema:C.schema,version:p.r,dataVersion:p.d,seed:p.s,commands});
 const name=cleanName(p.n);return{packet:compact(run,name),name,run,metrics:E.metrics(run)};
}
function encode(p){const bytes=new TextEncoder().encode(JSON.stringify(p));if(bytes.length>12000)throw Error('分享内容过长，请减少榜单人数');let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return(node?Buffer.from(bytes).toString('base64'):btoa(binary)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(text){
 if(typeof text!=='string'||text.length>24000||!/^[\w-]+$/.test(text))throw Error('成绩链接格式无效或过长');
 const raw=text.replace(/-/g,'+').replace(/_/g,'/');let bytes;
 try{bytes=node?Uint8Array.from(Buffer.from(raw,'base64')):Uint8Array.from(atob(raw),c=>c.charCodeAt(0));if(bytes.length>12000)throw Error();return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('成绩链接损坏，请重新复制完整链接');}
}
function scoreUrl(s,name){return BASE+'?v=3.0.0#score='+encode(compact(s,name));}
function challenge(seed){if(!E.validSeed(seed))throw Error('人生编号无效');return BASE+'?v=3.0.0&run='+seed;}
function boardUrl(packets){if(!Array.isArray(packets)||!packets.length||packets.length>8)throw Error('一次可分享 1–8 位好友的榜单');const verified=packets.map(p=>verify(p).packet);if(new Set(verified.map(p=>p.s)).size!==1)throw Error('请先选择同一开局的榜单');return BASE+'?v=3.0.0#board='+encode({v:3,kind:'board',entries:verified});}
function read(text){
 if(typeof text!=='string'||text.length>30000)throw Error('请粘贴一条完整成绩或榜单链接');
 const m=text.trim().match(/(?:#(?:score|board)=|^CF3:)([A-Za-z0-9_-]+)/);if(!m)throw Error('没有找到成绩或榜单代码');
 const p=decode(m[1]);if(!p||typeof p!=='object'||Array.isArray(p))throw Error('成绩内容无效');if(p.kind==='board'){if(p.v!==3||!Array.isArray(p.entries)||!p.entries.length||p.entries.length>8)throw Error('榜单格式无效');const rows=p.entries.map(verify);if(new Set(rows.map(r=>r.run.seed)).size!==1)throw Error('榜单混入了不同开局');return rows;}
 return[verify(p)];
}
function merge(old,added){
 const map=new Map();for(const p of [...old,...added]){const v=verify(p);map.set(v.run.seed+'|'+v.name,v.packet);}
 return Array.from(map.values()).slice(-64);
}
function ranking(packets,seed,metric='net'){
 if(!['net','buffer','mood'].includes(metric))throw Error('未知排名方式');
 const rows=packets.map(verify).filter(v=>v.run.seed===seed).sort((a,b)=>b.metrics[metric]-a.metrics[metric]||a.name.localeCompare(b.name,'zh-CN'));
 let rank=0,previous=null;return rows.map((row,i)=>{const value=Math.round(row.metrics[metric]*100);if(previous!==value){rank=i+1;previous=value;}return{...row,rank};});
}
const api={cleanName,compact,verify,encode,decode,scoreUrl,challenge,boardUrl,read,merge,ranking};if(node)module.exports=api;else root.WorldSocial=api;
})(globalThis);
