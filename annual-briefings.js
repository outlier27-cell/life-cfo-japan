(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const H=node?require('./pro-history.js'):root.ProHistory;
const E=node?require('./annual-policy-events.js'):root.AnnualPolicyEvents;
const bis='https://data.bis.org/topics/CBPOL/BIS%2CWS_CBPOL%2C1.0/M.';
const boj='https://www.boj.or.jp/en/mopo/';
const qqe=boj+'outline/ref_qqe.htm';
const europe='https://www.ecb.europa.eu/ecb/history-arts-culture/history/emu/html/index.en.html';
const berlin='https://history.state.gov/milestones/1989-1992/fall-of-communism';
const canadaTrade='https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/united_states-etats_unis/fta-ale/background-contexte.aspx?lang=eng';
const boe='https://www.bankofengland.co.uk/';
const boc='https://www.bankofcanada.ca/';
const taxFamily='https://www.canada.ca/en/department-finance/services/publications/federal-tax-expenditures/2019/part-4.html';
const gst='https://www.canada.ca/en/department-finance/services/publications/federal-tax-expenditures/2017/part-10.html';
const japanLand='https://www.mlit.go.jp/common/001248317.pdf';
const japanNineties='https://www.imes.boj.or.jp/research/papers/english/me38-3.pdf';
const fed='https://www.federalreservehistory.org/essays/';
const ukAct=(year,chapter)=>`https://www.legislation.gov.uk/ukpga/${year}/${chapter}/enacted`;
const oldActs={'95-600':[92,2763],'97-34':[95,172],'99-177':[99,1037],'99-514':[100,2085],
 '100-360':[102,683],'101-336':[104,327],'102-550':[106,3672],'103-3':[107,6]};
function usLaw(congress,id){
 const archive=oldActs[congress+'-'+id];
 return archive?`https://www.govinfo.gov/content/pkg/STATUTE-${archive[0]}/pdf/STATUTE-${archive[0]}-Pg${archive[1]}.pdf`
  :`https://www.govinfo.gov/content/pkg/PLAW-${congress}publ${id}/pdf/PLAW-${congress}publ${id}.pdf`;
}
const usBank='https://www.fdic.gov/laws-and-regulations/chronology-selected-banking-laws';
const caLabour='https://www150.statcan.gc.ca/n1/pub/11-210-x/2010000/t085-eng.htm';
const caMonetary='https://www.bankofcanada.ca/2000/10/can-a-bank-change/';
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
 housing:['打算搬家、交首付或续贷的家庭，可以先重算每月住房支出。','房源、当地成交价与银行审批节奏都可能和全国消息不同。'],
 tax:['先把适用的税费和收入门槛列进预算，估算调整后的到手收入或购物支出。','家庭实际多付或少付多少，取决于收入结构和适用条件。'],
 pension:['有固定缴款的家庭可以重算到手工资，核对以后有多少收入能用于养老。','缴款规则怎么落实、退休时能领多少，要看年龄与实际缴费记录。'],
 climate:['能源和交通成本是家庭预算里可能受影响的部分。','措施会如何落地、费用由谁承担，当时仍不确定。']
};
const localEdits={
 JP:{
  1978:['日本与中国缔结和平友好条约','两国在 8 月签署，10 月交换批准书。','trade','https://www.mofa.go.jp/region/asia-paci/china/treaty78.html','涉及对华贸易的企业可能获得新订单，家庭仍可以先按已有工资做预算。'],
  1979:['第二次石油冲击推高日本的能源开支','国际供应冲击使依赖进口石油的日本面对能源价格上涨。','prices','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf','通勤和取暖费用可以先留出余量。'],
  1980:['日本实施新的外汇交易规定','修订后的外汇管理制度开始实施，外汇交易原则由限制转向自由，仍有例外。','currency','https://www.boj.or.jp/about/outline/history/his_1950.htm','有海外汇款或外币资产的家庭，可以核对手续成本和汇率。'],
  1981:['日本限制对美国的小汽车出口','5 月，日本宣布限制对美国出口的乘用车数量。','trade','https://www.usitc.gov/publications/332/pub1712.pdf','汽车制造业雇员可以关注订单、工时和年终奖金。'],
  1982:['东北新干线首段通车','6 月，大宫至盛冈区间开业，连接关东与日本东北地区。','work','https://www.jreast.co.jp/investor/factsheet/pdf/factsheet03.pdf','家庭可以按实际班次和票价重算探亲、异地工作和出行费用。'],
  1983:['东京迪士尼乐园开园','4 月，东京迪士尼乐园在千叶县浦安开园。','work','https://www.olc.co.jp/en/company/history/history03.html','周边家庭可能看到新的服务业岗位，也可以重算一家人出游的花费。'],
  1984:['日本通过电信民营化相关立法','国会制定日本电信电话株式会社相关法律，为次年改组电信业务提供依据。','transition','https://laws.e-gov.go.jp/law/359AC0000000085','家庭可以留意电话等通信服务的价格、可选方案和安装费。'],
  1985:['日本参加广场协议','9 月，五国就汇率政策协调达成协议。','currency','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf'],
  1986:['日本修改公共养老金体系','当年公开实施基础年金制度，符合条件的被扶养配偶可纳入新的参保类别。','pension','https://www.mhlw.go.jp/stf/nenkin_shikumi_04.html','单收入家庭也可以核对配偶的参保记录和以后的养老金来源。'],
  1987:['日本公布紧急土地对策','政府通过应对地价高涨的紧急土地对策。','housing',japanLand,'正攒首付的家庭可以核对目标地区的价格和月供承受能力。'],
  1988:['日本公布综合土地对策','地价快速上涨之际，政府通过涉及供给、交易与税费安排的综合对策。','housing',japanLand,'买房家庭可以先按当时的贷款报价重算月供和交房前要动用的现金。','政策能否让住房市场降温，以及不同城市会怎样变化，当时还没有答案。'],
  1989:['日本银行开始收紧政策','5 月，日本银行将官方贴现率从 2.5% 提至 3.25%。','rate','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf','正在攒首付的家庭要留意新贷款报价，持有股票的家庭也可能感到波动。','利率上调会不会压住房价和股价、多久才见效，当时无法确定。'],
  1990:['日本股价从高位转弱','当年股票价格大幅下跌，期间仍有反弹。','markets','https://www.imes.boj.or.jp/research/papers/english/me19-s1-14.pdf'],
  1991:['日本公布新的综合土地政策纲要','政府在住房和地价问题受到关注时，提出新的土地政策框架。','housing',japanLand,'已有房贷的家庭可复核本金，准备买房的人可把出价和预算上限分开。'],
  1992:['地价下跌从大城市扩到地方','当年的地价公示显示，三大都市圈此前已转跌，地方圈的住宅地和商业地也转为下跌。','markets',japanLand,'准备买房的家庭可以重算首付。已有住房的家庭则要把房价和仍欠的本金分开看。','当地成交价还会跌多久、自己的工作是否稳定，都要等接下来的消息。'],
  1993:['家庭消费继续走弱','2 月，日本银行对外说明，企业设备投资放缓，居民消费也进一步走弱。央行当日再次下调贴现率。','work',japanNineties,'零售和制造业家庭可以先估算加班和奖金减少时，工资能不能覆盖房租和日常账单。','需求何时回升，以及收入的变化会不会扩散到自己所在的行业，当时仍难判断。'],
  1994:['日本修改养老金领取安排','当年改革安排分阶段提高厚生年金定额部分的起领年龄。','pension','https://www.mhlw.go.jp/shingi/2002/04/s0419-3d.html','临近退休的家庭可以按出生年份估算，工资停下来后有多长时间要靠储蓄。'],
  1995:['阪神淡路大地震','1 月 17 日，地震重创神户及周边地区。','health','https://www.bousai.go.jp/kyoiku/kyokun/hanshin_awaji/index.html'],
  1996:['日本银行参与处理阪和银行问题','12 月，日本银行就接收阪和银行业务的机构资本安排发表意见。','banking','https://www2.boj.or.jp/archive/en/announcements/release_1997/giji96.htm'],
  1997:['日本多家金融机构陷入困境','包括三洋证券在内的金融机构在当年出现破产。','banking','https://www2.boj.or.jp/archive/en/announcements/press/koen_2001/ko0112a.htm'],
  1998:['日本长期信用银行被临时国有化','10 月 23 日，政府决定对日本长期信用银行实施临时国有化。日本银行说明，该行将继续营业，并正常履行存款等义务。','banking','https://www.boj.or.jp/en/about/press/danwa/dan9810a.htm','有定期存款或在申请房贷的家庭，可以分别核对资金能否动用、贷款是否已获批。','其他机构是否还会承压、新贷款审核会收紧到什么程度，当时尚不清楚。'],
  1999:['日本采用零利率政策','2 月，日本银行引导短期市场利率降至接近零。','rate',boj+'mpmdeci/mpr_1999/k990921a.htm'],
  2000:['日本启动长期照护保险','4 月，长期照护保险制度开始运行。','health','https://www.mhlw.go.jp/www1/english/wp_5/vol1/p2c2s1.html','照料父母的家庭可以核对保费、服务自付比例和家人减少工时的代价。'],
  2001:['日本银行转向量化宽松','3 月，操作目标从短期利率转向金融机构在央行的往来账户余额。','easing','https://www2.boj.or.jp/archive/en/announcements/press/koen_2002/ko0201a.htm'],
  2002:['日本扩大量化宽松','日本银行将往来账户余额目标提高到 15–20 万亿日元。','easing','https://www2.boj.or.jp/archive/en/announcements/press/koen_2002/ko0212c.htm'],
  2003:['日本邮政公社成立','4 月，日本邮政公社接手邮政、邮储和邮政保险业务。','welfare','https://www.japanpost.jp/en/corporate/changes/index.html','在邮局储蓄或买保险的家庭，可以确认以后由谁办理以及资金何时能取。'],
  2004:['日本修订养老金缴费与给付规则','新的养老金改革确定保费逐步调整等安排，也调整长期给付的计算机制。','pension','https://www.mhlw.go.jp/stf/nenkin_shikumi_05.html'],
  2005:['日本通过邮政民营化相关法律','10 月公布的法律为之后拆分和改组邮政、储蓄与保险业务设定时间表。','welfare','https://www.japanpost.jp/group/about/milestone/privatization/index03/','已使用邮储或邮政保险的家庭可以留意老合同如何承接。'],
  2006:['日本结束这一轮量化宽松','3 月，央行将操作目标切换回无担保隔夜拆借利率。','rate','https://www2.boj.or.jp/archive/en/announcements/press/koen_2006/ko0603a.htm'],
  2007:['邮政民营化，邮储与邮政保险改组','10 月 1 日，日本邮政民营化启动。邮储银行和邮政保险公司开始营业，民营化前的部分合同由专设机构承继。','welfare','https://www.japanpost.jp/group/about/milestone/privatization/index03/','用邮局存钱或买保险的家庭，可以核对旧合同由谁管理、存款什么时候能取。','新产品会怎样定价、服务会怎样调整，当年尚难判断。'],
  2008:['日本出口减少，就业与收入面临压力','日本银行 12 月的报告说，出口和工业生产下滑，企业利润继续减少，就业与收入形势趋紧。','work','https://www.boj.or.jp/en/mopo/gp_2008/gp0812.htm','制造业家庭可以算一笔账：如果少几个月工资或奖金，手边现金够不够付房租或房贷。','海外订单何时回升、哪些公司会减班或裁员，当时还没有答案。'],
  2009:['日本扩展企业融资支持','2 月，日本银行扩大面向企业融资的特别资金供应操作。','banking',boj+'mpmdeci/mpr_2009/un0902b.pdf'],
  2010:['日本启动全面货币宽松','10 月，日本银行公布全面货币宽松安排。','easing',boj+'outline/bpreview/ref.htm'],
  2011:['东日本大地震','3 月，日本发生大地震，央行随后提供流动性支持。','health','https://www.boj.or.jp/en/about/press/koen_2011/ko110421a.htm'],
  2012:['日本银行扩大支持增长的贷款工具','3 月，工具对应的可贷总额由 3.5 万亿日元增至 5.5 万亿日元。','easing',boj+'mpmdeci/mpr_2012/k120313a.pdf'],
  2013:['日本推出量化与质化宽松','4 月，日本银行推出新框架，承诺扩大货币基础和资产购买。','easing',qqe],
  2014:['日本把消费税率从 5% 提高至 8%','4 月实施的税率调整影响到多数零售商品和服务。','tax','https://www.mof.go.jp/english/policy/tax_policy/tax_system/consumption/index.html','先看家庭实际负担的应税开支，再调整每月预算。'],
  2015:['日本银行公布宽松补充措施','12 月，央行公布一组补充措施，包括调整所购国债的平均剩余期限。','easing',qqe],
  2016:['日本引入收益率曲线控制','9 月，日本银行引入短期政策利率与长期国债收益率相结合的框架。','rate',qqe],
  2017:['日本银行延续收益率曲线控制','年内继续以短期利率与长期国债收益率配合实施政策。','rate',qqe],
  2018:['跨太平洋贸易协定对日本等首批国家生效','12 月底，CPTPP 在日本等首批成员生效。','trade','https://www.mofa.go.jp/ecm/ep/page25e_000594.html','食品进口价格、制造业订单和工作机会可能通过不同渠道变化。'],
  2019:['日本把标准消费税率提高到 10%','10 月标准税率由 8% 提到 10%，食品等部分品类继续适用低税率。','tax','https://www.mof.go.jp/english/policy/tax_policy/tax_system/consumption/index.html','预算里可以单独算外食、电器等标准税率支出，再加上食品采购。'],
  2020:['日本银行加强企业融资支持','疫情期间，日本银行采用融资支持措施缓解企业资金压力。','health',boj+'outline/bpreview/ref.htm'],

 },
 US:{
  1978:['美国税法写入 401(k) 条款','《1978 年税收法》为符合条件的现金或递延安排增设规则。','pension',usLaw(95,600),'关注工作单位会不会提供工资递延储蓄，家里也要留下足够应付眼前账单的钱。','具体方案何时到工作单位、缴款怎么计算，当时仍待实施。'],
  1979:['美联储改变货币政策操作方式','10 月，准备金增长成为政策操作的新重点。','prices',fed+'great-inflation'],
  1980:['美国通过《货币控制法》','该法扩展了美联储对存款机构准备金要求的适用范围。','banking','https://www.federalreservehistory.org/topics/legislation'],
  1981:['美国通过分阶段减税法案','8 月签署的经济复苏税法安排分阶段下调个人所得税率。','tax',usLaw(97,34)],
  1982:['美国放宽储蓄机构经营限制','1982 年的《加恩—圣杰曼存款机构法》放宽了部分存款和贷款业务限制。','banking',fed+'garn-st-germain-act'],
  1983:['美国修订社会保障制度','4 月签署的修正案改变了社会保障的筹资与待遇安排。','welfare','https://www.ssa.gov/history/1983amend.html'],
  1984:['美国联邦存款保险机构援助大陆伊利诺伊银行','联邦存款保险公司在 1984 年公布对大陆伊利诺伊银行的长期援助安排。','banking','https://archive.fdic.gov/view/fdic/12156','存款较多的家庭可以核对联邦保障额度，准备借款的家庭也要关注审批。'],
  1985:['美国通过削减联邦赤字的预算约束法','12 月通过的平衡预算与紧急赤字控制法设下赤字目标与支出约束机制。','welfare',usLaw(99,177),'收入依赖公共合同或政府项目的家庭，可以估算工作和补助发生变化时的现金缓冲。'],
  1986:['美国通过税改法，重排税率与扣除','10 月签署的法律为随后年份重排税率档位，并改变可扣项目。','tax',usLaw(99,514),'即使工资不变，家庭也可以重算税后收入、贷款利息和各项可扣费用。'],
  1987:['华尔街遭遇黑色星期一','10 月股市重挫，美联储随后表态支持金融体系流动性。','markets',fed+'stock-market-crash-of-1987'],
  1988:['美国通过扩充老年医疗保障的法案','《医疗保险灾难性保障法》增加了部分老年医疗保障，也规定相应的筹资方式。','health',usLaw(100,360),'有老年成员的家庭需同时看计划覆盖的医疗费和要多付的保费。','条款当时仍在实施准备中，后续政策与费用不能预先算定。'],
  1989:['美国设立机构处理倒闭储贷机构','8 月通过的储贷改革法设立信托处置机构，处理符合条件的倒闭储贷机构。','banking',usBank,'在储贷机构存钱或有贷款的家庭，要核对保障额度、账户移交和还款方式。'],
  1990:['美国通过《残疾人法》','7 月签署的法律为就业、公共设施和服务等领域确立残疾人权利保障。','work',usLaw(101,336),'有残障成员的家庭可以关注通勤和就业便利，但先按现有收入和支出安排预算。'],
  1991:['美国修订存款保险与银行处置规则','新的联邦存款保险公司改进法要求监管机构对资本不足的金融机构及时采取措施。','banking',usBank],
  1992:['美国扩大可负担住房政策的覆盖','《1992 年住房和社区发展法》纳入对住房金融机构的可负担住房目标和监管要求。','housing',usLaw(102,550),'首付有限的家庭可能看到更多融资选项，仍需逐项核对资格、月供和费用。'],
  1993:['符合条件的员工可请无薪家庭照护假','《家庭与医疗休假法》规定符合条件的劳动者可为生育、照护或重大疾病请受岗位保护的无薪假。','work',usLaw(103,3),'岗位可以保留，收入却可能暂时停下来。先算家里能撑过几周无薪期。'],
  1994:['美国放宽跨州银行经营限制','9 月通过的法律为跨州银行收购和开设分支机构放宽联邦限制。','banking',usBank,'当地银行竞争可能改变贷款报价和服务，也要比较实际费用。'],
  1995:['联邦财政拨款中断，部分雇员停工','11 月出现一次联邦政府停摆，12 月再次发生拨款中断。','work','https://www.congress.gov/crs-product/RL34680','公共部门家庭和承包商要考虑工资或合同款晚到时，哪笔账最先付。'],
  1996:['美国改革现金福利体系','8 月签署的法律通过 TANF 等制度重组对低收入家庭的现金援助。','welfare',usLaw(104,193)],
  1997:['美国设立儿童健康保险计划','《平衡预算法》建立面向部分未获覆盖儿童的州儿童健康保险计划。','health',usLaw(105,33),'有孩子又缺乏雇主保险的家庭，可以重算保费、免赔额和看病要先垫付的钱。'],
  1998:['美国通过税务局改组和纳税人保护法','国会通过法案，调整税务局管理和纳税人的申诉、程序保障。','tax',usLaw(105,206),'有税单争议的家庭可以核对申诉和更正期限，继续预留可能要补的税。'],
  1999:['美国修改金融行业经营规则','11 月签署的金融服务现代化法放宽了银行、证券与保险公司的联合经营限制。','banking',fed+'gramm-leach-bliley-act'],
  2000:['纳斯达克从年内高位大幅回落','科技股集中度较高的纳斯达克综合指数在 3 月冲高，随后出现显著回落。','markets','https://fred.stlouisfed.org/series/NASDAQCOM','财富集中在科技股或雇主股票的家庭，可以核对资产和工资是否依赖同一家公司或行业。'],
  2001:['美国确认进入衰退','11 月，NBER 公布美国经济活动已在 3 月见顶。','work','https://www.nber.org/news/business-cycle-dating-committee-announcement-november-26-2001'],
  2002:['安然等事件后，美国加强上市公司财务监督','7 月签署的《萨班斯—奥克斯利法》引入新的审计监管和公司报告责任。','markets',usLaw(107,204),'用股票积累养老储备的家庭，可以进一步核对财务披露以及自己的持仓集中度。'],
  2003:['美国立法增设 Medicare 处方药保障','12 月通过的法案规定设立 Medicare Part D，处方药计划安排从 2006 年起提供。','health',usLaw(108,173),'有长期处方开支的家庭可以关注新计划，但下一年预算仍按现行合同和药价安排。'],
  2004:['美国延长多项面向家庭的税收减免','新法延长儿童税收抵免和部分婚姻税负调整等安排。','tax',usLaw(108,311)],
  2005:['美国修改个人破产申请规则','联邦破产新法主要规定在 10 月实施，其中加入对部分个人债务人的偿付能力审查。','banking',usLaw(109,8),'消费信贷逾期后，可选择的清偿方式可能改变。家庭可以先核对欠款利率与到期顺序。'],
  2006:['美国通过职业养老金保护法','8 月签署的法案调整部分雇主养老金筹资规则，也对退休储蓄计划自动加入作出规定。','pension',usLaw(109,280)],
  2007:['美国住房和金融市场压力加大','住房下行与部分抵押信贷损失开始给金融机构带来压力。','banking',fed+'great-recession-and-its-aftermath'],
  2008:['美国设立问题资产救助计划','10 月签署紧急经济稳定法，财政部获授权实施问题资产救助计划。','banking',usLaw(110,343),'房贷、消费信贷和就业都可能同时吃紧，先盘点哪几个月必须有现金。'],
  2009:['美国推出经济复苏与再投资法','2 月签署的刺激法包括减税、就业支出以及对部分失业救济的支持。','work',usLaw(111,5),'已经失业或减班的家庭，可以核对新补助适用时间。工资恢复以前仍要排固定账单的优先次序。'],
  2010:['美国签署《平价医疗法》','3 月签署的医疗改革建立后续保险市场和补助框架，条款分期实施。','health',usLaw(111,148),'医疗保费、雇主保险和自付账单值得分开预算。'],
  2011:['美国消费者金融保护局启动工作','新机构在 7 月开始履行职责，覆盖房贷、信用卡等消费金融活动。','banking','https://www.consumerfinance.gov/about-us/the-bureau/bureau-structure/','普通家庭可以比较贷款的月供与总成本，遇到争议时了解正式申诉渠道。'],
  2012:['美国公布全国房贷和解协议','联邦和州政府公布与五家主要房贷服务机构的和解，包含部分借款人救济及新的服务标准。','housing','https://www.justice.gov/archives/opa/pr/federal-government-and-state-attorneys-general-reach-25-billion-agreement-five-largest-mortgage','遇到还款困难的家庭应先核对资格、欠款和批准前还要付多少。'],
  2013:['美联储宣布缩减购债','12 月，美联储公布次年起放慢每月购债的安排。','easing','https://www.federalreserve.gov/newsevents/pressreleases/monetary20131218a.htm'],
  2014:['美国医保市场计划开始提供保障','通过新的个人保险市场投保的保障可从 2014 年生效，符合条件的人可申请税收补助。','health',usLaw(111,148),'家庭可以比较保费、免赔额以及一年中可能需要自己承担多少看病费用。'],
  2015:['美联储启动危机后的首次加息','12 月，美联储把联邦基金利率目标区间提高至 0.25%–0.50%。','rate','https://www.federalreserve.gov/newsevents/pressreleases/monetary20151216a.htm','有浮息贷款或现金储蓄的家庭，可以比较报价何时调整。'],
  2016:['美国公布联邦承包商员工的带薪病假规则','劳动部发布适用于符合条件的新联邦合同的带薪病假最终规则。','work','https://www.federalregister.gov/documents/2016/09/30/2016-22946/establishing-paid-sick-leave-for-federal-contractors','家里有人为覆盖到的承包商工作时，可以核对因病缺勤还能保留多少薪酬。'],
  2017:['美国通过《减税与就业法》','12 月签署的税法调整个人所得税档、标准扣除额与部分抵免，多项主要变化从次年开始。','tax',usLaw(115,97)],
  2018:['美国宣布对部分中国商品加征关税','6 月，美国贸易代表办公室公布首批加征关税的产品清单及时间安排。','trade','https://ustr.gov/about-us/policy-offices/press-office/press-releases/2018/june/ustr-issues-tariffs-chinese-products','依赖进口投入的行业可能面临成本变化，家庭也可留意耐用品的报价和所在企业的订单。'],
  2019:['美国证券交易委员会为零售投资建议设立新规则','6 月通过的 Regulation Best Interest 对经纪商向个人客户推荐交易或策略设立义务。','markets','https://www.sec.gov/newsroom/press-releases/2019-89','购买投资产品前可以问清佣金、利益冲突和退出成本。','市场机构怎样执行、费用会怎样调整，当时还需要观察。'],
  2020:['美国为疫情中的家庭和企业推出紧急援助','3 月签署的 CARES 法包括经济影响付款、扩大失业保险和企业援助。','work',usLaw(116,136),'失业和临时补助可能先后到账，可以先保证房租、食品和医疗支出。']
 },
 GB:{
  1978:['英国出现大范围劳资纠纷','1978 年末，英国进入后来被称为“不满之冬”的罢工时期。','work','https://www.ons.gov.uk/economy/grossdomesticproductgdp/articles/gdpandeventsinhistoryhowthecovid19pandemicshockedtheukeconomy/2022-05-24'],
  1979:['英国标准增值税调至 15%','6 月预算把两档增值税合为 15% 的标准档。','tax',ukAct(1979,47),'先算受影响的耐用品和服务会占多少开支，食品等适用其他税率的品类另看。'],
  1980:['符合条件的公房租户获得购房权','《1980 年住房法》给符合条件的英格兰和威尔士公共住房租户以折扣购买所住房屋的权利。','housing',ukAct(1980,51),'想把长期房租换成月供的租户，还要留出首付、维修和交易费。'],
  1981:['衰退期间，英国预算继续收紧','3 月的预算没有随物价上调个人免税额，并提高了多项消费相关税费。','tax','https://api.parliament.uk/historic-hansard/commons/1981/mar/10/budget-statement'],
  1982:['英国调整工会与劳资纠纷规则','《1982 年就业法》改变部分工会活动的法律责任以及封闭用工安排。','work',ukAct(1982,46),'依赖集体协商工资、加班或补偿的家庭，可以把固定还款和可能变化的劳动收入分开看。'],
  1983:['统一住房补助制度开始运行','英国在 1983 年推进统一住房补助，整合原有房租、地方税费补助及部分相关支援。','housing',ukAct(1982,24),'依赖补助缴租的家庭需要核对新制度怎样计算自己实际负担的住房开支。'],
  1984:['矿工罢工波及英国产煤地区','3 月起，关闭矿井计划引发罢工，多个煤矿地区长时间停工。','work','https://hansard.parliament.uk/commons/1984-12-19/debates/fcc75b3b-bf33-4a6e-b00f-4ba9b8a5afda/CommonsChamber','没有正常工资的月份，房租、食品和能源账单仍会到期。'],
  1985:['矿工罢工结束，矿区家庭开始恢复收入','持续约一年的英国矿工罢工在 3 月结束。面临关闭压力的矿区仍需面对工作的去向。','work','https://hansard.parliament.uk/Lords/1985-03-04/debates/cdefe920-2006-4359-94e6-2818c34d5ba9/TheMinersStrike','恢复领薪不等于立刻补回欠款，家庭得决定先补储备还是先还账。'],
  1986:['伦敦金融市场规则改革','10 月，伦敦证券交易制度经历被称为“大爆炸”的改革。','markets','https://www.gov.uk/hmrc-internal-manuals/stamp-taxes-shares-manual/stsm121020'],
  1987:['十月抛售重击伦敦股市','10 月国际股市急挫，英国股市也随之大幅下跌。','markets',fed+'stock-market-crash-of-1987','有近期首付或学费要付的家庭，可以检查有多少钱押在短期会波动的市场上。'],
  1988:['英国调整私人出租住房规则','《1988 年住房法》建立包括 assured tenancy 在内的新租赁框架。','housing',ukAct(1988,50),'下一份租约的租期、续租条件和价格，都会影响应留多少搬家费用。'],
  1989:['苏格兰以人头税替代住宅地方税','苏格兰先于英格兰和威尔士实施社区收费，由成年人个人承担。','tax','https://www.legislation.gov.uk/ukpga/1987/47/enacted','同住的成年人多时，家庭可以按每人分别计算地方税负。'],
  1990:['英格兰和威尔士开始征收社区收费','新制度以对个人征收的社区收费取代此前的住宅地方税，家庭付款规则随之变化。','tax',ukAct(1988,41)],
  1991:['英国把标准增值税提高至 17.5%','3 月预算宣布上调标准增值税，并拨款降低地方社区收费。','tax',ukAct(1991,31),'社区收费和购物支出同时变动，合住人口及日常采购不同的家庭会有不同结果。'],
  1992:['英国退出欧洲汇率机制','9 月 16 日，英国停止维持英镑在欧洲汇率机制中的汇率承诺。','currency','https://www.bankofengland.co.uk/about/history'],
  1993:['地方政府税取代社区收费','英国开始按住宅价值档位等规则征收 Council Tax。','housing',ukAct(1992,14),'家里每月要付多少，开始更明显地取决于住宅档位和地方账单。'],
  1994:['英国推出全国性彩票','首轮全国彩票抽奖在 11 月举行，购买彩票成为一项新开支。','welfare','https://researchbriefings.files.parliament.uk/documents/RP01-66/RP01-66.pdf','预算可以容纳一笔有上限的娱乐支出，中奖之类的收入只能等它真的到账。'],
  1995:['英国通过养老金法改革职业养老金','新法调整职业养老金的管理和保障规则，也安排分阶段提高女性领取国家养老金的年龄。','pension',ukAct(1995,26)],
  1996:['英国开始发放求职者津贴','10 月起，求职者津贴取代部分失业给付，领取与求职条件相连。','work',ukAct(1995,18),'失业后能领多少和何时领到，都可能少于原来的工资。先算最紧的几个月。'],
  1997:['英格兰银行获得利率决策权','政府将设定短期政策利率的职责交给英格兰银行。','rate','https://www.bankofengland.co.uk/about/history'],
  1998:['英国通过最低工资法','7 月获御准的法律设立全国最低工资制度。','work','https://www.legislation.gov.uk/ukpga/1998/39/body/enacted'],
  1999:['英国启用个人储蓄账户 ISA','4 月，个人储蓄账户上线，为符合条件的现金储蓄和投资提供税务优惠。','tax','https://www.legislation.gov.uk/uksi/1998/1870/contents/made','较长时间不用的钱可以比较税后回报，随时要用的钱仍要看动用条件。'],
  2000:['英国扩大冬季燃料补助','当年财政预算宣布提高冬季燃料补助，帮助符合条件的老年家庭支付取暖。','welfare','https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/265498/hc346.pdf','家里有高龄成员时，可以先核对实际到账时间再安排冬季能源预算。'],
  2001:['英国开售利益相关者养老金','新的低成本个人养老金在 2001 年推出，为没有合适职业养老金的人提供一种储蓄渠道。','pension',ukAct(1999,30)],
  2002:['英国通过税收抵免法','新法为次年实施的工作和儿童税收抵免提供立法依据。','tax',ukAct(2002,21),'有孩子或收入不稳定的家庭可以核对资格和申请时间。'],
  2003:['英国开始发放儿童及工作税收抵免','4 月起推出儿童税收抵免与工作税收抵免，金额与收入及家庭情况相关。','welfare',ukAct(2002,21),'有孩子或工时较低的家庭可以核对资格，将实际补贴与工资分开记。'],
  2004:['英国通过新住房法','新法引入住房健康安全评级，并建立合住出租住房的许可框架。','housing',ukAct(2004,34),'租户可以核对住房安全与维修责任，房东也需评估合规和维护支出。'],
  2005:['英国民事伴侣制度开始实施','12 月生效的制度让同性伴侣可以登记，并影响财产、继承及相关保障安排。','welfare',ukAct(2004,33),'登记伴侣可以重新核对保险受益人、继承安排和共担的家庭账单。'],
  2006:['英国把多套养老金税制合并','4 月起，注册养老金适用统一的税务框架，并受相应的缴费及积累限额约束。','pension','https://www.legislation.gov.uk/uksi/2006/572/contents/made'],
  2007:['北岩银行储户排队取款','9 月，北岩银行寻求紧急流动性支持，消息公开后引发储户排队。英国政府随后作出存款担保安排。','banking','https://publications.parliament.uk/pa/cm200708/cmselect/cmtreasy/56/56i.pdf','即使存款最终有保障，短期大额账单也需要能随时动用的资金。'],
  2008:['英国政府公布银行注资计划','10 月，财政部宣布向主要银行提供资本支持，以应对危机中的融资与信贷压力。','banking','https://www.bankofengland.co.uk/news/2008/october/recapitalisation-of-the-uk-banking-system','准备换房的家庭，可以在交出定金前先确认贷款审批和每期还款。'],
  2009:['英国启用资产购买工具','英格兰银行在 3 月启动这一轮资产购买。','easing','https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/2012/quarterly-bulletin-2012-q4.pdf'],
  2010:['英国紧急预算宣布调高增值税','6 月发布的预算安排从次年 1 月起把标准增值税从 17.5% 调到 20%。','tax',ukAct(2010,31),'年底可以检查哪些计划购买的耐用品适用标准档，避免把所有日用品都算进涨价。'],
  2011:['英国 20% 标准增值税开始适用','1 月 4 日起，新标准税率开始适用。','prices',ukAct(2010,31),'家电、交通工具等应税品的报价和商家折扣，可能一起改变家庭采购费用。'],
  2012:['英国开始让符合条件的员工自动加入职场养老金','10 月起，最大的雇主首先进入自动加入安排，其他雇主分阶段跟进。','pension','https://assets.publishing.service.gov.uk/media/5a7d8ef2ed915d497af70296/rr887-automatic-enrolment-evaluation-2014.pdf'],
  2013:['英国推出 Help to Buy 购房计划','财政预算公布股权贷款与抵押贷款担保安排，部分措施当年启动。','housing','https://www.gov.uk/government/publications/budget-2013-documents','符合条件的购房者可以比较所需首付，以及支持期限过后仍要承担的还款。'],
  2014:['英国预算宣布给退休人员更多提取养老金的选择','政府公布改革安排，拟扩大符合条件人士从缴费型养老金提取资金的灵活性。','pension','https://www.gov.uk/government/publications/budget-2014-documents','临近退休的家庭可以对比一次提取的税负和以后每月的收入。'],
  2015:['英国启用养老金提取新规则','4 月起，符合条件的人可以更灵活地从缴费型养老金中提取资产。','pension','https://www.gov.uk/government/publications/pension-freedoms-a-qualitative-research-study-of-individuals-decumulation-journeys'],
  2016:['英国公投支持退出欧盟','6 月的公投结果支持退出欧盟。','transition','https://www.gov.uk/government/topical-events/eu-referendum'],
  2017:['英国正式通知欧盟启动退出程序','3 月 29 日，英国提交启动《里斯本条约》第 50 条程序的通知。','trade','https://www.gov.uk/government/publications/prime-ministers-letter-to-donald-tusk-triggering-article-50','依赖欧洲市场的工作、外币支出和进口商品价格都值得单独估算。'],
  2018:['英国通过家庭能源默认资费上限法','新法要求监管机构制定适用于部分家用电气默认资费的上限。','climate',ukAct(2018,21),'用默认资费的家庭可以把实际用量和费率分开算，预留冬季用量上行的空间。'],
  2019:['英格兰限制租赁收费和押金','《租客收费法》开始对英格兰的新租赁限制部分收费，并设定押金上限。','housing',ukAct(2019,4),'换租之前，可以把押金、首月租金和仍允许收取的款项分别计算。'],
  2020:['英国推出停工留职工资支持','3 月公布的计划为符合条件、暂不能上班的员工支付部分工资。','work','https://www.gov.uk/government/news/chancellor-announces-workers-support-package','工资本来就紧的家庭，可以先算补贴和原工资之间的缺口，再安排房租和其他固定支出。']
 },
 CA:{
  1978:['加拿大新移民法生效','新制度将难民列为独立的移民类别，并允许私人担保。','welfare','https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/about-refugee-system/how-system-works/timeline.html'],
  1979:['能源涨价给加拿大物价带来压力','国际石油供应受冲击，加拿大也面对能源成本和物价上行。','prices',caMonetary,'跑长途通勤和依赖燃油取暖的家庭，可以先为油费上浮留一笔空间。'],
  1980:['加拿大公布新的能源政策','10 月，联邦政府公布国家能源计划，涉及国内油价和能源收入的分配。','climate','https://publications.aws.tpsgc-pwgsc.cloud-nuage.canada.ca/site/eng/9.830492/publication.html?wbdisable=false','能源行业家庭同时要看油费和所在地区的工作是否稳定。'],
  1981:['加拿大高利率推高按揭压力','加拿大央行在通胀高企时收紧，利率达到异常高位。','housing','https://www.bankofcanada.ca/wp-content/uploads/2023/11/remarks-2023-11-22.pdf','即将续期的家庭可以按更高利率做一次月供预算。'],
  1982:['加拿大确立权利与自由宪章','1982 年《宪法法令》将权利与自由宪章纳入宪法。','welfare','https://www.canada.ca/en/intergovernmental-affairs/services/provinces-territories.html'],
  1983:['加拿大失业率在复苏初期仍处高位','劳动调查显示，求职市场仍然紧张，青年失业压力尤其明显。','work','https://www66.statcan.gc.ca/eng/1988/198801760168_p.%205-22.pdf','家里有人刚毕业或已经离岗时，可以先留出几个月住房和伙食开支。'],
  1984:['加拿大就业改善，求职压力仍高','就业市场较上年回暖，调查中失业率回落，但仍处于高位。','work',caLabour,'在工资恢复前，可以先把买车或换房的钱与日常开支分开。'],
  1985:['加拿大预算宣布终身资本利得免税安排','联邦预算提出分阶段引入个人终身资本利得免税安排。','tax','https://www.budget.canada.ca/archives/1985-pap-eng.pdf','计划出售生意或投资资产的人要区分账面升值、实际变现和适用的免税资格。'],
  1986:['加拿大求职市场继续改善','失业率较此前高位回落，青年与成年劳动者的就业压力仍有明显区别。','work','https://www66.statcan.gc.ca/eng/1988/198801760168_p.%205-22.pdf','家庭收入回升后，可以先补前几年用掉的储备。'],
  1987:['加拿大公布税制改革白皮书','政府提出调整个人所得税档及扣除、抵免结构。','tax','https://www.publications.gc.ca/site/eng/9.828954/publication.html','即使工资不变，到手收入也可能变动。'],
  1988:['加拿大与美国签署自由贸易协定','1 月 2 日，加美双方签署协定，定于次年开始实施。','trade','https://www.reaganlibrary.gov/archives/speech/statement-united-states-canada-free-trade-agreement','有跨境订单、依赖进口货物，或在相关行业工作的一家人，可以留意下一年的售价和工时。'],
  1989:['加美自由贸易协定生效','1 月 1 日，加美自由贸易协定开始实施。','trade',canadaTrade],
  1990:['加拿大通过商品和服务税立法','联邦立法为次年开始征收商品和服务税作准备，税基覆盖许多日常商品和服务。','tax',gst,'可以先列出哪些日常支出受新税影响，再重算购物预算。'],
  1991:['加拿大建立通胀目标','加拿大银行与联邦政府公布通胀控制目标。','prices','https://www.bankofcanada.ca/core-functions/monetary-policy/agreement-inflation-control-target/'],
  1992:['加拿大参与北美自由贸易协定谈判与签署','加拿大、美国与墨西哥完成三边谈判，于 10 月举行草签仪式，并在 12 月正式签署。','trade','https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/history-multilateral-historique-multilateraux.aspx?lang=eng','在出口企业或制造业工作的家庭，可留意企业收到的新订单和进口竞争。','三国还要履行各自程序，行业与工资如何变化也有待观察。'],
  1993:['加拿大儿童税收福利开始实施','1 月，新制度替代原有的儿童税收抵免及家庭津贴。','welfare',taxFamily],
  1994:['北美自由贸易协定生效','包含加拿大、美国、墨西哥的协定取代此前的加美协定。','trade','https://www.canada.ca/en/news/archive/2014/01/january-1-marks-20th-anniversary-north-american-free-trade-agreement.html'],
  1995:['加拿大预算重组联邦社会转移支付','联邦预算提出把用于社会服务等项目的若干转移支付安排合并，从下一财政年度实施。','welfare','https://budget.canada.ca/archives/budget95/binb/budget1995-eng.pdf','依赖公共医疗、教育或社会支援的家庭，可以留意省级项目口径与自付费用。'],
  1996:['加拿大通过就业保险改革','新制度将部分资格与工作小时相联系，改变失业给付的适用规则。','work','https://www.budget.canada.ca/archives/budget96/bp/bp96e.pdf','做季节性工作或工时不满的家庭，应核对能否领到以及能领多久。'],
  1997:['加拿大调整公共养老金筹资','联邦和参与省份推进养老金改革，安排分阶段提高缴费并调整资产管理。','pension','https://www.canada.ca/content/dam/esdc-edsc/images/programs/pensions/reports/50_infgrfc_e.pdf'],
  1998:['加拿大实施新儿童福利','加拿大儿童税收福利和全国儿童福利补充款在当年推出。','welfare',taxFamily],
  1999:['加拿大预算安排提高儿童福利补充额','联邦预算提高全国儿童福利补充额，主要面向符合收入条件的家庭。','welfare',taxFamily,'养育成本是每月支出，补助要按孩子人数、收入和到账日期算。'],
  2000:['加拿大公布多年的联邦减税方案','政府公布五年减税计划，对个人所得税税率、门槛和部分家庭税惠作出安排。','tax','https://www.budget.canada.ca/archives/budget00/pdf/bpe.pdf'],
  2001:['加拿大延长的育儿福利进入首个实施年','扩大后的父母福利适用于 2000 年末起符合条件的家庭。','work','https://www150.statcan.gc.ca/n1/pub/75-001-x/10403/6490-eng.html','育儿期间能多领一段时间的福利，实际金额仍可能低于正常工资。'],
  2002:['加拿大开始收取航空旅客安全费','4 月 1 日起，航空旅客安全费正式征收。','tax','https://laws-lois.justice.gc.ca/eng/acts/A-10.5/','常坐飞机探亲和通勤的家庭，可以按实际航班把新增费用记进交通账。'],
  2003:['加拿大推出儿童残障福利','联邦新设面向符合条件家庭的儿童残障福利。','welfare',taxFamily],
  2004:['加拿大公布面向低收入家庭的学习债券','联邦为符合条件的孩子推出教育储蓄支持。','welfare','https://www.canada.ca/en/services/benefits/education/education-savings/learning-bond.html','可以把教育账户补助与家庭要自己攒的钱分开算。'],
  2005:['加拿大开始向地方分配汽油税资金','联邦将部分汽油税财政资金用于地方公共交通等基础设施。','climate','https://housing-infrastructure.canada.ca/communities-collectivites/ccbf-fdcc/index-eng.html','各地项目可能影响通勤成本和居住选择，具体要等当地规划。'],
  2006:['加拿大调低商品和服务税','7 月 1 日，商品和服务税由 7% 降至 6%。','prices',gst,'常买的应税商品可能变便宜，可以重估实际生活开支。','商家是否同步改价，以及每个家庭的购物篮能省多少，当时仍有差别。'],
  2007:['加拿大公布儿童税收抵免','2007 年联邦预算宣布新增儿童税收抵免。','welfare','https://www.canada.ca/content/dam/esdc-edsc/documents/programs/child-benefit/papers/progress-report-2008/ncb-progress-report-2008.pdf'],
  2008:['加拿大商品和服务税再次下降','1 月 1 日，税率由 6% 降至 5%。','prices',gst],
  2009:['加拿大为合资格的家庭装修推出临时税惠','联邦经济行动计划提出住宅装修税收抵免，适用项目、时间和开支范围受到限制。','housing','https://www.budget.canada.ca/2009/pamphlet-depliant/pamphlet-depliant2-eng.html','若今年打算维修，先算当下要付多少，报税时能抵多少。'],
  2010:['安大略和不列颠哥伦比亚开始实行合并销售税','7 月，两省把联邦商品和服务税与省销售税合并为 HST。','tax',gst,'应税服务、日用品与住房费用规则不同，可以逐项核算。'],
  2011:['加拿大预算宣布家庭照护者税收抵免','联邦预算提出增设照护者税收抵免，适用规则与被照护成员和资格有关。','welfare','https://www.budget.canada.ca/2011/plan/chap4b-eng.html','照料家人时，少上的工时和要自付的照护费可以分别记账。'],
  2012:['加拿大收紧部分政府担保按揭规定','联邦公布新规，把部分政府担保按揭的最高摊还期从 30 年缩短至 25 年。','housing','https://www.canada.ca/en/department-finance/news/2012/06/harper-government-takes-further-action-strengthen-canadas-housing-market.html','相同金额的贷款还得更快，每月付款可能更高。'],
  2013:['加拿大预算提出由政府和雇主分担技能培训成本','2013 年预算公布 Canada Job Grant 方案，目的是支持雇主参与培训。','work','https://www.budget.canada.ca/2013/doc/plan/chap3-1-eng.html','计划转行的家庭可以区分培训费和少上班造成的收入缺口。'],
  2014:['加拿大公布家庭减税与儿童福利方案','联邦宣布扩大家庭儿童福利，并对符合条件的家庭推出税负调整安排。','tax',taxFamily],
  2015:['加拿大扩大普惠儿童照顾福利','新安排提高六岁以下儿童的福利，并把覆盖范围扩至部分年龄更大的儿童。','welfare',taxFamily],
  2016:['加拿大续签通胀目标协议','10 月，政府与央行续签协议，继续把 2% 作为通胀目标。','prices',boc+'2016/10/renewal-of-the-inflation-control-target-2016/'],
  2017:['加拿大提前为儿童福利作通胀调整','秋季经济声明宣布把福利金额及门槛的调节提前到 2018–19 福利年度。','welfare',taxFamily],
  2018:['加拿大扩大按揭压力测试覆盖','1 月起，监管机构的房贷指引把最低资格利率测试扩大到受监管机构的无保险房贷。','housing','https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/final-revised-guideline-b-20-residential-mortgage-underwriting-practices-procedures','即使实际房贷报价较低，能获批的贷款也可能比先前估计少。'],
  2019:['加拿大启动首次购房者激励计划','联邦以共享权益形式，为符合条件的首次购房者分担一部分融资。','housing','https://budget.canada.ca/2019/docs/plan/chap-01-en.html','可以比较月供减少多少，以及卖房或到期时如何清偿这笔资金。'],
  2020:['加拿大、美国、墨西哥协定生效','7 月，新协定替代北美自由贸易协定。','trade','https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/index.aspx?lang=eng']
 }
};
const alternate={
 1979:['第二次石油冲击','伊朗革命引发全球石油供应担忧，能源价格上升。','prices',fed+'great-inflation'],
 1980:['欧洲经济共同体为希腊加入作准备','希腊此前签署加入条约，预定于次年 1 月成为成员国。','trade','https://www.consilium.europa.eu/en/history/'],
 1981:['希腊成为欧洲共同体成员','1 月，希腊正式成为欧洲共同体成员。','trade','https://www.consilium.europa.eu/en/history/'],
 1983:['国际债务压力延续','拉美债务危机后的国际融资压力仍在。','banking','https://www.elibrary.imf.org/display/book/9781498306836/ch01.xml'],
 1985:['欧洲签署申根协定','6 月，五个欧洲国家签署协定，着手逐步减少共同边境检查。','trade','https://www.consilium.europa.eu/en/policies/schengen-area/'],
 1986:['葡萄牙和西班牙加入欧洲共同体','两国于 1 月成为成员。','trade','https://www.consilium.europa.eu/en/history/'],
 1987:['全球市场承受十月抛售','股市冲击扩散到美国以外的市场。','markets',fed+'stock-market-crash-of-1987'],
 1989:['柏林墙开放','11 月，东德宣布开放边境。','transition',berlin,'有欧洲股票或外币存款的家庭，可以留意市场对跨境贸易和投资的反应。','当时还不清楚德国会怎样走向统一，欧洲市场也可能有不同反应。'],
 1990:['德国统一','东西德于 10 月完成统一。','transition','https://history.state.gov/countries/german-democratic-republic'],
 1991:['苏联解体','12 月，苏联解体。','transition','https://history.state.gov/departmenthistory/short-history/berlinwall'],
 1992:['欧洲各国签署马斯特里赫特条约','条约为欧洲联盟与未来单一货币提供制度框架。','currency',europe],
 2000:['欧洲理事会在里斯本提出就业和增长目标','3 月的会议提出扩大就业、推进知识经济与创新等目标。','work','https://www.europarl.europa.eu/summits/lis1_en.htm'],
 2006:['欧洲央行继续加息','欧洲央行在当年多次上调主要再融资利率。','rate','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'],
 2007:['全球银行间资金压力上升','美国住房信贷问题开始影响其他市场的融资。','banking',fed+'great-recession-and-its-aftermath'],
 2008:['二十国集团召开华盛顿峰会','11 月，各方讨论应对金融危机与金融监管改革。','banking','https://georgewbush-whitehouse.archives.gov/news/releases/2008/11/20081115-1.html'],
 2011:['欧洲央行重启部分证券市场操作','主权债务压力下，欧洲央行在 8 月积极实施证券市场计划。','banking','https://www.ecb.europa.eu/press/pr/date/2011/html/pr110807.en.html'],
 2013:['克罗地亚加入欧盟','7 月，克罗地亚成为欧盟成员国。','trade','https://www.consilium.europa.eu/en/history/'],
 2014:['欧洲央行存款便利利率转负','6 月，欧洲央行下调存款便利利率至负值。','rate','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html'],
 2016:['巴黎协定生效','11 月，关于气候变化的巴黎协定生效。','climate','https://unfccc.int/process/the-paris-agreement/the-paris-agreement'],
 2017:['欧盟与加拿大协定开始临时适用','9 月，欧盟与加拿大达成的经贸协定开始临时适用。','trade','https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/countries-and-regions/canada/eu-canada-agreement_en'],
 2018:['跨太平洋贸易协定在首批成员生效','12 月 30 日，CPTPP 开始在首批完成手续的经济体生效。','trade','https://www.mfat.govt.nz/en/trade/free-trade-agreements/free-trade-agreements-in-force/cptpp'],
 2020:['世界卫生组织将新冠疫情定性为大流行','3 月 11 日，世界卫生组织公开作出这一判断。','health','https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020']
};
const globalTags=['trade','prices','work','work','banking','welfare','transition','currency','markets','markets','banking','rate','markets','prices','currency','transition','trade','trade','trade','currency','banking','currency','markets','trade','currency','health','trade','climate','rate','banking','banking','transition','rate','health','banking','rate','easing','currency','transition','rate','trade','rate','health'];
const overlaps={JP:new Set([1985,1989,1990,2006,2011,2014]),US:new Set([1979,1980,1981,1983,1987,2000,2007,2008,2013,2017,2018,2020]),GB:new Set([1986,1992,2016]),CA:new Set([1991])};
const names={JP:'日本',US:'美国',GB:'英国',CA:'加拿大'};
const fmt=n=>Number(n.toFixed(4)).toString();
function card(year,raw,kind){
 const [title,text,topic,source,customImpact,customUncertainty]=raw;
 const [impact,uncertainty]=[customImpact||topics[topic][0],customUncertainty||topics[topic][1]];
 return {year,title,text,impact,uncertainty,source,kind};
}
function rateStory(country,[date,before,after]){
 const rising=after>before, [year,month,day]=date.split('-').map(Number);
 const direction=rising?'上行':'下行';
 const rate=country==='CA'&&year<1996?'银行利率参考值':'政策利率参考值';
 const label=rising?'新借款的压力可能上升，手上有浮息债务的家庭可以核对还款预算。':'借贷报价可能下降，靠利息收入的家庭也要留意可用收入。';
 const question=rising?'较高利率会持续多久，以及存款利率何时跟上，当时仍不确定。':'银行是否会把降息传给借款人、贷款能否批下来，当时仍不确定。';
 return [names[country]+rate+direction+' · '+month+' 月 '+day+' 日',
  'BIS 日度记录从 '+fmt(before)+'% 变为 '+fmt(after)+'%。日期为序列观测日。','rate',bis.replace('/M.','/D.')+country,label,question];
}
function pick(country,year){
 if(!Object.hasOwn(localEdits,country)||!Number.isInteger(year)||year<1978||year>2020)throw Error('简报年份或国家无效');
 const local=localEdits[country][year];
 const change=E[country]?.[year];
 if(!local)throw Error('该年缺少本地史事');
 const policy=change?rateStory(country,change):null;
 const h=H.briefing(year)[0];
 const knownText={
  1980:'美国当年经历了经济活动收缩。到年底，持续多长时间仍无法确定。',
  1981:'美国当年工业生产和就业受到压力，经济活动转弱。'
 };
 const globalSource=h.source.includes('/external/about/timeline/')?'https://www.elibrary.imf.org/display/book/9781498306836/ch01.xml':h.source;
 const global=overlaps[country].has(year)?alternate[year]:[year===1981?'美国经济活动转弱':year===1980?'美国经济活动收缩':h.title,knownText[year]||h.text,globalTags[year-1978],globalSource];
 return {local:card(year,local,'史事'),global:card(year,global,'史事'),
  policy:policy?card(year,policy,'政策变动记录'):null};
}
const api={pick};
if(node)module.exports=api;else root.AnnualBriefings=api;
})(globalThis);
