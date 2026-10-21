/**
 * wechatSeoAnalyzer.ts
 * 微信「搜一搜」与「看一看」搜索优化诊断与关键词中枢 (WeChat Search & Top Stories SEO Engine)
 * 
 * 微信公域流量双引擎：
 * 1. 微信搜一搜 (WeChat Search)：依靠标题前置词、首段核心关键词密度、疑问词意图匹配与话题标签。
 * 2. 微信看一看 (Top Stories / 好看推荐)：依赖高互动完读率、金句物料、图文比与结构化引言。
 */

export interface WechatSeoIssue {
  id: string;
  type: 'critical' | 'warning' | 'good';
  title: string;
  description: string;
  suggestion: string;
}

export interface WechatSeoReport {
  score: number; // 0 - 100
  potentialRating: 'S级公域爆款潜质' | 'A级搜索流量潜力' | 'B级搜索推荐尚可' | 'C级亟待SEO优化';
  
  // Title Metrics
  titleFrontLoaded: boolean;
  titleKeywords: string[];
  matchedIntents: string[];
  
  // Content Metrics
  firstParagraphKeywordDensity: number; // 0 - 100%
  extractedKeywords: string[];
  suggestedHashtags: string[];
  
  // Structure & Engagement Metrics
  headingsCount: number;
  hasSummaryQuote: boolean;
  readingMinutes: number;
  
  // Issues & Actions
  issues: WechatSeoIssue[];
  recommendedTitles: string[];
}

const COMMON_SEARCH_INTENT_WORDS = [
  '如何', '怎么', '教程', '指南', '实战', '全流程', '是什么', '为什么',
  '避坑', '干货', '最全', '2026', '最新', '核心', '方法', '建议', '解析'
];

/**
 * 诊断文章在微信搜一搜与看一看算法中的 SEO 竞争力与曝光潜力
 */
