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
  // 阿那亚度假(上): 出发、路书、午饭、高速、抵达民宿、儿童房和小院子。
  aranya: {
    book_id: 'aranya-holiday-part1-2026-06-16',
    chars: ['shuishui', 'papa', 'mama', 'laolao', 'dayi'],
    trigger: `这是一本较长的周末海边度假上集绘本,请扩展成 16-20 页,像家庭旅行日记一样温暖、连贯、细节丰富。主题是:出发去海边度假的一路小插曲,以及抵达漂亮民宿后的兴奋探索。故事结尾停在大家刚刚享受小院子的惬意时刻,作为“上集”。

故事素材:
这周末,爸爸妈妈要开车带水水和姥姥去一个漂亮的海边地方度假。那个地方叫阿那亚,在北戴河海边,从北京开车过去大约 4 小时。爸爸妈妈商量好:出北京前先在北京顺义吃午饭,再继续上路。
第一页必须是一张手绘地图路线页:从北京出发,中途在北京顺义吃午饭,再到北戴河阿那亚海边。地图上要显示路线、途中吃饭点、全程长度和时长,卡通手帐风,可爱贴纸感。旁白可以像旅行计划一样介绍:北京 → 顺义午饭 → 北戴河阿那亚,约 300 公里,约 4 小时。
早上起来,妈妈和姥姥在家里收拾行李,水水准备带小橘猫毛绒玩具跟自己一起去度假。
爸爸把白色大 SUV 开到了楼下。大家装行李的时候,发生了一个小插曲:水水的粉色小推车不见了。爸爸想起来,肯定是之前把露营帐篷从车上拿下来时,把小推车放到了小区路边,走的时候忘了拿,可能被哪个邻居捡走了。爸爸有点不好意思,觉得自己真是太粗心了。水水有一点舍不得,但大家先出发,也提醒自己以后东西要收好。
车终于开出小区。刚到小区门口,爸爸忽然问:身份证都带了吗?妈妈和姥姥都愣住了:没有!完蛋,赶紧开回去取。大家又掉头回家拿证件,这是第二个小插曲。
终于,重新上路了。没一会儿就到了第一站:顺义的饭店。妈妈给水水点了好吃的小鱼、鸭舌、蛤蜊萝卜丝汤,可香了。
吃完饭,爸爸抱着水水去买单。水水发现收银台放着圆圆的小糖果,问爸爸能不能拿。爸爸说可以,但是这是薄荷糖,吃了小嘴巴会冰冰的,你先舔一小口,看敢不敢吃。水水拿着圆圆的小糖果舔了一口,哇塞,太冰了!她朝爸爸吹了一口气,好像把冰冰的风吹给爸爸,逗得自己嘎嘎乐。
吃完午饭继续出发,车很快上了高速。没一会儿,水水就在车后排睡着了,抱着小橘猫。爸爸稳稳当当地开着车,车窗外的城市慢慢变成高速路、田野和远远的蓝天。
终于开到目的地了。停车以后,大家刚下车,就看到大姨迎面走了过来。原来大姨这次也来一起度假。水水开心地朝大姨跑过去,这次度假更热闹了。
大姨带着大家来到房间。哇塞,这个民宿真是太棒了!这是一个三室一厅,还带一个大院子。房主的装修品味非常棒,每个角落都干净、温暖、漂亮。
水水发现了一个儿童屋,可太棒了。里面有一张上下铺儿童床,有垂直的楼梯可以爬到上层。上层床铺有高高的围栏,还有几个透明的、像太空舱一样的圆形半球透明塑料窗口。水水开心地爬上去,跟爸爸说:爸爸快上来呀!爸爸也跟着爬了上去,哇塞,这里像一个小秘密基地。
儿童房里还有一个飘窗,铺着白色羊毛软垫,非常舒服。屋顶上挂下来可以爬的软梯和吊环。水水爬到飘窗上,正好够到吊环,小脚一蹬,就把自己挂在吊环上;一松手,又稳稳站在地上,开心地大笑起来。
儿童房里还有一个落地柜,柜子里装满了各种玩具,简直是个儿童乐园。
水水叫来大姨,跟她一起在小屋子里玩起了各种玩具。
爸爸妈妈来到小院子。太漂亮了!这是一个长条形的院子,四周种着小花小草。左边有一个双人的秋千椅,还有一个 L 型户外沙发和方形茶几。右边有一张餐桌,还有一个门可以通到小区里。阳光照在小院子里,妈妈坐在秋千椅上伸了个懒腰,觉得真是太惬意了。

固定角色与临时角色视觉设定(非常重要):
- 固定 bible 角色:水水=白色小兔;爸爸=小熊猫 red panda;妈妈=白色兔子;姥姥=绵羊;大姨=美丽优雅的白色北极熊,天蓝色夏日连衣裙。使用角色 YAML 的 prompt_anchor 保持形象。
- 水水全程带着小橘猫毛绒玩具:round orange tabby plush cat toy, soft and chubby, small round tag on its neck。
- 家庭用车是一辆 white large SUV,干净宽敞,适合家庭出游。车内后排要有安全座椅/儿童安全座,水水坐在后排安全位置,抱着小橘猫睡觉。
- 餐馆可以画成温暖明亮的中餐海鲜饭店,桌上有 small fish dish, duck tongues dish, clam and shredded radish soup; 食物要温馨可爱,不要夸张惊悚。
- 阿那亚/北戴河目的地氛围:海边度假社区、蓝天、清爽阳光、浅色建筑、松弛惬意,但本集不必急着画大海,重点在抵达和民宿。
- 民宿儿童房: bunk bed with vertical ladder, high safety railing, round transparent dome windows like little space-capsule portholes; cozy kids' room, no danger。
- 飘窗和吊环页: white wool cushion on bay window, hanging rope ladder and gym rings from ceiling; 水水动作开心安全,feet near bay window or floor, not extreme acrobatics。
- 小院子: long narrow courtyard, flowers and grass around edges, two-person swing chair on left, L-shaped outdoor sofa and square coffee table, dining table on right, little gate/door to residential community, warm afternoon sunlight。

构图与安全提示:
- 图像 composition_hint 里不要写 dad/mom/father/mother/parent/child/kid/toddler/baby/girl/boy 或人类年龄;用 shuishui / red panda / white rabbit / sheep / white polar bear 等描述。对白和旁白可以自然中文称呼爸爸妈妈姥姥大姨,但 image prompt 字段不要写亲属词或人类年龄词。
- 全世界都是拟人动物,没有真人;饭店服务员、邻居、路人如果出现,都必须是不同拟人动物,例如 raccoon waiter, squirrel neighbor, deer traveler。
- 地图页不是现实导航截图,而是 hand-drawn illustrated travel map / cartoon scrapbook map, with cute icons for Beijing, Shunyi lunch stop, Beidaihe Aranya seaside destination, dotted route, label “约300公里 / 约4小时”, little car sticker and sea sticker。不要画真实品牌地图 UI。
- 小推车丢失页要温和处理:水水有点舍不得,爸爸不好意思挠头,不要表现成大哭或严重冲突。
- 身份证遗忘页要轻松搞笑:车刚出小区门就停下,大家表情愣住,然后赶紧回家拿;不要焦虑灾难感。
- 高速页和车内页要安全温柔:车稳稳行驶,不要危险驾驶,不要疾驰追车。
- 抵达见大姨页:水水朝 white polar bear 开心跑去;红熊猫、白兔、绵羊在旁边拿行李,旅行团圆感。
- 儿童房探索可分多页:秘密基地、吊环、玩具柜、和 white polar bear 玩玩具。不要把所有细节塞一页。
- 书名必须是简短英文绘本名,不要出现 ShuiShui;副标题用中文,可体现“阿那亚度假上集”。`,
    edu: '旅行前要细心准备、证件和物品要检查好;遇到小插曲不用慌,一家人一起解决再继续出发;在旅途中感受家人陪伴、海边度假和新空间探索的快乐。',
  },
  // 阿那亚度假(中): 第二天早餐、儿童乐园障碍挑战、下午水系喷泉和动感单车喷水。
  aranya_mid: {
    book_id: 'aranya-holiday-part2-2026-06-17',
    chars: ['shuishui', 'papa', 'mama', 'laolao', 'dayi'],
    trigger: `这是“阿那亚度假（中）”,请写成 12-14 页左右的温暖旅行日记绘本。主题是:海边度假第二天,水水在儿童乐园里勇敢挑战,下午又在水系喷泉里玩水,最后留下“下集继续”的期待。

故事素材:
第二天早晨起床,妈妈、姥姥和大姨带着水水先去度假村食堂吃早餐。食堂餐线很长,有好多好多中式早餐:包子、粥、鸡蛋、蒸点、小菜、豆浆。水水吃了一个好吃的紫色紫薯包子,软软甜甜的。
吃完早餐,大家来到度假村儿童乐园。这里太好玩了:有大足球场,好几个篮球场,还有一个超大的攀爬网,以及一片儿童越野障碍区。
爸爸和水水来到儿童越野障碍区。那里有一条又长又窄的独木桥,两边扶手也是绳索。水水勇敢又小心地一点点往前走,爸爸在旁边鼓励水水。走到半路,碰到了对面走过来的小朋友。水水和对面的小朋友都很有礼貌,一个往左靠,一个往右靠,一错身,就都顺利通过了。
再往前,出现了超级难的挑战:脚下的独木桥变成了绳线,扶手绳变到了头顶上,需要举高双手才能够到。妈妈说:水水要不要换一个安全一点的玩?爸爸觉得水水是可以完成挑战的。爸爸扶着水水的腰,水水勇敢地踏上绳索,小手往上一够,抓住了。妈妈惊讶地说,原来我们水水都这么高了,可以完成这么厉害的挑战了。水水就这样勇敢又小心地通过了绳索挑战。
上午的挑战结束了。下午更好玩。
度假村广场上有一条长长的水系,那是一条浅浅的、小朋友可以直接下水玩耍的小水沟。每隔一段距离,就有一个石头墩,像泉眼一样不断往外冒水,让小水沟一直有流水。广场上还有很多不一样的喷泉。
最开头的地方,有一个大圆池子。那边的喷泉很大。水水穿上防水背带裤,拿上滋水玩具,跟爸爸一起下水玩。水水和爸爸一起把滋水玩具吸满水,然后用力一滋,水柱喷到了墙上。还有好多小朋友也在水里玩,有的小朋友被喷泉滋到了脸上,大家都哈哈笑。
水池边上还有一个单轮动感单车。妈妈抱着水水坐到上面,妈妈呼呼地骑了起来,就看到一个水柱从动感单车下面的喷水口滋出一条大水柱。
接下来还有什么好玩的呢?让我们看下集吧。

固定角色与临时角色视觉设定(非常重要):
- 固定 bible 角色:水水=白色小兔;爸爸=小熊猫 red panda;妈妈=白色兔子;姥姥=绵羊;大姨=美丽优雅的白色北极熊,天蓝色夏日连衣裙。使用角色 YAML 的 prompt_anchor 保持形象。
- 水水全程仍然是白色小兔,粉色裙子/粉色发带为默认造型;下午玩水时临时换成 waterproof wading overalls / 防水背带裤,可以仍保留粉色发带,并拿 brightly colored toy water squirter / pump-action water blaster toy。不要用 gun 这个词。
- 早餐食堂: bright seaside resort cafeteria, many Chinese breakfast buffet lines, steamed buns, congee, eggs, soy milk, small side dishes; 紫薯包子要画成 soft purple steamed bun。
- 儿童乐园: open seaside resort playground with green soccer field, several basketball courts, a huge climbing net, and a children's obstacle course。场景要阳光明亮、度假村感。
- 障碍区独木桥: long narrow wooden balance beam bridge, rope handrails on both sides, low safe height, soft sand or rubber ground below。
- 对面小朋友必须是明确物种: a small squirrel animal classmate / young animal visitor, 友好有礼貌。不要写 child/kid。
- 绳索挑战: footpath becomes taut rope lines underfoot, overhead rope handhold above; red panda supports shuishui carefully by the waist from the side; taller white rabbit watches with surprised proud expression。动作安全,不要危险惊险。
- 水系广场: shallow flowing water channel safe for small animals, stone fountain blocks / spring stones bubbling water, large round pool, varied fountains, sunny plaza。
- 玩水页: shuishui in waterproof wading overalls, red panda standing in shallow water, both using bright plastic water squirter toys; water stream splashes onto a wall; other small animal visitors can be background, each as clear species: duckling, raccoon, fawn, piglet, etc.
- 动感单车页: a single-wheel water-powered exercise bike installation beside the pool; taller white rabbit sits pedaling with shuishui seated securely in front/held on her lap, a strong water jet sprays from a nozzle below the bike。画成游乐装置,不要画成危险机械。

构图与安全提示:
- 图像 composition_hint 里不要写 dad/mom/father/mother/parent/child/kid/toddler/baby/girl/boy 或人类年龄;用 shuishui / red panda / white rabbit / sheep / white polar bear / small squirrel visitor 等描述。对白和旁白可自然中文称呼爸爸妈妈姥姥大姨,但 image prompt 字段不要写亲属词或人类年龄词。
- 全世界都是拟人动物,没有真人。所有路人/小朋友/游客都必须是拟人动物,并指定物种。
- 重点页:早餐紫薯包子、儿童乐园全景、独木桥小心前进、礼貌错身、绳索挑战够到头顶绳、妈妈惊讶表扬、下午水系广场、滋水到墙上、喷泉滋到小动物、动感单车喷水、下集预告。
- 书名必须是简短英文绘本名,不要出现 ShuiShui;副标题用中文,体现“阿那亚度假中集”。`,
    edu: '勇敢挑战与礼貌协作:遇到稍难的障碍可以小心尝试,也要听取家人保护和鼓励;和迎面来的小朋友互相礼让;在水边玩耍时穿好防水装备、开心但注意安全。',
  },
  // 幼儿园完整一天:早起、上学、入园、早餐、游戏、户外、午饭、午睡、水果、头套游戏、放学。
  // 长故事,允许 15-22 页。早晨水水/爸爸/妈妈都穿睡衣,需要覆盖默认服装。
  kindergarten: {
    book_id: 'kindergarten-day-2026-06-11',
    chars: ['shuishui', 'papa', 'mama', 'laolao'],
    trigger: `这是一本较长的幼儿园一日生活绘本,请扩展成 15-22 页,像日记一样温暖、连贯、细节丰富。主题是:幼儿园的一天很充实,水水能自己完成很多事情,也和老师、小朋友一起快乐玩耍。

故事素材:
清晨,太阳公公照进房间。水水和妈妈睡在同一张大床上。水水穿着短袖长睡衣从睡梦中醒来,在妈妈身边伸了个懒腰。妈妈也穿着睡衣,侧躺在同一张床上搂了搂水水,说:"早上好呀,我的小宝贝。"水水搂着妈妈脖子,亲了亲妈妈的小脸。
水水自己下床,来到爸爸房间门口,duang 的一声推开门,大喊:"爸爸,起床啦!"爸爸穿着睡衣,被水水吓了一跳,表情要夸张一点;水水得意地哈哈笑。
妈妈开始给水水换上漂亮的裙子和鞋子。水水从沙发椅背上一排毛绒玩具里挑了小橘猫,要带它一起去上学。带上水杯,出发。今天是爸爸送水水。
爸爸骑一辆弯梁小摩托(step-through scooter / underbone motorbike),弯梁中间脚踏通道的位置加装了一个小小的儿童前座,水水坐在爸爸前面的加装座椅上,开心去上学。一路阳光明媚,小风徐徐,水水和爸爸有说有笑。
很快到学校了。爸爸牵着水水的手进入幼儿园,来到班级门口。今天是王老师值班。王老师给水水用体温枪检查脑门体温,又用小手电筒照了照小牙齿有没有刷干净。水水跟爸爸拜拜,开心地跟王老师进班级。
一会儿章老师推着早餐来了。早餐很丰富:花卷、鸡蛋、肉沫小白菜粥、小煎饼。小朋友们一起开心地吃香喷喷的早餐。
吃完早餐开始玩游戏。三三两两的好朋友们一起搭积木、画画、给布娃娃讲故事。水水和果儿、十一一起玩磁力片,合作搭了一个高高的冰雪城堡。
玩了一会,王老师给大家讲故事,小朋友围成一圈认真听。
上午休息时间到了,章老师给大家推来了酸奶。小朋友排成一队,一人一盒酸奶。水水和毛毛西坐在一起,说说笑笑地喝酸奶。
喝完酸奶,刘老师来了,带着大家排成两队,手牵手来到操场。大家一起玩滑滑梯、拍球、滚轮胎。水水和毛毛西一起玩翘翘板。玩了一会儿,水水有点渴,回到班级,自己拿水杯咕咚咚喝了好几口。
中午到了,章老师又给大家带午餐:红薯米饭、红烧丸子、鸡蛋炒莴笋、冬瓜汤。
吃完饭,王老师说:"小朋友们,准备睡觉啦。"午睡的大房间里整齐排列着好几排小床,每个小朋友一张小床。水水爬到自己的小床上,咕噜噜滚了几下,觉得太舒服了。她盖上小被子,闭上眼睛,没一会儿就睡着了。王老师走过来,看看睡着的水水,轻轻给她拉了拉被子,眼神里都是表扬:水水会自己睡觉了,太棒了。
午睡结束,王老师放了轻柔的音乐,把小朋友们轻轻唤醒。小朋友们都伸了伸懒腰,午睡一会儿可太舒服了。
章老师给大家准备了水果。水水吃了几颗葡萄,真甜呀。
下午又有搞笑的游戏:小朋友们戴上水果头套一起玩。水水戴着西瓜头套,有的小动物戴草莓头套,有的戴苹果头套,有的戴南瓜头套,还有的戴香蕉头套,大家笑得前仰后合。
欢乐的时光过得真快,放学到了。小朋友们排成一队,跟着王老师来到学校门口。水水突然发现门口来接自己的竟然是爸爸,这是惊喜。水水高兴地朝爸爸挥挥手。出了校门,原来姥姥也来了。
水水和爸爸一起骑着小摩托回家。又是开心快乐的幼儿园一天,明天还要来玩。

固定角色与临时角色视觉设定(非常重要):
- 固定 bible 角色:水水=白色小兔;爸爸=小熊猫 red panda;妈妈=白色兔子;姥姥=绵羊。使用角色 YAML 的 prompt_anchor 保持形象。
- 早晨起床段落的服装是临时服装,必须覆盖默认服装:水水穿短袖长睡衣,不是粉色小裙子;妈妈穿柔软睡衣,不是黄色碎花裙;爸爸穿宽松睡衣,不是默认服装。第一页必须画水水和妈妈睡在同一张大床上、都穿睡衣,妈妈在床上搂着水水,不要把妈妈画成站在床边。composition_hint 必须写清楚 "shuishui and white rabbit share the same bed, both wearing pajamas instead of usual outfits"。
- 换衣服后到幼儿园全天,水水恢复漂亮裙子、鞋子、发带的默认上学造型,并带小橘猫毛绒玩具和水杯。
- 王老师 = 亲切的大熊猫老师,giant panda teacher, no glasses, 温柔值班老师。
- 章老师 = 斑点狗老师,Dalmatian dog teacher,推餐车/酸奶车/水果车,活泼能干。
- 刘老师 = 长颈鹿老师,giraffe teacher, no glasses, 负责带队去操场。
- 果儿 = 小鹿同学,small fawn/deer classmate,温柔可爱。
- 十一 = 小象同学,small elephant calf classmate,圆圆的、力气大、爱合作。
- 毛毛西 = 小白猫同学,small white kitten classmate,爱笑,和水水一起喝酸奶、玩翘翘板。
- 其他小朋友:每页出现时都明确分配动物物种,例如小松鼠、小猪、小熊、小浣熊、小狐狸、小鸭子、小刺猬等。不要写 human children。

构图与安全提示:
- 图像 composition_hint 里不要写 dad/mom/father/mother/parent/child/kid/toddler/baby/girl/boy 或人类年龄;用 shuishui / red panda / white rabbit / sheep / giant panda teacher / dalmatian teacher / giraffe teacher / animal classmates 等描述。
- 幼儿园是全动物世界,老师和同学都是拟人动物,没有真人。
- 入园检查页要明确动作分工:giant panda teacher holds a forehead thermometer near shuishui's forehead and a small flashlight for checking teeth; red panda stands aside saying goodbye, NOT doing the teacher action。
- 摩托车页:画一辆 gentle pastel step-through scooter / underbone motorbike。重点构图必须正确:弯梁车中间低低的脚踏通道/弯梁位置加装一个 small front child seat,这个小座椅在驾驶员前方、车把后方、踏板上方;red panda 坐在后面的正常驾驶座上双手扶车把;shuishui 坐在前方加装小座椅上,位于 red panda 和车把之间,不是后座,不是并排,不是 sidecar。sunny morning road, both happy。不要画成赛车或危险高速。
- 教室游戏页不要塞太多人;每页 3-6 个小动物足够。重点页分别给早餐、磁力片冰雪城堡、围圈听故事、排队拿酸奶、操场、喝水、午饭、午睡、醒来、水果、头套游戏、放学。
- 午睡页温柔安静:rows of small nap beds, each small animal in its own bed, shuishui tucked in, giant panda teacher gently adjusting the blanket, warm praise in her eyes。
- 水果头套游戏页要特别欢乐:shuishui wears a watermelon headpiece; animal classmates wear strawberry, apple, pumpkin, banana headpieces, everyone laughing, silly and bright。
- 书名必须是简短英文绘本名,不要出现 ShuiShui;副标题用中文。`,
    edu: '帮助水水回顾并喜欢幼儿园的一天:早起、入园、吃饭、游戏、听故事、户外、喝水、午睡、放学;强化自己起床、自己喝水、自己午睡、和小朋友合作的成就感,也让她期待明天继续去幼儿园。',
  },
  // 捉柳絮:北京初夏,大姨(漂亮白熊)带水水在楼下追捉柳絮。第一人称(大姨"我")叙述。
  // 大姨(dayi)已升级为固定 bible 角色(蓝裙白熊,强化女性特征),用 bible 锚点保证跨页一致。
  catkins: {
    book_id: 'willow-catkins-2026-06-10',
    chars: ['shuishui', 'dayi'],
    trigger: `这是一个温柔的初夏亲子日常故事,用第一人称("我"=水水的大姨)叙述。大姨在故事里设定成一只**漂亮高大的白熊**。故事里反复出现的"小毛絮/毛毛"就是北京初夏漫天飘飞的**柳絮(willow / poplar catkins,软软的白色絮毛,像小云朵、像小雪花,在空中慢慢飘)**。

故事原文(请据此自然分页,旁白尽量保留这种温柔口语的味道):
五月的北京,天气暖暖的,风轻轻的。我带着水水一起下楼出门玩耍。
微风一吹,漫天都飘着软软的白色小毛絮,一团一团轻飘飘的,像小小的云朵,又像漫天飞舞的小雪花,慢悠悠地在天上飘来飘去,特别好看。
水水抬起小脑袋,睁着亮晶晶的大眼睛,看着满天飞的毛毛絮,一下子就来了兴致。她拉着我的手,蹦蹦跳跳地大声说:"大姨!我们一起来捉毛毛玩吧!"
说完,水水就张开小小的胳膊,开心地追着漫天的毛絮跑了起来。风儿轻轻拂过,一团团毛毛絮绕着水水转圈,调皮地飞高飞低。低处的小毛絮,水水踮着小脚尖、小手一抓一合,认真又可爱,轻轻松松就能抓到。
可好多毛毛絮飞得高高的,小小的水水怎么踮脚、怎么伸手都够不着。她仰着小脸看着飘在空中的毛絮,有点小小的着急,软软地拉着我的衣角:"大姨,你抱我一下吧!"
我赶紧轻轻抱起水水,高高举着她。这下水水够得高高的,小手轻轻松松就捉住了飘在半空的毛毛絮。她攥着软软的小毛絮,举到我面前,得意洋洋地展示她的小收获,笑得眉眼弯弯。
有时候调皮的毛毛絮会从她小手缝里溜走,重新飘向空中,水水也不气馁,咯咯笑着,等着我再抱抱她、继续追着捉。
暖暖的春风、软软的飞絮,还有被抱着高高伸手捉毛毛的小水水,楼下到处都是清脆甜甜的笑声。
我们就这样在楼下玩了好久,追着风,捉着软软的毛毛。水水玩得满头小细汗,脸上却一直挂着大大的笑容。
水水开心地跟我说:"大姨,捉毛毛太好玩啦!下楼玩耍真的太开心啦!"
温柔的五月微风里,藏满了水水简简单单、开开心心的小快乐。

构图提示:
- 这是**水水 + 大姨两个人的同框故事**,绝大多数页都应该两人同框。
- 角色形象(务必每页一致):
  · 水水 = bible 设定的白色小兔(粉色小裙子+粉色运动鞋+粉色碎花发带),小巧。
  · 大姨 = a tall, elegant, beautiful anthropomorphic WHITE POLAR BEAR, soft cream-white fur, gentle warm youthful expression, standing upright and wearing a light flowy pastel summer dress (e.g. soft blue or pale yellow) —— 高大优雅、温柔,直立穿衣的拟人白熊,体型明显比水水高大。**在 composition_hint 里一律用 "the white polar bear" 指代大姨,不要写 aunt / 大姨 等称谓。**
  · 注意水水(白兔)和大姨(白熊)都偏白,靠"体型大小 + 大姨穿彩色裙子 + 长兔耳 vs 圆熊耳"区分开,别画成同款。
- 柳絮 = lots of soft fluffy white willow / poplar catkins (cottony seed tufts) drifting through the air like tiny clouds and floating snowflakes,有的低、有的高高飘在半空。
- 场景 = 初夏北京小区楼下的院子/绿地,暖暖的阳光,轻风,绿树成荫,蓝天,温柔明亮(不要全白,用绿树蓝天和大姨的彩色裙子平衡画面)。
- 关键动作/情绪高点单独成页:
  · 出门,漫天飞絮(wide 建场)。
  · 水水仰头看飞絮、眼睛亮亮地拉着大姨的手喊一起捉(开心)。
  · 水水张开胳膊追着飞絮跑,絮团绕着她转(活泼)。
  · 低处的絮,水水踮脚、小手一抓一合抓住了(认真可爱)。
  · 高处够不着,水水仰脸有点着急、拉着白熊的裙角想要抱抱(渴望)。
  · ★情绪最高点:大姨温柔地用双臂把水水高高抱起举高,水水伸手轻松捉住半空的柳絮(温暖、成就感)——机位要能同时看到白熊抱举的姿态和上方水水伸手够絮。
  · 水水攥着小毛絮举到大姨面前得意展示,笑眯眯(自豪)。
  · 结尾:玩了好久,满头小汗却笑得灿烂,温柔收束。`,
    edu: '感受初夏大自然的美(柳絮/暖风)和亲人陪伴的简单快乐;体会"自己够不到时,被亲人托举一把就能做到"的温暖与成就感;以及玩耍中不气馁、开开心心的小小心情。',
  },
  // 儿歌绘本:鳄鱼先生开火车。水水作为乘客出现,和小动物们一起搭火车出发。
  // 全书唯一 bible 角色是 shuishui;鳄鱼先生/小熊/小兔/小猴/小猪都是临时配角,
  // 只在 composition_hint 里按明确物种出现(和老师/同学的处理方式一致)。
  crocotrain: {
    book_id: 'crocodile-train-2026-06-09',
    chars: ['shuishui'],
    trigger: `这是一首欢快的儿歌绘本,讲鳄鱼先生开着小火车,小动物们和水水一起搭车出发去远方。请尽量把儿歌原句直接用作每页旁白(narration),保留"嘟嘟嘟嘟嘟嘟嘟""轰隆隆隆隆"这些拟声词的节奏感。

儿歌歌词(按顺序):
1. 清晨的阳光照在小站台。(开场建场:一个温暖的小火车站台,鳄鱼先生的彩色小火车停在站台边,水水已经在站台上,开心地等着小伙伴们。)
2. 小熊带着蜂蜜来,看到鳄鱼先生摆摆手,小熊说:"我要去看好朋友。"(小熊抱着一罐蜂蜜走来,鳄鱼先生在火车头朝它招手。)
3. 可爱的小兔,蹦蹦又跳跳,胡萝卜装满小背包。小兔问:"鳄鱼先生能搭火车吗?""我要去外婆家瞧一瞧。"(小兔背着装满胡萝卜的小背包,蹦跳着上车。)
4. 副歌:鳄鱼先生开火车,嘟嘟嘟嘟嘟嘟嘟,穿过森林穿过山洞,勇敢向前冲!(火车开动,水水和小动物们坐在车厢里,火车穿过森林、钻进山洞。)
5. 副歌:鳄鱼先生开火车,嘟嘟嘟嘟嘟嘟嘟,载着快乐轰隆隆隆隆!(火车在山林间飞奔,大家探出头开心欢呼,满载快乐。)
6. 小猴的尾巴,晃呀晃呀晃,香蕉挂在手臂上,看到鳄鱼先生点点头。小猴说:"远方有香蕉树!"(小猴吊着尾巴、手臂上挂着一串香蕉跑来上车。)
7. 胖胖的小猪,哼哧哼哧跑,火车就要出发啦!小猪喊:"鳄鱼先生请你等一等,我还没有坐上火车呢!"(胖小猪气喘吁吁地追火车,鳄鱼先生停下来等它,大家伸手拉它上车——学会等一等慢一点的朋友。)
8. 副歌再现:鳄鱼先生开火车,嘟嘟嘟嘟嘟嘟嘟,穿过森林穿过山洞,勇敢向前冲!载着快乐轰隆隆隆隆!(所有伙伴都上车了,火车满载着大家快乐地驶向远方,温暖收尾。)

构图提示:
- 全书唯一的固定角色是水水(白色小兔,粉色小裙子+粉色运动鞋+粉色碎花发带),她作为乘客全程出现在画面里:开头在站台等待、每来一个新朋友就开心地迎接、副歌时坐在车厢里和大家一起欢呼。每一页的 characters_in_scene 都应包含 shuishui。
- 其它角色都是临时配角,必须在 composition_hint 里写明确的英文物种外观,让它们作为画面主体清晰出现:
  · 鳄鱼先生 = a friendly cartoon GREEN CROCODILE train conductor/driver, gentle smiling face with small rounded teeth (NOT scary), wearing a train conductor's cap and striped overalls, driving the engine。
  · 小火车 = a cute colorful small toy/steam train: a round friendly engine plus a few open pastel-colored passenger carriages, child-friendly。
  · 小熊 = a small brown BEAR CUB hugging a honey pot/jar。
  · 小兔(歌里的) = a small GREY bunny wearing blue overalls, carrying a little backpack stuffed with orange carrots —— 注意要画成灰色背带裤小兔,和水水(白毛+粉裙)明显区分开,不要两只一样的兔子。
  · 小猴 = a little brown MONKEY with a long curling tail, a bunch of yellow bananas hanging over its arm。
  · 小猪 = a chubby pink PIGLET, running and panting to catch the train。
- 站台 = a warm cozy little train platform with a station sign, morning golden sunlight。森林/山洞 = green forest and a rounded tunnel the train passes through。
- 整体氛围:明亮欢快、阳光温暖、节奏感强(像一首唱的歌),所有动物表情友善开心,鳄鱼先生慈祥不可怕。
- 情绪/节奏高点单独成页:火车开动穿过山洞(勇敢冲)、满载快乐山林飞奔(欢呼)、胖小猪追火车大家拉它上车(温暖互助)。`,
    edu: '朋友相伴、一起出发去看望所爱之人的快乐;学会等一等、帮一把跑得慢的朋友(拉小猪上车),感受同行与分享旅程的温暖;在欢快的儿歌节奏里认识小熊/小兔/小猴/小猪等小动物和它们带的食物。',
  },
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
