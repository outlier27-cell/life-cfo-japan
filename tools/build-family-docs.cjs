'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
(async()=>{
 let marked;try{({marked}=await import('marked'));}catch{if(!process.env.CFO_NODE_MODULES)throw Error('Set CFO_NODE_MODULES to the bundled Node packages');const{pathToFileURL}=require('node:url');({marked}=await import(pathToFileURL(path.join(process.env.CFO_NODE_MODULES,'marked/lib/marked.esm.js')).href));}
 let source=read('docs/数据来源-v4.md').replace('# 多资产篇数据来源、估值公式与复核记录','# 家庭账本篇数据来源与估值规则').replace('4.2界面 · 财务规则pro-4.0.0','5.0界面 · 财务规则family-5.0.0').replaceAll('?v=4.2.0','?v=5.0.0').replace('## 执行时点与可用信息','## 执行时点与可用信息').replace('模型只用决策时点之前12个月的观测，不读取下一年','本版模型使用固定年度比例，不读取下一年').replace(/止盈止损在月度观测后[^\n]+/,'5.0仅在年初按本次确认比例调整金融资产，年内没有止盈止损或自动再平衡；月度观测用于估值。家庭工资与费用按年度净额结算，不能还原逐月账单和发薪的先后。新闻是史料改写，不证明某条消息单独造成价格变化。').replace('4.2新增三个固定假设','基础篇保留三个可选固定假设').replace('不计未来收入、房车涨跌或月度止盈止损；实际年度仍按原规则结算','不计未来收入和房车涨跌；实际年度按family-5.0.0规则结算');
 source=source.replace('## 事前压力测试的参数','## 家庭账本和危机处置\n\n年度收支差额为收入及遗产减去本年应承担的生活、保障、选择费用、房贷还款与自付账单。它不等于现金或净资产。现金不足先出售债券、黄金、股票并计费；仍有欠款或净资产为负时，必须进入危机处理，无法清偿则结束。现金图只把实际支付列为现金流出，欠款留在负债栏。具体顺序和恒等式见开发文档。\n\n## 事前压力测试的参数');
 fs.writeFileSync(path.join(root,'docs/数据来源-v5.md'),source);
 const review='# 家庭账本篇改进记录\n\n5.0版本说明 2026年11月16日\n\n本轮围绕30年家庭账本改造主流程，每年保留一个生活决定和一个配置决定。年度收支、现金与净资产分别显示，欠款无法清偿时必须结束。\n\n## 已实现的改动\n\n- 强制危机处理、可清偿时出售资产恢复、破产终止与复盘。\n- 默认三个配置预设；去掉止盈止损和年内自动再平衡。\n- 全年现金流图、六项资产与两项负债、净资产变化明细、年度CSV。\n- 裁员、重返工作、换工作和遗产的实际账务影响，五张AI剧情插画。\n- 两种规则模型同场对照；提前失败停止曲线，同编号重玩对照上一局。\n- 便签、可选压力测试、成绩链接好友榜、版本隔离和旧存档入口。\n\n## 数据与体验边界\n\n历史快照沿用已冻结的数据。股票不含股息，债券是估值模型，保险与房贷是教学合同。家庭现金按年度净额结算，不能声称复原逐月支付顺序。好友榜需手动汇总，规则模型不等同于大模型投资代理。\n\n## 维护资料\n\n[完整玩法](guide.html) · [开发与持续优化](developer.html) · [数据与公式](sources.html) · [4.2旧版玩法](guide-v4.html)。实际回归与发布结果见仓库QA记录。\n';
 fs.writeFileSync(path.join(root,'docs/改进分析-v5.md'),review);
 const documents=[['guide.html',read('docs/玩法守则-v5.md')+'\n\n[下载Word版玩法守则](docs/life-cfo-player-v5.docx)\n'],['developer.html',read('docs/开发与持续优化文档-v5.md')+'\n\n[下载Word版开发文档](docs/life-cfo-developer-v5.docx)\n'],['sources.html',source],['review.html',review]];
 require('./render-docs.cjs')({root,marked,documents,edition:'家庭账本篇 5.0',date:'2026-11-16'});
})();
