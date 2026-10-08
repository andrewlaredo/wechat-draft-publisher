import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import { loadConfig, AppConfig, DEFAULT_CONFIG } from './src/config.ts';
import { runPublishPipeline, runMultiPublishPipeline } from './src/pipeline.ts';
import { WeChatAuth } from './src/wechat/auth.ts';
import {
  getWeChatDrafts,
  deleteWeChatDraft,
  getWeChatDraftContent,
  submitWeChatFreePublish,
  getWeChatPublishStatus,
} from './src/wechat/draft.ts';
import { loadMediaCache, saveMediaCache } from './src/image/cache.ts';
import { loadPublishCache } from './src/utils/hash.ts';
import { parseMarkdownFile, extractNewspicText } from './src/markdown/parser.ts';
import { createMarkdownRenderer } from './src/markdown/renderer.ts';
import { inlineWechatStyles } from './src/markdown/style.ts';
import { generateArticle, testAiConnectivity, PROVIDER_PRESETS } from './src/ai/generator.ts';
import { wechatHtmlToMarkdown } from './src/markdown/html2md.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // In-memory or cached config
  let currentConfig: AppConfig = loadConfig();

  // API 1: Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // API 2: Get configuration
  app.get('/api/config', (_req, res) => {
    const maskedSecret = currentConfig.wechat.app_secret
      ? `${currentConfig.wechat.app_secret.slice(0, 4)}••••••••••••${currentConfig.wechat.app_secret.slice(-4)}`
      : '';

    res.json({
      wechat: {
        app_id: currentConfig.wechat.app_id || '',
        app_secret_masked: maskedSecret,
        has_secret: !!currentConfig.wechat.app_secret,
        proxy_url: currentConfig.wechat.proxy_url || '',
      },
      publish: currentConfig.publish,
      markdown: currentConfig.markdown,
      image: currentConfig.image,
    });
  });

  // API 3: Update configuration (persists to .cache/runtime-config.json)
  app.post('/api/config', (req, res) => {
    const { wechat, publish, markdown, image } = req.body;
    if (wechat) {
      if (wechat.app_id !== undefined) currentConfig.wechat.app_id = wechat.app_id;
      if (wechat.app_secret) currentConfig.wechat.app_secret = wechat.app_secret;
      if (wechat.proxy_url !== undefined) currentConfig.wechat.proxy_url = wechat.proxy_url;
    }
    if (publish) {
      currentConfig.publish = { ...currentConfig.publish, ...publish };
    }
    if (markdown) {
      currentConfig.markdown = { ...currentConfig.markdown, ...markdown };
    }
    if (image) {
      currentConfig.image = { ...currentConfig.image, ...image };
    }

    try {
      const runtimeCachePath = path.resolve(process.cwd(), '.cache/runtime-config.json');
      const cacheDir = path.dirname(runtimeCachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(runtimeCachePath, JSON.stringify(currentConfig, null, 2), 'utf-8');
    } catch (e: any) {
      console.warn('[Config] 写入本地运行时缓存失败:', e.message);
    }

    res.json({ success: true, message: '配置已更新并已保存至本地运行缓存 (.cache/runtime-config.json)' });
  });

  // API 3.1: Reload configuration from disk and environment
  app.post('/api/config/reload', (_req, res) => {
    try {
      currentConfig = loadConfig();
      res.json({
        success: true,
        message: '配置已从磁盘 (config.yaml / .env / 运行缓存) 重新加载',
        config: {
          wechat: {
            app_id: currentConfig.wechat.app_id || '',
            app_secret_masked: currentConfig.wechat.app_secret ? '••••••••' : '',
            has_secret: !!currentConfig.wechat.app_secret,
            proxy_url: currentConfig.wechat.proxy_url || '',
          },
          publish: currentConfig.publish,
          markdown: currentConfig.markdown,
          image: currentConfig.image,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 4: Test WeChat access token
  app.post('/api/wechat/test-token', async (req, res) => {
    try {
      const appId = req.body.app_id || currentConfig.wechat.app_id;
      const appSecret = req.body.app_secret || currentConfig.wechat.app_secret;
      const proxyUrl = req.body.proxy_url || currentConfig.wechat.proxy_url;

      if (!appId || !appSecret) {
        return res.status(400).json({
          success: false,
          error: '请先填写 AppID 和 AppSecret',
        });
      }

      const auth = new WeChatAuth(appId, appSecret, proxyUrl);
      const token = await auth.getAccessToken(true);

      res.json({
        success: true,
        token_preview: `${token.slice(0, 8)}...${token.slice(-6)}`,
        message: '微信凭据验证成功！已连接微信官方接口服务器。',
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || '获取微信 access_token 失败',
      });
    }
  });

  // API 5: Render Markdown to WeChat styled HTML preview
  app.post('/api/render', (req, res) => {
    try {
      const {
        markdown,
        theme = 'pie',
        codeTheme = 'github',
        macStyle = true,
        themeEnabled = true,
      } = req.body;
      if (typeof markdown !== 'string') {
        return res.status(400).json({ error: 'markdown 参数必须为字符串' });
      }

      const parsed = parseMarkdownFile(markdown, undefined, currentConfig.publish.author);
      const activeTheme = theme || parsed.metadata.theme || 'pie';
      const activeCodeTheme = codeTheme || parsed.metadata.code_theme || 'github';
      const isThemeEnabled = themeEnabled !== false;

      const renderer = createMarkdownRenderer({
        macStyle,
        codeTheme: activeCodeTheme,
      });

      const rawHtml = renderer.render(parsed.content);
      const inlinedHtml = inlineWechatStyles(rawHtml, activeTheme, isThemeEnabled);
      const newspicCaption = extractNewspicText(parsed.content);

      res.json({
        metadata: parsed.metadata,
        rawHtml,
        inlinedHtml,
        newspicCaption,
        theme: activeTheme,
        themeEnabled: isThemeEnabled,
        charCount: parsed.content.length,
        htmlLength: inlinedHtml.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 6: Run publish pipeline
  app.post('/api/publish', async (req, res) => {
    try {
      const {
        markdown,
        filePath,
        dryRun = false,
        force = false,
        previewMode = false,
        draftId,
        articleType,
        articleTypeOverride,
        theme,
        themeEnabled,
        titleOverride,
        authorOverride,
        digestOverride,
        coverOverride,
        thumbMediaIdOverride,
      } = req.body;

      const logs: Array<{ step: number; msg: string; status: string; timestamp: string }> = [];

      const result = await runPublishPipeline({
        markdownContent: markdown,
        filePath,
        config: currentConfig,
        dryRun: !!dryRun,
        force: !!force,
        previewMode: !!previewMode,
        draftId,
        articleTypeOverride: articleTypeOverride || articleType,
        themeOverride: theme,
        themeEnabled: themeEnabled !== undefined ? !!themeEnabled : undefined,
        titleOverride,
        authorOverride,
        digestOverride,
        coverOverride,
        thumbMediaIdOverride,
        onStepProgress: (step, _total, msg, status) => {
          logs.push({
            step,
            msg,
            status,
            timestamp: new Date().toLocaleTimeString(),
          });
        },
      });

      res.json({
        success: true,
        result,
        logs,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  });

  // API 7: Fetch published history
  app.get('/api/history', (_req, res) => {
    try {
      const cache = loadPublishCache();
      const records = Object.values(cache.records).sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
      res.json({ records });
    } catch {
      res.json({ records: [] });
    }
  });

  // API 8: Fetch drafts list from WeChat
  app.get('/api/wechat/drafts', async (req, res) => {
    try {
      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        return res.json({ total_count: 0, items: [], message: '未配置微信凭据' });
      }
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const count = Math.min(20, Math.max(1, parseInt(String(req.query.count || '10'), 10)));
      const noContent = req.query.noContent === '0' ? 0 : 1;

      const auth = new WeChatAuth(currentConfig.wechat.app_id, currentConfig.wechat.app_secret, currentConfig.wechat.proxy_url);
      const token = await auth.getAccessToken();
      const drafts = await getWeChatDrafts(token, offset, count, noContent, currentConfig.wechat.proxy_url);
      res.json(drafts);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // API 8.1: Get specific draft details (content, articles)
  app.get('/api/wechat/draft/:mediaId', async (req, res) => {
    try {
      const { mediaId } = req.params;
      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        return res.status(400).json({ error: '未配置微信凭据' });
      }
      const auth = new WeChatAuth(currentConfig.wechat.app_id, currentConfig.wechat.app_secret, currentConfig.wechat.proxy_url);
      const token = await auth.getAccessToken();
      const content = await getWeChatDraftContent(token, mediaId, currentConfig.wechat.proxy_url);
      res.json(content);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // API 8.2: Delete a draft from WeChat
  app.delete('/api/wechat/draft/:mediaId', async (req, res) => {
    try {
      const { mediaId } = req.params;
      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        return res.status(400).json({ error: '未配置微信凭据' });
      }
      const auth = new WeChatAuth(currentConfig.wechat.app_id, currentConfig.wechat.app_secret, currentConfig.wechat.proxy_url);
      const token = await auth.getAccessToken();
      await deleteWeChatDraft(token, mediaId, currentConfig.wechat.proxy_url);
      res.json({ success: true, message: `草稿 ${mediaId} 已成功删除` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // API 8.3: Submit draft for free publishing (微信正式群发发布)
  app.post('/api/wechat/draft/:mediaId/publish', async (req, res) => {
    try {
      const { mediaId } = req.params;
      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        return res.status(400).json({ error: '未配置微信凭据' });
      }
      const auth = new WeChatAuth(currentConfig.wechat.app_id, currentConfig.wechat.app_secret, currentConfig.wechat.proxy_url);
      const token = await auth.getAccessToken();
      const result = await submitWeChatFreePublish(token, mediaId, currentConfig.wechat.proxy_url);
      res.json({ success: true, publish_id: result.publish_id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // API 8.4: Get publishing status of a free publish task
  app.get('/api/wechat/publish/:publishId', async (req, res) => {
    try {
      const { publishId } = req.params;
      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        return res.status(400).json({ error: '未配置微信凭据' });
      }
      const auth = new WeChatAuth(currentConfig.wechat.app_id, currentConfig.wechat.app_secret, currentConfig.wechat.proxy_url);
      const token = await auth.getAccessToken();
      const status = await getWeChatPublishStatus(token, publishId, currentConfig.wechat.proxy_url);
      res.json(status);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // API 8.5: Multi-article batch draft creation
  app.post('/api/wechat/draft/multi', async (req, res) => {
    try {
      const { items, dryRun = false } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: '请提供多图文文章列表 items (1~8 篇)' });
      }
      const result = await runMultiPublishPipeline({
        items,
        config: currentConfig,
        dryRun,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // API 8.6: Media cache management
  app.get('/api/media/cache', (_req, res) => {
    try {
      const cache = loadMediaCache();
      const items = Object.values(cache);
      res.json({
        total_items: items.length,
        items,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/media/cache/clear', (_req, res) => {
    try {
      saveMediaCache({});
      res.json({ success: true, message: '媒体素材去重缓存已清空' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 8.7: Get permanent media materials from WeChat Cloud Asset Library
  app.get('/api/wechat/materials', async (req, res) => {
    try {
      const offset = parseInt(String(req.query.offset || '0'), 10);
      const count = parseInt(String(req.query.count || '20'), 10);

      if (!currentConfig.wechat.app_id || !currentConfig.wechat.app_secret) {
        // Return local media cache / mock materials if no credentials
        const cache = loadMediaCache();
        const cachedItems = Object.entries(cache).map(([originalPath, item]) => ({
          media_id: item.media_id,
          name: path.basename(originalPath),
          update_time: item.cached_at ? Math.floor(new Date(item.cached_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
          url: item.url,
        }));

        const mockDefaults = [
          {
            media_id: 'thumb_mars_default_01',
            name: '01-mars-default.png',
            update_time: Math.floor(Date.now() / 1000),
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          },
          {
            media_id: 'thumb_tech_cyber_02',
            name: '02-cyber-neon.jpg',
            update_time: Math.floor(Date.now() / 1000) - 3600,
            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
          },
          {
            media_id: 'thumb_code_screen_03',
            name: '03-developer-setup.jpg',
            update_time: Math.floor(Date.now() / 1000) - 7200,
            url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
          },
        ];

        const all = [...cachedItems, ...mockDefaults];
        return res.json({
          total_count: all.length,
          item_count: all.length,
          item: all.slice(offset, offset + count),
          isMock: true,
        });
      }

      const auth = new WeChatAuth(
        currentConfig.wechat.app_id,
        currentConfig.wechat.app_secret,
        currentConfig.wechat.proxy_url
      );
      const token = await auth.getAccessToken();

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`,
        {
          type: 'image',
          offset,
          count: Math.min(count, 20),
        },
        { timeout: 15000 }
      );

      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || '获取微信永久素材库失败' });
    }
  });

  // API 8.75: WeChat Online Article Reverse Extractor
  app.post('/api/wechat/extract-article', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: '请提供有效的微信推文 URL' });
      }

      const trimmedUrl = url.trim();

      // Check if it matches preset sample links for instant demo/offline testing
      if (trimmedUrl.includes('sample_tech_architecture_2026')) {
        const sampleMd = `---
title: "从 Markdown 到微信草稿箱：自媒体自动化流水线最佳实践"
author: "科技探索者"
digest: "全面剖析基于 AST、CSS 内联注入与自动化发布构建的现代公众号内容流水线。"
cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
source_url: "${trimmedUrl}"
---

## 现代化自媒体创作者的痛点

在传统的微信公众号写作流程中，创作者通常需要在本地 Markdown 软件中撰写，然后复制到富文本编辑器进行反复繁琐的手工格式微调。这个过程极度耗时，且极易在跨平台分发时出现格式崩塌。

### 自动化发布流水线三层架构

1. **语法抽象层 (AST)**：统一 Markdown-it 与 Front-Matter 解析。
2. **样式隔离层 (CSS Inlining)**：借助 Juice 将主题 CSS 注入 HTML 内联 style 属性。
3. **接口分发层 (WeChat Draft API)**：直接复用已有永久素材与草稿箱接口。

> **核心箴言**：让技术为内容服务，自动化工具消除机械劳动，让创作者聚焦于核心思考。

![流水线架构图](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80)
`;
        return res.json({
          success: true,
          article: {
            title: '从 Markdown 到微信草稿箱：自媒体自动化流水线最佳实践',
            author: '科技探索者',
            accountName: '科技探索者官方号',
            digest: '全面剖析基于 AST、CSS 内联注入与自动化发布构建的现代公众号内容流水线。',
            cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
            markdown: sampleMd,
            images: [
              { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', alt: '题图封面' },
              { url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80', alt: '流水线架构图' },
            ],
            publishTime: new Date().toLocaleDateString('zh-CN'),
            sourceUrl: trimmedUrl,
          },
        });
      }

      if (trimmedUrl.includes('sample_city_photography_gallery')) {
        const sampleMd = `---
title: "城市光影物语：夜幕下的多图横滑图集与胶片色调剖析"
author: "光影记录者"
digest: "漫步在雨后的霓虹街头，用镜头捕捉流淌的城市故事。"
cover: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80"
source_url: "${trimmedUrl}"
---

## 夜幕降临时的城市呼吸

当最后一缕晚霞没入地平线，城市的灯火次第亮起。在湿润的沥青路面上，霓虹倒影拉伸出梦幻的光斑。

![夜幕霓虹](https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80)

### 摄影构图要点

- **冷暖对比**：以街道的深蓝暗部衬托店铺暖黄橱窗。
- **慢速快门**：让车流化作光轨，为静止的高楼赋予动态活力。

![街头光轨](https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80)
`;
        return res.json({
          success: true,
          article: {
            title: '城市光影物语：夜幕下的多图横滑图集与胶片色调剖析',
            author: '光影记录者',
            accountName: '视觉探索志',
            digest: '漫步在雨后的霓虹街头，用镜头捕捉流淌的城市故事。',
            cover: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
            markdown: sampleMd,
            images: [
              { url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80', alt: '夜幕霓虹' },
              { url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', alt: '街头光轨' },
            ],
            publishTime: new Date().toLocaleDateString('zh-CN'),
            sourceUrl: trimmedUrl,
          },
        });
      }

      if (trimmedUrl.includes('sample_markdown_typesetting_tips')) {
        const sampleMd = `---
title: "彻底告别排版焦虑！自媒体人必知的 8 个高效排版技巧"
author: "效能工坊"
digest: "掌握这套核心原则，排版推文效率翻倍，完读率飙升 40%。"
cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
source_url: "${trimmedUrl}"
---

## 为什么你的文章排版总是看起来平淡？

文字是思想的载体，而优美的排版是吸引读者持续阅读的视觉向导。

### 核心排版黄金法则

1. **字号层级分明**：正文 15px，主标题 18~20px，行距保持在 1.75 倍。
2. **段落间距留白**：避免密集大长段，三到四行适度空行。
3. **点缀色克制使用**：全篇主色调不超过 2 种。

![排版对比示意图](https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80)
`;
        return res.json({
          success: true,
          article: {
            title: '彻底告别排版焦虑！自媒体人必知的 8 个高效排版技巧',
            author: '效能工坊',
            accountName: '数字效能指南',
            digest: '掌握这套核心原则，排版推文效率翻倍，完读率飙升 40%。',
            cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
            markdown: sampleMd,
            images: [
              { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80', alt: '排版对比示意图' },
            ],
            publishTime: new Date().toLocaleDateString('zh-CN'),
            sourceUrl: trimmedUrl,
          },
        });
      }

      // Live WeChat Article Fetch
      let html = '';
      try {
        const response = await axios.get(trimmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40(0x1800282c) NetType/WIFI Language/zh_CN',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          },
          timeout: 12000,
        });
        html = response.data;
      } catch (netErr: any) {
        return res.status(400).json({
          error: `无法抓取该链接内容（${netErr.message}）。如果目标链接有微信访问限制，可尝试直接使用内置测试示例，或在微信公众平台后台复制富文本至本工具「纯化 HTML」功能进行清洗！`,
        });
      }

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: '获取到的页面内容为空' });
      }

      // Parse metadata
      const cleanText = (str: string) => str.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

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
      const publishTime = ctMatch ? new Date(parseInt(ctMatch[1], 10) * 1000).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN');

      // Extract body content inside #js_content
      const contentMatch = html.match(/<div[^>]*id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i);
      let contentHtml = contentMatch ? contentMatch[1] : html;

      // Extract images & replace lazy data-src with src
      const images: Array<{ url: string; alt: string }> = [];
      if (cover) {
        images.push({ url: cover, alt: '题图封面' });
      }

      contentHtml = contentHtml.replace(/<img\b([^>]*?)>/gi, (_match, attrs) => {
        const srcMatch = attrs.match(/\bdata-src=["']([^"']+)["']/i) || attrs.match(/\bsrc=["']([^"']+)["']/i);
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

      // Convert HTML to clean Markdown
      const bodyMd = wechatHtmlToMarkdown(contentHtml);

      // Combine with YAML Front-Matter
      const frontMatter = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `author: "${author.replace(/"/g, '\\"')}"`,
        `digest: "${digest.replace(/"/g, '\\"')}"`,
        cover ? `cover: "${cover}"` : null,
        `source_url: "${trimmedUrl}"`,
        '---',
        '',
      ].filter(Boolean).join('\n');

      const fullMarkdown = `${frontMatter}\n${bodyMd}`;

      res.json({
        success: true,
        article: {
          title,
          author,
          accountName,
          digest,
          cover,
          markdown: fullMarkdown,
          images,
          publishTime,
          sourceUrl: trimmedUrl,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || '逆向提取文章失败' });
    }
  });

  // API 8.8: Image compression engine
  app.post('/api/image/compress', async (req, res) => {
    try {
      const { base64, maxWidth = 1920, quality = 85 } = req.body;
      if (!base64) {
        return res.status(400).json({ error: '请提供图片 base64' });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const inputBuffer = Buffer.from(cleanBase64, 'base64');
      const originalSize = inputBuffer.length;

      let compressedBuffer = inputBuffer;
      try {
        const sharp = (await import('sharp')).default;
        const pipeline = sharp(inputBuffer).resize({ width: maxWidth, withoutEnlargement: true });
        compressedBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      } catch {
        // Fallback
      }

      const compressedSize = compressedBuffer.length;
      const resultBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

      res.json({
        success: true,
        dataUrl: resultBase64,
        originalSize,
        compressedSize,
        savedPercent: Math.round(((originalSize - compressedSize) / originalSize) * 100),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 8.9: Directory Watch Mode
  let activeWatcher: fs.FSWatcher | null = null;
  const watchState = {
    isWatching: false,
    targetDir: '',
    autoPublish: false,
    logs: [] as Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warn' }>,
  };

  app.get('/api/watch/status', (_req, res) => {
    res.json(watchState);
  });

  app.post('/api/watch/start', (req, res) => {
    try {
      const { targetDir = './watch', autoPublish = false } = req.body;
      const resolvedDir = path.resolve(process.cwd(), targetDir);

      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }

      if (activeWatcher) {
        activeWatcher.close();
      }

      watchState.isWatching = true;
      watchState.targetDir = resolvedDir;
      watchState.autoPublish = !!autoPublish;
      watchState.logs.unshift({
        timestamp: new Date().toLocaleTimeString(),
        message: `开始监听目录: ${resolvedDir} (自动推送: ${autoPublish ? '已开启' : '关闭-仅同步'})`,
        type: 'info',
      });

      let debounceTimer: NodeJS.Timeout | null = null;

      activeWatcher = fs.watch(resolvedDir, { recursive: false }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.md')) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const filePath = path.join(resolvedDir, filename);
          if (!fs.existsSync(filePath)) return;

          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            watchState.logs.unshift({
              timestamp: new Date().toLocaleTimeString(),
              message: `检测到文件变动: ${filename} (${content.length} 字符)`,
              type: 'info',
            });

            // Auto-sync draft to current working cache
            const draftCache = {
              markdown: content,
              savedAt: Date.now(),
            };
            const cacheDir = path.resolve(process.cwd(), '.cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(path.join(cacheDir, 'current_draft.json'), JSON.stringify(draftCache, null, 2));

            // If auto publish is active, trigger publish
            if (watchState.autoPublish) {
              watchState.logs.unshift({
                timestamp: new Date().toLocaleTimeString(),
                message: `正在自动推送草稿箱...`,
                type: 'info',
              });
              const pubRes = await runPublishPipeline({
                markdownContent: content,
                filePath,
                config: currentConfig,
                dryRun: false,
              });
              watchState.logs.unshift({
                timestamp: new Date().toLocaleTimeString(),
                message: `草稿箱自动同步成功! MediaID: ${pubRes.media_id || '已保存'}`,
                type: 'success',
              });
            }
          } catch (err: any) {
            watchState.logs.unshift({
              timestamp: new Date().toLocaleTimeString(),
              message: `自动同步失败: ${err.message}`,
              type: 'warn',
            });
          }
        }, 800);
      });

      res.json({ success: true, watchState });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/watch/stop', (_req, res) => {
    if (activeWatcher) {
      activeWatcher.close();
      activeWatcher = null;
    }
    watchState.isWatching = false;
    watchState.logs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      message: '已停止目录监听',
      type: 'info',
    });
    res.json({ success: true, watchState });
  });

  // API 9: Auto-save current working draft
  const draftCachePath = path.resolve(process.cwd(), '.cache/current_draft.json');
  app.get('/api/draft', (_req, res) => {
    try {
      if (fs.existsSync(draftCachePath)) {
        const data = JSON.parse(fs.readFileSync(draftCachePath, 'utf-8'));
        return res.json({ draft: data });
      }
    } catch {
      // Ignore
    }
    res.json({ draft: null });
  });

  app.post('/api/draft', (req, res) => {
    try {
      const cacheDir = path.dirname(draftCachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(draftCachePath, JSON.stringify(req.body, null, 2), 'utf-8');
      res.json({ success: true, savedAt: Date.now() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 10: Get available AI provider presets
  app.get('/api/ai/providers', (_req, res) => {
    res.json({
      success: true,
      providers: PROVIDER_PRESETS,
    });
  });

  // API 11: Universal AI Article Generation (Server-Side)
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const {
        provider,
        baseUrl,
        apiKey,
        model,
        topic,
        tone,
        targetWordCount,
        articleType,
        audience,
        keywords,
        reference,
        knowledgeDocs,
      } = req.body;

      if (!topic || !String(topic).trim()) {
        return res.status(400).json({
          success: false,
          error: '请提供文章创作主题或核心要点',
        });
      }

      const result = await generateArticle({
        provider: provider || 'gemini',
        baseUrl: baseUrl?.trim() || undefined,
        apiKey: apiKey?.trim() || undefined,
        model: model?.trim() || undefined,
        topic: String(topic).trim(),
        tone,
        targetWordCount: targetWordCount ? Number(targetWordCount) : undefined,
        articleType: articleType === 'newspic' ? 'newspic' : 'news',
        audience,
        keywords,
        reference,
        knowledgeDocs: Array.isArray(knowledgeDocs) ? knowledgeDocs : undefined,
      });

      res.json({
        success: true,
        article: result,
      });
    } catch (err: any) {
      console.error('AI Generation error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'AI 文章生成失败，请检查 API Key 或重试',
      });
    }
  });

  // API 12: Universal AI connectivity test
  app.post('/api/ai/test-key', async (req, res) => {
    try {
      const { provider, baseUrl, apiKey, model } = req.body;
      const result = await testAiConnectivity({
        provider,
        baseUrl,
        apiKey,
        model,
      });
      if (result.valid) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, error: result.message });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || '测试连接失败' });
    }
  });

  // Local images directory static serving and local image proxy
  const imagesDirPath = path.join(process.cwd(), 'images');
  if (fs.existsSync(imagesDirPath)) {
    app.use('/images', express.static(imagesDirPath));
  }

  // Universal Local Image resolver endpoint: /api/local-image?path=...
  app.get('/api/local-image', (req, res) => {
    try {
      const rawPath = req.query.path as string;
      if (!rawPath) {
        return res.status(400).send('Missing path parameter');
      }
      const clean = decodeURIComponent(rawPath).replace(/^\.?\/?/, '');
      const candidates = [
        path.resolve(process.cwd(), clean),
        path.resolve(process.cwd(), 'images', path.basename(clean)),
        path.resolve(imagesDirPath, clean),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.sendFile(cand);
        }
      }
      res.status(404).send('Image file not found');
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`[WeChat Publisher] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
