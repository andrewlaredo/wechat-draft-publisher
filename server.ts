import express from 'express';
import path from 'path';
import fs from 'fs';
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
