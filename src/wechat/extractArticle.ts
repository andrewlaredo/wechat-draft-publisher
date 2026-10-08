/**
 * WeChat Official Account Article Reverse Extractor (shared by local Node server,
 * Wails desktop host and the Vercel serverless function).
 *
 * IMPORTANT: this module must stay free of any Node-only API (fs/path/child_process)
 * so it can be bundled into the serverless function in `api/index.ts`.
 */
import type { Request, Response, Application } from 'express';
import axios from 'axios';
import { wechatHtmlToMarkdown } from '../markdown/html2md.ts';

export interface ExtractedImage {
  url: string;
  alt: string;
}

export interface ExtractedArticle {
  title: string;
  author: string;
  accountName: string;
  digest: string;
  cover: string;
  markdown: string;
  images: ExtractedImage[];
  publishTime: string;
  sourceUrl: string;
}

/** Offline / demo presets so the feature can be validated without hitting WeChat. */
const PRESET_SAMPLES: Array<{ key: string; article: Omit<ExtractedArticle, 'sourceUrl'> }> = [
  {
    key: 'sample_tech_architecture_2026',
    article: {
      title: '从 Markdown 到微信草稿箱：自媒体自动化流水线最佳实践',
      author: '科技探索者',
      accountName: '科技探索者官方号',
      digest: '全面剖析基于 AST、CSS 内联注入与自动化发布构建的现代公众号内容流水线。',
      cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      publishTime: '',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          alt: '题图封面',
        },
        {
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
          alt: '流水线架构图',
        },
      ],
      markdown: `## 现代化自媒体创作者的痛点

在传统的微信公众号写作流程中，创作者通常需要在本地 Markdown 软件中撰写，然后复制到富文本编辑器进行反复繁琐的手工格式微调。这个过程极度耗时，且极易在跨平台分发时出现格式崩塌。

### 自动化发布流水线三层架构

1. **语法抽象层 (AST)**：统一 Markdown-it 与 Front-Matter 解析。
2. **样式隔离层 (CSS Inlining)**：借助 Juice 将主题 CSS 注入 HTML 内联 style 属性。
3. **接口分发层 (WeChat Draft API)**：直接复用已有永久素材与草稿箱接口。

> **核心箴言**：让技术为内容服务，自动化工具消除机械劳动，让创作者聚焦于核心思考。

![流水线架构图](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80)
`,
    },
  },
  {
    key: 'sample_city_photography_gallery',
    article: {
      title: '城市光影物语：夜幕下的多图横滑图集与胶片色调剖析',
      author: '光影记录者',
      accountName: '视觉探索志',
      digest: '漫步在雨后的霓虹街头，用镜头捕捉流淌的城市故事。',
      cover: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      publishTime: '',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
          alt: '夜幕霓虹',
        },
        {
          url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
          alt: '街头光轨',
        },
      ],
      markdown: `## 夜幕降临时的城市呼吸

当最后一缕晚霞没入地平线，城市的灯火次第亮起。在湿润的沥青路面上，霓虹倒影拉伸出梦幻的光斑。

![夜幕霓虹](https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80)

### 摄影构图要点

- **冷暖对比**：以街道的深蓝暗部衬托店铺暖黄橱窗。
- **慢速快门**：让车流化作光轨，为静止的高楼赋予动态活力。

![街头光轨](https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80)
`,
    },
  },
  {
    key: 'sample_markdown_typesetting_tips',
    article: {
      title: '彻底告别排版焦虑！自媒体人必知的 8 个高效排版技巧',
      author: '效能工坊',
      accountName: '数字效能指南',
      digest: '掌握这套核心原则，排版推文效率翻倍，完读率飙升 40%。',
      cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
      publishTime: '',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
          alt: '排版对比示意图',
        },
      ],
      markdown: `## 为什么你的文章排版总是看起来平淡？

文字是思想的载体，而优美的排版是吸引读者持续阅读的视觉向导。

### 核心排版黄金法则

1. **字号层级分明**：正文 15px，主标题 18~20px，行距保持在 1.75 倍。
2. **段落间距留白**：避免密集大长段，三到四行适度空行。
3. **点缀色克制使用**：全篇主色调不超过 2 种。

![排版对比示意图](https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80)
`,
    },
  },
];

/** Only WeChat article hosts are allowed (basic SSRF guard for the public endpoint). */
function isAllowedWechatHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'mp.weixin.qq.com' || host.endsWith('.weixin.qq.com');
}

