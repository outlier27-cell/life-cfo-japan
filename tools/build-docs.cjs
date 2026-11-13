'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 let marked;try{({marked}=await import('marked'));}catch{if(!process.env.CFO_NODE_MODULES)throw Error('Install dev dependencies with npm install, or set CFO_NODE_MODULES to a local package directory');const{pathToFileURL}=require('node:url');({marked}=await import(pathToFileURL(path.join(process.env.CFO_NODE_MODULES,'marked/lib/marked.esm.js')).href));}
 const manifest=require('../data/manifest.json'),audit=require('../data/audit.json'),C=require('../world-content'),D=require('../world-data');
 const source=[`# 数据来源与复核记录\n\n全球篇 3.0 · ${manifest.edition}\n\n[返回游戏](./) · [完整玩法](guide.html) · [完整改进分析](review.html)\n`,
 '## 数据快照\n\n来源为 OECD，经 FRED（圣路易斯联邦储备银行）发布。固定取 1978—2020 年的 12 月月度观测；11 条序列，每条 43 个有效观测，没有缺失填补。股价和 CPI 单位为 2015 = 100；汇率为一美元对应的本币数量。美国本币对美元恒为 1。\n\n股价观测通常为月均口径，并非最后一个交易日的收盘价。股价指数不包含股息再投资。',
 '[OECD 股价定义](https://www.oecd.org/en/data/indicators/share-prices.html) · [年度 CSV](data/annual.csv) · [完整来源与哈希清单](data/manifest.json) · [官方数据表复核 JSON](data/audit.json)\n',
 '## 各条来源\n\n| 类型 | 序列 | 官方详情 | 冻结原始 CSV |\n| --- | --- | --- | --- |',
 ...manifest.series.map(s=>`| ${{sharePrice:'股价',cpi:'物价 CPI',fx:'汇率'}[s.type]} | ${s.id} | [OECD / FRED](${s.source}) | [下载](${s.file}) |`),
 `\n## 核查结果\n\n核查时间：${audit.checkedAt}。对每条序列的 1978、1988、1990、2008、2020 年 12 月观测，独立读取 FRED 官方 HTML 数据表进行比较。${audit.series} 条序列、${audit.observations} 个观测均按显示精度匹配。CSV 与网页属于同一数据提供者的两种接口，不冒充两个独立经济数据来源。\n`,
 '## 组合与购买力公式\n\n本地股票价格因子 = 本年 12 月股价指数 ÷ 上年 12 月股价指数。\n\n每个外国市场的本币价格因子 = 该国股价因子 ×（本年玩家本币/美元 ÷ 本年该国本币/美元）÷（上年玩家本币/美元 ÷ 上年该国本币/美元）。\n\n四国股票仓每年起点各 25%，本年度因子是四个本币因子的算术平均。只模拟价格与汇率，不含股息、税费和交易成本，也不声称当年存在这只基金。\n\n实际购买力 = 净资产 × 起点 CPI ÷ 当前 CPI。生活预算随已经经历的 CPI 变化调整，工资与具体金额是教学模型。\n',
 '## 不能混用的口径\n\n经典日本七年篇使用日经 225 年末收盘点位；全球篇使用 OECD 月度股价指标。两者的指标和观测时点不同。完整下载包含未来年份，游戏界面仅在选择完成后逐年展示。\n\n历史序列可能修订。现在使用的是 2026-11-13 冻结版本，不是历史当时发布的信息快照。没有模拟 CPI 发布滞后。\n',
 '## 史料回顾\n\n[日本银行：资产价格与政策历史回顾](https://www2.boj.or.jp/archive/en/announcements/press/koen_2000/ko0005a.htm)；[美联储历史：大通胀](https://www.federalreservehistory.org/essays/great-inflation)；[美联储历史：大衰退及后续](https://www.federalreservehistory.org/essays/great-recession-and-its-aftermath)；[英格兰银行历史](https://www.bankofengland.co.uk/about/history)；[加拿大银行通胀目标协议](https://www.bankofcanada.ca/core-functions/monetary-policy/agreement-inflation-control-target/)。\n\n剪报依据事后史料改写，并非同期新闻原文。家庭医疗、维修和收入事件是独立的虚构情境。\n',
 '## 引用与权利说明\n\nOECD (2026), Main Economic Indicators / Consumer Price Indices, retrieved from FRED, Federal Reserve Bank of St. Louis, accessed 2026-11-13. 各序列的完整引用与原始提供者说明以对应 FRED 页面为准。本站保留来源，不主张对来源数据的独占权利。原创人物与费用、剧情、规则、图表和教学组合由本作品单独构建。\n'];
 fs.writeFileSync(path.join(root,'docs/数据来源.md'),source.join('\n').trimEnd()+'\n');
 let guide=fs.readFileSync(path.join(root,'docs/玩法说明.md'),'utf8');
 guide+='\n## 附录：三十个年度节点\n\n每个年度再配一次资金，因此共 60 次主要选择。下表为默认标题，部分节点会因伴侣与孩子状态改变。\n\n| 年度 | 生活事件 |\n| --- | --- |\n'+C.chapters.map((c,i)=>`| 第 ${i+1} 年 | ${c.title} |`).join('\n')+'\n';
 const documents=[['guide.html',guide],['review.html',fs.readFileSync(path.join(root,'docs/完整改进分析.md'),'utf8')],['sources.html',source.join('\n')]];
 require('./render-docs.cjs')({root,marked,documents,edition:'全球篇 3.0'});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
