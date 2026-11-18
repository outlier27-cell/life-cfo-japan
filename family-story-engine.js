(function(root){'use strict';
const node=typeof module!=='undefined'&&module.exports;
const B=node?require('./world-engine.js'):root.WorldEngine;
const version='stories-7.0.0',copy=x=>structuredClone(x);
const names={JP:['健一','美纪','直人','遥','葵'],US:['乔治','艾玛','丹尼尔','艾利克斯','山姆'],GB:['彼得','露西','汤姆','罗宾','查理'],CA:['保罗','克莱尔','马克','乔丹','诺亚']};
const titles={care:'父亲的照料安排',project:'老同事的周末项目',trip:'一张旅行的约定'};
function initial(s){const n=names[s.country];return{version,people:{father:{id:'father',name:n[0],role:'父亲',born:s.era-52},sister:{id:'sister',name:n[1],role:'姐姐'},colleague:{id:'colleague',name:n[2],role:'老同事'},partner:{id:'partner',name:n[3],role:'伴侣'},child:{id:'child',name:n[4],role:'孩子',born:null}},threads:{},callbacks:[],memories:[],childBirthTurn:null,objects:[],closed:false};}
function person(s,id){return s.story.people[id];}
function who(s,id){const p=person(s,id);return p.role+' · '+p.name;}
function option(id,title,effects,reply,log){return{id,title,text:'',...effects,reply,log};}
function scene(s,chain,nodeId,title,story,choices,personId,prop){return{kind:'story',chain,nodeId,eventId:chain+':'+nodeId,image:chain==='project'?'learning':chain==='care'?'care':'family',personId,person:who(s,personId),prop,title,story,choices};}
function project(s,nodeId){const n=person(s,'colleague').name,t=s.story.threads.project;
 if(nodeId==='offer')return scene(s,'project',nodeId,'两个周末，够不够？',n+'把一张清单推过来：“就这几项。你要接的话，我们先把时间说好。”',[
  option('accept','接下这份活',{cost:.4,extra:2},n+'在清单上补了一句：“只做两个周末。”','我接了'+n+'的项目，先把工作范围写在纸上。'),
  option('decline','这次不接',{},n+'收起清单：“行，我再问问别人。”','我把周末留给了自己的安排。'+n+'找了其他人。')],'colleague','project-list');
 if(t?.route==='accept')return scene(s,'project','follow','清单之外，又多了一项',n+'拿来'+(s.era+t.startedTurn+1)+'年那张清单：“客户还想改这里。这次另算，你也可以不接。”',[
  option('extend','另签一小单',{cost:.2,extra:1.2},n+'划出新增的部分，重新写了交付日期。','我接了后续工作，把新增费用和范围重新写清。'),
  option('close','按原约定收工',{},n+'点点头，把原来的清单夹进文件袋。','我完成了原先的约定，没有继续占用周末。')],'colleague','project-list');
 return scene(s,'project','follow','这回能在工作日做',n+'又来问你：“记得你上次想留住周末。这回可以在工作日分几次做。”',[
  option('weekday','接工作日的小单',{cost:.2,extra:.8},n+'把时间改成了三个工作日的傍晚。','我和'+n+'换了一种合作方式，周末仍留给自己。'),
  option('decline-again','还是先不接',{},n+'没有再劝，临走时约你改天喝杯茶。','我再次婉拒了项目，也没有断掉和'+n+'的联系。')],'colleague','project-list');
}
function care(s,nodeId){const n=person(s,'sister').name,f=person(s,'father').name,t=s.story.threads.care;
 if(nodeId==='offer')return scene(s,'care',nodeId,'冰箱上的轮值表',n+'把父亲'+f+'的复诊单摊开：“周二我能送。平时买菜、周末复诊，咱们怎么排？”',[
  option('paid','请人来帮忙',{cost:1.5},n+'把协助人员的号码写在轮值表背面。','我付了照料费，和姐姐把接送、买菜分开安排。'),
  option('personal','周末我来',{incomeFactor:.9},n+'在周六那一格写下我的名字。','我少接了一些工作，把周末留给父亲。')],'sister','care-rota');
 const old=t?.route==='paid'?(s.era+t.startedTurn+1)+'年写下的联系电话还在表背面。':'轮值表上，我的名字已经有些褪色。';
 return scene(s,'care','review','轮值表该换一张了',old+n+'说：“爸现在熟悉这套安排了。今年我们再分一下，别都压在一个人身上。”',[
  option('shared-paid',t?.route==='paid'?'继续请人，家里轮流接送':'请人协助，家里轮流接送',{cost:1.2},n+'画好新表，把复诊那一天圈了出来。',t?.route==='paid'?'我们续了协助服务，家里人分担接送。':'我们请人协助照料，家里人分担接送。'),
  option('shared-time','家里轮班，我少接些活',{incomeFactor:.95},n+'先填上自己的时间，再把笔递给我。','我和姐姐轮班照料，重新调整了工作时间。')],'sister','care-rota');
}
function trip(s,nodeId){const t=s.story.threads.trip,id=t?.personId||(s.flags.child&&s.story.childBirthTurn!==null&&s.turn-s.story.childBirthTurn>=4?'child':s.flags.partner?'partner':'sister'),n=person(s,id).name;
 if(nodeId==='offer')return scene(s,'trip',nodeId,'那张画着海的纸',n+'把一张画着海的纸放在桌上：“今年能去吗？”奖金通知也刚到，你把两张纸摆在一起。',[
  option('go','今年就去',{extra:3,cost:1.5},n+'开始列行李单，把那张纸留在桌边。','我们去了海边，回来时把车票夹在相册里。'),
  option('promise','先留钱，约两年后',{extra:3},n+'在纸角写下两年后的年份：“那先留着。”','我把奖金留下，和'+n+'约好两年后再安排旅行。')],id,'trip-note');
 if(nodeId==='due')return scene(s,'trip',nodeId,'纸角写的，就是今年',n+'拿出那张纸：“我们不一定去很远。换个近一点的地方也行。”',[
  option('short','安排一次短途旅行',{cost:.5},n+'把原来的目的地划掉，写上附近能去的地方。','我们换了更近的目的地，兑现了那次旅行。'),
  option('delay','再等一年',{},n+'把日期往后挪了一年，纸仍然留着。','我说明了今年的安排，把旅行再推迟一年。')],id,'trip-note');
 return scene(s,'trip','last','这次，把安排说定',n+'又翻到了那张纸：“附近走走也好。要是今年不去，我们就先把计划收起来。”',[
  option('local','去附近走一天',{cost:.1},n+'准备了简单的午饭，出门前把纸收进抽屉。','我们在附近过了一天，没有照原计划远行。'),
  option('cancel','今年先不去了',{},n+'把纸收好。我们没有再写一个新的日期。','那次旅行最后没有成行，我们把计划暂时收起。')],id,'trip-note');
}
const builders={project,care,trip};
function select(s,base){
 const turn=s.turn;
 if(s.flags.returning||[0,2,3,5,29].includes(turn))return decorate(s,base);
 const due=s.story.callbacks.filter(c=>c.mode==='choice'&&c.dueTurn<=turn&&c.latestTurn>=turn).sort((a,b)=>a.dueTurn-b.dueTurn||a.id.localeCompare(b.id));
 if(due.length){const c=due[0];return{...builders[c.chain](s,c.nodeId),callbackId:c.id};}
 const starts=[['project',1,4],['care',7+B.noise(s.seed,710)%3,13],['trip',10+B.noise(s.seed,711)%3,19]];
 for(const[chain,first,last]of starts)if(!s.story.threads[chain]&&turn>=first&&turn<=last)return builders[chain](s,'offer');
 return decorate(s,base);
}
const shortLabels=[['去上夜校','接额外工作'],['留个空闲周末','多接一点活'],['安排医疗保障','先用自己的储备'],['一起生活','继续独立生活'],['换个大房间','继续住这里'],['迎接孩子','暂不养育孩子'],['留个现金约定','去旅行'],['学一项新工具','做好现有订单'],['再学一门技能','把周末留出来'],['整理十年的账','请大家吃顿饭'],['加入互助小组','先保持联系'],['接新岗位','留在原岗位'],['报一门课程','一起找公共课程'],['保留医疗保障','自己承担账单'],['休一段长假','继续工作'],['约定现金储备','完成一个心愿'],['我来陪伴','请人协助'],['检修家中设备','先修眼前的故障'],['多支持一些','商量分担费用'],['翻翻旧照片','去一直想去的地方'],['把经验整理成课程','保持原来的节奏'],['调整住处','继续住这里'],['请人帮忙做家务','自己安排'],['认真学个爱好','先过简单些'],['拿出时间聊经验','提供一笔小额支持'],['定下现金目标','完成一个小愿望'],['换一台新的','修好继续用'],['少接一点工作','接额外项目'],['约大家见面','把故事写下来'],['留足下一段生活费','安排一次纪念']];
const recollections=[['夜校开课了，我把每周上课的时间写进日历。','我接了额外的工作，这一阵晚饭吃得晚了些。'],['我给自己留了一个空闲周末。','我又接下一点工作。'],['我把医疗保障的资料放进了家里的文件夹。','我决定先用自己的储备承担医疗账单。'],['我们搬到一起，开始共用一本家账。','我继续一个人生活，自己安排每天的节奏。'],['新房间终于收拾好了，固定租住开支也增加了。','我把原来的房间重新收拾了一遍。'],['孩子出生了，家里多了一个小床位。','我们暂时没有迎接孩子。'],['我在账本上写下了第十年的现金约定。','我去了想去的地方，带回几张照片。'],['我开始练习一种新的工作方法。','我把熟悉的订单逐一做完。'],['课程又开了，我给学习留出了时间。','我减少了一些额外工作，留住了周末。'],['我翻完了十年的账，把旧票据收好。','老朋友坐了一桌，我们聊到很晚。'],['我加入了互助小组，通讯录里多了几个名字。','我保留了联系，暂时没有加入小组。'],['我接下新的职责，开始学习带团队。','我继续留在熟悉的岗位。'],['我们选了一门课程，带回了第一本练习册。','我们一起找了公共课程，周末按时出门。'],['我续上了家庭医疗保障。','我停掉了保障，之后的医疗账单需要自己承担。'],['我停下一段工作，休了一个长假。','我继续工作，把这一年的收入留下来。'],['我写下第二十年的现金储备约定。','我终于完成了那个搁了很久的心愿。'],['我调整工作，抽出时间陪伴家人。','我请人协助照料，再安排自己的探望时间。'],['设备检修完了，我把维修单收进抽屉。','我先处理了眼前的故障。'],['我为下一阶段的学习多提供了一些费用。','我们一起商量了学习费用怎样分担。'],['我们翻起旧照片，认出当年去过的地方。','我到了那个一直想去的地方。'],['我把工作经验重新整理，也学到一些新方法。','我继续按熟悉的节奏工作。'],['我调整了住处，重新核对固定开销。','我保留了熟悉的居住环境。'],['有人帮忙做完家务，这个周末空了出来。','我自己做完家务，把费用省了下来。'],['我开始认真练习一个爱好。','我清理了一些安排，让日子简单一点。'],['我拿出时间，和刚起步的人聊了聊自己的经历。','我给刚起步的人提供了一笔小额支持。'],['我给下一段生活写下现金储备目标。','我完成了一件一直惦记的小事。'],['我换掉了家里一件常用设备。','我把旧设备修好，又继续用了起来。'],['我少接了一些工作，留出自己的时间。','我接了一项额外的工作。'],['我和家人朋友聚在一起，聊了聊这些年。','我把这些年的故事写了下来。'],['我重新看了一遍接下来的生活开支。','我安排了一次纪念，给这一段日子留个记号。']];
const everyday=[
 ['下班路上的招生单','夜校的招生单夹在账本里。另一边，有人问你愿不愿意多接一点工作。'],
 ['这个周末空出来了','日历上终于空出两格。你想出去走走，手头也还有能接的活。'],
 ['文件夹里的一份保障','家人刚处理完一笔医疗账单。你把保障说明和家里的储备放到一起看。'],
 ['要不要把钥匙交给对方','你们开始认真商量住在一起。餐桌、房租和每天回家的时间，都要重新安排。'],
 ['房东带来看了另一间房','新房间宽敞一些，租金也更高。你又回到原来的屋子里站了一会儿。'],
 ['家里要多一张小床吗','你们聊到了孩子。腾出一块地方并不难，之后很多年的时间和开销也要一起安排。'],
 ['在账本上写个日期','你翻到还空着的一页，想为第十年留下一个现金约定。桌边也放着一直想去的地方的照片。'],
 ['工作台换了新工具','身边的人开始换一种做法。你可以去学，也可以先把手上的订单做完。'],
 ['晚上还剩一点时间','课程表和日历放在一起。再学一点东西，还是把这些晚上留给家人和朋友？'],
 ['第十年的这一顿饭','旧账本已经用完几本。你想安静地翻一翻，也想叫大家过来吃顿饭。'],
 ['老朋友寄来一张名单','几个老朋友在组织互助小组，名单里还给你留了一行。参加需要一点费用和时间。'],
 ['办公室里多了一张椅子','新的岗位要带人，也要重新学不少东西。原来的团队还在等你答复。'],
 ['孩子带回来一张课程表','课程表上画了一个圈。你们也找到了公共图书馆和社区能参加的活动。'],
 ['保障快到续费的时候了','文件夹里的保障需要重新安排。家里的责任变了，费用和自付部分也要再看一遍。'],
 ['一段能请下来的长假','工作终于能暂时交接出去。休息会少一些收入，继续工作也有新的项目。'],
 ['第二十年的那一页','你又翻到未来的一页。留出九个月生活现金，或者先完成一个惦记很久的愿望。'],
 ['家里传来一个电话','家人这阵需要照料。你可以调整自己的工作，也可以请人来帮忙。'],
 ['维修师傅留下了两张报价','设备还能用，但毛病多了。一次检修需要更多费用，小修能先解决眼前的问题。'],
 ['下一阶段的学费单','孩子把学习安排带回家。你们坐下来，商量这笔费用怎样分担。'],
 ['第二十年的晚饭','有人拿出了旧照片。你们聊着过去，也聊到一个一直没有去过的地方。'],
 ['有人问起你当年怎么做','年轻同事来请教，你发现有些经验值得整理，也有些方法需要更新。'],
 ['住了很久的这间屋子','家里的需要和以前不一样了。调整住处可以减少一部分固定开销，搬动本身也有费用。'],
 ['家务又占掉了半个周末','清单上还有几件没做完。有人可以付费帮忙，你也可以自己慢慢收拾。'],
 ['那件一直想学的事','你找到了一个能长期练习的爱好。要准备一些东西，也可以先把日常安排简单些。'],
 ['一个刚起步的人来问你','对方的问题，你当年也遇到过。你可以拿出时间聊经验，或者提供一笔小额支持。'],
 ['给下一段生活留点余地','你想给第三十年写下一个现金目标。也有人提起一次期待很久的旅行。'],
 ['家里的设备又停了','师傅看过以后说，修还修得好，换新也有合适的型号。你拿着报价回到桌边。'],
 ['工作排期又发来了','这一年可以少接一点，也有一项额外工作等你答复。日历和账本都在手边。'],
 ['一张照片掉了出来','整理抽屉时，一张旧照片掉在地上。你想约照片里的人见面，或者把记得的事写下来。'],
 ['最后一页，留给自己','这本账写到了第三十年。你把旧票据收好，想一想怎样结束这一段日子。']
];
function decorate(s,base){const e=copy(base);e.eventId='year-'+s.turn+'-'+e.kind;e.personId=null;e.person='我的安排';
 if(e.kind==='life'){[e.title,e.story]=everyday[s.turn];if(s.turn===5&&!s.flags.partner){e.title='一个人的空闲';e.story='你看见一门合适的课程，也想给自己的日常留些时间。';}if([12,18].includes(s.turn)&&!s.flags.child){e.title='给自己安排一门课';e.story='你找到了一门感兴趣的课程。报名有费用，保持现在的节奏也很好。';}if(s.turn===21&&!s.flags.housing)e.story='房间里积下了一些不用的东西。你想重新整理，也可以先保持现在的样子。';}
 e.choices=e.choices.map((o,i)=>{const original=o.title;const log=e.kind==='life'?recollections[s.turn][i]:'我'+original.replace(/，.*$/,'')+'。';
  const c={...o,id:'option-'+i,title:e.kind==='life'?shortLabels[s.turn][i]:original.split('，')[0],reply:log,log};
  c.text=(o.text||'').replace(/；?生活满意度\s*[+＋−-]?\d+。?/g,'').replace(/；?满意度\s*[+＋−-]?\d+。?/g,'').replace(/这里不评价哪种家庭安排更好。/g,'');
  if(e.kind==='life'&&[5,12,18].includes(s.turn)&&!s.flags.child&&(s.turn!==5||!s.flags.partner)){c.title=i===0?'参加一门课程':'留住自己的时间';c.reply=c.log=i===0?'我报了一门课程，给学习留出时间。':'我把空闲留给自己的日常。';}
  if(e.kind==='bonus'){c.log=c.reply=i?'我和家人去了一趟旅行，把车票留了下来。':'我把这次奖金放进家庭储备。';}
  if(e.kind==='move'){c.log=c.reply=i?'我继续走熟悉的通勤路线。':'我搬近了一些，重新安排了每天出门的时间。';}
  if(e.kind==='care'){c.log=c.reply=i?'我减少工作，抽出时间照料家人。':'我请人协助照料，自己继续工作。';}
  if(e.kind==='freelance'){c.log=c.reply=i?'我婉拒了额外项目，留住周末。':'我接下额外项目，把几个周末空了出来。';}
  if(e.kind==='inheritance'){c.log=c.reply=i?'遗产手续办妥后，我分出一半支持亲人。':'遗产手续办妥后，我把这份积蓄留给家庭。';}
  return c;
 });return e;
}
function memory(s,id,text,extra={}){if(s.story.memories.some(x=>x.id===id))return; s.story.memories.push({id,year:s.era+s.turn+1,text,...extra});}
function queue(s,chain,nodeId,dueTurn,mode='choice',text=''){const id=chain+':'+nodeId;if(!s.story.callbacks.some(c=>c.id===id))s.story.callbacks.push({id,chain,nodeId,dueTurn,latestTurn:Math.min(29,dueTurn+3),mode,text});}
function complete(s,chain,outcome){const t=s.story.threads[chain];t.status='closed';t.outcome=outcome;t.closedTurn=s.turn;s.story.callbacks=s.story.callbacks.filter(c=>c.chain!==chain);}
function onChoice(s,e,o){
 if(e.callbackId)s.story.callbacks=s.story.callbacks.filter(c=>c.id!==e.callbackId);
 const feedback={eventId:e.eventId,choiceId:o.id,title:e.title,person:e.person,personId:e.personId,chain:e.chain||null,nodeId:e.nodeId||null,reply:o.reply||o.title,log:o.log||o.title,prop:e.prop||null};
 memory(s,e.eventId+':'+o.id,feedback.log,{chain:e.chain||null,personId:e.personId,choiceId:o.id});
 if(s.flags.child&&s.story.childBirthTurn===null){s.story.childBirthTurn=s.turn;s.story.people.child.born=s.era+s.turn+1;}
 if(o.deferred){if(e.chain){s.story.threads[e.chain]??={title:titles[e.chain],startedTurn:s.turn,personId:e.personId};complete(s,e.chain,'资金不足，安排已暂缓');}return feedback;}
 if(!e.chain)return feedback;
 const chain=e.chain,t=s.story.threads[chain]??={title:titles[chain],startedTurn:s.turn,personId:e.personId,status:'open'};
 t.stage=e.nodeId;t.lastChoice=o.id;t.lastTurn=s.turn;
 if(e.prop&&!s.story.objects.includes(e.prop))s.story.objects.push(e.prop);
 if(chain==='project'){
  if(e.nodeId==='offer'){t.route=o.id;queue(s,chain,'follow',s.turn+1);}
  else {t.route=o.id;queue(s,chain,'echo',s.turn+1,'echo',o.id==='extend'||o.id==='weekday'?person(s,'colleague').name+'把签过的清单交还给我，这次合作按约结束了。':person(s,'colleague').name+'又约我喝茶。我们没有再接着谈项目。');}
 }else if(chain==='care'){
  t.route=o.id;
  if(e.nodeId==='offer')queue(s,chain,'review',s.turn+2);
  else queue(s,chain,'echo',s.turn+1,'echo',person(s,'sister').name+'带回那张轮值表，父亲'+person(s,'father').name+'把下次复诊时间圈好了。我们这段照料安排已经稳定下来。');
 }else{
  t.route=o.id;
  if(o.id==='go'||o.id==='short'||o.id==='local'){
   t.fulfilled=true;const keepsake=o.id==='local'?'trip-day-note':'trip-ticket';if(!s.story.objects.includes(keepsake))s.story.objects.push(keepsake);
   queue(s,chain,'echo',s.turn+1,'echo',person(s,t.personId).name+(o.id==='local'?'翻到那张画着海的纸，提起我们在附近过的那一天。':'整理东西时又翻到了车票，我们聊起那次旅行。'));
  }else if(o.id==='promise'){queue(s,chain,'reminder',s.turn+1,'echo',person(s,t.personId).name+'把画着海的纸贴回桌边。约好的旅行还在明年。');queue(s,chain,'due',s.turn+2);}
  else if(o.id==='delay')queue(s,chain,'last',s.turn+1);
  else complete(s,chain,'旅行没有成行，计划已收起');
 }
 return feedback;
}
function reconcileCoverage(s,row){
 const intention=row.lifeEvent?.choices[row.choice]?.set?.insured;
 if(typeof intention!=='boolean'||intention===(row.policy.coverage>0))return;
 const log=intention?'我原本打算续上保障，最后决定自己承担今年的医疗账单。':
  '我原本打算自己承担医疗账单，安排钱时改选了'+(row.policy.coverage===2?'加强':'基础')+'医疗保障。';
 row.storyFeedback={...row.storyFeedback,log};
 const memoryId=row.lifeEvent.eventId+':'+row.storyFeedback.choiceId;
 const entry=s.story.memories.find(m=>m.id===memoryId);
 if(entry)entry.text=log;
}
function recordCashGoal(s,row){
 const months=({10:6,20:9,30:12})[s.turn],id='goal'+s.turn;
 if(!months||!s.flags[id])return;
 const met=row.cash>=Math.round(row.necessaryMonthly*months);
 const text='第'+s.turn+'年的现金约定'+(met?'兑现了':'还没有达到')+'。';
 const reply=row.storyReplies.find(r=>r.id===id);
 if(reply)reply.text=text;else row.storyReplies.push({id,chain:null,text});
 const entry=s.story.memories.find(m=>m.id===id);
 if(entry)entry.text=text;else memoryAt(s,row.year,id,text,null);
}
function afterYear(s,row){const turn=s.turn-1,replies=[];
 for(const c of [...s.story.callbacks]){
  if(c.mode==='echo'&&c.dueTurn<=turn){replies.push({chain:c.chain,text:c.text});s.story.callbacks=s.story.callbacks.filter(x=>x.id!==c.id);memoryAt(s,row.year,c.id,c.text,c.chain);if(c.nodeId==='echo')complete(s,c.chain,c.chain==='trip'?'旅行留下了回忆':'约定已经完成');}
  else if(c.mode==='choice'&&c.latestTurn<=turn){const text=titles[c.chain]+'没能在约定时间继续，我们把这件事暂时收起。';replies.push({chain:c.chain,text});memoryAt(s,row.year,c.id+':expired',text,c.chain);complete(s,c.chain,'错过约定时间，已说明并收起');}
  else if(c.mode==='choice'&&c.dueTurn<=turn){const text=titles[c.chain]+'本年没有再谈，下年继续安排。';replies.push({chain:c.chain,text});memoryAt(s,row.year,c.id+':postponed-'+turn,text,c.chain);}
 }
 row.storyReplies=replies;
 reconcileCoverage(s,row);
 recordCashGoal(s,row);
 if(s.phase==='ended')finalize(s,row,'这段人生已经结束');
}
function memoryAt(s,year,id,text,chain){if(!s.story.memories.some(x=>x.id===id))s.story.memories.push({id,year,text,chain});}
function finalize(s,row,reason){if(s.story.closed)return;s.story.closed=true;row.storyReplies??=[];
 for(const[chain,t]of Object.entries(s.story.threads))if(t.status!=='closed'){
  const text=t.fulfilled?(t.route==='local'?'我们已经在附近过了一天，画着海的纸收在抽屉里。':'旅行已经成行，那张车票留在了相册里。'):t.stage==='follow'||t.stage==='review'?t.title+'已经作出安排，后面的回访停在这里。':t.title+'还没有走完。'+reason+'，这件事留在了记录里。';
  row.storyReplies.push({chain,text});memoryAt(s,row.year,chain+':ending',text,chain);complete(s,chain,t.fulfilled?'旅行已成行':t.stage==='follow'||t.stage==='review'?'已作出安排，回访未发生':'故事未完成');
 }s.story.callbacks=[];
}
function journal(s){return{people:Object.values(s.story.people).filter(p=>p.id!=='child'||p.born!==null).filter(p=>p.id!=='partner'||s.flags.partner),threads:Object.entries(s.story.threads).map(([id,t])=>({id,...t})),memories:copy(s.story.memories),objects:[...s.story.objects]};}
const api={version,initial,select,onChoice,afterYear,recordCashGoal,finalize,journal,who,person};if(node)module.exports=api;else root.FamilyNarrative=api;
})(globalThis);
