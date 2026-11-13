(function (root) {
  'use strict';

  // Store the historical index observations in hundredths of an index point.
  const chapter = Object.freeze({
    capital: 1_000_000,
    bill: 300_000,
    closes: Object.freeze({ 1988: 3015900, 1989: 3891587, 1990: 2384871 }),
  });

  function isPercent(value) {
    return Number.isInteger(value) && value >= 0 && value <= 100;
  }

  function settle(percent) {
    if (!isPercent(percent)) throw new RangeError('现金比例须为 0 到 100 的整数');
    const openingCash = chapter.capital * percent / 100;
    const openingStock = chapter.capital - openingCash;
    const stockBeforeBill = Math.round(openingStock * chapter.closes[1990] / chapter.closes[1989]);
    const cashPaid = Math.min(openingCash, chapter.bill);
    const forcedSale = Math.min(stockBeforeBill, chapter.bill - cashPaid);
    const endingCash = openingCash - cashPaid;
    const endingStock = stockBeforeBill - forcedSale;
    const unpaid = chapter.bill - cashPaid - forcedSale;
    return {
      percent, openingCash, openingStock, stockBeforeBill, cashPaid, forcedSale,
      marketLoss: openingStock - stockBeforeBill,
      endingCash, endingStock, unpaid,
      netWealth: endingCash + endingStock - unpaid,
    };
  }

  const rules = Object.freeze({ chapter, isPercent, settle });
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  else root.LifeCfoRules = rules;
})(globalThis);
