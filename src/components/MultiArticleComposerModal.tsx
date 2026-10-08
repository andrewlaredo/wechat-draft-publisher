import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Copy,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { safeFetchJson } from '../utils/safeFetch.ts';

export interface MultiArticleDraftItem {
  id: string;
  title: string;
  author: string;
  digest: string;
  markdown: string;
  cover: string;
  thumb_media_id?: string;
  theme?: string;
}

interface MultiArticleComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: MultiArticleDraftItem[];
  currentArticleId: string;
  onSelectArticle: (articleId: string) => void;
  onUpdateArticles: (articles: MultiArticleDraftItem[]) => void;
  defaultAuthor?: string;
  defaultTheme?: string;
}

export const MultiArticleComposerModal: React.FC<MultiArticleComposerModalProps> = ({
  isOpen,
  onClose,
  articles,
  currentArticleId,
  onSelectArticle,
  onUpdateArticles,
  defaultAuthor = '公众号作者',
  defaultTheme = 'pie',
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'feed' | 'editor'>('feed');

  if (!isOpen) return null;

  // Add a new article to the series
  const handleAddArticle = () => {
    if (articles.length >= 8) {
      alert('微信公众平台单条草稿最多支持 8 篇多图文');
      return;
    }
    const newIdx = articles.length + 1;
    const newItem: MultiArticleDraftItem = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `多图文次条 · 篇目 ${newIdx}`,
      author: defaultAuthor,
      digest: `这是第 ${newIdx} 篇图文的精选摘要概括...`,
      markdown: `---\ntitle: "多图文次条 · 篇目 ${newIdx}"\nauthor: "${defaultAuthor}"\ndigest: "这是第 ${newIdx} 篇图文的精选摘要概括..."\ntheme: "${defaultTheme}"\n---\n\n## 篇目 ${newIdx} 正文\n\n欢迎阅读多图文连载第 ${newIdx} 期内容。您可以在主编辑器中对其进行无死角 Markdown 排版与细节修饰。`,
      cover: './images/01-mars-default.png',
      theme: defaultTheme,
    };

    const next = [...articles, newItem];
    onUpdateArticles(next);
    onSelectArticle(newItem.id);
  };

  // Move article up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...articles];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onUpdateArticles(next);
  };

  // Move article down
  const handleMoveDown = (index: number) => {
    if (index === articles.length - 1) return;
    const next = [...articles];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onUpdateArticles(next);
  };

  // Set directly as headline (Article 1)
  const handleSetAsHeadline = (index: number) => {
    if (index === 0) return;
    const next = [...articles];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);
    onUpdateArticles(next);
  };

  // Delete article
  const handleDeleteArticle = (index: number) => {
    if (articles.length <= 1) {
      alert('草稿至少保留 1 篇文章');
      return;
    }
    const itemToDelete = articles[index];
    if (confirm(`确定删除「${itemToDelete.title || `篇目 ${index + 1}`}」吗？`)) {
      const next = articles.filter((_, i) => i !== index);
      onUpdateArticles(next);
      if (currentArticleId === itemToDelete.id) {
        onSelectArticle(next[0].id);
      }
    }
  };

  // Duplicate article
  const handleDuplicate = (index: number) => {
    if (articles.length >= 8) {
      alert('最多支持 8 篇多图文');
      return;
    }
    const source = articles[index];
    const copy: MultiArticleDraftItem = {
      ...source,
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${source.title} (副本)`,
    };
    const next = [...articles.slice(0, index + 1), copy, ...articles.slice(index + 1)];
    onUpdateArticles(next);
    onSelectArticle(copy.id);
  };

  // Update specific article metadata
  const handleItemFieldChange = (id: string, field: keyof MultiArticleDraftItem, value: any) => {
    const next = articles.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onUpdateArticles(next);
  };

  // Publish multi-article draft via API
  const handlePublishMultiDraft = async (dryRun = false) => {
    setIsPublishing(true);
    setPublishResult(null);
    setPublishError(null);

    try {
      const itemsPayload = articles.map((art) => ({
        markdownContent: art.markdown,
        titleOverride: art.title,
        authorOverride: art.author,
        digestOverride: art.digest,
        coverOverride: art.cover,
        thumbMediaIdOverride: art.thumb_media_id,
        themeOverride: art.theme || defaultTheme,
      }));

      const res = await safeFetchJson('/api/wechat/draft/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          dryRun,
        }),
      });

      if (res.ok && res.data?.success) {
        setPublishResult(res.data.result);
      } else {
        setPublishError(res.data?.error || res.error || '多图文推送失败');
      }
    } catch (err: any) {
      setPublishError(err.message || '网络连接故障');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">多图文可视化拖拽编排器</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 font-mono">
                  {articles.length} / 8 篇
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                支持单条微信公众号草稿编排 1~8 篇图文，自由调整头条大图与次条小方图顺序
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Column Articles List, Right Column Feed Timeline Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {/* Left Column: Manage & Sort Articles (7 cols) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                篇目列表与排版排序
              </div>
              <button
                onClick={handleAddArticle}
                disabled={articles.length >= 8}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                添加次条篇目 ({articles.length}/8)
              </button>
            </div>

            {/* Articles draggable/sortable card list */}
            <div className="space-y-3">
              {articles.map((item, index) => {
                const isHeadline = index === 0;
                const isActive = item.id === currentArticleId;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition relative ${
                      isActive
                        ? 'bg-neutral-850 border-blue-500/80 ring-1 ring-blue-500/30'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Top Row: Badge, Title & Ordering Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isHeadline
                              ? 'bg-amber-950/80 border border-amber-700/80 text-amber-300'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {isHeadline ? '👑 [头条 · 大封面]' : `[次条 · 第 ${index + 1} 篇]`}
                        </span>

                        {isActive && (
                          <span className="text-[10px] text-blue-400 font-medium bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                            正在编辑
                          </span>
                        )}
                      </div>

                      {/* Controls: Up, Down, Set Headline, Duplicate, Delete */}
                      <div className="flex items-center space-x-1">
                        {!isHeadline && (
                          <button
                            onClick={() => handleSetAsHeadline(index)}
                            className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 text-[11px] transition flex items-center"
                            title="设为头条"
                          >
                            设为头条
                          </button>
                        )}
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 transition"
                          title="上移"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === articles.length - 1}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 transition"
                          title="下移"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(index)}
                          disabled={articles.length >= 8}
                          className="p-1 rounded text-neutral-400 hover:text-blue-300 hover:bg-neutral-800 disabled:opacity-30 transition"
                          title="复制此篇"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(index)}
                          disabled={articles.length <= 1}
                          className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 disabled:opacity-30 transition"
                          title="删除此篇"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Form Fields for this article */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                      {/* Title input */}
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemFieldChange(item.id, 'title', e.target.value)}
                          placeholder="请输入该篇标题 (必填，最多64字)..."
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100 font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Author */}
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.author}
                          onChange={(e) => handleItemFieldChange(item.id, 'author', e.target.value)}
                          placeholder="作者署名..."
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Cover path & digest */}
                      <div className="sm:col-span-8">
                        <input
                          type="text"
                          value={item.cover}
                          onChange={(e) => handleItemFieldChange(item.id, 'cover', e.target.value)}
                          placeholder="封面图路径：./images/01-mars-default.png 或 https://..."
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Switch to this article in main editor */}
                      <div className="sm:col-span-4 flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectArticle(item.id);
                          }}
                          className={`w-full py-1.5 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isActive ? '正在主窗口排版' : '载入主编辑器编辑'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: WeChat Timeline Mobile Feed Simulator (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-neutral-950 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                微信公众号订阅列表仿真预览
              </div>
              <span className="text-[10px] text-neutral-500">微信真实信息流排版</span>
            </div>

            {/* Mobile WeChat Subscription Account Feed Card Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800 flex justify-center">
              <div className="w-full max-w-[340px] my-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-200 text-neutral-900 select-none">
                {/* Account Header */}
                <div className="p-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      微
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 truncate max-w-[160px]">
                      {articles[0]?.author || defaultAuthor}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">刚刚</span>
                </div>

                {/* Article 1: Headline Hero (头条大图 2.35:1) */}
                {articles[0] && (
                  <div
                    onClick={() => onSelectArticle(articles[0].id)}
                    className="cursor-pointer group relative overflow-hidden bg-neutral-100 border-b border-neutral-200"
                  >
                    <div className="aspect-16/9 w-full bg-neutral-800 relative overflow-hidden flex items-center justify-center">
                      {articles[0].cover ? (
                        <img
                          src={articles[0].cover}
                          alt="Headline Cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-neutral-400 flex flex-col items-center">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] mt-1">头条大封面</span>
                        </div>
                      )}

                      {/* Title Overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6">
                        <div className="text-sm font-bold text-white leading-snug drop-shadow line-clamp-2">
                          {articles[0].title || '请为头条图文输入吸引读者的标题'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Articles 2..8: Secondary Cards (次条小方图 1:1) */}
                <div className="divide-y divide-neutral-100">
                  {articles.slice(1).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectArticle(item.id)}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 cursor-pointer transition"
                    >
                      <div className="text-xs font-medium text-neutral-800 line-clamp-2 leading-relaxed flex-1">
                        {item.title || `次条图文标题 ${idx + 2}`}
                      </div>

                      {/* 1:1 Square Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.cover ? (
                          <img
                            src={item.cover}
                            alt={`Thumbnail ${idx + 2}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-neutral-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success or Error Alert */}
        {(publishResult || publishError) && (
          <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex-shrink-0">
            {publishResult && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    🎉 多图文草稿发布成功！media_id: <strong>{publishResult.media_id}</strong> (共 {publishResult.total_articles} 篇多图文)
                  </span>
                </div>
                <a
                  href="https://mp.weixin.qq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline flex items-center gap-1"
                >
                  前往微信后台查看 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {publishError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{publishError}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-400">
            当前合集共包含 <strong className="text-neutral-200">{articles.length}</strong> 篇图文，头条为 16:9 大图，次条为 1:1 方形列表图。
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
            >
              完成并返回
            </button>
            <button
              onClick={() => handlePublishMultiDraft(true)}
              disabled={isPublishing}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium transition flex items-center gap-1.5 border border-neutral-700"
            >
              {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              模拟试运行 (Dry-Run)
            </button>
            <button
              onClick={() => handlePublishMultiDraft(false)}
              disabled={isPublishing}
              className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              一键推送多图文草稿 ({articles.length} 篇)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
