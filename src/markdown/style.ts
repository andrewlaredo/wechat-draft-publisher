import juice from 'juice';
import { sanitizeWechatHtml } from './renderer.ts';
import { logger } from '../utils/logger.ts';

export interface ThemeConfig {
  name: string;
  label: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  bgColor: string;
  cardBg: string;
  borderColor: string;
  codeBg: string;
  codeColor: string;
  headerStyle?: 'pie' | 'orangeheart' | 'border-left' | 'clean';
}

export const WECHAT_THEMES: Record<string, ThemeConfig> = {
  pie: {
    name: 'pie',
    label: '极客红·探索 (推荐)',
    description: '现代数字科技红，精致左侧色条与清晰层级，亲和自然',
    primaryColor: '#da282a',
    secondaryColor: '#fff2f0',
    accentColor: '#f27f79',
    textColor: '#2b2b2b',
    mutedTextColor: '#8c8c8c',
    bgColor: '#ffffff',
    cardBg: '#fafafa',
    borderColor: '#ffd8d6',
    codeBg: '#282c34',
    codeColor: '#abb2bf',
    headerStyle: 'pie',
  },
  orangeheart: {
    name: 'orangeheart',
    label: '暖心橙 OrangeHeart',
    description: '温润珊瑚橙色调与优雅版面，适合教程指南与干货分享',
    primaryColor: '#ef7060',
    secondaryColor: '#fff5f3',
    accentColor: '#e6514e',
    textColor: '#2c3e50',
    mutedTextColor: '#7f8c8d',
    bgColor: '#ffffff',
    cardBg: '#fefaf9',
    borderColor: '#fed7d2',
    codeBg: '#292d3e',
    codeColor: '#bfc7d5',
    headerStyle: 'orangeheart',
  },
  lapis: {
    name: 'lapis',
    label: '青金石 Lapis',
    description: '典雅静谧蓝灰，层次分明，适合深度阅读与学术随笔',
    primaryColor: '#4870ac',
    secondaryColor: '#f0f4f9',
    accentColor: '#688ebf',
    textColor: '#34495e',
    mutedTextColor: '#7f8c8d',
    bgColor: '#ffffff',
    cardBg: '#f8fafc',
    borderColor: '#dbe3ed',
    codeBg: '#263238',
    codeColor: '#eeffff',
    headerStyle: 'border-left',
  },
  phycat: {
    name: 'phycat',
    label: '薄荷绿 Phycat',
    description: '清爽薄荷绿，层次分明，护眼舒适，适合科普与日常笔记',
    primaryColor: '#10a37f',
    secondaryColor: '#e6f7f2',
    accentColor: '#0d9488',
    textColor: '#1f2937',
    mutedTextColor: '#6b7280',
    bgColor: '#ffffff',
    cardBg: '#f6fbf9',
    borderColor: '#cceee3',
    codeBg: '#1e293b',
    codeColor: '#e2e8f0',
    headerStyle: 'border-left',
  },
  'tech-blue': {
    name: 'tech-blue',
    label: '极客湛蓝 Tech Blue',
    description: '现代极客湛蓝，适合工程技术、数码教程与架构解析',
    primaryColor: '#1e80ff',
    secondaryColor: '#eff6ff',
    accentColor: '#3b82f6',
    textColor: '#1e293b',
    mutedTextColor: '#64748b',
    bgColor: '#ffffff',
    cardBg: '#f8fafc',
    borderColor: '#dbeafe',
    codeBg: '#1e293b',
    codeColor: '#e2e8f0',
    headerStyle: 'border-left',
  },
  medium: {
    name: 'medium',
    label: '素雅黑白 Monochrome',
    description: '经典纯粹排版，高对比度黑白灰，回归深度文字阅读',
    primaryColor: '#111827',
    secondaryColor: '#f3f4f6',
    accentColor: '#4b5563',
    textColor: '#27272a',
    mutedTextColor: '#71717a',
    bgColor: '#ffffff',
    cardBg: '#fafafa',
    borderColor: '#e5e7eb',
    codeBg: '#1f2937',
    codeColor: '#f3f4f6',
    headerStyle: 'clean',
  },
  'warm-paper': {
    name: 'warm-paper',
    label: '暖纸人文 Warm Paper',
    description: '柔和羊皮纸暖色调，护眼耐读，文史哲与深度随笔优选',
    primaryColor: '#92400e',
    secondaryColor: '#fef3c7',
    accentColor: '#b45309',
    textColor: '#374151',
    mutedTextColor: '#78716c',
    bgColor: '#fdfbf7',
    cardBg: '#f7f2ea',
    borderColor: '#e7e0d3',
    codeBg: '#292524',
    codeColor: '#fafaf9',
    headerStyle: 'border-left',
  },
  sakura: {
    name: 'sakura',
    label: '浅绛绯红 Sakura',
    description: '雅致诗意绯红，适合美学艺术、生活方式与品牌专栏',
    primaryColor: '#e11d48',
    secondaryColor: '#fff1f2',
    accentColor: '#f43f5e',
    textColor: '#334155',
    mutedTextColor: '#64748b',
    bgColor: '#ffffff',
    cardBg: '#fff5f7',
    borderColor: '#fecdd3',
    codeBg: '#1f2937',
    codeColor: '#f9fafb',
    headerStyle: 'border-left',
  },
  default: {
    name: 'default',
    label: '清新竹绿 (微信经典)',
    description: '微信官方翡翠绿，清爽自然，通用自媒体资讯排版',
    primaryColor: '#07c160',
    secondaryColor: '#eefbf3',
    accentColor: '#10b981',
    textColor: '#2c3e50',
    mutedTextColor: '#64748b',
    bgColor: '#ffffff',
    cardBg: '#f7fdf9',
    borderColor: '#d1f2de',
    codeBg: '#282c34',
    codeColor: '#abb2bf',
    headerStyle: 'border-left',
  },
};

