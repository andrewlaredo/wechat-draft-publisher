import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
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
import { polishDraftArticle, STYLE_PROMPTS } from './src/ai/polisher.ts';
import { registerExtractArticleRoute } from './src/wechat/extractArticle.ts';
import { getCacheFilePath, safeReadJsonCache, safeWriteJsonCache } from './src/utils/cacheDir.ts';

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
      const runtimeCachePath = getCacheFilePath('runtime-config.json');
      safeWriteJsonCache(runtimeCachePath, currentConfig);
    } catch (e: any) {
      console.warn('[Config] 写入本地运行时缓存失败:', e.message);
    }

    res.json({ success: true, message: '配置已更新并已保存至本地运行缓存' });
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
        accountConfig,
      } = req.body;

      // Dynamically override WeChat credentials if accountConfig is provided (for multi-account broadcast)
      let effectiveConfig = currentConfig;
      if (accountConfig && (accountConfig.appId || accountConfig.app_id)) {
        effectiveConfig = {
          ...currentConfig,
          wechat: {
            ...currentConfig.wechat,
            app_id: accountConfig.appId || accountConfig.app_id,
            app_secret: accountConfig.appSecret || accountConfig.app_secret || currentConfig.wechat.app_secret,
            proxy_url: accountConfig.proxyUrl !== undefined ? accountConfig.proxyUrl : accountConfig.proxy_url !== undefined ? accountConfig.proxy_url : currentConfig.wechat.proxy_url,
          },
        };
      }

      const logs: Array<{ step: number; msg: string; status: string; timestamp: string }> = [];

      const result = await runPublishPipeline({
        markdownContent: markdown,
        filePath,
        config: effectiveConfig,
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

  // API 8.75: WeChat Online Article Reverse Extractor (shared with api/index.ts on Vercel)
  registerExtractArticleRoute(app);

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
            const draftFile = getCacheFilePath('current_draft.json');
            safeWriteJsonCache(draftFile, draftCache);

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
  const draftCachePath = getCacheFilePath('current_draft.json');
  app.get('/api/draft', (_req, res) => {
    const data = safeReadJsonCache<any>(draftCachePath, null);
    res.json({ draft: data });
  });

  app.post('/api/draft', (req, res) => {
    try {
      safeWriteJsonCache(draftCachePath, req.body);
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

  // API 11.5: AI Rough Draft One-Click Formatting & Polishing
  app.get('/api/ai/polish-styles', (_req, res) => {
    res.json({
      success: true,
      styles: (Object.entries(STYLE_PROMPTS) as Array<[string, { name: string; focus: string }]>).map(([key, val]) => ({
        id: key,
        name: val.name,
        focus: val.focus,
      })),
    });
  });

  app.post('/api/ai/polish', async (req, res) => {
    try {
      const {
        roughContent,
        polishStyle = 'structured',
        provider,
        baseUrl,
        apiKey,
        model,
        customInstruction,
        targetTone,
      } = req.body;

      if (!roughContent || !String(roughContent).trim()) {
        return res.status(400).json({
          success: false,
          error: '请提供待润色的初稿或粗糙文本内容',
        });
      }

      const result = await polishDraftArticle({
        roughContent: String(roughContent).trim(),
        polishStyle,
        provider,
        baseUrl,
        apiKey,
        model,
        customInstruction,
        targetTone,
      });

      res.json({
        success: true,
        result,
      });
    } catch (err: any) {
      console.error('AI Polish error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'AI 初稿润色排版失败，请检查设置或重试',
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

  // --- Live Mobile Tunnel (局域网手机真机实时同步审稿) ---
  let liveMobileArticle = {
    title: 'FlowDraft 微信排版实时真机预览',
    author: '创作者',
    digest: '微信公众号真实手机渲染排版与动效预览',
    cover: '',
    html: '<section style="text-align: center; padding: 40px 15px; color: #888888;"><p style="font-size: 15px; margin-bottom: 12px;">📱 正在等待电脑端 FlowDraft 同步内容...</p><p style="font-size: 12px; color: #aaa;">在电脑端编辑文章或点击「真机审稿」，此页面将无需手动刷新即可实时秒级呈现！</p></section>',
    markdown: '',
    theme: 'default',
    updatedAt: Date.now(),
  };

  const liveSseClients: Array<{ id: string; res: any }> = [];

  function notifyLiveClients() {
    const payload = JSON.stringify({
      event: 'update',
      timestamp: liveMobileArticle.updatedAt,
      title: liveMobileArticle.title,
    });
    liveSseClients.forEach((client) => {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch {
        // Ignored
      }
    });
  }

  // Update live preview content from desktop
  app.post('/api/live-mobile/update', (req, res) => {
    try {
      const { title, author, digest, cover, html, markdown, theme } = req.body;
      if (title !== undefined) liveMobileArticle.title = title;
      if (author !== undefined) liveMobileArticle.author = author;
      if (digest !== undefined) liveMobileArticle.digest = digest;
      if (cover !== undefined) liveMobileArticle.cover = cover;
      if (html !== undefined) liveMobileArticle.html = html;
      if (markdown !== undefined) liveMobileArticle.markdown = markdown;
      if (theme !== undefined) liveMobileArticle.theme = theme;
      liveMobileArticle.updatedAt = Date.now();

      notifyLiveClients();
      res.json({ success: true, updatedAt: liveMobileArticle.updatedAt, clientCount: liveSseClients.length });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Get current live content
  app.get('/api/live-mobile/content', (_req, res) => {
    res.json(liveMobileArticle);
  });

  // SSE Stream for real-time mobile sync
  app.get('/api/live-mobile/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`data: ${JSON.stringify({ event: 'connected', timestamp: Date.now() })}\n\n`);
    const clientId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const client = { id: clientId, res };
    liveSseClients.push(client);

    req.on('close', () => {
      const idx = liveSseClients.findIndex((c) => c.id === clientId);
      if (idx !== -1) liveSseClients.splice(idx, 1);
    });
  });

  // Get status
  app.get('/api/live-mobile/status', (_req, res) => {
    res.json({
      connectedDevices: liveSseClients.length,
      updatedAt: liveMobileArticle.updatedAt,
      title: liveMobileArticle.title,
    });
  });

  // Get network IPs for QR code
  app.get('/api/live-mobile/network-ips', (_req, res) => {
    const ifaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(ifaces)) {
      for (const net of ifaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
    res.json({ ips, port: PORT });
  });

  // Real WeChat Mobile Reading HTML page
  app.get('/preview/live', (_req, res) => {
    const rawTitle = liveMobileArticle.title || '微信推文真机审稿';
    const rawAuthor = liveMobileArticle.author || '创作者';
    const rawHtml = liveMobileArticle.html || '<section style="text-align: center; padding: 40px 15px; color: #888888;"><p style="font-size: 15px; margin-bottom: 12px;">📱 正在等待电脑端 FlowDraft 同步内容...</p><p style="font-size: 12px; color: #aaa;">在电脑端编辑文章或点击「真机审稿」，此页面将无需手动刷新即可实时呈现！</p></section>';
    const safeTitle = rawTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeAuthor = rawAuthor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const htmlHead = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title id="page-title">${safeTitle} - 微信真机审稿</title>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      padding: 0;
      background-color: #ededed;
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s, color 0.2s;
    }
    body.dark-mode {
      background-color: #111111;
      color: #dfdfdf;
    }
    body.dark-mode .wechat-card {
      background-color: #191919;
      color: #d1d1d1;
    }
    body.dark-mode .article-title {
      color: #efefef;
    }
    body.dark-mode .wechat-bottom-bar {
      border-top-color: #2a2a2a;
      color: #888;
    }

    /* Fixed top floating control bar */
    .mobile-control-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(24, 24, 27, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #f4f4f5;
      padding: 8px 14px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .sync-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }
    .status-dot.syncing {
      background-color: #f59e0b;
      box-shadow: 0 0 8px #f59e0b;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .control-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-ctrl {
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
    }

    /* WeChat Main Article Card */
    .wechat-card {
      background-color: #ffffff;
      padding: 22px 18px 45px;
      min-height: 100vh;
      max-width: 680px;
      margin: 0 auto;
    }
    .article-title {
      font-size: 22px;
      font-weight: bold;
      line-height: 1.4;
      color: #222222;
      margin: 0 0 14px 0;
      word-break: break-word;
    }
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #888888;
      margin-bottom: 22px;
    }
    .meta-account {
      color: #576b95;
      font-weight: 500;
    }
    .meta-author {
      color: #666666;
    }
    body.dark-mode .meta-author {
      color: #999999;
    }

    /* Content */
    #article-content {
      font-size: 16px;
      line-height: 1.75;
      word-break: break-word;
    }
    #article-content img {
      max-width: 100% !important;
      height: auto !important;
    }

    /* WeChat Bottom Bar Simulation */
    .wechat-bottom-bar {
      margin-top: 50px;
      padding-top: 24px;
      border-top: 1px solid #eeeeee;
      font-size: 13px;
      color: #8c8c8c;
    }
    .bottom-row-1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .read-origin {
      color: #576b95;
      text-decoration: none;
    }
    .read-count {
      color: #888888;
    }
    .bottom-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 20px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #555555;
    }
    body.dark-mode .action-btn {
      color: #aaaaaa;
    }
  </style>
</head>
<body>
  <div class="mobile-control-bar">
    <div class="sync-status">
      <div class="status-dot" id="status-dot"></div>
      <span id="sync-text">已连接真机实时审稿隧道</span>
    </div>
    <div class="control-actions">
      <button class="btn-ctrl" onclick="toggleDarkMode()">🌓 暗黑模式</button>
      <button class="btn-ctrl" onclick="manualRefresh()">🔄 刷新</button>
    </div>
  </div>

  <div class="wechat-card">
    <h1 class="article-title" id="article-title">${safeTitle}</h1>
    <div class="article-meta">
      <span class="meta-account" id="account-name">微信公众号</span>
      <span class="meta-author" id="article-author">${safeAuthor}</span>
      <span class="meta-date">今天</span>
      <span class="meta-origin">原创</span>
    </div>

    <div id="article-content">`;

    const htmlTail = `</div>

    <div class="wechat-bottom-bar">
      <div class="bottom-row-1">
        <span class="read-origin">阅读原文</span>
        <span class="read-count">阅读 1.6万</span>
      </div>
      <div class="bottom-actions">
        <span class="action-btn">❤️ 赞 520</span>
        <span class="action-btn">✨ 在看 188</span>
        <span class="action-btn">💬 留言 36</span>
      </div>
    </div>
  </div>

  <script>
    function renderArticle(data) {
      if (!data) return;
      document.getElementById('page-title').textContent = (data.title || '未命名推文') + ' - 微信真机审稿';
      document.getElementById('article-title').textContent = data.title || '未命名推文';
      document.getElementById('article-author').textContent = data.author || '创作者';
      if (data.html) {
        document.getElementById('article-content').innerHTML = data.html;
      }
    }

    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode');
    }

    function flashSyncBadge() {
      const dot = document.getElementById('status-dot');
      const text = document.getElementById('sync-text');
      dot.classList.add('syncing');
      text.textContent = '内容已实时同步';
      setTimeout(() => {
        dot.classList.remove('syncing');
        text.textContent = '已连接实时隧道';
      }, 1500);
    }

    async function manualRefresh() {
      try {
        const res = await fetch('/api/live-mobile/content');
        const json = await res.json();
        renderArticle(json);
        flashSyncBadge();
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const evtSource = new EventSource('/api/live-mobile/stream');
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'update') {
            manualRefresh();
          }
        } catch (err) {}
      };
      evtSource.onerror = () => {
        document.getElementById('sync-text').textContent = '重新连接中...';
      };
      evtSource.onopen = () => {
        document.getElementById('sync-text').textContent = '已连接真机实时审稿隧道';
      };
    } catch (e) {
      setInterval(manualRefresh, 2500);
    }
  </script>
</body>
</html>`;

    const htmlPage = htmlHead + rawHtml + htmlTail;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlPage);
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
