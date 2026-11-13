(function(root){'use strict';
const history=[
 {country:'US',year:1979,title:'货币政策转向抑制通胀',text:'1979 年 10 月，美联储宣布改变货币政策操作方式，将抑制通胀放在重要位置。',lesson:'物价变化会影响同一笔钱能买到什么；现金金额稳定，也要关注购买力。',source:'https://www.federalreservehistory.org/essays/great-inflation'},
 {country:'JP',year:1989,title:'日本开始收紧货币政策',text:'日本银行于 1989 年 5 月开始收紧货币政策。',lesson:'政策与价格变化并不总是同步。已发生的消息不等于下一年的价格答案。',source:'https://www2.boj.or.jp/archive/en/announcements/press/koen_2000/ko0005a.htm'},
 {country:'JP',year:1990,title:'股价上涨的惯性被打断',text:'日本银行在 1989 年 5 月至 1990 年 8 月之间五次提高贴现率；股票价格从 1990 年初开始下行。',lesson:'家庭支出不会等市场恢复。流动性安排会影响你是否需要在下跌时卖出。',source:'https://www2.boj.or.jp/archive/en/announcements/press/koen_2000/ko0005a.htm'},
 {country:'JP',year:1991,title:'不同资产，有不同的时钟',text:'日本土地价格从 1991 年开始下行，晚于股票价格转跌。',lesson:'看到一种资产的走势，不能推断所有资产都会同涨同跌。本版没有模拟房价。',source:'https://www2.boj.or.jp/archive/en/announcements/press/koen_2000/ko0005a.htm'},
 {country:'CA',year:1991,title:'加拿大建立通胀目标框架',text:'1991 年，加拿大银行与联邦财政部长就通胀控制目标框架达成一致。',lesson:'这是一项政策框架，不是未来每年物价都固定不变的保证。',source:'https://www.bankofcanada.ca/core-functions/monetary-policy/agreement-inflation-control-target/'},
 {country:'GB',year:1992,title:'英国退出欧洲汇率机制',text:'1992 年 9 月 16 日，英国退出欧洲汇率机制。',lesson:'跨国资产的本币结果还受到汇率影响。分散持仓与消除风险并不是一回事。',source:'https://www.bankofengland.co.uk/about/history'},
 {country:'all',year:2008,title:'金融危机中的资产与家庭',text:'美国在 2007 年至 2009 年经历深度衰退。金融危机成为这一时期的重要背景。',lesson:'本游戏的失业和账单是独立虚构事件，并非由这条新闻机械触发。市场风险与家庭资金需求仍需一起考虑。',source:'https://www.federalreservehistory.org/essays/great-recession-and-its-aftermath'}
];
if(typeof module!=='undefined'&&module.exports)module.exports=history;else root.WorldHistory=history;
})(globalThis);
