(()=>{'use strict';
const F=FamilyEngine,S=FamilySocial,G=FamilyCharts,D=ProData,H=ProHistory,P=ProPlanning,T=FamilyStories,L=FamilyLedger;
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],game=$('#game'),dialog=$('#dialog');
const saveFailure='本机保存失败，当前页仍可玩；离开前请导出存档。';
const KEY='life-cfo:family:v7',BACK=KEY+':backup',FRIENDS=KEY+':friends',PREVIOUS=KEY+':previous';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rand=()=>crypto.getRandomValues(new Uint32Array(1))[0]%999999999+1;
const q=new URLSearchParams(location.search);let seed=F.validSeed(Number(q.get('run')))?Number(q.get('run')):rand();
const invitedStory=q.get('mode')==='story'||(!q.has('mode')&&q.has('run')&&/^7\.[01](?:\.|$)/.test(q.get('v')||''));
const defaultMode=invitedStory?'story':['auto','monthly'].includes(q.get('mode'))?q.get('mode'):(!q.has('mode')&&q.has('run')&&/^7\.3(?:\.|$)/.test(q.get('v')||''))?'monthly':'briefing';
const modeName=mode=>({briefing:'年度简报',monthly:'7.3 月度现金流',auto:'7.2 年度结算',story:'故事模式'})[mode||'story'];
let state=null,screen='home',resumeScreen='life',draft={choice:null,policy:null,note:'',stress:''},notes=[],token=null,validToken=false,conflict=false,friends=[],previous=[],selectedYear=0,benchmarks=null;
const scale=s=>s.country==='JP'?10000:1,unit=s=>({JP:'万日元',US:'美元',GB:'英镑',CA:'加元'}[s.country]);
const num=v=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(v===0?0:v);
const amount=(v,s=state)=>num(v/scale(s)),money=(v,s=state)=>amount(v,s)+' '+unit(s),signed=v=>(v>0?'+':'')+money(v);
const status=s=>s.outcome==='completed'?'完成30年':s.outcome==='bankrupt'?'破产结束':s.outcome==='plan_unaffordable'?'生活计划无法支付':'进行到第'+s.turn+'年';
function notice(text){$('#notice').textContent=text;$('#notice').hidden=false;}
function clearToast(){
 clearTimeout(toast.timer);
 $('#toast').hidden=true;
 $('#dialog-status').textContent='';
}
function toast(text){
 clearToast();
 const target=dialog.open?$('#dialog-status'):$('#toast');
 target.hidden=false;
 target.textContent=text;
 toast.timer=setTimeout(clearToast,4500);
}
function modal(html){clearToast();$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#dialog-content').scrollTop=0;const h=$('#dialog-content').querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
function cleanNote(v){if(typeof v!=='string'||Array.from(v).length>80)throw Error('理由最多80字');return v.normalize('NFC').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,' ').trim();}
function readSave(text){
 if(typeof text!=='string'||text.length>120000)throw Error('存档过长');const raw=JSON.parse(text),s=F.restore(raw.run);
 const arr=raw.notes??[];if(!Array.isArray(arr)||arr.length>s.turn)throw Error('便签年份不匹配');
 const n=arr.map(x=>{if(x===null)return null;if(!x||!['','medical','double','bill'].includes(x.stress??''))throw Error('便签无效');return{note:cleanNote(x.note??''),stress:x.stress??''};});
 const d=raw.draft||{},p=d.policy?F.policy(d.policy):F.defaultPolicy(s);if(!['','medical','double','bill'].includes(d.stress??''))throw Error('草稿情景无效');
 const view=s.phase==='ended'?'report':s.phase==='crisis'?'crisis':s.phase==='allocate'?'allocate':raw.screen==='settlement'&&s.turn?'settlement':'life';
 return{s,n,d:{choice:[0,1].includes(d.choice)?d.choice:null,policy:p,note:cleanNote(d.note??''),stress:d.stress??''},view};
}
function envelope(){return{run:F.pack(state),notes,draft,screen:resumeScreen};}
function writable(){if(conflict){notice('另一个页面更新了这段人生。请刷新后继续，当前页面不会覆盖它。');return false;}try{if(localStorage.getItem(KEY)!==token){conflict=true;return writable();}}catch{}return true;}
function save(){if(!state||!writable())return;try{const text=JSON.stringify(envelope());if(text!==token){if(token&&validToken)localStorage.setItem(BACK,token);localStorage.setItem(KEY,text);}token=text;validToken=true;if($('#notice').textContent===saveFailure)$('#notice').hidden=true;$('#save-status').textContent='进度已保存在本机';}catch{$('#save-status').textContent='尚未保存，请导出备份';notice(saveFailure);}}
function load(){try{token=localStorage.getItem(KEY);if(token){let loaded;try{loaded=readSave(token);validToken=true;}catch{try{loaded=readSave(localStorage.getItem(BACK));notice('主存档损坏，已恢复上一份有效备份。');}catch{notice('存档无法读取，原文件仍保留。可以导入备份或开启新人生。');}}if(loaded){state=loaded.s;notes=loaded.n;draft=loaded.d;screen=resumeScreen=loaded.view;}}
 const p=JSON.parse(localStorage.getItem(PREVIOUS)||'[]');if(Array.isArray(p)&&p.length<=3)previous=p.filter(x=>{try{return F.restore(x).phase==='ended';}catch{return false;}});
 }catch{notice('部分本机记录无法读取，可从存档菜单导入备份。');}}
function replaceAddress(url){try{history.replaceState(history.state,'',url.href);}catch{}}
function show(view,scroll=true){screen=view;if(view!=='home'){
 resumeScreen=view;seed=state.seed;
 const url=new URL(location.href);
 if(url.searchParams.has('run')){url.searchParams.set('run',String(seed));url.searchParams.set('mode',state.mode||'story');replaceAddress(url);}
 }render();save();if(scroll){window.scrollTo(0,0);const h=game.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}}
function fresh(n,mode){if(!writable())return;if(state?.phase==='ended'){previous=[...previous.filter(x=>x.seed!==state.seed||x.mode!==state.mode),F.pack(state)].slice(-3);try{localStorage.setItem(PREVIOUS,JSON.stringify(previous));}catch{toast('上一局未能保存，请先导出备份');}}
 state=F.start(n,mode);seed=n;notes=[];draft={choice:null,policy:F.defaultPolicy(state),note:'',stress:''};benchmarks=null;show('life');}
function newGame(n,mode=defaultMode){if(!state||(!state.revision&&draft.choice===null)){fresh(n,mode);return;}modal(`<h2>重新开启这段人生？</h2><p>本机当前进度会被替换。已结束的这一局会保留作重玩对照，也可以先导出备份。</p><button class="button" id="confirm-new">确认重新开始</button>`);$('#confirm-new').onclick=()=>{dialog.close();fresh(n,mode);};}
function dispatch(c){if(!writable())return;try{const n=cleanNote(draft.note),turn=state.turn;state=F.dispatch(state,{...c,revision:state.revision});if(c.type==='allocate'){while(notes.length<turn)notes.push(null);notes[turn]={note:n,stress:draft.stress};}draft={choice:null,policy:F.defaultPolicy(state),note:'',stress:''};benchmarks=null;show(state.phase==='crisis'?'crisis':state.phase==='ended'?'report':c.type==='allocate'?'settlement':state.phase);}catch(e){toast(e.message);}}
function progress(){const year=screen==='life'||screen==='allocate'?state.turn+1:state.turn;return `<div class="progress-heading"><span>${D.countries[state.country].name} · ${state.era}年起点</span><span>第 ${year} / 30 年</span></div><div class="progress-line" role="progressbar" aria-label="已完成年度" aria-valuemin="0" aria-valuemax="30" aria-valuenow="${state.turn}"><i style="width:${state.turn/30*100}%"></i></div>`;}
function art(name,alt){return `<figure class="story-art"><img src="${globalThis.FamilyArt?.[name]||'assets/story-'+name+'.webp'}" width="1200" height="675" alt="${esc(alt)}" decoding="async"><figcaption><a href="sources.html#art">情境插画 · 素材说明</a></figcaption></figure>`;}
function commonIncome(ch){const extra=ch.choices[0]?.extra||0;return extra>0&&ch.choices.every(o=>o.extra===extra)?Math.round(extra*F.month(state)):0;}
function lifeCost(choice){const a=F.lifePreview(state,choice),parts=[];a.incomeDelta-=commonIncome(F.event(state));if(a.cost)parts.push('本次支出 '+money(a.cost));if(a.gift)parts.push('收到遗产 '+money(a.gift));if(a.incomeDelta)parts.push('本年收入 '+signed(a.incomeDelta));if(!a.cost&&!a.gift&&!a.incomeDelta)parts.push('本次不额外花钱');if(a.nextIncome)parts.push('明年起年收入约增加 '+money(a.nextIncome));if(a.coverage!==undefined)parts.push(a.coverage?'每年保费 '+money(F.month(state)*.6)+'，医疗报销50%':'停止交保费，医疗账单自付');if(a.maintenance)parts.push('本年起五年维修账单减半');if(a.housing!==undefined)parts.push(a.housing?'以后每年租住开支增加 '+money(F.month(state)*2.4):'取消大房间的额外租住开支');if(a.child)parts.push('另有每年养育支出 '+money(F.month(state)*2)+'，至18岁');if(a.sale)parts.push('需卖出投资 '+money(a.sale)+'，交易费 '+money(a.fee));return parts.map(x=>esc(x)).join('<br>');}
function journalContent(){if(state.mode){
 const items=state.history.filter(r=>r.shock.kind!=='none'||r.householdBill||r.events?.length);
 return items.length?`<ol class="event-history">${items.map(r=>`<li><b>${r.year}</b>${state.mode==='briefing'?`<ul>${r.events.map(e=>`<li>${e.month} 月 · ${esc(e.title)}</li>`).join('')}</ul>`:automaticResult(r)}</li>`).join('')}</ol>`:'<p>目前没有额外的家庭收支事件。</p>';
 }const j=F.journal(state);return `<div class="cast-list">${FamilyScenes.cast(state)}</div>${j.threads.length?`<div class="story-threads">${j.threads.map(t=>`<article><h3>${esc(t.title)}</h3><p>${esc(t.status==='closed'?t.outcome:'还在继续')}</p><details><summary>翻看这段故事的照片</summary>${FamilyScenes.render(state,{chain:t.id,nodeId:t.stage,personId:t.personId,title:t.title,displayYear:state.era+t.lastTurn+1})}</details></article>`).join('')}</div>`:'<p>刚开始的日子，人物和约定会逐年留下记录。</p>'}<ol class="memory-list">${j.memories.map(m=>`<li><time>${m.year}</time><span>${esc(m.text)}</span></li>`).join('')}</ol>`;}
function journal(){if(!state){toast('开始人生后，就能留下故事');return;}modal('<h2>这些年，家里的人和事</h2>'+journalContent());}
function remembered(row){const f=row.storyFeedback;return `<section class="year-story">${f?.chain?FamilyScenes.render(state,{...row.lifeEvent,routeOverride:f.choiceId,displayYear:row.year}):''}${f?`<h2>${esc(f.title)}</h2><p>${esc(f.log)}</p>`:''}${(row.storyReplies||[]).map(r=>`<p class="story-return">${esc(r.text)}</p>`).join('')}</section>`;}
function currentReply(){const f=state.pending?.storyFeedback;return f?`<div class="immediate-reply" role="status"><strong>${esc(f.person||'这一年的安排')}</strong><p>${esc(f.reply)}</p></div>`:'';}

function strip(w){return `<div class="allocation-strip" role="img" aria-label="现金股票债券黄金比例 ${w.join('/')}%">${w.map((v,i)=>`<i class="asset-${i}" style="width:${v}%"></i>`).join('')}</div><p class="allocation-key">现金 ${w[0]}% · 股 ${w[1]}% · 债 ${w[2]}% · 金 ${w[3]}%</p>`;}
function balanceSheet(s,title='家庭资产负债表'){const assets=F.totalAssets(s),debt=F.totalDebt(s),rows=[['现金',s.cash],['股票',s.stock],['债券模型',s.bond],['黄金',s.gold],['住房',s.house],['汽车',s.car]];return `<section class="balance-sheet"><h2>${title}</h2><p class="unit-note">金额单位：${unit(state||s)} · 保险保障单独记费用与赔付</p><div class="balance-columns"><div><h3>资产 <b>${amount(assets,state||s)}</b></h3><dl>${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${amount(v,state||s)}</dd></div>`).join('')}</dl></div><div><h3 class="debt-heading">负债 <b>${amount(debt,state||s)}</b></h3><dl><div><dt>房贷余额</dt><dd>${amount(s.mortgage,state||s)}</dd></div><div><dt>未付账单</dt><dd>${amount(s.debt,state||s)}</dd></div></dl><p class="chart-note">房贷是尚未归还的本金；未付账单是已到期、仍无法支付的金额。</p></div></div><p class="net-line ${assets-debt<0?'negative':''}">净资产 <strong>${money(assets-debt,state||s)}</strong></p>${G.balance(assets,debt,v=>money(v,state||s))}</section>`;}
function home(){const id=F.identity(seed),c=D.countries[id.country],h=WorldContent.households[id.household];game.innerHTML=`<section class="home-screen"><div>${FamilyPhotos.yearVisual(id.era,H.briefing(id.era)[0].title,true)}<h1>三十年，家里会发生什么</h1><p class="lead">三十年里，家庭会遇上收入变化、意外账单和添丁搬家。每年安排一次家里的钱，年末一起对账。</p></div><div class="home-start"><h2>这次，从${c.name}开始</h2><p>${id.era}年 · 24岁 · ${h.name}</p><p>起步家庭总资产 ${money(c.monthly*h.cash,id)}。${h.story}</p><button class="text-button" id="reroll">换一种人生</button><div class="actions">${state?`<button class="button" id="resume">继续我的人生 · ${state.turn}/30年</button><button class="button secondary" id="start">开启上面这段人生</button>`:`<button class="button" id="start">开始我的人生</button>`}</div><details><summary>和朋友用同一个编号</summary><label for="seed">人生编号</label><input id="seed" type="number" min="1" max="999999999" value="${seed}" inputmode="numeric"><button class="small-button" id="seed-go">查看这个开局</button><button class="text-button" id="invite">复制同场邀请</button></details><p class="muted">日本、美国、英国、加拿大；三个历史起点。最多 30 年，${defaultMode!=='story'?'家庭事件自动发生':'每年先做生活选择'}。无法清偿时会提前结束。市场使用历史数据，人物和家庭合同为教学设定。</p><p><a href="guide.html">第一次玩，看看玩法</a></p><details><summary>故事玩法与旧版进度</summary><p><button class="text-button" id="start-story">以故事模式开局</button></p><p>7.0 和 7.1 的家庭可在这里继续。更早的存档可通过下面的入口打开。</p><a href="family-v6.html">6.0家庭账本旧存档</a> · <a href="family-v5.html">5.0家庭篇旧存档</a> · <a href="multi-v4.html">4.2多资产篇旧存档</a> · <a href="world-v3.html">3.0全球篇</a> · <a href="japan.html">日本七年篇</a></details></div></section>`;
 $('#reroll').onclick=()=>{seed=rand();render();};$('#start').onclick=()=>newGame(seed);$('#start-story').onclick=()=>newGame(seed,'story');if($('#resume'))$('#resume').onclick=()=>show(resumeScreen);$('#seed-go').onclick=()=>{const n=Number($('#seed').value);if(!F.validSeed(n)){toast('请输入1至999999999的整数');return;}seed=n;render();};$('#invite').onclick=()=>share(S.challenge(seed,defaultMode),'同一开局，各自配置');}
function purchaseSummary(purchase, preview=false){
 if(!purchase)return '';
 const {ok,down,fee,loan,arrears,shortfall}=purchase;
 const title=ok?(preview?'本年可购房':'本年已购房'):(preview?'今年无法购房':'本年购房未成交');
 const reason=arrears?'仍有 '+money(arrears)+' 未付款。':shortfall?'首付和交易费还差 '+money(shortfall)+'。':'';
 return `<p class="housing-status${ok?'':' warning'}"><b>${title}</b> · ${ok?
  '首付 '+money(down)+'，交易费 '+money(fee)+'，贷款 '+money(loan)+'。':
  '首付和交易费共需 '+money(down+fee)+'。'+reason+'未扣首付，也未新增贷款。'}</p>`;
}
function mortgageSummary(balance,payment,label='本年应还'){
 return `<p class="housing-status">房贷本金余额 <b>${money(balance)}</b> · ${label} <b>${money(payment)}</b></p>`;
}
function settledHousing(row){
 const payment=row.mortgagePayment;
 const cleared=row.resolution?.soldHouse?'危机处置已出售住房并结清房贷。':row.policy.house==='sell'?'出售住房时已结清房贷。':'房贷已结清。';
 return purchaseSummary(row.housePurchase)+(row.mortgage? mortgageSummary(row.mortgage,payment,'本年度计入还款') :
  (payment||row.resolution?.soldHouse||row.policy.house==='sell')?`<p class="housing-status">${cleared}${payment?' 本年度计入还款 '+money(payment)+'。':''}</p>`:'');
}
function assetsOverview(s,label){
 return `<dl class="assets-overview" aria-label="${label}"><div><dt>${label}</dt><dd>${money(F.totalAssets(s))}</dd></div><div><dt>总负债</dt><dd>${money(F.totalDebt(s))}</dd></div><div><dt>净资产</dt><dd>${money(F.net(s))}</dd></div></dl>`;
}
function familySignal(s){
 const f=s.monthlyFamily;
 if(f.unemployed>1)return '仍在求职。恢复工资前，先留足几个月必要支出。';
 if(f.childAge>=0&&f.childAge<216)return '育儿和住房开支比以前高，搬家或买房时先核对现金。';
 if(f.care>0)return '照护开支还会持续，按已知账单准备现金。';
 if(s.mortgage)return '仍有 '+money(s.mortgage)+' 房贷本金。今后每月还款会占用现金。';
 return '眼下没有新增的长期家庭开支。意外收支仍可能发生。';
}
function briefing(){
 const k=F.known(state),h=H.briefing(k.year)[0];
 const signals={
  'JP:1989':['日本银行开始收紧货币政策','5 月，日本银行调高贴现率。','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf'],
  'JP:1991':['日本银行下调贴现率','7 月，官方贴现率从 6% 降至 5.5%。','https://www.boj.or.jp/en/mopo/mpmdeci/mpr_2024/k241219b.pdf'],
  'JP:1999':['日本进入零利率政策时期','2 月，日本银行采取零利率政策。','https://www.boj.or.jp/en/mopo/mpmdeci/mpr_1999/k990921a.htm'],
  'CA:1991':['加拿大采用通胀目标','加拿大银行与联邦政府公布通胀控制目标。','https://www.bankofcanada.ca/core-functions/monetary-policy/agreement-inflation-control-target/'],
  'GB:1992':['英国退出欧洲汇率机制','9 月，英镑退出欧洲汇率机制。','https://www.bankofengland.co.uk/about/history'],
  'US:1987':['美国股市大跌','10 月股市大幅下跌，随后美联储宣布支持流动性。','https://www.federalreservehistory.org/essays/stock-market-crash-of-1987'],
  'US:2020':['美联储下调政策利率','3 月，目标区间降至 0–0.25%。','https://www.federalreserve.gov/newsevents/pressreleases/monetary20200315a.htm']
 };
 const local=signals[state.country+':'+k.year];
 const repeated=local&&['JP:1989','CA:1991','GB:1992','US:1987','US:2020'].includes(state.country+':'+k.year);
 const items=[
  ['住房','本地住房指数 '+signedPct(k.house)+'。如果房价继续涨，首付会改变；如果回落，净资产也会受影响。'],
  ['外汇与黄金','本币计价黄金 '+signedPct(k.gold)+'。金价和汇率都可能影响明年的结果。'],
  ['利率','美国十年债收益率为 '+num(k.yield)+'%。利率变动会影响债券估值。']
 ];
 const [topic,detail]=items[WorldEngine.noise(state.seed,40470+state.turn)%items.length];
 const localLead=[['股指',k.local],['住房价格',k.house],['物价',k.cpi]].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0];
 const question=k.local<0?'本地股价已经回落。你更担心下跌持续，还是更担心现金留太多、错过反弹？':'本地股价没有下跌。你更愿意多留现金防意外，还是继续承担市场波动？';
 return `<section class="annual-brief"><p class="brief-date">截至 ${k.year} 年 12 月</p><h1>${k.year+1} 年配置前简报</h1>
 <dl class="brief-stories"><div><dt>本地 · ${D.countries[state.country].name}</dt><dd>${local?`<strong>${local[0]}</strong>。${local[1]} <a href="${local[2]}" target="_blank" rel="noopener noreferrer">出处</a>。`:`<strong>${localLead[0]}${localLead[1]<0?'回落':'上升'} ${signedPct(localLead[1])}</strong>。<a href="sources.html">历史统计</a>。`}过去一年股指 ${signedPct(k.local)}，物价 ${signedPct(k.cpi)}。</dd></div>
 <div><dt>${repeated?'国际市场':'国际与政策 · '+esc(h.title)}</dt><dd>${repeated?'四国组合按本币计价 '+signedPct(k.global)+'，本币黄金 '+signedPct(k.gold)+'。<a href="sources.html">数据</a>':`${esc(h.text)} <a href="${esc(h.source)}" target="_blank" rel="noopener noreferrer">出处</a>`}</dd></div>
 <div><dt>家里的事</dt><dd>${familySignal(state)}</dd></div></dl>
 <p class="brief-question">${question} 下一年的市场走势和临时账单要等结算时揭晓。</p>
 <details><summary>再读一条 · ${topic}</summary><p>${detail}</p></details>
 </section>`;
}
function signedPct(x){return (x>0?'+':'')+num(x*100)+'%';}
function automaticYear(){
 const prepared=F.dispatch(state,{type:'auto',revision:state.revision}),p=prepared.pending;
 game.innerHTML=`<section class="play-screen auto-year">${progress()}${state.mode==='briefing'?briefing():`<h1>${state.era+state.turn+1} 年，家里的钱</h1>`}${assetsOverview(state,'年初家庭总资产')}
   ${state.mode==='briefing'?'':`<div class="auto-brief"><h2>${esc(p.title)}</h2><p>${esc(p.event.story)}</p>${p.householdBill?`<p>已知搬家费用 <b>${money(p.householdBill)}</b></p>`:''}
   ${state.mortgage?mortgageSummary(state.mortgage,F.budget(state).mortgagePayment):''}</div>`}
   <button class="button primary-action" id="auto-continue">安排今年的资产</button>${state.monthlyFamily?annualPhoto(F.known(state).year):''}</section>`;
 $('#auto-continue').onclick=()=>dispatch({type:'auto'});
}
function life(){if(state.mode){automaticYear();return;}const ch=F.event(state),image=T.imageFor(state,ch);game.innerHTML=`<section class="play-screen">${progress()}<div class="life-layout"><div>${ch.chain?FamilyScenes.render(state,ch):art(image,ch.title)}<h1>${esc(ch.title)}</h1><p class="lead">${esc(ch.story)}</p></div><div><p class="decision-context">手边现金 ${money(state.cash)}</p>${state.mortgage?mortgageSummary(state.mortgage,F.budget(state).mortgagePayment):''}${commonIncome(ch)?`<p class="shared-income">两种安排都会收到本年奖金 ${money(commonIncome(ch))}。</p>`:''}<div class="life-options">${ch.choices.map((o,i)=>`<button class="choice ${draft.choice===i?'selected':''}" data-choice="${i}" aria-pressed="${draft.choice===i}" ${F.affordable(state,o)?'':'disabled'}><b>${esc(o.title)}</b><span>${lifeCost(i)}</span>${!F.affordable(state,o)?'<small>可用资金不够，暂不可选</small>':''}</button>`).join('')}</div><button class="button primary-action" id="life-confirm" ${draft.choice===null?'disabled':''}>就这样安排</button><details class="choice-detail"><summary>安排细节与家庭账本</summary><p>显示的是已知金额。未来行情、工资意外与账单，年末再结算。</p>${ch.choices.map(o=>o.text?`<p><b>${esc(o.title)}</b>：${esc(o.text)}</p>`:'').join('')}${balanceSheet(state,'现在的资产与负债')}</details></div></div></section>`;
 all('[data-choice]').forEach(b=>b.onclick=()=>{draft.choice=Number(b.dataset.choice);show('life',false);});$('#life-confirm').onclick=()=>dispatch({type:'life',choice:draft.choice});}

function annualPhoto(year){
 const h=H.briefing(year)[0];
 return `<section class="year-image"><h2>${year} 年 · ${esc(h.title)}</h2>${FamilyPhotos.yearVisual(year,h.title)}</section>`;
}
function yearMedia(h){
 return `<p>${esc(h.text)}</p>${FamilyPhotos.yearVisual(h.year,h.title)}${FamilyPhotos.extraVisual(h.year,h.title)}<p class="muted"><a href="${esc(h.source)}" target="_blank" rel="noopener noreferrer">核对历史事件来源</a></p>`;
}
function news(settled=false){
 const k=F.known(state),h=H.briefing(k.year)[0],past=L.past(state);
 return `<details class="optional news-brief"><summary>${settled?"年末回顾":"决策前回顾"} ${k.year} 年 · ${esc(h.title)}</summary>${yearMedia(h)}<details><summary>展开真实行情</summary>${G.line(past.series,past.dates,'期初=100','过去12个月的价格变化',{tight:true})}<div class="past-values"><p>本地股价 <b>${num(k.local*100)}%</b></p><p>本币黄金 <b>${num(k.gold*100)}%</b></p><p>本地物价 <b>${num(k.cpi*100)}%</b></p><p>美国十年债收益率 <b>${num(k.yield)}%</b></p></div><blockquote>${esc(T.mood(k.year,k.local))}<small>虚构人物的年代对白。</small></blockquote><p class="muted">图表截止 ${past.asOf}，采用修订的月度观测，不含股息。国债收益率与债券回报口径不同。外部原文可能包含后续历史。</p></details></details>`;
}
function choices(values,current,names){return values.map((v,i)=>`<option value="${v}" ${v===current?'selected':''}>${names[i]}</option>`).join('');}
function allocation(){const p=draft.policy||F.defaultPolicy(state),response=F.response(state);draft.policy=p;game.innerHTML=`<section class="play-screen allocation-screen">${progress()}<div class="plan-layout">
 <div class="plan-overview">
  <h1>今年的钱，怎样安排</h1>
  <div class="current-plan"><h2>当前配置</h2><div id="current-strip"></div></div>
  <div id="asset-overview"></div><div id="preview"></div>
  ${response?`<details class="optional response-option" ${p.response?'open':''}><summary>处理今年的家庭安排</summary>
    <label class="field">${response.id==='home'?'添丁后住哪里':response.id==='work'?'收入中断后怎么找工作':'照护怎么安排'}<select id="family-response"><option value="">维持目前安排</option><option value="${response.id}" ${p.response?'selected':''}>${FamilyMonthly.responseLabels[response.id]}</option></select></label>
    <p class="muted">一次性费用 ${money(response.cost)}。${response.id==='home'?'未来 18 个月每月多付 '+money(response.monthly)+'；也可以继续住原处攒首付。':response.id==='work'?'复工最多提前 '+response.until+' 个月。':'改为家庭轮班，剩余照护期每月预计少支出 '+money(response.monthly)+'。'}</p>
  </details>`:''}
  <button class="button primary-action" id="allocation-confirm">按这份配置，过完今年</button>
  <p class="action-note">结算至 ${state.era+state.turn+1} 年末</p>
 </div>
 <div class="plan-options">
  ${currentReply()}
  ${news()}
  <details class="optional" id="advanced-plan"><summary>调整配置与高级设置</summary>
