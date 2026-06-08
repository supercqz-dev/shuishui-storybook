// Unified book runner with smart retry/fallback for Azure moderation issues.
// Usage: BOOK=playground node scripts/book-runner.mjs
//        BOOK=ants node scripts/book-runner.mjs
//        BOOK=claycat node scripts/book-runner.mjs
//        BOOK=all node scripts/book-runner.mjs
import fs from 'fs';
import path from 'path';
import { Agent, setGlobalDispatcher } from 'undici';

// Azure image generation can take 90+ seconds; default undici headers timeout (5min) is fine
// but we extend body timeout in case of slow streaming, and disable headers timeout entirely.
setGlobalDispatcher(new Agent({
  headersTimeout: 600_000,  // 10 min
  bodyTimeout: 600_000,
  connectTimeout: 30_000,
}));

const BASE = 'http://localhost:3000';

const BOOKS = {
  // 《Two Rainy Miles》已发布版 = cycling-2km-v2(克制版镜头 + p5/p6/p14 精修 + 庆祝卡)。
  cycling: {
    book_id: 'cycling-2km-v2-2026-06-08',
    chars: ['shuishui', 'papa'],
    trigger: `周六早晨,天空下着小雨。水水要和爸爸一起完成一项挑战。
小区外面新修了一条小道,起点在小区门口,终点不知道通到哪里。上次听一位爷爷说,这条小路挺长,有一公里,那来回就是两公里。水水准备骑上她那辆带平衡轮的小自行车,和爸爸一起挑战——看看能不能自己骑完两公里!
这条小道可漂亮了:砖红色的路面,中间画着一条白色分割线,两边种着小树,还间隔种着不同品种的小花。
水水穿着透明小雨衣,骑着带平衡轮的自行车;爸爸穿着一件灰色雨衣,走在旁边。两人来到小路的起点。
挑战开始啦!水水跟爸爸说:"爸爸你跑起来,咱们比赛,看谁快!"说着就呼呼地骑了起来。爸爸赶紧跑起来追上水水,两人开心地往前走。
骑了一小段,前面左转了。小道右边是一条高铁轨道,为了安全,市政修了一堵高高的墙把小道和高铁隔开,墙上开着玻璃窗,能透过玻璃看到火车经过。
左转之后,右手边的草地上有一个还没修好的下水道,井盖没盖上,远远看去像个黑洞洞。水水问爸爸:"爸爸,那个下水道里是不是有怪兽呀?咱们快走!"爸爸赶紧带着水水往前,离开这个危险的地方。
再往前,小路弯弯曲曲一眼望不到头。突然,前面出现一座彩虹拱门——是好几个大铁框倾斜排列组成的,像一条彩虹隧道,可漂亮了!爸爸让水水骑到彩虹拱门中间,给她拍了几张漂亮照片。
拍完照,爸爸给水水喝水,一摸小手——哎呀,拔凉拔凉的!爸爸赶紧给水水暖暖小手,可不能再感冒啦。
补充完水分,继续挑战。爸爸问水水还有没有劲儿,水水说:"还可有劲了!"太棒啦!再往前,又碰到两座彩虹拱门。骑呀骑,终于,水水和爸爸到了小路的终点——原来这条小路的终点是个地铁站!还有一座人行天桥可以到马路对面,还能去包子店。
接下来要往回走,才能完成全部挑战。回家的路比较快,水水骑累的时候,爸爸就在小自行车车把上绑了一根绳子,在前面稍微牵引着,水水骑起来就轻松多啦。不一会儿就回到了起点。这下挑战全部成功!两公里的路,水水自己全骑下来了,真是一次特别棒的挑战!

构图提示:
- 全书只有水水(白兔)和爸爸(小熊猫)两个角色,没有其他家庭角色。
- ★ 贯穿全书的硬性设定,每一页都要遵守:
  · 爸爸全程是"走路/跑步"——NEVER riding anything,他是步行陪在旁边或在前面小跑,绝不骑车。
  · 水水全程骑一辆儿童自行车,后轮两侧带一对小辅助轮(training wheels / balance wheels),她坐在车上骑。
  · 从出门第一页到最后,水水和爸爸每一幕都穿着雨衣:水水 = a clear transparent hooded kids' raincoat(透明雨衣,能看到里面的粉裙);爸爸 = a grey/gray hooded raincoat(灰色雨衣)。下小雨,天色灰蓝柔和,地面湿亮反光。
- 关键道具/场景展开成具体英文外观,不要直接搬中文名:
  · 自行车 = a small kids' bicycle with a pair of training wheels on the rear wheel。
  · 小道 = a brick-red paved path with a single white center dividing line, young trees and patches of assorted little flowers along both sides。
  · 高铁隔离墙 = a tall safety wall on the right separating the path from a high-speed railway, with glass windows set into the wall through which a train can be seen passing。
  · 没修好的下水道 = an unfinished manhole/drain on the grass with its cover off, looking like a dark round hole from a distance(画得神秘但不恐怖,氛围是水水好奇/略紧张,不要真的怪兽)。
  · 彩虹拱门 = a rainbow arch tunnel made of several big metal frames arranged at a tilt/leaning in a row, colorful like a rainbow。
  · 终点 = a subway/metro station entrance, with a pedestrian footbridge crossing the road and a little steamed-bun (baozi) shop nearby。
  · 回程牵引 = papa (walking, in his grey raincoat) holds a rope tied to the handlebar of shuishui's bike, gently towing it from in front while shuishui rides。
- 情绪/情节高点单独成页:起点出发比赛(欢快)、透过玻璃墙看火车经过(惊奇)、黑洞下水道(好奇又紧张)、彩虹拱门中间拍照(开心)、爸爸暖小手(温暖)、到达地铁站终点(惊喜)、绳子牵引轻松回程(满足)、回到起点挑战成功(自豪)。`,
    edu: '坚持与挑战自我——独立完成两公里骑行,累了也不放弃;同时认识身边的小道风景(高铁、彩虹拱门、地铁站),感受爸爸一路陪伴和照顾(暖手、牵引)的温暖。',
  },
  basketball: {
    book_id: 'basketball-park-2026-06-08',
    chars: ['shuishui', 'papa', 'mama'],
    trigger: `周末天气非常好。妈妈建议水水下楼去拍会儿篮球——小区里的小广场有一块橡胶地面,在那儿拍球应该很棒。水水带着自己粉色的篮球,跟爸爸一起下了楼。
走到半路,水水跟爸爸说:"要不我们骑摩托车去公园投篮吧!"爸爸说:"篮框那么高,咱们现在还小,投不上去呢。"水水说:"你抱我投呗!"爸爸笑着说:"你这个小机灵鬼!可是爸爸抱着你也投不上去,篮框实在太高啦。要不这样,咱们先去看看,有篮框就试试,不过可能都是大哥哥们在那儿打比赛呢。"水水说:"行,咱们先去看看!"
爸爸骑着小摩托,把粉色篮球放进前车筐,带着水水去公园了。
到了公园,果然,篮球场上四个篮球框全被大哥哥们占着打比赛。水水就和爸爸在场地边上拍球。水水现在拍篮球可厉害了,能连着拍二十下!还和爸爸一起练习传球。玩了一会儿,水水和爸爸坐下来一起看比赛,顺便吃了块饼干补充能量。
吃完饼干,水水想起公园里还有个滑梯。爸爸带着她去玩滑梯。水水坐着滑下来,又趴着滑下来,开心得咯咯笑。正准备再滑一次,滑梯口来了几个大哥哥,挤在一起打闹,把滑梯口堵住了。水水勇敢地大喊一声:"你们快走开!"太棒啦!爸爸给水水鼓掌:我们水水现在已经是勇敢的大宝贝了,能自己解决问题,连大哥哥都不怕啦!
玩完滑梯,爸爸骑着摩托带水水回家,水水一路上开心地唱着歌。回家时爸爸选了一条新路——小区外围新修的一条红色小道(中间画着白色分割线),既能走人也能走小摩托,小路上还有彩色的方形拱门。半路上还碰到了住对门的安安弟弟和他妈妈在散步。
到家啦!妈妈问水水:你们去哪儿玩啦?水水开心地跟妈妈分享了一下午的游乐活动。

构图提示:
- 主体是水水(白兔)和爸爸(小熊猫)。妈妈(白兔,黄花裙)只在开头"建议下楼拍球"和结尾"在家听分享"出现;中间公园所有页面只画水水+爸爸。
- 关键道具/设施一律展开成具体英文外观,不要直接搬中文名:
  · 摩托车 = a small pastel step-through underbone moped/scooter with a CHILD SEAT mounted on the frame IN FRONT of the adult rider so the small rabbit sits up front, plus a front basket; 爸爸骑车在后、水水坐前面的儿童座椅上,两人都戴小头盔。
  · 篮球 = a kids' basketball in alternating PINK and lavender-purple panels(粉色与粉紫相间)。
  · 拍球场地 = a small community plaza with a flat rubberized sport floor。
  · 公园篮球场 = an outdoor basketball court with four hoops, taller "big kid" animal characters playing a game on the court(大哥哥们画成各种小动物:熊/狼/鹿/猴等青少年体型,友善打球氛围,不可怕)。
  · 滑梯 = a colorful kids' playground slide。
  · "堵滑梯口的大哥哥们" = a few slightly bigger teenage animal characters (e.g. a young bear and a young deer) playfully crowding the top of the slide;水水叉腰勇敢喊他们让开,表情是勇敢不是害怕,氛围轻松,大哥哥们友善地让开。
  · 新修的小路 = a freshly paved RED pathway with a white center dividing line, shared by pedestrians and small scooters, with colorful square arch gates over it。
  · 安安弟弟 = a small toddler BEAR CUB(比水水还小一点的棕色小熊),他妈妈 = an adult BROWN BEAR;两人在小路上散步,跟水水和爸爸打招呼。
- 情绪高点单独成页:水水连拍篮球二十下(自豪)、勇敢喊大哥哥让开(勇敢)、骑摩托走红色新路唱歌(快乐)。
- 结尾页在家:水水兴奋地跟妈妈比划分享,温馨。`,
    edu: '运动与坚持(拍球进步、练习传球)+ 勇敢自己解决问题(勇敢请大哥哥让开滑梯口)+ 亲子陪伴的快乐周末;让孩子感到"我长大了、我很勇敢"。',
  },
  rainyday: {
    book_id: 'rainyday-2026-06-06',
    chars: ['shuishui', 'papa', 'laolao'],
    trigger: `周末的早晨,下起了小雨。吃完早饭的水水,要跟爸爸下楼去玩水。
水水穿上了自己透明的小雨衣和涉水服(雨衣的帽子上有一颗小星星),还带了一把印着小动物图案的小雨伞。爸爸也穿上了雨衣。两人带上滋水玩具水枪,下楼玩咯!
爸爸带着水水来到停车场。早上的雨下得不大,地面上都是浅浅的小水坑。水水拿着滋水玩具,努力地对着地上的一个小水坑抽水,抽上了小半管,转身往爸爸身上滋——哈哈哈!爸爸穿着雨衣,还打开小雨伞当盾牌,挡住了水水滋过来的水柱。
玩了两下,水坑实在太小啦。爸爸就问水水,要不要去小区里的大水池那边玩?水水点点头,说:我们骑小摩托车去吧!于是爸爸带着水水,骑着踏板小摩托,来到了小区里的水池边。水池里的水可满啦!爸爸帮水水把水枪玩具吸满了一大管水,滋到摩托车上,给小摩托洗洗澡。冲了两三管水,小摩托可干净啦。
忽然,水水发现一只小鸟停在不远处。水水问爸爸:能不能用水滋到那只小鸟呀?爸爸说:我们试试看。两人转身抽了一大管水,可一回头,小鸟已经飞走啦!可能是小鸟听到水水要滋它,赶紧跑掉了吧,哈哈哈!
那滋哪里好呢?爸爸说:你抬头看这棵大树,我们能不能把水滋到高高的树叶上?水水说:试试吧!一、二、三!爸爸和水水一起举着水枪玩具,喷出又高又长的大水柱,直直地滋到了大树高高的树枝上!
玩了一会儿,下雨天还真有点冷。爸爸握着水水的小手,有点凉凉的,该赶紧回家啦。爸爸带着水水骑着小摩托回到家——姥姥早就做好了好吃的红烧肉和海参,等着他们吃午饭呢!
回家咯~

构图提示:
- 主要是水水(白兔)和爸爸(小熊猫)两个人的玩水故事,该同框就同框。姥姥(绵羊,白卷毛+亚麻衫)只在最后回到家、端出午饭的那一页出现;前面所有玩水的页面只画水水+爸爸。
- 关键道具要展开成具体英文外观,不要直接搬中文名:
  · 水水的雨衣 = a clear transparent kids' raincoat with a hood, a small yellow star on the hood;涉水服 = matching waterproof wading overalls。
  · 小雨伞 = a small kids' umbrella printed with cute little animal patterns。
  · 爸爸也穿一件雨衣。
  · "滋水枪"一律画成 a brightly colored TOY water squirter / pump-action water blaster toy(玩具,鲜艳塑料,千万不要画成真枪、不要用 gun 这个词,用 water squirter / water blaster / water toy)。
  · 踏板小摩托 = a compact pastel-colored electric step-through scooter(和家里那辆小电动摩托一致)。
  · 浅水坑 = shallow rain puddles on the parking-lot ground;大水池 = a big water pool / fountain pond in the residential compound。
  · 小鸟 = a small bird perched on a railing(后面一页飞走);大树 = a tall leafy tree with high branches。
  · 水柱 = an arcing jet/stream of water。
- 雨天氛围:细雨、灰蓝柔和的天色、地面湿亮反光、空气清新,但整体温暖欢乐,不要阴沉。
- 几个动作高点单独成页:对爸爸滋水(爸爸举雨伞当盾牌)、给小摩托洗澡、想滋小鸟结果鸟飞走、一起把水柱滋上大树。
- 结尾页:回到家,姥姥(绵羊)端出红烧肉和海参,一家人温馨吃午饭。`,
    edu: '感受雨天玩耍和亲子陪伴的快乐;认识雨具(雨衣/雨伞/涉水服)的用处和水的好玩;同时懂得玩得尽兴也要注意冷暖、手凉了就该回家,生活里处处有温暖。',
  },
  school: {
    book_id: 'school-cookie-2026-06-04',
    chars: ['shuishui', 'mama', 'laolao'],
    trigger: `今天早上,水水哭哭唧唧的,赖在家里说不想去上学,跟妈妈磨蹭了好久。
妈妈很有耐心地哄她、讲道理:"我们生病这几天都没去上课,今天差不多好啦,就该去幼儿园咯。
王老师都说想水水了,好几天没看到你啦。而且今天已经周四,明天周五,这周只剩两天就到周末,又能跟爸爸妈妈一起玩啦。
快到八点了,再哭下去,就赶不上幼儿园丰盛的早饭咯——有热狗、发糕、馄饨,可多好吃的啦!
哭也没有用呀,我们赶紧刷牙洗脸上学去!"
在妈妈温柔的劝导下,水水擦擦眼泪,跟妈妈一起去了幼儿园。
没想到今天幼儿园发生了好多好玩的事!中班的哥哥姐姐们举行了绘本剧演出,宝宝班的小朋友们当观众看表演。
哥哥姐姐们表演了《小红帽和大灰狼》的故事,还跳了好多人一起的兔子舞,水水跟同学们看得可认真了,太棒啦!
快放学时,刘老师特意拿出六一儿童节的礼物给水水——是一大包饼干!水水开心地放进了自己的小柜子里。
放学时姥姥来接水水,结果走得急,把饼干忘在学校了。都快到家了,水水才想起来:"哎呀,刘老师给的饼干忘拿啦!快回学校!"
姥姥赶忙骑上电动小摩托,载着水水返回幼儿园。刘老师还在班里忙着呢,看见水水又回来了,问她怎么啦?
水水说:"我忘拿饼干啦,哈哈哈!"自己从小柜子里取出饼干,又和姥姥一起开开心心回家。
到家后,水水拆开饼干吃了一块,真香!幸好今天去上学了,不然既拿不到刘老师的礼物,也看不到哥哥姐姐的精彩节目。
水水想:明天,我还要去上学!

构图提示:
- 角色:水水(白兔)、妈妈(白兔,黄花裙)、姥姥(绵羊,白卷毛+亚麻衫)、刘老师(长颈鹿,不戴眼镜)。
- 配角都要指定明确物种:中班表演的哥哥姐姐们画成各种小动物(熊/小猪/小象/松鼠等);演《小红帽和大灰狼》的小演员戴着小红帽斗篷/大灰狼头套即可,氛围欢乐不可怕。
- 关键道具:一大包饼干、幼儿园小柜子、姥姥的电动小摩托车。
- 开头哭闹页只画水水抹眼泪+妈妈温柔安慰,温馨不悲情;结尾水水在家开心吃饼干。`,
    edu: '情绪引导 + 上学的意义——哭闹解决不了问题,妈妈用讲道理代替妥协;勇敢去面对(上学)往往会收获意想不到的快乐(看演出、拿到礼物)。',
  },
  planting: {
    book_id: 'planting-seed-2026-06-03',
    chars: ['shuishui', 'papa'],
    trigger: `学校亲子活动日,老师布置的作业是:每个家长带一个花盆来学校,和小朋友一起种一颗小种子。
一大早,爸爸就去花卉市场,挑了好久,给水水挑了一个圆圆的、兔子形状的花盆——还有一对高高竖起的兔耳朵,可爱极了。
到了学校,水水发现别的小朋友的爷爷奶奶爸爸妈妈带来了各种各样形状的花盆;还有一位奶奶带来一个超级大的盆栽花盆,大家都被逗笑了。
活动开始,王老师先讲:一颗小种子是怎么发芽、长大、变成一棵大树的。那今天种的是什么呢?原来是花生!
刘老师教大家怎么种:先放一些土,再放上种子,然后盖一层土,最后给种子浇上半杯水。
每个小朋友分到 2 颗花生种子。小朋友们三人一组,每组有一个装满土的泡沫箱和一桶水。
爸爸和水水一起动手:往兔子花盆里填土,小心翼翼放好小花生,再盖上土,最后浇上水。完成啦!
洗洗手,吃了晚饭,水水带着她的小花生回家了。
可是过了好几天,花生还没有发芽。为什么呢?因为小种子需要每天细心照顾、经常浇水,才会慢慢发芽呀。
水水愿不愿意再耐心试试,好好照顾这颗小种子呢?

构图提示:
- 这是水水和爸爸(小熊猫)的亲子故事,该同框就同框,按剧情自然安排。
- 关键道具:圆圆的兔子形状花盆(带一对高高竖起的兔耳朵)、花生种子、泥土、洒水的小杯子、泡沫箱里的土。
- 学校活动场景里其他家长/小朋友可画成各种小动物作背景点缀(那个超大盆栽花盆的奶奶可以画得夸张好笑)。
- 结尾页:水水看着还没发芽的兔子花盆,若有所思又带着期待。`,
    edu: '认识植物生长(种子→发芽→长大)+ 懂得耐心和责任——种子要每天照顾、按时浇水才会发芽,做事要坚持和细心。',
  },
  childrensday: {
    book_id: 'childrensday-toystore-2026-06-01',
    chars: ['shuishui', 'mama', 'laolao'],
    trigger: `六一儿童节这天,水水有点小感冒、身体不太舒服,所以没去学校参加节日活动。
不过水水很勇敢,已经能自己乖乖喝下小药水了,真棒!
为了让水水开心,妈妈和姥姥带她去大融城商场逛街、买她喜欢的玩具。
玩具店里玩具好多好多!水水先走过毛绒玩具区——可是她已经有好多好多毛绒玩具啦,
看了半天,emm,好像都没有特别想要的,那今天就不选毛绒玩具啦。
最后水水自己挑了三样:一个小兔子钥匙扣、一盒粉色的水晶泥、还有一个可爱的粉色双层小推车玩具。真丰富!
选好玩具,妈妈和姥姥又带水水去吃她最爱的炸鸡翅和小汉堡,香香的,水水吃得好开心。
虽然今年没在学校过儿童节,但有妈妈和姥姥一直陪着,这个儿童节又特别又开心!

构图提示:
- 这是水水+妈妈+姥姥的温馨故事,逛街/吃饭等场景三个一起出现没问题,该同框就同框;某段只跟一位互动就画那两个。
- 开头"水水有点不舒服"只需画水水在家窝在沙发上、表情蔫蔫但勇敢的样子即可,不要画药片/针剂/体温计等医疗道具,氛围温柔。
- 重点和篇幅放在后面:热闹的玩具店、挑选三样玩具(小兔子钥匙扣 / 粉色水晶泥盒 / 粉色双层小推车玩具)、开心吃炸鸡翅和小汉堡。
- 角色:水水(白兔)、妈妈(白兔,黄花裙)、姥姥(绵羊,白卷毛+亚麻衫)。`,
    edu: '勇敢面对小病痛(自己乖乖喝药)+ 感受家人的陪伴——即使计划被打乱,有爱的人陪着,平凡的一天也能很特别、很快乐。',
  },
  playground: {
    book_id: 'playground-2026-05-28',
    chars: ['shuishui', 'papa', 'mama'],
    trigger: `初夏的早晨,天气凉快,爸爸妈妈带水水去公园里的游乐场玩。
水水跟爸爸一起玩了七彩迷宫球攀爬玩具,这个新玩具非常不错,水水很喜欢。
又玩了水水最喜欢的轮胎大长滑梯——爸爸先抱着水水坐在大轮胎上往下滑,好刺激;妈妈也陪水水坐了一次。
然后妈妈问水水要不要自己试试坐一次一条短一点的轮胎大滑梯,水水勇敢的尝试了一下,成功了!太好玩了。
最后跟爸爸穿着防水服,下到一个超大的浅水池子里捞金鱼。小金鱼游得超级快,水水跟爸爸追来追去,
一次抓到1条,有两次抓到2条,最后午饭时间到了,水水跟爸爸一起总共抓了8条鱼,
又把小鱼都倒回池子里,跟小金鱼说拜拜,回家吃饭咯~

构图提示:这是一家人的故事,该同框就同框。开场"一家人去公园"、结尾"一起回家"等温馨场景,
就把 shuishui+papa+mama 三个都画进画面;某段只有水水跟一位家长互动时,就画那两个。按剧情自然安排。`,
    edu: '勇敢尝试新事物——从被爸爸妈妈陪着玩,到自己独立尝试,享受成功的喜悦;一家三口在自然里玩耍的快乐时光',
  },
  // 验证用:与 playground 相同剧本,但用新的小熊猫 papa 重跑(独立 book_id,不覆盖旧狐狸版)
  playground_redpanda: {
    book_id: 'playground-redpanda-2026-05-29',
    chars: ['shuishui', 'papa', 'mama'],
    trigger: `初夏的早晨,天气凉快,爸爸妈妈带水水去公园里的游乐场玩。
水水跟爸爸一起玩了七彩迷宫球攀爬玩具,这个新玩具非常不错,水水很喜欢。
又玩了水水最喜欢的轮胎大长滑梯——爸爸先抱着水水坐在大轮胎上往下滑,好刺激;妈妈也陪水水坐了一次。
然后妈妈问水水要不要自己试试坐一次一条短一点的轮胎大滑梯,水水勇敢的尝试了一下,成功了!太好玩了。
最后跟爸爸穿着防水服,下到一个超大的浅水池子里捞金鱼。小金鱼游得超级快,水水跟爸爸追来追去,
一次抓到1条,有两次抓到2条,最后午饭时间到了,水水跟爸爸一起总共抓了8条鱼,
又把小鱼都倒回池子里,跟小金鱼说拜拜,回家吃饭咯~

构图提示:这是一家人的故事,该同框就同框。开场"一家人去公园"、结尾"一起回家"等温馨场景,
就把 shuishui+papa+mama 三个都画进画面;某段只有水水跟一位家长互动时,就画那两个。按剧情自然安排。`,
    edu: '勇敢尝试新事物——从被爸爸妈妈陪着玩,到自己独立尝试,享受成功的喜悦;一家三口在自然里玩耍的快乐时光',
  },
  ants: {
    book_id: 'ants-2026-05-28',
    chars: ['shuishui', 'papa'],
    trigger: `水水跟爸爸在公园游乐场玩了一会儿滑梯,有点累了,坐到长椅上休息。
水水低头看见长椅旁边一群小蚂蚁,排成一队队,有的搬着比自己还大的面包渣,有的扛着小树叶。
水水好奇地蹲下来观察,爸爸耐心地给水水讲蚂蚁的小知识——
蚂蚁虽然小小的,但是力气很大,能搬动比自己重好几倍的东西;
而且蚂蚁特别会分工协作,有的找路,有的搬运,有的守卫,大家一起完成任务;
蚂蚁是非常勤劳的小昆虫,不管太阳多晒,都不停地忙碌。
水水看得入了神,小心翼翼地不打扰小蚂蚁,还说以后要像蚂蚁一样勤劳。
休息够了,水水跟爸爸继续去玩。

构图提示:每页只有水水+爸爸两人,加上特写的小蚂蚁。`,
    edu: '认识蚂蚁——力气大、分工合作、勤劳;同时鼓励水水保持好奇心、用观察的方式了解小动物',
  },
  claycat: {
    book_id: 'claycat-2026-05-28',
    chars: ['shuishui', 'papa'],
    trigger: `今天是水水幼儿园的夏日亲子活动日,爸爸下了班就到学校了。
学校里非常热闹,好多小朋友和他们的爸爸妈妈(画面里把其他家长和小朋友都画成不同种类的小动物——比如熊、小猪、小象、小猴等)。
水水今天带着她最喜欢的小橘猫玩具——圆圆胖胖的身体,脖子上挂着一个小圆牌。
今天爸爸要和水水一起用陶泥捏一只跟玩具一样的小橘猫,因为爸爸是家里最会画画和捏陶泥的!
幼儿园准备了好多种不同颜色的陶泥,爸爸和水水选了橘色的。
他们一起合作:爸爸搓圆圆的身子,水水搓圆圆的脑袋,捏了一对小猫耳朵;
还捏了一块白色的贴在小猫肚子上,接上小手小脚,捏了蓝色的猫眼睛。
最后水水还捏了一个小吊牌贴在小橘猫脖子上——可太像了!
水水开心地拿着捏好的小橘猫,先去给王老师(熊猫)看,又给张老师(长颈鹿)看,最后给刘老师(小浣熊)看。
老师们都夸捏得特别好。
活动结束了,爸爸牵着水水的小手(水水另一只手举着小橘猫陶泥),开心地一起回家咯。

构图提示:大部分页面只画水水+爸爸 + 桌上的橘色陶泥;给老师看的几页可以分开画(每页只画水水+一位老师),不要全班合影式的画面。`,
    edu: '亲子合作——爸爸的创造力陪伴 + 水水自己动手参与;同时通过把同学们画成各种小动物,温柔表达"我们身边的人都不一样"',
  },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function postJson(url, body) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { _raw: text }; }
    return { ok: r.ok, status: r.status, body: parsed };
  } catch (e) {
    return { ok: false, status: 0, body: { error: `fetch_error: ${e.message}` } };
  }
}