/**
 * Generate native, distraction-free WeChat article CSS (used when theme switch is turned OFF)
 */
export function generateNativeCss(): string {
  return `
    .wechat-article-container {
      box-sizing: border-box;
      max-width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #24292f;
      background-color: #ffffff;
      word-break: break-word;
      overflow-wrap: break-word;
      overflow-x: hidden;
      letter-spacing: 0.034em;
      padding: 16px 8px;
    }

    p {
      margin-top: 1.25em;
      margin-bottom: 1.25em;
      font-size: 16px;
      line-height: 1.8;
      color: #24292f;
      text-align: justify;
      letter-spacing: 0.034em;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2328;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 8px;
      margin-top: 2em;
      margin-bottom: 1em;
    }

    h2 {
      font-size: 18px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2328;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 6px;
      margin-top: 2em;
      margin-bottom: 0.9em;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      color: #24292f;
      margin-top: 1.6em;
      margin-bottom: 0.7em;
    }

    h4, h5, h6 {
      font-size: 15px;
      font-weight: 600;
      color: #24292f;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }

    blockquote {
      margin: 1.4em 0;
      padding: 10px 16px;
      background-color: #f6f8fa;
      border-left: 4px solid #d0d7de;
      border-radius: 0 4px 4px 0;
      color: #57606a;
      font-size: 15px;
      line-height: 1.75;
    }

    blockquote p {
      margin: 0.3em 0;
      font-size: 15px;
      color: #57606a;
    }

    ul {
      margin: 1.1em 0;
      padding-left: 22px;
      color: #24292f;
      font-size: 16px;
      line-height: 1.8;
      list-style-type: disc;
    }

    ol {
      margin: 1.1em 0;
      padding-left: 22px;
      color: #24292f;
      font-size: 16px;
      line-height: 1.8;
      list-style-type: decimal;
    }

    li {
      margin-top: 0.35em;
      margin-bottom: 0.35em;
      line-height: 1.8;
      color: #24292f;
    }

    li > ul,
    li > ol {
      margin: 0.3em 0;
      padding-left: 18px;
    }

    li p {
      margin: 0;
      padding: 0;
      display: inline;
      line-height: inherit;
    }

    .code-block-wrapper {
      box-sizing: border-box;
      max-width: 100%;
      margin: 1.5em 0;
      border-radius: 6px;
      overflow: hidden;
      background-color: #24292f;
    }

    .code-mac-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .mac-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .mac-dot.red { background-color: #ff5f56; }
    .mac-dot.yellow { background-color: #ffbd2e; }
    .mac-dot.green { background-color: #27c93f; }

    .mac-lang {
      margin-left: auto;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    pre.hljs {
      box-sizing: border-box;
      max-width: 100%;
      margin: 0;
      padding: 12px 14px;
      overflow-x: auto;
      background-color: #24292f;
      color: #e6edf3;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 13.5px;
      line-height: 1.6;
    }

    code.hljs {
      background: transparent;
      padding: 0;
      font-family: inherit;
    }

    p code, li code, blockquote code {
      background-color: #f6f8fa;
      color: #1f2328;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 14px;
      margin: 0 3px;
      border: 1px solid #d0d7de;
    }

    .wechat-table-wrapper {
      box-sizing: border-box;
      max-width: 100%;
      margin: 1.5em 0;
      overflow-x: auto;
      border: 1px solid #d0d7de;
      border-radius: 6px;
    }

    table {
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      line-height: 1.6;
    }

    th {
      background-color: #f6f8fa;
      color: #24292f;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      color: #24292f;
    }

    tr:nth-child(even) td {
      background-color: #fafbfc;
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 1.5em auto;
      border-radius: 4px;
    }

    hr {
      border: 0;
      height: 1px;
      background-color: #d0d7de;
      margin: 2em 0;
    }

    a, .wechat-link {
      color: #0969da;
      text-decoration: underline;
      word-break: break-all;
    }

    strong {
      font-weight: 700;
      color: #1f2328;
    }

    em {
      font-style: italic;
      color: #57606a;
    }

    .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #ff7b72; font-weight: bold; }
    .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition { color: #7ee787; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #8b949e; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-link { color: #79c0ff; }
    .hljs-variable, .hljs-tag, .hljs-name { color: #ffa657; }
    .hljs-symbol, .hljs-bullet { color: #d2a8ff; }
    .hljs-built_in, .hljs-class .hljs-title { color: #ffa657; }
  `;
}

