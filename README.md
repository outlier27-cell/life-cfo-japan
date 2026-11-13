# 人生 CFO · 全球篇 3.0

[公开试玩](https://outlier27-cell.github.io/life-cfo-japan/?v=3.0.0) · [完整玩法](https://outlier27-cell.github.io/life-cfo-japan/guide.html) · [改进分析](https://outlier27-cell.github.io/life-cfo-japan/review.html) · [数据与审计](https://outlier27-cell.github.io/life-cfo-japan/sources.html)

随机出生于日本、美国、英国或加拿大，从 1978、1988、1990 年中的一个历史起点开始，经历 30 年、60 次生活与资金选择。通过家庭账本、真实股价/汇率/CPI、单次配置回放和好友成绩链接，体验财务安排与人生责任的关系。

## 当前可以使用

- 36 种国家、年代、家庭背景组合；每个编号还固定一组外生事件。
- 连续 30 个原创生活节点，有伴侣、孩子、技能、住房、保障、互助和维护的条件与持续影响。
- 现金比例与本地/四国股票范围；规则型财务助理负责解释和执行。
- 真实历史观测、年账本、资金条、购买力、现金目标、三十年日志、单次反事实对照。
- 成绩与榜单链接；按同开局分别比较财富、现金缓冲和生活，导入时重算全部命令。
- 自动保存、备份、导入导出、跨标签冲突提醒、窄屏与桌面布局。
- 旧版日本七年篇在 `japan.html`，存档保持独立。

好友榜采用用户明确选择的成绩链接汇总方式，不自动云同步。无身份认证，不是防作弊竞赛榜。本版无登录、广告、支付、第三方统计或在线模型调用。

## 本地运行与构建

Node.js 20 或更高版本。游戏运行不需要安装任何依赖：

```sh
node serve.cjs
npm test
node build-offline.cjs world-offline.html
node build-offline.cjs japan-offline.html --classic
```

默认地址 `http://127.0.0.1:4173`。通过 `LIFE_CFO_PORT` 覆盖端口；`--lan` 只在需要局域网访问时使用。服务使用文件白名单，不开放整个上级项目。

文档生成只需要开发依赖 marked；线上 HTML 已生成，无须浏览器加载库：

```sh
npm ci
npm run build:docs
npm run build:data
npm run audit:sources
```

数据构建从冻结 CSV 提取，不会自动下载或更新历史。来源复核会读取官方 HTML 数据表，若未来来源数据修订导致差异，需要人工审核并发布新的数据版本，不能直接覆盖正在进行的旧局。

## 模块

| 文件 | 职责 |
| --- | --- |
| world-engine.js | 纯规则、阶段与命令验证、账本、随机、回放 |
| world-content.js | 30 年原创事件、教学规则版本、复盘问题 |
| world-data.js | 固定 OECD/FRED 观测快照 |
| world-history.js | 带来源的历史背景摘要 |
| world-social.js | 紧凑成绩协议、完整重算、榜单汇总 |
| world-charts.js | 原生 SVG 趋势图、金额条与数值表 |
| world-app.js | 手机 UI、存档、对话框、分享与恢复 |
| data/ | 原始 CSV、年度表、来源哈希清单、复核记录 |
| docs/ | 玩法、设计与完整改进分析的源文件 |
| tools/ | 数据与文档构建、来源复核 |

金额使用整数本币单位。股价为价格口径，不计股息、税费、费用；现金与未付款不计利息。收入、家庭费用、保障和意外是虚构教学参数。年度模型不表示逐月支付过程。详细边界见玩法说明与改进分析。

## 数据与测试

OECD，经 FRED 发布；数据版本 `oecd-fred-2026-11-13`。11 条序列 × 43 个完整的 12 月观测，另有美元对自身汇率 1。原始 CSV 的哈希写在 `data/manifest.json`。官方 HTML 数据表中 55 个样本与 CSV 匹配，见 `data/audit.json`。同源两种格式核查不等于两个独立经济数据供应商确认。

全球规则测试覆盖 2,048 局、122,880 次选择和全部 36 种组合；每步账本守恒、无负持仓、逐步读档、错误版本、输入边界、跨国汇率、单次配置对照与成绩往返均有验证。经典版测试也保留。

UI 验收包括 320/390/1280 宽度、全部 60 次选择、刷新、成绩在独立上下文中的导入、榜单、图表和键盘操作。GitHub Pages 公网已走完 60 次选择，实际成绩与榜单链接在全新上下文中导入成功；35 个生产文件与提交字节一致。完整记录见 [RELEASE-QA.md](docs/RELEASE-QA.md)。技术验收不能替代真实玩家的可玩性与教育效果验证。

## 发布与回退

独立仓库 `outlier27-cell/life-cfo-japan` 的 main 分支由 GitHub Pages 发布。只复制本目录的游戏文件、文档、测试和构建工具，不复制上级研究项目、私人附件、浏览器存档、凭据或临时 QA 输出。原始 CSV 使用 `.gitattributes` 保持字节不被换行转换破坏。

运行时发布需要 index.html、japan.html、guide.html、review.html、sources.html、CSS、JS、两张 WebP、data/ 和 .nojekyll。文档和 Node 构建/测试源文件可随代码仓库保留。不要上传 node_modules。

全球篇按规则与数据版本固定重放，经典版继续使用原来的独立版本。回退时将 Pages 分支回退到上一已验证提交即可。当前发布前的七年版提交为 `e7ee3e8485828124381427294c647568ccd123f8`。

## 素材与参考

旅行账本与东京街景由内置 Image Gen 创作。界面、剧情与规则为独立实现；未使用原小游戏的私有代码或素材。参考 remake、inkjs、boardgame.io 的结构思想，未引入它们作为运行时依赖。第三方经济数据及指数权利归对应来源，完整出处在 sources.html。
