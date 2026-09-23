import React, { useState, useEffect } from 'react';
import {
  X,
  Inbox,
  Layers,
  Trash2,
  Send,
  ExternalLink,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Plus,
  Image as ImageIcon,
  Database,
  Calendar,
  Check,
  FolderUp,
  FileText,
  Sparkles,
  UploadCloud,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { wechatHtmlToMarkdown } from '../markdown/html2md.ts';
import { safeFetchJson } from '../utils/safeFetch.ts';
import { pickNativeMarkdown, isWails } from '../utils/wails.ts';

interface DraftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraftIntoEditor: (article: { title: string; author: string; content: string; digest: string }) => void;
  currentEditorArticle: {
    title: string;
    author: string;
    markdown: string;
    digest: string;
    cover?: string;
  };
}

export const DraftManagementModal: React.FC<DraftManagementModalProps> = ({
  isOpen,
  onClose,
  onLoadDraftIntoEditor,
  currentEditorArticle,
}) => {
  const [activeTab, setActiveTab] = useState<'drafts' | 'multi' | 'cache'>('drafts');

  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Free publish state
  const [publishingMediaId, setPublishingMediaId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<any | null>(null);
  const [publishingTaskId, setPublishingTaskId] = useState<string | null>(null);

  // Multi-article composer state
  const [isUserModifiedMulti, setIsUserModifiedMulti] = useState(false);
  const [multiArticles, setMultiArticles] = useState<
    Array<{
      id: string;
      title: string;
      author: string;
      digest: string;
      markdownContent: string;
      cover?: string;
    }>
  >([]);
  const [multiDryRun, setMultiDryRun] = useState(false);
  const [multiPublishing, setMultiPublishing] = useState(false);
  const [multiPublishResult, setMultiPublishResult] = useState<any | null>(null);
  const [multiError, setMultiError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncingMain, setIsSyncingMain] = useState(false);
  const [draftPickerTargetIdx, setDraftPickerTargetIdx] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Sync editor content to multi-articles when modal opens if user hasn't heavily customized
  useEffect(() => {
    if (isOpen && (!isUserModifiedMulti || multiArticles.length === 0)) {
      let cleanTitle = currentEditorArticle.title || '头条文章';
      let cleanAuthor = currentEditorArticle.author || '作者';
      let cleanDigest = currentEditorArticle.digest || '';
      let cleanCover = currentEditorArticle.cover || '';
      let cleanMd = currentEditorArticle.markdown || '# 正文标题\n\n正文内容...';

      // Parse front matter if markdown has it
      const fmMatch = cleanMd.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (fmMatch) {
        const yamlStr = fmMatch[1];
        cleanMd = fmMatch[2].trim();
        const tMatch = yamlStr.match(/^title:\s*["']?(.*?)["']?$/m);
        if (tMatch) cleanTitle = tMatch[1].trim();
        const aMatch = yamlStr.match(/^author:\s*["']?(.*?)["']?$/m);
        if (aMatch) cleanAuthor = aMatch[1].trim();
        const dMatch = yamlStr.match(/^digest:\s*["']?(.*?)["']?$/m);
        if (dMatch) cleanDigest = dMatch[1].trim();
        const cMatch = yamlStr.match(/^cover:\s*["']?(.*?)["']?$/m);
        if (cMatch) cleanCover = cMatch[1].trim();
      }

      setMultiArticles([
        {
          id: 'item_1',
          title: cleanTitle,
          author: cleanAuthor,
          digest: cleanDigest,
          markdownContent: cleanMd,
          cover: cleanCover,
        },
        {
          id: 'item_2',
          title: '次条图文资讯推荐',
          author: cleanAuthor,
          digest: '精选实用工具与深度洞察分享',
          markdownContent: '## 今日精选\n\n- 实用工具分享\n- 高效排版实践',
          cover: '',
        },
      ]);
    }
  }, [isOpen]);

  // Cache state
  const [cacheStats, setCacheStats] = useState<{ total_items: number; items: any[] }>({
    total_items: 0,
    items: [],
  });
  const [loadingCache, setLoadingCache] = useState(false);

  // Fetch drafts
  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    setDraftError(null);
    try {
      const resp = await safeFetchJson('/api/wechat/drafts?offset=0&count=20&noContent=0');
      if (resp.ok && resp.data) {
        setDrafts(resp.data.item || []);
        setTotalCount(resp.data.total_count || 0);
      } else {
        setDraftError(resp.data?.error || resp.error || '获取草稿列表失败');
      }
    } catch (err: any) {
      setDraftError(err.message || '网络连接异常');
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Fetch cache
  const fetchCache = async () => {
    setLoadingCache(true);
    try {
      const resp = await safeFetchJson('/api/media/cache');
      if (resp.ok && resp.data) {
        setCacheStats(resp.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingCache(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'drafts') fetchDrafts();
      if (activeTab === 'cache') fetchCache();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Delete draft handler
  const handleDeleteDraft = async (mediaId: string) => {
    if (!window.confirm(`确定要从微信官方草稿箱中彻底删除此草稿吗？\nMedia ID: ${mediaId}`)) {
      return;
    }
    try {
      const resp = await safeFetchJson(`/api/wechat/draft/${mediaId}`, { method: 'DELETE' });
      if (resp.ok && resp.data?.success) {
        setDrafts((prev) => prev.filter((d) => d.media_id !== mediaId));
        setTotalCount((c) => Math.max(0, c - 1));
      } else {
        alert(resp.data?.error || resp.error || '删除失败');
      }
    } catch (err: any) {
      alert(`删除请求异常: ${err.message}`);
    }
  };

  // Load draft into editor with HTML purified to pure Markdown
  const handleLoadDraft = async (mediaId: string) => {
    try {
      const resp = await safeFetchJson(`/api/wechat/draft/${mediaId}`);
      if (resp.ok && resp.data?.news_item && resp.data.news_item.length > 0) {
        const first = resp.data.news_item[0];
        const pureMarkdown = wechatHtmlToMarkdown(first.content || '');
        onLoadDraftIntoEditor({
          title: first.title || '',
          author: first.author || '',
          content: pureMarkdown,
          digest: first.digest || '',
        });
        alert(`已成功将草稿「${first.title}」转换为纯净 Markdown 并回填至当前编辑器！`);
        onClose();
      } else {
        alert(resp.data?.error || resp.error || '未获取到草稿正文');
      }
    } catch (err: any) {
      alert(`获取草稿内容失败: ${err.message}`);
    }
  };

  // Sync current editor article to main article (#1) in multi-articles
  const handleSyncCurrentEditorToMain = () => {
    setIsSyncingMain(true);
    let cleanTitle = currentEditorArticle.title || '';
    let cleanAuthor = currentEditorArticle.author || '';
    let cleanDigest = currentEditorArticle.digest || '';
    let cleanCover = currentEditorArticle.cover || '';
    let cleanMd = currentEditorArticle.markdown || '';

    // If markdown has front matter, parse it
    const fmMatch = cleanMd.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (fmMatch) {
      const yamlStr = fmMatch[1];
      cleanMd = fmMatch[2].trim();
      const tMatch = yamlStr.match(/^title:\s*["']?(.*?)["']?$/m);
      if (tMatch) cleanTitle = tMatch[1].trim();
      const aMatch = yamlStr.match(/^author:\s*["']?(.*?)["']?$/m);
      if (aMatch) cleanAuthor = aMatch[1].trim();
      const dMatch = yamlStr.match(/^digest:\s*["']?(.*?)["']?$/m);
      if (dMatch) cleanDigest = dMatch[1].trim();
      const cMatch = yamlStr.match(/^cover:\s*["']?(.*?)["']?$/m);
      if (cMatch) cleanCover = cMatch[1].trim();
    }

    if (/<section\b|<p\b|<span\b/i.test(cleanMd)) {
      cleanMd = wechatHtmlToMarkdown(cleanMd);
    }

    setMultiArticles((prev) => {
      const first = {
        id: prev[0]?.id || 'item_1',
        title: cleanTitle || '头条文章',
        author: cleanAuthor || '作者',
        digest: cleanDigest || '',
        markdownContent: cleanMd || '# 正文标题\n\n正文内容...',
        cover: cleanCover,
      };

      if (prev.length === 0) {
        return [
          first,
          {
            id: 'item_2',
            title: '次条图文资讯推荐',
            author: cleanAuthor || '作者',
            digest: '精选实用工具与深度洞察分享',
            markdownContent: '## 今日精选\n\n- 实用工具分享\n- 高效排版实践',
            cover: '',
          },
        ];
      }

      // Preserve all subsequent sub-articles!
      return [first, ...prev.slice(1)];
    });

    setIsUserModifiedMulti(true);
    setSyncFeedback(`已成功将当前主编辑器文章《${cleanTitle || '头条文章'}》同步为主图文！`);
    setTimeout(() => {
      setIsSyncingMain(false);
      setSyncFeedback(null);
    }, 3500);
  };

  // Pick draft from existing drafts and bind to a specific article slot
  const handlePickDraftForArticle = async (mediaId: string, targetIdx: number) => {
    try {
      const resp = await safeFetchJson(`/api/wechat/draft/${mediaId}`);
      if (resp.ok && resp.data?.news_item && resp.data.news_item.length > 0) {
        const first = resp.data.news_item[0];
        const pureMarkdown = wechatHtmlToMarkdown(first.content || '');
        setMultiArticles((prev) =>
          prev.map((item, i) =>
            i === targetIdx
              ? {
                  ...item,
                  title: first.title || item.title,
                  author: first.author || item.author,
                  digest: first.digest || item.digest,
                  markdownContent: pureMarkdown || item.markdownContent,
                  cover: first.thumb_url || item.cover,
                }
              : item
          )
        );
        setIsUserModifiedMulti(true);
        setDraftPickerTargetIdx(null);
        setSyncFeedback(`已成功将微信草稿《${first.title}》关联并填充至第 ${targetIdx + 1} 篇！`);
        setTimeout(() => setSyncFeedback(null), 3500);
      } else {
        alert(resp.data?.error || resp.error || '未获取到草稿内容');
      }
    } catch (err: any) {
      alert(`读取草稿失败: ${err.message}`);
    }
  };

  // Import local .md file for a specific article slot
  const handleImportMarkdownFileForArticle = (file: File, targetIdx: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = String(e.target?.result || '');
      let title = '';
      let author = '';
      let digest = '';
      let cover = '';
      let body = rawText;

      const fmMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (fmMatch) {
        const yamlStr = fmMatch[1];
        body = fmMatch[2].trim();
        const tMatch = yamlStr.match(/^title:\s*["']?(.*?)["']?$/m);
        if (tMatch) title = tMatch[1].trim();
        const aMatch = yamlStr.match(/^author:\s*["']?(.*?)["']?$/m);
        if (aMatch) author = aMatch[1].trim();
        const dMatch = yamlStr.match(/^digest:\s*["']?(.*?)["']?$/m);
        if (dMatch) digest = dMatch[1].trim();
        const cMatch = yamlStr.match(/^cover:\s*["']?(.*?)["']?$/m);
        if (cMatch) cover = cMatch[1].trim();
      } else {
        const h1Match = body.match(/^#\s+(.+)$/m);
        if (h1Match) {
          title = h1Match[1].trim();
        } else {
          title = file.name.replace(/\.[^/.]+$/, '');
        }
      }

      setMultiArticles((prev) =>
        prev.map((item, i) =>
          i === targetIdx
            ? {
                ...item,
                title: title || item.title,
                author: author || item.author,
                digest: digest || item.digest,
                cover: cover || item.cover,
                markdownContent: body || item.markdownContent,
              }
            : item
        )
      );

      setIsUserModifiedMulti(true);
      setSyncFeedback(`已从本地文件「${file.name}」导入并填充至第 ${targetIdx + 1} 篇！`);
      setTimeout(() => setSyncFeedback(null), 3500);
    };
    reader.readAsText(file);
  };

  const handleTriggerImport = async (targetIdx: number) => {
    if (isWails()) {
      const nativeFile = await pickNativeMarkdown();
      if (nativeFile) {
        let body = nativeFile.content;
        let title = '';
        let author = '';
        let digest = '';
        let cover = '';

        const fmMatch = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
        if (fmMatch) {
          const yamlStr = fmMatch[1];
          body = fmMatch[2].trim();
          const tMatch = yamlStr.match(/^title:\s*["']?(.*?)["']?$/m);
          if (tMatch) title = tMatch[1].trim();
          const aMatch = yamlStr.match(/^author:\s*["']?(.*?)["']?$/m);
          if (aMatch) author = aMatch[1].trim();
          const dMatch = yamlStr.match(/^digest:\s*["']?(.*?)["']?$/m);
          if (dMatch) digest = dMatch[1].trim();
          const cMatch = yamlStr.match(/^cover:\s*["']?(.*?)["']?$/m);
          if (cMatch) cover = cMatch[1].trim();
        } else {
          const h1Match = body.match(/^#\s+(.+)$/m);
          if (h1Match) {
            title = h1Match[1].trim();
          } else {
            title = nativeFile.name.replace(/\.[^/.]+$/, '');
          }
        }

        setMultiArticles((prev) =>
          prev.map((item, i) =>
            i === targetIdx
              ? {
                  ...item,
                  title: title || item.title,
                  author: author || item.author,
                  digest: digest || item.digest,
                  cover: cover || item.cover,
                  markdownContent: body || item.markdownContent,
                }
              : item
          )
        );

        setIsUserModifiedMulti(true);
        setSyncFeedback(`已从本地文件「${nativeFile.name}」导入并填充至第 ${targetIdx + 1} 篇！`);
        setTimeout(() => setSyncFeedback(null), 3500);
        return;
      }
    }
    document.getElementById(`md-file-input-${targetIdx}`)?.click();
  };

  // Upload or set cover image for a specific article slot
  const handleCoverUploadForArticle = (file: File, targetIdx: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || '');
      setMultiArticles((prev) =>
        prev.map((item, i) => (i === targetIdx ? { ...item, cover: dataUrl } : item))
      );
      setIsUserModifiedMulti(true);
    };
    reader.readAsDataURL(file);
  };

  // Parse Front Matter manually for a card
  const handleParseFrontMatterForArticle = (targetIdx: number) => {
    const current = multiArticles[targetIdx];
    if (!current) return;
    const fmMatch = current.markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) {
      alert('未检测到头部 Front Matter (--- ... ---)。');
      return;
    }
    const yamlStr = fmMatch[1];
    const body = fmMatch[2].trim();
    let title = current.title;
    let author = current.author;
    let digest = current.digest;
    let cover = current.cover;

    const tMatch = yamlStr.match(/^title:\s*["']?(.*?)["']?$/m);
    if (tMatch) title = tMatch[1].trim();
    const aMatch = yamlStr.match(/^author:\s*["']?(.*?)["']?$/m);
    if (aMatch) author = aMatch[1].trim();
    const dMatch = yamlStr.match(/^digest:\s*["']?(.*?)["']?$/m);
    if (dMatch) digest = dMatch[1].trim();
    const cMatch = yamlStr.match(/^cover:\s*["']?(.*?)["']?$/m);
    if (cMatch) cover = cMatch[1].trim();

    setMultiArticles((prev) =>
      prev.map((item, i) =>
        i === targetIdx
          ? {
              ...item,
              title,
              author,
              digest,
              cover,
              markdownContent: body,
            }
          : item
      )
    );
    alert('已成功解析 Front Matter 并自动填充各字段！');
  };

  // Purify HTML in a card's markdownContent
  const handlePurifyArticleMarkdown = (targetIdx: number) => {
    const current = multiArticles[targetIdx];
    if (!current) return;
    const cleaned = wechatHtmlToMarkdown(current.markdownContent);
    setMultiArticles((prev) =>
      prev.map((item, i) => (i === targetIdx ? { ...item, markdownContent: cleaned } : item))
    );
  };

  // Submit Free Publish
  const handleFreePublish = async (mediaId: string) => {
    if (
      !window.confirm(
        `【重要提示】您将调用微信官方 FreePublish 群发接口，将此草稿正式公开发布至公众号关注者！\n是否确认正式群发？`
      )
    ) {
      return;
    }

    setPublishingMediaId(mediaId);
    setPublishStatus({ state: 'submitting', text: '正在向微信提交正式群发任务...' });
    try {
      const resp = await safeFetchJson(`/api/wechat/draft/${mediaId}/publish`, { method: 'POST' });
      if (resp.ok && resp.data?.publish_id) {
        const publishId = resp.data.publish_id;
        setPublishingTaskId(publishId);
        setPublishStatus({
          state: 'polling',
          text: `正式发布任务已提交 (ID: ${publishId})，正在轮询发布状态...`,
        });

        // Poll status 3 times
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusResp = await safeFetchJson(`/api/wechat/publish/${publishId}`);
            if (statusResp.ok && statusResp.data) {
              const statusData = statusResp.data;
              if (statusData.publish_status === 0) {
                clearInterval(interval);
                setPublishStatus({
                  state: 'success',
                  text: '微信公众平台正式群发已成功完成！文章已在公众号主页公开展示。',
                  article_id: statusData.article_id,
                });
              } else if (statusData.publish_status === 1) {
                setPublishStatus({
                  state: 'polling',
                  text: `微信正在后台排队群发中 (状态 1)，请稍候... (已检查 ${attempts} 次)`,
                });
              } else if (statusData.publish_status === 2) {
                setPublishStatus({
                  state: 'polling',
                  text: '文章正处于微信官方原创审核中...',
                });
              } else if (statusData.publish_status === 3) {
                clearInterval(interval);
                setPublishStatus({
                  state: 'failed',
                  text: `发布失败: 未通过微信风控或素材已失效。`,
                });
              }
            }
          } catch {
            // Ignore single poll error
          }
          if (attempts >= 10) {
            clearInterval(interval);
            setPublishStatus({
              state: 'timeout',
              text: '轮询超时：微信正在后台持续处理群发任务，请稍后在微信公众平台后台查看发布结果。',
            });
          }
        }, 3000);
      } else {
        setPublishStatus({
          state: 'error',
          text: resp.data?.error || resp.error || '群发请求失败',
        });
      }
    } catch (err: any) {
      setPublishStatus({
        state: 'error',
        text: `群发接口报错: ${err.message}`,
      });
    }
  };

  // Submit Multi-article Draft
  const handlePublishMultiDraft = async () => {
    setMultiPublishing(true);
    setMultiError(null);
    setMultiPublishResult(null);

    try {
      const items = multiArticles.map((art) => ({
        titleOverride: art.title,
        authorOverride: art.author,
        digestOverride: art.digest,
        coverOverride: art.cover,
        markdownContent: art.markdownContent,
      }));

      const resp = await safeFetchJson('/api/wechat/draft/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, dryRun: multiDryRun }),
      });
      if (resp.ok && resp.data?.success) {
        setMultiPublishResult(resp.data.result);
      } else {
        setMultiError(resp.data?.error || resp.error || '多图文发布失败');
      }
    } catch (err: any) {
      setMultiError(err.message || '网络连接异常');
    } finally {
      setMultiPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <span>微信草稿箱全功能管理</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                  草稿与群发
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                草稿查询、一键正式群发 (FreePublish)、多图文合集推送与素材去重缓存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-800 bg-neutral-900/60 flex items-center space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('drafts')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'drafts'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>公众号已存草稿 ({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('multi')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'multi'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>多图文合集创建 (上限8篇)</span>
          </button>

          <button
            onClick={() => setActiveTab('cache')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition ${
              activeTab === 'cache'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>永久素材缓存与优化 ({cacheStats.total_items})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* ==================================================== */}
          {/* TAB 1: DRAFTS LIST */}
          {/* ==================================================== */}
          {activeTab === 'drafts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-neutral-400 text-xs">
                  共查询到微信公众平台草稿箱中的 <span className="text-neutral-200 font-semibold">{totalCount}</span> 条草稿记录：
                </div>
                <button
                  onClick={fetchDrafts}
                  disabled={loadingDrafts}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDrafts ? 'animate-spin' : ''}`} />
                  <span>刷新草稿</span>
                </button>
              </div>

              {/* FreePublish Status Card if active */}
              {publishStatus && (
                <div className="p-4 rounded-xl border border-blue-800/60 bg-blue-950/40 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-blue-300">
                    {publishStatus.state === 'polling' || publishStatus.state === 'submitting' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    ) : publishStatus.state === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>群发发布进度监控</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">{publishStatus.text}</p>
                </div>
              )}

              {draftError && (
                <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{draftError}</span>
                </div>
              )}

              {loadingDrafts ? (
                <div className="py-16 text-center text-neutral-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p>正在同步微信公众平台草稿箱数据...</p>
                </div>
              ) : drafts.length === 0 ? (
                <div className="py-16 text-center text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-xl">
                  <Inbox className="w-10 h-10 mx-auto text-neutral-600" />
                  <p>草稿箱暂无草稿，您可以在编辑器完成创作后点击「推送至草稿箱」</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => {
                    const news = draft.content?.news_item || [];
                    const first = news[0] || {};
                    const updateTime = draft.update_time
                      ? new Date(draft.update_time * 1000).toLocaleString()
                      : '未知时间';

                    return (
                      <div
                        key={draft.media_id}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-850 hover:border-neutral-700 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-neutral-100">
                                {first.title || '无标题图文'}
                              </h4>
                              {news.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-medium">
                                  多图文 ({news.length} 篇)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-neutral-400 text-[11px]">
                              <span>作者: {first.author || '未填写'}</span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{updateTime}</span>
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleLoadDraft(draft.media_id)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                              title="将此草稿加载到当前编辑器中继续修改"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                              <span>回填到编辑器</span>
                            </button>

                            <button
                              onClick={() => handleFreePublish(draft.media_id)}
                              disabled={publishingMediaId === draft.media_id}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition"
                              title="调用 FreePublish 接口正式公开发布至公众号关注者"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-400" />
                              <span>一键群发</span>
                            </button>

                            <button
                              onClick={() => handleDeleteDraft(draft.media_id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                              title="从微信草稿箱彻底删除此草稿"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Digest preview */}
                        {first.digest && (
                          <p className="text-neutral-400 text-xs line-clamp-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                            {first.digest}
                          </p>
                        )}

                        {/* Sub-articles if multi-article */}
                        {news.length > 1 && (
                          <div className="pt-2 border-t border-neutral-800/60 space-y-1.5">
                            <span className="text-[11px] text-neutral-500 font-medium">包含子图文：</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {news.slice(1).map((sub: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="px-2.5 py-1.5 rounded bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 truncate"
                                >
                                  {idx + 2}. {sub.title || '无标题'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-neutral-500 font-mono">
                          media_id: {draft.media_id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: MULTI-ARTICLE COMPOSER (合集发布) */}
          {/* ==================================================== */}
          {activeTab === 'multi' && (
            <div className="space-y-4">
              {/* Sync Feedback Toast */}
              {syncFeedback && (
                <div className="p-3 rounded-xl border border-emerald-700/60 bg-emerald-950/70 text-emerald-200 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{syncFeedback}</span>
                </div>
              )}

              {/* Guide / How-To Card */}
              <div className="rounded-xl border border-blue-900/50 bg-blue-950/25 text-neutral-300 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-blue-900/20 transition"
                >
                  <div className="flex items-center space-x-2 font-semibold text-blue-300">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>多图文草稿合集使用指南 (如何关联或增加写好的文章？)</span>
                  </div>
                  {showGuide ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {showGuide && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-blue-900/30 text-neutral-300 leading-relaxed">
                    <p className="text-neutral-400 text-[11px]">
                      微信单次群发支持打包 2~8 篇文章。读者在微信聊天列表打开时，头条为大图封面，次条及以下为精美右侧缩略图列表。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
                        <div className="font-medium text-emerald-400 flex items-center space-x-1.5">
                          <FolderUp className="w-3.5 h-3.5" />
                          <span>方式 1：导入本地 .md 文件</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          点击任意卡片右上角的「<span className="text-neutral-200">📂 导入 .md</span>」，直接选取您在本地写好的 Markdown 文件。系统会自动读取 YAML 头部，填充标题、作者、摘要、封面及正文！
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
                        <div className="font-medium text-blue-400 flex items-center space-x-1.5">
                          <Inbox className="w-3.5 h-3.5" />
                          <span>方式 2：从草稿箱关联已有草稿</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          点击卡片右上角的「<span className="text-neutral-200">📥 从草稿箱选择</span>」，直接调取您公众号草稿箱的已有文章，自动纯化为 Markdown 并填入该卡片！
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
                        <div className="font-medium text-purple-400 flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>方式 3：直接粘贴 Front Matter 正文</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          在卡片正文框直接粘贴带 <code>---</code> 头部的完整 Markdown，点击「<span className="text-neutral-200">解析 Front Matter</span>」即可自动填充标题等输入框。
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
                        <div className="font-medium text-amber-400 flex items-center space-x-1.5">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>方式 4：同步当前主编辑文章</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          点击右上角的「<span className="text-neutral-200">同步当前编辑文章为主图文</span>」，将当前主编辑区的最新正文与元数据更新为第 1 篇头条，次条内容完好保留！
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action bar for multi-articles */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-300 font-medium">
                    当前编排 <span className="text-blue-400 font-bold">{multiArticles.length}</span> 篇图文
                  </span>
                  <span className="text-neutral-500 text-[11px]">(支持 2~8 篇打包推送)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncCurrentEditorToMain}
                  disabled={isSyncingMain}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition shadow-xs ${
                    isSyncingMain || syncFeedback
                      ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                      : 'border-blue-700/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/40 hover:text-blue-200'
                  }`}
                  title="将主编辑区当前的标题、摘要、作者及正文同步为多图文头条，同时保留已有次条"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMain ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncingMain ? '正在同步主图文...' : '同步当前编辑文章为主图文'}</span>
                </button>
              </div>

              {/* Multi-article cards */}
              <div className="space-y-4">
                {multiArticles.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition space-y-3.5 ${
                      idx === 0
                        ? 'border-blue-600/70 bg-blue-950/20 shadow-sm'
                        : 'border-neutral-800 bg-neutral-850'
                    }`}
                  >
                    {/* Hidden file inputs for this card */}
                    <input
                      type="file"
                      id={`md-file-input-${idx}`}
                      accept=".md,.markdown,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportMarkdownFileForArticle(file, idx);
                          e.target.value = '';
                        }
                      }}
                    />
                    <input
                      type="file"
                      id={`cover-file-input-${idx}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCoverUploadForArticle(file, idx);
                          e.target.value = '';
                        }
                      }}
                    />

                    {/* Card Header & Tool Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-neutral-200 text-xs sm:text-sm">
                          {idx === 0 ? '头条主图文 (微信大卡片封面)' : `第 ${idx + 1} 条图文 (缩略列表)`}
                        </span>
                        {item.cover && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            已配封面
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {item.markdownContent?.length || 0} 字
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 text-xs">
                        {/* Import local .md */}
                        <button
                          type="button"
                          onClick={() => handleTriggerImport(idx)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
                          title="从本地选择写好的 .md 文件，自动解析 Front Matter 与正文"
                        >
                          <FolderUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>导入 .md</span>
                        </button>

                        {/* Pick from WeChat drafts */}
                        <button
                          type="button"
                          onClick={() => {
                            if (drafts.length === 0) fetchDrafts();
                            setDraftPickerTargetIdx(idx);
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
                          title="从微信公众号草稿箱调取已有草稿，自动填充此篇"
                        >
                          <Inbox className="w-3.5 h-3.5 text-blue-400" />
                          <span>从草稿箱选择</span>
                        </button>

                        <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...multiArticles];
                              const temp = copy[idx];
                              copy[idx] = copy[idx - 1];
                              copy[idx - 1] = temp;
                              setMultiArticles(copy);
                              setIsUserModifiedMulti(true);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                            title="上移"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < multiArticles.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...multiArticles];
                              const temp = copy[idx];
                              copy[idx] = copy[idx + 1];
                              copy[idx + 1] = temp;
                              setMultiArticles(copy);
                              setIsUserModifiedMulti(true);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                            title="下移"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {multiArticles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setMultiArticles(multiArticles.filter((_, i) => i !== idx));
                              setIsUserModifiedMulti(true);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                            title="移除此篇"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">文章标题 (≤64字)</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMultiArticles((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, title: val } : a))
                            );
                            setIsUserModifiedMulti(true);
                          }}
                          placeholder="例如: 探索深度思考的新维度"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">作者署名</label>
                        <input
                          type="text"
                          value={item.author}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMultiArticles((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, author: val } : a))
                            );
                            setIsUserModifiedMulti(true);
                          }}
                          placeholder="例如: 排版工坊"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">摘要 (≤120字)</label>
                        <input
                          type="text"
                          value={item.digest}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMultiArticles((prev) =>
                              prev.map((a, i) => (i === idx ? { ...a, digest: val } : a))
                            );
                            setIsUserModifiedMulti(true);
                          }}
                          placeholder="文章简要导读与核心亮点..."
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] text-neutral-400">
                            {idx === 0 ? '头条大图封面 (URL或本地上传)' : '缩略小图封面 (URL或本地上传)'}
                          </label>
                          <button
                            type="button"
                            onClick={() => document.getElementById(`cover-file-input-${idx}`)?.click()}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>上传图片</span>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item.cover || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMultiArticles((prev) =>
                                prev.map((a, i) => (i === idx ? { ...a, cover: val } : a))
                              );
                              setIsUserModifiedMulti(true);
                            }}
                            placeholder="./cover.png 或 https://..."
                            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-blue-500"
                          />
                          {item.cover && (
                            <img
                              src={item.cover}
                              alt="thumb"
                              className="w-9 h-7 object-cover rounded border border-neutral-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Markdown Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] text-neutral-400">Markdown 正文内容</label>
                        <div className="flex items-center space-x-2">
                          {item.markdownContent && /^---\r?\n[\s\S]*?\r?\n---/m.test(item.markdownContent) && (
                            <button
                              type="button"
                              onClick={() => handleParseFrontMatterForArticle(idx)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                              title="检测到头部 Front Matter，点击自动填充标题与摘要"
                            >
                              <FileText className="w-3 h-3" />
                              <span>解析 Front Matter</span>
                            </button>
                          )}
                          {item.markdownContent && /<section\b|<p\b|<span\b/i.test(item.markdownContent) && (
                            <button
                              type="button"
                              onClick={() => handlePurifyArticleMarkdown(idx)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                              title="检测到 HTML 标签，点击纯化为 Markdown"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>纯化 HTML</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        rows={4}
                        value={item.markdownContent}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMultiArticles((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, markdownContent: val } : a))
                          );
                          setIsUserModifiedMulti(true);
                        }}
                        placeholder="支持完整 Markdown 语法及 Front Matter YAML 头部..."
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-hidden focus:border-blue-500 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add article button */}
              {multiArticles.length < 8 && (
                <button
                  type="button"
                  onClick={() => {
                    setMultiArticles([
                      ...multiArticles,
                      {
                        id: `item_${Date.now()}`,
                        title: `第 ${multiArticles.length + 1} 篇推荐`,
                        author: currentEditorArticle.author || '作者',
                        digest: '点击展开查看详情',
                        markdownContent: '## 推荐内容\n\n正文描述...',
                        cover: '',
                      },
                    ]);
                    setIsUserModifiedMulti(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-850/50 hover:bg-neutral-800 text-neutral-300 flex items-center justify-center space-x-2 transition text-xs font-medium"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>添加子图文 (还可添加 {8 - multiArticles.length} 篇)</span>
                </button>
              )}

              {/* Submit result */}
              {multiPublishResult && (
                <div className="p-4 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>多图文草稿合集推送成功！</span>
                    {multiPublishResult.dry_run && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                        Dry-Run 仿真测试
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-300 text-xs">
                    微信草稿箱 media_id: <span className="font-mono text-emerald-300">{multiPublishResult.media_id}</span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    共包含 {multiPublishResult.total_articles} 篇图文，已自动应用独立排版、内联 CSS 及批量素材上传。
                  </p>
                </div>
              )}

              {multiError && (
                <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-300 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{multiError}</span>
                </div>
              )}

              {/* Bottom Submit Toolbar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80">
                <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={multiDryRun}
                    onChange={(e) => setMultiDryRun(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>仿真模式 (Dry-Run，仅本地排版合成不上传微信)</span>
                </label>

                <button
                  type="button"
                  onClick={handlePublishMultiDraft}
                  disabled={multiPublishing}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
                >
                  {multiPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在处理并合并推送多图文...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {multiDryRun
                          ? `仿真测试推送多图文 (${multiArticles.length} 篇)`
                          : `一键合并推送多图文草稿 (${multiArticles.length} 篇)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: MEDIA CACHE & OPTIMIZATION */}
          {/* ==================================================== */}
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-850 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-neutral-200 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>微信永久素材缓存与智能去重状态</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm('确定要清空本地素材缓存吗？清空后下次发文将重新向微信素材库上传图片。')) {
                        await safeFetchJson('/api/media/cache/clear', { method: 'POST' });
                        fetchCache();
                      }
                    }}
                    className="px-3 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded border border-rose-900/50 transition"
                  >
                    清空素材缓存
                  </button>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  系统采用 SHA-256 图像指纹比对机制。任何超过 2MB 的本地或网络图片将通过 Sharp 自动等比缩放并无损压缩；同时相同指纹的配图不会重复消耗微信每日素材库上传配额（上限 5000 张）。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">已去重缓存图片</div>
                    <div className="text-lg font-bold text-neutral-100">{cacheStats.total_items} 张</div>
                  </div>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">自动压缩格式</div>
                    <div className="text-lg font-bold text-emerald-400">WebP → PNG / JPEG</div>
                  </div>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">微信素材配额保护</div>
                    <div className="text-lg font-bold text-blue-400">已激活</div>
                  </div>
                </div>
              </div>

              {/* Cache items list */}
              {cacheStats.items.length > 0 && (
                <div className="space-y-2">
                  <div className="text-neutral-400 text-xs font-medium">已缓存微信 CDN 素材列表：</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cacheStats.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 truncate pr-4">
                          <div className="font-semibold text-neutral-200 truncate">{item.filename}</div>
                          <div className="text-[10px] text-neutral-500 font-mono truncate">
                            SHA-256: {item.hash.slice(0, 16)}... | 大小: {(item.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                          已缓存免上传
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DRAFT PICKER MODAL (when choosing an existing draft for multi-article) */}
      {draftPickerTargetIdx !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
              <div className="flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-neutral-100 text-sm">
                  从草稿箱选取文章关联至「第 {draftPickerTargetIdx + 1} 篇
                  {draftPickerTargetIdx === 0 ? ' (头条)' : ' (次条)'}」
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDraftPickerTargetIdx(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="text-xs text-neutral-400 mb-2">
                点击下方草稿卡片即可直接载入其标题、封面及正文，并自动纯化为 Markdown 填充至对应位置：
              </div>

              {loadingDrafts ? (
                <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-xs">正在调取微信官方草稿箱列表...</span>
                </div>
              ) : drafts.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 space-y-3">
                  <p className="text-xs">暂未获取到草稿列表，或者微信公众号草稿箱为空。</p>
                  <button
                    type="button"
                    onClick={fetchDrafts}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>刷新草稿箱列表</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {drafts.map((draft) => {
                    const first = draft.content?.news_item?.[0] || {};
                    const hasCover = Boolean(first.thumb_url);

                    return (
                      <div
                        key={draft.media_id}
                        className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-850 hover:border-blue-700/60 hover:bg-blue-950/20 transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {hasCover ? (
                            <img
                              src={first.thumb_url}
                              alt="thumb"
                              className="w-14 h-11 object-cover rounded-lg border border-neutral-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-11 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-neutral-500" />
                            </div>
                          )}

                          <div className="min-w-0 space-y-0.5">
                            <div className="font-semibold text-neutral-100 text-xs sm:text-sm truncate">
                              {first.title || '无标题草稿'}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate max-w-md">
                              {first.digest || '暂无摘要'}
                            </div>
                            <div className="text-[10px] text-neutral-500 flex items-center space-x-2">
                              <span>作者: {first.author || '默认作者'}</span>
                              <span>•</span>
                              <span>
                                {draft.update_time
                                  ? new Date(draft.update_time * 1000).toLocaleDateString()
                                  : '微信草稿'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePickDraftForArticle(draft.media_id, draftPickerTargetIdx)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shrink-0 transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>选择并关联</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-neutral-800 flex justify-end bg-neutral-850">
              <button
                type="button"
                onClick={() => setDraftPickerTargetIdx(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
