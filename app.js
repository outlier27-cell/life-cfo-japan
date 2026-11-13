'use strict';

const { chapter, isPercent, settle } = window.LifeCfoRules;
const game = document.querySelector('#game');
const actions = document.querySelector('#actions');
const steps = [...document.querySelectorAll('#steps li')];
const sources = document.querySelector('#sources');
const sourceSummary = document.querySelector('#source-summary');
const sourceLinks = document.querySelector('#source-links');
const storageKey = 'life-cfo:jp-bubble:v1';
const defaults = () => ({ screen: 'decision', draft: 60, attempts: [] });
const arrows = {
  forward: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  replay: '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M5 8a8 8 0 1 1-1 7M5 8V3m0 5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const money = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const index = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const man = value => money.format(value / 10_000);
const point = year => index.format(chapter.closes[year] / 100);
const marketDrop = ((1 - chapter.closes[1990] / chapter.closes[1989]) * 100).toFixed(2);

function readSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !isPercent(saved.draft) || !Array.isArray(saved.attempts)
      || saved.attempts.length > 2 || !saved.attempts.every(isPercent)
      || new Set(saved.attempts).size !== saved.attempts.length
      || !['decision', 'settlement', 'comparison'].includes(saved.screen)
      || (saved.screen === 'settlement' && saved.attempts.length < 1)
      || (saved.screen === 'comparison' && saved.attempts.length !== 2)) return defaults();
    return saved;
  } catch { return defaults(); }
}

let state = readSave();

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* This browser may block storage. */ }
}

function go(screen) {
  state.screen = screen;
  save();
  render();
  window.scrollTo(0, 0);
  game.querySelector('h1').focus({ preventScroll: true });
}

function setDraft(percent) {
  if (!isPercent(percent)) return;
  state.draft = percent;
  const range = document.querySelector('#cash-range');
  range.value = percent;
  range.style.setProperty('--fill', `${percent}%`);
  range.setAttribute('aria-valuetext', `现金 ${percent}%，${percent} 万日元`);
  document.querySelector('#cash-value').value = percent;
  document.querySelector('#cash-split').textContent = percent;
  document.querySelector('#stock-split').textContent = 100 - percent;
  document.querySelector('#cash-share').textContent = `(${percent}%)`;
  document.querySelector('#stock-share').textContent = `(${100 - percent}%)`;
  document.querySelectorAll('.preset').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.percent) === percent));
  const same = state.attempts.at(-1) === percent;
  document.querySelector('#same-choice').hidden = !same;
  document.querySelector('#commit').disabled = same;
  save();
}

function renderDecision() {
  game.innerHTML = `
    <section class="screen" aria-labelledby="page-title">
      <figure class="hero"><img src="tokyo-1989.webp" width="1000" height="667" alt="插画：傍晚的东京街头，一位提着公文包的上班族走向远处。" fetchpriority="high"></figure>
      <p class="dateline">东京 · 1989 年末</p>
      <h1 class="decision-title" id="page-title" tabindex="-1">泡沫年代</h1>
      <p class="intro">你攒下了 <strong>100 万日元</strong>。东京的股市还在涨，你打算留多少现金？</p>
      <section class="panel allocation" aria-labelledby="allocation-title">
        <h2 id="allocation-title">留多少现金？</h2>
        <div class="amount"><span>当前：</span><output id="cash-value" for="cash-range" aria-live="off"></output><span class="unit">万日元</span></div>
        <input class="range" id="cash-range" type="range" min="0" max="100" step="1" aria-label="留多少现金">
        <div class="presets" aria-label="现金比例快捷选项">${[0, 30, 60, 100].map(p => `<button class="preset" type="button" data-percent="${p}">${p}%</button>`).join('')}</div>
        <dl class="split">
          <div><dt><span class="dot"></span>现金</dt><dd><b id="cash-split"></b> 万日元 <span class="share" id="cash-share"></span></dd></div>
          <div><dt><span class="dot stock"></span>模拟股票仓</dt><dd><b id="stock-split"></b> 万日元 <span class="share" id="stock-share"></span></dd></div>
        </dl>
        <p class="same-choice" id="same-choice" role="status" hidden>上一局也留了这个比例。换一个数字，才能比较两种结果。</p>
      </section>
    </section>`;
  actions.innerHTML = `<button class="btn" id="commit" type="button">确认分配，进入 1990 ${arrows.forward}</button>`;
  document.querySelector('#cash-range').addEventListener('input', e => setDraft(Number(e.target.value)));
  document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => setDraft(Number(button.dataset.percent))));
  document.querySelector('#commit').addEventListener('click', () => {
    if (state.screen !== 'decision' || state.attempts.at(-1) === state.draft) return;
    state.attempts = [...state.attempts.slice(-1), state.draft];
    go('settlement');
  });
  setDraft(state.draft);
}