/**
 * Generate exquisite theme typography CSS inspired by @wenyan-md/core
 */
export function generateThemeCss(themeName = 'pie'): string {
  if (themeName && !WECHAT_THEMES[themeName]) {
    logger.warn(`未知主题 "${themeName}"，已自动回退至 pie 主题`);
  }
  const theme = WECHAT_THEMES[themeName] || WECHAT_THEMES.pie || WECHAT_THEMES.default;

  // Custom headings based on theme archetype
  let h1Css = `
    font-size: 22px;
    font-weight: 700;
    line-height: 1.4;
    color: #111827;
    border-bottom: 2px solid ${theme.primaryColor};
    padding-bottom: 8px;
    margin-top: 2em;
    margin-bottom: 1em;
  `;

  let h2Css = `
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
    color: #111827;
    border-left: 4px solid ${theme.primaryColor};
    padding-left: 10px;
    margin-top: 2em;
    margin-bottom: 0.9em;
  `;

  let h3Css = `
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    color: ${theme.primaryColor};
    margin-top: 1.6em;
    margin-bottom: 0.7em;
  `;

  if (theme.headerStyle === 'pie') {
    // 极客红 (Pie style): elegant centered or bordered title & left vertical thick border
    h1Css = `
      font-size: 22px;
      font-weight: 700;
      line-height: 1.4;
      color: #18181b;
      border-bottom: 2px dashed ${theme.primaryColor};
      padding-bottom: 10px;
      margin-top: 2em;
      margin-bottom: 1.2em;
    `;
    h2Css = `
      font-size: 18px;
      font-weight: 700;
      line-height: 1.4;
      color: #18181b;
      border-left: 5px solid ${theme.primaryColor};
      padding-left: 12px;
      margin-top: 2.2em;
      margin-bottom: 1em;
    `;
    h3Css = `
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      color: #27272a;
      border-left: 3px solid ${theme.accentColor};
      padding-left: 8px;
      margin-top: 1.6em;
      margin-bottom: 0.8em;
    `;
  } else if (theme.headerStyle === 'orangeheart') {
    // 暖心橙 (OrangeHeart / evgo2017) style: clean title with border bottom accent line
    h1Css = `
      font-size: 22px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2937;
      border-bottom: 2px solid ${theme.primaryColor};
      padding-bottom: 8px;
      margin-top: 2em;
      margin-bottom: 1.2em;
    `;
    h2Css = `
      font-size: 18px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2937;
      border-bottom: 2px solid ${theme.primaryColor};
      padding-bottom: 6px;
      margin-top: 2em;
      margin-bottom: 1em;
    `;
    h3Css = `
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      color: ${theme.primaryColor};
      margin-top: 1.6em;
      margin-bottom: 0.8em;
    `;
  } else if (theme.headerStyle === 'clean') {
    // Clean monochrome style
    h1Css = `
      font-size: 24px;
      font-weight: 800;
      line-height: 1.35;
      color: #111827;
      margin-top: 2em;
      margin-bottom: 1em;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    `;
    h2Css = `
      font-size: 19px;
      font-weight: 700;
      line-height: 1.4;
      color: #1f2937;
      margin-top: 1.8em;
      margin-bottom: 0.8em;
      padding-bottom: 4px;
      border-bottom: 1px solid #f3f4f6;
    `;
    h3Css = `
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      color: #374151;
      margin-top: 1.5em;
      margin-bottom: 0.6em;
    `;
  }

  return `
    .wechat-article-container {
      box-sizing: border-box;
      max-width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: ${theme.textColor};
      background-color: ${theme.bgColor};
      word-break: break-word;
      overflow-wrap: break-word;
      overflow-x: hidden;
      letter-spacing: 0.034em;
      padding: 18px 10px;
    }

    p {
      margin-top: 1.25em;
      margin-bottom: 1.25em;
      font-size: 16px;
      line-height: 1.8;
      color: ${theme.textColor};
      text-align: justify;
      letter-spacing: 0.034em;
    }

    h1 {
      ${h1Css}
    }

    h2 {
      ${h2Css}
    }

    h3 {
      ${h3Css}
    }

    h4, h5, h6 {
      font-size: 15px;
      font-weight: 600;
      color: ${theme.textColor};
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }

    blockquote {
      margin: 1.5em 0;
      padding: 12px 18px;
      background-color: ${theme.secondaryColor};
      border-left: 4px solid ${theme.primaryColor};
      border-radius: 0 6px 6px 0;
      color: #4b5563;
      font-size: 15px;
      line-height: 1.75;
    }

    blockquote p {
      margin: 0.3em 0;
      font-size: 15px;
      line-height: 1.75;
      color: #4b5563;
    }

    ul {
      margin: 1.1em 0;
      padding-left: 22px;
      color: ${theme.textColor};
      font-size: 16px;
      line-height: 1.8;
      list-style-type: disc;
    }

    ol {
      margin: 1.1em 0;
      padding-left: 22px;
      color: ${theme.textColor};
      font-size: 16px;
      line-height: 1.8;
      list-style-type: decimal;
    }

    li {
      margin-top: 0.35em;
      margin-bottom: 0.35em;
      line-height: 1.8;
      color: ${theme.textColor};
    }

    li > ul,
    li > ol {
      margin: 0.3em 0;
      padding-left: 18px;
    }

    li p {
      margin: 0;
      padding: 0;
      display: inline;
      line-height: inherit;
    }

    .code-block-wrapper {
      box-sizing: border-box;
      max-width: 100%;
      margin: 1.6em 0;
      border-radius: 8px;
      overflow: hidden;
      background-color: ${theme.codeBg};
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }

    .code-mac-header {
      display: flex;
      align-items: center;
      padding: 9px 14px;
      background-color: rgba(0, 0, 0, 0.22);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .mac-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .mac-dot.red { background-color: #ff5f56; }
    .mac-dot.yellow { background-color: #ffbd2e; }
    .mac-dot.green { background-color: #27c93f; }

    .mac-lang {
      margin-left: auto;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    pre.hljs {
      box-sizing: border-box;
      max-width: 100%;
      margin: 0;
      padding: 14px 16px;
      overflow-x: auto;
      background-color: ${theme.codeBg};
      color: ${theme.codeColor};
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 13.5px;
      line-height: 1.6;
    }

    code.hljs {
      background: transparent;
      padding: 0;
      font-family: inherit;
    }

    p code, li code, blockquote code {
      background-color: ${theme.secondaryColor};
      color: ${theme.primaryColor};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 14px;
      margin: 0 3px;
      border: 1px solid ${theme.borderColor};
    }

    .wechat-table-wrapper {
      box-sizing: border-box;
      max-width: 100%;
      margin: 1.6em 0;
      overflow-x: auto;
      border-radius: 6px;
      border: 1px solid ${theme.borderColor};
    }

    table {
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      line-height: 1.6;
    }

    th {
      background-color: ${theme.secondaryColor};
      color: ${theme.primaryColor};
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid ${theme.borderColor};
    }

    td {
      padding: 9px 14px;
      border-bottom: 1px solid ${theme.borderColor};
      color: ${theme.textColor};
    }

    tr:nth-child(even) td {
      background-color: ${theme.cardBg};
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 1.6em auto;
      border-radius: 6px;
    }

    hr {
      border: 0;
      height: 1px;
      background-color: ${theme.borderColor};
      margin: 2.2em 0;
    }

    a, .wechat-link {
      color: ${theme.primaryColor};
      text-decoration: none;
      border-bottom: 1px dashed ${theme.primaryColor};
      padding-bottom: 1px;
      word-break: break-all;
    }

    strong {
      font-weight: 700;
      color: ${theme.primaryColor};
    }

    em {
      font-style: italic;
      color: ${theme.mutedTextColor};
    }

    .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #d73a49; font-weight: bold; }
    .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-addition { color: #22863a; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #6a737d; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-link { color: #005cc5; }
    .hljs-variable, .hljs-tag, .hljs-name { color: #e36209; }
    .hljs-symbol, .hljs-bullet { color: #735c0f; }
    .hljs-built_in, .hljs-class .hljs-title { color: #6f42c1; }
  `;
}

