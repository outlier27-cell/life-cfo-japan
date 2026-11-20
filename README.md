# 人生 CFO 年度简报篇 8.1.0

[公网试玩](https://outlier27-cell.github.io/life-cfo-japan/?v=8.1.0) · [玩法守则](https://outlier27-cell.github.io/life-cfo-japan/guide.html) · [开发文档](https://outlier27-cell.github.io/life-cfo-japan/developer.html) · [数据与公式](https://outlier27-cell.github.io/life-cfo-japan/sources.html)

四国随机开局，最多30年60次生活与配置选择。每年看现金流和家庭资产负债表；无法清偿时提前结束，在同一历史中与现金流管家、均衡和现金储备三个规则模型和自己的上一局比较。

- 每年处理一件生活小事，再确认资产配置。按钮写动作，已知费用和收入变化在提交前展示。配置沿用上次比例，需要时展开三种预设或其他安排。
- 照料父母、老同事的周末项目和家庭旅行各有后续选择、回访与结尾。名字、参与人物和关键物件在同一局中保持一致；取消或提前结束会如实记下。
- 生活选择留下具体回应和回忆；年末先展示这一年发生的事、现金流与净资产，完整账本随时展开。
- 本版去掉止盈止损和年内自动再平衡，年初按玩家确认比例调整一次。
- 现金、股票、债券模型、黄金、保险、住房与汽车分开处理，房贷和未付账单列负债。
- 强制财务危机处理、可变现时清偿恢复、破产终止；破产结果也能分享和重玩。
- 裁员、复工、换工作、继承、奖金、照料父母、小项目、维修和搬迁会改变收入或支出，15张既有AI插画与184张分支剧情横图配合剧情。
- 现金图、完整30年账表、可点击年度明细、年初年末对账、同年模型对比、48列CSV与复盘导出。
- 成绩链接手动汇总好友榜，无云端自动同步；同编号完整30年排名，提前结束单独列出。
- 本机自动保存、备份、导入导出与多标签冲突保护。6.0旧存档保留在`family-v6.html`，5.0旧存档保留在`family-v5.html`，4.2旧存档保留在`multi-v4.html`，3.0在`world-v3.html`，日本篇在`japan.html`。

## 运行与构建

Node.js 20+。运行游戏无需依赖安装、API密钥或账号。

```sh
node serve.cjs
npm test
node build-offline.cjs world-offline.html
node build-offline.cjs japan-offline.html --classic
```

服务默认监听127.0.0.1:4173，`LIFE_CFO_PORT`可改端口。只有需要局域网访问时才使用`--lan`。

手机流程回归使用独立浏览器上下文。在能加载 Playwright 和 Chromium 的环境运行 `node tools/check-mobile-flow.cjs http://127.0.0.1:4173/`，可用 `LIFE_CFO_BROWSER_CHANNEL=chrome` 选择已安装的 Chrome。该脚本核对采用配置、返回年末、好友榜输入反馈和存档下载。普通试玩无需安装测试工具。

文档构建使用锁定的marked依赖，也支持以`CFO_NODE_MODULES`指定已配置的包目录：

```sh
npm ci
npm run build:docs
```

数据入口为`npm run build:data`和`npm run audit:sources`。维护数据前先读开发文档；重建会改变文件，不应作为每次界面发布的附带操作。

## 数据与模型边界

规则版本`family-7.0.0`，沿用冻结数据`multi-asset-2026-11-13`。主流资产来源、原始CSV、黄金工作簿、哈希及抽样核对记录在`data/v4/`。股票为价格指数不含股息，债券回报为估值模型，保险与房贷为教学合同。工资和家庭费用按全年净额结算，不还原逐月发薪及账单顺序。模型是公开确定性规则，未使用大模型预测市场。

## 维护资料

- `docs/开发与持续优化文档-v7.md`：状态机、财务恒等式、事件、协议、验收与后续改进。
- `docs/玩法守则-v7.md`：玩家操作与结果解读。
- `docs/数据来源-v7.md`：完整来源及计算口径。
- `QA-v71.md`：影像版本及 7.1.2 公网试玩与修复记录。
- `assets/README.md`：插画来源与用途。

## 图片制作与历史档案

制作端使用 gpt-image-2 及人物参考图生成剧情画面。每份家庭存档通过国家、人物、节点和选择读取成品。历史照片含署名与许可，详细条目见 assets/archive/sources.json。