<details class="optional" id="change-plan"><summary>换一种配置</summary><div class="preset-options">${F.presets.map((x,i)=>`<button class="preset choice" data-preset="${i}" aria-pressed="${x.w.join()===p.w.join()}"><b>${x.name}</b><span>${x.text}</span>${strip(x.w)}</button>`).join('')}</div></details><details class="optional"><summary>自己调一调 · 可选</summary><p class="muted">四类金融资产合计100%，余下比例自动留为现金。</p><div id="manual-strip"></div>${[1,2,3].map((i)=>`<label class="weight-row">${['现金','股票','债券','黄金'][i]}<input type="range" min="0" max="100" step="1" value="${p.w[i]}" data-range="${i}" aria-label="${['现金','股票','债券','黄金'][i]}比例"><input type="number" min="0" max="100" step="1" value="${p.w[i]}" data-weight="${i}" aria-label="${['现金','股票','债券','黄金'][i]}比例数值">%</label>`).join('')}<label class="field">股票范围<select id="basket">${choices([0,1],p.basket,['本地市场','四国分散'])}</select></label></details>
 <details class="optional"><summary>保险、房车与更多设置 · 可选</summary><label class="field">医疗保障<select id="coverage">${choices([0,1,2],p.coverage,['自行承担','基础保障 · 报销50%','加强保障 · 报销80%'])}</select></label><p class="muted">年保费：0 / ${money(F.month(state)*.6)} / ${money(F.month(state)*1.2)}。无退保现金价值。</p><label class="field">住房<select id="house">${choices(state.house?['keep','sell']:['keep','buy'],p.house,state.house?['继续持有','出售并结清房贷']:['保持现状','申请首付购房'])}</select></label><div id="house-preview" role="status"></div><p class="muted">参考价 ${money(F.housePrice(state))}；首付30%，买卖各收3%费用；利率固定为5%，按20年估算年供。每年取整，少量尾款可能在次年结清。</p><label class="field">汽车<select id="car">${choices(state.car?['keep','sell']:['keep','buy'],p.car,state.car?['继续持有','出售汽车']:['保持现状','尝试全款购车'])}</select></label><p class="muted">参考价 ${money(F.carPrice(state))}；每年15%教学折旧，另有养车开支。</p><details><summary>认识资产与数据口径</summary><p>现金不计息；股票按历史价格指数、不含股息。债券用美元国债收益率估值；黄金按美元价格及历史汇率换算。住房和汽车单独记家庭账本；负债从净资产扣除。</p><a href="sources.html">查看全部来源与规则</a></details><label class="field note-field">给年末的自己留一句 · 选填<textarea id="reason" rows="2" maxlength="80" placeholder="例如：工作可能变化，先多留些现金。">${esc(draft.note)}</textarea></label><p class="muted">便签随存档保存，成绩链接不包含它。</p></details>
 <details class="optional"><summary>听听现金流管家的理由 · 可选</summary><div id="agent-advice"></div><button class="small-button" id="adopt-agent">采用这份配置</button></details><details class="optional" id="stress"><summary>先试试现金够不够 · 可选</summary><p class="muted">固定假设，不预告下一年。提前预留全年保费，不计未来工资。</p><select id="stress-kind" aria-label="假设情景">${choices(['medical','double','bill'],draft.stress||'medical',['跌市加医疗账单','股债齐跌加维修','行情不变，账单先到'])}</select><div id="stress-result"></div></details>
  </details>
 </div>