function chart() {
  const years = [1988, 1989, 1990];
  const x = [68, 170, 270];
  const y = points => 115 - (points - 20000) * 90 / 25000;
  const positions = years.map((year, i) => ({ x: x[i], y: y(chapter.closes[year] / 100), year }));
  const [a, b, c] = positions;
  return `<figure class="panel market">
    <div class="chart-head"><h2>日经 225 <span>年末价格指数</span></h2><strong class="move">−${marketDrop}%</strong></div>
    <svg viewBox="0 0 330 143" class="chart" role="img" aria-label="日经 225 年末指数：1988 年 ${point(1988)} 点，1989 年 ${point(1989)} 点，1990 年 ${point(1990)} 点。从 1989 年末下跌 ${marketDrop}%。">
      ${[20000, 25000, 30000, 35000, 40000, 45000].map(t => `<path d="M39 ${y(t)}H325" stroke="#c9b49f" stroke-width=".85" stroke-dasharray="3 3"/><text x="35" y="${y(t) + 3}" text-anchor="end" class="tick">${money.format(t)}</text>`).join('')}
      <path d="M39 25v90h286" stroke="#8c7160" fill="none"/>
      <path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="#352418" stroke-width="2.4" fill="none"/>
      <path d="M${b.x} ${b.y}L${c.x} ${c.y}" stroke="#852d26" stroke-width="2.5" fill="none"/>
      ${positions.map(({ x, y, year }) => `<circle cx="${x}" cy="${y}" r="4" fill="${year === 1990 ? '#852d26' : '#352418'}"/><text x="${year === 1990 ? x + 15 : x}" y="${y - 10}" text-anchor="middle" ${year === 1990 ? 'class="down-label"' : ''} style="paint-order:stroke;stroke:#f8efdf;stroke-width:3px;stroke-linejoin:round">${year === 1988 ? money.format(chapter.closes[year] / 100) : point(year)}</text><text x="${x}" y="134" text-anchor="middle">${year}</text>`).join('')}
    </svg>
    <figcaption class="chart-note"><span>只连接年末观测点</span><button class="inline-source" id="chart-source" type="button" aria-haspopup="dialog">行情出处</button></figcaption>
  </figure>`;
}

function renderSettlement() {
  const r = settle(state.attempts.at(-1));
  const rows = [
    ['期初现金', man(r.openingCash)],
    ['股票市值（付账前）', man(r.stockBeforeBill)],
    ['从现金支付', r.cashPaid ? `−${man(r.cashPaid)}` : '0'],
    ['被迫卖出股票付账', r.forcedSale ? `−${man(r.forcedSale)}` : '0'],
    ['付账后现金', man(r.endingCash)],
    ['付账后股票', man(r.endingStock)],
  ];
  const explanation = r.forcedSale
    ? `市场下跌让你的持仓缩水 ${man(r.marketLoss)} 万。手上的现金不够付账，才让你必须卖出 ${man(r.forcedSale)} 万的股票。`
    : r.openingStock
      ? `你的持仓下跌了 ${man(r.marketLoss)} 万，但现金足够付账，你不需要在下跌后卖股票。`
      : '你用现金付清了账单。因为没有股票持仓，这次股市下跌没有直接影响你的账面资产。';
  game.innerHTML = `<section class="screen" aria-labelledby="page-title">
    <h1 id="page-title" tabindex="-1">1990 年末结算</h1>
    ${chart()}
    <article class="panel event" aria-labelledby="bill-title">
      <span class="event-tag">剧情事件</span>
      <div class="event-title"><h2 id="bill-title">家里寄来一张账单</h2><strong class="event-value">−${man(chapter.bill)} <span>万日元</span></strong></div>
      <p>父亲的手术和住院费用需要尽快汇回。财务助理先用现金付款，差额再用卖出股票的钱补上。</p>
    </article>
    <section class="panel ledger" aria-labelledby="ledger-title">
      <h2 id="ledger-title">家庭账本 <span>留 ${r.percent}% 现金 · 万日元</span></h2>
      <table aria-labelledby="ledger-title"><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">期末净资产</th><td>${man(r.netWealth)}</td></tr></tfoot></table>
    </section>
    <p class="takeaway">${explanation}</p>
  </section>`;
  document.querySelector('#chart-source').addEventListener('click', openSources);
  const canCompare = state.attempts.length === 2;
  actions.innerHTML = canCompare
    ? `<button class="btn" id="compare" type="button">对照两次选择 ${arrows.forward}</button>`
    : `<button class="btn secondary" id="replay" type="button">${arrows.replay} 换个选法再玩</button>`;
  if (canCompare) document.querySelector('#compare').addEventListener('click', () => go('comparison'));
  else document.querySelector('#replay').addEventListener('click', replay);
}

