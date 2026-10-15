/**
 * typographyDoctor.ts
 * 微信公众号文章阅读体验体检与智能规范化排版医生 (Typography & Readability Doctor)
 * 
 * 核心指标：
 * 1. 中英文与数字排版间隙 (盘古之白规范)
 * 2. 标点符号规范性（全角/半角混杂、过度重复符号）
 * 3. 手机端段落视觉压迫度（超 180 字未分段的文字大山预警）
 * 4. 冗余空行与垂直排版呼吸感（折叠 3 个以上无意义连续空行）
 * 5. 配图密度（图文比是否舒适，300-500 字配 1 图最佳）
 * 6. 微信外链死链检测（外部链接无法直跳提示）
 * 7. 手机端完读预估时长与综合阅读舒适度评分 (0-100)
 */

export interface LongParagraphIssue {
  line: number;
  wordCount: number;
  snippet: string;
}

export interface TypographyReport {
  overallScore: number;
  level: '大师级排版' | '阅读舒适' | '排版尚可' | '亟待调优';
  wordCount: number;
  chineseWordCount: number;
  englishWordCount: number;
  readingTimeMinutes: number;
  paragraphCount: number;
  avgParagraphWords: number;
  imageCount: number;
  imageRatioText: string;
  externalLinkCount: number;
  
  // Specific issue metrics
  spacingIssuesCount: number;
  punctuationIssuesCount: number;
  excessiveEmptyLinesCount: number;
  longParagraphs: LongParagraphIssue[];

  // Suggestions & Highlights
  highlights: string[];
  suggestions: string[];
}

/**
 * 深度体检 Markdown 正文的阅读舒适度与排版健康指标
 */
