'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 let marked;try{({marked}=await import('marked'));}catch{if(!process.env.CFO_NODE_MODULES)throw Error('Install dev dependencies or set CFO_NODE_MODULES');const{pathToFileURL}=require('node:url');({marked}=await import(pathToFileURL(path.join(process.env.CFO_NODE_MODULES,'marked/lib/marked.esm.js')).href));}
 const manifest=require('../data/v4/manifest.json'),audit=require('../data/v4/audit.json'),H=require('../pro-history.js'),L=require('../world-content.js');
 const type={stock:'股票价格',cpi:'消费物价',fx:'汇率',housing:'住房价格',bondYield:'国债收益率',gold:'黄金',vehiclePrice:'美国新车价格'};
 const source=[
 '# 多资产篇数据来源、估值公式与复核记录',
 `\n4.0 · 冻结数据版本 ${manifest.version} · 2026-11-13\n\n[返回游戏](./?v=4.0.0) · [完整玩法](guide.html) · [改进分析](review.html) · [3.0旧数据口径](sources-v3.html)`,
 '## 数据、估算与教学合同分开标明',
 '\n股票价格、汇率、CPI、国债收益率、黄金、住房指数和美国新车价格指数均取自下面列明的权威来源。债券持有回报需要估值模型；车辆价值需要价格参考与折旧模型；保险与房贷合同为教学设定。来源权威并不代表这些模型结果是真实可交易产品的历史净值。',
 '\n金融与物价月度观测覆盖1977年12月至2020年12月，共517个连续点；住房各取1977—2020共44个Q4观测。不插值生成缺失行情。美国本币兑美元恒为1，不冒充额外来源序列。',
 '\n[月度观测CSV](data/v4/monthly.csv) · [四国住房Q4 CSV](data/v4/housing.csv) · [全部来源与SHA-256](data/v4/manifest.json) · [来源复核JSON](data/v4/audit.json) · [世界银行原工作簿](data/v4/raw/CMO-Historical-Data-Monthly.xlsx) · [黄金原表提取记录](data/v4/gold-extraction.json)',
 '## 18条来源序列',
 '\n| 类别 | 标识 | 观测数 | 来源与单位 | 冻结文件 |\n| --- | --- | --- | --- | --- |',
 ...manifest.series.map(s=>`| ${type[s.type]} | ${s.id} | ${s.count} | [官方页面](${s.source})；${s.unit} | [原始/提取CSV](${s.file}) |`),
 '## 黄金提取与数据复核',
 `\n世界银行原工作簿标记：${manifest.workbook.updated}。使用“${manifest.workbook.sheet}”表第${manifest.workbook.headingRow}行的 Gold 列，第${manifest.workbook.column}列，单位 ${manifest.workbook.unit}。保留工作簿哈希和抽查单元格坐标，未通过截图或手抄补数。`,
 `\n复核时间：${audit.checkedAt}。17条FRED序列分别检查1978、1988、1990、2008、2020年：月度序列取1/6/12月，住房取四个季度，共${audit.fredObservations}个官方HTML表格观测；另核对${audit.goldWorksheetObservations}个黄金工作簿单元格。均与冻结CSV按来源显示精度匹配。`,
 '\n这是同一来源不同接口或原表与提取文件的核查，证明提取没有改错日期、列或数值，不等于独立供应商认证。测试另检查全序列连续性、正值、字段和源文件哈希。',
 '## 股票、黄金与汇率',
 '\n本地股票因子 = 当月价格指数 ÷ 上月价格指数。采用OECD月度价格口径，通常是月均值，不是年末收盘，不含股息。四国股票在每年起点按四国等权建立参考组合，年内相对价格变化来自固定的初始份额；它不是历史上实际存在的基金。',
 '\n外国市场的本币累计因子 = 外国股价累计因子 ×（当前玩家本币/美元 ÷ 当前该国本币/美元）÷（年初玩家本币/美元 ÷ 年初该国本币/美元）。四国起点各25%，将四个本币累计因子求平均，再用相邻月的累计因子之比计算月变化。',
 '\n黄金本币月因子 = 本月黄金美元价 ÷ 上月黄金美元价 × 本月本币/美元 ÷ 上月本币/美元。没有汇率对冲、利息或股息。',
 '\n[OECD股价定义](https://www.oecd.org/en/data/indicators/share-prices.html) · [世界银行商品市场与数据使用说明](https://www.worldbank.org/en/research/commodity-markets)',
 '## 国债模型：收益率不是收益',
 '\n数据是美联储H.15的GS10，月度营业日平均、年化百分比。每年起点建立面值100美元、剩余期限10年的教学平价债，年票息金额等于起点收益率百分数；每半年付息，年底重新建立下一年的10年债参考。',
 '\n在年内第m个月，使用当月GS10作为整个剩余现金流的统一折现率：\n\nP(m) = Σ [票息/2 + 到期本金] ÷ (1 + 当月年化收益率/2)^(2 × 剩余年数)。\n\n式中的收益率使用小数，如5%为0.05。只包含观察时点之后的现金流；当月已付票息另加。月度美元持有因子 = [当月剩余现金流价格 + 当月票息] ÷ 上月价格，再乘本币汇率因子。票息视作再投资。',
 '\n这是平坦收益率曲线、合成期限滚动和理想化再投假设下的估值，不是国债实际成交价或某只总回报指数。利率上涨时，固定票息债券可能跌价。',
 '\n[美联储GS10数据与口径](https://fred.stlouisfed.org/series/GS10) · [美国SEC投资者教育：债券](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds)',
 '## 房产、车辆、现金和保险',
 '\n住房：BIS名义住宅价格指数，国家口径，2010=100，选Q4。开局金额锚定120个月教学基础预算，以后按指数比例变化。国家之间的房屋覆盖类型和编制方法仍有差异。首付30%、固定5%房贷、20年期限、3%买卖费等均为教学合同；不是历史当地利率或城市房价。',
 '\n汽车：BLS美国新车CPI，1982—1984=100、非季调。开局金额锚定8个月基础预算，以后按美国价格指数和本币/美元汇率变化，作为统一的进口车成本参考；持有车辆每年再扣15%教学折旧。它不是当地车型报价，也不是二手车交易指数。养车支出另计。',
 '\n现金：本币不计息，实际购买力用CPI折算。保险：0/50/80%模拟医疗账单保障，保费0/0.6/1.2个月预算，没有现金价值；未声称模拟真实当地保险产品。人物、收入、医疗金额与维修意外均属虚构情境。',
 '\n[国际清算银行住房统计说明](https://data.bis.org/topics/RPP) · [美国新车CPI](https://fred.stlouisfed.org/series/CUUR0000SETA01)',
 '## 执行时点与可用信息',
 '\n每年决策页只显示刚过去的年份；模型只用决策时点之前12个月的观测，不读取下一年。月均价、季度价格与CPI存在统计发布时间和后续修订，本版未完整还原实时信息可得性；使用固定的2026-11-13历史快照。',
 '\n止盈止损在月度观测后按观察值模拟成交；触发仓位当年留现金，不被再平衡买回。不能用月均数据声称还原盘中止损、跳空或真实滑点，也不保证在阈值成交。新闻是史料改写，不证明某条消息单独造成价格变化。',
 '## 决策前年度史料目录',
 '\n每条只摘要对应年份已经发生的内容。外部原文可能包含后来的历史；游戏不把未来段落带到当前决策页。\n\n| 年份 | 摘要 | 原始出处 |\n| --- | --- | --- |',
 ...H.entries.map(h=>`| ${h.year} | ${h.title}：${h.text} | [核对原文](${h.source}) |`),
 '## 引用与使用说明',
 '\nOECD (2026), Main Economic Indicators / Consumer Price Indices；Board of Governors of the Federal Reserve System (US), H.15；U.S. Bureau of Labor Statistics, CPI；National sources and BIS Residential Property Price database；World Bank Commodity Price Data (The Pink Sheet)。经对应官方渠道与FRED取得，访问日期2026-11-13。各数据的完整引用与权利说明以所列原始页面为准。本站保留来源，不主张来源数据的独占权利。'
 ].join('\n');
 fs.writeFileSync(path.join(root,'docs/数据来源-v4.md'),source.trimEnd()+'\n');
 let guide=fs.readFileSync(path.join(root,'docs/玩法说明-v4.md'),'utf8');guide+='\n## 附录：三十个年度节点\n\n| 年度 | 生活主题 |\n| --- | --- |\n'+L.chapters.map((c,i)=>`| 第${i+1}年 | ${c.title} |`).join('\n')+'\n';
 const documents=[['guide.html',guide],['review.html',fs.readFileSync(path.join(root,'docs/改进分析-v4.md'),'utf8')],['sources.html',source]];
 require('./render-docs.cjs')({root,marked,documents,edition:'多资产篇 4.0'});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
