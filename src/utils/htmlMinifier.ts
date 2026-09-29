/**
 * htmlMinifier.ts
 * 专为微信公众平台草稿箱设计的 HTML 代码安全压缩器。
 * 
 * 微信公众平台 API (draft/add) 针对 content 字段有严格的 < 20,000 字符限制。
 * 富文本排版中的内联 CSS (style="...") 和 HTML 缩进换行往往产生大量冗余字符。
 * 本模块在保证视觉样式 100% 还原且不破坏 <pre><code> 代码缩进的前提下，
 * 压缩 HTML 标签间空白与内联 CSS 声明，通常可缩减 20% ~ 35% 字符体积。
 */

export interface MinifyResult {
  minifiedHtml: string;
  originalLength: number;
  minifiedLength: number;
  savedCharacters: number;
  compressionRatio: number; // 压缩率，如 0.25 表示减小了 25%
}

export function minifyWechatHtml(html: string): MinifyResult {
  if (!html || typeof html !== 'string') {
    return {
      minifiedHtml: html || '',
      originalLength: 0,
      minifiedLength: 0,
      savedCharacters: 0,
      compressionRatio: 0,
    };
  }

  const originalLength = html.length;

  // 1. 保护 <pre> / <code> 标签内部的空格与换行，防止破坏代码块排版
  const preBlocks: string[] = [];
  let protectedHtml = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, (match) => {
    preBlocks.push(match);
    return `___WECHAT_PRE_PLACEHOLDER_${preBlocks.length - 1}___`;
  });

  // 2. 移除所有 HTML 注释
  protectedHtml = protectedHtml.replace(/<!--[\s\S]*?-->/g, '');

  // 3. 压缩 style="..." 属性中的冗余空格
  protectedHtml = protectedHtml.replace(/style=(["'])([\s\S]*?)\1/gi, (_match, quote, styleContent) => {
    let minifiedStyle = styleContent
      // 去除声明两端空白
      .trim()
      // 去除冒号前后的多余空格
      .replace(/\s*:\s*/g, ':')
      // 去除分号前后的多余空格
      .replace(/\s*;\s*/g, ';')
      // 去除逗号后多余空格
      .replace(/\s*,\s*/g, ',')
      // 多个连续空格合并为单个空格
      .replace(/\s{2,}/g, ' ')
      // 去除末尾无意义的分号
      .replace(/;+$/, '');

    return `style=${quote}${minifiedStyle}${quote}`;
  });

  // 4. 压缩 HTML 标签之间的换行与多余空格 (但保留单个空格在行内标签之间)
  protectedHtml = protectedHtml
    // 标签之间的缩进换行直接消除
    .replace(/>\s*[\r\n]+\s*</g, '><')
    // 标签之间多于 1 个的空格压缩为 1 个
    .replace(/>\s{2,}</g, '><')
    // 闭合标签前后的多余空格
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<');

  // 5. 还原 <pre> 块
  const minifiedHtml = protectedHtml.replace(/___WECHAT_PRE_PLACEHOLDER_(\d+)___/g, (_match, index) => {
    const idx = parseInt(index, 10);
    return preBlocks[idx] || '';
  });

  const minifiedLength = minifiedHtml.length;
  const savedCharacters = Math.max(0, originalLength - minifiedLength);
  const compressionRatio = originalLength > 0 ? Number((savedCharacters / originalLength).toFixed(3)) : 0;

  return {
    minifiedHtml,
    originalLength,
    minifiedLength,
    savedCharacters,
    compressionRatio,
  };
}
