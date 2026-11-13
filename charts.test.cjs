const test=require('node:test'),assert=require('node:assert/strict');
require('./charts.js');
test('年度现金流条形图读取账本条目，零金额不显示负零',()=>{
 const html=globalThis.CFOCharts.bars([['生活选择即时支出',-120000],['市场损益',102000],['意外自付支出',-0]]);
 assert.match(html,/生活选择即时支出/);assert.match(html,/-12<small>/);assert.match(html,/\+10\.2<small>/);
 assert.doesNotMatch(html,/NaN|undefined|-0<small>/);
});
