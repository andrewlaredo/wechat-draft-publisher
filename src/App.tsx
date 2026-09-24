import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Toolbar, THEME_OPTIONS } from './components/Toolbar.tsx';
import { MarkdownEditor } from './components/MarkdownEditor.tsx';
import { WeChatSimulator } from './components/WeChatSimulator.tsx';
import { PublishModal } from './components/PublishModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CliModal } from './components/CliModal.tsx';
import { AiGeneratorModal } from './components/AiGeneratorModal.tsx';
import { DraftManagementModal } from './components/DraftManagementModal.tsx';
import { SponsorModal } from './components/SponsorModal.tsx';
import { WelcomeGuideModal } from './components/WelcomeGuideModal.tsx';
import { HelpGuideModal } from './components/HelpGuideModal.tsx';
import { NoCredentialsNoticeModal } from './components/NoCredentialsNoticeModal.tsx';
import { SAMPLE_ARTICLES } from './data/samples.ts';
import { ArticleMeta, PublishHistoryItem, PublishLogItem } from './types/app.ts';
import { GeneratedArticleResult } from './ai/generator.ts';
import { wechatHtmlToMarkdown } from './markdown/html2md.ts';
import { safeFetchJson } from './utils/safeFetch.ts';
import { renderMarkdownLocally } from './markdown/clientRender.ts';

const LOCAL_STORAGE_DRAFT_KEY = 'wechat_draft_auto_save_v1';
const LOCAL_STORAGE_CONFIG_KEY = 'wechat_publisher_client_config_v1';

