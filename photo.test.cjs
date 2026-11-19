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
  for (const photo of ctx.FamilyArchive) {
    assert.ok(photo.credit && photo.date && photo.license && photo.source.startsWith('https:'));
    assert.match(photo.sha256,/^[a-f0-9]{64}$/);
    files.add(photo.src);
  }
  for (const file of files) assert.equal(fs.readFileSync(path.join(__dirname,file)).toString('ascii',8,12),'WEBP');
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
