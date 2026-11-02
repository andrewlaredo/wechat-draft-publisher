/**
 * xiaolvshuSlicer.ts
 * 微信小绿书 (3:4 九宫格图文卡片) 智能切片算法与版式主题
 */

export interface XiaolvshuCard {
  id: string;
  type: 'cover' | 'content' | 'ending';
  title: string;
  subtitle?: string;
  tag?: string;
  points: string[];
  quote?: string;
  imageUrl?: string;
  author?: string;
}

export interface XiaolvshuTheme {
  id: string;
  name: string;
  bgGradient: string;
  bgColor: string;
  textColor: string;
  titleColor: string;
  accentColor: string;
  tagBg: string;
  tagText: string;
  cardBorder: string;
  footerColor: string;
}

export const XIAOLVSHU_THEMES: XiaolvshuTheme[] = [
  {
    id: 'dark-minimal',
    name: '极简深空 (黑客科技)',
    bgColor: '#090d16',
    bgGradient: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
    titleColor: '#f8fafc',
    textColor: '#cbd5e1',
    accentColor: '#10b981',
    tagBg: 'rgba(16, 185, 129, 0.15)',
    tagText: '#34d399',
    cardBorder: '1px solid #1e293b',
    footerColor: '#64748b',
  },
  {
    id: 'warm-cream',
    name: '暖阳奶杏 (温润纸感)',
    bgColor: '#fdfbf7',
    bgGradient: 'linear-gradient(145deg, #fffdfa 0%, #f7f3eb 100%)',
    titleColor: '#292524',
    textColor: '#57534e',
    accentColor: '#ea580c',
    tagBg: '#ffedd5',
    tagText: '#c2410c',
    cardBorder: '1px solid #e7e5e4',
    footerColor: '#a8a29e',
  },
  {
    id: 'wechat-forest',
    name: '微信竹绿 (官方经典)',
    bgColor: '#ffffff',
    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f4fbf6 100%)',
    titleColor: '#0f172a',
    textColor: '#334155',
    accentColor: '#07c160',
    tagBg: '#e8f8ee',
    tagText: '#069c4e',
    cardBorder: '1px solid #e2e8f0',
    footerColor: '#94a3b8',
  },
  {
    id: 'black-gold',
    name: '黑金奢雅 (高端商业)',
    bgColor: '#141417',
    bgGradient: 'linear-gradient(145deg, #1c1c22 0%, #101013 100%)',
    titleColor: '#fef08a',
    textColor: '#e2e8f0',
    accentColor: '#eab308',
    tagBg: 'rgba(234, 179, 8, 0.15)',
    tagText: '#fde047',
    cardBorder: '1px solid #3f3f46',
    footerColor: '#71717a',
  },
  {
    id: 'editorial-magazine',
    name: '大牌杂志 (高冷极简)',
    bgColor: '#f8fafc',
    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
    titleColor: '#020617',
    textColor: '#334155',
    accentColor: '#0284c7',
    tagBg: '#e0f2fe',
    tagText: '#0369a1',
    cardBorder: '1px solid #cbd5e1',
    footerColor: '#64748b',
  },
  {
    id: 'fresh-avocado',
    name: '牛油果青 (清新活力)',
    bgColor: '#f4fbf7',
    bgGradient: 'linear-gradient(145deg, #f0fdf4 0%, #e2f6ea 100%)',
    titleColor: '#064e3b',
    textColor: '#065f46',
    accentColor: '#059669',
    tagBg: '#d1fae5',
    tagText: '#047857',
    cardBorder: '1px solid #a7f3d0',
    footerColor: '#6ee7b7',
  },
  {
    id: 'red-viral',
    name: '小红书爆款红 (高转化抓眼)',
    bgColor: '#fff5f5',
    bgGradient: 'linear-gradient(145deg, #fff1f2 0%, #ffe4e6 100%)',
    titleColor: '#881337',
    textColor: '#9f1239',
    accentColor: '#e11d48',
    tagBg: '#fecdd3',
    tagText: '#be123c',
    cardBorder: '1px solid #fda4af',
    footerColor: '#fb7185',
  },
  {
    id: 'morandi-purple',
    name: '莫兰迪柔紫 (知性高级感)',
    bgColor: '#fbf9fe',
    bgGradient: 'linear-gradient(145deg, #faf5ff 0%, #f3e8ff 100%)',
    titleColor: '#3b0764',
    textColor: '#581c87',
    accentColor: '#9333ea',
    tagBg: '#e9d5ff',
    tagText: '#7e22ce',
    cardBorder: '1px solid #d8b4fe',
    footerColor: '#c084fc',
  },
  {
    id: 'mint-cyan',
    name: '薄荷青冰 (轻爽数码)',
    bgColor: '#f0fdfa',
    bgGradient: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
    titleColor: '#134e4a',
    textColor: '#115e59',
    accentColor: '#0d9488',
    tagBg: '#99f6e4',
    tagText: '#0f766e',
    cardBorder: '1px solid #5eead4',
    footerColor: '#2dd4bf',
  },
];

