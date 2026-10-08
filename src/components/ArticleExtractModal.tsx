import React, { useState } from 'react';
import {
  X,
  Link,
  Globe,
  DownloadCloud,
  FileText,
  Sparkles,
  Layers,
  Copy,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Info,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface ExtractedArticleData {
  title: string;
  author: string;
  accountName: string;
  digest: string;
  cover: string;
  markdown: string;
  images: Array<{ url: string; alt: string }>;
  publishTime: string;
  sourceUrl: string;
}

interface ArticleExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMarkdown: (markdown: string, meta: { title: string; author: string; digest: string; cover?: string }) => void;
  onAddToMultiArticle?: (article: { title: string; author: string; digest: string; markdown: string; cover?: string }) => void;
}

const PRESET_SAMPLE_LINKS = [
  {
    name: '架构深度长文',
    url: 'https://mp.weixin.qq.com/s/sample_tech_architecture_2026',
    desc: '从 Markdown 到微信草稿箱：自媒体自动化流水线最佳实践',
  },
  {
    name: '视觉摄影专栏',
    url: 'https://mp.weixin.qq.com/s/sample_city_photography_gallery',
    desc: '城市光影物语：夜幕下的多图横滑图集与胶片色调剖析',
  },
  {
    name: '排版效率实战',
    url: 'https://mp.weixin.qq.com/s/sample_markdown_typesetting_tips',
    desc: '彻底告别排版焦虑！自媒体人必知的 8 个高效排版技巧',
  },
];

