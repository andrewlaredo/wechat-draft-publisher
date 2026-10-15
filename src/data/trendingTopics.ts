/**
 * trendingTopics.ts
 * 全网实时热点雷达与爆款选题数据库 (Multi-source Trending Radar & Evergreen Bank)
 */

export interface TrendingAngle {
  style: 'insider' | 'guide' | 'deep' | 'story';
  styleName: string;
  title: string;
  hook: string;
  outline: string[];
}

export interface TrendingItem {
  id: string;
  source: 'wechat' | 'zhihu' | 'weibo' | 'tech36kr' | 'github' | 'evergreen';
  sourceName: string;
  title: string;
  heat: string; // e.g. "984.6万"
  tag: string;
  badge: 'hot' | 'breaking' | 'rising' | 'gem';
  badgeName: string;
  summary: string;
  coreControversy: string;
  targetAudience: string;
  angles: TrendingAngle[];
}

export const TRENDING_ITEMS: TrendingItem[] = [
  // 1. 微信生态 / 微信看一看热搜 (WeChat)
  {
    id: 'tr-wx-1',
    source: 'wechat',
    sourceName: '微信热点流',
    title: '微信公众号小绿书模式扶持：多图文与图片消息流量红利深度复盘',
    heat: '1048.2万',
    tag: '平台生态',
    badge: 'hot',
    badgeName: '🔥 流量红利',
    summary: '微信官方持续倾斜公域推荐流至 3:4 比例的「图片消息（小绿书形态）」，普通公众号个人创作者单篇图文阅读量突破 10万+ 频发。',
    coreControversy: '究竟是做重度深度长文，还是顺应快节奏碎片化的图片消息？两类创作者打法如何并轨？',
    targetAudience: '公众号运营者、自媒体人、知识博主、个人 IP 打造者',
    angles: [
      {
        style: 'guide',
        styleName: '新手破局指南型',
        title: '别再傻傻写万字长文了！手把手带你吃到微信小绿书的公域推荐红利',
        hook: '许多人以为公众号打开率下滑了，其实是流量悄悄搬到了 3:4 的图片消息推荐流里！',
        outline: [
          '一、为什么微信官方要不惜代价推图片消息？',
          '二、爆款小绿书的 3:4 视觉结构拆解 (封面+金句+转化底卡)',
          '三、如何将以往写过的优质长文一键切片为九宫格卡片',
          '四、提升算法推荐权重的 3 个发布与互动心法',
        ],
      },
      {
        style: 'insider',
        styleName: '商业内参揭秘型',
        title: '拆解 10 个头部小绿书账号：他们是如何用 9 张卡片做到月入 6 位数的？',
        hook: '从选题策划到商业闭环，小绿书形态正在重塑自媒体知识付费与品牌植入的交易链路。',
        outline: [
          '一、小绿书变现三部曲：引流私域、单篇带货与品牌定制',
          '二、高转化文案的 4 级黄金留存钩子',
          '三、如何搭建标准化的低成本卡片切图流水线',
        ],
      },
    ],
  },
  {
    id: 'tr-wx-2',
    source: 'wechat',
    sourceName: '微信热点流',
    title: '新广告法与公众号合规常态化：自媒体如何避开千万级极限词雷区',
    heat: '892.4万',
    tag: '合规安全',
    badge: 'breaking',
    badgeName: '⚡ 紧迫防封',
    summary: '多地市场监管部门加强对自媒体商业软文和标题诱导违规的查处力度，多账号因出现“国家级/最高级/彻底根治”等词遭下架或限流。',
    coreControversy: '如何在追求高打开率标题的同时，100% 规避广告法雷区与微信官方防封机制？',
    targetAudience: '文案策划、公众号主编、企业新媒体运营团队',
    angles: [
      {
        style: 'guide',
        styleName: '实战避坑手册型',
        title: '自查清单！2026 最新公众号广告法违禁词合集与合规改写范例',
        hook: '发文前花 1 分钟自查，避免辛辛苦苦运营几年的账号面临封号与罚款！',
        outline: [
          '一、微信官方最新敏感词与极限词雷区全景扫描',
          '二、真实下架案例复盘：这些“口语化词汇”居然也算违规',
          '三、高点击率标题的合规替代措辞公式',
          '四、团队协作中的前置安全审核 SOP 流程',
        ],
      },
    ],
  },

  // 2. 知乎热榜 (Zhihu)
  {
    id: 'tr-zh-1',
    source: 'zhihu',
    sourceName: '知乎热榜',
    title: '为什么越来越多的技术人员和深度创作者开始拥抱纯自动化发布工具？',
    heat: '768.1万',
    tag: '效率与技术',
    badge: 'rising',
    badgeName: '📈 持续攀升',
    summary: '知乎高赞话题：“排版 2 小时，写字 20 分钟”。面对繁杂的排版工作流，自动化工具与 Markdown 内联正在成为技术写作者的标配。',
    coreControversy: '排版到底有没有必要花大把时间？工具自动化带来的审美千篇一律还是效率质变？',
    targetAudience: '程序员、独立开发者、技术极客、深度思考者',
    angles: [
      {
        style: 'deep',
        styleName: '底层思考升维型',
        title: '停止低水平的排版内耗：谈谈技术写作者的自动化生产力系统',
        hook: '优秀的内容创作者，绝不应该把才华浪费在机械拖拽样式和上传图片报错上。',
        outline: [
          '一、“排版内耗”正在悄悄谋杀你的写作热情',
          '二、从 Markdown 到一键草稿箱：解构现代内容工程学',
          '三、如何打造一套不依赖任何第三方的可复利发文流水线',
        ],
      },
    ],
  },
  {
    id: 'tr-zh-2',
    source: 'zhihu',
    sourceName: '知乎热榜',
    title: '大模型落地 2 年后，自媒体创作者到底是被淘汰了还是效率翻倍了？',
    heat: '920.5万',
    tag: 'AI 趋势',
    badge: 'hot',
    badgeName: '🔥 行业激辩',
    summary: 'AI 泛滥导致互联网劣质水文泛滥，读者对“AI 味”产生严重审美疲劳，具备深度真实感悟与 Human-in-the-Loop 的内容反获高赞。',
    coreControversy: 'AI 究竟是内容生产的救星还是毒药？如何让 AI 当副驾驶而非放任不管？',
    targetAudience: '内容创作者、文案作者、自媒体创业者',
    angles: [
      {
        style: 'deep',
        styleName: '真相批判型',
        title: '全网充斥“AI 味”烂文！深度创作者如何打赢这场真人对抗战？',
        hook: '满天飞的 DeepSeek/ChatGPT 批量洗稿正在让读者恶心，真正的核心竞争力反而回归到了原点。',
        outline: [
          '一、读者反胃：识别典型“AI 废话文学”的 5 大特征',
          '二、真正高手的 Human-in-the-Loop 创作闭环',
          '三、如何让 AI 负责搜集与结构化，真人负责灵魂与细节',
        ],
      },
    ],
  },

  // 3. 科技风向 / 36氪快讯 (Tech & 36Kr)
  {
    id: 'tr-36kr-1',
    source: 'tech36kr',
    sourceName: '36氪商业风向',
    title: '存量博弈下的全网矩阵分发：单账号天花板后，矩阵化如何低成本起盘？',
    heat: '645.8万',
    tag: '商业运营',
    badge: 'gem',
    badgeName: '💎 高度深度',
    summary: '单点账号抗风险能力极低，知乎、微信公众号、小红书、掘金全网矩阵成为自媒体团队抵御算法波动的不二之选。',
    coreControversy: '人力有限的小团队或单兵作战者，如何用一个人搞定 8 个平台的同步分发？',
    targetAudience: '企业主、创业者、自媒体矩阵团队',
    angles: [
      {
        style: 'insider',
        styleName: '矩阵操盘实操型',
        title: '一个人就是一个媒体公司：轻资产多平台矩阵分发完整操作手册',
        hook: '一鱼多吃的精髓不是机械复制粘贴，而是同一套内核在不同平台上的自适应变形。',
        outline: [
          '一、矩阵账号画像设计：主号打信任，副号测流量',
          '二、知乎、微信、掘金、小红书的受众心理差异与格式适配',
          '三、利用矩阵发布工具实现 30 秒全网覆盖',
        ],
      },
    ],
  },

  // 4. GitHub 趋势与开源极客 (GitHub Trending)
  {
    id: 'tr-gh-1',
    source: 'github',
    sourceName: 'GitHub 趋势',
    title: '现代化轻量 CI/CD 写作：将微信公众号发布接入 Git 工作流',
    heat: '420.3万',
    tag: '开箱即用',
    badge: 'rising',
    badgeName: '📈 开发者风向',
    summary: '程序员与 DevOps 工程师开始推崇 Docs-as-Code，每次 git push 触发 Actions 编译并自动化推送到微信草稿箱。',
    coreControversy: '为什么程序员宁愿自己写脚本调用微信接口，也不愿打开微信官方网页后台？',
    targetAudience: '全栈工程师、DevOps、开源项目布道师',
    angles: [
      {
        style: 'guide',
        styleName: '极客教程型',
        title: '【极客实战】基于 CLI 与 GitHub Actions 打造微信公众号持续集成发布流水线',
        hook: '像发布代码一样发布推文，代码写完 `git push`，草稿箱已经准备就绪！',
        outline: [
          '一、微信官方 API 鉴权与 AccessToken 缓存策略',
          '二、Markdown 静态图片处理与 Sharp 自动转码 WebP 方案',
          '三、配置 GitHub Actions 实现免运维自动化部署',
        ],
      },
    ],
  },

  // 5. 自媒体常青爆款库 (Evergreen Pillars)
  {
    id: 'tr-evergreen-1',
    source: 'evergreen',
    sourceName: '常青选题库',
    title: '【年度复盘 / 季度盘点】写出 10w+ 年终深度总结的 5 个黄金结构模版',
    heat: '1200万+',
    tag: '周期爆发',
    badge: 'hot',
    badgeName: '🔥 必火常青',
    summary: '无论是个人职业复盘、行业宏观洞察、还是公司年度成绩单，复盘类文章是朋友圈转发率与收藏率最高的内容形态。',
    coreControversy: '很多人的复盘写成了记流水账，如何把平淡的日常升华为触动人心的金句与方法论？',
    targetAudience: '所有职场人、创业者、行业观察家',
    angles: [
      {
        style: 'guide',
        styleName: '结构模板拆解型',
        title: '拒绝流水账！大厂总监亲授的 5 个高赞年终复盘写作模板',
        hook: '一次好的年度复盘，能让你的专业 IP 价值瞬间放大 10 倍！',
        outline: [
          '一、模版一：逆袭突破型（起点极低 + 关键抉择 + 认知飞跃）',
          '二、模版二：行业降维型（宏观变局 + 行业微观 + 破局建议）',
          '三、数据图表与关键数字的量化呈现秘诀',
        ],
      },
    ],
  },
  {
    id: 'tr-evergreen-2',
    source: 'evergreen',
    sourceName: '常青选题库',
    title: '【新手破局】自媒体从 0 到 1 快速冷启动的最小可行性闭环 (MVP)',
    heat: '1500万+',
    tag: '常青引流',
    badge: 'gem',
    badgeName: '💎 长尾流量',
    summary: '面向刚入局的新人创作者，阐述定位、排版、选题、标题与首批 1000 个种子用户的获取路径。',
    coreControversy: '新手往往死在“三天打鱼两天晒网”或一开始就买昂贵课程，真正有效的冷启动到底靠什么？',
    targetAudience: '副业创作者、自媒体新人、个人品牌初建者',
    angles: [
      {
        style: 'story',
        styleName: '真诚实录型',
        title: '从 0 粉丝到首月突破一万阅读：我摸爬滚打得出的冷启动血泪教训',
        hook: '别再去交几千块的自媒体智商税了，真正决定你能否走下去的只有这 3 件事。',
        outline: [
          '一、放弃完美主义：先完成，再完美',
          '二、前 10 篇文章的选题库搭建心法',
          '三、建立标准化写作与自动化排版日常流',
        ],
      },
    ],
  },
];
