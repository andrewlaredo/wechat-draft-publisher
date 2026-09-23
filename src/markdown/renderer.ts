import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export interface RenderOptions {
  macStyle?: boolean;
  codeTheme?: string;
}

export function createMarkdownRenderer(options: RenderOptions = {}): any {
  const md: any = new (MarkdownIt as any)({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      let highlightedCode = '';
      let detectedLang = lang || 'plaintext';

      if (lang && hljs.getLanguage(lang)) {
        try {
          highlightedCode = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        } catch {
          highlightedCode = md.utils.escapeHtml(str);
        }
      } else {
        try {
          const autoResult = hljs.highlightAuto(str);
          highlightedCode = autoResult.value;
          detectedLang = autoResult.language || 'text';
        } catch {
          highlightedCode = md.utils.escapeHtml(str);
        }
      }

      const macHeader = options.macStyle !== false
        ? `<div class="code-mac-header">
             <span class="mac-dot red"></span>
             <span class="mac-dot yellow"></span>
             <span class="mac-dot green"></span>
             <span class="mac-lang">${md.utils.escapeHtml(detectedLang)}</span>
           </div>`
        : '';

      return `<div class="code-block-wrapper">
        ${macHeader}
        <pre class="hljs"><code class="hljs language-${detectedLang}">${highlightedCode}</code></pre>
      </div>`;
    },
  });

  // Custom link renderer: WeChat articles do not support external <a> hyperlinks for unverified/most accounts,
  // so we can render them clearly with descriptive footnote or text styling
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens: any, idx: any, opt: any, _env: any, self: any) => self.renderToken(tokens, idx, opt));
  md.renderer.rules.link_open = (tokens: any, idx: any, opt: any, env: any, self: any) => {
    tokens[idx].attrSet('class', 'wechat-link');
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
    return defaultLinkOpen(tokens, idx, opt, env, self);
  };

  // Custom table renderer: wrap table with responsive scroll container
  const defaultTableOpen = md.renderer.rules.table_open || ((tokens: any, idx: any, opt: any, _env: any, self: any) => self.renderToken(tokens, idx, opt));
  md.renderer.rules.table_open = (tokens: any, idx: any, opt: any, env: any, self: any) => {
    return `<div class="wechat-table-wrapper">${defaultTableOpen(tokens, idx, opt, env, self)}`;
  };
  const defaultTableClose = md.renderer.rules.table_close || ((tokens: any, idx: any, opt: any, _env: any, self: any) => self.renderToken(tokens, idx, opt));
  md.renderer.rules.table_close = (tokens: any, idx: any, opt: any, env: any, self: any) => {
    return `${defaultTableClose(tokens, idx, opt, env, self)}</div>`;
  };

  return md;
}

/**
 * Optimize HTML structure for WeChat Official Account editor (UEditor):
 * 1. Unwrap <p> inside <li> so block margins or line breaks don't create blank bullet items or extra height
 * 2. Remove any accidental empty <li> items (e.g. whitespace, <br>, &nbsp;)
 * 3. Strip all newlines and whitespace between list elements (<ul>, <ol>, <li>, </li>, </ul>, </ol>).
 *    In WeChat's rich text editor, any text node (such as '\n') directly inside <ul> or <ol>
 *    is parsed by UEditor as an empty <li>, producing duplicate phantom bullet points!
 * 4. Strip whitespace between table elements (<table>, <thead>, <tbody>, <tr>, <th>, <td>).
 */
export function optimizeWechatHtml(html: string): string {
  let res = html;

  // 1. Unwrap <p> inside <li> so block margins don't break list layout
  res = res.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (_match, attrs, content) => {
    let inner = content
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1<br>')
      .replace(/(?:<br\s*\/?>\s*)+$/, '')
      .trim();
    return `<li${attrs}>${inner}</li>`;
  });

  // 2. Remove redundant empty <li> tags (e.g. empty, spaces, <br>, &nbsp;)
  res = res.replace(/<li[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/li>/gi, '');

  // 3. Remove all whitespace and newlines between list elements
  let prev = '';
  do {
    prev = res;
    res = res
      .replace(/(<(?:ul|ol)[^>]*>)\s+/gi, '$1')
      .replace(/\s+(<\/(?:ul|ol)>)/gi, '$1')
      .replace(/(<\/li>)\s+(<li[^>]*>)/gi, '$1$2')
      .replace(/(<(?:ul|ol)[^>]*>)\s+(<li[^>]*>)/gi, '$1$2')
      .replace(/(<\/li>)\s+(<\/(?:ul|ol)>)/gi, '$1$2')
      .replace(/(<\/li>)\s+(<(?:ul|ol)[^>]*>)/gi, '$1$2')
      .replace(/(<\/(?:ul|ol)>)\s+(<\/li>)/gi, '$1$2')
      .replace(/(<br\s*\/?>)\s+(<(?:ul|ol)[^>]*>)/gi, '$1$2');
  } while (res !== prev);

  // 4. Remove whitespaces between table elements
  do {
    prev = res;
    res = res.replace(/(<\/?(?:table|thead|tbody|tr)[^>]*>)\s+(<\/?(?:table|thead|tbody|tr|th|td)[^>]*>)/gi, '$1$2');
  } while (res !== prev);

  return res;
}

/**
 * Sanitize HTML according to WeChat Official Account platform restrictions:
 * - No <script> tags
 * - No <iframe> tags
 * - No <style> tags (styles must be 100% inlined via juice)
 * - No on* event handler attributes (onclick, onload, etc.)
 * - Clean up list and table tags to eliminate phantom bullets and layout anomalies
 */
export function sanitizeWechatHtml(html: string): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return optimizeWechatHtml(cleaned);
}
