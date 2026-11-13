'use strict';
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),manifest=require('../data/manifest.json');
const dates=[1978,1988,1990,2008,2020].map(y=>y+'-12-01');
(async()=>{
 const samples=await Promise.all(manifest.series.map(async source=>{
  const url='https://fred.stlouisfed.org/data/'+source.id,response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error(source.id+' table HTTP '+response.status);
  const html=await response.text(),raw=new Map(fs.readFileSync(path.join(base,source.file),'utf8').trim().split(/\r?\n/).slice(1).map(row=>row.split(',')));
  const values=dates.map(date=>{
   const match=html.match(new RegExp(date+'</th>\\s*<td[^>]*>([^<]+)</td>'))||html.match(new RegExp('#'+date+'\\|([^\\s<]+)'));if(!match)throw Error('Missing table value '+source.id+' '+date);
   const display=match[1].trim().replace(/,/g,''),value=Number(display),original=Number(raw.get(date));
   const decimals=(display.split('.')[1]||'').length,tolerance=.5*Math.pow(10,-Math.min(decimals,12))+1e-10;
   if(!Number.isFinite(value)||Math.abs(value-original)>tolerance)throw Error('Table/CSV mismatch '+source.id+' '+date);
   return{date,csv:original,table:value,displayPrecision:decimals,pass:true};
  });return{id:source.id,url,values};
 }));
 const result={edition:manifest.edition,checkedAt:new Date().toISOString(),method:'Cross-check frozen CSV extraction against the official FRED HTML data table. Same upstream provider, not an independent second economic source.',series:samples.length,observations:samples.reduce((a,s)=>a+s.values.length,0),pass:true,samples};
 fs.writeFileSync(path.join(base,'data/audit.json'),JSON.stringify(result,null,2)+'\n');console.log('Official HTML tables match '+result.observations+' sampled observations across '+result.series+' series.');
})().catch(e=>{console.error(e);process.exitCode=1;});