export function analyzeWechatSeo(params: {
  title: string;
  markdown: string;
  digest?: string;
}): WechatSeoReport {
  const { title = '', markdown = '', digest = '' } = params;
  const issues: WechatSeoIssue[] = [];
  let score = 100;

  // 1. Title Front-loading analysis (微信搜一搜权重集中在前 14 个字符)
  const cleanTitle = title.trim();
  const front14 = cleanTitle.slice(0, 14);
  const matchedIntents = COMMON_SEARCH_INTENT_WORDS.filter((intent) => cleanTitle.includes(intent));

  let titleFrontLoaded = false;
  if (!cleanTitle) {
    score -= 30;
    issues.push({
      id: 'title-empty',
      type: 'critical',
      title: '缺少文章主标题',
      description: '微信公众平台文章必须包含规范标题。',
      suggestion: '请在顶部或文章元数据中配置精准的标题。',
    });
  } else if (cleanTitle.length < 8) {
    score -= 15;
    issues.push({
      id: 'title-too-short',
      type: 'warning',
      title: '标题过短，搜一搜检索命中率低',
      description: `当前标题仅 ${cleanTitle.length} 字，包含的有效关键词过少。`,
      suggestion: '建议扩展至 16-28 字，增加受众常搜的核心业务词。',
    });
  } else if (cleanTitle.length > 32) {
    score -= 10;
    issues.push({
      id: 'title-too-long',
      type: 'warning',
      title: '标题超出微信搜索常读视窗',
      description: `标题达 ${cleanTitle.length} 字，在微信搜一搜结果列表及常读流中可能被省略号截断。`,
      suggestion: '建议精简至 30 字以内，将核心焦点词置于前 14 个字。',
    });
  } else {
    // Check if meaningful keyword is front-loaded
    if (/[\u4e00-\u9fa5]{2,}/.test(front14)) {
      titleFrontLoaded = true;
    }
  }

  if (matchedIntents.length === 0 && cleanTitle.length >= 8) {
    score -= 8;
    issues.push({
      id: 'title-no-intent',
      type: 'warning',
      title: '缺少高频搜索意图触发词',
      description: '搜一搜用户偏好检索教程、实战、全解、避坑等强行动词。',
      suggestion: `可在标题中加入【指南】、【实战】或【教程】增强搜索曝光。`,
    });
  }

  // 2. First Paragraph keyword density
  const cleanMarkdown = markdown.replace(/^---[\s\S]*?---/, '').trim();
  const paragraphs = cleanMarkdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('<!--') && !p.startsWith('!'));

  const firstPara = paragraphs[0] || '';
  const first200Words = firstPara.slice(0, 200);

  // Extract core keywords from title
  const titleKeywords = cleanTitle
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  let firstParagraphKeywordDensity = 0;
  if (first200Words && titleKeywords.length > 0) {
    const hits = titleKeywords.filter((k) => first200Words.includes(k)).length;
    firstParagraphKeywordDensity = Math.min(100, Math.round((hits / titleKeywords.length) * 100));
  }

  if (firstParagraphKeywordDensity < 30 && paragraphs.length > 0) {
    score -= 12;
    issues.push({
      id: 'first-para-keyword-low',
      type: 'warning',
      title: '正文首段缺少主标题关键词呼应',
      description: '微信搜一搜爬虫会深度权重首段 200 字，用于校验搜索相关性。',
      suggestion: '建议在文章第一段直接点出核心主题与解决问题。',
    });
  }

  // 3. Headings Structure (微信看一看结构化权重)
  const headings = cleanMarkdown.match(/^#{1,4}\s+.+$/gm) || [];
  if (headings.length < 2) {
    score -= 10;
    issues.push({
      id: 'headings-few',
      type: 'warning',
      title: '缺少小标题分段结构 (H2/H3)',
      description: '全文缺少多层级小标题，容易让手机读者产生疲劳。',
      suggestion: '添加 2~4 个二级小标题 (##)，搜一搜会自动抓取为结果摘要锚点。',
    });
  }

  // 4. Digest length & keywords
  if (!digest || digest.trim().length < 20) {
    score -= 8;
    issues.push({
      id: 'digest-short',
      type: 'warning',
      title: '文章摘要未充分利用',
      description: '摘要不仅展示在聊天分享卡片，搜一搜亦将其作为正文简介索引。',
      suggestion: '建议编写 40-100 字的高信息密度摘要，包含 2 个以上搜索核心词。',
    });
  }

  // 5. Hashtag detection
  const hasHashtags = /(?:^|\s)#[^\s#]+/.test(markdown);
  if (!hasHashtags) {
    score -= 5;
    issues.push({
      id: 'missing-hashtags',
      type: 'warning',
      title: '未布局微信官方 #话题标签',
      description: '微信公众平台支持在正文文末添加 #话题标签，直接打通微信搜索与号内专栏合辑。',
      suggestion: '在文末添加 2~3 个 #话题标签（例如：#微信排版 #自媒体运营）。',
    });
  }

  // 6. Extracted Keywords & Suggested Hashtags
  const potentialTags = new Set<string>();
  titleKeywords.forEach((k) => {
    if (k.length >= 2 && k.length <= 6) potentialTags.add(k);
  });
  if (cleanTitle.includes('AI') || markdown.includes('AI')) potentialTags.add('AI效率工具');
  if (cleanTitle.includes('微信') || markdown.includes('公众号')) potentialTags.add('微信公众号');
  if (cleanTitle.includes('排版') || markdown.includes('样式')) potentialTags.add('新媒体排版');
  if (cleanTitle.includes('运营') || markdown.includes('增长')) potentialTags.add('自媒体运营');
  if (potentialTags.size < 3) {
    potentialTags.add('干货分享');
    potentialTags.add('效率提升');
  }

  const suggestedHashtags = Array.from(potentialTags).slice(0, 5);

  // 7. Recommended SEO-optimized titles
  const coreSubject = titleKeywords[0] || '微信排版';
  const recommendedTitles = [
    `【深度实战】${cleanTitle || '微信公众号自动化发布'}全流程指南 (2026最新)`,
    `${coreSubject}怎么做？手把手教你建立高确定性爆款创作工作流`,
    `建议收藏！关于${coreSubject}，看这一篇避坑指南就够了`,
  ];

  const readingMinutes = Math.max(1, Math.ceil((markdown.length * 0.7) / 400));
  const finalScore = Math.max(35, Math.min(100, score));

  let potentialRating: WechatSeoReport['potentialRating'] = 'B级搜索推荐尚可';
  if (finalScore >= 90) potentialRating = 'S级公域爆款潜质';
  else if (finalScore >= 78) potentialRating = 'A级搜索流量潜力';
  else if (finalScore >= 60) potentialRating = 'B级搜索推荐尚可';
  else potentialRating = 'C级亟待SEO优化';

  return {
    score: finalScore,
    potentialRating,
    titleFrontLoaded,
    titleKeywords,
    matchedIntents,
    firstParagraphKeywordDensity,
    extractedKeywords: titleKeywords,
    suggestedHashtags,
    headingsCount: headings.length,
    hasSummaryQuote: cleanMarkdown.includes('> ') || cleanMarkdown.includes('核心认知'),
    readingMinutes,
    issues,
    recommendedTitles,
  };
}

/**
 * 一键将 SEO 话题标签注入到 Markdown 文末
 */
export function injectHashtagsIntoMarkdown(markdown: string, hashtags: string[]): string {
  const clean = markdown.trim();
  const tagString = hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join('  ');
  const tagBlock = `\n\n---\n\n${tagString}\n`;
  return `${clean}${tagBlock}`;
}
