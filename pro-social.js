(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports,E=node?require('./pro-engine.js'):root.ProEngine,C=node?require('./pro-content.js'):root.ProContent,D=node?require('./pro-data.js'):root.ProData;
const BASE='https://outlier27-cell.github.io/life-cfo-japan/';
function cleanName(name){if(typeof name!=='string')throw Error('请填写昵称');const n=name.normalize('NFC').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'').trim();if(!n||Array.from(n).length>16)throw Error('昵称需为 1–16 个字');return n;}
function compact(s,name){
 if(s.phase!=='ended'||s.revision!==60)throw Error('完成60次选择后才能分享成绩');
 const code=Array.from({length:30},(_,i)=>{const p=E.validatePolicy(s.commands[i*2+1]);return s.commands[i*2]+p.w.slice(1).map(x=>x.toString(36).padStart(2,'0')).join('')+p.basket+[0,10,20,30].indexOf(p.loss)+[0,20,40,60].indexOf(p.profit)+['none','quarter','band'].indexOf(p.rebalance)+p.coverage+['keep','buy','sell'].indexOf(p.house)+['keep','buy','sell'].indexOf(p.car);}).join('');
 return{v:4,r:C.version,d:D.version,n:cleanName(name),s:s.seed,c:code};
}
function verify(p){
 if(!p||p.v!==4||p.r!==C.version||p.d!==D.version||!E.validSeed(p.s)||typeof p.c!=='string'||p.c.length!==420)throw Error('成绩版本或选择记录不兼容');
 const commands=[];for(let i=0;i<420;i+=14){const c=p.c.slice(i,i+14);if(!/^[01][0-9a-z]{6}[01][0-3]{2}[0-2]{4}$/.test(c))throw Error('成绩中的选择记录无效');const w=[0,parseInt(c.slice(1,3),36),parseInt(c.slice(3,5),36),parseInt(c.slice(5,7),36)];w[0]=100-w[1]-w[2]-w[3];commands.push(Number(c[0]),E.validatePolicy({w,basket:Number(c[7]),loss:[0,10,20,30][Number(c[8])],profit:[0,20,40,60][Number(c[9])],rebalance:['none','quarter','band'][Number(c[10])],coverage:Number(c[11]),house:['keep','buy','sell'][Number(c[12])],car:['keep','buy','sell'][Number(c[13])]}));}
 const run=E.restore({schema:C.schema,version:p.r,dataVersion:p.d,seed:p.s,commands});const name=cleanName(p.n);return{packet:compact(run,name),name,run,metrics:E.metrics(run)};
}
function encode(p){const bytes=new TextEncoder().encode(JSON.stringify(p));if(bytes.length>12000)throw Error('分享内容过长，请减少榜单人数');let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return(node?Buffer.from(bytes).toString('base64'):btoa(binary)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(text){
 if(typeof text!=='string'||text.length>24000||!/^[\w-]+$/.test(text))throw Error('成绩链接格式无效或过长');
 const raw=text.replace(/-/g,'+').replace(/_/g,'/');let bytes;
 try{bytes=node?Uint8Array.from(Buffer.from(raw,'base64')):Uint8Array.from(atob(raw),c=>c.charCodeAt(0));if(bytes.length>12000)throw Error();return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('成绩链接损坏，请重新复制完整链接');}
}
function scoreUrl(s,name){return BASE+'?v=4.2.0#score='+encode(compact(s,name));}
function challenge(seed){if(!E.validSeed(seed))throw Error('人生编号无效');return BASE+'?v=4.2.0&run='+seed;}
function boardUrl(packets){if(!Array.isArray(packets)||!packets.length||packets.length>8)throw Error('一次可分享 1–8 位好友的榜单');const verified=packets.map(p=>verify(p).packet);if(new Set(verified.map(p=>p.s)).size!==1)throw Error('请先选择同一开局的榜单');return BASE+'?v=4.2.0#board='+encode({v:4,kind:'board',entries:verified});}
function read(text){
 if(typeof text!=='string'||text.length>30000)throw Error('请粘贴一条完整成绩或榜单链接');
 const m=text.trim().match(/(?:#(?:score|board)=|^CF4:)([A-Za-z0-9_-]+)/);if(!m)throw Error('没有找到成绩或榜单代码');
 const p=decode(m[1]);if(!p||typeof p!=='object'||Array.isArray(p))throw Error('成绩内容无效');if(p.kind==='board'){if(p.v!==4||!Array.isArray(p.entries)||!p.entries.length||p.entries.length>8)throw Error('榜单格式无效');const rows=p.entries.map(verify);if(new Set(rows.map(r=>r.run.seed)).size!==1)throw Error('榜单混入了不同开局');return rows;}
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
const api={cleanName,compact,verify,encode,decode,scoreUrl,challenge,boardUrl,read,merge,ranking};if(node)module.exports=api;else root.ProSocial=api;
})(globalThis);