export default function App() {
  // State: Content & Meta restored from LocalStorage or default sample
  const [markdown, setMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.markdown === 'string' && parsed.markdown.trim()) {
          return parsed.markdown;
        }
      }
    } catch {
      // Ignore
    }
    return SAMPLE_ARTICLES[0].markdown;
  });

  const [activeTheme, setActiveTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.theme) return parsed.theme;
      }
    } catch {
      // Ignore
    }
    return SAMPLE_ARTICLES[0].theme;
  });

  // Master switch for Theme styling ("主题需要支持开关：开了在应用")
  const [themeEnabled, setThemeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.themeEnabled === 'boolean') return parsed.themeEnabled;
      }
    } catch {
      // Ignore
    }
    return true;
  });

  const [macStyle, setMacStyle] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.macStyle === 'boolean') return parsed.macStyle;
      }
    } catch {
      // Ignore
    }
    return true;
  });

  // Message Type: Classic Rich Text News vs Image Message (贴图 / newspic)
  const [articleType, setArticleType] = useState<'news' | 'newspic'>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.articleType === 'newspic' || parsed?.metadata?.article_type === 'newspic') {
          return 'newspic';
        }
      }
    } catch {
      // Ignore
    }
    return 'news';
  });

  const [newspicCaption, setNewspicCaption] = useState<string>('');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop' | 'html'>('mobile');

  // Parsed HTML from server
  const [inlinedHtml, setInlinedHtml] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [metadata, setMetadata] = useState<ArticleMeta>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.metadata && typeof parsed.metadata.title === 'string') {
          return parsed.metadata;
        }
      }
    } catch {
      // Ignore
    }
    return {
      title: '微信公众号草稿自动化发布实战指南',
      author: '科技探索者',
      digest: '探索如何通过 Markdown 快速排版、自动内联样式并将图文无缝推送到微信公众号草稿箱，提升自媒体创作者效率。',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
      comment: true,
      theme: 'tech-blue',
      code_theme: 'github',
    };
  });

  // Track auto-save timestamp
  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.savedAt) {
          return new Date(parsed.savedAt).toLocaleTimeString();
        }
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Check if current markdown matches any sample article
  const currentSampleId = SAMPLE_ARTICLES.find((s) => s.markdown === markdown)?.id;

  // Auto-save debounced effect to local storage and server cache
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        const now = Date.now();
        const payload = {
          markdown,
          theme: activeTheme,
          themeEnabled,
          macStyle,
          articleType,
          metadata,
          savedAt: now,
        };
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(payload));
        setLastSaved(new Date(now).toLocaleTimeString());

        // Async sync to server draft cache
        safeFetchJson('/api/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {
        // Ignore storage quotas
      }
    }, 400);

    return () => clearTimeout(saveTimer);
  }, [markdown, activeTheme, themeEnabled, macStyle, articleType, metadata]);

  // Fallback recovery from server if localStorage is empty on initial load
  useEffect(() => {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (!local) {
        safeFetchJson('/api/draft')
          .then((res) => {
            if (res.ok && res.data?.draft?.markdown) {
              setMarkdown(res.data.draft.markdown);
              if (res.data.draft.theme) setActiveTheme(res.data.draft.theme);
              if (typeof res.data.draft.themeEnabled === 'boolean') setThemeEnabled(res.data.draft.themeEnabled);
              if (typeof res.data.draft.macStyle === 'boolean') setMacStyle(res.data.draft.macStyle);
              if (res.data.draft.articleType) setArticleType(res.data.draft.articleType);
              if (res.data.draft.metadata) setMetadata(res.data.draft.metadata);
              if (res.data.draft.savedAt) setLastSaved(new Date(res.data.draft.savedAt).toLocaleTimeString());
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  // Scanned images list
  const [scannedImages, setScannedImages] = useState<string[]>([]);

  // Clipboard copy state
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // App Settings & Credentials (initialized from localStorage or server)
  const [config, setConfig] = useState<{
    appId: string;
    hasSecret: boolean;
    proxyUrl: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          appId: parsed.appId || '',
          hasSecret: !!parsed.hasSecret,
          proxyUrl: parsed.proxyUrl || '',
        };
      }
    } catch {
      // Ignore
    }
    return {
      appId: '',
      hasSecret: false,
      proxyUrl: '',
    };
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCliOpen, setIsCliOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isDraftManagerOpen, setIsDraftManagerOpen] = useState<boolean>(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState<boolean>(false);
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('wechat_publisher_welcomed_v1');
    } catch {
      return false;
    }
  });
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState<boolean>(false);
  const [isNoCredentialsPromptOpen, setIsNoCredentialsPromptOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [htmlLength, setHtmlLength] = useState<number>(0);

  // Toast notifications helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  }, []);

  // Publishing Pipeline State
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishIsDryRun, setPublishIsDryRun] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<any | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishLogs, setPublishLogs] = useState<PublishLogItem[]>([]);

  // History records
  const [history, setHistory] = useState<PublishHistoryItem[]>([]);

  // 1. Fetch initial configuration & history
  const fetchConfig = useCallback(async () => {
    try {
      const res = await safeFetchJson('/api/config');
      if (res.ok && res.data) {
        const nextCfg = {
          appId: res.data.wechat?.app_id || '',
          hasSecret: !!res.data.wechat?.has_secret,
          proxyUrl: res.data.wechat?.proxy_url || '',
        };
        setConfig(nextCfg);
        try {
          localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(nextCfg));
        } catch {}
      }
    } catch {
      // Ignore network errors in pure client mode
    }
  }, []);

  const handleReloadConfig = useCallback(async () => {
    try {
      const res = await safeFetchJson('/api/config/reload', { method: 'POST' });
      if (res.ok && res.data?.config) {
        setConfig({
          appId: res.data.config.wechat?.app_id || '',
          hasSecret: !!res.data.config.wechat?.has_secret,
          proxyUrl: res.data.config.wechat?.proxy_url || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to reload config:', err);
      throw err;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await safeFetchJson('/api/history');
      if (res.ok && res.data && Array.isArray(res.data.records)) {
        setHistory(res.data.records);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    // Do not call fetchHistory on initial mount; it is called on-demand when opening the history tab or after publish
  }, [fetchConfig]);

  // 2. Render markdown to inlined HTML (100% Client-side authoritative engine)
  useEffect(() => {
    try {
      const localResult = renderMarkdownLocally(markdown, {
        theme: activeTheme,
        themeEnabled,
        macStyle,
      });

      setInlinedHtml(localResult.inlinedHtml);
      setCharCount(localResult.charCount);
      setHtmlLength(localResult.htmlLength);
      setMetadata((prev) => ({
        ...prev,
        ...localResult.metadata,
        theme: activeTheme,
      }));
      if (localResult.metadata.article_type) {
        setArticleType(localResult.metadata.article_type);
      }
      if (localResult.newspicCaption) {
        setNewspicCaption(localResult.newspicCaption);
      }
      setScannedImages(localResult.metadata.images || []);
    } catch (localErr) {
      console.warn('Local render fallback error:', localErr);
    }
  }, [markdown, activeTheme, themeEnabled, macStyle]);

  // 3. Handle Template Selection
  const handleSelectSample = (sampleId: string) => {
    let sample = SAMPLE_ARTICLES.find((s) => s.id === sampleId);
    if (!sample) {
      if (sampleId === 'official-guide' || sampleId === 'full-syntax-guide') {
        sample = SAMPLE_ARTICLES.find((s) => s.id === 'official-guide') || SAMPLE_ARTICLES[0];
      } else {
        sample = SAMPLE_ARTICLES[0];
      }
    }

    if (sample) {
      const targetTheme = sample.theme || 'pie';
      const targetArticleType = sample.articleType || (sample.id === 'newspic-gallery' || sample.markdown.includes('type: newspic') ? 'newspic' : 'news');

      setMarkdown(sample.markdown);
      setActiveTheme(targetTheme);
      setArticleType(targetArticleType);

      // Instant client-side render to eliminate any UI lag
      try {
        const localResult = renderMarkdownLocally(sample.markdown, {
          theme: targetTheme,
          themeEnabled,
          macStyle,
        });

        setInlinedHtml(localResult.inlinedHtml);
        setCharCount(localResult.charCount);
        setHtmlLength(localResult.htmlLength);
        setMetadata((prev) => ({
          ...prev,
          ...localResult.metadata,
          theme: targetTheme,
        }));
        if (localResult.metadata.article_type) {
          setArticleType(localResult.metadata.article_type);
        }
        if (localResult.newspicCaption) {
          setNewspicCaption(localResult.newspicCaption);
        }
        setScannedImages(localResult.metadata.images || []);
      } catch (err) {
        console.warn('Local render error on sample select:', err);
      }

      showToast(`📖 已成功载入「${sample.name}」`);
    }
  };

  // 3.5 Handle AI Generated Article Injection (Human-in-the-loop Gate)
  const handleApplyAiArticle = (article: GeneratedArticleResult) => {
    let finalMarkdown = article.markdown;
    let finalCover = article.cover;
    // N4: If user already had an explicit cover in editor, preserve it rather than silently overwriting
    if (metadata.cover && metadata.cover.trim()) {
      finalCover = metadata.cover;
      finalMarkdown = finalMarkdown.replace(/^cover:\s*.*$/m, `cover: ${finalCover}`);
    }

    setMarkdown(finalMarkdown);
    if (article.articleType) {
      setArticleType(article.articleType);
    }
    if (article.theme) {
      setActiveTheme(article.theme);
    }
    setMetadata((prev) => ({
      ...prev,
      title: article.title,
      author: article.author,
      digest: article.digest,
      cover: finalCover,
      theme: article.theme,
      article_type: article.articleType,
    }));
  };

  // 3.6 Handle Loading Draft from WeChat Box back into Editor
  const handleLoadDraftIntoEditor = (draft: { title: string; author: string; content: string; digest: string }) => {
    // If incoming draft content has HTML tags, purify to clean Markdown
    const pureContent = /<[a-z][\s\S]*>/i.test(draft.content)
      ? wechatHtmlToMarkdown(draft.content)
      : draft.content;

    const fmLines = [
      '---',
      `title: "${draft.title.replace(/"/g, '\\"')}"`,
      `author: "${draft.author.replace(/"/g, '\\"')}"`,
      `digest: "${draft.digest.replace(/"/g, '\\"')}"`,
      `theme: "${activeTheme}"`,
      '---',
      '',
    ].join('\n');

    setMarkdown(`${fmLines}\n${pureContent}`);
    setMetadata((prev) => ({
      ...prev,
      title: draft.title,
      author: draft.author,
      digest: draft.digest,
    }));
  };

  // 4. Update metadata from Form tab (sync back to markdown front matter)
  const handleMetadataChange = (updated: Partial<ArticleMeta>) => {
    const newMeta = { ...metadata, ...updated };
    if (updated.article_type) {
      setArticleType(updated.article_type);
    }
    setMetadata(newMeta);

    // Replace or add front matter in markdown
    const hasFrontMatter = /^---\r?\n[\s\S]*?\r?\n---/m.test(markdown);
    const fmLines = [
      '---',
      `title: ${newMeta.title}`,
      `author: ${newMeta.author}`,
      newMeta.article_type ? `type: ${newMeta.article_type}` : null,
      `digest: ${newMeta.digest}`,
      newMeta.cover ? `cover: ${newMeta.cover}` : null,
      newMeta.thumb_media_id ? `thumb_media_id: ${newMeta.thumb_media_id}` : null,
      `comment: ${newMeta.comment}`,
      newMeta.source_url ? `source_url: ${newMeta.source_url}` : null,
      newMeta.article_type !== 'newspic' ? `theme: ${activeTheme}` : null,
      'code_theme: github',
      '---',
    ]
      .filter(Boolean)
      .join('\n');

    if (hasFrontMatter) {
      setMarkdown(markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/m, fmLines));
    } else {
      setMarkdown(`${fmLines}\n\n${markdown}`);
    }
  };

  // 5. Copy Rich Inlined HTML to Clipboard for WeChat Editor direct paste
  const handleCopyWeChatHtml = async () => {
    try {
      const blobHtml = new Blob([inlinedHtml], { type: 'text/html' });
      const blobText = new Blob([inlinedHtml], { type: 'text/plain' });
      const data = [
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ];
      await navigator.clipboard.write(data);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback for browsers without ClipboardItem text/html
      try {
        await navigator.clipboard.writeText(inlinedHtml);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch (e) {
        console.error('Clipboard copy error:', e);
      }
    }
  };

  // 6. Execute publish pipeline
  const executePublish = async (dryRun: boolean, force = false) => {
    setPublishIsDryRun(dryRun);
    setIsPublishing(true);
    setPublishResult(null);
    setPublishError(null);
    setPublishLogs([]);
    setIsPublishModalOpen(true);

    try {
      const publishBody = {
        markdown,
        inlinedHtml,
        dryRun,
        force,
        articleType,
        articleTypeOverride: articleType,
        theme: activeTheme,
        themeEnabled,
        titleOverride: metadata.title,
        authorOverride: metadata.author,
        digestOverride: metadata.digest,
        coverOverride: metadata.cover,
        thumbMediaIdOverride: metadata.thumb_media_id,
      };

      const res = await safeFetchJson('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishBody),
      });

      if (res.ok && res.data?.success) {
        setPublishResult(res.data.result);
        setPublishLogs(res.data.logs || []);
        fetchHistory(); // Refresh history cache
      } else {
        setPublishError(res.data?.error || res.error || '推送草稿箱失败');
        if (res.data?.logs) setPublishLogs(res.data.logs);
      }
    } catch (err: any) {
      setPublishError(err.message || '网络通讯故障');
    } finally {
      setIsPublishing(false);
    }
  };

  // 7. Save Settings
  const handleSaveSettings = async (data: { appId: string; appSecret?: string; proxyUrl?: string }) => {
    const updatedCfg = {
      appId: data.appId,
      hasSecret: !!data.appSecret || config.hasSecret,
      proxyUrl: data.proxyUrl || '',
    };
    setConfig(updatedCfg);
    try {
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updatedCfg));
    } catch {}

    const res = await safeFetchJson('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wechat: {
          app_id: data.appId,
          app_secret: data.appSecret,
          proxy_url: data.proxyUrl,
        },
      }),
    });
    if (res.ok) {
      fetchConfig();
    }
  };

  // 8. Test Token
  const handleTestToken = async (data: { appId: string; appSecret?: string; proxyUrl?: string }) => {
    const res = await safeFetchJson('/api/wechat/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: data.appId,
        app_secret: data.appSecret,
        proxy_url: data.proxyUrl,
      }),
    });
    return res.data;
  };

  // Export current Markdown to local .md file
  const handleExportMarkdown = useCallback(() => {
    try {
      const cleanTitle = (metadata.title || 'wechat-draft')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim();
      const filename = `${cleanTitle || 'wechat-article'}.md`;
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📄 已成功保存并导出本地 Markdown 文件');
    } catch (err) {
      console.error('Export error:', err);
    }
  }, [markdown, metadata.title, showToast]);

  // Handle Publish Click with Gentle Credentials Notice Interception
  const handlePublishClick = (dryRun: boolean) => {
    if (!dryRun && (!config.appId || !config.hasSecret)) {
      setIsNoCredentialsPromptOpen(true);
      return;
    }
    executePublish(dryRun);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl / Cmd + S -> Export Markdown
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportMarkdown();
        return;
      }

      // 2. Ctrl / Cmd + Shift + C -> Copy WeChat Inlined HTML
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyWeChatHtml();
        showToast('📋 已复制微信高兼容排版到剪贴板');
        return;
      }

      // 3. Ctrl / Cmd + Enter -> Dry-run test
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        executePublish(true);
        showToast('⚡ 快捷键触发：已启动一键试运行校验');
        return;
      }

      // 4. Ctrl / Cmd + / or F1 -> Open Help Guide
      if (((e.metaKey || e.ctrlKey) && e.key === '/') || e.key === 'F1') {
        e.preventDefault();
        setIsHelpGuideOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportMarkdown, executePublish, handleCopyWeChatHtml, showToast]);

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === activeTheme) || THEME_OPTIONS[0];

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        onPublish={handlePublishClick}
        onCopyHtml={handleCopyWeChatHtml}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCli={() => setIsCliOpen(true)}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onOpenDraftManager={() => setIsDraftManagerOpen(true)}
        onOpenSponsor={() => setIsSponsorOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        isCopied={isCopied}
        hasCredentials={!!config.appId && config.hasSecret}
        isPublishing={isPublishing}
      />

      {/* Toolbar */}
      <Toolbar
        currentTheme={activeTheme}
        onThemeChange={(th) => setActiveTheme(th)}
        themeEnabled={themeEnabled}
        onToggleThemeEnabled={() => setThemeEnabled((prev) => !prev)}
        articleType={articleType}
        onArticleTypeChange={(type) => {
          setArticleType(type);
          handleMetadataChange({ article_type: type });
        }}
        macStyle={macStyle}
        onToggleMacStyle={() => setMacStyle(!macStyle)}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        onSelectSample={handleSelectSample}
        currentSampleId={currentSampleId}
        charCount={charCount}
        htmlLength={htmlLength}
        digestLength={metadata.digest.length}
        lastSaved={lastSaved}
      />

      {/* Main Workspace: Split Pane */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Markdown Editor & Metadata tabs */}
        <div className="w-full md:w-1/2 lg:w-5/12 h-full flex flex-col min-h-0">
          <MarkdownEditor
            markdown={markdown}
            onMarkdownChange={(val) => setMarkdown(val)}
            metadata={metadata}
            onMetadataChange={handleMetadataChange}
            history={history}
            scannedImages={scannedImages}
            onRefreshHistory={fetchHistory}
          />
        </div>

        {/* Right: Mobile Simulator & Preview */}
        <div className="w-full md:w-1/2 lg:w-7/12 h-full min-h-0 bg-neutral-950 overflow-hidden">
          <WeChatSimulator
            metadata={metadata}
            inlinedHtml={inlinedHtml}
            viewMode={viewMode}
            themeColor={currentThemeObj.color}
            themeEnabled={themeEnabled}
            themeName={currentThemeObj.name}
            articleType={articleType}
            newspicCaption={newspicCaption}
            scannedImages={scannedImages}
          />
        </div>
      </main>

      {/* Publish Flow Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        isDryRun={publishIsDryRun}
        isPublishing={isPublishing}
        result={publishResult}
        error={publishError}
        logs={publishLogs}
        onRetry={(dryRun, force) => executePublish(dryRun, force)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        appId={config.appId}
        hasSecret={config.hasSecret}
        proxyUrl={config.proxyUrl}
        onSave={handleSaveSettings}
        onTestToken={handleTestToken}
        onReloadConfig={handleReloadConfig}
      />

      {/* CLI Modal */}
      <CliModal
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
        activeTheme={activeTheme}
      />

      {/* AI Article Generator Modal */}
      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyArticle={handleApplyAiArticle}
      />

      {/* WeChat Draft Management & FreePublish Modal */}
      <DraftManagementModal
        isOpen={isDraftManagerOpen}
        onClose={() => setIsDraftManagerOpen(false)}
        onLoadDraftIntoEditor={handleLoadDraftIntoEditor}
        currentEditorArticle={{
          title: metadata.title,
          author: metadata.author,
          markdown,
          digest: metadata.digest,
          cover: metadata.cover,
        }}
      />

      {/* Sponsor / Donation Modal */}
      <SponsorModal
        isOpen={isSponsorOpen}
        onClose={() => setIsSponsorOpen(false)}
      />

      {/* Welcome Onboarding Wizard */}
      <WelcomeGuideModal
        isOpen={isWelcomeGuideOpen}
        onClose={() => setIsWelcomeGuideOpen(false)}
        onOpenSettings={() => {
          setIsWelcomeGuideOpen(false);
          setIsSettingsOpen(true);
        }}
        onDryRun={() => {
          setIsWelcomeGuideOpen(false);
          executePublish(true);
        }}
        onLoadSample={() => handleSelectSample('official-guide')}
        hasCredentials={!!config.appId && config.hasSecret}
      />

      {/* Help & Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpGuideOpen}
        onClose={() => setIsHelpGuideOpen(false)}
        onOpenWelcomeGuide={() => setIsWelcomeGuideOpen(true)}
        onOpenSettings={() => {
          setIsHelpGuideOpen(false);
          setIsSettingsOpen(true);
        }}
        onLoadSample={() => handleSelectSample('official-guide')}
      />

      {/* Gentle No-Credentials Prompt Notice */}
      <NoCredentialsNoticeModal
        isOpen={isNoCredentialsPromptOpen}
        onClose={() => setIsNoCredentialsPromptOpen(false)}
        onOpenSettings={() => {
          setIsNoCredentialsPromptOpen(false);
          setIsSettingsOpen(true);
        }}
        onDryRun={() => {
          setIsNoCredentialsPromptOpen(false);
          executePublish(true);
        }}
        onCopyHtml={() => {
          setIsNoCredentialsPromptOpen(false);
          handleCopyWeChatHtml();
        }}
      />

      {/* Floating Keyboard Shortcut / Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-850 text-neutral-100 border border-neutral-700/80 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-medium animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
