(function(root){'use strict';
const extra=[
 {kind:'care',image:'care',title:'父母也需要你搭把手',story:'电话里说“没什么大事”，到了家才发现，买菜、复诊和收拾屋子都需要人。你得重新安排这一段时间。',choices:[{title:'请人协助，自己继续工作',text:'支出1.5个月基础预算，工资不变。',cost:1.5,mood:2},{title:'减少工作，亲自照料',text:'本年获得正常收入的90%，不另付照料费。',incomeFactor:.9,mood:6}]},
 {kind:'bonus',image:'family',title:'奖金通知的那个下午',story:'年度奖金通知来了。群里有人准备换车，你看了看家里的账本，也想让这笔钱有个合适的去处。',choices:[{title:'先放进家庭储备',text:'本年额外收入3个月基础预算。',extra:3,mood:2},{title:'一半储备，一半家庭旅行',text:'额外收入3个月预算，旅行支出1.5个月。',extra:3,cost:1.5,mood:9}]},
 {kind:'freelance',image:'learning',title:'老朋友带来一个小项目',story:'“不用辞职，周末做完就行。”朋友的语气很轻松，你的日历却已经有点满。时间和收入都得算一算。',choices:[{title:'接下项目，腾出几个周末',text:'先花0.4个月预算准备，本年多收入2个月预算。',cost:.4,extra:2,mood:-3},{title:'留住周末，陪伴家人',text:'没有额外收入或支出。',mood:5}]},
 {kind:'repair',image:'repair',title:'家里的机器也有退休计划',story:'洗衣机响了一整晚，邻居开玩笑说它在“努力工作”。维修师傅给出了两种方案。',choices:[{title:'系统检修，少留隐患',text:'支出0.8个月预算；当年起五年维修意外减半。',cost:.8,set:{maintenance:true},mood:2},{title:'先处理眼前故障',text:'支出0.2个月预算，不增加后续维修保障。',cost:.2}]},
 {kind:'move',image:'moving',title:'工作地点换了，住哪里呢',story:'新通勤路线要多绕一大圈。搬家需要钱，留下来则需要更早的闹钟。你把两个方案写在纸上。',choices:[{title:'搬近一点，适应新节奏',text:'支出0.6个月预算，本年因搬迁获得正常收入的95%。',cost:.6,incomeFactor:.95,mood:6},{title:'暂时不搬，继续通勤',text:'收入和固定开支不变。',mood:-3}]}
];
const gallery=[
 ['family','一张餐桌，一本家账','工资、生活费、保障和储备，都从日常安排开始。'],
 ['learning','夜校的灯还亮着','学习占用现在的资金，收入加成从下一年生效。'],
 ['career','新工作的邀请','换工作要付准备费用，加薪从下一年进入账本。'],
 ['layoff','纸箱装不下的计划','失业会减少本年收入；现金储备给家庭留出时间。'],
 ['inheritance','父母留下的一份托付','遗产先进入现金；支持亲人也是一笔明确支出。'],
 ['baby','新的家庭成员','一次性的准备费用之后，还有持续的养育开支。'],
 ['moving','换一扇窗，也换一张预算','搬迁成本与以后的固定开销，需要分别考虑。'],
 ['care','把时间留给父母','付钱请人协助，或减少工作时间，都会改变本年账本。'],
 ['repair','机器的退休计划','维修支出和未来保障是两件事。'],
 ['quiet','一起面对账单','收支缺口、未付账单、净资产，要分别看清。'],
 ['history-oil','物价与能源','历史主题插画：物价压力下的日常生活，不是新闻照片。'],
 ['history-bubble','热闹的交易大厅','历史主题插画：日本泡沫年代的市场情绪，不代表未来涨跌。'],
 ['history-internet','拨号上网的年代','历史主题插画：互联网改变生活，技术前景不等于投资收益。'],
 ['history-crisis','危机中的金融街','历史主题插画：金融压力传到家庭，现金和负债要一起看。'],
 ['history-pandemic','屏幕两端的生活','历史主题插画：公共卫生事件改变工作与日常开支。']
].map(([image,title,text])=>({image,title,text}));
function random(index){return structuredClone(extra[index%extra.length]);}
function imageFor(s,ch){if(ch.kind!=='life')return ch.image;return [0,6,12,18,26].includes(s.turn)?'learning':s.turn===5&&s.flags.partner?'baby':[4,21].includes(s.turn)?'moving':s.turn===15?'repair':s.turn>=20?'care':s.flags.child?'family':'quiet';}
function historyImage(year){if([1989,1990].includes(year))return'history-bubble';if([1979,1980,1981].includes(year))return'history-oil';if([1996,2000,2001].includes(year))return'history-internet';if([1997,1998,2006,2007,2008,2009,2010].includes(year))return'history-crisis';if([2020].includes(year))return'history-pandemic';return null;}
function mood(year,local){if(year===1989)return'朋友说：“大家都在谈房子和股票，连午饭都快成投资沙龙了。”';if(year===2000)return'同事打趣：“公司名字里带个网，听起来都像未来。”';if(year===2008)return'饭桌上的热词从“收益多少”变成了“工作还稳吗”。';if(year===2020)return'通勤变成从卧室走到餐桌，家里的预算也得重算。';return local>.2?'朋友笑道：“这是我成年以来最好的夏天，仿佛人人都是股神。”':local<-.15?'群聊忽然安静了，大家开始认真讨论“还留了多少现金”。':'老同事提醒：“市场每天都有故事，账单到了还是得付。”';}
const api={extra,gallery,random,imageFor,historyImage,mood};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FamilyStories=api;
})(globalThis);
