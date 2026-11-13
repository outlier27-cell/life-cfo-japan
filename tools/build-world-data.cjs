'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const countries={
 JP:{name:'日本',city:'东京',currency:'JPY',symbol:'¥',monthly:160000,stock:'SPASTT01JPM661N',cpi:'JPNCPIALLMINMEI',fx:'CCUSMA02JPM618N'},
 US:{name:'美国',city:'纽约',currency:'USD',symbol:'US$',monthly:1200,stock:'SPASTT01USM661N',cpi:'USACPIALLMINMEI',fx:null},
 GB:{name:'英国',city:'伦敦',currency:'GBP',symbol:'£',monthly:800,stock:'SPASTT01GBM661N',cpi:'GBRCPIALLMINMEI',fx:'CCUSMA02GBM618N'},
 CA:{name:'加拿大',city:'多伦多',currency:'CAD',symbol:'C$',monthly:1400,stock:'SPASTT01CAM661N',cpi:'CANCPIALLMINMEI',fx:'CCUSMA02CAM618N'}
};
const years=Array.from({length:43},(_,i)=>1978+i),manifest={edition:'oecd-fred-2026-11-13',retrieved:'2026-11-13',provider:'OECD, retrieved from FRED, Federal Reserve Bank of St. Louis',observation:'December monthly observations; not last-trading-day closes',years,series:[]};
function series(id,type){
 if(!id)return years.map(()=>1);
 const file=path.join(root,'data/raw',id+'.csv'),raw=fs.readFileSync(file,'utf8');
 const lines=raw.trim().split(/\r?\n/);if(lines.shift()!=='observation_date,'+id)throw Error('Unexpected CSV header '+id);
 const dates=new Map();for(const l of lines){const [date,val]=l.split(',');if(dates.has(date))throw Error('Duplicate '+date);dates.set(date,val);}
 const values=years.map(y=>{const v=Number(dates.get(y+'-12-01'));if(!(v>0&&Number.isFinite(v)))throw Error('Missing or invalid '+id+' '+y);return v;});
 manifest.series.push({id,type,source:'https://fred.stlouisfed.org/series/'+id,download:'https://fred.stlouisfed.org/graph/fredgraph.csv?id='+id,file:'data/raw/'+id+'.csv',sha256:crypto.createHash('sha256').update(raw).digest('hex'),count:values.length,unit:type==='fx'?'national currency per USD':'Index 2015=100, not seasonally adjusted'});
 return values;
}
const data={version:manifest.edition,years,countries:{}};
for(const [id,c] of Object.entries(countries))data.countries[id]={...c,prices:series(c.stock,'sharePrice'),cpiValues:series(c.cpi,'cpi'),fxValues:series(c.fx,'fx')};
fs.writeFileSync(path.join(root,'world-data.js'),"/* Frozen OECD/FRED December observations. See data/manifest.json. */\n(function(root){'use strict';const data="+JSON.stringify(data)+";if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.WorldData=data;})(globalThis);\n");
fs.writeFileSync(path.join(root,'data/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const rows=['country,year,share_price_index_2015_100,cpi_2015_100,national_currency_per_usd'];
for(const [id,c] of Object.entries(data.countries))years.forEach((y,i)=>rows.push([id,y,c.prices[i],c.cpiValues[i],c.fxValues[i]].join(',')));
fs.writeFileSync(path.join(root,'data/annual.csv'),rows.join('\n')+'\n');
console.log('Built '+manifest.series.length+' sourced series, '+years.length+' complete years × 4 countries. No missing-value fills.');