</div></section>`;
 const refreshStress=()=>{if(!$('#stress').open)return;draft.stress=$('#stress-kind').value;const a=P.compareStress(state,{...p,loss:0,profit:0,rebalance:'none'},draft.stress);$('#stress-result').innerHTML=`<p class="stress-status">${a.personal.unpaid?'仍有账单未付':a.personal.sale?'需要卖出部分投资':'现金可以覆盖'}</p><p>需用 ${money(a.personal.needed)}，含自付账单、全年保费预留与旧欠款${state.pending.householdBill?'，以及已知搬家费':''}。</p><table><thead><tr><th>付款后</th><th>我的计划</th><th>均衡模型</th></tr></thead><tbody>${[['现金','cash'],['卖出','sale'],['未付','unpaid']].map(([n,k])=>`<tr><th>${n}</th><td>${money(a.personal[k])}</td><td>${money(a.balanced[k])}</td></tr>`).join('')}</tbody></table><p class="muted">股/债/金假设：${P.scenarios.find(x=>x.id===draft.stress).returns.slice(1).map(x=>x*100+'%').join('/')}；现金不足时按债、金、股顺序卖出并计费。${state.mode?'急售股票另按账面价折价 5%。':''}与实际全年结算分开看。</p>`;};
 const update=()=>{const a=F.preview(state,p),agent=F.advice(state,p),loan=F.mortgageSchedule(a.state);$('#asset-overview').innerHTML=assetsOverview(a.state,'配置后家庭总资产');$('#house-preview').innerHTML=purchaseSummary(a.housePurchase,true);$('#agent-advice').innerHTML=`<p>${esc(agent.reason)}</p>${strip(agent.policy.w)}<p>现金目标 ${money(agent.target)}，其中已知年度缺口 ${money(agent.gap)}。</p>${agent.shortfall?`<p class="warning">即使按建议配置，距目标仍差 ${money(agent.shortfall)}。建议不保证能度过危机。</p>`:''}<p class="muted">管家根据当前信息配置。股票部分采用四国分散，沿用你选的保险和房车安排。</p>`;$('#basket').value=String(p.basket);$('#manual-strip').innerHTML=strip(p.w);$('#current-strip').innerHTML=strip(p.w);all('[data-range],[data-weight]').forEach(e=>e.value=p.w[Number(e.dataset.range||e.dataset.weight)]);all('[data-preset]').forEach(e=>e.setAttribute('aria-pressed',F.presets[Number(e.dataset.preset)].w.join()===p.w.join()));$('#preview').innerHTML=`<section class="preview"><h2>配置后留在手边的钱</h2><p class="cash-summary"><strong>${money(a.state.cash)}</strong> <span>约 ${num(a.months)} 个月必要支出</span></p>${state.monthlyFamily?`<p class="reserve-targets">现金预算 · 3 个月 ${money(Math.round(a.necessaryMonthly*3))} / 6 个月 ${money(Math.round(a.necessaryMonthly*6))}</p>`:''}<p class="${a.knownFlow<0?'warning':'muted'}">${a.knownFlow<0?'按已知收支，全年还差 '+money(-a.knownFlow)+'，需动用储备或变现。':'已知年度收支余量 '+signed(a.knownFlow)+'。'}</p><details class="preview-details"><summary>查看收支和合同细节</summary><p class="muted">未计未来行情与突发账单。已计保障及房贷还款。</p>${loan.remaining?`<p>按当前合同继续持有住房，还需还款 ${loan.remaining} 次，最后一次 ${money(loan.lastPayment)}。</p>`:''}</details>${a.arrangement?`<p class="plan-note">${esc(a.arrangement.title)} · ${money(a.arrangement.cost)} 计入 1 月账单。</p>`:''}${purchaseSummary(a.housePurchase,true)}${a.state.mortgage?mortgageSummary(a.state.mortgage,a.budget.mortgagePayment):''}${a.notes.filter(x=>!a.housePurchase||!/^(已购入住房|住房计划未执行)/.test(x)).map(x=>`<p class="plan-note">${esc(x)}</p>`).join('')}</section>`;refreshStress();save();};
 $('#adopt-agent').onclick=()=>{Object.assign(p,F.advice(state,p).policy);update();toast('已采用管家配置，确认后才结算');};all('[data-preset]').forEach(b=>b.onclick=()=>{p.w=[...F.presets[Number(b.dataset.preset)].w];update();});
 const set=(i,value)=>{const v=Number(value);if(Number.isInteger(v))p.w=P.setWeight(p.w,i,v,0);update();};all('[data-range]').forEach(e=>e.oninput=()=>set(Number(e.dataset.range),e.value));all('[data-weight]').forEach(e=>e.onchange=()=>set(Number(e.dataset.weight),e.value));
 if($('#family-response'))$('#family-response').onchange=e=>{
  if(e.target.value){p.response=e.target.value;if(p.response==='home'&&p.house==='buy'){p.house='keep';$('#house').value='keep';}}
  else delete p.response;update();
 };
 for(const key of ['basket','coverage','house','car'])$('#'+key).onchange=e=>{p[key]=['basket','coverage'].includes(key)?Number(e.target.value):e.target.value;
 if(key==='house'&&p.house==='buy'&&p.response==='home'){delete p.response;$('#family-response').value='';}
 update();};
 $('#reason').oninput=e=>{draft.note=e.target.value;save();};$('#stress').ontoggle=()=>{refreshStress();save();};$('#stress-kind').onchange=()=>{refreshStress();save();};$('#allocation-confirm').onclick=()=>dispatch({type:'allocate',policy:p});update();}
function annual(row,index){return `<section class="annual-account"><div class="section-heading"><h2>${row.year}年家庭账本</h2><span>第${index+1}年</span></div>${settledHousing(row)}${G.cash(row,money)}<p class="surplus-line ${row.familySurplus<0?'negative':''}">本年家庭收支差额 <b>${signed(row.familySurplus)}</b></p><p class="muted">按应付收支计，包含遗产、生活选择、保障、房贷还款与账单；投资和房车买卖另列。收支为负时先动用资产，不等于已经破产。</p>${balanceSheet(row,'年末资产负债表')}${auditPanel(row)}<details><summary>逐项核对年初与年末</summary>${balanceChange(row)}</details><details><summary>展开本年的变化明细</summary><p>${esc(row.chapter)}：${esc(row.title)}</p>${remembered(row)}${notes[index]?.note?`<blockquote>当时的理由：${esc(notes[index].note)}</blockquote>`:''}<dl class="ledger-lines">${[['年初净资产',row.opening],['遗产流入',row.gift],['生活选择支出',-row.cost],['金融市场损益',row.gain],['房价变化',row.houseGain],['车价与汇率变化',row.carGain],['车辆折旧',-row.depreciation],['家庭收入',row.income],['生活与保障支出',-row.expense],['房贷利息',-row.interest],['额外自付账单',-row.bill],['全部交易费',-row.fees],['年末净资产',row.net]].map(([k,v])=>`<div><dt>${k}</dt><dd>${signed(v)}</dd></div>`).join('')}</dl><p>本年到期房贷本金 ${money(row.principal)}。实际偿还本金同时减少现金与负债；到期未付部分转入未付账单，不等于已经还清。医疗保障抵扣 ${money(row.covered)}；被迫卖出金融资产 ${money(row.forcedSale)}。</p>${row.resolution?`<p class="warning">危机处理：${row.resolution.action==='bankrupt'?'确认破产，本局结束':'出售房车清偿，处置费用已计入本年账本'}。</p>`:''}${notes[index]?.stress?'<p class="muted">本年确认前看过假设压力测试。假设范围与全年实际结果不同。</p>':''}<details><summary>月度金融资产记录</summary><div class="table-wrap"><table><thead><tr><th>月份</th><th>金融资产</th><th>市场损益</th></tr></thead><tbody>${row.monthly.map(m=>`<tr><td>${m.date}</td><td>${money(m.financial)}</td><td>${signed(m.gain)}</td></tr>`).join('')}</tbody></table></div></details></details></section>`;}
function feedback(){
 const stage=state?state.turn+' / 30 年':'首页';
 const url=state?S.challenge(state.seed,state.mode||'story'):location.href.split('#')[0];
 const prompt='《人生 CFO》'+S.edition+' 试玩反馈\n开局：'+url+'\n进度：'+stage+'\n1. 前三年哪一步不容易找到下一步？\n2. 能否看懂账单或急售如何发生？哪项最难看懂？\n3. 你想不想换一个配置重玩？为什么？';
 modal(`<h2>留下试玩反馈</h2><p>可以编辑下面的内容，复制后发给邀请你的人。</p><textarea id="feedback-note" rows="8" aria-label="试玩反馈">${esc(prompt)}</textarea><button class="button" id="copy-feedback">复制反馈</button>`);
 $('#copy-feedback').onclick=async()=>{
  const field=$('#feedback-note');
  try{await navigator.clipboard.writeText(field.value);toast('已复制试玩反馈');}
  catch{field.focus();field.select();toast('请复制选中的文字');}
 };
}
function annualExplanation(row){
 if(row.expectedIncome===undefined)return '';
 const missed=row.expectedIncome-row.income,expenseDelta=row.expense-row.expectedExpense;
 const start=F.known({...state,turn:row.year-state.era});
 const parts=[
  missed>0?'收入比配置时估算少 '+money(missed):'收入比配置时估算多 '+money(-missed),
  expenseDelta>=0?'必要支出比估算多 '+money(expenseDelta):'必要支出比估算少 '+money(-expenseDelta),
  '年内额外账单净额 '+money(row.bill)
 ];
 const endPrice=F.housePrice({...state,turn:row.year-state.era});
 const feeGap=endPrice-row.entryHousePrice;
 const liquidNow=F.financial(row);
 const liquidThen=F.keys.reduce((sum,key)=>sum+row.openingBalance[key],0);
 const gap=Math.max(0,Math.round(endPrice*.33)-liquidNow);
 const oldGap=Math.max(0,Math.round(row.entryHousePrice*.33)-liquidThen);
 return `<section class="annual-explanation"><h2>配置时和实际发生的差别</h2><p>按当时已知收支，预计剩余 ${signed(row.expectedIncome-row.expectedExpense-row.expectedBills-row.mortgagePayment)}。</p><p>${parts.join('。')}。</p><p>当年配置 · 现金 ${row.policy.w[0]}%、股票 ${row.policy.w[1]}%。本地股指 ${signedPct(start.local)}，你的金融配置本年市场损益 ${signed(row.gain)}。${!row.house?' 同规格住房的模拟首付门槛（含费用）变动 '+signed(Math.round(feeGap*.33))+'。按年末金融资产估算，距首付门槛还差 '+money(gap)+'，比年初变化 '+signed(gap-oldGap)+'。':''}</p>${row.arrangement?`<p>本年应对 · ${esc(row.arrangement.title)}，安排费用 ${money(row.arrangement.cost)}。${row.arrangement.id==='work'?'预计少等 '+row.arrangement.until+' 个月。':row.arrangement.id==='home'?'换到较宽敞的住处，租金在 18 个月内增加。':'照护期间月支出下降。'}</p>`:''}</section>`;
}
function monthlyResult(row){
 if(!row.events)return '';
 const months=row.monthly.map(m=>`<tr><th scope="row">${m.month} 月</th><td>${money(m.income+m.covered)}</td><td>${money(m.expense+m.mortgagePayment+m.bill)}</td><td>${money(m.forcedSale)}</td><td>${money(m.cash)}</td><td>${money(m.debt)}</td></tr>`).join('');
 const max=Math.max(1,...row.monthly.map(m=>m.cash));
 const bars=row.monthly.map(m=>`<div class="monthly-column" title="${m.month} 月 ${money(m.cash)}"><i class="${m.forcedSale||m.debt?'tight':''}" style="height:${Math.max(3,m.cash/max*100)}%"></i><small>${m.month}</small></div>`).join('');
 return `<section class="monthly-result"><h2>十二个月，钱什么时候到账</h2><p>最低月末现金 <b>${money(row.lowestCash)}</b>。${row.firstShortage?' '+row.firstShortage+' 月首次需要用现金之外的资金付账。':''}${row.forcedSale?' 全年急售 '+money(row.forcedSale)+'，其中股票折价损失 '+money(row.stockDiscount)+'。':''}</p>
 <div class="monthly-bars" aria-hidden="true">${bars}</div>
 ${row.events.length?`<div class="monthly-events">${row.events.map((e,i)=>`<details ${i<2?'open':''}><summary>${e.month} 月 · ${esc(e.title)}${e.amount?' · '+(e.direction==='out'?'−':'+')+money(e.amount):''}</summary><p>${esc(e.text)}</p>${FamilyPhotos.eventVisual(e.kind,e.title)}</details>`).join('')}</div>`:'<p>这一年按平常的节奏过完。</p>'+FamilyPhotos.eventVisual('quiet','平常的家庭开支')}
 <details><summary>查看逐月账本</summary><div class="table-wrap"><table><thead><tr><th>月份</th><th>到账</th><th>应付</th><th>急售</th><th>月末现金</th><th>月末欠款</th></tr></thead><tbody>${months}</tbody></table></div></details></section>`;
}
function automaticResult(row){
 if(row.events)return annualExplanation(row)+monthlyResult(row);
 const shock=row.shock;
 return `<div class="auto-brief">${row.householdBill?`<p>添丁与搬家 · 一次性费用 <b>${money(row.householdBill)}</b></p>`:''}
   ${shock.kind!=='none'?`<p><b>${esc(shock.title)}</b> · ${esc(shock.text)}${['lottery','bonus'].includes(shock.kind)?' 到账 '+money(shock.gross)+'。':shock.kind==='income'?' 工资减少 '+money(row.incomeShortfall)+'。':' 本次自付 '+money(row.bill-(row.householdBill||0))+'。'+(row.covered?' 赔付 '+money(row.covered)+'。':'')}</p>`:''}
   ${row.forcedSale?`<p>现金不够，合计变现 <b>${money(row.forcedSale)}</b>。${row.stockLiquidation?'其中股票账面 '+money(row.stockLiquidation)+'，额外折价损失 '+money(row.stockDiscount)+'。':''}</p>`:''}</div>`;
}
function settlement(){const row=state.history.at(-1);game.innerHTML=`<section class="play-screen compact-settlement">${progress()}<h1>${row.year}年，后来怎样了</h1>${assetsOverview(row,'年末家庭总资产')}${state.monthlyFamily?annualPhoto(row.year):''}${state.mode?automaticResult(row):remembered(row)}${settledHousing(row)}<section class="year-money"><h2>这一年的钱</h2>${G.cash(row,money)}<p class="surplus-line ${row.familySurplus<0?'negative':''}">家庭收支 <b>${signed(row.familySurplus)}</b></p><div class="year-deltas"><p>市场损益 <b>${signed(row.gain)}</b></p><p>年末净资产 <b>${money(row.net)}</b></p></div> ${row.shock.kind!=='none'&&state.mode!=='auto'?`<p class="bill-story">${esc(row.shock.title)}：${esc(row.shock.text)}${row.bill?' 本次自付 '+money(row.bill)+'。':''}${row.covered?' 保障抵扣 '+money(row.covered)+'。':''}</p>`:''}</section><button class="button primary-action" id="next-year">进入下一年</button><div class="year-links"><button class="text-button" id="year-compare">看看管家怎么配置</button><button class="text-button" id="year-journal">${state.mode?'回看家庭事件':'回看人物和约定'}</button></div>${news(true)}<details class="optional"><summary>打开完整年度账本</summary>${annual(row,state.turn-1)}</details></section>`;$('#next-year').onclick=()=>show('life');$('#year-compare').onclick=()=>comparison();$('#year-journal').onclick=journal;}

function crisis(){const a=F.rescuePreview(state),row=state.history.at(-1);game.innerHTML=`<section class="play-screen">${progress()}${art('quiet','家人在灯下核对账单')}<h1>${F.net(state)<0?'家庭已经资不抵债':'这笔账单，暂时付不起'}</h1><p class="lead">本年有 ${money(state.debt)} 未付账单，净资产为 ${money(F.net(state))}。先处理这次财务危机，才能进入下一年。</p>${assetsOverview(row,'年末家庭总资产')}${state.monthlyFamily?annualPhoto(row.year):''}${state.mode?automaticResult(row):remembered(row)}${settledHousing(row)}<section class="crisis-plan"><h2>还能怎样处理</h2>${a.canRecover?`<p>出售现有房车、结清房贷，并把金融资产转为现金后，可以清偿。交易费 ${money(a.fees)}，处置后净资产 ${money(a.net)}。</p><button class="button" id="liquidate">出售资产，清偿后继续</button><button class="button secondary" id="bankrupt">结束这局，按破产复盘</button>`:`<p>即使变卖现有资产，仍有 ${money(a.unpaid)} 未能支付；处置后净资产 ${money(a.net)}。这局无法继续举债进入下一年。</p><button class="button" id="bankrupt">确认破产，查看复盘</button>`}<p class="muted">这是游戏的偿付规则，不代表现实中的法律破产程序。</p></section><details><summary>查看完整资产负债与本年账本</summary>${annual(row,state.turn-1)}</details></section>`;
 if($('#liquidate'))$('#liquidate').onclick=()=>dispatch({type:'resolve',action:'liquidate'});$('#bankrupt').onclick=()=>dispatch({type:'resolve',action:'bankrupt'});}
function getBenchmarks(){if(!benchmarks)benchmarks=F.models.map(m=>({...m,run:F.compare(state,m.id)}));return benchmarks;}
function decisionReview(models){
 const history=state.history,years=history.length,full=state.outcome==='completed';
 const reserveYears=history.filter(row=>row.buffer>=6).length;
 const saleYears=history.filter(row=>row.forcedSale>0).length;
 const progressPoints=Math.round(years/30*40);
 const reservePoints=Math.round(reserveYears/years*30);
 const salePoints=Math.round((years-saleYears)/years*20);
 const payablePoints=full&&state.debt===0?10:0;
 const score=progressPoints+reservePoints+salePoints+payablePoints;
 const sound=history.find(row=>row.buffer>=6&&!row.forcedSale&&(row.shock.kind!=='none'||row.events?.some(e=>e.direction==='out')));
 const review=[...history].sort((a,b)=>b.familyUnpaid-a.familyUnpaid||b.forcedSale-a.forcedSale||a.buffer-b.buffer)[0];
 const low=history.flatMap(row=>row.monthly.filter(m=>m.cash!==undefined)).reduce((a,b)=>!a||b.cash<a.cash?b:a,null);
 const losses=history.reduce((sum,row)=>sum+(row.stockDiscount||0),0);
 const bench=models[0].run.history.find(row=>row.year===review.year);
 const facts=sound?`<p><b>${sound.year} 年 · 有余地</b> 年末有 ${num(sound.buffer)} 个月的必要支出储备，这一年没有因账单被迫卖出投资。</p>`:
  `<p><b>现金缓冲</b> ${reserveYears}/${years} 个年度达到六个月目标。下次可先留出已知支出，再安排投资比例。</p>`;
 const timing=review.firstShortage?'（'+review.firstShortage+' 月首次现金不足）':'';
 const next=review.familyUnpaid?`有 ${money(review.familyUnpaid)} 到期未付。先检查当年的固定支出和住房负担。`:
  review.forcedSale?`被迫变现 ${money(review.forcedSale)}。重玩时可试着多留现金，比较账单来时是否仍需变现。`:
  `年末现金可覆盖 ${num(review.buffer)} 个月必要支出。可用这个年份检查更高现金储备的成本和好处。`;
 return `<section class="decision-review"><h2>这局的家庭财务评分</h2><p class="review-score"><strong>${score}</strong> / 100 <span>现金韧性</span></p>
  <p class="muted">用游戏账本评价储备与账单承受力。净资产与购买力单独展示。</p>
  <details><summary>分数怎么来的</summary><ul><li>经营进度 ${progressPoints}/40</li><li>年末现金覆盖至少六个月的年份比例 ${reservePoints}/30</li><li>未被迫卖出投资的年份比例 ${salePoints}/20</li><li>通关且无未付账单 ${payablePoints}/10</li></ul></details>
  ${low?`<p>最低月末现金 ${low.date.slice(0,7)} · ${money(low.cash)}。全局急售折价 ${money(losses)}，期末未付账单 ${money(state.debt)}。</p>`:''}
  ${facts}<p><b>${review.year} 年 · 值得再试 ${timing}</b> ${next}</p>
  ${state.monthlyFamily?`<button class="button secondary" id="retry-year" data-index="${history.indexOf(review)}">重算一个关键年份</button>`:''}
  ${bench?`<p>同年现金流管家留下 ${num(bench.buffer)} 个月现金，变现 ${money(bench.forcedSale)}。两边此前的持仓与资金积累也可能不同。</p>`:''}
 </section>`;
}
function openRetry(index){
 const history=state.history, original=F.retryYear(state,index,history[index].policy);
 modal(`<h2>重算一个年份</h2><p>沿用原来的年初资产、保障、房车安排、历史行情和随机事件。只调整投资配置。</p>
 <label>年份 <select id="retry-index">${history.map((row,i)=>`<option value="${i}" ${i===index?'selected':''}>${row.year} 年</option>`).join('')}</select></label>
 <label>改用 <select id="retry-preset">${F.presets.map((item,i)=>`<option value="${i}">${esc(item.name)}</option>`).join('')}<option value="0cash">流动性对照 · 现金 0%，股票 100%</option><option value="100cash">流动性对照 · 全部留现金</option></select></label>
 <button class="button" id="retry-calculate">计算对照</button><div id="retry-result" aria-live="polite"></div>`);
 $('#retry-index').onchange=e=>openRetry(Number(e.target.value));
 $('#retry-calculate').onclick=()=>{
  try{
   const selected=$('#retry-preset').value;
   const weights=selected==='0cash'?[0,100,0,0]:selected==='100cash'?[100,0,0,0]:F.presets[Number(selected)].w;
   const alternative=F.retryYear(state,index,{...original.policy,w:weights});
   const compare=(label,read)=>`<tr><th>${label}</th><td>${read(original)}</td><td>${read(alternative)}</td></tr>`;
   const shortage=row=>row.firstShortage?row.firstShortage+' 月':'无';
   const note=history[index].resolution?'两列均为危机处置前的结果。可结合未付账单判断是否还需要变卖房车。':'';
   $('#retry-result').innerHTML=`<div class="table-wrap"><table><thead><tr><th>结果</th><th>原局</th><th>重算</th></tr></thead><tbody>${compare('首次现金不足',shortage)}${compare('急售股票折价',r=>money(r.stockDiscount))}${compare('年末未付账单',r=>money(r.debt))}${compare('年末净资产',r=>money(r.net))}</tbody></table></div><p>${note}</p>`;
  }catch(e){$('#retry-result').textContent=e.message;}
 };
}
function reportCurves(rows,labels){
 const balanced=rows.find(row=>row.id==='balanced').run,initial=F.net(F.start(state.seed));
 const indexed=r=>[100,...r.history.map(row=>100*row.net/initial)];
 const stock=D.countries[state.country].stock,begin=(state.era-1977)*12;
 const markets=labels.map((_,i)=>100*stock[begin+i*12]/stock[begin]);
 const series=[
  {name:'我的配置',color:'#852d26',values:indexed(state)},
  {name:'固定均衡',color:'#37596b',values:indexed(balanced)},
  {name:'本地股指',color:'#77754b',values:markets}
 ];
 return G.line(series,labels,'开局 = 100','同场家庭配置与本地股指')+
  '<p class="muted">本地股指为价格指数，不含股息与家庭收支。股指展示完整 30 年，家庭曲线在实际停止年份结束。同场家庭方案按相同年份比较。</p>';
}
function report(){const rows=getBenchmarks(),m=F.metrics(state),prevRaw=previous.find(p=>p.seed===state.seed&&p.mode===state.mode),prev=prevRaw?F.restore(prevRaw):null;
 const series=[{name:'我的选择',color:'#852d26',values:[F.net(F.start(state.seed)),...state.history.map(r=>r.net)]},...rows.map((r,i)=>({name:r.name,color:['#37596b','#77754b','#a37b2e'][i],values:[F.net(F.start(state.seed)),...r.run.history.map(x=>x.net)]}))];
 if(prev)series.push({name:'上一局',color:'#7a527f',values:[F.net(F.start(prev.seed)),...prev.history.slice(0,state.turn).map(r=>r.net)]});const labels=Array.from({length:state.turn+1},(_,i)=>state.era+i);
 game.innerHTML=`<section class="report-screen"><p class="unit-note">${D.countries[state.country].name} · 编号${state.seed} · ${state.era}—${state.era+state.turn}</p><h1>${state.outcome==='bankrupt'?'这次人生，在这里停一停':'三十年的账，写完了'}</h1><p class="lead">${status(state)}。${state.outcome==='bankrupt'?'看看从哪一年开始失去余地，再用同一个开局试一次。':'回看每年的现金与负债，再比较不同的配置。'}</p>${state.monthlyFamily?annualPhoto(state.era+state.turn):''}${state.mode==='briefing'?`<details class="optional"><summary>回看最后一年的新闻与账单</summary>${automaticResult(state.history.at(-1))}</details>`:state.mode?automaticResult(state.history.at(-1)):remembered(state.history.at(-1))}${settledHousing(state.history.at(-1))}${assetsOverview(state,'最终家庭总资产')}<p class="muted">按开局物价计算，净资产购买力为 ${money(m.real)}。</p>${decisionReview(rows)}${state.mode==='briefing'?reportCurves(rows,Array.from({length:31},(_,i)=>state.era+i)):G.line(series.map(s=>({...s,values:s.values.map(v=>v/scale(state))})),labels,unit(state))}<button class="button secondary" id="report-compare">逐年对照：我与智能体</button><details class="optional"><summary>展开其他模型及数字</summary><h2>我的选择，与模型对照</h2><p class="muted">同一开局、历史、家庭事件和房车意图。购房能否成交取决于各自资金。模型只更换金融配置，遇到危机会尝试清偿；无法继续时曲线停在实际年份。各自结束年份不同，金额不能直接评判谁胜出。</p><div class="comparison-cards">${rows.map(r=>{const n=F.metrics(r.run);return `<article><h3>${r.name}</h3><p>${r.text}</p><dl><div><dt>进程</dt><dd>${status(r.run)} · ${n.years}年</dd></div><div><dt>净资产</dt><dd>${money(n.net)}</dd></div><div><dt>现金缓冲</dt><dd>${num(n.buffer)}个月</dd></div><div><dt>未付账单</dt><dd>${money(n.debt)}</dd></div><div><dt>被迫卖出累计</dt><dd>${money(n.forced)}</dd></div></dl>${r.run.endNote?`<p>${r.run.endNote}</p>`:''}</article>`;}).join('')}</div></details>${prev?`<section class="replay-note"><h3>与上一局对照</h3><p>上一局：${prev.turn}年，${status(prev)}，结束净资产 ${money(F.net(prev))}。本局：${state.turn}年，${status(state)}，结束净资产 ${money(m.net)}。</p><p class="muted">曲线只画两局共同走过的时间；不同结束年份的金额不是同年收益比较。</p></section>`:''}${news(true)}<details class="optional"><summary>${state.mode?'回看家庭事件':'回看我的人物与约定'}</summary>${journalContent()}</details><details class="optional"><summary>查看完整30年家庭账本</summary>${timelineTable()}<label class="field">选择年份<select id="report-year">${state.history.map((r,i)=>`<option value="${i}">${r.year}年 · ${r.chapter}</option>`).join('')}</select></label><div id="report-year-book"></div></details><div class="actions"><button class="button" id="replay">重走同一段人生</button><button class="button secondary" id="share-score">分享本局结果</button><button class="small-button" id="csv">导出年度账表 CSV</button>${state.monthlyFamily?'<button class="small-button" id="monthly-csv">导出月度现金账 CSV</button>':''}<button class="small-button" id="text-report">下载完整复盘</button></div><p class="muted">本版不使用止盈止损或年内自动再平衡。模型是公开规则，不会查看未来，也不保证优于玩家。</p></section>`;
 const book=()=>{selectedYear=Number($('#report-year').value);$('#report-year-book').innerHTML=annual(state.history[selectedYear],selectedYear);};$('#report-year').value=String(Math.min(selectedYear,state.turn-1));$('#report-year').onchange=book;book();if($('#retry-year'))$('#retry-year').onclick=e=>openRetry(Number(e.currentTarget.dataset.index));$('#report-compare').onclick=comparison;$('#replay').onclick=()=>newGame(state.seed,state.mode||'story');$('#share-score').onclick=scoreDialog;$('#csv').onclick=exportCSV;if($('#monthly-csv'))$('#monthly-csv').onclick=()=>download('人生CFO-'+S.edition+'-'+state.seed+'-月度.csv',L.monthlyCsv(state),'text/csv;charset=utf-8');$('#text-report').onclick=exportReport;}
function ledger(){if(!state){toast('开始人生后即可查看');return;}modal(`<h2>30年家庭资产负债表</h2><p>已结算 ${state.turn} 年。每一行都可打开完整年账；未发生的年份留空，不补收益、不续写破产后的数据。</p>${timelineTable()}<button class="small-button" id="ledger-compare">与智能体逐年对照</button>${state.history.length?`<label class="field">查看年度明细<select id="ledger-year">${state.history.map((r,i)=>`<option value="${i}">${r.year}年</option>`).join('')}</select></label><div id="ledger-body"></div><button class="small-button" id="ledger-csv">导出完整30年账表 CSV</button>`:balanceSheet(state,'开局资产与负债')}`);$('#ledger-compare').onclick=comparison;if(state.history.length){const update=()=>{const i=Number($('#ledger-year').value);$('#ledger-body').innerHTML=annual(state.history[i],i);};$('#ledger-year').value=String(state.turn-1);$('#ledger-year').onchange=update;$('#ledger-csv').onclick=exportCSV;update();}}
function yearBook(i){if(!state?.history[i])return;modal(`<h2>${state.history[i].year}年完整账表</h2>${annual(state.history[i],i)}<div class="actions"><button class="small-button" id="back-ledger">回到30年总览</button><button class="small-button" id="year-prev" ${i?'':'disabled'}>上一年</button><button class="small-button" id="year-next" ${i<state.turn-1?'':'disabled'}>下一年</button></div>`);$('#back-ledger').onclick=ledger;$('#year-prev').onclick=()=>yearBook(i-1);$('#year-next').onclick=()=>yearBook(i+1);}
function auditPanel(r){const a=L.audit(r),ok=[a.balance,a.change,a.cash,a.opening,a.nonnegative].every(Boolean);return `<p class="audit-badge ${ok?'':'negative'}">${ok?'✓ 资产负债、净资产变化、现金收付均已核对':'账本存在差异，请导出存档核查'}</p>`;}
function balanceChange(r){const names=['现金','股票','债券模型','黄金','住房','汽车','房贷本金','未付账单'];return `<div class="table-wrap"><table><thead><tr><th>项目 · ${unit(state)}</th><th>年初</th><th>年末</th><th>变化</th></tr></thead><tbody>${L.fields.map((k,i)=>`<tr><th>${names[i]}</th><td>${amount(r.openingBalance[k])}</td><td>${amount(r[k])}</td><td>${r[k]-r.openingBalance[k]>0?'+':''}${amount(r[k]-r.openingBalance[k])}</td></tr>`).join('')}<tr><th>家庭净资产</th><td>${amount(r.opening)}</td><td>${amount(r.net)}</td><td>${amount(r.net-r.opening)}</td></tr></tbody></table></div>`;}
function timelineTable(){return `<details class="timeline"><summary>30年总览 · ${unit(state)}</summary><div class="table-wrap"><table><caption>总资产 − 总负债 = 家庭净资产</caption><thead><tr><th>年末</th><th>总资产</th><th>总负债</th><th>净资产</th></tr></thead><tbody>${L.timeline(state).map(t=>`<tr class="${t.row?'':'future-row'}"><th>${t.row?`<button class="text-button year-link" data-open-year="${t.turn-1}">${t.year}</button>${t.status==='破产终止'?'<small>破产终止</small>':''}`:t.year}</th>${t.row?`<td>${amount(F.totalAssets(t.row))}</td><td>${amount(F.totalDebt(t.row))}</td><td class="${t.row.net<0?'negative':''}">${amount(t.row.net)}</td>`:`<td colspan="3">${t.status}</td>`}</tr>`).join('')}</tbody></table></div></details>`;}
function comparison(model='adaptive',turn=state?.turn||0){if(!state){toast('开始人生后即可对照');return;}if(typeof model!=='string')model='adaptive';const allModels=getBenchmarks(),selected=allModels.find(r=>r.id===model)||allModels[0],c=L.compareAt(state,selected.run,turn),names=['现金','股票','债券模型','黄金','住房','汽车','房贷本金','未付账单'];const val=(r,k)=>r?amount(typeof k==='function'?k(r):r[k]):'已停止';modal(`<h2>同一年，看看不同的安排</h2><p>同一开局、家庭事件、保障与房车意图。资产够不够支付，会让实际执行结果不同。</p><label class="field">对照对象<select id="compare-model">${allModels.map(r=>`<option value="${r.id}" ${r.id===selected.id?'selected':''}>${r.name}</option>`).join('')}</select></label><label class="field">对照年末<select id="compare-year">${Array.from({length:state.turn+1},(_,i)=>`<option value="${i}" ${i===turn?'selected':''}>${state.era+i}${i?'年末':'年末 · 开局'}</option>`).join('')}</select></label><p class="comparison-cutoff">共同可比截至 ${c.commonThrough} 年末。${c.common?'下面两列处于同一年。':'模型已在此前停止，本年不续写数值。'}</p><div class="table-wrap"><table class="same-year"><caption>${c.year}年末 · ${unit(state)}</caption><thead><tr><th>项目</th><th>我的选择</th><th>${selected.name}</th></tr></thead><tbody>${L.fields.map((k,i)=>`<tr><th>${names[i]}</th><td>${val(c.player,k)}</td><td>${val(c.other,k)}</td></tr>`).join('')}${[['总资产',F.totalAssets],['总负债',F.totalDebt],['净资产',F.net]].map(([n,fn])=>`<tr class="total-row"><th>${n}</th><td>${val(c.player,fn)}</td><td>${val(c.other,fn)}</td></tr>`).join('')}</tbody></table></div>${turn?`<div class="compare-plans"><section><h3>我的配置</h3>${strip(c.player.policy.w)}${notes[turn-1]?.note?`<p>${esc(notes[turn-1].note)}</p>`:''}</section><section><h3>${selected.name}的配置</h3>${c.other?strip(c.other.policy.w):'<p>本年未执行。</p>'}<p>${esc(c.other?.agentDecision?.reason||selected.text)}</p>${c.other?.notes?.map(x=>`<p class="plan-note">${esc(x)}</p>`).join('')||''}${c.other?.agentDecision?`<p>当时现金目标 ${money(c.other.agentDecision.target)}；预计收入 ${money(c.other.agentDecision.income)}，已知支出 ${money(c.other.agentDecision.expense)}。${c.other.agentDecision.shortfall?'资金不足以达到目标。':''}</p>`:''}</section></div>${c.other?`<details><summary>两份年度现金流图</summary><h3>我的选择</h3>${G.cash(c.player,money)}<h3>${selected.name}</h3>${G.cash(c.other,money)}</details>`:''}`:'<p>开局资产一致。完成一年的选择后，可查看当年的两份配置及现金流图。</p>'}<p class="muted">${selected.run.endNote||status(selected.run)}；模型只重放到你已经走过的年份。现金流管家是规则智能体，未调用大模型作预测。</p><button class="small-button" id="compare-csv">导出我与三个模型的30年账表</button>`);$('#compare-model').onchange=e=>comparison(e.target.value,turn);$('#compare-year').onchange=e=>comparison(selected.id,Number(e.target.value));$('#compare-csv').onclick=()=>exportCSV(true);}
function photoArchive(selectedYear) {
 const cutoff=state && (screen!=='home' || state.seed===seed) ? state.era+state.turn : F.identity(seed).era;
 const available=H.available(cutoff);
 const selected=available.find(event=>event.year===selectedYear)||available.at(-1);
 modal(`<h2>年代影册</h2><label class="field">翻到哪一年<select id="archive-year">${available.map(event=>`<option value="${event.year}" ${event===selected?'selected':''}>${event.year} · ${esc(event.title)}</option>`).join('')}</select></label>${yearMedia(selected)}<button class="small-button" id="open-illustrations">生活插画与账本演示</button>`);
 $('#archive-year').onchange=e=>photoArchive(Number(e.target.value));
 $('#open-illustrations').onclick=()=>gallery(0);
}
function gallery(index=0){if(typeof index!=='number')index=0;const a=T.gallery[index];modal(`<h2>人生图鉴 · ${index+1}/${T.gallery.length}</h2>${art(a.image,a.title)}<h3>${a.title}</h3><p>${a.text}</p><div class="gallery-controls"><button class="small-button" id="gallery-prev" ${index?'':'disabled'}>上一幅</button><button class="small-button" id="gallery-next" ${index<T.gallery.length-1?'':'disabled'}>下一幅</button></div><label class="field">挑一幅看看<select id="gallery-select">${T.gallery.map((x,i)=>`<option value="${i}" ${index===i?'selected':''}>${x.title}</option>`).join('')}</select></label><details open><summary>点一点，看账本如何变化</summary><p class="muted">独立教学演示，单位为假设元。不读取或改变当前人生，不预告后续事件。</p><div class="demo-tabs">${[['gift','收到遗产'],['layoff','遇到裁员'],['repair','维修账单'],['loan','偿还房贷本金'],['invest','现金买入股票']].map(([id,n])=>`<button class="small-button" data-demo="${id}">${n}</button>`).join('')}</div><div id="demo-result"></div></details>`);$('#gallery-prev').onclick=()=>gallery(index-1);$('#gallery-next').onclick=()=>gallery(index+1);$('#gallery-select').onchange=e=>gallery(Number(e.target.value));all('[data-demo]').forEach(b=>b.onclick=()=>demo(b.dataset.demo));demo('gift');}
function demo(id){const cases={gift:{title:'遗产进入现金',income:12000,gift:8000,cost:0,mp:0,asset:0,note:'遗产到账增加现金和净资产；没有自动变成投资收益。'},layoff:{title:'裁员后收入减少',income:6000,gift:0,cost:0,mp:0,asset:0,note:'收入少了6000，先由现金储备补足。收支为负不等于已资不抵债。'},repair:{title:'支付维修账单',income:12000,gift:0,cost:4000,mp:0,asset:0,note:'这笔4000元的支出同时减少现金和净资产。'},loan:{title:'归还3000元房贷本金',income:12000,gift:0,cost:0,mp:3000,asset:0,note:'现金和房贷各减少3000；本金不是再记一次的亏损。利息才影响净资产，此例未设利息。'},invest:{title:'拿5000元现金买股票',income:12000,gift:0,cost:0,mp:0,asset:-5000,note:'只是把现金换为股票。此例忽略交易费和行情变化，净资产不会凭空增加。'}};const a=cases[id],r={openingCash:10000,income:a.income,gift:a.gift,expense:12000,mortgagePayment:a.mp,bill:a.cost,cost:0,familyUnpaid:0,assetFlow:a.asset,debt:0};r.cash=r.openingCash+r.income+r.gift-r.expense-r.mortgagePayment-r.bill+r.assetFlow;const assets=40000+(r.cash-10000)-a.asset,debt=10000-a.mp;$('#demo-result').innerHTML=`<h3>${a.title}</h3>${G.cash(r,v=>num(v)+'元')}<p>${a.note}</p><dl class="ledger-lines"><div><dt>期末总资产</dt><dd>${num(assets)}元</dd></div><div><dt>期末总负债</dt><dd>${num(debt)}元</dd></div><div><dt>净资产：期初30000 → 期末</dt><dd>${num(assets-debt)}元</dd></div></dl>`;all('[data-demo]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.demo===id));}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportSave(){if(!state){toast('还没有开始人生');return;}download('人生CFO-'+S.edition+'-'+state.seed+'.json',JSON.stringify(envelope(),null,2),'application/json');}
function exportCSV(withModels=false){const runs=[{name:'我的选择',run:state}];if(withModels===true)runs.push(...getBenchmarks().map(r=>({name:r.name,run:r.run})));download('人生CFO-'+S.edition+'-'+state.seed+(withModels===true?'-配置对照':'-年度账表')+'.csv',L.csv(runs),'text/csv;charset=utf-8');toast('已生成30年账表；未发生年份保留空白');}
function exportReport(){const lines=['人生 CFO 跨年故事篇 '+S.edition,`编号${state.seed} · ${D.countries[state.country].name} · ${status(state)} · ${state.turn}年`,`净资产 ${money(F.net(state))}`,'',...state.history.flatMap((r,i)=>[r.year+'年 | '+r.chapter+' | '+r.title,'当时的理由：'+(notes[i]?.note||'未记录'),...G.cashRows(r).map(x=>x.label+'：'+signed(x.value)),'资产 '+money(F.totalAssets(r))+'；负债 '+money(F.totalDebt(r))+'；净资产 '+money(r.net),'突发事件：'+r.shock.title,'配置：现金/股/债/金 '+r.policy.w.join('/')+'%',r.resolution?'危机处理：'+r.resolution.action:'','']),'人物与约定',...F.journal(state).memories.map(m=>m.year+'年：'+m.text),'完整玩法：https://outlier27-cell.github.io/life-cfo-japan/guide.html'];download('人生CFO-'+S.edition+'-'+state.seed+'-复盘.txt',lines.join('\n'),'text/plain;charset=utf-8');}
function menu(){modal(`<h2>存档与分享</h2><p>${state?'编号'+state.seed+' · 已结算'+state.turn+'年':'尚未开始'}。进度只存在本机，换设备前请导出。</p><div class="actions"><button class="small-button" id="export-save">导出存档</button><button class="small-button" id="import-save">导入存档</button><button class="small-button" id="open-board">好友榜</button><button class="small-button" id="save-text">复制或粘贴存档文本</button><button class="small-button" id="home">回到首页</button></div><p><a href="family-v6.html">继续6.0旧存档</a> · <a href="multi-v4.html">继续4.2旧存档</a> · <a href="sources.html">数据与公式</a></p>`);$('#save-text').onclick=saveText;$('#export-save').onclick=exportSave;$('#import-save').onclick=()=>$('#import-file').click();$('#open-board').onclick=()=>{dialog.close();board();};$('#home').onclick=()=>{dialog.close();show('home');};}
function saveText(){modal(`<h2>带走或恢复这段人生</h2><p>复制全部文本保存到自己的笔记，或粘贴 7.0 或 7.1 的存档恢复。存档包含你的决策便签，请自行选择分享对象。</p><textarea id="save-text-value" rows="8" aria-label="存档文本">${state?esc(JSON.stringify(envelope())):''}</textarea><button class="small-button" id="copy-save-text">复制全部</button><button class="small-button" id="read-save-text">读取并预览</button>`);$('#copy-save-text').onclick=async()=>{try{await navigator.clipboard.writeText($('#save-text-value').value);toast('存档文本已复制');}catch{$('#save-text-value').select();toast('请复制选中的完整文本');}};$('#read-save-text').onclick=()=>{try{const a=readSave($('#save-text-value').value);modal(`<h2>恢复预览</h2><p>编号${a.s.seed} · ${a.s.turn}年 · ${status(a.s)}。确认后替换当前家庭的进度。</p><button class="button" id="confirm-text-restore">确认恢复</button>`);$('#confirm-text-restore').onclick=()=>{if(!writable())return;state=a.s;notes=a.n;draft=a.d;benchmarks=null;dialog.close();show(a.view);};}catch(e){toast('无法读取：'+e.message+'。当前进度不变。');}};}
function share(url,title,warning=''){modal(`<h2>${title}</h2>${warning?`<p class="warning" role="note">${esc(warning)}</p>`:''}<label>完整链接<textarea id="share-link" readonly rows="4">${esc(url)}</textarea></label><button class="button" id="copy-link">复制链接</button><button class="small-button" id="download-link">下载链接文件</button><p class="muted">发给朋友后，对方打开即可查看或加入本机好友榜。</p>`);$('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(url);toast('链接已复制');}catch{$('#share-link').select();toast('请长按或全选复制完整链接');}};$('#download-link').onclick=()=>download('人生CFO-分享链接.txt',url,'text/plain;charset=utf-8');}
function readFriends(){
 const list=JSON.parse(localStorage.getItem(FRIENDS)||'[]');
 if(!Array.isArray(list)||list.length>64)throw Error('好友榜格式无效');
 return list;
}
async function saveFriends(additions){
 const write=()=>{
  const next=S.merge(readFriends(),additions);
  localStorage.setItem(FRIENDS,JSON.stringify(next));friends=next;
 };
 try{
  if(navigator.locks)await navigator.locks.request(FRIENDS,write);
  else write();
  return true;
 }catch{return false;}
}
function scoreDialog(){
 modal('<h2>分享本局结果</h2><label>昵称 · 最多16字<input id="nickname" maxlength="32"></label><button class="button" id="make-score">生成成绩链接</button><p class="muted">分享昵称、编号和选择记录，不含决策便签。破产结局也可分享。</p>');
 const button=$('#make-score');
 button.onclick=async()=>{
  try{
   const name=S.cleanName($('#nickname').value),packet=S.compact(state,name),url=S.scoreUrl(state,name);
   button.disabled=true;const saved=await saveFriends([packet]);
   if(!dialog.open||!button.isConnected)return;
   share(url,'我的人生 CFO 结果',saved?'':'本机好友榜保存失败。可以复制或下载这条成绩链接。');
  }catch(e){button.disabled=false;toast(e.message);}
 };
}
function acceptScores(rows){
 modal(`<h2>把这些结果加入好友榜？</h2><ul>${rows.map(r=>`<li>${esc(r.name)} · 编号${r.run.seed} · ${modeName(r.run.mode)} · ${status(r.run)} · ${r.run.turn}年 · ${money(r.metrics.net,r.run)}</li>`).join('')}</ul><button class="button" id="accept-scores">确认加入本机好友榜</button>`);
 const button=$('#accept-scores');
 button.onclick=async()=>{
  button.disabled=true;
  const saved=await saveFriends(rows.map(r=>r.packet));
  if(!button.isConnected||!dialog.open)return;
  if(!saved){button.disabled=false;$('#dialog-status').textContent='本机好友榜保存失败。请保留成绩链接，可以再试一次。';return;}
  dialog.close();board(rows[0].run.seed,rows[0].run.mode||'story');
 };
}
async function board(target=screen==='home'?seed:(state?.seed||seed),mode=state?.mode||(state?'story':defaultMode)){
 let readFailed=false;
 try{friends=readFriends();}catch{readFailed=true;}
 const seeds=[...new Set(friends.filter(p=>(p?.m||'story')===mode).map(x=>x?.s).filter(F.validSeed))];
 if(!seeds.includes(target))seeds.push(target);
 modal(`<h2>同场好友榜</h2><label class="field">玩法<select id="board-mode"><option value="briefing" ${mode==='briefing'?'selected':''}>年度简报</option><option value="monthly" ${mode==='monthly'?'selected':''}>7.3 月度现金流</option><option value="auto" ${mode==='auto'?'selected':''}>7.2 年度结算</option><option value="story" ${mode==='story'?'selected':''}>故事模式</option></select></label><label class="field">人生编号<select id="board-seed">${seeds.map(s=>`<option value="${s}" ${s===target?'selected':''}>${s}</option>`).join('')}</select></label><p class="muted">完成30年的结果按净资产排列；提前结束单独列出。链接需手动汇总。</p><ol class="friend-list"><li>正在核对成绩…</li></ol><button class="button" id="add-score">添加成绩链接</button><button class="small-button" id="share-board" disabled>分享前8条榜单快照</button><button class="text-button" id="invite-board">邀请朋友玩这个开局</button>`);
 const list=$('#dialog .friend-list'),shareButton=$('#share-board');
 $('#board-seed').onchange=e=>board(Number(e.target.value),mode);
 $('#board-mode').onchange=e=>board(target,e.target.value);
 $('#add-score').onclick=()=>{
  modal('<h2>添加成绩链接</h2><textarea id="score-input" rows="5" aria-label="成绩链接"></textarea><button class="button" id="read-score">读取并验证</button>');
  $('#read-score').onclick=()=>{try{acceptScores(S.read($('#score-input').value,S.summary));}catch(e){toast(e.message);}};
 };
 $('#invite-board').onclick=()=>share(S.challenge(target,mode),'邀请朋友同场体验');
 const rows=[];let skipped=0,start=performance.now();
 for(const packet of friends.filter(p=>p?.s===target&&(p.m||'story')===mode)){
  if(performance.now()-start>24){await new Promise(resolve=>setTimeout(resolve,0));start=performance.now();}
  if(!dialog.open||!list.isConnected)return;
  try{rows.push(S.summary(packet));}catch{skipped++;}
 }
 rows.sort((a,b)=>(b.run.outcome==='completed')-(a.run.outcome==='completed')||b.metrics.net-a.metrics.net);
 let rank=0,last=null;
 list.innerHTML=rows.map((r,i)=>{
  const complete=r.run.outcome==='completed';
  if(complete&&last!==r.metrics.net){rank=i+1;last=r.metrics.net;}
  return `<li><b>${complete?rank+'. ':''}${esc(r.name)}</b><span>${status(r.run)} · ${r.run.turn}年</span><strong>${money(r.metrics.net,r.run)}</strong></li>`;
 }).join('')||'<li>还没有这个开局的有效成绩。</li>';
 if(readFailed||skipped)$('#dialog-status').textContent=readFailed?'本机榜单未能读取。可以从原成绩链接重新导入。':skipped+' 条成绩未能验证，未计入排名。';
 shareButton.disabled=!rows.length;
 shareButton.onclick=()=>share(S.boardUrl(rows.slice(0,8).map(x=>x.packet)),'好友榜快照');
}
$('#feedback-button').onclick=feedback;
function render(){try{({home,life,allocate:allocation,settlement,crisis,report}[screen]||home)();}catch(e){notice('页面未能显示，原存档仍保留。请导出备份或刷新。');console.error(e);}}
$('#import-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>120000)throw Error('存档过大');const a=readSave(await f.text());modal(`<h2>导入这段人生？</h2><p>编号${a.s.seed} · 已结算${a.s.turn}年。将替换当前家庭的进度。</p><button class="button" id="confirm-import">确认导入</button>`);$('#confirm-import').onclick=()=>{if(!writable())return;state=a.s;notes=a.n;draft=a.d;benchmarks=null;dialog.close();show(a.view);};}catch(e){toast('无法导入：'+e.message+'。当前进度不变。');}};
$('#brand').onclick=e=>{e.preventDefault();show('home');};$('#menu-button').onclick=menu;$('#ledger-button').onclick=ledger;$('#compare-button').onclick=()=>comparison();$('#gallery-button').onclick=()=>photoArchive();$('#story-button').onclick=journal;$('#board-button').onclick=()=>board();
document.addEventListener('click',e=>{const b=e.target.closest('[data-open-year]');if(b)yearBook(Number(b.dataset.openYear));});
window.addEventListener('storage',e=>{if((e.key===FRIENDS||e.key===null)&&dialog.open&&$('#board-seed'))board(Number($('#board-seed').value));if((e.key===KEY||e.key===null)&&e.newValue!==token){conflict=true;notice('另一个标签页更新了进度，请刷新后继续。');}});window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
load();
if(state){
 if(F.validSeed(Number(q.get('run')))&&seed!==state.seed)screen='home';
 else seed=state.seed;
}
render();
let previewHash='';
function finishSharedPreview(){
 const url=new URL(location.href);
 if(previewHash&&url.hash===previewHash){url.hash='';replaceAddress(url);}
 previewHash='';
}
function openSharedLocation(){
 const hash=location.hash;
 if(!hash.startsWith('#score=')&&!hash.startsWith('#board=')){
  if(previewHash&&dialog.open&&$('#accept-scores'))dialog.close();
  previewHash='';return;
 }
 previewHash=hash;
 try{
  if(hash.length>30000)throw Error('链接过长');
  const packet=ProSocial.decode(hash.slice(hash.indexOf('=')+1));
  const oldPage=({3:'world-v3.html',4:'multi-v4.html',5:'family-v5.html',6:'family-v6.html'})[packet.v];
  if(oldPage&&[3,4,5,6].includes(packet.v)){location.replace(oldPage+location.search+hash);return;}
  acceptScores(S.read(location.href,S.summary));
 }catch(e){
  if(dialog.open&&$('#accept-scores'))dialog.close();
  notice('成绩链接无法读取：'+e.message);finishSharedPreview();
 }
}
dialog.addEventListener('close',finishSharedPreview);
window.addEventListener('hashchange',openSharedLocation);
openSharedLocation();
})();
