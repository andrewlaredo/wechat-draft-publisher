import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ThemeDesignerModal } from './components/ThemeDesignerModal.tsx';
import { MultiArticleComposerModal, MultiArticleDraftItem } from './components/MultiArticleComposerModal.tsx';
import { MatrixPublishModal } from './components/MatrixPublishModal.tsx';
import { WatchModeModal } from './components/WatchModeModal.tsx';
import { ArticleExtractModal } from './components/ArticleExtractModal.tsx';
import { LongImageExportModal } from './components/LongImageExportModal.tsx';
import { SafetyAuditModal } from './components/SafetyAuditModal.tsx';
import { CoverDesignerModal } from './components/CoverDesignerModal.tsx';
import { InteractiveComponentsModal } from './components/InteractiveComponentsModal.tsx';
import { HeadlineLabModal } from './components/HeadlineLabModal.tsx';
import { CommandPaletteModal, CommandItem } from './components/CommandPaletteModal.tsx';
import { EditorialCalendarModal } from './components/EditorialCalendarModal.tsx';
import { performSafetyAudit } from './utils/safetyAudit.ts';
import { upsertEditorialTask, EditorialTask } from './utils/editorialManager.ts';
import {
  Send,
  Sparkles,
  Palette,
  ShieldCheck,
  Flame,
  Calendar,
  Share2,
  FileImage,
  Inbox,
  Settings as SettingsIcon,
  HelpCircle,
  Eye,
  Minimize2,
  Layers,
  DownloadCloud,
} from 'lucide-react';
import {
  WeChatAccountConfig,
  getStoredAccounts,
  getActiveAccountId,
  setActiveAccountId,
} from './utils/accountManager.ts';
import { saveSnapshot } from './utils/snapshotManager.ts';
import { SAMPLE_ARTICLES } from './data/samples.ts';
import { ArticleMeta, PublishHistoryItem, PublishLogItem } from './types/app.ts';
import { GeneratedArticleResult } from './ai/generator.ts';
import { wechatHtmlToMarkdown } from './markdown/html2md.ts';
import { safeFetchJson } from './utils/safeFetch.ts';
import { renderMarkdownLocally } from './markdown/clientRender.ts';
import { getCustomThemes, ThemeConfig } from './markdown/style.ts';

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
  const [isThemeDesignerOpen, setIsThemeDesignerOpen] = useState<boolean>(false);
  const [isMultiArticleOpen, setIsMultiArticleOpen] = useState<boolean>(false);
  const [isMatrixPublishOpen, setIsMatrixPublishOpen] = useState<boolean>(false);
  const [isWatchModeOpen, setIsWatchModeOpen] = useState<boolean>(false);
  const [isExtractArticleOpen, setIsExtractArticleOpen] = useState<boolean>(false);
  const [isLongImageExportOpen, setIsLongImageExportOpen] = useState<boolean>(false);
  const [isSafetyAuditOpen, setIsSafetyAuditOpen] = useState<boolean>(false);
  const [isCoverDesignerOpen, setIsCoverDesignerOpen] = useState<boolean>(false);
  const [isInteractiveComponentsOpen, setIsInteractiveComponentsOpen] = useState<boolean>(false);
  const [isHeadlineLabOpen, setIsHeadlineLabOpen] = useState<boolean>(false);
  const [isEditorialCalendarOpen, setIsEditorialCalendarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<WeChatAccountConfig[]>(() => getStoredAccounts());
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(() => getActiveAccountId());

  const currentTargetAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) || accounts[0] || null;
  }, [accounts, activeAccountId]);

  const handleSwitchAccount = async (id: string) => {
    setActiveAccountId(id);
    setActiveAccountIdState(id);
    const target = accounts.find((a) => a.id === id);
    if (target) {
      await handleSaveSettings({
        appId: target.appId,
        appSecret: target.appSecret,
        proxyUrl: target.proxyUrl,
      });
      showToast(`已切换当前公众号目标为「${target.name}」！`);
    }
  };

  const [customThemes, setCustomThemes] = useState<Record<string, ThemeConfig>>(() => {
    return getCustomThemes();
  });

  // Multi-article series state (可视化多图文拖拽编排)
  const [currentArticleId, setCurrentArticleId] = useState<string>('draft-primary');
  const [multiArticles, setMultiArticles] = useState<MultiArticleDraftItem[]>(() => [
    {
      id: 'draft-primary',
      title: '微信公众号草稿自动化发布实战指南',
      author: '科技探索者',
      digest: '探索如何通过 Markdown 快速排版、自动内联样式并将图文无缝推送到微信公众号草稿箱，提升自媒体创作者效率。',
      markdown: SAMPLE_ARTICLES[0].markdown,
      cover: './images/01-mars-default.png',
      theme: 'tech-blue',
    },
  ]);
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
      const customThemeConfig = customThemes[activeTheme];
      const localResult = renderMarkdownLocally(markdown, {
        theme: activeTheme,
        themeEnabled,
        macStyle,
        customThemeConfig,
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
  }, [markdown, activeTheme, themeEnabled, macStyle, customThemes]);

  // Pre-publish Content Compliance & Safety Audit Report
  const safetyReport = useMemo(() => {
    return performSafetyAudit({
      markdown,
      title: metadata.title,
      digest: metadata.digest,
      inlinedHtml,
    });
  }, [markdown, metadata.title, metadata.digest, inlinedHtml]);

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

  // 3.7 Handle Custom Theme Application
  const handleApplyCustomTheme = (themeConfig: ThemeConfig) => {
    setCustomThemes(getCustomThemes());
    setActiveTheme(themeConfig.name);
    setMultiArticles((articles) =>
      articles.map((item) => (item.id === currentArticleId ? { ...item, theme: themeConfig.name } : item))
    );
    showToast(`🎨 已成功应用主题「${themeConfig.label}」`);
  };

  // 3.8 Handle Multi-article Item Selection
  const handleSelectMultiArticle = (articleId: string) => {
    const found = multiArticles.find((a) => a.id === articleId);
    if (found) {
      setCurrentArticleId(found.id);
      setMarkdown(found.markdown);
      if (found.theme) setActiveTheme(found.theme);
      setMetadata((prev) => ({
        ...prev,
        title: found.title,
        author: found.author,
        digest: found.digest,
        cover: found.cover,
        theme: found.theme || prev.theme,
      }));
      showToast(`📑 已切换编辑「${found.title}」`);
    }
  };

  // 3.9 Handle Multi-article List Update
  const handleUpdateMultiArticles = (updatedArticles: MultiArticleDraftItem[]) => {
    setMultiArticles(updatedArticles);
    const current = updatedArticles.find((a) => a.id === currentArticleId);
    if (current) {
      setMetadata((prev) => ({
        ...prev,
        title: current.title,
        author: current.author,
        digest: current.digest,
        cover: current.cover,
        theme: current.theme || prev.theme,
      }));
    }
  };

  const handleMarkdownChange = (newMd: string) => {
    setMarkdown(newMd);
    setMultiArticles((articles) =>
      articles.map((item) => (item.id === currentArticleId ? { ...item, markdown: newMd } : item))
    );
  };

  // 4. Update metadata from Form tab (sync back to markdown front matter)
  const handleMetadataChange = (updated: Partial<ArticleMeta>) => {
    const newMeta = { ...metadata, ...updated };
    if (updated.article_type) {
      setArticleType(updated.article_type);
    }
    setMetadata(newMeta);
    setMultiArticles((articles) =>
      articles.map((item) =>
        item.id === currentArticleId
          ? {
              ...item,
              title: newMeta.title,
              author: newMeta.author,
              digest: newMeta.digest,
              cover: newMeta.cover || item.cover,
              theme: activeTheme,
            }
          : item
      )
    );

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

    // Save milestone snapshot before publishing
    if (!dryRun) {
      saveSnapshot({
        title: metadata.title,
        markdown,
        theme: activeTheme,
        tag: 'publish',
        label: `推送草稿箱前备份 (${new Date().toLocaleTimeString()})`,
      });
    }

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

        // Auto-sync into editorial manager asset archive
        upsertEditorialTask({
          title: metadata.title,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          accountId: currentTargetAccount?.id || 'default',
          accountName: currentTargetAccount?.name || '主号公众号',
          accountTag: currentTargetAccount?.tag || '主号',
          status: dryRun ? 'drafted' : 'published',
          category: 'tech',
          markdown,
          digest: metadata.digest,
          coverUrl: metadata.cover,
          mediaId: res.data.result?.media_id,
          targetPlatforms: ['微信公众号'],
          wordCount: markdown.length,
        });
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

  // Handle Publish Click with Gentle Credentials Notice & Safety Audit Interception
  const handlePublishClick = (dryRun: boolean) => {
    if (!dryRun && (!config.appId || !config.hasSecret)) {
      setIsNoCredentialsPromptOpen(true);
      return;
    }
    if (!dryRun && safetyReport.highCount > 0) {
      const targetName = currentTargetAccount?.name || config.appId;
      const confirmed = confirm(
        `【发布合规安全警示】\n\n检测到当前文章包含 ${safetyReport.highCount} 处高规违规项（如诱导分享或超长 HTML），可能导致微信公众平台审核拦截甚至账号处罚！\n\n目标发布账号：「${targetName}」\n\n是否仍然强制推送？\n（点击【取消】可查看合规体检报告并一键自动修复）`
      );
      if (!confirmed) {
        setIsSafetyAuditOpen(true);
        return;
      }
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

      // 5. Ctrl / Cmd + K -> Global Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportMarkdown, executePublish, handleCopyWeChatHtml, showToast]);

  // Load an editorial task into the editor
  const handleLoadTaskIntoEditor = (task: EditorialTask) => {
    if (task.markdown) {
      setMarkdown(task.markdown);
    }
    setMetadata((prev) => ({
      ...prev,
      title: task.title || prev.title,
      digest: task.digest || prev.digest,
      cover: task.coverUrl || prev.cover,
    }));
    showToast(`📑 已成功载入排期文章《${task.title}》！`);
  };

  // Commands definition for Global Command Palette (Cmd+K)
  const commandList: CommandItem[] = useMemo(() => [
    {
      id: 'cmd-publish',
      title: '推送至微信公众号草稿箱',
      subtitle: '自动内联富文本样式、无损压缩配图并直推微信官方草稿箱',
      category: 'publish',
      icon: <Send className="w-4 h-4 text-emerald-400" />,
      shortcut: '⌘P',
      keywords: ['发布', '草稿', '推送', 'publish', 'draft', 'wechat'],
      action: () => handlePublishClick(false),
    },
    {
      id: 'cmd-dryrun',
      title: '推演测试发布 (Dry Run 预检)',
      subtitle: '无需微信凭据，本地模拟完整流水线、样式检查与素材校验',
      category: 'publish',
      icon: <Send className="w-4 h-4 text-amber-400" />,
      shortcut: '⌘↵',
      keywords: ['试运行', '演练', '推演', 'dryrun', 'test'],
      action: () => executePublish(true),
    },
    {
      id: 'cmd-matrix',
      title: '多平台内容矩阵一键分发',
      subtitle: '一键将文章适配并分发到知乎、掘金、CSDN、小红书等 9 大平台',
      category: 'publish',
      icon: <Share2 className="w-4 h-4 text-indigo-400" />,
      keywords: ['矩阵', '知乎', '掘金', 'csdn', '小红书', '分发', 'matrix'],
      action: () => setIsMatrixPublishOpen(true),
    },
    {
      id: 'cmd-safety',
      title: '内容合规安全体检 (广告法与防封扫描)',
      subtitle: '新广告法极限词、诱导分享违规检测与一键合规修复',
      category: 'publish',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      keywords: ['体检', '违禁词', '广告法', '安全', '合规', 'safety', 'audit'],
      action: () => setIsSafetyAuditOpen(true),
    },
    {
      id: 'cmd-headline',
      title: '爆款标题实验室与微信列表截断诊断',
      subtitle: '微信订阅号常读流、对话转发与朋友圈卡片截断实时诊断与公式派生',
      category: 'operation',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      keywords: ['标题', '爆款', '截断', '点击率', 'headline', 'title'],
      action: () => setIsHeadlineLabOpen(true),
    },
    {
      id: 'cmd-calendar',
      title: '运营日历与发文资产档案管理',
      subtitle: '甘特排期、发文资产台账沉淀、数据看板与 CSV 导出',
      category: 'operation',
      icon: <Calendar className="w-4 h-4 text-blue-400" />,
      keywords: ['日历', '排期', '资产', '统计', '复盘', 'calendar', 'schedule'],
      action: () => setIsEditorialCalendarOpen(true),
    },
    {
      id: 'cmd-cover',
      title: '微信封面图设计工坊 (2.35:1 标准)',
      subtitle: '大厂爆款封面模板，带微信安全区辅助线，一键应用或导出',
      category: 'visual',
      icon: <Palette className="w-4 h-4 text-rose-400" />,
      keywords: ['封面', '设计', '配图', '安全区', 'cover', 'design'],
      action: () => setIsCoverDesignerOpen(true),
    },
    {
      id: 'cmd-components',
      title: '微信爆款排版组件物料库',
      subtitle: '金句框、微信对话气泡、步骤条、折叠答疑等 18+ 款高转化视觉物料',
      category: 'visual',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      keywords: ['物料', '组件', '气泡', '金句', '对话', 'components', 'material'],
      action: () => setIsInteractiveComponentsOpen(true),
    },
    {
      id: 'cmd-longimage',
      title: '导出排版长图',
      subtitle: '生成高清长图卡片海报，便于手机保存与全平台传播',
      category: 'visual',
      icon: <FileImage className="w-4 h-4 text-amber-400" />,
      keywords: ['长图', '海报', 'export', 'image'],
      action: () => setIsLongImageExportOpen(true),
    },
    {
      id: 'cmd-extract',
      title: '微信线上文章一键逆向提取',
      subtitle: '粘贴公开微信文章链接，自动抓取图文并逆向清洗为 Markdown',
      category: 'visual',
      icon: <DownloadCloud className="w-4 h-4 text-blue-400" />,
      keywords: ['提取', '抓取', '导入', 'extract', 'reverse'],
      action: () => setIsExtractArticleOpen(true),
    },
    {
      id: 'cmd-theme-designer',
      title: '自定义 CSS / 主题设计器',
      subtitle: '调整专属品牌色彩体系、字号行高与字间距',
      category: 'format',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      keywords: ['主题', '设计', 'css', 'style', 'color'],
      action: () => setIsThemeDesignerOpen(true),
    },
    {
      id: 'cmd-multi-article',
      title: '多图文合集拖拽编排工作台',
      subtitle: '最多编排 8 篇图文消息，支持拖拽调整头条与次条顺序',
      category: 'format',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      keywords: ['多图文', '合集', '次条', '头条', 'multi'],
      action: () => setIsMultiArticleOpen(true),
    },
    {
      id: 'cmd-drafts',
      title: '微信官方草稿箱与群发管理',
      subtitle: '查看已推送草稿列表、一键正式群发 (FreePublish) 与素材库',
      category: 'operation',
      icon: <Inbox className="w-4 h-4 text-blue-400" />,
      keywords: ['草稿箱', '群发', '发布历史', '素材', 'drafts', 'freepublish'],
      action: () => setIsDraftManagerOpen(true),
    },
    {
      id: 'cmd-ai',
      title: 'Gemini AI 智能爆款文章生成',
      subtitle: '输入灵感主题，根据微信爆款模板一键创作万字深度图文',
      category: 'operation',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      keywords: ['ai', '生成', '写文章', 'gemini', 'gpt'],
      action: () => setIsAiModalOpen(true),
    },
    {
      id: 'cmd-zen',
      title: isZenMode ? '退出禅模式 (恢复双栏预览)' : '开启禅模式 (全屏沉浸专注编辑)',
      subtitle: '隐藏右侧手机模拟器与侧栏，专注于灵感码字',
      category: 'view',
      icon: isZenMode ? <Minimize2 className="w-4 h-4 text-neutral-400" /> : <Eye className="w-4 h-4 text-neutral-400" />,
      keywords: ['禅模式', '专注', '全屏', 'zen', 'focus'],
      action: () => setIsZenMode((prev) => !prev),
    },
    {
      id: 'cmd-settings',
      title: '凭据配置与多账号管理',
      subtitle: '微信 AppID/Secret 管理、多账号标签矩阵、批量连通性体检',
      category: 'view',
      icon: <SettingsIcon className="w-4 h-4 text-neutral-400" />,
      keywords: ['设置', '配置', '账号', '凭据', 'settings', 'appid'],
      action: () => setIsSettingsOpen(true),
    },
    {
      id: 'cmd-help',
      title: '使用帮助手册与发布避坑规范',
      subtitle: '草稿箱 API 白名单设置、图片防重复上传机制与常见问题',
      category: 'view',
      icon: <HelpCircle className="w-4 h-4 text-neutral-400" />,
      keywords: ['帮助', '手册', '教程', 'help', 'guide'],
      action: () => setIsHelpGuideOpen(true),
    },
  ], [isZenMode]);

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === activeTheme) || THEME_OPTIONS[0];

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-100 overflow-hidden font-sans">
      {/* Header: Global Tools & Distribution */}
      <Header
        onPublish={handlePublishClick}
        onCopyHtml={handleCopyWeChatHtml}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCli={() => setIsCliOpen(true)}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onOpenDraftManager={() => setIsDraftManagerOpen(true)}
        onOpenSponsor={() => setIsSponsorOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onOpenMatrixPublish={() => setIsMatrixPublishOpen(true)}
        onOpenWatchMode={() => setIsWatchModeOpen(true)}
        onOpenExtractArticle={() => setIsExtractArticleOpen(true)}
        onOpenLongImageExport={() => setIsLongImageExportOpen(true)}
        onOpenSafetyAudit={() => setIsSafetyAuditOpen(true)}
        onOpenCoverDesigner={() => setIsCoverDesignerOpen(true)}
        onOpenHeadlineLab={() => setIsHeadlineLabOpen(true)}
        onOpenEditorialCalendar={() => setIsEditorialCalendarOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSwitchAccount={handleSwitchAccount}
        isCopied={isCopied}
        hasCredentials={!!config.appId && config.hasSecret}
        isPublishing={isPublishing}
      />

      {/* Toolbar: Editor, Layouts & Themes */}
      <Toolbar
        currentTheme={activeTheme}
        onThemeChange={(th) => {
          setActiveTheme(th);
          setMultiArticles((articles) =>
            articles.map((item) => (item.id === currentArticleId ? { ...item, theme: th } : item))
          );
        }}
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
        onOpenThemeDesigner={() => setIsThemeDesignerOpen(true)}
        customThemes={customThemes}
        onOpenMultiArticleComposer={() => setIsMultiArticleOpen(true)}
        multiArticlesCount={multiArticles.length}
        onOpenLongImageExport={() => setIsLongImageExportOpen(true)}
        onOpenSafetyAudit={() => setIsSafetyAuditOpen(true)}
        safetyScore={safetyReport.score}
        onOpenCoverDesigner={() => setIsCoverDesignerOpen(true)}
        onOpenInteractiveComponents={() => setIsInteractiveComponentsOpen(true)}
        onOpenHeadlineLab={() => setIsHeadlineLabOpen(true)}
        onOpenEditorialCalendar={() => setIsEditorialCalendarOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace: Split Pane or Zen Focus Mode */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* Left: Markdown Editor & Metadata tabs */}
        <div className={`h-full flex flex-col min-h-0 transition-all duration-200 ${
          isZenMode ? 'w-full' : 'w-full md:w-1/2 lg:w-5/12'
        }`}>
          <MarkdownEditor
            markdown={markdown}
            onMarkdownChange={handleMarkdownChange}
            metadata={metadata}
            onMetadataChange={handleMetadataChange}
            history={history}
            scannedImages={scannedImages}
            onRefreshHistory={fetchHistory}
            isZenMode={isZenMode}
            onToggleZenMode={() => setIsZenMode((prev) => !prev)}
            onOpenCoverDesigner={() => setIsCoverDesignerOpen(true)}
          />
        </div>

        {/* Right: Mobile Simulator & Preview */}
        {!isZenMode && (
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
              onOpenLongImageExport={() => setIsLongImageExportOpen(true)}
            />
          </div>
        )}
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
        onCopyHtml={handleCopyWeChatHtml}
        targetAccount={currentTargetAccount}
        safetyScore={safetyReport.score}
        onOpenSafetyAudit={() => setIsSafetyAuditOpen(true)}
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
        onAccountsChange={(nextAccs, nextActiveId) => {
          setAccounts(nextAccs);
          setActiveAccountIdState(nextActiveId);
        }}
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
        onApplyThumbMediaId={(thumbMediaId, coverUrl) => {
          setMetadata((prev) => ({
            ...prev,
            thumb_media_id: thumbMediaId,
            cover: coverUrl || prev.cover,
          }));
          showToast(`✨ 已成功绑定已有永久素材 MediaID 作为封面！`);
        }}
        onInsertImageToEditor={(imageMd) => {
          setMarkdown((prev) => `${prev}\n${imageMd}`);
          showToast(`🖼️ 已将素材图片插入正文！`);
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

      {/* Custom CSS & Theme Designer Modal */}
      <ThemeDesignerModal
        isOpen={isThemeDesignerOpen}
        onClose={() => setIsThemeDesignerOpen(false)}
        currentTheme={activeTheme}
        onApplyTheme={handleApplyCustomTheme}
      />

      {/* Multi-article Visual Composer Modal */}
      <MultiArticleComposerModal
        isOpen={isMultiArticleOpen}
        onClose={() => setIsMultiArticleOpen(false)}
        articles={multiArticles}
        currentArticleId={currentArticleId}
        onSelectArticle={handleSelectMultiArticle}
        onUpdateArticles={handleUpdateMultiArticles}
        defaultAuthor={metadata.author || '公众号作者'}
        defaultTheme={activeTheme}
      />

      {/* Multi-platform Matrix Publisher Modal */}
      <MatrixPublishModal
        isOpen={isMatrixPublishOpen}
        onClose={() => setIsMatrixPublishOpen(false)}
        markdown={markdown}
        inlinedHtml={inlinedHtml}
        metadata={{
          title: metadata.title,
          author: metadata.author,
          digest: metadata.digest,
          cover: metadata.cover,
          images: scannedImages,
        }}
        onPublishWeChat={(dryRun) => {
          setIsMatrixPublishOpen(false);
          executePublish(dryRun);
        }}
        onCopyWeChatHtml={handleCopyWeChatHtml}
      />

      {/* Directory Watch Mode Modal */}
      <WatchModeModal
        isOpen={isWatchModeOpen}
        onClose={() => setIsWatchModeOpen(false)}
        onSyncDraftToEditor={(md) => {
          setMarkdown(md);
          showToast('已从本地监听文件同步最新内容！');
        }}
      />

      {/* WeChat Online Article Reverse Extractor Modal */}
      <ArticleExtractModal
        isOpen={isExtractArticleOpen}
        onClose={() => setIsExtractArticleOpen(false)}
        onApplyMarkdown={(extractedMd, meta) => {
          setMarkdown(extractedMd);
          setMetadata((prev) => ({
            ...prev,
            title: meta.title || prev.title,
            author: meta.author || prev.author,
            digest: meta.digest || prev.digest,
            cover: meta.cover || prev.cover,
          }));
          showToast(`📥 成功提取并载入文章《${meta.title}》！`);
        }}
        onAddToMultiArticle={(art) => {
          const newItem: MultiArticleDraftItem = {
            id: `art_${Date.now()}`,
            title: art.title,
            author: art.author,
            digest: art.digest,
            markdown: art.markdown,
            cover: art.cover || '',
            theme: activeTheme,
          };
          setMultiArticles((prev) => [...prev, newItem]);
          showToast(`📑 已将《${art.title}》加入多图文编排！`);
        }}
      />

      {/* Long Image Export Modal */}
      <LongImageExportModal
        isOpen={isLongImageExportOpen}
        onClose={() => setIsLongImageExportOpen(false)}
        inlinedHtml={inlinedHtml}
        metadata={metadata}
        activeTheme={activeTheme}
        currentThemeObj={currentThemeObj}
      />

      {/* Content Safety & Compliance Audit Guard Modal */}
      <SafetyAuditModal
        isOpen={isSafetyAuditOpen}
        onClose={() => setIsSafetyAuditOpen(false)}
        markdown={markdown}
        title={metadata.title}
        digest={metadata.digest}
        inlinedHtml={inlinedHtml}
        onApplyFixedMarkdown={(fixedMd) => {
          setMarkdown(fixedMd);
          showToast('✨ 已完成合规脱敏修复！');
        }}
      />

      {/* WeChat 2.35:1 & Multi-ratio Cover Image Design Workshop Modal */}
      <CoverDesignerModal
        isOpen={isCoverDesignerOpen}
        onClose={() => setIsCoverDesignerOpen(false)}
        title={metadata.title}
        author={metadata.author}
        digest={metadata.digest}
        onApplyCover={(coverDataUrl) => {
          setMetadata((prev) => ({ ...prev, cover: coverDataUrl }));
          showToast('🎨 封面设计已成功应用至当前文章！');
        }}
      />

      {/* WeChat Viral Interactive Components & Rich Material Library Modal */}
      <InteractiveComponentsModal
        isOpen={isInteractiveComponentsOpen}
        onClose={() => setIsInteractiveComponentsOpen(false)}
        onInsertComponent={(template, name) => {
          setMarkdown((prev) => `${prev.trim()}\n\n${template.trim()}\n\n`);
          showToast(`✨ 已成功插入排版物料「${name}」！`);
        }}
      />

      {/* Viral Headline Lab & WeChat Truncation Diagnostic Modal */}
      <HeadlineLabModal
        isOpen={isHeadlineLabOpen}
        onClose={() => setIsHeadlineLabOpen(false)}
        currentTitle={metadata.title}
        author={metadata.author}
        digest={metadata.digest}
        coverUrl={metadata.cover}
        onApplyTitle={(newTitle) => {
          setMetadata((prev) => ({ ...prev, title: newTitle }));
          showToast(`🔥 已成功采用爆款标题：《${newTitle}》！`);
        }}
      />

      {/* Editorial Calendar & Publishing Asset Archive Management Modal */}
      <EditorialCalendarModal
        isOpen={isEditorialCalendarOpen}
        onClose={() => setIsEditorialCalendarOpen(false)}
        accounts={accounts}
        currentEditorArticle={{
          title: metadata.title,
          author: metadata.author,
          markdown,
          digest: metadata.digest,
          cover: metadata.cover,
        }}
        onLoadTaskIntoEditor={handleLoadTaskIntoEditor}
      />

      {/* Global Command Palette Modal (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandList}
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
