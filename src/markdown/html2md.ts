import TurndownService from 'turndown';

/**
 * Detects whether a string contains HTML markup outside of code blocks and inline code.
 * If false, the content is already pure Markdown and should not be processed by Turndown.
 */
export function isHtmlContent(content: string): boolean {
  if (!content || !content.trim()) return false;

  // 1. Remove fenced code blocks (```...``` and ~~~...~~~) so code examples don't trigger HTML detection
  let stripped = content.replace(/(?:```|~~~)[a-zA-Z0-9_-]*\r?\n[\s\S]*?\r?\n(?:```|~~~)/g, '');

  // 2. Remove inline code (`...`)
  stripped = stripped.replace(/`[^`\r\n]+`/g, '');

  // 3. Remove HTML comments
  stripped = stripped.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Test for HTML structural and formatting tags commonly found in rich-text / WeChat articles
  const htmlTagRegex = /<\/?(?:section|article|div|p|span|h[1-6]|table|thead|tbody|tr|td|th|ul|ol|li|blockquote|pre|code|strong|b|em|i|img|a|br|hr|figure|figcaption|header|footer|mp-common-profile)\b[^>]*>/i;

  return htmlTagRegex.test(stripped);
}

/**
 * High-fidelity HTML to Markdown converter tailored for WeChat Public Account articles.
 * Transforms WeChat rich-text HTML (with extensive inline styles and section tags)
 * back into clean, pure, idiomatic Markdown.
 *
 * If the input content is already pure Markdown, it returns the input unchanged to prevent
 * format destruction or accidental character escaping.
 */
export function wechatHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return '';

  // Guard: If the content is already pure Markdown (no HTML tags outside code blocks),
  // return it directly without running Turndown (which would collapse newlines and mangle markdown syntax)
  if (!isHtmlContent(html)) {
    return html;
  }

  // 1. Pre-process: Clean up WeChat-specific wrappers and scripts
  let cleaned = html
    // Remove scripts and style blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove svg badges or mac dots
    .replace(/<span class="mac-dot[^"]*"><\/span>/gi, '')
    .replace(/<div class="code-header"[^>]*>[\s\S]*?<\/div>/gi, '');

  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // CRITICAL: Override Turndown's default escape method to prevent escaping standard markdown characters
  // (Turndown by default aggressively escapes *, _, [, ], `, #, etc., which breaks existing markdown elements)
  td.escape = (str: string) => str;

  // Keep br as newline
  td.addRule('lineBreak', {
    filter: 'br',
    replacement: () => '  \n',
  });

  // Extract real image URL from WeChat images (often in data-src)
  td.addRule('wechatImage', {
    filter: 'img',
    replacement: (_content, node: any) => {
      const src =
        node.getAttribute('data-src') ||
        node.getAttribute('src') ||
        node.getAttribute('data-original') ||
        '';
      if (!src || src.startsWith('data:image/svg')) return '';
      const alt = node.getAttribute('alt') || node.getAttribute('title') || '图片';
      return `\n\n![${alt.trim()}](${src.trim()})\n\n`;
    },
  });

  // Extract fenced code block with language
  td.addRule('wechatCodeBlock', {
    filter: (node) => {
      return (
        node.nodeName === 'PRE' ||
        (node.nodeName === 'CODE' && node.parentNode?.nodeName === 'PRE')
      );
    },
    replacement: (_content, node: any) => {
      // Find code element
      const codeNode = node.nodeName === 'PRE' ? node.querySelector('code') || node : node;
      const text = codeNode.textContent || '';
      
      // Try to determine language from class (e.g. language-js, hljs ts, etc.)
      const classAttr =
        codeNode.getAttribute('class') ||
        node.getAttribute('class') ||
        node.getAttribute('data-lang') ||
        '';
      let lang = '';
      const langMatch = classAttr.match(/(?:language-|lang-)([a-zA-Z0-9_-]+)/i);
      if (langMatch) {
        lang = langMatch[1];
      } else {
        const hljsMatch = classAttr.match(/hljs\s+([a-zA-Z0-9_-]+)/i);
        if (hljsMatch) lang = hljsMatch[1];
      }

      return `\n\n\`\`\`${lang}\n${text.trim()}\n\`\`\`\n\n`;
    },
  });

  // Preserve table structure
  td.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content) => ` ${content.trim().replace(/\n+/g, ' ')} |`,
  });

  td.addRule('tableRow', {
    filter: 'tr',
    replacement: (content, node: any) => {
      const isHeader =
        node.parentNode?.nodeName === 'THEAD' ||
        node.querySelector('th') !== null ||
        node.getAttribute('class')?.includes('header');
      let border = '';
      if (isHeader) {
        const cellCount = Math.max(1, node.children.length);
        border = '\n| ' + Array(cellCount).fill('---').join(' | ') + ' |';
      }
      return `\n| ${content.trim()}${border}`;
    },
  });

  // Simplify section/div wrappers
  td.addRule('unwrapSection', {
    filter: ['section', 'article'],
    replacement: (content) => `\n${content}\n`,
  });

  // Convert
  let md = td.turndown(cleaned);

  // Post-processing cleanup
  md = md
    // Decode HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Normalize excessive blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
}