export function diagnoseTypography(markdown: string): TypographyReport {
  if (!markdown || !markdown.trim()) {
    return {
      overallScore: 100,
      level: '大师级排版',
      wordCount: 0,
      chineseWordCount: 0,
      englishWordCount: 0,
      readingTimeMinutes: 0,
      paragraphCount: 0,
      avgParagraphWords: 0,
      imageCount: 0,
      imageRatioText: '暂无正文',
      externalLinkCount: 0,
      spacingIssuesCount: 0,
      punctuationIssuesCount: 0,
      excessiveEmptyLinesCount: 0,
      longParagraphs: [],
      highlights: ['当前无文本内容'],
      suggestions: ['开始在编辑器中输入正文后即可实时体检'],
    };
  }

  // 1. 忽略代码块与数学公式进行文本统计
  const textWithoutCode = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]+\$/g, '');

  // 统计字数
  const chineseMatches = textWithoutCode.match(/[\u4e00-\u9fa5]/g);
  const chineseWordCount = chineseMatches ? chineseMatches.length : 0;
  const englishMatches = textWithoutCode.match(/[a-zA-Z0-9_-]+/g);
  const englishWordCount = englishMatches ? englishMatches.length : 0;
  const wordCount = chineseWordCount + englishWordCount;

  // 预估微信阅读时长 (平均 400 字/分钟)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 400));

  // 统计图片数量
  const imageMatches = markdown.match(/!\[.*?\]\(.*?\)/g);
  const imageCount = imageMatches ? imageMatches.length : 0;

  // 统计外链数量 (排除图片)
  const linkMatches = markdown.match(/(?:^|[^!])\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g);
  const externalLinkCount = linkMatches ? linkMatches.length : 0;

  // 2. 检测中英文紧密贴合无空格数量 (CJK and ANS directly adjacent)
  const CJK = '[\\u4e00-\\u9fa5]';
  const ANS = '[a-zA-Z0-9]';
  const noSpaceRegex1 = new RegExp(`(${CJK})(${ANS})`, 'g');
  const noSpaceRegex2 = new RegExp(`(${ANS})(${CJK})`, 'g');
  const spacingIssues1 = (textWithoutCode.match(noSpaceRegex1) || []).length;
  const spacingIssues2 = (textWithoutCode.match(noSpaceRegex2) || []).length;
  const spacingIssuesCount = spacingIssues1 + spacingIssues2;

  // 3. 检测标点符号问题 (重复感叹号问号，中文句子中混入英文半角逗号分号)
  const dupPunctuation = (textWithoutCode.match(/[!?！？]{2,}/g) || []).length;
  const halfwidthPunctuationInChinese = (textWithoutCode.match(/[\u4e00-\u9fa5][,;](?=[\u4e00-\u9fa5])/g) || []).length;
  const punctuationIssuesCount = dupPunctuation + halfwidthPunctuationInChinese;

  // 4. 连续 3 个以上无意义空行
  const excessiveEmptyLines = (markdown.match(/\n{4,}/g) || []).length;

  // 5. 段落长度与文字大山诊断
  const rawParagraphs = textWithoutCode.split(/\n\s*\n/);
  const paragraphs = rawParagraphs
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('>'));
  
  const paragraphCount = paragraphs.length;
  const avgParagraphWords = paragraphCount > 0 ? Math.round(wordCount / paragraphCount) : 0;

  const longParagraphs: LongParagraphIssue[] = [];
  const lines = markdown.split(/\n/);
  let currentParaWords = 0;
  let currentParaSnippet = '';
  let currentParaStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentParaWords > 180) {
        longParagraphs.push({
          line: currentParaStartLine,
          wordCount: currentParaWords,
          snippet: currentParaSnippet.slice(0, 45) + '...',
        });
      }
      currentParaWords = 0;
      currentParaSnippet = '';
      currentParaStartLine = i + 2;
    } else if (!line.startsWith('#') && !line.startsWith('```') && !line.startsWith('![')) {
      const pChinese = (line.match(/[\u4e00-\u9fa5]/g) || []).length;
      const pEnglish = (line.match(/[a-zA-Z0-9]+/g) || []).length;
      const lineWords = pChinese + pEnglish;
      currentParaWords += lineWords;
      if (!currentParaSnippet) currentParaSnippet = line;
    }
  }
  if (currentParaWords > 180) {
    longParagraphs.push({
      line: currentParaStartLine,
      wordCount: currentParaWords,
      snippet: currentParaSnippet.slice(0, 45) + '...',
    });
  }

  // 计算图文比
  let imageRatioText = '适中';
  if (wordCount > 1000 && imageCount === 0) {
    imageRatioText = '无配图（建议穿插 2-3 张图调节视觉疲劳）';
  } else if (wordCount > 800 && imageCount < 2) {
    imageRatioText = '偏少（长文建议每 300-500 字配 1 图）';
  } else if (imageCount > 15 && wordCount < 800) {
    imageRatioText = '图片较密（建议适当文字展开）';
  } else {
    imageRatioText = `舒适（${imageCount} 张图片，平均每 ${imageCount > 0 ? Math.round(wordCount / imageCount) : wordCount} 字 1 图）`;
  }

  // 6. 综合评分计算 (基准 100 分)
  let score = 100;

  // 扣分项 1: 中英文挤塞无空格扣分
  if (spacingIssuesCount > 20) score -= 15;
  else if (spacingIssuesCount > 5) score -= 8;
  else if (spacingIssuesCount > 0) score -= 4;

  // 扣分项 2: 标点符号混杂扣分
  if (punctuationIssuesCount > 10) score -= 10;
  else if (punctuationIssuesCount > 0) score -= 5;

  // 扣分项 3: 连续冗余空行扣分
  if (excessiveEmptyLines > 0) score -= Math.min(10, excessiveEmptyLines * 3);

  // 扣分项 4: 存在过长段落 (文字大山严重降低手机端完读率)
  if (longParagraphs.length >= 3) score -= 15;
  else if (longParagraphs.length > 0) score -= longParagraphs.length * 5;

  // 扣分项 5: 无配图超长文扣分
  if (wordCount > 1200 && imageCount === 0) score -= 8;

  score = Math.max(30, Math.min(100, score));

  let level: '大师级排版' | '阅读舒适' | '排版尚可' | '亟待调优' = '大师级排版';
  if (score >= 90) level = '大师级排版';
  else if (score >= 80) level = '阅读舒适';
  else if (score >= 65) level = '排版尚可';
  else level = '亟待调优';

  // 总结亮点与建议
  const highlights: string[] = [];
  const suggestions: string[] = [];

  if (spacingIssuesCount === 0 && wordCount > 50) {
    highlights.push('中英文与数字间断得当，具备标准专业排版规范（盘古之白）');
  }
  if (longParagraphs.length === 0 && wordCount > 100) {
    highlights.push('段落长短适中，在手机窄屏端阅读体验极佳');
  }
  if (imageCount >= 2 && wordCount > 500) {
    highlights.push('图文配比舒适，视觉节奏张弛有度');
  }
  if (punctuationIssuesCount === 0 && wordCount > 50) {
    highlights.push('标点符号严谨，无夸张重复或中英混杂符号');
  }

  if (spacingIssuesCount > 0) {
    suggestions.push(`检测到 ${spacingIssuesCount} 处中英文/数字紧贴无空格，建议点击「一键智能排版」规范化插入空格。`);
  }
  if (longParagraphs.length > 0) {
    suggestions.push(`检测到 ${longParagraphs.length} 处超过 180 字的“高压长段落”，手机屏阅读易产生疲劳，建议拆分 2-3 个短句段落。`);
  }
  if (excessiveEmptyLines > 0) {
    suggestions.push(`存在 ${excessiveEmptyLines} 处大于 3 行的连续多余空白行，建议一键折叠保持段落紧凑呼吸感。`);
  }
  if (externalLinkCount > 0) {
    suggestions.push(`检测到文中包含 ${externalLinkCount} 个外部网页链接。微信不支持正文外链直跳，建议点击「外链转文末脚注」转换。`);
  }
  if (wordCount > 1000 && imageCount === 0) {
    suggestions.push('全文超千字但缺少配图，建议在关键章节穿插架构图、要点卡片或封面插图。');
  }

  return {
    overallScore: score,
    level,
    wordCount,
    chineseWordCount,
    englishWordCount,
    readingTimeMinutes,
    paragraphCount,
    avgParagraphWords,
    imageCount,
    imageRatioText,
    externalLinkCount,
    spacingIssuesCount,
    punctuationIssuesCount,
    excessiveEmptyLinesCount: excessiveEmptyLines,
    longParagraphs,
    highlights,
    suggestions,
  };
}

