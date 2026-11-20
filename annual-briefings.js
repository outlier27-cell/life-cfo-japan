(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const H=node?require('./pro-history.js'):root.ProHistory;
const R=node?require('./annual-policy-rates.js'):root.AnnualPolicyRates;
const bis='https://data.bis.org/topics/CBPOL/BIS%2CWS_CBPOL%2C1.0/M.';
const boj='https://www.boj.or.jp/en/mopo/';
const qqe=boj+'outline/ref_qqe.htm';
const europe='https://www.ecb.europa.eu/ecb/history-arts-culture/history/emu/html/index.en.html';
const berlin='https://history.state.gov/milestones/1989-1992/fall-of-communism';
const canadaTrade='https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/united_states-etats_unis/fta-ale/background-contexte.aspx?lang=eng';
const fed='https://www.federalreservehistory.org/essays/';
const topics={
 rate:['贷款报价和存款收益可能随利率变化。','银行何时调整报价、调多少，当时仍不确定。'],
 easing:['银行资金环境改善可能影响家庭借贷和投资估值。','资金是否流向企业和家庭、工资能否回升，当时仍不确定。'],
 trade:['订单和进口价格变化可能影响工资、日常开支和外币持仓。','各行业何时受益、哪些家庭会受影响，当时仍不确定。'],
 work:['工时和收入一旦变化，房租和还款仍要按期支付。','复工或需求恢复会有多快，当时仍不确定。'],
 markets:['投资市值会波动，有近期账单的家庭更容易遇到变现压力。','价格会反弹还是继续下跌，当时仍不确定。'],
 banking:['信贷收紧时，申请贷款的门槛和家庭所需的现金都可能上升。','压力会传到哪些银行和行业，当时仍不确定。'],
 prices:['物价会影响同一笔工资能覆盖多少家庭开支。','工资能否跟上物价、价格压力会持续多久，当时仍不确定。'],
 welfare:['保障和公共服务变化可能改变家庭要自备的资金。','政策落地速度以及不同家庭能得到什么，当时仍不确定。'],
 currency:['换汇成本和本币计价的海外持仓都可能变化。','汇率往哪走、行业如何消化成本，当时仍不确定。'],
 transition:['政策和贸易安排可能影响家庭的就业和支出计划。','下一步安排如何落实、影响多快传到账本，当时仍不确定。'],
 health:['工时、医疗和照护开支可能同时变化。','恢复时间和额外支出规模，当时仍不确定。'],
 climate:['能源和交通成本是家庭预算里可能受影响的部分。','措施会如何落地、费用由谁承担，当时仍不确定。']
};
const localEdits={
 JP:{
  1997:['日本多家金融机构陷入困境','包括三洋证券在内的金融机构在当年出现破产。','banking','https://www2.boj.or.jp/archive/en/announcements/press/koen_2001/ko0112a.htm'],
  2000:['日本银行结束零利率政策','8 月，央行宣布结束零利率政策，把隔夜拆借利率引导到约 0.25%。','rate',boj+'mpmdeci/mpr_2000/k000811.htm'],
  2010:['日本启动全面货币宽松','10 月，日本银行公布全面货币宽松安排。','easing',boj+'outline/bpreview/ref.htm'],
  1985:['日本参加广场协议','9 月，五国就汇率政策协调达成协议。','currency','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf'],
  1989:['日本银行开始收紧政策','5 月，日本银行将官方贴现率从 2.5% 提至 3.25%。','rate','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf','正在攒首付的家庭要留意新贷款报价，持有股票的家庭也可能感到波动。','利率上调会不会压住房价和股价、多久才见效，当时无法确定。'],
  1990:['日本股价从高位转弱','当年股票价格大幅下跌，期间仍有反弹。','markets','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf'],
  1991:['日本银行下调官方贴现率','7 月，官方贴现率从 6% 降至 5.5%。','rate',boj+'mpmdeci/mpr_2024/k241219b.pdf'],
  1995:['阪神淡路大地震','1 月 17 日，地震重创神户及周边地区。','health','https://www.bousai.go.jp/kyoiku/kyokun/hanshin_awaji/index.html'],
  1999:['日本采用零利率政策','2 月，日本银行引导短期市场利率降至接近零。','rate',boj+'mpmdeci/mpr_1999/k990921a.htm'],
  2001:['日本银行转向量化宽松','3 月，操作目标从短期利率转向金融机构在央行的往来账户余额。','easing','https://www2.boj.or.jp/archive/en/announcements/press/koen_2002/ko0201a.htm'],
  2002:['日本扩大量化宽松','日本银行将往来账户余额目标提高到 15–20 万亿日元。','easing','https://www2.boj.or.jp/archive/en/announcements/press/koen_2002/ko0212c.htm'],
  2003:['日本银行进一步提高准备金目标','10 月，央行上调金融机构往来账户余额目标。','easing',boj+'outlook/data/gor0310.pdf'],
  2004:['日本银行再提高量化宽松目标','1 月，央行将余额目标范围提高至约 30–35 万亿日元。','easing',boj+'diet/d_report/hanki04b.htm'],
  2005:['日本维持量化宽松','年内延续约 30–35 万亿日元的往来账户余额目标。','easing','https://www2.boj.or.jp/archive/en/announcements/press/koen_2005/ko0503b.htm'],
  2006:['日本结束这一轮量化宽松','3 月，央行将操作目标切换回无担保隔夜拆借利率。','rate','https://www2.boj.or.jp/archive/en/announcements/press/koen_2006/ko0603a.htm'],
  2011:['东日本大地震','3 月，日本发生大地震，央行随后提供流动性支持。','health','https://www.boj.or.jp/en/about/press/koen_2011/ko110421a.htm'],
  2013:['日本推出量化与质化宽松','4 月，日本银行推出新框架，承诺扩大货币基础和资产购买。','easing',qqe],
  2014:['日本扩大量化与质化宽松','10 月，日本银行决定扩大货币基础和资产购买规模。','easing',boj+'mpmdeci/mpr_2014/k141031a.pdf'],
  2015:['日本银行公布宽松补充措施','12 月，央行公布一组补充措施，包括调整所购国债的平均剩余期限。','easing',qqe],
  2016:['日本引入收益率曲线控制','9 月，日本银行引入短期政策利率与长期国债收益率相结合的框架。','rate',qqe]
 },
 US:{
  1980:['美国通过《货币控制法》','该法扩展了美联储对存款机构准备金要求的适用范围。','banking','https://www.federalreservehistory.org/topics/legislation'],
  1982:['美国放宽储蓄机构经营限制','1982 年的《加恩—圣杰曼存款机构法》放宽了部分存款和贷款业务限制。','banking',fed+'garn-st-germain-act'],
  1999:['美国修改金融行业经营规则','11 月签署的金融服务现代化法放宽了银行、证券与保险公司的联合经营限制。','banking',fed+'gramm-leach-bliley-act'],
  1979:['美联储改变货币政策操作方式','10 月，准备金增长成为政策操作的新重点。','prices',fed+'great-inflation'],
  1983:['美国修订社会保障制度','4 月签署的修正案改变了社会保障的筹资与待遇安排。','welfare','https://www.ssa.gov/history/1983amend.html'],
  1987:['华尔街遭遇黑色星期一','10 月股市重挫，美联储随后表态支持金融体系流动性。','markets',fed+'stock-market-crash-of-1987'],
  2001:['美国确认进入衰退','11 月，NBER 公布美国经济活动已在 3 月见顶。','work','https://www.nber.org/news/business-cycle-dating-committee-announcement-november-26-2001'],
  2007:['美国住房和金融市场压力加大','住房下行与部分抵押信贷损失开始给金融机构带来压力。','banking',fed+'great-recession-and-its-aftermath'],
  2008:['美国金融危机加深','年内多家金融机构承压，美联储在 12 月把联邦基金利率目标区间降至接近零。','banking',fed+'great-recession-and-its-aftermath'],
  2013:['美联储宣布缩减购债','12 月，美联储公布次年起放慢每月购债的安排。','easing','https://www.federalreserve.gov/newsevents/pressreleases/monetary20131218a.htm'],
  2017:['美联储启动缩表安排','9 月，美联储宣布将在 10 月启动资产负债表正常化。','rate','https://www.federalreserve.gov/newsevents/pressreleases/monetary20170920a.htm'],
  2020:['美联储因疫情紧急降息','3 月 15 日，联邦基金利率目标区间降到 0–0.25%。','rate','https://www.federalreserve.gov/newsevents/pressreleases/monetary20200315a.htm','新贷款可能变便宜，但家庭是否借得到钱还取决于工资和信贷审核。','疫情持续多久、就业多久能恢复，当时还不知道。']
 },
 GB:{
  2009:['英国启用资产购买工具','英格兰银行在 3 月启动这一轮资产购买。','easing','https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2012/quarterly-bulletin-2012-q4.pdf'],
  2012:['英国推出融资换贷款计划','夏季，英格兰银行与财政部推出计划，通过银行融资成本支持信贷。','banking','https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2012/quarterly-bulletin-2012-q4.pdf'],
  2013:['英国央行公布利率前瞻指引','8 月公布的指引说明了货币政策与经济条件之间的关系。','rate','https://www.bankofengland.co.uk/news/2013/september/mpc-september-2013'],
  1978:['英国出现大范围劳资纠纷','1978 年末，英国进入后来被称为“不满之冬”的罢工时期。','work','https://www.ons.gov.uk/economy/grossdomesticproductgdp/articles/gdpandeventsinhistoryhowthecovid19pandemicshockedtheukeconomy/2022-05-24'],
  1986:['伦敦金融市场规则改革','10 月，伦敦证券交易制度经历被称为“大爆炸”的改革。','markets','https://www.gov.uk/hmrc-internal-manuals/stamp-taxes-shares-manual/stsm121020'],
  1992:['英国退出欧洲汇率机制','9 月 16 日，英国停止维持英镑在欧洲汇率机制中的汇率承诺。','currency','https://www.bankofengland.co.uk/about/history'],
  1997:['英格兰银行获得利率决策权','政府将设定短期政策利率的职责交给英格兰银行。','rate','https://www.bankofengland.co.uk/about/history'],
  2016:['英国公投支持退出欧盟','6 月的公投结果支持退出欧盟。','transition','https://www.gov.uk/government/topical-events/eu-referendum'],
  2020:['英国完成脱欧过渡','过渡期在年底结束，英国与欧盟就未来关系达成协议。','trade','https://www.gov.uk/government/publications/cabinet-office-records-selection-policy/cabinet-office-records-selection-policy-html']
 },
 CA:{
  2009:['加拿大央行有条件承诺维持低利率','4 月，央行把隔夜利率目标降至 0.25%，并对维持时间作出与通胀前景挂钩的承诺。','rate','https://www.bankofcanada.ca/2009/05/unconventional-becomes-conventional-monetary-policy/'],
  1988:['加拿大央行行长将物价稳定列为重点','1 月，行长约翰·克劳在公开演讲中强调物价稳定。','prices','https://www.bankofcanada.ca/2000/10/can-a-bank-change/'],
  1993:['加拿大延长通胀控制目标','12 月，政府与加拿大银行宣布将 1% 至 3% 的通胀目标区间延续至 1998 年。','prices','https://www.bankofcanada.ca/1995/03/uncertainty-transmission-monetary-policy-in-canada/'],
  1978:['加拿大新移民法生效','新制度将难民列为独立的移民类别，并允许私人担保。','welfare','https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/about-refugee-system/how-system-works/timeline.html'],
  1982:['加拿大确立权利与自由宪章','1982 年《宪法法令》将权利与自由宪章纳入宪法。','welfare','https://www.canada.ca/en/intergovernmental-affairs/services/provinces-territories.html'],
  1989:['加美自由贸易协定生效','1 月 1 日，加美自由贸易协定开始实施。','trade',canadaTrade],
  1991:['加拿大建立通胀目标','加拿大银行与联邦政府公布通胀控制目标。','prices','https://www.bankofcanada.ca/core-functions/monetary-policy/agreement-inflation-control-target/'],
  1994:['北美自由贸易协定生效','包含加拿大、美国、墨西哥的协定取代此前的加美协定。','trade','https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/nafta-alena/index.aspx?lang=eng'],
  2020:['加拿大、美国、墨西哥协定生效','7 月，新协定替代北美自由贸易协定。','trade','https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/index.aspx?lang=eng']
 }
};
const alternate={
 1979:['第二次石油冲击','伊朗革命引发全球石油供应担忧，能源价格上升。','prices',fed+'great-inflation'],
 1980:['欧洲经济共同体为希腊加入作准备','希腊此前签署加入条约，预定于次年 1 月成为成员国。','trade','https://www.consilium.europa.eu/en/history/'],
 1983:['国际债务压力延续','拉美债务危机后的国际融资压力仍在。','banking','https://www.elibrary.imf.org/display/book/9781498306836/ch01.xml'],
 1985:['欧洲签署申根协定','6 月，五个欧洲国家签署协定，着手逐步减少共同边境检查。','trade','https://www.consilium.europa.eu/en/policies/schengen-area/'],
 1986:['葡萄牙和西班牙加入欧洲共同体','两国于 1 月成为成员。','trade','https://www.consilium.europa.eu/en/history/'],
 1987:['全球市场承受十月抛售','股市冲击扩散到美国以外的市场。','markets',fed+'stock-market-crash-of-1987'],
 1989:['柏林墙开放','11 月，东德宣布开放边境。','transition',berlin,'有欧洲股票或外币存款的家庭，可以留意市场对跨境贸易和投资的反应。','当时还不清楚德国会怎样走向统一，欧洲市场也可能有不同反应。'],
 1990:['德国统一','东西德于 10 月完成统一。','transition','https://history.state.gov/countries/german-democratic-republic'],
 1991:['苏联解体','12 月，苏联解体。','transition','https://history.state.gov/departmenthistory/short-history/berlinwall'],
 1992:['欧洲各国签署马斯特里赫特条约','条约为欧洲联盟与未来单一货币提供制度框架。','currency',europe],
 2006:['欧洲央行继续加息','欧洲央行在当年多次上调主要再融资利率。','rate','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'],
 2007:['全球银行间资金压力上升','美国住房信贷问题开始影响其他市场的融资。','banking',fed+'great-recession-and-its-aftermath'],
 2008:['二十国集团召开华盛顿峰会','11 月，各方讨论应对金融危机与金融监管改革。','banking','https://georgewbush-whitehouse.archives.gov/news/releases/2008/11/20081115-1.html'],
 2011:['欧洲央行重启部分证券市场操作','主权债务压力下，欧洲央行在 8 月积极实施证券市场计划。','banking','https://www.ecb.europa.eu/press/pr/date/2011/html/pr110807.en.html'],
 2013:['克罗地亚加入欧盟','7 月，克罗地亚成为欧盟成员国。','trade','https://www.consilium.europa.eu/en/history/'],
 2014:['欧洲央行存款便利利率转负','6 月，欧洲央行下调存款便利利率至负值。','rate','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'],
 2016:['巴黎协定生效','11 月，关于气候变化的巴黎协定生效。','climate','https://unfccc.int/process/the-paris-agreement/the-paris-agreement'],
 2017:['欧盟与加拿大协定开始临时适用','9 月，欧盟与加拿大达成的经贸协定开始临时适用。','trade','https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/countries-and-regions/canada/eu-canada-agreement_en'],
 2020:['世界卫生组织将新冠疫情定性为大流行','3 月 11 日，世界卫生组织公开作出这一判断。','health','https://www.who.int/director-general/speeches/detail/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020']
};
const globalTags=['trade','prices','work','work','banking','welfare','transition','currency','markets','markets','banking','rate','markets','prices','currency','transition','trade','trade','trade','currency','banking','currency','markets','trade','currency','health','trade','climate','rate','banking','banking','transition','rate','health','banking','rate','easing','currency','transition','rate','trade','rate','health'];
const overlaps={JP:new Set([1985,1989,1990,2006,2011,2014]),US:new Set([1979,1980,1983,1987,2007,2008,2013,2017,2020]),GB:new Set([1986,1992,2016]),CA:new Set([1991])};
const names={JP:'日本',US:'美国',GB:'英国',CA:'加拿大'};
const institutions={JP:'日本银行',US:'美联储',GB:'英格兰银行',CA:'加拿大银行'};
const fmt=n=>Number(n.toFixed(4)).toString();
function card(year,raw,kind){
 const [title,text,topic,source,customImpact,customUncertainty]=raw;
 const [impact,uncertainty]=[customImpact||topics[topic][0],customUncertainty||topics[topic][1]];
 return {year,title,text,impact,uncertainty,source,kind};
}
function pick(country,year){
 if(!Object.hasOwn(R,country)||!Number.isInteger(year)||year<1978||year>2020)throw Error('简报年份或国家无效');
 const local=localEdits[country][year];
 const rates=R[country], rate=rates[year-1977], previous=rates[year-1978];
 if(!local&&!Number.isFinite(rate))throw Error('该年缺少政策资料');
 const move=!Number.isFinite(previous)?'年末水平':rate>previous?'年末高于上年':rate<previous?'年末低于上年':'年末与上年持平';
 const authority=institutions[country];
 const rateName=country==='JP'?'政策参考利率':country==='CA'&&year<1996?'银行利率':'政策参考利率';
 const policy=local?null:[names[country]+rateName+' · '+move,authority+'对应的 12 月参考值为 '+fmt(rate)+'%。'+(Number.isFinite(previous)?'去年同期为 '+fmt(previous)+'%。':''),'rate',bis+country];
 const h=H.briefing(year)[0];
 const knownText={
  1980:'美国当年经历了经济活动收缩。到年底，持续多长时间仍无法确定。',
  1981:'美国当年工业生产和就业受到压力，经济活动转弱。'
 };
 const globalSource=h.source.includes('/external/about/timeline/')?'https://www.elibrary.imf.org/display/book/9781498306836/ch01.xml':h.source;
 const global=overlaps[country].has(year)?alternate[year]:[year===1981?'美国经济活动转弱':year===1980?'美国经济活动收缩':h.title,knownText[year]||h.text,globalTags[year-1978],globalSource];
 return {local:card(year,local||policy,local?'史事':'政策数据'),global:card(year,global,'史事')};
}
const api={pick};
if(node)module.exports=api;else root.AnnualBriefings=api;
})(globalThis);
