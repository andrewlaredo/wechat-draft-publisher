import matter from 'gray-matter';
import path from 'path';
import { logger } from '../utils/logger.ts';

export interface ArticleFrontMatter {
  title?: string;
  author?: string;
  digest?: string;
  article_type?: string;
  type?: string;
  cover?: string;
  images?: string[] | string;
  thumb_media_id?: string;
  comment?: boolean;
  source_url?: string;
  theme?: string;
  code_theme?: string;
  [key: string]: any;
}

export interface ParsedArticle {
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
  content: string; // Markdown raw content without front matter
  raw: string;
}

/**
 * Extract clean text caption for WeChat newspic (图片消息/贴图)
 * WeChat picture messages display plain text caption beneath images
 */
export function extractNewspicText(content: string): string {
  return content
    // Remove markdown image syntax ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove HTML img tags
    .replace(/<img\b[^>]*\/?>/gi, '')
    // Convert headers # Header -> Header
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Convert bold/italic **bold** or *italic* -> bold
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Convert links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Convert blockquotes > quote -> quote
    .replace(/^>\s*(.+)$/gm, '$1')
    // Normalize newlines (max 2 consecutive newlines)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseMarkdownFile(
  fileContent: string,
  filePath?: string,
  defaultAuthor = '公众号作者'
): ParsedArticle {
  const parsed = matter(fileContent);
  const data: ArticleFrontMatter = parsed.data || {};
  let content = parsed.content.trim();

  // 1. Determine title
  let title = data.title?.trim();
  if (!title) {
    // Try to extract from first H1 markdown '# My Title'
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      // Remove the top H1 if it was just the title header
      content = content.replace(/^#\s+.+$/m, '').trim();
    } else if (filePath) {
      const baseName = path.basename(filePath, path.extname(filePath));
      title = baseName;
      logger.warn(`未在 Front Matter 或正文中找到文章标题，自动采用文件名: "${title}"`);
    } else {
      title = '未命名微信公众号文章';
      logger.warn(`未检测到文章标题，使用默认标题: "${title}"`);
    }
  }

  // 2. Determine author
  const author = (data.author?.trim() || defaultAuthor).slice(0, 20);

  // 3. Determine digest (max 120 chars for WeChat)
  let digest = data.digest?.trim() || '';
  if (!digest) {
    // Auto-generate digest from first plain text paragraph
    const plainText = content
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*`_~>\-+=]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    digest = plainText.slice(0, 115) + (plainText.length > 115 ? '...' : '');
  } else if (digest.length > 120) {
    logger.warn(`摘要超出微信最大限制 120 字 (${digest.length}字)，已自动截断。`);
    digest = digest.slice(0, 117) + '...';
  }

  // 4. Determine article_type (news vs newspic)
  const rawType = String(data.article_type || data.type || '').trim().toLowerCase();
  const isNewspic = ['newspic', 'pic', 'image', '贴图', '图片消息', 'photo'].includes(rawType);
  const article_type: 'news' | 'newspic' = isNewspic ? 'newspic' : 'news';

  // 5. Collect images
  const imageSet = new Set<string>();
  if (data.cover?.trim()) {
    imageSet.add(data.cover.trim());
  }
  if (Array.isArray(data.images)) {
    data.images.forEach((img) => {
      if (typeof img === 'string' && img.trim()) imageSet.add(img.trim());
    });
  } else if (typeof data.images === 'string' && data.images.trim()) {
    data.images.split(/[,;\n]/).forEach((img) => {
      if (img.trim()) imageSet.add(img.trim());
    });
  }

  // Also scan Markdown images: ![alt](url)
  const mdImgRegex = /!\[.*?\]\((.*?)\)/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = mdImgRegex.exec(content)) !== null) {
    const src = imgMatch[1].trim().replace(/^<|>$/g, '');
    if (src) imageSet.add(src);
  }

  return {
    metadata: {
      title,
      author,
      digest,
      article_type,
      images: Array.from(imageSet),
      cover: data.cover?.trim() || Array.from(imageSet)[0],
      thumb_media_id: data.thumb_media_id?.trim(),
      comment: data.comment !== false,
      source_url: data.source_url?.trim(),
      theme: data.theme || 'default',
      code_theme: data.code_theme || 'github',
    },
    content,
    raw: fileContent,
  };
}