function renderComparison() {
  const [a, b] = state.attempts.map(settle);
  const [low, high] = a.percent < b.percent ? [a, b] : [b, a];
  const saleDelta = low.forcedSale - high.forcedSale;
  const reason = saleDelta > 0
    ? `<strong>留 ${high.percent}% 现金</strong>的方案少被迫卖出 <strong>${man(saleDelta)} 万日元</strong>的股票。差别来自你在账单到来前已经留出的现金。`
    : '两次留的现金都足以付账，因此都不用卖股票。剩下的现金和股票市值，反映了两种分配承受了不同程度的市场下跌。';
  const rows = [['被迫卖出', 'forcedSale'], ['期末现金', 'endingCash'], ['期末股票', 'endingStock'], ['期末净资产', 'netWealth']];
  const strategy = (result, label) => `<th scope="col"><span class="strategy">留 <b>${result.percent}%</b> 现金</span><small>${label} · 股票 ${100 - result.percent}%</small></th>`;
  game.innerHTML = `<section class="screen" aria-labelledby="page-title">
    <h1 id="page-title" tabindex="-1">同一年，两种选择</h1>
    <p class="compare-intro">行情和账单都一样，变的是你留的现金。</p>
    <div class="panel compare-table"><table aria-label="两种选择的结算对比，金额单位为万日元">
      <colgroup><col><col><col></colgroup><thead><tr><th scope="col">策略</th>${strategy(a, '前一次')}${strategy(b, '这一次')}</tr></thead>
      <tbody>${rows.map(([label, key]) => `<tr${key === 'netWealth' ? ' class="net"' : ''}><th scope="row">${label}</th><td>${man(a[key])}<small>万</small></td><td>${man(b[key])}<small>万</small></td></tr>`).join('')}</tbody>
    </table></div>
    <aside class="insight"><span class="insight-label">结论</span><p>${reason}</p></aside>
    <p class="caveat">这次回放遇上了下跌。上一年（1988 年末到 1989 年末），日经 225 上涨约 29%；在上涨时，较高的股票仓位也会获得更多账面收益。</p>
  </section>`;
  actions.innerHTML = `<button class="btn" id="replay" type="button">${arrows.replay} 再试一种分配</button>`;
  document.querySelector('#replay').addEventListener('click', replay);
}

function replay() {
  const latest = state.attempts.at(-1);
  state.draft = latest === 60 ? 0 : 60;
  go('decision');
}

function openSources() {
  const beforeDecision = state.screen === 'decision';
  sourceSummary.textContent = beforeDecision
    ? `截至 1989 年末，日经 225 从上一年末的 ${point(1988)} 点升至 ${point(1989)} 点。接下来会发生什么？做完决定再揭晓。`
    : `日经 225 从 1989 年末的 ${point(1989)} 点降至 1990 年末的 ${point(1990)} 点，价格变化 −${marketDrop}%。`;
  sourceLinks.innerHTML = beforeDecision ? '' : `
    <a href="https://www.esri.cao.go.jp/jp/esri/prj/sbubble/yearly/yearly.pdf" target="_blank" rel="noopener noreferrer">日本内阁府经济社会综合研究所 · 长期经济指标 ↗</a>
    <a href="https://www.jsda.or.jp/shiryoshitsu/toukei/factbook/files/efb1999.pdf" target="_blank" rel="noopener noreferrer">日本证券业协会 · 统计年鉴 ↗</a>
    <a href="https://www2.boj.or.jp/archive/en/announcements/press/koen_2000/ko0005a.htm" target="_blank" rel="noopener noreferrer">日本银行 · 泡沫期历史回顾 ↗</a>`;
  sources.showModal();
}

function render() {
  const active = ['decision', 'settlement', 'comparison'].indexOf(state.screen);
  steps.forEach((step, i) => {
    if (i === active) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  [renderDecision, renderSettlement, renderComparison][active]();
}

document.querySelector('#open-sources').addEventListener('click', openSources);
render();
