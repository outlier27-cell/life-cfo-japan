# 人生 CFO · 多资产篇 4.0

[公网试玩](https://outlier27-cell.github.io/life-cfo-japan/?v=4.0.0) · [完整玩法](https://outlier27-cell.github.io/life-cfo-japan/guide.html) · [本轮改进分析](https://outlier27-cell.github.io/life-cfo-japan/review.html) · [数据与公式](https://outlier27-cell.github.io/life-cfo-japan/sources.html)

四国随机出生，30年60次连续生活与财务选择。配置前回顾过去一年，安排股票、债券模型、现金、黄金，以及独立的保险、房产/房贷和汽车。每月执行观察止盈止损与再平衡，终局与三种公开规则模型同场复盘。

## 可以使用的内容

- 日本、美国、英国、加拿大 × 1978/1988/1990起点 × 三种家庭背景，36种组合；人生编号固定外部意外。
- 30个原创生活节点与条件分支、轻松人物对白；42个有出处的年度事件，决策页不显示未来年。
- 金融比例预设与手动调整，现金自动补足100%；月度观察止盈止损，季度/偏离10个百分点再平衡，逐笔模拟执行与费用记录。
- 保费/赔付、住房买卖/房贷本金与利息、车辆价格参考/折旧分别入账。
- 玩家与现金储备、均衡再平衡、历史趋势模型对比，十项维度、实际购买力曲线、完整日志与单年反事实。
- 成绩链接汇总好友榜、自动存档、导入导出、备份与多标签冲突保护。
- 3.0全球篇在world-v3.html，日本七年篇在japan.html；旧成绩和存档使用旧规则。

## 本地运行

Node.js 20+。游戏运行不需安装依赖，也没有运行时网络API、账号、付费、广告或统计SDK。

~~~sh
node serve.cjs
npm test
node build-offline.cjs world-offline.html
node build-offline.cjs japan-offline.html --classic
~~~

默认127.0.0.1:4173，可用LIFE_CFO_PORT覆盖。--lan只在需要局域网访问时使用；静态服务有文件白名单，不开放上级研究目录。

~~~sh
npm ci
npm run build:data
npm run audit:sources
npm run build:docs
~~~

开发依赖仅固定版本marked，用于生成已随站点发布的说明网页。数据构建只读取冻结CSV，不会自动改写历史。黄金首次提取使用Python/openpyxl运行tools/extract-gold.py；原世界银行工作簿、单元格来源和提取记录一并保存。来源复核需网络。

## 模块与版本

| 文件 | 职责 |
| --- | --- |
| pro-engine.js | 多资产状态机、月度执行、家庭账本、模型重放 |
| pro-content.js | 4.0参数、剧情细节、配置预设与模型定义 |
| pro-history.js | 42个年度事件和原始出处 |
| pro-data.js | 18条来源的冻结观测 |
| pro-social.js | 420字符选择编码、成绩重算、同场榜单 |
| pro-app.js / pro.css | 手机交互、报告、存档与分享 |
| world-engine.js / world-content.js / world-data.js | 保留3.0规则；4.0复用身份、原生活事件与外生事件 |
| world-charts.js | 原生SVG图表和数值表 |
| data/v4/ | 新版来源清单、月度/住房表、原始文件、核查记录 |
| tools/ | 数据构建、黄金提取、来源复核、共享文档渲染 |

4.0规则版本pro-4.0.0，数据multi-asset-2026-11-13。规则/存档/成绩不与3.0混用；不要直接覆盖已有版本的数据或改变命令含义。

## 数据与模型边界

权威观测来自OECD、FRED、美联储、BIS、世界银行和BLS。18条来源，无插值填缺；275个FRED表格观测与15个黄金工作簿单元格复核通过。全部源文件哈希可检查。

债券是根据真实收益率估算的美元国债组合，不是实盘总回报指数；汽车是美国新车价格与汇率参照加教学折旧，不是当地车型报价。保险合同、房贷5%固定利率/20年、交易费用、收入、意外和生活预算均为明确的教学参数。股票不含股息，不模拟全部税制、资本管制或开户条件。月均观察不等于盘中止损成交。家庭收入和账单按年结算。

好友榜是已选择的链接汇总，不自动云同步，无身份认证；不宣称竞赛防作弊。模型不读取未来观测，但使用修订后的冻结历史，未还原全部发布滞后。

## 验收与发布

完整34项新旧版本测试全部通过，其中新增14项测试覆盖512局完整人生、30,720次选择、184,320个月度执行步。详细范围见[4.0验收记录](docs/RELEASE-QA-v4.md)和[设计验收](docs/DESIGN-v4.md)。浏览器覆盖320/390/1280px及完整60次流程；模拟视口不等于真实手机/微信内置浏览器认证。

发布到独立仓库outlier27-cell/life-cfo-japan的main分支，由GitHub Pages托管。只发布本游戏白名单文件；不包含上级研究项目、私人Word附件、凭据、玩家本地档、node_modules或临时浏览器资料。原始CSV与工作簿按.gitattributes保持字节哈希。

上一已验证3.0发布提交：6a847c2294aa99de881ee1fa193ec50d7a30cf6b。保留旧版本入口和Git历史，便于回退。

## 素材与参考

原创旅行账本/东京街景由内置Image Gen制作；未使用原小游戏的私有代码与素材。原架构参考remake、inkjs、boardgame.io的事件组织与状态机思路，未将它们作为运行时依赖。第三方数据权利与引用遵循所列来源；数据模型与玩法边界详见sources.html和guide.html。
