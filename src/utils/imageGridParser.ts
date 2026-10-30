/**
 * imageGridParser.ts
 * 微信公众号双图并排与多图网格排版解析器 (WeChat Multi-Image Grid Layout)
 * 
 * 微信富文本编辑器排版规则：
 * 1. 微信客户端对 CSS Grid / Flexbox 复杂嵌套常有兼容性问题或被 UEditor 移除。
 * 2. 采用 borderless 布局型 <table> (table-layout: fixed; width: 100%)，
 *    在 iOS、Android 与微信桌面客户端均 100% 绝对保持同一水平线并排，永不折行！
 * 3. 支持语法：
 *    ::: col-2 或 ::: grid-2 (双图并排)
 *    ![图1说明](url1)
 *    ![图2说明](url2)
 *    :::
 * 
 *    ::: col-3 或 ::: grid-3 (三图并排)
 *    ![图1说明](url1)
 *    ![图2说明](url2)
 *    ![图3说明](url3)
 *    :::
 */

export interface GridImageItem {
  alt: string;
  src: string;
}

/**
 * 将图片数组组装为 100% 微信富文本内联兼容的网格 HTML 表格
 */
export function buildWeChatImageGridHtml(images: GridImageItem[], cols: 2 | 3 = 2): string {
  if (!images || images.length === 0) return '';

  const colWidth = cols === 3 ? '33.333%' : '50%';
  const paddingX = cols === 3 ? '3px' : '4px';

  // Chunk images into rows of `cols`
  const rows: GridImageItem[][] = [];
  for (let i = 0; i < images.length; i += cols) {
    rows.push(images.slice(i, i + cols));
  }

  const tableRowsHtml = rows
    .map((row) => {
      const cellsHtml = row
        .map((img) => {
          const captionHtml = img.alt && img.alt.trim()
            ? `<div style="text-align: center; font-size: 11.5px; color: #64748b; margin-top: 6px; line-height: 1.4; word-break: break-all;">${escapeHtml(img.alt.trim())}</div>`
            : '';

          return `<td style="width: ${colWidth}; padding: 0 ${paddingX}; vertical-align: top; border: none !important; background: transparent !important; box-sizing: border-box;">
  <img src="${img.src.trim()}" alt="${escapeHtml(img.alt.trim())}" style="width: 100% !important; height: auto !important; display: block !important; border-radius: 6px; margin: 0 auto !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06);" />
  ${captionHtml}
</td>`;
        })
        .join('\n');

      return `<tr>${cellsHtml}</tr>`;
    })
    .join('\n');

  return `<section class="wechat-image-grid wechat-image-grid-${cols}" style="margin: 20px 0; max-width: 100%;">
  <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; border-spacing: 0 !important; table-layout: fixed !important; margin: 0 !important; padding: 0 !important; background: transparent !important;">
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>
</section>`;
}

/**
 * 扫描 Markdown 内容，解析并替换 `::: col-2` 和 `::: col-3` 容器为内联 HTML
 */
export function parseImageGridContainers(markdown: string): string {
  if (!markdown || !markdown.includes(':::')) return markdown;

  // Match ::: (col-2|grid-2|col-3|grid-3) ... :::
  const gridRegex = /:::\s*(col-2|grid-2|col-3|grid-3)\r?\n([\s\S]*?)\r?\n:::/g;

  return markdown.replace(gridRegex, (_match, typeStr, innerContent) => {
    const cols = typeStr.endsWith('3') ? 3 : 2;

    // Extract all images in innerContent
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    const images: GridImageItem[] = [];
    let imgMatch: RegExpExecArray | null;

    while ((imgMatch = imgRegex.exec(innerContent)) !== null) {
      const alt = imgMatch[1];
      const src = imgMatch[2].trim().replace(/^<|>$/g, '');
      if (src) {
        images.push({ alt, src });
      }
    }

    if (images.length === 0) {
      // If no images found, return original content without crashing
      return innerContent;
    }

    const gridHtml = buildWeChatImageGridHtml(images, cols);
    return `\n\n<!-- [WECHAT_COMPONENT image-grid] -->\n${gridHtml}\n<!-- [/WECHAT_COMPONENT] -->\n\n`;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