/**
 * 将整篇 Markdown 与元数据智能切片为 3~8 张适合微信小绿书的 3:4 幻灯卡片
 */
export function sliceMarkdownToXiaolvshuCards(
  markdown: string,
  title: string = '2026 自动化排版实战指南',
  author: string = '数字游民',
  digest: string = ''
): XiaolvshuCard[] {
  const cards: XiaolvshuCard[] = [];

  // Card 1: 封面卡 (Cover)
  cards.push({
    id: 'card-cover',
    type: 'cover',
    title: title || '微信公众号自动化发布全攻略',
    subtitle: digest || '告别繁琐手动排版，一套闭环全自动分发',
    tag: '深度干货',
    author: author || '创作者',
    points: [
      '⚡ 3 秒极速直推微信草稿箱',
      '🎨 9 套官方标杆设计排版主题',
      '🛡️ 自动防超长截断与合规检测',
    ],
  });

  // 解析 Markdown 中的标题与段落
  const lines = markdown.split('\n');
  let currentHeading = '';
  let currentPoints: string[] = [];
  let currentQuote: string | undefined = undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 检测引用块作为金句 (> 引用)
    if (trimmed.startsWith('> ') || trimmed.startsWith('>')) {
      const q = trimmed.replace(/^>\s*/, '').replace(/[*_`]/g, '').trim();
      if (q.length > 3) {
        currentQuote = q;
      }
      continue;
    }

    // 检测 H2 / H3 标题
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (currentHeading && (currentPoints.length > 0 || currentQuote)) {
        cards.push({
          id: `card-content-${cards.length}`,
          type: 'content',
          title: currentHeading,
          quote: currentQuote,
          points: currentPoints.slice(0, 4),
          tag: `POINT 0${cards.length}`,
          author,
        });
        currentPoints = [];
        currentQuote = undefined;
      }
      currentHeading = trimmed.replace(/^#+\s*/, '').replace(/[《》【】]/g, '');
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      // 列表项
      const cleanItem = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/[*_`]/g, '');
      if (cleanItem.length > 4 && currentPoints.length < 4) {
        currentPoints.push(cleanItem);
      }
    } else if (trimmed.length > 15 && trimmed.length < 80 && !trimmed.startsWith('!') && !trimmed.startsWith('```')) {
      // 优质段落提取
      const cleanPara = trimmed.replace(/[*_`#]/g, '');
      if (currentPoints.length < 4 && !currentPoints.includes(cleanPara)) {
        currentPoints.push(cleanPara);
      }
    }

    if (cards.length >= 7) break; // 控制在微信小绿书黄金 6-8 张范围
  }

  // 如果剩余还有
  if (currentHeading && (currentPoints.length > 0 || currentQuote) && cards.length < 7) {
    cards.push({
      id: `card-content-${cards.length}`,
      type: 'content',
      title: currentHeading,
      quote: currentQuote,
      points: currentPoints.slice(0, 4),
      tag: `POINT 0${cards.length}`,
      author,
    });
  }

  // 保证至少有 2 张内容卡
  if (cards.length < 3) {
    cards.push({
      id: 'card-fallback-1',
      type: 'content',
      title: '核心优势与操作拆解',
      tag: 'POINT 01',
      author,
      points: [
        '一键编译兼容微信富文本内联样式',
        '永久素材库图片极速直传与复用',
        '双栏实时高仿真手机客户端预览',
      ],
    });
    cards.push({
      id: 'card-fallback-2',
      type: 'content',
      title: '避坑指南与最佳实践',
      tag: 'POINT 02',
      author,
      points: [
        '保持标题在 14~26 字符内，避免信息流折行截断',
        '合理使用金句高亮与步骤卡片，大幅提升阅读完播率',
        '多平台矩阵同步分发，放大单篇好文的长尾效应',
      ],
    });
  }

  // 尾页转化卡 (Ending CTA)
  cards.push({
    id: 'card-ending',
    type: 'ending',
    title: '总结与行动建议',
    tag: 'ACTION',
    author,
    quote: '“真正拉开差距的不是单次的灵感爆发，而是一套稳定可复利的自动化内容生产系统。”',
    points: [
      '👉 欢迎点击右下角「在看」与「赞」',
      '📌 关注公众号，第一时间获取每周前沿干货',
      '💬 留言区互动：你平时最耗时的排版痛点是什么？',
    ],
  });

  return cards;
}
