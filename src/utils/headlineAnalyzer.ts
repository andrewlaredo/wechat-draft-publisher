/**
 * headlineAnalyzer.ts
 * 爆款标题实验室与微信列表截断诊断引擎
 * 
 * 核心诊断指标：
 * 1. 订阅号信息流大卡片截断预测（单行在 14 个汉字左右折行，超长截断）
 * 2. 微信单聊/群聊转发小卡片截断预测（标题通常显示 2 行，约 28-32 字符）
 * 3. 朋友圈图文分享卡片截断预测（约 20-24 字符）
 * 4. 爆款吸引力评分（量化数字、痛点解决、悬念反差、权威背书、情感共鸣）
 * 5. 违规与低俗标题党检测（严重夸大、虚假诱导）
 */

export interface TruncationSimulation {
  feedCard: {
    firstLine: string;
    secondLine?: string;
    isTruncated: boolean;
    displayTitle: string;
  };
  chatCard: {
    firstLine: string;
    secondLine?: string;
    isTruncated: boolean;
    displayTitle: string;
  };
  momentsCard: {
    firstLine: string;
    isTruncated: boolean;
    displayTitle: string;
  };
}

export interface HeadlineScoreItem {
  id: string;
  label: string;
  score: number; // 0 - 20
  status: 'good' | 'warning' | 'bad';
  tip: string;
}

export interface HeadlineDiagnosticResult {
  title: string;
  charCount: number;
  wordCountChinese: number;
  overallScore: number; // 0 - 100
  level: '爆款潜力' | '表现良好' | '中规中矩' | '亟待优化';
  truncation: TruncationSimulation;
  scoreItems: HeadlineScoreItem[];
  keyHighlights: string[];
  suggestions: string[];
}

export interface ViralTitleTemplate {
  category: 'number' | 'pain' | 'contrast' | 'authority' | 'curiosity' | 'story';
  categoryName: string;
  title: string;
  formula: string;
  advantage: string;
}

// 计算视觉字符权重（中文/全角算 1，英文/半角算 0.5）
export function getVisualCharWeight(str: string): number {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      len += 1;
    } else {
      len += 0.5;
    }
  }
  return len;
}

// 模拟字符串在特定视觉宽度下的折行与截断
function simulateWrap(text: string, maxVisualCharsPerLine: number, maxLines: number): {
  firstLine: string;
  secondLine?: string;
  isTruncated: boolean;
  displayTitle: string;
} {
  const chars = Array.from(text);
  let currentVisual = 0;
  let line1 = '';
  let line2 = '';
  let idx = 0;

  while (idx < chars.length && currentVisual < maxVisualCharsPerLine) {
    const c = chars[idx];
    const w = c.charCodeAt(0) > 255 ? 1 : 0.5;
    if (currentVisual + w > maxVisualCharsPerLine) break;
    line1 += c;
    currentVisual += w;
    idx++;
  }

  if (idx < chars.length && maxLines > 1) {
    currentVisual = 0;
    while (idx < chars.length && currentVisual < maxVisualCharsPerLine) {
      const c = chars[idx];
      const w = c.charCodeAt(0) > 255 ? 1 : 0.5;
      if (currentVisual + w > maxVisualCharsPerLine) break;
      line2 += c;
      currentVisual += w;
      idx++;
    }
  }

  const isTruncated = idx < chars.length;
  let displayTitle = line1;
  if (line2) {
    displayTitle += (isTruncated ? `${line2.slice(0, -1)}...` : line2);
  } else if (isTruncated) {
    displayTitle = `${line1.slice(0, -1)}...`;
  }

  return {
    firstLine: line1,
    secondLine: line2 || undefined,
    isTruncated,
    displayTitle,
  };
}

/**
 * 诊断微信标题在各场景的截断与吸引力指标
 */