function classifyError(body) {
  const blob = JSON.stringify(body);
  if (blob.includes('moderation_blocked')) return 'moderation';
  if (blob.includes('EngineOverloaded')) return 'overload';
  if (blob.includes('Connection timed out') || blob.includes('Connection reset') || blob.includes('fetch_error') || blob.includes('Headers Timeout') || blob.includes('UND_ERR')) return 'network';
  if (blob.includes('rate limit') || blob.includes('429')) return 'rate';
  return 'other';
}

function existingImagePath(book_id, pageNum) {
  const filename = `page-${String(pageNum).padStart(2, '0')}.png`;
  const p = path.join(process.cwd(), 'public', 'generated', book_id, filename);
  if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
    return `/generated/${book_id}/${filename}`;
  }
  return null;
}

async function generateImageWithRetry(page, book_id, log) {
  // Strategy:
  // - For each prompt variant, try up to 3 times for transient errors (overload/network)
  // - On moderation_blocked, immediately move to next variant (deterministic — same prompt won't unblock)
  // - Variants progressively reduce moderation surface area
  const variants = [
    { name: 'original', mutate: (p) => p },
    {
      name: 'drop-mama-keep-papa',
      mutate: (p) => p.characters_in_scene.length >= 3 && p.characters_in_scene.includes('papa')
        ? { ...p, characters_in_scene: p.characters_in_scene.filter((c) => c !== 'mama') }
        : null,
    },
    {
      name: 'drop-papa-keep-mama',
      mutate: (p) => p.characters_in_scene.length >= 3 && p.characters_in_scene.includes('mama')
        ? { ...p, characters_in_scene: p.characters_in_scene.filter((c) => c !== 'papa') }
        : null,
    },
    {
      name: 'medium-shot',
      mutate: (p) => p.shot === 'wide' ? { ...p, shot: 'medium' } : null,
    },
    {
      name: 'shuishui-only',
      mutate: (p) => p.characters_in_scene.length > 1
        ? { ...p, characters_in_scene: ['shuishui'] }
        : null,
    },
  ];

  const attempts = [];
  for (let v = 0; v < variants.length; v++) {
    const variant = variants[v];
    const mutated = variant.mutate(page);
    if (mutated === null) {
      log(`    page ${page.page} skip variant=${variant.name} (no-op)`);
      continue;
    }
    let moderationOnThisVariant = false;
    for (let r = 1; r <= 3 && !moderationOnThisVariant; r++) {
      log(`    page ${page.page} variant=${variant.name} retry=${r} chars=[${mutated.characters_in_scene.join(',')}] shot=${mutated.shot}`);
      const resp = await postJson(`${BASE}/api/generate-image/`, { page: mutated, book_id });
      if (resp.ok && resp.body?.image_path) {
        log(`    → SUCCESS via ${variant.name}: ${resp.body.image_path}`);
        return { image_path: resp.body.image_path, used_variant: variant.name, attempts };
      }
      const klass = classifyError(resp.body);
      attempts.push({ variant: variant.name, retry: r, status: resp.status, klass });
      log(`    → FAIL ${klass} status=${resp.status}`);
      if (klass === 'moderation') {
        moderationOnThisVariant = true; // skip remaining retries on this variant
        break;
      }
      const wait = klass === 'overload' ? 12000 : klass === 'network' ? 6000 : 4000;
      await sleep(wait);
    }
    if (moderationOnThisVariant) await sleep(2000); // small pause before next variant
  }
  return { image_path: null, attempts };
}