export const ArticleExtractModal: React.FC<ArticleExtractModalProps> = ({
  isOpen,
  onClose,
  onApplyMarkdown,
  onAddToMultiArticle,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedArticleData | null>(null);
  const [activeTab, setActiveTab] = useState<'markdown' | 'info' | 'images'>('markdown');
  const [isCopied, setIsCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async (targetUrl = url) => {
    const finalUrl = (targetUrl || '').trim();
    if (!finalUrl) {
      setError('请输入微信推文链接（例如 https://mp.weixin.qq.com/s/...）');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActionNotice(null);

    try {
      const res = await safeFetchJson('/api/wechat/extract-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      });

      if (res.ok && res.data?.article) {
        setExtractedData(res.data.article);
        setActionNotice(`🎉 成功抓取并逆向解析文章《${res.data.article.title || '未命名'}》！`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setError(res.error || '抓取文章失败，请检查链接或网络');
      }
    } catch (err: any) {
      setError(err.message || '请求抓取服务异常');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEditor = () => {
    if (!extractedData) return;
    onApplyMarkdown(extractedData.markdown, {
      title: extractedData.title,
      author: extractedData.author,
      digest: extractedData.digest,
      cover: extractedData.cover,
    });
    onClose();
  };

  const handleAddAsMulti = () => {
    if (!extractedData || !onAddToMultiArticle) return;
    onAddToMultiArticle({
      title: extractedData.title,
      author: extractedData.author,
      digest: extractedData.digest,
      cover: extractedData.cover,
      markdown: extractedData.markdown,
    });
    setActionNotice('✅ 已将逆向抓取的文章加入「多图文编排」清单！');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCopyMarkdown = async () => {
    if (!extractedData) return;
    try {
      await navigator.clipboard.writeText(extractedData.markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-850/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>微信线上文章一键逆向提取</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-medium">
                  智能提取清洗
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                输入任意微信公开推文链接，智能提取正文与素材并逆向清洗为干净排版的 Markdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 py-2 text-xs flex items-center justify-between text-emerald-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* URL Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-300">
              微信公众号推文 URL 链接
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  placeholder="https://mp.weixin.qq.com/s/..."
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={isLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-md shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在提取...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>一键逆向提取</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick preset test links */}
          <div className="bg-neutral-850/80 rounded-xl p-3 border border-neutral-800 space-y-2">
            <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>快速测试示例（点击一键载入测试）：</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_SAMPLE_LINKS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    handleExtract(sample.url);
                  }}
                  className="text-left p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700/60 hover:border-blue-500/50 transition group"
                >
                  <div className="text-xs font-semibold text-neutral-200 group-hover:text-blue-400 truncate">
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {sample.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Result Showcase */}
          {extractedData && (
            <div className="border border-neutral-750 rounded-xl bg-neutral-850 overflow-hidden space-y-3">
              {/* Meta Summary bar */}
              <div className="p-4 bg-neutral-800/90 border-b border-neutral-750 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-neutral-100 truncate">
                    {extractedData.title || '提取的文章'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <User className="w-3 h-3" />
                      {extractedData.author || extractedData.accountName || '微信作者'}
                    </span>
                    {extractedData.publishTime && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {extractedData.publishTime}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-blue-400">
                      <ImageIcon className="w-3 h-3" />
                      提取素材图片 {extractedData.images?.length || 0} 张
                    </span>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleApplyToEditor}
                    className="flex-1 md:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                    title="将逆向抓取的文章与元数据覆盖载入到主编辑器"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>导入到编辑器</span>
                  </button>

                  {onAddToMultiArticle && (
                    <button
                      type="button"
                      onClick={handleAddAsMulti}
                      className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg text-xs font-medium transition flex items-center gap-1"
                      title="作为多图文新增一篇"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>加为多图文</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="px-3 py-2 bg-neutral-750 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-neutral-700"
                    title="复制逆向清洗后的 Markdown 内容"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? '已复制' : '复制 MD'}</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 border-b border-neutral-800 flex items-center space-x-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('markdown')}
                  className={`py-2 border-b-2 transition ${
                    activeTab === 'markdown'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Markdown 正文预览
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`py-2 border-b-2 transition ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  文章元数据 & 摘要
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('images')}
                  className={`py-2 border-b-2 transition ${
                    activeTab === 'images'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  提取配图素材 ({extractedData.images?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4">
                {activeTab === 'markdown' && (
                  <pre className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-text">
                    {extractedData.markdown}
                  </pre>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                        <div className="text-neutral-500">文章标题</div>
                        <div className="font-semibold text-neutral-200">{extractedData.title}</div>
                      </div>
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                        <div className="text-neutral-500">作者 / 公众号</div>
                        <div className="font-semibold text-neutral-200">
                          {extractedData.author} ({extractedData.accountName})
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                      <div className="text-neutral-500">文章摘要 (Digest)</div>
                      <div className="text-neutral-300 leading-relaxed">
                        {extractedData.digest || '未设置摘要'}
                      </div>
                    </div>

                    {extractedData.cover && (
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                        <div className="text-neutral-500">原封面图片 URL</div>
                        <div className="flex items-center gap-3">
                          <img
                            src={extractedData.cover}
                            alt="封面"
                            className="w-24 h-14 object-cover rounded-lg border border-neutral-750"
                          />
                          <span className="text-[11px] text-neutral-400 font-mono truncate">
                            {extractedData.cover}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'images' && (
                  <div>
                    {extractedData.images.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500">正文中未检测到配图</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                        {extractedData.images.map((img, i) => (
                          <div
                            key={i}
                            className="bg-neutral-900 p-2 rounded-xl border border-neutral-800 space-y-2 group"
                          >
                            <div className="aspect-video w-full rounded-lg bg-neutral-850 overflow-hidden flex items-center justify-center">
                              <img
                                src={img.url}
                                alt={img.alt || `图${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-neutral-400">
                              <span className="truncate">{img.alt || `配图 ${i + 1}`}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`![${img.alt || '配图'}](${img.url})`);
                                  alert('已复制该图片 Markdown 标签！');
                                }}
                                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 rounded transition"
                              >
                                复制MD
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-850/60 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>提取后自动进行智能纯化，清理微信冗余标签与样式，完美保留表格、代码块及标题层级。</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
