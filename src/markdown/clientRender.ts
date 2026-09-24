import yaml from 'yaml';
import { createMarkdownRenderer } from './renderer.ts';
import { inlineWechatStyles } from './style.ts';
import { extractNewspicText } from './parser.ts';

export interface RenderResult {
  metadata: {
    title: string;
    author: string;
    digest: string;
    article_type: 'news' | 'newspic';
    images: string[];
    cover?: string;
    thumb_media_id?: string;
    comment: boolean;
    source_url?: string;
    theme: string;
    code_theme: string;
  };
  rawHtml: string;
  inlinedHtml: string;
  newspicCaption: string;
  theme: string;
  themeEnabled: boolean;
  charCount: number;
  htmlLength: number;
}

/**
 * Universal browser & desktop native Markdown parser and WeChat styler.
 * Uses 'yaml' for safe front-matter extraction without Node.js buffer dependencies,
 * markdown-it for AST generation, and juice for inline CSS styling.
 */
export function renderMarkdownLocally(
  markdownText: string,
  options: {
    theme?: string;
    themeEnabled?: boolean;
    macStyle?: boolean;
    codeTheme?: string;
    defaultAuthor?: string;
  } = {}
): RenderResult {
  const {
    theme = 'pie',
    themeEnabled = true,
    macStyle = true,
    codeTheme = 'github',
    defaultAuthor = '公众号作者',
  } = options;

  let frontMatterData: Record<string, any> = {};
  let content = markdownText;

  // 1. Extract Front Matter if present: ---\n...\n---
  const fmMatch = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    try {
      const parsed = yaml.parse(fmMatch[1]);
      if (parsed && typeof parsed === 'object') {
        frontMatterData = parsed;
      }
      content = markdownText.slice(fmMatch[0].length);
    } catch {
      // Ignore invalid YAML front-matter and treat as raw text
    }
  }

  // 2. Extract Title
  let title = typeof frontMatterData.title === 'string' ? frontMatterData.title.trim() : '';
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
    } else {
      title = '未命名微信公众号文章';
    }
  }

  // 3. Extract Author
  const author = (typeof frontMatterData.author === 'string' && frontMatterData.author.trim()
    ? frontMatterData.author.trim()
    : defaultAuthor
  ).slice(0, 16);

  // 4. Extract Digest
  let digest = typeof frontMatterData.digest === 'string' ? frontMatterData.digest.trim() : '';
  if (!digest) {
    const plainText = content
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*`_~>\-+=]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    digest = plainText.slice(0, 115) + (plainText.length > 115 ? '...' : '');
  } else if (digest.length > 120) {
    digest = digest.slice(0, 117) + '...';
  }

  // 5. Determine article type
  const rawType = String(frontMatterData.article_type || frontMatterData.type || '').trim().toLowerCase();
  const isNewspic = ['newspic', 'pic', 'image', '贴图', '图片消息', 'photo'].includes(rawType);
  const article_type: 'news' | 'newspic' = isNewspic ? 'newspic' : 'news';

  // 6. Collect images
  const imageSet = new Set<string>();
  if (typeof frontMatterData.cover === 'string' && frontMatterData.cover.trim()) {
    imageSet.add(frontMatterData.cover.trim());
  }
  if (Array.isArray(frontMatterData.images)) {
    frontMatterData.images.forEach((img: any) => {
      if (typeof img === 'string' && img.trim()) imageSet.add(img.trim());
    });
  }

  const mdImgRegex = /!\[.*?\]\((.*?)\)/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = mdImgRegex.exec(content)) !== null) {
    const src = imgMatch[1].trim().replace(/^<|>$/g, '');
    if (src) imageSet.add(src);
  }

  const allImages = Array.from(imageSet);
  const cover = typeof frontMatterData.cover === 'string' && frontMatterData.cover.trim()
    ? frontMatterData.cover.trim()
    : allImages[0] || '';

  const activeTheme = theme || frontMatterData.theme || 'pie';
  const activeCodeTheme = codeTheme || frontMatterData.code_theme || 'github';

  // 7. Markdown parsing & inline styling
  const renderer = createMarkdownRenderer({
    macStyle,
    codeTheme: activeCodeTheme,
  });

  const rawHtml = renderer.render(content);
  const inlinedHtml = inlineWechatStyles(rawHtml, activeTheme, themeEnabled);
  const newspicCaption = extractNewspicText(content);

  return {
    metadata: {
      title,
      author,
      digest,
      article_type,
      images: allImages,
      cover,
      thumb_media_id: typeof frontMatterData.thumb_media_id === 'string' ? frontMatterData.thumb_media_id.trim() : undefined,
      comment: frontMatterData.comment !== false,
      source_url: typeof frontMatterData.source_url === 'string' ? frontMatterData.source_url.trim() : undefined,
      theme: activeTheme,
      code_theme: activeCodeTheme,
    },
    rawHtml,
    inlinedHtml,
    newspicCaption,
    theme: activeTheme,
    themeEnabled,
    charCount: content.length,
    htmlLength: inlinedHtml.length,
  };
}
