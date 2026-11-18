'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { edition } = require('../family-social');

async function checkMobileFlow() {
  const url = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
  url.searchParams.set('run', '1');
  const browser = await chromium.launch({ channel: process.env.LIFE_CFO_BROWSER_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url.href);
    await page.locator('#start').click();
    await page.locator('[data-choice="0"]').click();
    await page.locator('#life-confirm').click();

    await page.locator('summary').filter({ hasText: '自己调一调' }).click();
    await page.locator('#basket').selectOption('0');
    await page.locator('summary').filter({ hasText: '听听现金流管家的理由' }).click();
    await page.locator('#adopt-agent').click();
    assert.equal(await page.locator('#basket').inputValue(), '1');
    await page.reload();
    assert.equal(await page.locator('#basket').inputValue(), '1');

    await page.locator('#allocation-confirm').click();
    const heading = page.locator('main h1');
    const settlement = await heading.innerText();
    assert.match(settlement, /1989年，后来怎样了/);
    await page.locator('#menu-button').click();
    await page.locator('#home').click();
    await page.locator('#resume').click();
    assert.equal(await heading.innerText(), settlement);
    await page.reload();
    assert.equal(await heading.innerText(), settlement);

    const invitation = new URL(url.href);
    invitation.searchParams.set('run', '2');
    await page.goto(invitation.href);
    await page.locator('#resume').click();
    assert.equal(await heading.innerText(), settlement);
    assert.equal(new URL(page.url()).searchParams.get('run'), '1');
    await page.reload();
    assert.equal(await heading.innerText(), settlement);

    await page.locator('#board-button').click();
    await page.locator('#add-score').click();
    await page.locator('#read-score').click();
    const feedback = page.getByRole('dialog').getByRole('status');
    assert.equal(await feedback.innerText(), '请粘贴完整成绩链接');
    await page.getByRole('button', { name: '关闭', exact: true }).click();

    await page.locator('#menu-button').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-save').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), '人生CFO-' + edition + '-1.json');
    assert.equal(await download.failure(), null);
    assert.deepEqual(errors, []);
    console.log('Mobile allocation, settlement, friend-link validation and save export verified.');
  } finally {
    await browser.close();
  }
}

checkMobileFlow().catch(error => { console.error(error); process.exitCode = 1; });
