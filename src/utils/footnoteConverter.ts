/**
 * footnoteConverter.ts
 * 微信公众号外链智能转文末优雅脚注与参考资料卡 (Link-to-Footnote Generator)
 * 
 * 核心功能：
 * 1. 扫描正文中所有 Markdown 外部超链接 [标题](URL)
 * 2. 转换为学术/大厂论文级角标引用（如 `盘古之白 ^[1]` 或 `[1]`）
 * 3. 在文末自动生成 100% 微信富文本内联样式的「参考资料与延伸阅读」高质感卡片
 * 4. 彻底解决微信公众号正文无法直接点击外部链接的硬伤
 */

export interface ExternalLinkItem {
  id: number;
  text: string;
  url: string;
  isWeChatInternal: boolean;
  rawMatch: string;
}

const FOOTNOTE_SECTION_HEADER = '📚 参考资料与延伸阅读';

/**
 * 扫描 Markdown 中所有的外部超链接
 */
export function scanExternalLinks(markdown: string): ExternalLinkItem[] {
  if (!markdown) return [];

  // 截断已有的脚注区域，避免重复扫描脚注卡片内部的 URL
  const existingFootnoteIdx = markdown.indexOf(FOOTNOTE_SECTION_HEADER);
  const targetMarkdown = existingFootnoteIdx !== -1 ? markdown.substring(0, existingFootnoteIdx) : markdown;

  // 保护代码块不被扫描
  const textWithoutCode = targetMarkdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');

  const links: ExternalLinkItem[] = [];
  // 排除图片语法 ![alt](src)
  const linkRegex = /(?:^|[^!])\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = linkRegex.exec(textWithoutCode)) !== null) {
    const text = match[1].trim();
    const url = match[2].trim();
    const isWeChat = url.includes('mp.weixin.qq.com') || url.includes('weixin.qq.com');

    links.push({
      id: counter++,
      text,
      url,
      isWeChatInternal: isWeChat,
      rawMatch: match[0].startsWith('[') ? match[0] : match[0].slice(1),
    });
  }

  return links;
}

export interface ConvertOptions {
  includeWeChatLinks?: boolean;
  footnoteStyle?: 'superscript' | 'bracket'; // ^[1] or [1]
  cardStyle?: 'modern_card' | 'classic_list' | 'minimal_table';
}

/**
 * 将 Markdown 文本中的外链一键转换为文末脚注，并附加参考资料卡片
 */
export function convertLinksToFootnotes(
  markdown: string,
  options: ConvertOptions = {}
): {
  convertedMarkdown: string;
  linkCount: number;
  convertedLinks: ExternalLinkItem[];
} {
  const {
    includeWeChatLinks = false,
    footnoteStyle = 'superscript',
  } = options;

  if (!markdown) {
    return { convertedMarkdown: '', linkCount: 0, convertedLinks: [] };
  }

  // 如果已经包含参考资料区块，先分离已有正文与参考资料区
  let bodyContent = markdown;
  const existingFootnoteIdx = markdown.indexOf('<!-- [WECHAT_COMPONENT id="wechat-footnotes"');
  const altFootnoteIdx = markdown.indexOf(FOOTNOTE_SECTION_HEADER);
  const splitIdx = existingFootnoteIdx !== -1 ? existingFootnoteIdx : (altFootnoteIdx !== -1 ? markdown.lastIndexOf('---', altFootnoteIdx) : -1);

  if (splitIdx !== -1) {
    bodyContent = markdown.substring(0, splitIdx).trim();
  }

  // 1. 保护代码块与数学公式不被转换
  const codeBlocks: string[] = [];
  let masked = bodyContent.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  const convertedLinks: ExternalLinkItem[] = [];
  let counter = 1;

  // 2. 查找并替换外链
  masked = masked.replace(/(?:^|[^!])\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (fullMatch, text, url) => {
    const prefix = fullMatch.startsWith('[') ? '' : fullMatch[0];
    const isWeChat = url.includes('mp.weixin.qq.com') || url.includes('weixin.qq.com');

    // 如果不转换微信内部链接且是微信链接，保持原样
    if (!includeWeChatLinks && isWeChat) {
      return fullMatch;
    }

    const currentId = counter++;
    convertedLinks.push({
      id: currentId,
      text,
      url,
      isWeChatInternal: isWeChat,
      rawMatch: `[${text}](${url})`,
    });

    const marker = footnoteStyle === 'superscript' ? `^[${currentId}]` : `[${currentId}]`;
    return `${prefix}${text} ${marker}`;
  });

  // 3. 还原代码块
  let result = masked.replace(/___CODE_BLOCK_(\d+)___/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  // 4. 如果有转换成功的链接，在文末生成高质感微信参考资料卡片
  if (convertedLinks.length > 0) {
    const referenceSection = generateFootnoteSectionMarkdown(convertedLinks);
    result = `${result.trim()}\n\n${referenceSection}\n`;
  }

  return {
    convertedMarkdown: result,
    linkCount: convertedLinks.length,
    convertedLinks,
  };
}

/**
 * 生成规范美观的微信文末参考资料区 Markdown（附带组件包裹与内联样式）
 */
function generateFootnoteSectionMarkdown(links: ExternalLinkItem[]): string {
  const lines: string[] = [
    '<!-- [WECHAT_COMPONENT id="wechat-footnotes" name="外部参考资料与延伸阅读"] -->',
    '<section style="margin-top: 36px; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">',
    '  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">',
    '    <span style="font-size: 14px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">',
    `      ${FOOTNOTE_SECTION_HEADER}`,
    '    </span>',
    '    <span style="font-size: 11px; color: #64748b;">(受微信限制无法直跳，建议复制查阅)</span>',
    '  </div>',
    '  <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.8; color: #334155;">',
  ];

  for (const item of links) {
    lines.push(
      `    <li style="margin-bottom: 6px; word-break: break-all;">`,
      `      <strong style="color: #0f172a;">${item.text}</strong>: `,
      `      <span style="color: #2563eb; font-family: SFMono-Regular, Consolas, monospace; font-size: 11px; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">${item.url}</span>`,
      `    </li>`
    );
  }

  lines.push('  </ol>', '</section>', '<!-- [/WECHAT_COMPONENT] -->');
  return lines.join('\n');
}