async function runBook(spec) {
  const { book_id, chars, trigger, edu } = spec;
  const logPath = `/tmp/story-${book_id}.log`;
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logPath, line + '\n');
  };
  fs.writeFileSync(logPath, `=== ${book_id} run ${new Date().toISOString()} ===\nChars: ${chars.join(', ')}\n\n`);

  const storyboardPath = `/tmp/story-${book_id}-storyboard.json`;
  let story;
  if (fs.existsSync(storyboardPath)) {
    log(`=== ${book_id}: STEP 1 reuse cached storyboard (${storyboardPath}) ===`);
    story = JSON.parse(fs.readFileSync(storyboardPath, 'utf-8'));
    log(`story REUSED: title="${story.title}" pages=${story.pages.length}`);
  } else {
    log(`=== ${book_id}: STEP 1 generate-story ===`);
    const storyRes = await postJson(`${BASE}/api/generate-story/`, {
      trigger, education_goal: edu, characters_in_book: chars,
    });
    if (!storyRes.ok) {
      log(`story FAIL status=${storyRes.status} body=${JSON.stringify(storyRes.body).slice(0, 500)}`);
      return { ok: false, reason: 'story-gen-failed' };
    }
    story = storyRes.body.story;
    log(`story OK: title="${story.title}" pages=${story.pages.length}`);
    fs.writeFileSync(storyboardPath, JSON.stringify(story, null, 2));
  }

  for (const p of story.pages) {
    log(`  p${p.page} [${p.shot}/${p.emotion}] in=${p.characters_in_scene.join(',')} → "${p.narration.slice(0,40)}..."`);
  }

  log(`=== ${book_id}: STEP 2 generate images (${story.pages.length} pages) ===`);
  const pageResults = [];
  for (const page of story.pages) {
    const existing = existingImagePath(book_id, page.page);
    if (existing) {
      log(`  --- page ${page.page} SKIP (already exists: ${existing}) ---`);
      pageResults.push({ page: page.page, image_path: existing, used_variant: 'existing', attempts: [] });
      page.image_path = existing;
      continue;
    }
    log(`  --- page ${page.page} ---`);
    const r = await generateImageWithRetry(page, book_id, log);
    pageResults.push({ page: page.page, ...r });
    page.image_path = r.image_path || undefined;
    await sleep(2000); // pacing between pages
  }
  const failed = pageResults.filter((r) => !r.image_path);
  log(`render: ${pageResults.length - failed.length}/${pageResults.length} OK, ${failed.length} failed`);

  log(`=== ${book_id}: STEP 3 save-book ===`);
  const book = {
    id: book_id, title: story.title, subtitle: story.subtitle,
    theme: story.theme, moral: story.moral, age_target: '3-4',
    pages: story.pages, created_at: new Date().toISOString(),
    status: failed.length === 0 ? 'finished' : 'rendering',
  };
  const saveRes = await postJson(`${BASE}/api/save-book/`, { book });
  if (saveRes.ok) log(`book saved: ${saveRes.body.saved_to}`);
  else log(`save FAIL ${JSON.stringify(saveRes.body)}`);

  return {
    ok: failed.length === 0,
    book_id,
    pages_total: pageResults.length,
    pages_ok: pageResults.length - failed.length,
    failed,
  };
}

async function main() {
  const which = process.env.BOOK || 'playground';
  const targets = which === 'all' ? Object.keys(BOOKS) : [which];
  const summary = [];
  for (const k of targets) {
    if (!BOOKS[k]) {
      console.error(`unknown book "${k}", choices: ${Object.keys(BOOKS).join(', ')}`);
      process.exit(1);
    }
    console.log(`\n========== Running book: ${k} ==========\n`);
    const r = await runBook(BOOKS[k]);
    summary.push({ key: k, ...r });
  }
  console.log('\n========== ALL DONE ==========');
  for (const s of summary) {
    console.log(`  ${s.key}: ok=${s.ok} ${s.pages_ok}/${s.pages_total} pages`);
  }
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