export function diagnoseHeadline(title: string): HeadlineDiagnosticResult {
  const clean = title.trim();
  const visualLen = getVisualCharWeight(clean);
  const charCount = clean.length;
  const wordCountChinese = (clean.match(/[\u4e00-\u9fa5]/g) || []).length;

  // 1. 模拟微信客户端各场景截断
  // 微信订阅号常读大卡片：单行约 14 个中文字（权重 14），最多 2 行（约 28 字符截断）
  const feedCard = simulateWrap(clean, 14, 2);

  // 微信单聊/群聊卡片：单行约 13 个中文字，最多 2 行（约 26 字符截断）
  const chatCard = simulateWrap(clean, 13, 2);

  // 朋友圈图文卡片：单行约 20 字符截断
  const momentsCard = simulateWrap(clean, 20, 1);

  // 2. 指标评分维度 (各 20 分，总计 100 分)
  const scoreItems: HeadlineScoreItem[] = [];
  const keyHighlights: string[] = [];
  const suggestions: string[] = [];

  // 维度 1: 长度与截断安全性 (Length & Safe Truncation)
  let lenScore = 20;
  let lenTip = '长度黄金区间（14~28字），在微信信息流中展示完整且信息量充足。';
  if (visualLen < 8) {
    lenScore = 12;
    lenTip = '标题偏短（不足 8 字），无法承载核心利益点与吸引力。';
    suggestions.push('建议补充具体受众定位、场景或量化收益，提升辨识度。');
  } else if (visualLen > 30) {
    lenScore = 10;
    lenTip = '标题过长（超过 30 字符），在微信常读信息流中会被强制截断成省略号。';
    suggestions.push('请将核心吸引点、品牌词与利益点前置到前 14 个字以内。');
  } else if (feedCard.isTruncated) {
    lenScore = 16;
    lenTip = '标题接近两行临界点，末尾 1~2 字可能会在部分小屏机型被省略。';
  } else {
    keyHighlights.push('黄金长度，全机型免折断');
  }
  scoreItems.push({
    id: 'length',
    label: '长度与截断安全性',
    score: lenScore,
    status: lenScore >= 18 ? 'good' : lenScore >= 14 ? 'warning' : 'bad',
    tip: lenTip,
  });

  // 维度 2: 数据量化与说服力 (Numbers & Specificity)
  const hasNumbers = /\d+([%％万亿kKmM+＋条个步秒天元])?/.test(clean);
  let numScore = 12;
  let numTip = '缺少具体数字支撑，建议加入具体数据（如“3步”、“10倍”、“90%”）。';
  if (hasNumbers) {
    numScore = 20;
    numTip = '包含具体量化数据或步骤指引，显著提升读者确定感与点击意愿。';
    keyHighlights.push('包含量化数据，确定感强');
  } else {
    suggestions.push('加入量化指标（如时间成本、提效倍数、方法条数），点击率平均可提升 35%。');
  }
  scoreItems.push({
    id: 'numbers',
    label: '数据量化与确定感',
    score: numScore,
    status: numScore >= 18 ? 'good' : 'warning',
    tip: numTip,
  });

  // 维度 3: 情绪与利益承诺 (Hook & Value Promise)
  const emotionalKeywords = [
    '指南', '教程', '实战', '技巧', '秘籍', '深度', '解析', '终极',
    '为什么', '如何', '避坑', '颠覆', '真相', '首发', '复盘', '拆解',
    '彻底', '告别', '轻松', '效率', '速览', '一览', '精选', '必备'
  ];
  const matchedKeywords = emotionalKeywords.filter(k => clean.includes(k));
  let hookScore = 10;
  let hookTip = '利益承诺偏弱，读者难以快速判断“这篇内容与我有何关联”。';
  if (matchedKeywords.length >= 2) {
    hookScore = 20;
    hookTip = `包含明确价值抓手与引导词（如“${matchedKeywords.slice(0, 2).join('”、“')}”）。`;
    keyHighlights.push(`精准价值抓手：${matchedKeywords.join('/')}`);
  } else if (matchedKeywords.length === 1) {
    hookScore = 16;
    hookTip = `包含价值关键词“${matchedKeywords[0]}”，建议再强化解决的具体痛点。`;
  } else {
    suggestions.push('建议引入“避坑/深度实战/颠覆认知/如何”等受众强关注的行动词。');
  }
  scoreItems.push({
    id: 'value_promise',
    label: '价值承诺与痛点抓手',
    score: hookScore,
    status: hookScore >= 18 ? 'good' : hookScore >= 14 ? 'warning' : 'bad',
    tip: hookTip,
  });

  // 维度 4: 标点与节奏感 (Punctuation & Rhythm)
  const hasPunctuation = /[！？：·—|/【】《》“”~]/.test(clean);
  let punctScore = 14;
  let punctTip = '缺少节奏断句标点，视觉上一眼扫去容易形成大段文本疲劳。';
  if (hasPunctuation) {
    punctScore = 20;
    punctTip = '合理运用冒号、问号、中断线或标牌括号，视觉节奏感与焦点分明。';
    keyHighlights.push('节奏符号得当，断句分明');
  } else {
    suggestions.push('可适当使用冒号“：”或双括号“【】”隔开前缀主题与核心看点。');
  }
  scoreItems.push({
    id: 'rhythm',
    label: '视觉节奏与断句焦点',
    score: punctScore,
    status: punctScore >= 18 ? 'good' : 'warning',
    tip: punctTip,
  });

  // 维度 5: 合规健康与防封度 (Compliance & Anti-Spam)
  const spamWords = ['震惊', '吓人', '紧急通知', '不看后悔', '速看删', '天大秘密', '疯传'];
  const hasSpam = spamWords.some(w => clean.includes(w));
  let complianceScore = 20;
  let complianceTip = '标题措辞客观克制，无低俗震惊体诱导，符合微信官方版权与合规规范。';
  if (hasSpam) {
    complianceScore = 5;
    complianceTip = '检测到低俗震惊体词汇，极易触发微信官方降权、折叠或外链拦截！';
    suggestions.push('请务必移除“震惊/不看后悔/速看删”等劣质自媒体标题党词汇。');
  }
  scoreItems.push({
    id: 'compliance',
    label: '官方合规与防封健康',
    score: complianceScore,
    status: complianceScore >= 18 ? 'good' : 'bad',
    tip: complianceTip,
  });

  const overallScore = scoreItems.reduce((acc, curr) => acc + curr.score, 0);

  let level: '爆款潜力' | '表现良好' | '中规中矩' | '亟待优化' = '中规中矩';
  if (overallScore >= 90) level = '爆款潜力';
  else if (overallScore >= 75) level = '表现良好';
  else if (overallScore >= 60) level = '中规中矩';
  else level = '亟待优化';

  return {
    title: clean,
    charCount,
    wordCountChinese,
    overallScore,
    level,
    truncation: {
      feedCard,
      chatCard,
      momentsCard,
    },
    scoreItems,
    keyHighlights,
    suggestions,
  };
}

