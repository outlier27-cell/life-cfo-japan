'use strict';
const C=window.CFOContent,E=window.CFOEngine,V=window.CFOCharts;
const $=s=>document.querySelector(s),game=$('#game'),dialog=$('#dialog');
const key='life-cfo:jp-seven:v2',backup=key+':backup';
const yen=new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2});
const m=n=>yen.format(n===0?0:n/10000),one=n=>n.toFixed(1),sign=n=>(n>0?'+':'')+m(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const query=new URLSearchParams(location.search);
let chosenSeed=E.validSeed(Number(query.get('seed')))?Number(query.get('seed')):1989;
let chosenScenario=Object.hasOwn(C.scenarios,query.get('family'))?query.get('family'):'family';
let state=null,phase='welcome',draft={choice:null,percent:60},savedPhase='decision',storageOk=true,saveToken=null,comparisonTurn=1,comparisonPercent=60;
let toastTimer;
function notice(text){$('#notice').textContent=text;$('#notice').hidden=false;}
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function parseSave(text){
 const raw=JSON.parse(text),s=E.restore(raw.run);
 const p=s.turn===7?(raw.phase==='settlement'?'settlement':'report'):(s.turn&&raw.phase==='settlement'?'settlement':'decision');
 const d={choice:null,percent:60};
 if(E.percent(raw.draft?.percent))d.percent=raw.draft.percent;
 if(C.chapters[s.turn]?.choices.some(c=>c.id===raw.draft?.choice))d.choice=raw.draft.choice;
 return {s,p,d};
}
try {
 saveToken=localStorage.getItem(key);
 if(saveToken){try{const loaded=parseSave(saveToken);state=loaded.s;phase=loaded.p;savedPhase=phase;draft=loaded.d;}
 catch{const recovery=localStorage.getItem(backup);if(recovery){try{const loaded=parseSave(recovery);state=loaded.s;phase=loaded.p;draft=loaded.d;notice('主存档读取失败，已恢复上一份有效备份。');}catch{notice('这份存档暂时无法读取。原档仍保留，你可以导入备份，或重新开始。');}}else notice('存档无法读取，原档仍保留。可以从存档菜单导入备份，或重新开始。');}}
} catch {storageOk=false;notice('浏览器未允许本地保存。可以正常游玩，离开前请在「存档」导出进度。');}
if(query.has('seed')&&state&&(state.seed!==chosenSeed||state.scenario!==chosenScenario)){savedPhase=phase;phase='welcome';}
function persist(){
 if(!state||!storageOk)return;
 const envelope=JSON.stringify({run:E.pack(state),phase:phase==='welcome'?savedPhase:phase,draft});
 try{
   const old=localStorage.getItem(key);
   if(old!==saveToken){notice('另一个标签页更新了进度。请刷新后继续，避免覆盖它的选择。');return false;}
   if(old){try{parseSave(old);localStorage.setItem(backup,old);}catch{/* Keep corrupted original until an intentional new game. */}}
   localStorage.setItem(key,envelope);saveToken=envelope;return true;
 }catch{storageOk=false;notice('本地保存不可用，请在「存档」导出进度，保留这段人生。');}
}
function fresh(seed,scenario){state=E.start(seed,scenario);phase='decision';savedPhase=phase;draft={choice:null,percent:60};persist();render(true);}
function show(p,scroll=true){phase=p;if(p!=='welcome')savedPhase=p;persist();render(scroll);}
function modal(html){$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
function confirmRestart(callback){if(!state){callback();return;}modal('<h2>开始另一段人生？</h2><p>当前进度会被新的开局替换。如果想保留，请先在存档菜单导出。</p><button class="button" id="confirm-new">确认重新开始</button>');$('#confirm-new').onclick=()=>{dialog.close();callback();};}
function timeline(){return '<ol class="timeline" aria-label="人生年份">'+C.years.map((y,i)=>'<li class="'+(i===state.turn?'active':i<state.turn?'done':'')+'" '+(i===state.turn?'aria-current="step"':'')+'><i></i>'+y+'</li>').join('')+'</ol>';}
function stats(s){return '<dl class="stats"><div><dt>净资产</dt><dd>'+m(E.net(s))+'<small>万</small></dd></div><div><dt>可用现金</dt><dd>'+m(s.cash)+'<small>万</small></dd></div><div><dt>现金缓冲</dt><dd>'+one(E.buffer(s))+'<small>个月</small></dd></div></dl>';}
function market(){const t=state.turn;return '<details class="panel" '+(phase==='settlement'?'open':'')+'><summary>走过的市场 · 日经 225</summary>'+V.line([{name:'历史年末点位',color:'#686746',values:C.prices.slice(0,t+1).map(p=>p/100)}],C.years.slice(0,t+1),'点')+'<p class="market-note">'+C.marketNotes[t]+'</p><p class="muted">仅连接年末观测点，不代表年内走势。</p></details>';}
function journey(s=state){return '<details class="panel section-gap"><summary>我的人生日志 · '+s.turn+' 年</summary><div class="journal">'+(s.history.length?s.history.map(r=>'<details class="journal-item"><summary><span class="journal-year">'+r.year+'</span>'+r.title+'</summary><p>留 '+r.percent+'% 现金。市场损益 '+sign(r.gain)+' 万；期末净资产 '+m(r.net)+' 万。</p><p>本年收支 '+sign(r.flow)+' 万，额外自付 '+m(r.bill)+' 万；被迫变现 '+m(r.forcedSale)+' 万。</p></details>').join(''):'<p class="muted">你的第一笔选择还没有写下。</p>')+'</div></details>';}
function welcome(){
 game.innerHTML='<section class="welcome screen"><div><img class="hero" src="tokyo-1989.webp" alt="创作插画：暮色中的东京街道，一位上班族提着公文包走向远处。" width="1000" height="667"><h1 tabindex="-1">七年，过好自己的生活</h1><p class="welcome-subtitle">日本篇 · 1988—1995</p><div class="intro-features"><div><b>7 个年份</b><span>经历起伏与平静</span></div><div><b>14 次决定</b><span>工作、家庭与投资</span></div><div><b>同场重玩</b><span>看见另一种可能</span></div></div><p class="bio">你是人生的决策者，财务助理负责按你的安排执行。每年做一个生活选择，再决定留多少现金。市场只在你决定之后展开。</p></div><div class="welcome-right"><section class="panel"><h2>24 岁，初到东京</h2><p class="bio">手里有 <strong>100 万日元</strong>。接下来的七年，你会在收入、家庭和自己的未来之间，慢慢找到答案。</p></section><section class="panel"><h3>你的家庭情境</h3><div class="choice-list">'+Object.entries(C.scenarios).map(([id,s])=>'<button class="choice scenario" data-scenario="'+id+'" aria-pressed="'+(id===chosenScenario)+'"><span><b>'+s.name+'</b><small>'+s.description+'</small><small>年收入 '+m(s.income)+' 万 / 年必要开支 '+m(s.expense)+' 万</small></span></button>').join('')+'</div><div class="challenge"><label for="seed">人生编号</label><input id="seed" type="number" min="1" max="999999" value="'+chosenSeed+'"><button class="small-button" id="random-seed">随机</button><span>相同编号与背景，共用同一组意外。</span></div></section><div class="primary-action">'+(state?'<button class="button" id="resume">继续我的人生 · '+C.years[state.turn]+'</button><button class="button secondary" id="start">开启新的七年</button>':'<button class="button" id="start">开始我的七年</button>')+'<p class="action-note">无需登录 · 自动保存 · 预计 5–8 分钟</p></div></div></section>';
 document.querySelectorAll('.scenario').forEach(b=>b.onclick=()=>{chosenScenario=b.dataset.scenario;document.querySelectorAll('.scenario').forEach(x=>x.setAttribute('aria-pressed',x===b));});
 $('#random-seed').onclick=()=>{const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);$('#seed').value=bytes[0]%999999+1;};
 $('#start').onclick=()=>{const seed=Number($('#seed').value);if(!E.validSeed(seed)){toast('人生编号请输入 1 到 999999 的整数');return;}confirmRestart(()=>fresh(seed,chosenScenario));};
 if($('#resume'))$('#resume').onclick=()=>show(savedPhase);
}
function allocations(){
 if(!draft.choice)return {cash:Math.round((state.cash+state.stock)*draft.percent/100),stock:Math.round((state.cash+state.stock)*(100-draft.percent)/100),expense:E.annualExpense(state),cost:0,debt:state.debt};
 return E.preview(state,draft.choice,draft.percent);
}
function updateAllocation(){
 const a=allocations();$('#percent-value').value=draft.percent+'%';$('#allocation-chart').innerHTML=V.allocation(a.cash,a.stock);
 $('#cash-label').textContent=m(a.cash)+' 万';$('#stock-label').textContent=m(a.stock)+' 万';
 $('#cash-range').value=draft.percent;$('#cash-range').setAttribute('aria-valuetext',draft.percent+'% 现金，'+m(a.cash)+' 万日元');
 document.querySelectorAll('.preset').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.percent)===draft.percent));
 const target=state.stock-a.stock;$('#assistant').textContent=(draft.choice?'先处理生活选择的 '+m(a.cost)+' 万即时支出。':'先选一件今年要做的事。')+' 分配后留 '+m(a.cash)+' 万现金，约覆盖 '+one(a.cash/(a.expense/12))+' 个月必要开支。'+(draft.choice?(target>0?'预计减持股票 '+m(target)+' 万。':'预计增持股票 '+m(-target)+' 万。'):'')+(a.debt?'仍有 '+m(a.debt)+' 万未付款，今后的收支结余会优先偿还。':'');
 $('#commit').disabled=!draft.choice;persist();
}
function decision(){
 if(state.turn>=7){show('report');return;}
 const ch=C.chapters[state.turn];
 game.innerHTML='<section class="screen">'+timeline()+stats(state)+'<div class="chapter-grid"><div><div class="date-row"><span>'+C.years[state.turn]+' 年末 · '+(24+state.turn)+' 岁</span><span>年度 '+(state.turn+1)+' / 7</span></div><h1 tabindex="-1">'+ch.title+'</h1><p class="story">'+ch.story+'</p><div class="choice-list" aria-label="今年的生活选择">'+ch.choices.map(c=>'<button class="choice life-choice" data-choice="'+c.id+'" aria-pressed="'+(draft.choice===c.id)+'"><span><b>'+c.title+'</b><small>'+c.text+'</small></span></button>').join('')+'</div><section class="panel allocation"><div class="allocation-head"><h3>本年资金分配</h3><label>现金 <output id="percent-value"></output></label></div><div class="alloc-labels"><span><i></i>现金 <b id="cash-label"></b></span><span class="stock"><i></i>股票 <b id="stock-label"></b></span></div><div id="allocation-chart"></div><input id="cash-range" type="range" min="0" max="100" step="1" aria-label="现金比例"><div class="presets">'+[0,30,60,100].map(p=>'<button class="preset" data-percent="'+p+'">'+p+'%</button>').join('')+'</div><p class="assistant" id="assistant"></p></section><button class="button primary-action" id="commit">确认选择，过完这一年</button><p class="action-note">确认后结算至 '+C.years[state.turn+1]+' 年末</p></div><aside>'+market()+'<section class="panel section-gap"><h3>我的家庭</h3><div class="chip-row"><span>'+C.scenarios[state.scenario].name+'</span><span>满意度 '+state.mood+'/100</span></div><p class="muted">必要开支 '+m(E.annualExpense(state)/12)+' 万/月。现金缓冲只计算手头现金。</p>'+goal(state)+'</section>'+journey()+'</aside></div></section>';
 document.querySelectorAll('.life-choice').forEach(b=>b.onclick=()=>{draft.choice=b.dataset.choice;document.querySelectorAll('.life-choice').forEach(x=>x.setAttribute('aria-pressed',x===b));updateAllocation();});
 $('#cash-range').oninput=e=>{draft.percent=Number(e.target.value);updateAllocation();};
 document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>{draft.percent=Number(b.dataset.percent);updateAllocation();});
 const currentTurn=state.turn;$('#commit').onclick=()=>{
   if(phase!=='decision'||!draft.choice||currentTurn!==state.turn)return;
   if(storageOk){try{if(localStorage.getItem(key)!==saveToken){notice('另一个标签页已更新存档，请刷新后继续。');return;}}catch{}}
   state=E.advance(state,{turn:currentTurn,choice:draft.choice,percent:draft.percent});show('settlement');
 };
 updateAllocation();
}
function goal(s){
 if(!s.flags.goal)return '<p class="muted section-gap">让生活运转下去，也给自己留一点余地。</p>';
 const p=Math.min(100,s.cash/1500000*100);
 return '<div class="section-gap"><strong>共同约定 · 1995 年留出 150 万现金</strong><div class="goal-meter" role="img" aria-label="目标进度 '+Math.round(p)+'%"><i style="width:'+p+'%"></i></div><p class="muted">已留 '+m(s.cash)+' 万 / 150 万'+(s.turn===7?(s.cash>=1500000?' · 约定兑现':' · 还差 '+m(1500000-s.cash)+' 万'):'')+'</p></div>';
}
function settlement(){
 const r=state.history.at(-1),i=state.turn-1,ch=C.chapters[i],change=(C.prices[state.turn]/C.prices[i]-1)*100;
 let effect='';
 if(r.insurance)effect+='保障分担 '+m(r.insurance)+' 万医疗费，本次自付 '+m(r.bill)+' 万。';
 if(r.avoided)effect+='前面的技能投入，帮你少损失了 '+m(r.avoided)+' 万收入。';
 if(state.flags.housing)effect+='较大的房间让本年必要开支增加 24 万。';
 if(r.forcedSale)effect+='现金不足时，财务助理卖出 '+m(r.forcedSale)+' 万持仓补上支出。';
 else effect+='本年没有因现金不足而卖出股票。';
 if(r.newDebt)effect+='还有 '+m(r.newDebt)+' 万新账单未付，已记入未付款。';
 const rows=[['期初净资产',r.opening],['生活选择即时支出',-r.cost],['市场价格损益',r.gain],['收入减必要支出',r.flow],['意外自付支出',-r.bill]];
 game.innerHTML='<section class="screen">'+timeline()+'<div class="annual-header"><h1 tabindex="-1">'+r.year+'，这一年过完了</h1><p>你的决定：'+r.title+' · 留 '+r.percent+'% 现金</p></div>'+stats(state)+'<div class="chapter-grid"><div><section class="panel"><div class="event-head"><h3>历史市场</h3><strong class="market-move">'+(change>0?'+':'')+change.toFixed(2)+'%</strong></div><p class="market-note">'+C.marketNotes[state.turn]+'</p><p class="muted">从上一年末到本年末的价格变化</p></section><article class="panel section-gap"><span class="event-tag">人生故事 · 虚构情境</span><h2 class="event-title">'+(r.shock.gross?r.shock.label:'平常日子里的选择')+'</h2><p class="story">'+ch.event+'</p>'+(r.shock.gross?'<p class="section-gap">事件金额 <strong class="red">'+m(r.shock.gross)+' 万日元</strong></p>':'')+'<p class="insight">'+effect+'</p></article><section class="panel section-gap"><h3>钱怎样变化了</h3><div class="section-gap">'+V.bars(rows.slice(1))+'</div><p class="muted section-gap">收入 '+m(r.income)+' 万 − 必要开支 '+m(r.expense)+' 万 = '+sign(r.flow)+' 万。</p></section></div><aside>'+market()+'<details class="panel section-gap"><summary>完整年度账本</summary><table><tbody>'+rows.map(([a,b])=>'<tr><th>'+a+'</th><td>'+sign(b)+' 万</td></tr>').join('')+'</tbody><tfoot><tr><th>期末净资产</th><td>'+m(r.net)+' 万</td></tr></tfoot></table><p class="muted section-gap">期末现金 '+m(r.cash)+' 万 + 股票 '+m(r.stock)+' 万 − 未付款 '+m(r.debt)+' 万。</p><p class="muted">年初为生活支出主动变现 '+m(r.plannedSale)+' 万；年末为收支缺口被迫变现 '+m(r.forcedSale)+' 万。变现是资产转换，不能再从净资产重复扣除。</p></details>'+goal(state)+'<button class="button primary-action" id="next">'+(state.turn===7?'打开我的七年年报':'走进 '+(r.year+1)+' 年')+'</button><p class="action-note">这一年的选择已经自动保存</p></aside></div></section>';
 $('#next').onclick=()=>{draft={choice:null,percent:draft.percent};show(state.turn===7?'report':'decision');};
}
const sum=(s,k)=>s.history.reduce((a,r)=>a+r[k],0);
function historicalContext(){
 return '<details class="panel section-gap history-panel"><summary>时代剪报 · 三个历史节点</summary><p class="muted section-gap">历史回顾，非当年新闻原文。根据日本银行 2000 年发布的回顾整理；下方的家庭故事仍是虚构情境。</p><ol class="history-clips">'+C.historicalEvents.map(e=>'<li><time>'+e.year+'</time><div><h3>'+e.title+'</h3><p>'+e.text+'</p></div></li>').join('')+'</ol><a class="history-source" href="'+C.historySource+'" target="_blank" rel="noopener noreferrer">查看日本银行原始史料 ↗</a><p class="insight">市场变化会影响持仓价值，家庭账单决定钱何时要用。你的现金安排，把这两件事接到了一起。</p></details>';
}
function report(){
 const total=E.net(state),gain=sum(state,'gain'),forced=sum(state,'forcedSale');
 game.innerHTML='<section class="screen"><header class="annual-header"><p class="kicker">日本篇 · '+C.scenarios[state.scenario].name+' · 人生编号 '+state.seed+'</p><h1 tabindex="-1">1995 家庭年报</h1><p>七年已过。财富、余地和你在乎的人，都留在这本账里。</p></header><section class="panel"><div class="report-total"><h2>期末净资产</h2><strong>'+m(total)+' <small>万日元</small></strong></div><div class="report-stats"><div>累计市场损益<b>'+sign(gain)+'<small> 万</small></b></div><div>现金缓冲<b>'+one(E.buffer(state))+'<small> 个月</small></b></div><div>生活满意度<b>'+state.mood+'<small> /100</small></b></div></section><div class="report-grid"><div><section class="panel"><h2>另一种可能</h2><p class="story">只改某一年的现金比例，重新算完这七年。</p><div class="compare-controls"><label>改哪一年 <select id="compare-year" aria-label="对照年份">'+C.chapters.map((_,i)=>'<option value="'+i+'" '+(i===comparisonTurn?'selected':'')+'>'+C.years[i+1]+'</option>').join('')+'</select></label><label>现金比例 <input id="compare-percent" type="number" min="0" max="100" value="'+comparisonPercent+'" aria-label="对照现金比例">%</label><button class="small-button" id="apply-compare">重新对照</button></div><div class="section-gap" id="compare-chart"></div><div id="compare-results"></div><p class="comparison-note">两条路径拥有同一家庭背景、意外和生活选择，其余年份的现金比例也保持不变。折线是家庭净资产，包含收入、消费和市场涨跌。</p></section><section class="panel section-gap"><h3>家庭约定</h3>'+goal(state)+'<p class="section-gap">累计被迫变现 <strong>'+m(forced)+' 万</strong>；期末未付款 <strong>'+m(state.debt)+' 万</strong>。</p><p class="muted">没有只按财富排序的总分。每个选择的代价，都可以回到日志里看见。</p></section></div><aside>'+journey()+historicalContext()+'<section class="panel section-gap quiz"><h3>把经验带到下一次</h3><p class="story">半年后要交学费。股票暂时亏损，但这不意味着一定要今天卖。你首先会看什么？</p><div class="choice-list"><button class="choice" data-quiz="wrong"><span>猜下个月股票会不会反弹</span></button><button class="choice" data-quiz="right"><span>手头现金能否覆盖学费和生活开支</span></button><button class="choice" data-quiz="wrong"><span>只比较朋友赚了多少钱</span></button></div><p id="quiz-feedback" class="insight" hidden role="status"></p></section><div class="primary-action"><button class="button" id="replay">再过一次这七年</button><button class="button secondary" id="share">邀请朋友，同场体验</button><button class="button secondary" id="export-report">下载我的年报</button></div></aside></div></section>';
 $('#compare-year').onchange=()=>{comparisonTurn=Number($('#compare-year').value);};
 $('#apply-compare').onclick=()=>{const p=Number($('#compare-percent').value);if(!E.percent(p)){toast('现金比例请输入 0–100 的整数');return;}comparisonPercent=p;updateComparison();};
 updateComparison();
 document.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>{$('#quiz-feedback').hidden=false;$('#quiz-feedback').textContent=b.dataset.quiz==='right'?'对。先看钱什么时候要用，以及现金是否足够。价格下跌与必须卖出，是两个不同的问题。':'再想一步：行情很难预知，但学费的时间和金额可以先列出来，看看手头现金够不够。';});
 $('#replay').onclick=()=>confirmRestart(()=>fresh(state.seed,state.scenario));$('#share').onclick=share;$('#export-report').onclick=downloadReport;
}
function updateComparison(){
 const other=E.counterfactual(state,comparisonTurn,comparisonPercent),diff=E.net(other)-E.net(state);
 $('#compare-chart').innerHTML=V.line([{name:'你的决定',color:'#852d26',values:[100,...state.history.map(r=>r.net/10000)]},{name:'只改一次分配',color:'#37596b',values:[100,...other.history.map(r=>r.net/10000)]}],C.years);
 const rows=[['期末净资产',m(E.net(state))+' 万',m(E.net(other))+' 万'],['现金缓冲',one(E.buffer(state))+' 月',one(E.buffer(other))+' 月'],['累计被迫变现',m(sum(state,'forcedSale'))+' 万',m(sum(other,'forcedSale'))+' 万'],['期末未付款',m(state.debt)+' 万',m(other.debt)+' 万']];
 $('#compare-results').innerHTML='<table><thead><tr><th>结果</th><th>你的决定</th><th>另一种分配</th></tr></thead><tbody>'+rows.map(r=>'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</tbody></table><p class="insight">'+C.years[comparisonTurn+1]+' 年的现金比例从 '+state.commands[comparisonTurn].percent+'% 改为 '+comparisonPercent+'%，七年末净资产变化 '+sign(diff)+' 万。<br>这是一段已发生历史的对照，不代表下一次行情也会给出相同结果。</p>';
}
function render(scroll=false){
 try{({welcome,decision,settlement,report}[phase]||welcome)();}
 catch(e){notice('页面暂时没能显示。进度仍保留，请刷新或导出存档。');console.error(e);}
 if(scroll){window.scrollTo(0,0);$('h1')?.setAttribute('tabindex','-1');$('h1')?.focus({preventScroll:true});}
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportSave(){if(!state){toast('开始游戏后才能导出进度');return;}download('人生CFO-'+state.seed+'-存档.json',JSON.stringify({run:E.pack(state),phase,draft},null,2),'application/json');}
function downloadReport(){
 const lines=['人生 CFO · 1995 家庭年报','人生编号 '+state.seed+' · '+C.scenarios[state.scenario].name,'期末净资产 '+m(E.net(state))+' 万日元','现金缓冲 '+one(E.buffer(state))+' 个月','生活满意度 '+state.mood+'/100','累计市场损益 '+sign(sum(state,'gain'))+' 万','累计被迫变现 '+m(sum(state,'forcedSale'))+' 万','',...state.history.map(r=>r.year+' | '+r.title+' | 现金 '+r.percent+'% | 期末净资产 '+m(r.net)+' 万'),'','同场体验：'+challengeUrl(),'历史市场取自日本内阁府与日本证券业协会；人物、收入、费用及事件均为虚构教学模型。'];
 download('人生CFO-'+state.seed+'-家庭年报.txt',lines.join('\n'),'text/plain;charset=utf-8');
}
function challengeUrl(){const url=new URL('https://outlier27-cell.github.io/life-cfo-japan/japan.html');url.searchParams.set('seed',state?.seed||chosenSeed);url.searchParams.set('family',state?.scenario||chosenScenario);return url.href;}
async function share(){
 const text='《人生 CFO》日本篇：7 个年份，14 次决定。和我用同一个人生编号，看看你会怎么安排。';
 try{if(navigator.share){await navigator.share({title:'人生 CFO · 日本篇',text,url:challengeUrl()});return;}await navigator.clipboard.writeText(text+'\n'+challengeUrl());toast('试玩邀请已复制，可以粘贴到群里');}
 catch(e){if(e.name==='AbortError')return;modal('<h2>邀请朋友，同场体验</h2><p>复制下面的链接。相同背景和编号使用同一组意外，朋友的进度保存在他们的设备上。</p><textarea readonly aria-label="试玩邀请">'+esc(text+'\n'+challengeUrl())+'</textarea>');}
}
function source(){
 const t=state?state.turn:0;
 modal('<h2>史料与计算说明</h2><p>历史市场来自真实年末观测点；人物、收入、住房、保障及意外是虚构的教学情境。</p><table class="source-table"><thead><tr><th>已走过的年份</th><th>日经 225 · 点</th></tr></thead><tbody>'+C.years.slice(0,t+1).map((y,i)=>'<tr><th>'+y+'</th><td>'+yen.format(C.prices[i]/100)+'</td></tr>').join('')+'</tbody></table><p>未来数值会在每年的选择完成后揭晓。外部完整史料包含后续年份。</p><a href="https://www.esri.cao.go.jp/jp/esri/prj/sbubble/yearly/yearly.pdf" target="_blank" rel="noopener noreferrer">日本内阁府 · 长期经济指标</a><a href="https://www.jsda.or.jp/shiryoshitsu/toukei/factbook/files/efb1999.pdf" target="_blank" rel="noopener noreferrer">日本证券业协会 · Fact Book 1999，第 18 页（PDF 第 20 页）</a><a href="'+C.historySource+'" target="_blank" rel="noopener noreferrer">日本银行 · 1989–1991 年政策与资产价格回顾（2000 年发布）</a><p>日经 225（Nikkei 225，© Nikkei Inc.）。本作品独立制作，自行绘图。模拟股票仓仅跟随指数价格，不代表当年的真实可交易产品。</p><p>结算顺序：支付生活选择的即时费用 → 按年初已知点位分配现金和股票 → 按年末点位计价 → 结算全年收入与必要支出 → 支付意外账单。现金不足时卖出股票，仍不足则记录未付款；以后收支结余先偿还未付款。</p><p>现金收益为零；不计股息、税费、交易成本和债务利息；持仓估值取整到日元。年度模型不反映年内资金紧张。保障仅是本章的虚构合同，从选择起每年 6 万，承担本章医疗账单的一半。满意度是剧情数值，并非健康或幸福测量。</p>');
}
function menu(){
 modal('<h2>我的存档</h2><p>进度只保存在当前设备的浏览器。换手机或清理浏览器前，可以导出备份。</p><div class="toolbar"><button class="small-button" id="save-export">导出存档</button><button class="small-button" id="save-import">导入存档</button></div><button class="button secondary section-gap" id="menu-home">回到首页</button><p>日本篇 2.0 · '+(state?'人生编号 '+state.seed+' · 已完成 '+state.turn+'/7 年':'尚未开始')+'</p><p>旧版单年试玩记录仍保留，七年篇使用独立存档。你可以分享相同人生编号，分别体验同一组意外。</p><button class="small-button" id="menu-share">复制同场邀请</button>');
 $('#save-export').onclick=exportSave;$('#save-import').onclick=()=>$('#import-file').click();$('#menu-home').onclick=()=>{dialog.close();show('welcome');};$('#menu-share').onclick=share;
}
$('#import-file').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 try{if(file.size>20000)throw Error('存档文件过大');const raw=await file.text(),loaded=parseSave(raw);modal('<h2>导入这段人生？</h2><p>人生编号 '+loaded.s.seed+' · '+C.scenarios[loaded.s.scenario].name+' · 已完成 '+loaded.s.turn+'/7 年。会替换当前进度。</p><button class="button" id="import-confirm">确认导入</button>');$('#import-confirm').onclick=()=>{state=loaded.s;phase=loaded.p;draft=loaded.d;savedPhase=phase;persist();dialog.close();render(true);};}
 catch{toast('无法导入：文件损坏或版本不兼容。当前进度保持不变。');}
};
$('#brand').onclick=e=>{e.preventDefault();show('welcome');};$('#source-button').onclick=source;$('#menu-button').onclick=menu;
window.addEventListener('storage',e=>{if(e.key===key&&e.newValue!==saveToken)notice('另一个标签页更新了进度，请刷新后继续。');});
render();

