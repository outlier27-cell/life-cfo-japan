'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),old=require('../world-data.js'),oldManifest=require('../data/manifest.json');
const version='multi-asset-2026-11-13',dates=[];
for(let y=1977;y<=2020;y++)for(let m=1;m<=12;m++)if(y>1977||m===12)dates.push(`${y}-${String(m).padStart(2,'0')}-01`);
const years=Array.from({length:44},(_,i)=>1977+i),manifest={version,retrieved:'2026-11-13',monthlyDates:dates,years,series:[],models:{bond:'US Treasury par bond model: annual 10-year roll, semiannual coupons, reprice remaining cash flows at observed GS10 yields; flat yield curve assumption. Not an observed total-return index.',cash:'Non-interest-bearing cash; real purchasing power adjusted by CPI.',house:'BIS national nominal Q4 index. Base house 120 initial monthly budgets; 30% down, 20-year fixed 5% mortgage; 3% buy/sell costs. Model amounts and contract, not historical household quotes.',car:'8 current monthly budgets at purchase; 15% yearly depreciation; 0.6 monthly budgets yearly operating costs. Teaching assumptions, no claimed historical vehicle-price data.',insurance:'Term-style medical bill cover: 0 / 50 / 80 percent; annual premiums 0 / 0.6 / 1.2 monthly budgets. No surrender value; model contract, not actual country insurance pricing.'}};
function read(id,file,type,source,unit,requested=dates){
 const raw=fs.readFileSync(path.join(root,file));const lines=raw.toString().trim().split(/\r?\n/);if(lines.shift()!=='observation_date,'+id)throw Error('Unexpected header '+id);
 const map=new Map();for(const line of lines){const [d,v]=line.split(',');if(map.has(d))throw Error('Duplicate date '+id+' '+d);map.set(d,v);}
 const values=requested.map(d=>{const text=map.get(d),v=Number(text);if(!text||!Number.isFinite(v)||v<=0)throw Error('Missing/invalid observation '+id+' '+d);return v;});
 manifest.series.push({id,file,type,source,unit,sha256:crypto.createHash('sha256').update(raw).digest('hex'),count:values.length,first:requested[0],last:requested.at(-1)});return values;
}
const data={version,dates,years,countries:{}};
for(const [id,c] of Object.entries(old.countries)){
 const load=(sid,type,unit)=>read(sid,'data/raw/'+sid+'.csv',type,'https://fred.stlouisfed.org/series/'+sid,unit);
 const houseId='Q'+id+'N628BIS';
 data.countries[id]={name:c.name,city:c.city,currency:c.currency,monthly:c.monthly,
  stock:load(c.stock,'stock','Index 2015=100; monthly, price-only'),
  cpi:load(c.cpi,'cpi','Index 2015=100'),
  fx:c.fx?load(c.fx,'fx','national currency per US dollar'):dates.map(()=>1),
  house:read(houseId,'data/v4/raw/'+houseId+'.csv','housing','https://fred.stlouisfed.org/series/'+houseId,'Index 2010=100; nominal, quarterly Q4',years.map(y=>y+'-10-01'))};
}
data.yield=read('GS10','data/v4/raw/GS10.csv','bondYield','https://fred.stlouisfed.org/series/GS10','percent per annum; monthly average');
data.gold=read('WB_GOLD','data/v4/raw/WB_GOLD.csv','gold','https://www.worldbank.org/en/research/commodity-markets','USD per troy ounce; monthly average');
data.car=read('CUUR0000SETA01','data/v4/raw/CUUR0000SETA01.csv','vehiclePrice','https://fred.stlouisfed.org/series/CUUR0000SETA01','US new vehicles CPI; 1982-84=100, not seasonally adjusted');
manifest.models.car='Initial purchase reference: 8 initial monthly budgets, then US BLS new-vehicle CPI changes converted through historical USD exchange rates; an illustrative imported-vehicle model, not local or model-specific car quotes. 15% annual depreciation, 0.6 current monthly budgets annual running costs.';
manifest.workbook=require('../data/v4/gold-extraction.json');
fs.writeFileSync(path.join(root,'pro-data.js'),"/* Frozen authoritative observations; asset-return models are separate. */\n(function(r){'use strict';const d="+JSON.stringify(data)+";if(typeof module!=='undefined'&&module.exports)module.exports=d;else r.ProData=d;})(globalThis);\n");
fs.writeFileSync(path.join(root,'data/v4/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const rows=['country,date,stock_price_index,cpi,national_currency_per_usd,gold_usd_per_oz,us_10y_yield_percent,us_new_vehicle_cpi'];
for(const [id,c]of Object.entries(data.countries))dates.forEach((d,i)=>rows.push([id,d,c.stock[i],c.cpi[i],c.fx[i],data.gold[i],data.yield[i],data.car[i]].join(',')));
fs.writeFileSync(path.join(root,'data/v4/monthly.csv'),rows.join('\n')+'\n');
const housing=['country,year,quarter,nominal_house_price_index_2010_100'];
for(const[id,c]of Object.entries(data.countries))years.forEach((y,i)=>housing.push([id,y,4,c.house[i]].join(',')));
fs.writeFileSync(path.join(root,'data/v4/housing.csv'),housing.join('\n')+'\n');
console.log(`${manifest.series.length} series; ${dates.length} monthly dates; ${years.length} Q4 house observations per country; no interpolation.`);
