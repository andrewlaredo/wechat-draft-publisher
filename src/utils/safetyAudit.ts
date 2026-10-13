/**
 * safetyAudit.ts
 * 内容安全体检与合规防封引擎 (Safety & Compliance Guard)
 * 
 * 核心功能：
 * 1. 新广告法违禁词/极限词扫描 (绝对、第一、顶级、百分之百等) 及合规替代建议
 * 2. 微信公众平台诱导分享/关注违规词扫描 (转发朋友圈免费领、在看送等)
 * 3. 外部超链接与未报备域名扫描 (微信防封外链风险)
 * 4. 微信草稿箱 HTML 20,000 字符限制体检与极限压缩评估
 * 5. 一键智能合规脱敏与修复 (Auto-Fix)
 */

export interface SensitiveIssue {
  id: string;
  type: 'ad_extreme' | 'induce_sharing' | 'external_link' | 'html_length' | 'format_risk';
  severity: 'high' | 'medium' | 'low';
  title: string;
  matchedText: string;
  replacement?: string;
  description: string;
  line?: number;
  position?: number;
}

export interface SafetyAuditReport {
  score: number; // 0 - 100
  passed: boolean;
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: SensitiveIssue[];
  summary: string;
  charCount: number;
  htmlLength: number;
  isHtmlOversized: boolean;
}

// 1. 新广告法极限词库与合规替代词
const AD_EXTREME_WORDS: { word: string; replacement: string; reason: string }[] = [
  { word: '最强', replacement: '卓越', reason: '广告法绝对化用语' },
  { word: '最好', replacement: '优秀', reason: '广告法绝对化用语' },
  { word: '最高级', replacement: '高标准', reason: '广告法绝对化用语' },
  { word: '最优', replacement: '优选', reason: '广告法绝对化用语' },
  { word: '第一', replacement: '领先', reason: '广告法禁止使用“第一”等未经国家认证的绝对性排名' },
  { word: '第一名', replacement: '名列前茅', reason: '绝对化排名' },
  { word: '全网第一', replacement: '业内领先', reason: '绝对化虚假宣传' },
  { word: '全网唯一', replacement: '独具特色', reason: '绝对化宣传用语' },
  { word: '独家首发', replacement: '原创首发', reason: '若无权威证据属绝对化词汇' },
  { word: '绝对', replacement: '非常', reason: '绝对化词汇' },
  { word: '绝无仅有', replacement: '极为罕见', reason: '绝对化夸张' },
  { word: '顶级', replacement: '高端', reason: '广告法禁用绝对化词汇' },
  { word: '极致', replacement: '精湛', reason: '绝对化夸大用语' },
  { word: '国家级', replacement: '高规格', reason: '未经官方许可禁止使用国家机关/国家级名义' },
  { word: '世界级', replacement: '国际化', reason: '禁止未经查证的世界级称号' },
  { word: '百分之百', replacement: '很大程度', reason: '禁止绝对化疗效或结果承诺' },
  { word: '100%', replacement: '大幅', reason: '禁止绝对化收益或效果承诺' },
  { word: '包赚不赔', replacement: '具参考价值', reason: '涉嫌非法金融广告与虚假承诺' },
  { word: '万能', replacement: '多用途', reason: '绝对化夸张' },
  { word: '永久免费', replacement: '免费体验', reason: '谨防虚假宣传纠纷' },
  { word: '史上最', replacement: '近年来少见', reason: '绝对化夸张词' },
  { word: '史无前例', replacement: '前沿创新', reason: '绝对化夸张' },
];

// 2. 微信违规诱导分享/关注词库 (微信重点打击封号行为)
const INDUCE_WORDS: { word: string; reason: string; replacement?: string }[] = [
  { word: '转发朋友圈即可', reason: '违规诱导分享，微信平台明令禁止以利益强制转发朋友圈', replacement: '欢迎分享给身边的朋友' },
  { word: '转发到朋友圈', reason: '若包含有偿或强制要求，属诱导分享高危行为', replacement: '分享给有需要的朋友' },
  { word: '转发给微信好友领取', reason: '微信禁止诱导用户向好友分发消息套取资料', replacement: '获取完整资料' },
  { word: '回复666领取', reason: '诱导刷量与机器互动违规行为', replacement: '在后台获取' },
  { word: '回复关键词免费领', reason: '过度利用关键词诱导私域引流可能触发账号风控', replacement: '在后台留言交流' },
  { word: '点击在看送', reason: '诱导点在看送福利，属微信公众平台明确禁止的诱导互动', replacement: '感谢点亮在看与支持' },
  { word: '集赞', reason: '集赞有奖活动极易被微信官方判定为诱导关注并封禁功能', replacement: '参与互动' },
  { word: '不转不是中国人', reason: '道德绑架与违规诱导转发，微信直接拦截并惩罚账号', replacement: '' },
  { word: '必转', reason: '夸大引诱传播', replacement: '建议收藏' },
];

/**
 * 执行内容全面安全审计
 */