/**
 * 从可能已被各种爆款公式包裹的标题中，精准提取干净的核心主题词与主体
 * 避免重复点击“诊断分析”或套用公式时发生标题层叠嵌套 (Recursive Stacking)
 */
export function extractCoreTopic(inputTitle: string): { topic: string; keyword: string } {
  if (!inputTitle || !inputTitle.trim()) {
    return { topic: '微信公众号自动化发布', keyword: '公众号运营' };
  }

  let text = inputTitle.trim();

  // 1. 如果包含书名号《...》或双括号【...】，优先提取最内层的核心书名/主题
  const innerBookMatches = text.match(/《([^》]+)》/g);
  if (innerBookMatches && innerBookMatches.length > 0) {
    const lastMatch = innerBookMatches[innerBookMatches.length - 1].replace(/[《》]/g, '').trim();
    if (lastMatch.length >= 2 && lastMatch.length <= 30) {
      text = lastMatch;
    }
  }

  // 2. 剥离常见的公式前缀（涵盖 6 大体系公式及常见自媒体模板套路）
  const prefixPatterns = [
    /^\d+\s*个立竿见影的技巧[，,]让你的[《]?/i,
    /^耗时\s*\d+\s*天实测整理[：:]关于/i,
    /^千万别再乱发了[！!]\s*\d+%?\s*自媒体人都踩过的/i,
    /^为什么你的/i,
    /^为什么一线顶流大号[，,]都在悄悄弃用传统的/i,
    /^真相大白[：:]关于/i,
    /^【[^】]+】(工业级)?/i,
    /^大厂内参拆解[：:]顶级团队是如何系统化做/i,
    /^进入存量博弈时代[，,]真正决定/i,
    /^别再把时间浪费在低质排版上了[：:]谈谈/i,
    /^从零开始到全网矩阵百万曝光[：:]我摸爬滚打得出的/i,
    /^熬夜写下的复盘实录[：:]做/i,
  ];

  for (const pattern of prefixPatterns) {
    text = text.replace(pattern, '');
  }

  // 3. 剥离常见的公式后缀
  const suffixPatterns = [
    /[》]?效率提升\s*\d+\s*倍$/i,
    /的\s*\d+\s*大核心实战经验$/i,
    /严重误区$/i,
    /总是阅读惨淡[？?].*?$/i,
    /全流程完整闭环指南$/i,
    /的[？?]$/i,
    /[，,]绝大多数人从第一天就理解错了$/i,
    /成败的从来不是更新频率$/i,
    /的降维思考$/i,
    /实录$/i,
    /这一年[，,]我学到的血泪教训$/i,
  ];

  for (const pattern of suffixPatterns) {
    text = text.replace(pattern, '');
  }

  // 清洗残余的书名号、括号、冒号与首尾标点
  let topic = text.replace(/[《》【】「」]/g, '').trim();
  topic = topic.replace(/^[:：·—\s\-]+/, '').replace(/[:：·—\s\-]+$/, '');

  if (!topic || topic.length < 2) {
    topic = '微信公众号自动化发布';
  }

  // 限制最大长度以防过长失焦
  if (topic.length > 24) {
    topic = topic.slice(0, 24);
  }

  // 提取关键词：优先截取 2~8 个字符的有效词，过滤纯数字或单一符号
  let keyword = topic;
  const parts = topic.split(/[:：·—\s]/);
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (trimmedPart.length >= 2 && !/^\d+$/.test(trimmedPart)) {
      keyword = trimmedPart.slice(0, 8);
      break;
    }
  }
  if (!keyword || /^\d+$/.test(keyword)) {
    keyword = topic.slice(0, 8);
  }

  return { topic, keyword };
}