/**
 * Normalizes inline style attributes before passing to Juice.
 * Prevents PostCSS parser crashes on HTML entity quotes (e.g. &quot;Courier New&quot;, &#39;Segoe UI&#39;).
 */
function sanitizeHtmlStylesBeforeJuice(html: string): string {
  return html.replace(/style=(["'])([\s\S]*?)\1/gi, (_match, quote, styleVal) => {
    const fixed = styleVal
      .replace(/&quot;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
    return `style=${quote}${fixed}${quote}`;
  });
}

export function inlineWechatStyles(
  rawHtml: string,
  themeName = 'pie',
  themeEnabled = true
): string {
  const css = themeEnabled ? generateThemeCss(themeName) : generateNativeCss();
  const wrappedHtml = `
    <section class="wechat-article-container">
      ${rawHtml}
    </section>
  `;

  let inlined = wrappedHtml;
  try {
    const safeHtml = sanitizeHtmlStylesBeforeJuice(wrappedHtml);
    // Juice inlines CSS directly onto each HTML element's style attribute
    inlined = juice.inlineContent(safeHtml, css, {
      preserveMediaQueries: false,
      applyWidthAttributes: false,
      applyHeightAttributes: false,
      removeStyleTags: true,
    });
  } catch (err: any) {
    logger.warn(`Juice 样式内联解析预警 (${err.message})，启用兜底安全清理模式...`);
    try {
      // Strip potentially malformed existing style attributes from raw HTML and re-inline
      const strippedHtml = wrappedHtml.replace(/style=(["'])([\s\S]*?)\1/gi, '');
      inlined = juice.inlineContent(strippedHtml, css, {
        preserveMediaQueries: false,
        applyWidthAttributes: false,
        applyHeightAttributes: false,
        removeStyleTags: true,
      });
    } catch {
      // Ultimate fallback: keep wrapped HTML structure
      inlined = wrappedHtml;
    }
  }

  // Final sanitizer to ensure no <script>, <iframe>, <style>, or on* handlers remain
  return sanitizeWechatHtml(inlined);
}
