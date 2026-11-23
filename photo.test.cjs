'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function viewer() {
  const context = vm.createContext({document: {addEventListener() {}}});
  for (const file of ['family-archive.js', 'family-scene-assets.js', 'family-photo-view.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context);
  }
  return context;
}

test('Every planned story path has a local photo and every archive entry includes credit and terms', () => {
  const ctx = viewer();
  const briefs = require('./assets/scene-briefs-v7.json').scenes;
  assert.equal(Object.keys(ctx.FamilySceneAssets).length, briefs.length);
  const files = new Set();
  for (const {key} of briefs) {
    const asset = ctx.FamilySceneAssets[key];
    assert.ok(asset.alt);
    files.add(asset.src);
    if (asset.teen) files.add(asset.teen);
  }
  assert.equal(files.size,184);
  for (const photo of [...ctx.FamilyArchive,...ctx.FamilyLocalArchive]) {
    assert.ok(photo.credit && photo.date && photo.license && photo.source.startsWith('https:'));
    assert.match(photo.sha256,/^[a-f0-9]{64}$/);
    files.add(photo.src);
  }
  for (const file of files) assert.equal(fs.readFileSync(path.join(__dirname,file)).toString('ascii',8,12),'WEBP');
});

test('Country-specific archive photos take precedence and retain the local file hash and license',()=>{
 const {FamilyLocalArchive,FamilyPhotos}=viewer();
 const {createHash}=require('node:crypto');
 for(const photo of FamilyLocalArchive){
  const bytes=fs.readFileSync(path.join(__dirname,photo.src));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.webpSha256);
  const html=FamilyPhotos.yearVisual(photo.year,'同年新闻',false,photo.country);
  assert.ok(html.includes(photo.src)&&html.includes(photo.licenseUrl)&&html.includes(photo.id));
  assert.ok(!FamilyPhotos.yearVisual(photo.year,'同年新闻',false,'OTHER').includes(photo.src));
 }
 for(const key of ['JP-1995','JP-2011','GB-1984','GB-2007','GB-2017','US-2008','US-2010','CA-1988','CA-1992']){
  const [country,year]=key.split('-');
  assert.match(FamilyPhotos.yearVisual(Number(year),'同年新闻',false,country),new RegExp('data-archive="'+key+'"'));
 }
});

test('Looking back uses the decision and age recorded for that year, including cancellation and deferral', () => {
  const ctx = viewer();
  const scene = ctx.FamilyPhotos.scenePhoto;
  const state = {country:'JP', story:{people:{child:{name:'葵',born:1990}},threads:{trip:{route:'cancel'}}}};
  const e = {chain:'trip',nodeId:'offer',personId:'child',routeOverride:'promise'};
  assert.match(scene(state,e,1998),/JP-trip-child-promise.webp/);
  assert.match(scene(state,e,2005),/JP-trip-teen-promise.webp/);
  assert.match(scene(state,{...e,nodeId:'last',routeOverride:'delay'},2005),/JP-return-trip-delay.webp/);
  assert.match(scene(state,{...e,nodeId:'last',routeOverride:'cancel'},2005),/JP-trip-teen-cancel.webp/);
});


test('Every playable year has a distinct visual and a sourced event', () => {
  const {FamilyArchive,FamilyPhotos}=viewer();
  const {entries}=require('./pro-history.js');
  const {createHash}=require('node:crypto');
  const generated=require('./assets/history/manifest.json');
  const sources=new Map([...FamilyArchive,...generated].map(item=>[item.year,item]));
  assert.equal(sources.size,43);
  assert.equal(FamilyArchive.length+generated.length,43);
  for(let year=1978;year<=2020;year++){
    const event=entries.find(item=>item.year===year), visual=sources.get(year);
    assert.ok(event?.source.startsWith('https:'),String(year));
    const bytes=fs.readFileSync(path.join(__dirname,visual.src));
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    if(visual.model) assert.equal(createHash('sha256').update(bytes).digest('hex'),visual.sha256);
    const html=FamilyPhotos.yearVisual(year,event.title);
    assert.ok(html.includes(visual.src),String(year));
    assert.match(html,visual.model ? /GPT 生成的历史情境插画/ : /同年档案/);
  }
});


test('Focus years use audited local reconstructions and retain annual visuals',()=>{
 const ctx=viewer(),{createHash}=require('node:crypto');
 const reconstructions=require('./assets/history/extra-manifest.json');
 assert.equal(reconstructions.length,10);
 for(const image of reconstructions){
  const bytes=fs.readFileSync(path.join(__dirname,image.src));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256);
  assert.ok(ctx.FamilyPhotos.extraVisual(image.year,'历史事件').includes(image.src));
  assert.match(ctx.FamilyPhotos.extraVisual(image.year,'历史事件'),/写实历史复原/);
  assert.ok(ctx.FamilyPhotos.yearVisual(image.year,'历史事件'));
 }
});


test('Every monthly family event has a verified mobile image',()=>{
 const ctx=viewer(),{definitions}=require('./family-monthly'),{createHash}=require('node:crypto');
 const manifest=require('./assets/history/event-manifest.json');
 assert.deepEqual(Object.keys(definitions).concat('quiet').sort(),manifest.map(row=>row.kind).sort());
 for(const row of manifest){
  const content=fs.readFileSync(path.join(__dirname,row.src));
  assert.equal(content.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(content).digest('hex'),row.sha256);
  assert.ok(ctx.FamilyPhotos.eventVisual(row.kind,'家庭事件').includes(row.src));
 }
});


test('Annual briefings cover every country and year with separate locally grounded and global accounts',()=>{
 const {pick}=require('./annual-briefings');
 const events=require('./annual-policy-events');
 for(const country of ['JP','US','GB','CA']){
  for(let year=1978;year<=2020;year++){
   const edition=pick(country,year);
   assert.deepEqual(edition,pick(country,year));
   assert.notEqual(edition.local.title,edition.global.title);
   for(const card of [edition.local,edition.global,...(edition.policy?[edition.policy]:[])]){
    assert.equal(card.year,year);
    assert.match(card.source,/^https:/);
    assert.ok(card.text&&card.impact&&card.uncertainty);
    assert.doesNotMatch(card.text,/undefined|NaN/);
   }
   assert.equal(edition.local.kind,'史事');
   if(edition.policy){
    const [date,before,after]=events[country][year];
    assert.ok(date.startsWith(year+'-'));
    assert.notEqual(before,after);
    assert.equal(edition.policy.kind,'政策变动记录');
    assert.ok(edition.policy.text.includes(String(before)+'%')&&edition.policy.text.includes(String(after)+'%'));
   }
  }
 }
 assert.match(pick('JP',2001).local.title,/量化宽松/);
 assert.match(pick('JP',1989).global.title,/柏林墙/);
 for(const [year,title] of [[1992,'地价'],[1993,'消费'],[1998,'长期信用银行'],[2007,'邮政'],[2008,'出口']]){
  assert.ok(pick('JP',year).local.title.includes(title));
  assert.ok(pick('JP',year).policy);
 }
 assert.match(pick('GB',2007).local.title,/北岩银行/);
 assert.match(pick('US',2010).local.title,/平价医疗/);
 assert.match(pick('CA',1988).local.title,/自由贸易协定/);
 assert.throws(()=>pick('JP',2021));
});