/**
 * 一键智能规范化排版 (Auto-Fix Engine)
 * - 自动中英文盘古空格
 * - 自动全角标点纠偏
 * - 自动折叠冗余连续空行
 */
export function autoFixTypography(markdown: string): {
  fixedMarkdown: string;
  changesCount: number;
} {
  if (!markdown) return { fixedMarkdown: '', changesCount: 0 };

  let current = markdown;
  let changesCount = 0;

  // 1. 折叠 3 个以上无意义空行 -> 规范为最多 2 个空行
  const collapsedLines = current.replace(/\n{4,}/g, '\n\n\n');
  if (collapsedLines !== current) {
    changesCount++;
    current = collapsedLines;
  }

  // 2. 保护代码块和数学公式
  const codeBlocks: string[] = [];
  let masked = current.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // 3. 规范化标点与符号
  // 中文环境下的英文逗号与分号替换为全角逗号与分号
  const origBeforePunct = masked;
  masked = masked.replace(/([\u4e00-\u9fa5]),\s*([\u4e00-\u9fa5])/g, '$1，$2');
  masked = masked.replace(/([\u4e00-\u9fa5]);\s*([\u4e00-\u9fa5])/g, '$1；$2');
  // 规范过多重复感叹号问号
  masked = masked.replace(/！{2,}/g, '！').replace(/？{2,}/g, '？');
  if (masked !== origBeforePunct) {
    changesCount++;
  }

  // 4. 盘古规范插入空格 (CJK 与英数)
  const CJK = '[\\u4e00-\\u9fa5\\u3400-\\u4dbf]';
  const ANS = '[a-zA-Z0-9]';

  const origBeforeSpacing = masked;
  masked = masked.replace(new RegExp(`(${CJK})(${ANS})`, 'g'), '$1 $2');
  masked = masked.replace(new RegExp(`(${ANS})(${CJK})`, 'g'), '$1 $2');
  if (masked !== origBeforeSpacing) {
    changesCount++;
  }

  // 5. 还原代码块
  const fixed = masked.replace(/___CODE_BLOCK_(\d+)___/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  return {
    fixedMarkdown: fixed,
    changesCount,
  };
}