function cleanText(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function buildFrontMatter(article: Omit<ExtractedArticle, 'markdown'> & { bodyMd: string }): string {
  return [
    '---',
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `author: "${article.author.replace(/"/g, '\\"')}"`,
    `digest: "${article.digest.replace(/"/g, '\\"')}"`,
    article.cover ? `cover: "${article.cover}"` : null,
    `source_url: "${article.sourceUrl}"`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Fetch a public WeChat article and convert it into clean Markdown.
 * Throws Error with a user-friendly (Chinese) message on failure.
 */
export async function extractWechatArticle(rawUrl: string): Promise<ExtractedArticle> {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) {
    throw new Error('请提供有效的微信推文 URL');
  }

  // 1. Preset samples (offline demo)
  const preset = PRESET_SAMPLES.find((s) => trimmedUrl.includes(s.key));
  if (preset) {
    const publishTime = preset.article.publishTime || new Date().toLocaleDateString('zh-CN');
    const bodyMd = preset.article.markdown;
    const meta = { ...preset.article, publishTime, sourceUrl: trimmedUrl };
    const { markdown, ...rest } = meta;
    return { ...rest, markdown: `${buildFrontMatter({ ...rest, bodyMd })}\n${bodyMd}` };
  }

  // 2. Host allowlist (avoid turning this endpoint into an open proxy / SSRF)
  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    throw new Error('链接格式不正确，请粘贴完整的微信推文地址（https://mp.weixin.qq.com/s/...）');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('仅支持 http/https 链接');
  }
  if (!isAllowedWechatHost(parsed.hostname)) {
    throw new Error('出于安全考虑，仅支持解析微信公众号文章链接（mp.weixin.qq.com）');
  }

  // 3. Live fetch
  let html = '';
  try {
    const response = await axios.get(trimmedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40(0x1800282c) NetType/WIFI Language/zh_CN',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 12000,
      // WeChat serves a "环境异常" verification page with 200 for plain desktop UAs
      validateStatus: (status) => status >= 200 && status < 400,
      maxRedirects: 5,
    });
    html = typeof response.data === 'string' ? response.data : String(response.data ?? '');
  } catch (netErr: any) {
    throw new Error(
      `无法抓取该链接内容（${netErr?.message || '网络异常'}）。如果目标链接有微信访问限制，可尝试直接使用内置测试示例，或在微信公众平台后台复制富文本至本工具「纯化 HTML」功能进行清洗！`
    );
  }

  if (!html || typeof html !== 'string') {
    throw new Error('获取到的页面内容为空');
  }
  if (/环境异常|完成验证后即可继续访问|该内容已被发布者删除/.test(html.slice(0, 4000))) {
    throw new Error('微信返回了访问验证/内容已删除页面，无法解析。请改用内置测试示例，或在微信中打开后复制正文内容。');
  }

  // 4. Metadata
  const titleMatch =
    html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
    html.match(/var\s+msg_title\s*=\s*['"](.*?)['"]/) ||
    html.match(/<h1[^>]*id=["']activity-name["'][^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : '微信提取文章';

  const authorMatch =
    html.match(/<meta\s+property=["']og:article:author["']\s+content=["'](.*?)["']/i) ||
    html.match(/var\s+author\s*=\s*['"](.*?)['"]/) ||
    html.match(/var\s+nickname\s*=\s*['"](.*?)['"]/) ||
    html.match(/<span[^>]*class=["'][^"']*rich_media_meta_text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const author = authorMatch ? cleanText(authorMatch[1]) : '微信公众号作者';

  const accountMatch =
    html.match(/var\s+nickname\s*=\s*['"](.*?)['"]/) ||
    html.match(/<strong[^>]*class=["'][^"']*profile_nickname[^"']*["'][^>]*>([\s\S]*?)<\/strong>/i);
  const accountName = accountMatch ? cleanText(accountMatch[1]) : author;

  const digestMatch =
    html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
    html.match(/var\s+msg_desc\s*=\s*['"](.*?)['"]/);
  const digest = digestMatch ? cleanText(digestMatch[1]) : '';

  const coverMatch =
    html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
    html.match(/var\s+msg_cdn_url\s*=\s*['"](.*?)['"]/);
  const cover = coverMatch ? coverMatch[1].trim() : '';

  const ctMatch = html.match(/var\s+ct\s*=\s*['"]?(\d+)['"]?/);
  const publishTime = ctMatch
    ? new Date(parseInt(ctMatch[1], 10) * 1000).toLocaleDateString('zh-CN')
    : new Date().toLocaleDateString('zh-CN');

  // 5. Body
  const contentMatch = html.match(/<div[^>]*id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i);
  let contentHtml = contentMatch ? contentMatch[1] : html;

  const images: ExtractedImage[] = [];
  if (cover) {
    images.push({ url: cover, alt: '题图封面' });
  }

  contentHtml = contentHtml.replace(/<img\b([^>]*?)>/gi, (_match, attrs) => {
    const srcMatch =
      attrs.match(/\bdata-src=["']([^"']+)["']/i) || attrs.match(/\bsrc=["']([^"']+)["']/i);
    const altMatch = attrs.match(/\balt=["']([^"']+)["']/i);
    const imgUrl = srcMatch ? srcMatch[1].trim() : '';
    const imgAlt = altMatch ? altMatch[1].trim() : '图片';

    if (imgUrl && !imgUrl.startsWith('data:image/svg')) {
      if (!images.some((x) => x.url === imgUrl)) {
        images.push({ url: imgUrl, alt: imgAlt });
      }
      return `<img src="${imgUrl}" alt="${imgAlt}">`;
    }
    return '';
  });

  const bodyMd = wechatHtmlToMarkdown(contentHtml);
  const meta = { title, author, accountName, digest, cover, images, publishTime, sourceUrl: trimmedUrl };

  return {
    ...meta,
    markdown: `${buildFrontMatter({ ...meta, bodyMd })}\n${bodyMd}`,
  };
}

/** Express handler for POST /api/wechat/extract-article */
export async function handleExtractArticle(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: '请提供有效的微信推文 URL' });
      return;
    }

    const article = await extractWechatArticle(url);
    res.json({ success: true, article });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || '逆向提取文章失败' });
  }
}

/**
 * Registers the extractor route on an Express app.
 * Mounts both `/api/...` and `/...` so it also works when a host strips the `/api` prefix.
 */
export function registerExtractArticleRoute(app: Application): void {
  app.post('/api/wechat/extract-article', handleExtractArticle);
  app.post('/wechat/extract-article', handleExtractArticle);
}