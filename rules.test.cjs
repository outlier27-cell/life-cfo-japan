'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chapter, settle } = require('./rules.js');

test('两种可手算方案以相同年末指数与账单结算', () => {
  const allStock = settle(0);
  assert.deepEqual([allStock.stockBeforeBill, allStock.forcedSale, allStock.endingCash, allStock.endingStock, allStock.netWealth],
    [612827, 300000, 0, 312827, 312827]);
  const reserve = settle(60);
  assert.deepEqual([reserve.stockBeforeBill, reserve.forcedSale, reserve.endingCash, reserve.endingStock, reserve.netWealth],
    [245131, 0, 300000, 245131, 545131]);
});

test('现金不足时只补卖差额，刚好够时不卖，全现金时没有市场损失', () => {
  assert.equal(settle(29).forcedSale, 10000);
  assert.equal(settle(30).forcedSale, 0);
  assert.equal(settle(30).endingCash, 0);
  const cashOnly = settle(100);
  assert.deepEqual([cashOnly.marketLoss, cashOnly.endingCash, cashOnly.endingStock], [0, 700000, 0]);
});

test('全部 101 个可玩比例都保持账本守恒、无负数、结果可重算', () => {
  for (let percent = 0; percent <= 100; percent++) {
    const r = settle(percent);
    assert.equal(r.openingCash + r.openingStock, chapter.capital);
    assert.equal(r.cashPaid + r.forcedSale + r.unpaid, chapter.bill);
    assert.equal(r.netWealth, chapter.capital - r.marketLoss - chapter.bill);
    assert.equal(r.endingCash + r.endingStock - r.unpaid, r.netWealth);
    assert.ok(r.endingCash >= 0 && r.endingStock >= 0);
    assert.equal(r.unpaid, 0);
    assert.deepEqual(settle(percent), r);
  }
});

test('拒绝无效的现金比例', () => {
  for (const value of [-1, 101, 29.5, NaN, '60', null, undefined]) assert.throws(() => settle(value), RangeError);
});
