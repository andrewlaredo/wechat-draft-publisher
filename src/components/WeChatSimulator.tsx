import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Heart,
  MessageSquare,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { ArticleMeta } from '../types/app.ts';
import { renderMarkdownLocally } from '../markdown/clientRender.ts';

interface WeChatSimulatorProps {
  metadata: ArticleMeta;
  inlinedHtml: string;
  viewMode: 'mobile' | 'desktop' | 'html';
  themeColor: string;
  themeEnabled?: boolean;
  themeName?: string;
  articleType?: 'news' | 'newspic';
  newspicCaption?: string;
  scannedImages?: string[];
}

export const WeChatSimulator: React.FC<WeChatSimulatorProps> = ({
  metadata,
  inlinedHtml,
  viewMode,
  themeColor,
  themeEnabled = true,
  themeName = 'pie',
  articleType = 'news',
  newspicCaption = '',
  scannedImages = [],
}) => {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Safeguard: Ensure inlinedHtml is real HTML. If it is raw Markdown or lacks HTML tags, parse it locally.
  const safeInlinedHtml = useMemo(() => {
    if (!inlinedHtml) return '';
    const trimmed = inlinedHtml.trim();
    // If it looks like raw markdown with front-matter or lacks HTML element tags
    const isRawMarkdown =
      trimmed.startsWith('---') ||
      (!trimmed.includes('<section') &&
        !trimmed.includes('<p') &&
        !trimmed.includes('<div') &&
        !trimmed.includes('<h'));
    if (isRawMarkdown) {
      try {
        const rendered = renderMarkdownLocally(inlinedHtml, {
          theme: themeName,
          themeEnabled,
        });
        return rendered.inlinedHtml;
      } catch (e) {
        console.warn('Fallback rendering in simulator failed:', e);
      }
    }
    return inlinedHtml;
  }, [inlinedHtml, themeName, themeEnabled]);

  // Collect all images for Newspic gallery
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (metadata.cover) list.push(metadata.cover);
    if (Array.isArray(metadata.images)) {
      for (const img of metadata.images) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    if (scannedImages && scannedImages.length > 0) {
      for (const img of scannedImages) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [metadata.cover, metadata.images, scannedImages]);

  // Keep index within bounds
  const activeImgIndex = galleryImages.length > 0 ? Math.min(currentImgIndex, galleryImages.length - 1) : 0;

  const handleCopyRaw = () => {
    const contentToCopy =
      articleType === 'newspic'
        ? JSON.stringify(
            {
              article_type: 'newspic',
              title: metadata.title,
              author: metadata.author,
              digest: metadata.digest,
              content: newspicCaption,
              image_info: {
                image_list: galleryImages.map((img, idx) => ({
                  image_media_id: `MEDIA_ID_${idx + 1}`,
                  source_preview: img,
                })),
              },
            },
            null,
            2
          )
        : safeInlinedHtml;

    navigator.clipboard.writeText(contentToCopy);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  // Helper to highlight #hashtags in newspic caption text
  const renderFormattedCaption = (text: string) => {
    if (!text) {
      return <p className="text-neutral-400 italic">暂无说明文案</p>;
    }

    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para, pIdx) => {
      // Split by words/hashtags
      const parts = para.split(/(#[^\s#]+)/g);
      return (
        <p key={pIdx} className="mb-3 leading-relaxed text-sm text-neutral-800 break-words">
          {parts.map((part, idx) => {
            if (part.startsWith('#') && part.length > 1) {
              return (
                <span
                  key={idx}
                  className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer inline-block mr-1.5"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // =========================================================================
  // VIEW 1: RAW HTML / JSON PAYLOAD VIEW
  // =========================================================================
  if (viewMode === 'html') {
    const isNewspic = articleType === 'newspic';
    const rawDisplay = isNewspic
      ? JSON.stringify(
          {
            article_type: 'newspic',
            title: metadata.title || '标题',
            author: metadata.author || '作者',
            digest: metadata.digest || '摘要',
            content: newspicCaption,
            need_open_comment: metadata.comment ? 1 : 0,
            image_info: {
              image_list: galleryImages.map((src, i) => ({
                image_media_id: `mock_media_id_${i + 1}`,
                url: src,
              })),
            },
          },
          null,
          2
        )
      : safeInlinedHtml;

    return (
      <div className="h-full flex flex-col bg-neutral-950 p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2 text-neutral-300">
            <span className="font-semibold text-sm">
              {isNewspic ? '微信图片消息 (newspic) 接口 Payload' : '全量内联 HTML 源码'}
            </span>
            <span className="text-neutral-500">
              {isNewspic
                ? `(含 ${galleryImages.length} 张图片素材 image_info · 微信官方原生图片消息协议)`
                : `(${safeInlinedHtml.length} 字符 · 无 style/script 标签 · 满足微信草稿箱限制)`}
            </span>
          </div>
          <button
            onClick={handleCopyRaw}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            {copiedHtml ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制内容</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isNewspic ? '复制 JSON Payload' : '复制全部源码'}</span>
              </>
            )}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-emerald-300/90 whitespace-pre-wrap break-all leading-relaxed select-all">
          {rawDisplay}
        </pre>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DESKTOP / WIDE SCREEN VIEW
  // =========================================================================
  if (viewMode === 'desktop') {
    if (articleType === 'newspic') {
      return (
        <div className="h-full overflow-y-auto bg-neutral-950 p-4 sm:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-4xl bg-white text-neutral-900 rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6 min-h-fit mb-8 max-w-full overflow-hidden break-words">
            {/* Left: Image Carousel & Gallery */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="relative aspect-4/3 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-200 shadow-sm">
                {galleryImages.length > 0 ? (
                  <img
                    src={galleryImages[activeImgIndex]}
                    alt={`Slide ${activeImgIndex + 1}`}
                    className="w-full h-full object-contain bg-neutral-900/5"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-neutral-400">
                    <ImageIcon className="w-12 h-12 stroke-1 mb-2" />
                    <span>暂无图片，请在 Markdown 中添加图片或配置封面</span>
                  </div>
                )}

                {/* Badge counter */}
                {galleryImages.length > 0 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium">
                    {activeImgIndex + 1} / {galleryImages.length}
                  </div>
                )}

                {/* Left/Right controls */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto py-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                        idx === activeImgIndex ? 'border-rose-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Title & Captions */}
            <div className="w-full md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 图片消息 (贴图/小绿书)
                  </span>
                  <span className="text-xs text-neutral-400">共 {galleryImages.length} 张高清图片</span>
                </div>

                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-neutral-900 mb-3 leading-snug">
                  {metadata.title || '图片消息标题'}
                </h1>

                <div className="flex items-center space-x-2 text-xs text-neutral-500 mb-4 pb-3 border-b border-neutral-100">
                  <span className="font-semibold text-neutral-800">{metadata.author || '公众号作者'}</span>
                  <span>·</span>
                  <span>刚刚</span>
                </div>

                {/* Caption Text & Tags */}
                <div className="max-h-[380px] overflow-y-auto pr-2">
                  {renderFormattedCaption(newspicCaption)}
                </div>
              </div>

              {/* Bottom interactions */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1 cursor-pointer hover:text-neutral-800">
                    <Heart className="w-4 h-4" /> <span>赞 824</span>
                  </span>
                  <span className="flex items-center space-x-1 cursor-pointer hover:text-neutral-800">
                    <ThumbsUp className="w-4 h-4" /> <span>收藏 312</span>
                  </span>
                  <span className="flex items-center space-x-1 cursor-pointer hover:text-neutral-800">
                    <MessageSquare className="w-4 h-4" /> <span>评论 45</span>
                  </span>
                </div>
                <button className="text-neutral-400 hover:text-neutral-700">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Classic News Long Article in Desktop
    return (
      <div className="h-full overflow-y-auto bg-neutral-950 p-4 sm:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-3xl bg-white text-neutral-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-12 min-h-fit mb-8 max-w-full overflow-hidden break-words">
          {/* Article Header */}
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 mb-4 leading-snug break-words">
            {metadata.title || '文章标题'}
          </h1>
          <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-500 mb-6 pb-4 border-b border-neutral-100">
            <span className="text-blue-600 font-medium">{metadata.author || '公众号作者'}</span>
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-600 font-medium">
              原创
            </span>
            <span>2026-09-18</span>
            {themeEnabled ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                主题排版已开启 ({themeName})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-neutral-100 text-neutral-600 font-medium border border-neutral-200">
                原生极简排版 (主题已关闭)
              </span>
            )}
          </div>

          {/* Article Inlined Body */}
          <div
            className="wechat-preview-render-area max-w-full overflow-x-hidden break-words"
            dangerouslySetInnerHTML={{ __html: safeInlinedHtml }}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MOBILE SIMULATOR (Realistic iPhone WeChat Client)
  // =========================================================================
  return (
    <div className="h-full overflow-y-auto bg-neutral-950 p-4 lg:p-8 flex justify-center items-start sm:items-center py-6">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[390px] h-[780px] flex-shrink-0 my-auto bg-neutral-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-neutral-800 flex flex-col relative overflow-hidden">
        {/* Dynamic Island / Speaker */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-950 rounded-full z-20 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
        </div>

        {/* Inner Screen */}
        <div className="w-full h-full bg-white text-neutral-900 rounded-[36px] overflow-hidden flex flex-col relative z-10 select-none min-h-0">
          {/* Status Bar */}
          <div className="h-10 px-6 pt-2 flex items-center justify-between text-neutral-900 text-xs font-semibold">
            <span>09:41</span>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span>5G</span>
              <div className="w-5 h-2.5 rounded-sm border border-neutral-800 p-0.5 flex items-center">
                <div className="h-full w-3/4 bg-neutral-900 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* WeChat Top Navigation Bar */}
          <div className="h-11 px-3 border-b border-neutral-100 flex items-center justify-between bg-white text-neutral-900">
            <button className="p-1 hover:bg-neutral-100 rounded-full">
              <ChevronLeft className="w-6 h-6 text-neutral-800" />
            </button>
            <span className="font-semibold text-sm truncate max-w-[200px]">
              {metadata.author || '微信公众号'}
            </span>
            <button className="p-1 hover:bg-neutral-100 rounded-full">
              <MoreHorizontal className="w-5 h-5 text-neutral-800" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE CONTENT: BRANCH A - NEWSPIC (图片消息/贴图) */}
          {/* ========================================================================= */}
          {articleType === 'newspic' ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Image Carousel */}
              <div className="relative aspect-4/3 w-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                {galleryImages.length > 0 ? (
                  <img
                    src={galleryImages[activeImgIndex]}
                    alt={`Image ${activeImgIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-neutral-400">
                    <ImageIcon className="w-10 h-10 mb-2 stroke-1" />
                    <span className="text-xs">未检测到图片，请插入图片或设置封面</span>
                  </div>
                )}

                {/* Counter Tag */}
                {galleryImages.length > 0 && (
                  <div className="absolute bottom-2.5 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-full text-white text-[11px] font-medium">
                    {activeImgIndex + 1} / {galleryImages.length}
                  </div>
                )}

                {/* Dots indicator */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1">
                    {galleryImages.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeImgIndex ? 'bg-white w-3' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right tap triggers */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                      className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/60 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImgIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/60 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border-b border-neutral-100 overflow-x-auto">
                  {galleryImages.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border ${
                        idx === activeImgIndex ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-200 opacity-60'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Captions & Text Info */}
              <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-600 font-semibold border border-rose-200">
                    图片消息 (贴图)
                  </span>
                  <span className="text-[11px] text-neutral-400">官方原生小绿书轮播</span>
                </div>

                <h1 className="text-base font-bold text-neutral-900 leading-snug">
                  {metadata.title || '图片消息标题'}
                </h1>

                {/* Formatted Caption */}
                <div className="text-neutral-800 text-xs">
                  {renderFormattedCaption(newspicCaption)}
                </div>

                <div className="text-[11px] text-neutral-400 pt-2">
                  <span>发布于 今天 10:20</span>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="h-12 border-t border-neutral-100 px-4 flex items-center justify-between bg-white text-neutral-600 text-xs">
                <div className="flex items-center space-x-1.5 text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-full flex-1 mr-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px]">说点什么...</span>
                </div>
                <div className="flex items-center space-x-3.5">
                  <span className="flex items-center space-x-1 cursor-pointer">
                    <Heart className="w-4 h-4 text-neutral-700" />
                    <span className="text-[11px] font-medium">824</span>
                  </span>
                  <span className="flex items-center space-x-1 cursor-pointer">
                    <ThumbsUp className="w-4 h-4 text-neutral-700" />
                    <span className="text-[11px] font-medium">312</span>
                  </span>
                  <Share2 className="w-4 h-4 text-neutral-700 cursor-pointer" />
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* MOBILE CONTENT: BRANCH B - CLASSIC NEWS ARTICLE (经典图文长文) */
            /* ========================================================================= */
            <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 text-left overflow-x-hidden">
              {/* Title */}
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 leading-snug break-words">
                {metadata.title || '无标题文章'}
              </h1>

              {/* Meta row */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-neutral-500">
                <span className="text-[#576b95] font-medium">{metadata.author || '公众号作者'}</span>
                <span className="px-1 py-0.2 rounded text-[10px] bg-neutral-100 text-neutral-600 font-medium">
                  原创
                </span>
                <span>2026年9月18日</span>
                {themeEnabled ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    {themeName} 主题
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-100 text-neutral-600 font-medium border border-neutral-200">
                    原生极简
                  </span>
                )}
              </div>

              {/* Optional Cover Banner */}
              {metadata.cover && (
                <div className="rounded-lg overflow-hidden my-3 border border-neutral-100">
                  <img
                    src={metadata.cover}
                    alt="Cover"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Article Rendered Body */}
              <div
                className="wechat-preview-body text-neutral-800 max-w-full overflow-x-hidden break-words"
                dangerouslySetInnerHTML={{ __html: safeInlinedHtml }}
              />

              {/* WeChat Standard Footer */}
              <div className="pt-8 pb-4 border-t border-neutral-100 space-y-4 text-xs text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>阅读 10万+</span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1 cursor-pointer">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>3,218</span>
                    </span>
                    <span className="flex items-center space-x-1 cursor-pointer">
                      <Heart className="w-3.5 h-3.5" />
                      <span>在看 1,842</span>
                    </span>
                    <span className="flex items-center space-x-1 cursor-pointer">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>分享</span>
                    </span>
                  </div>
                </div>

                {metadata.comment && (
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 space-y-2">
                    <div className="flex items-center justify-between text-neutral-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#576b95]" />
                        精选留言
                      </span>
                      <span className="text-[#576b95] text-[11px] cursor-pointer">写留言</span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      作者已开启精选留言，推送到草稿箱后可在后台置顶审核。
                    </p>
                  </div>
                )}

                <div className="text-center text-[10px] text-neutral-300 pt-2">
                  微信公众平台 · 草稿箱自动同步预览
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
