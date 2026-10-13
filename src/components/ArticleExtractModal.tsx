import React, { useState, useEffect } from 'react';
import {
  X,
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
  Info,
  Calendar,
  User,
  Code,
  ClipboardList,
  Trash2,
  Clock,
  Filter,
  CheckSquare,
  Square,
  Maximize2,
  BookmarkCheck,
} from 'lucide-react';
import { safeFetchJson } from '../utils/safeFetch.ts';
import { parseWechatHtmlToArticle } from '../wechat/extractArticle.ts';

export interface ExtractedArticleData {
  title: string;
  author: string;
  accountName: string;
  digest: string;
  cover: string;
  markdown: string;
  images: Array<{ url: string; alt: string }>;
  publishTime: string;
  sourceUrl: string;
  extractedAt?: number;
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

const STORAGE_KEY = 'wechat_extract_history_v1';

export const ArticleExtractModal: React.FC<ArticleExtractModalProps> = ({
  isOpen,
  onClose,
  onApplyMarkdown,
  onAddToMultiArticle,
}) => {
  const [url, setUrl] = useState('');
  const [extractMode, setExtractMode] = useState<'url' | 'html'>('url');
  const [rawHtml, setRawHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedArticleData | null>(null);
  const [activeTab, setActiveTab] = useState<'markdown' | 'info' | 'images' | 'history'>('markdown');
  const [isCopied, setIsCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Asset processing state
  const [selectedImageUrls, setSelectedImageUrls] = useState<Set<string>>(new Set());
  const [filterPromoFooters, setFilterPromoFooters] = useState<boolean>(true);
  const [filterQrCodes, setFilterQrCodes] = useState<boolean>(true);

  // History list from localStorage
  const [historyList, setHistoryList] = useState<ExtractedArticleData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const saveToHistory = (item: ExtractedArticleData) => {
    try {
      const record: ExtractedArticleData = {
        ...item,
        extractedAt: Date.now(),
      };
      const filtered = historyList.filter(
        (x) => x.sourceUrl !== item.sourceUrl || x.title !== item.title
      );
      const nextList = [record, ...filtered].slice(0, 15);
      setHistoryList(nextList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Local storage fallback
    }
  };

  const deleteFromHistory = (index: number) => {
    const nextList = [...historyList];
    nextList.splice(index, 1);
    setHistoryList(nextList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
  };

  const clearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem(STORAGE_KEY);
    showNotice('已清空提取历史记录');
  };

  // When extracted data updates, initialize selected images with all non-qr ones
  useEffect(() => {
    if (extractedData?.images) {
      const allUrls = extractedData.images
        .filter((img) => {
          if (!filterQrCodes) return true;
          const lower = (img.url + ' ' + (img.alt || '')).toLowerCase();
          return !lower.includes('qrcode') && !lower.includes('qr_code') && !lower.includes('二维码');
        })
        .map((img) => img.url);
      setSelectedImageUrls(new Set(allUrls));
    }
  }, [extractedData, filterQrCodes]);

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
        const article = res.data.article;
        setExtractedData(article);
        saveToHistory(article);
        showNotice(`🎉 成功抓取并逆向解析文章《${article.title || '未命名'}》！`);
      } else {
        const errMsg = res.error || '抓取文章失败，请检查链接或网络';
        setError(errMsg);
      }
    } catch (err: any) {
      setError(err.message || '请求抓取服务异常');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractFromHtml = (contentToParse = rawHtml) => {
    const content = (contentToParse || '').trim();
    if (!content) {
      setError('请粘贴微信推文的网页源码 (HTML) 或复制的正文内容');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActionNotice(null);

    try {
      const article = parseWechatHtmlToArticle(content, url || '');
      setExtractedData(article);
      saveToHistory(article);
      showNotice(`🎉 成功逆向解析文章《${article.title || '未命名'}》！`);
    } catch (err: any) {
      setError(err?.message || '逆向解析内容失败，请确认粘贴的是合法的微信推文富文本或 HTML');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteInTextarea = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData?.getData('text/html');
    if (html && html.trim()) {
      e.preventDefault();
      setRawHtml(html);
      handleExtractFromHtml(html);
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
    showNotice('✅ 已将逆向抓取的文章加入「多图文编排」清单！');
  };

  const handleCopyMarkdown = async () => {
    if (!extractedData) return;
    try {
      await navigator.clipboard.writeText(extractedData.markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showNotice('已复制 Markdown 内容到剪贴板！');
    } catch {
      // Fallback
    }
  };

  // Toggle single image selection
  const handleToggleSelectImage = (imgUrl: string) => {
    setSelectedImageUrls((prev) => {
      const next = new Set(prev);
      if (next.has(imgUrl)) {
        next.delete(imgUrl);
      } else {
        next.add(imgUrl);
      }
      return next;
    });
  };

  // Select all or deselect all
  const handleToggleSelectAllImages = () => {
    if (!extractedData?.images) return;
    if (selectedImageUrls.size === extractedData.images.length) {
      setSelectedImageUrls(new Set());
    } else {
      setSelectedImageUrls(new Set(extractedData.images.map((img) => img.url)));
    }
  };

  // Set selected image as cover
  const handleSetCover = (imgUrl: string) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      cover: imgUrl,
    });
    showNotice('✨ 已将该图片设为当前文章封面！');
  };

  // Copy batch image markdown list
  const handleCopyBatchImagesMarkdown = async () => {
    if (!extractedData?.images || extractedData.images.length === 0) return;
    const targetImages = extractedData.images.filter((img) => selectedImageUrls.has(img.url));
    const mdList = targetImages
      .map((img, i) => `![${img.alt || `配图 ${i + 1}`}](${img.url})`)
      .join('\n\n');
    await navigator.clipboard.writeText(mdList);
    showNotice(`已复制 ${targetImages.length} 张选定配图的 Markdown 列表！`);
  };

  // Filter markdown by removing unselected images
  const handlePruneUnselectedImages = () => {
    if (!extractedData?.images) return;
    let newMd = extractedData.markdown;
    const unselected = extractedData.images.filter((img) => !selectedImageUrls.has(img.url));

    unselected.forEach((img) => {
      // Escape URL for regex
      const escaped = img.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)\\s*`, 'g');
      newMd = newMd.replace(reg, '');
    });

    setExtractedData({
      ...extractedData,
      markdown: newMd,
      images: extractedData.images.filter((img) => selectedImageUrls.has(img.url)),
    });
    showNotice(`已清理 ${unselected.length} 张未勾选素材并同步更新 Markdown 正文！`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-850/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">
                  微信线上文章一键逆向提取与素材加工
                </h3>
                <span className="text-[11px] text-blue-400 font-mono">
                  · 智能清洗与素材工作台
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                支持输入推文链接或网页源码，自动抓取图文并逆向清洗为干净排版的 Markdown
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Extraction Mode Switcher & History Button */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-850 rounded-xl border border-neutral-750">
              <button
                type="button"
                onClick={() => {
                  setExtractMode('url');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  extractMode === 'url'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>推文 URL 在线抓取</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtractMode('html');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  extractMode === 'html'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>富文本 / 源码直接逆向</span>
                <span className="text-[10px] text-emerald-400 font-mono ml-1">
                  (防404兜底)
                </span>
              </button>
            </div>

            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                  activeTab === 'history'
                    ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200 border-neutral-750'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>提取历史 ({historyList.length})</span>
              </button>
            )}
          </div>

          {extractMode === 'url' ? (
            <>
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
                  <span>快速测试推文示例（点击一键载入）：</span>
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
            </>
          ) : (
            /* Direct HTML / Rich-text Paste Mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <label className="font-medium flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  <span>粘贴微信推文富文本内容或网页源码 (HTML)</span>
                </label>
                <span className="text-[11px] text-neutral-400">
                  支持浏览器直接全选复制微信正文粘贴，客户端本地极速解析
                </span>
              </div>
              <textarea
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                onPaste={handlePasteInTextarea}
                rows={5}
                placeholder="在微信推文中按 Ctrl+A 全选并 Ctrl+C 复制，在此直接 Ctrl+V 粘贴（或粘贴右键查看网页源代码的完整 HTML）..."
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-neutral-500" />
                  <span>纯客户端本地离线逆向清洗，免去微信机房 IP 限制与接口 404 困扰</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rawHtml && (
                    <button
                      type="button"
                      onClick={() => setRawHtml('')}
                      className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                    >
                      清空内容
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExtractFromHtml()}
                    disabled={!rawHtml.trim() || isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在解析...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>立即逆向解析</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message with Smart Remediation Actions */}
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-200 mb-0.5">提取遇到限制或异常</div>
                  <div>{error}</div>
                </div>
              </div>
              {extractMode === 'url' && (
                <div className="flex items-center gap-2 pt-2 border-t border-rose-900/60 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setExtractMode('html');
                      setError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>切换至「富文本/源码直接逆向」模式 (100% 成功)</span>
                  </button>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs transition flex items-center gap-1 border border-neutral-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      <span>在浏览器中打开原推文</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Extracted Result Showcase */}
          {extractedData && activeTab !== 'history' && (
            <div className="border border-neutral-750 rounded-xl bg-neutral-850 overflow-hidden space-y-3">
              {/* Meta Summary bar */}
              <div className="p-4 bg-neutral-800/90 border-b border-neutral-750 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-neutral-100 truncate">
                    {extractedData.title || '提取的文章'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {extractedData.author || extractedData.accountName || '微信作者'}
                    </span>
                    <span>·</span>
                    {extractedData.publishTime && (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {extractedData.publishTime}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span className="text-blue-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      素材配图 {extractedData.images?.length || 0} 张
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
                  className={`py-2 border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'images'
                      ? 'border-blue-500 text-blue-400 font-semibold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>素材加工中心 ({extractedData.images?.length || 0})</span>
                  {selectedImageUrls.size > 0 && (
                    <span className="text-[10px] text-blue-300 font-mono">
                      [已选 {selectedImageUrls.size}]
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4">
                {activeTab === 'markdown' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>已完成自动化清洗（剔除微信底层 DOM 标签与防盗链干扰）</span>
                      <span className="font-mono">{extractedData.markdown.length} 字符</span>
                    </div>
                    <pre className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-text">
                      {extractedData.markdown}
                    </pre>
                  </div>
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
                        <div className="text-neutral-500 flex items-center justify-between">
                          <span>当前封面图</span>
                          <span className="text-emerald-400">✓ 导入时将作为头条封面</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={extractedData.cover}
                            alt="封面"
                            referrerPolicy="no-referrer"
                            className="w-28 h-16 object-cover rounded-lg border border-neutral-750"
                          />
                          <span className="text-[11px] text-neutral-400 font-mono truncate flex-1">
                            {extractedData.cover}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'images' && (
                  <div className="space-y-3">
                    {/* Image Batch Action Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleSelectAllImages}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-200 transition text-[11px]"
                        >
                          {selectedImageUrls.size === extractedData.images.length ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                          <span>
                            {selectedImageUrls.size === extractedData.images.length
                              ? '全选配图'
                              : '反选配图'}
                          </span>
                        </button>
                        <span className="text-neutral-500 text-[11px]">
                          已选 {selectedImageUrls.size} / {extractedData.images.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyBatchImagesMarkdown}
                          disabled={selectedImageUrls.size === 0}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded transition text-[11px] flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-emerald-400" />
                          <span>批量复制 Markdown 列表</span>
                        </button>
                        {selectedImageUrls.size < extractedData.images.length && (
                          <button
                            type="button"
                            onClick={handlePruneUnselectedImages}
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded transition text-[11px] flex items-center gap-1"
                            title="从 Markdown 正文中移除所有未勾选的配图标签"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>清理未勾选配图</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {extractedData.images.length === 0 ? (
                      <div className="py-8 text-center text-neutral-500">正文中未检测到配图</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                        {extractedData.images.map((img, i) => {
                          const isSelected = selectedImageUrls.has(img.url);
                          const isCover = extractedData.cover === img.url;

                          return (
                            <div
                              key={i}
                              className={`bg-neutral-900 p-2 rounded-xl border transition flex flex-col justify-between ${
                                isSelected ? 'border-blue-600/60 ring-1 ring-blue-500/30' : 'border-neutral-800 opacity-60'
                              }`}
                            >
                              <div className="relative aspect-video w-full rounded-lg bg-neutral-850 overflow-hidden flex items-center justify-center">
                                <img
                                  src={img.url}
                                  alt={img.alt || `图${i + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />

                                {/* Selection Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectImage(img.url)}
                                  className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-neutral-400" />
                                  )}
                                </button>

                                {/* Cover Badge */}
                                {isCover && (
                                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-medium shadow-xs">
                                    封面
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 space-y-1.5">
                                <div className="text-[10px] text-neutral-400 truncate">
                                  {img.alt || `配图 ${i + 1}`}
                                </div>
                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-800 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleSetCover(img.url)}
                                    className={`px-1.5 py-0.5 rounded transition ${
                                      isCover
                                        ? 'text-emerald-400 bg-emerald-950/60'
                                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                    }`}
                                  >
                                    设为封面
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`![${img.alt || '配图'}](${img.url})`);
                                        showNotice('已复制该图片 Markdown 标签！');
                                      }}
                                      className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 rounded transition"
                                    >
                                      复制MD
                                    </button>
                                    <a
                                      href={img.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      referrerPolicy="no-referrer"
                                      className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition"
                                      title="在新窗口查看原图"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: History List */}
          {activeTab === 'history' && (
            <div className="border border-neutral-750 rounded-xl bg-neutral-850 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-neutral-200">
                    本地提取历史记录 ({historyList.length})
                  </span>
                </div>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-neutral-500 hover:text-rose-400 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>清空历史</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  暂无历史提取记录。提取的文章会自动保存在此处便于再次复用。
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {historyList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="font-semibold text-neutral-200 text-xs sm:text-sm truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2 font-mono">
                          <span>{item.author || item.accountName || '公众号作者'}</span>
                          <span>·</span>
                          <span>{item.images?.length || 0} 张配图</span>
                          {item.extractedAt && (
                            <>
                              <span>·</span>
                              <span>{new Date(item.extractedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setExtractedData(item);
                            setActiveTab('markdown');
                            showNotice(`已载入历史文章《${item.title}》！`);
                          }}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition"
                        >
                          载入此篇
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFromHistory(idx)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
                          title="删除记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-850/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>素材加工中心支持防防盗链安全预览、一键换封面与 Markdown 列表批量导出。</span>
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