/**
 * 爆款标题 6 大体系公式生成器
 * 基于当前标题、摘要或核心关键词自动派生
 */
export function generateViralHeadlines(baseTitle: string, digest: string = ''): ViralTitleTemplate[] {
  const { topic: cleanTitle, keyword } = extractCoreTopic(baseTitle);
  const subIdea = digest ? digest.replace(/[《》【】]/g, '').slice(0, 16) : '排版分发全流程';

  return [
    // 1. 数字利益型
    {
      category: 'number',
      categoryName: '数字利益型',
      title: `3 个立竿见影的技巧，让你的《${cleanTitle}》效率提升 10 倍`,
      formula: '具体数字 + 极低门槛 + 超预期确定收益',
      advantage: '微信常读信息流中点击率最高，确定感强。',
    },
    {
      category: 'number',
      categoryName: '数字利益型',
      title: `耗时 30 天实测整理：关于${keyword}的 5 大核心实战经验`,
      formula: '高成本付出 + 稀缺干货 + 结构化数字盘点',
      advantage: '建立权威背书与收藏冲动。',
    },

    // 2. 痛点避坑型
    {
      category: 'pain',
      categoryName: '痛点避坑型',
      title: `千万别再乱发了！90% 自媒体人都踩过的${keyword}严重误区`,
      formula: '强烈警告 + 高覆盖比例 + 读者损失厌恶心理',
      advantage: '直击读者自我审视心理，促成高打开率与朋友圈转发。',
    },
    {
      category: 'pain',
      categoryName: '痛点避坑型',
      title: `为什么你的${keyword}总是阅读惨淡？这 3 个致命细节必须看`,
      formula: '发问反思 + 负向反馈归因 + 紧迫对策',
      advantage: '引发共鸣与自查冲动。',
    },

    // 3. 悬念反差型
    {
      category: 'curiosity',
      categoryName: '悬念好奇型',
      title: `为什么一线顶流大号，都在悄悄弃用传统的${keyword}？`,
      formula: '标杆同行 + 反常态举动 + 揭秘底层逻辑',
      advantage: '制造信息差认知断层，引爆同行圈层讨论。',
    },
    {
      category: 'curiosity',
      categoryName: '悬念好奇型',
      title: `真相大白：关于${keyword}，绝大多数人从第一天就理解错了`,
      formula: '终局揭晓 + 颠覆固有常识 + 刷新认知',
      advantage: '激发求知欲，停留时长与深度阅读率极高。',
    },

    // 4. 权威背书型
    {
      category: 'authority',
      categoryName: '权威背书型',
      title: `【官方标准实践】工业级${cleanTitle}全流程完整闭环指南`,
      formula: '权威标签 + 工业级高度 + 闭环全解',
      advantage: '极易被作为团队标准教程被同行群组与企业收藏。',
    },
    {
      category: 'authority',
      categoryName: '权威背书型',
      title: `大厂内参拆解：顶级团队是如何系统化做${keyword}的？`,
      formula: '大厂标签 + 顶级团队方法论 + 降维打击',
      advantage: '建立高端职场与专业技术影响力。',
    },

    // 5. 认知重塑型
    {
      category: 'contrast',
      categoryName: '认知重塑型',
      title: `进入存量博弈时代，真正决定${keyword}成败的从来不是更新频率`,
      formula: '时代大背景 + 否定大众惯性认知 + 抛出隐秘杠杆',
      advantage: '引发高质量留言互动与高净值受众共鸣。',
    },
    {
      category: 'contrast',
      categoryName: '认知重塑型',
      title: `别再把时间浪费在低质排版上了：谈谈${keyword}的降维思考`,
      formula: '当头棒喝 + 停止内耗 + 升维认知',
      advantage: '戳破低水平勤奋，引发深度认同。',
    },

    // 6. 沉浸故事型
    {
      category: 'story',
      categoryName: '故事沉浸型',
      title: `从零开始到全网矩阵百万曝光：我摸爬滚打得出的${keyword}实录`,
      formula: '真实第一人称 + 巨大逆袭跨度 + 倾囊相授',
      advantage: '代入感与人情味十足，容易打造有温度的个人 IP。',
    },
    {
      category: 'story',
      categoryName: '故事沉浸型',
      title: `熬夜写下的复盘实录：做${cleanTitle}这一年，我学到的血泪教训`,
      formula: '真实场景刻画 + 时间沉淀 + 诚恳避坑',
      advantage: '真诚打动读者，互动点赞与打赏率极佳。',
    },
  ];
}