export function performSafetyAudit(params: {
  markdown: string;
  title?: string;
  digest?: string;
  inlinedHtml?: string;
}): SafetyAuditReport {
  const issues: SensitiveIssue[] = [];
  const fullText = `${params.title || ''}\n${params.digest || ''}\n${params.markdown || ''}`;
  const charCount = fullText.length;
  const htmlLength = (params.inlinedHtml || '').length;
  const isHtmlOversized = htmlLength > 20000;

  // 1. 检查广告法极限词
  for (const item of AD_EXTREME_WORDS) {
    let index = 0;
    while ((index = fullText.indexOf(item.word, index)) !== -1) {
      issues.push({
        id: `ad-${item.word}-${index}`,
        type: 'ad_extreme',
        severity: 'medium',
        title: `广告法绝对化词汇：「${item.word}」`,
        matchedText: item.word,
        replacement: item.replacement,
        description: `包含可能违反广告法绝对化禁用词，建议替换为「${item.replacement}」(${item.reason})。`,
        position: index,
      });
      index += item.word.length;
    }
  }

  // 2. 检查微信诱导分享与关注
  for (const item of INDUCE_WORDS) {
    let index = 0;
    while ((index = fullText.indexOf(item.word, index)) !== -1) {
      issues.push({
        id: `induce-${item.word}-${index}`,
        type: 'induce_sharing',
        severity: 'high',
        title: `微信诱导分享风险：「${item.word}」`,
        matchedText: item.word,
        replacement: item.replacement,
        description: item.reason,
        position: index,
      });
      index += item.word.length;
    }
  }

  // 3. 检查外部超链接 (非微信官方白名单链接)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownLinkRegex.exec(params.markdown)) !== null) {
    const url = match[2];
    const isWechatDomain =
      url.includes('qq.com') ||
      url.includes('weixin.qq.com') ||
      url.includes('mp.weixin.qq.com') ||
      url.includes('github.com'); // Github 链接一般作为开源说明

    if (!isWechatDomain) {
      issues.push({
        id: `link-${issues.length}`,
        type: 'external_link',
        severity: 'low',
        title: `外部未报备超链接：${new URL(url).hostname || url}`,
        matchedText: match[0],
        description: `微信文章对非微信体系的外链点击会有安全拦截或无法直接跳转，建议转化为阅读原文引导或文末版权注明。`,
      });
    }
  }

  // 4. 检查微信草稿箱 HTML 20,000 字符硬性限制
  if (isHtmlOversized) {
    issues.push({
      id: 'html-length-oversized',
      type: 'html_length',
      severity: 'high',
      title: `HTML 排版总字符数 (${htmlLength}) 超过微信 API 20,000 限制`,
      matchedText: `${htmlLength} 字符`,
      description: `微信草稿箱 API 限制整篇 HTML 不得超过 20,000 字符。建议通过工具栏精简样式，或点击「复制微信排版」在网页版微信后台直接粘贴（网页后台无此限制）。`,
    });
  } else if (htmlLength > 18000) {
    issues.push({
      id: 'html-length-warning',
      type: 'html_length',
      severity: 'medium',
      title: `HTML 排版总字符数 (${htmlLength}) 接近 20,000 字符预警线`,
      matchedText: `${htmlLength} 字符`,
      description: `排版体积已达 ${Math.round((htmlLength / 20000) * 100)}%，若追加大量图片或复杂表格可能会导致草稿创建失败。`,
    });
  }

  // 计算健康得分 (满分 100)
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  let deduction = highCount * 25 + mediumCount * 10 + lowCount * 4;
  let score = Math.max(10, 100 - deduction);

  let summary = '内容安全合规良好，未检测到高危违规风险。';
  if (highCount > 0) {
    summary = `检测到 ${highCount} 处高危合规风险（包含诱导分享或超长 HTML），强烈建议修正后再推送！`;
  } else if (mediumCount > 0) {
    summary = `检测到 ${mediumCount} 处疑似广告法绝对化用词，建议进行合规脱敏。`;
  }

  return {
    score,
    passed: highCount === 0,
    totalIssues: issues.length,
    highCount,
    mediumCount,
    lowCount,
    issues,
    summary,
    charCount,
    htmlLength,
    isHtmlOversized,
  };
}

/**
 * 一键合规自动脱敏修复 (Auto-Fix)
 * 将违规用词自动替换为安全词汇
 */
export function autoFixContent(markdown: string): { fixedMarkdown: string; replaceCount: number } {
  let text = markdown;
  let count = 0;

  // 替换广告法极限词
  for (const item of AD_EXTREME_WORDS) {
    if (text.includes(item.word) && item.replacement) {
      const reg = new RegExp(item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = text.match(reg);
      if (matches) {
        count += matches.length;
        text = text.replace(reg, item.replacement);
      }
    }
  }

  // 替换诱导分享词
  for (const item of INDUCE_WORDS) {
    if (text.includes(item.word) && item.replacement !== undefined) {
      const reg = new RegExp(item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = text.match(reg);
      if (matches) {
        count += matches.length;
        text = text.replace(reg, item.replacement);
      }
    }
  }

  return {
    fixedMarkdown: text,
    replaceCount: count,
  };
}
