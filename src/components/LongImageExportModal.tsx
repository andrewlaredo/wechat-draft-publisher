import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  FileImage,
  Download,
  Copy,
  Check,
  Smartphone,
  Share2,
  Sliders,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Heart,
  Eye,
  CheckCircle2,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  Shrink,
} from 'lucide-react';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import { ArticleMeta } from '../types/app.ts';
import { ThemeConfig } from '../markdown/style.ts';

interface LongImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inlinedHtml: string;
  metadata: ArticleMeta;
  activeTheme: string;
  currentThemeObj?: { id: string; name: string; primaryColor?: string; color?: string };
}

type PosterStyleType = 'mobile' | 'weibo' | 'card';

export const LongImageExportModal: React.FC<LongImageExportModalProps> = ({
  isOpen,
  onClose,
  inlinedHtml,
  metadata,
  activeTheme,
  currentThemeObj,
}) => {
  const [posterStyle, setPosterStyle] = useState<PosterStyleType>('mobile');
  const [posterWidth, setPosterWidth] = useState<number>(414); // 414px ideal mobile reading width
  const [pixelRatio, setPixelRatio] = useState<number>(2); // 2x Retina
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [showCover, setShowCover] = useState<boolean>(true);
  const [showMetaHeader, setShowMetaHeader] = useState<boolean>(true);
  const [showFooterInteraction, setShowFooterInteraction] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);
  const [previewMode, setPreviewMode] = useState<'canvas' | 'image'>('canvas');
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const captureContainerRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keep track of real rendered height to prevent layout clipping
  useEffect(() => {
    if (!captureContainerRef.current) return;
    const updateSize = () => {
      if (captureContainerRef.current) {
        setContentHeight(captureContainerRef.current.offsetHeight);
      }
    };
    updateSize();
    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(captureContainerRef.current);
    return () => ro.disconnect();
  }, [posterStyle, posterWidth, showCover, showMetaHeader, showFooterInteraction, showWatermark, inlinedHtml]);

  // Fit Whole Screen: see the entire long poster at once without any clipping
  const handleFitToScreen = useCallback(() => {
    if (!previewViewportRef.current || !captureContainerRef.current) return;
    const vp = previewViewportRef.current;
    const availW = Math.max(120, vp.clientWidth - 56);
    const availH = Math.max(120, vp.clientHeight - 64);
    const h = captureContainerRef.current.offsetHeight || contentHeight || 1200;
    const scaleX = availW / posterWidth;
    const scaleY = availH / h;
    const fitScale = Math.min(scaleX, scaleY);
    setPreviewZoom(Math.max(0.1, Math.min(1.5, Math.round(fitScale * 100) / 100)));
  }, [posterWidth, contentHeight]);

  // Fit Width: scale to match container width for comfortable vertical reading
  const handleFitWidth = useCallback(() => {
    if (!previewViewportRef.current) return;
    const vp = previewViewportRef.current;
    const availW = Math.max(120, vp.clientWidth - 56);
    const fitScale = availW / posterWidth;
    setPreviewZoom(Math.max(0.2, Math.min(2.0, Math.round(fitScale * 100) / 100)));
  }, [posterWidth]);

  // Generate Long Image
  const handleGenerateImage = useCallback(async () => {
    if (!captureContainerRef.current) return;
    setIsGenerating(true);
    setToastMessage(null);

    try {
      // Ensure images are fully rendered
      await new Promise((r) => setTimeout(r, 250));

      const el = captureContainerRef.current;
      const width = el.offsetWidth || posterWidth;
      const height = el.scrollHeight || el.offsetHeight;

      const options = {
        pixelRatio,
        cacheBust: true,
        quality: imageFormat === 'jpeg' ? 0.92 : undefined,
        width,
        height,
      };

      let dataUrl = '';
      if (imageFormat === 'jpeg') {
        dataUrl = await toJpeg(captureContainerRef.current, {
          ...options,
          backgroundColor: '#ffffff',
        });
      } else {
        dataUrl = await toPng(captureContainerRef.current, options);
      }

      setGeneratedDataUrl(dataUrl);
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;

      showToast('🎉 高清长图已成功生成！可点击右侧下载或复制');
    } catch (err: any) {
      console.error('Long image generation error:', err);
      showToast(`生成长图失败: ${err.message || '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [pixelRatio, imageFormat, posterWidth]);

  // Auto-generate on open and fit width
  useEffect(() => {
    if (isOpen) {
      setGeneratedDataUrl(null);
      const timer = setTimeout(() => {
        handleFitWidth();
        handleGenerateImage();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, posterStyle, posterWidth, pixelRatio, imageFormat, showCover, showMetaHeader, showFooterInteraction, showWatermark, handleGenerateImage, handleFitWidth]);

  if (!isOpen) return null;

  // Handle Download
  const handleDownload = () => {
    if (!generatedDataUrl) return;
    const a = document.createElement('a');
    a.href = generatedDataUrl;
    const ext = imageFormat === 'jpeg' ? 'jpg' : 'png';
    const safeTitle = (metadata.title || 'wechat_article').replace(/[/\\?%*:|"<>]/g, '_');
    a.download = `${safeTitle}_长图_${posterStyle}.${ext}`;
    a.click();
    showToast('💾 已启动长图下载！');
  };

  // Handle Copy to Clipboard
  const handleCopyImage = async () => {
    if (!captureContainerRef.current) return;
    try {
      setIsCopied(true);
      const blob = await toBlob(captureContainerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      if (!blob) throw new Error('生成图片数据为空');

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob,
          }),
        ]);
        showToast('📋 已复制长图到剪贴板！可直接在微信聊天框或朋友圈中粘贴');
      } else {
        showToast('当前浏览器不支持直接写入图片剪贴板，请点击「下载长图」保存！');
      }
    } catch (err: any) {
      showToast(`复制长图失败: ${err.message}`);
    } finally {
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const scaledWidth = Math.ceil(posterWidth * previewZoom);
  const scaledHeight = contentHeight ? Math.ceil(contentHeight * previewZoom) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-850/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileImage className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>高清长图渲染导出 (Poster / 长微博)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                  高清海报渲染
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                将排版文章无损光栅化为超清长图，便捷分发至朋友圈、微信群或微博
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

        {/* Floating Toast Notice */}
        {toastMessage && (
          <div className="bg-emerald-950/95 border-b border-emerald-800 px-4 py-2 text-xs flex items-center justify-between text-emerald-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}

        {/* Main Split Layout: Left Controls, Right Live Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Customization Panel */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-neutral-800 p-4 space-y-4 overflow-y-auto bg-neutral-900/60 shrink-0 text-xs">
            {/* Style Preset Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>长图排版版式</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPosterStyle('mobile')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    posterStyle === 'mobile'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>微信仿真</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterStyle('weibo')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    posterStyle === 'weibo'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>长微博</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterStyle('card')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    posterStyle === 'card'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>卡片海报</span>
                </button>
              </div>
            </div>

            {/* Width & Pixel Ratio */}
            <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-3">
              <div>
                <div className="flex items-center justify-between text-neutral-300 mb-1">
                  <span>长图画布宽度</span>
                  <span className="font-mono text-amber-400">{posterWidth}px</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[375, 414, 540].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPosterWidth(w)}
                      className={`py-1 rounded text-[11px] border transition ${
                        posterWidth === w
                          ? 'bg-neutral-700 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-neutral-800 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {w}px {w === 375 ? '(紧凑)' : w === 414 ? '(推荐)' : '(宽屏)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-neutral-300 mb-1">
                  <span>画质倍率 (Retina)</span>
                  <span className="font-mono text-emerald-400">{pixelRatio}x 视网膜</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[2, 3].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPixelRatio(r)}
                      className={`py-1 rounded text-[11px] border transition ${
                        pixelRatio === r
                          ? 'bg-neutral-700 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-neutral-800 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {r}x {r === 2 ? '(高清)' : '(超清打印)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-neutral-300 mb-1">
                  <span>输出格式</span>
                  <span className="font-mono uppercase text-blue-400">{imageFormat}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['png', 'jpeg'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setImageFormat(fmt)}
                      className={`py-1 rounded text-[11px] border uppercase transition ${
                        imageFormat === fmt
                          ? 'bg-neutral-700 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-neutral-800 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {fmt} {fmt === 'png' ? '(无损)' : '(小体积)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Elements Toggles */}
            <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                <span>包含视觉模块</span>
              </div>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span>包含封面题图</span>
                <input
                  type="checkbox"
                  checked={showCover}
                  onChange={(e) => setShowCover(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span>包含标题与作者栏</span>
                <input
                  type="checkbox"
                  checked={showMetaHeader}
                  onChange={(e) => setShowMetaHeader(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span>包含阅读与互动底栏</span>
                <input
                  type="checkbox"
                  checked={showFooterInteraction}
                  onChange={(e) => setShowFooterInteraction(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-neutral-300">
                <span>包含排版引擎水印</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
              </label>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>正在光栅化长图...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>重新渲染长图</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!generatedDataUrl || isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>下载长图 ({imageFormat.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 rounded-xl transition flex items-center justify-center gap-2"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? '已复制长图！' : '复制长图到剪贴板'}</span>
              </button>
            </div>
          </div>

          {/* Right: Live Canvas & High-fidelity Preview */}
          <div className="flex-1 bg-neutral-950 flex flex-col h-full overflow-hidden relative">
            {/* Top Control Bar: Mode Toggle + Full Zoom Controls */}
            <div className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-20 text-xs">
              {/* Left: Mode Toggle */}
              <div className="flex items-center space-x-1 bg-neutral-850 p-1 rounded-xl border border-neutral-750">
                <button
                  type="button"
                  onClick={() => setPreviewMode('canvas')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'canvas'
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                      : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-750'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>实时排版画布</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('image')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'image'
                      ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-xs'
                      : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-750'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>已生成高清长图</span>
                  {generatedDataUrl && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Center & Right: Precision Zoom & Fit Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Quick Fit Buttons */}
                <div className="flex items-center space-x-1 bg-neutral-850 px-1.5 py-1 rounded-xl border border-neutral-750">
                  <button
                    type="button"
                    onClick={handleFitToScreen}
                    className="px-2 py-0.5 rounded text-neutral-200 hover:text-amber-300 hover:bg-neutral-750 transition flex items-center gap-1 font-medium"
                    title="自适应全图：自动缩放整篇长图，使顶部到底部完整展示在屏幕内，不被裁剪"
                  >
                    <Shrink className="w-3.5 h-3.5 text-amber-400" />
                    <span>自适应全图</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFitWidth}
                    className="px-2 py-0.5 rounded text-neutral-200 hover:text-blue-300 hover:bg-neutral-750 transition flex items-center gap-1"
                    title="适应宽度：缩放使长图宽度完美贴合视窗"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>适应宽度</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(1)}
                    className={`px-2 py-0.5 rounded transition ${
                      previewZoom === 1
                        ? 'bg-neutral-700 text-amber-300 font-semibold'
                        : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-750'
                    }`}
                    title="100% 原始尺寸"
                  >
                    <span>100%</span>
                  </button>
                </div>

                {/* Stepper and range slider */}
                <div className="flex items-center space-x-1.5 bg-neutral-850 px-2 py-1 rounded-xl border border-neutral-750">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-100 transition"
                    title="缩小"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={Math.round(previewZoom * 100)}
                    onChange={(e) => setPreviewZoom(Number(e.target.value) / 100)}
                    className="w-16 sm:w-20 accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                    title="滑动微调缩放比例"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
                    className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-100 transition"
                    title="放大"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-amber-300 min-w-[38px] text-right font-medium">
                    {Math.round(previewZoom * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Viewport with full horizontal and vertical scroll */}
            <div
              ref={previewViewportRef}
              className="flex-1 overflow-auto p-4 sm:p-6 w-full flex bg-neutral-950 select-none"
            >
              {previewMode === 'canvas' ? (
                <div className="m-auto flex flex-col items-center">
                  {/* Bounding Box with exact layout dimensions */}
                  <div
                    style={{
                      width: `${scaledWidth}px`,
                      height: contentHeight ? `${scaledHeight}px` : 'auto',
                      minWidth: `${scaledWidth}px`,
                      minHeight: contentHeight ? `${scaledHeight}px` : 'auto',
                      position: 'relative',
                    }}
                    className="transition-all duration-100 ease-out"
                  >
                    <div
                      style={{
                        width: `${posterWidth}px`,
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                      className="shadow-2xl rounded-2xl overflow-hidden"
                    >
                      <div
                        ref={captureContainerRef}
                        style={{
                          width: `${posterWidth}px`,
                          backgroundColor: posterStyle === 'card' ? '#f4f6f8' : '#ffffff',
                          color: '#2b2b2b',
                          padding: posterStyle === 'card' ? '20px 16px' : '0px',
                          boxSizing: 'border-box',
                        }}
                        className="font-sans select-none"
                      >
                {/* Outer Wrapper for Card Style */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: posterStyle === 'card' ? '12px' : '0px',
                    boxShadow: posterStyle === 'card' ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  {/* Style 1: Mobile Simulator Top Bar */}
                  {posterStyle === 'mobile' && (
                    <div
                      style={{
                        backgroundColor: '#ededed',
                        borderBottom: '1px solid #e0e0e0',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#666666',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>09:41</span>
                      <span style={{ fontWeight: 600, color: '#333333' }}>
                        {metadata.author || '微信公众号'}
                      </span>
                      <span>5G 🔋</span>
                    </div>
                  )}

                  {/* Optional Cover Image */}
                  {showCover && metadata.cover && (
                    <div style={{ width: '100%', maxHeight: '240px', overflow: 'hidden' }}>
                      <img
                        src={metadata.cover}
                        alt="封面"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}

                  {/* Header / Title Section */}
                  {showMetaHeader && (
                    <div style={{ padding: '20px 18px 12px 18px' }}>
                      <h1
                        style={{
                          fontSize: posterStyle === 'weibo' ? '22px' : '20px',
                          fontWeight: 700,
                          lineHeight: 1.35,
                          color: '#1a1a1a',
                          margin: '0 0 10px 0',
                        }}
                      >
                        {metadata.title || '未命名文章'}
                      </h1>

                      {/* Author & Timestamp */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#888888',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ color: '#576b95', fontWeight: 600 }}>
                          {metadata.author || '原创'}
                        </span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('zh-CN')}</span>
                        {metadata.digest && (
                          <span
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                            }}
                          >
                            精选
                          </span>
                        )}
                      </div>

                      {/* Digest Quote if present */}
                      {metadata.digest && (
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            borderLeft: `3px solid ${currentThemeObj?.primaryColor || '#1e80ff'}`,
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: '#475569',
                            lineHeight: 1.5,
                            margin: '10px 0 0 0',
                            borderRadius: '0 6px 6px 0',
                          }}
                        >
                          <strong>导语：</strong> {metadata.digest}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Article Inlined Content */}
                  <div
                    style={{
                      padding: '8px 18px 24px 18px',
                      fontSize: '15px',
                      lineHeight: '1.75',
                      color: '#333333',
                    }}
                    dangerouslySetInnerHTML={{ __html: inlinedHtml }}
                  />

                  {/* Style 1 Mobile Interaction Footer */}
                  {showFooterInteraction && posterStyle === 'mobile' && (
                    <div
                      style={{
                        padding: '14px 18px',
                        borderTop: '1px solid #f0f0f0',
                        backgroundColor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#8c8c8c',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span>阅读 10万+</span>
                        <span style={{ color: '#576b95' }}>在看 999+</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>❤️ 点赞</span>
                        <span>•</span>
                        <span>分享</span>
                      </div>
                    </div>
                  )}

                  {/* Style 2 Weibo Divider */}
                  {posterStyle === 'weibo' && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '12px',
                        borderTop: '1px dashed #e5e7eb',
                        fontSize: '11px',
                        color: '#9ca3af',
                      }}
                    >
                      —— 微博 / 社交网络专享长图版 ——
                    </div>
                  )}

                  {/* Footer Watermark */}
                  {showWatermark && (
                    <div
                      style={{
                        padding: '12px 18px',
                        backgroundColor: '#fbfbfb',
                        borderTop: '1px solid #f0f0f0',
                        textAlign: 'center',
                        fontSize: '10px',
                        color: '#a3a3a3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>✨ 排版生成于 WeChat Draft Publisher</span>
                      <span>•</span>
                      <span>主题：{currentThemeObj?.name || activeTheme}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-auto flex flex-col items-center gap-4 py-4 max-w-full">
          {generatedDataUrl ? (
            <>
              <div className="flex items-center gap-3 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-xl shadow-md">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  长图渲染就绪
                </span>
                <span>•</span>
                {imageDimensions && (
                  <span className="font-mono text-neutral-200">
                    {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                )}
                <span>•</span>
                <span className="uppercase text-amber-300 font-mono font-medium">
                  {imageFormat} ({pixelRatio}x Retina)
                </span>
              </div>

              <div
                style={{
                  width: `${scaledWidth}px`,
                  height: contentHeight ? `${scaledHeight}px` : 'auto',
                  minWidth: `${scaledWidth}px`,
                  minHeight: contentHeight ? `${scaledHeight}px` : 'auto',
                  position: 'relative',
                }}
                className="shadow-2xl rounded-2xl overflow-hidden bg-white"
              >
                <img
                  src={generatedDataUrl}
                  alt="已生成高清长图"
                  style={{
                    width: `${posterWidth}px`,
                    transform: `scale(${previewZoom})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-20 px-6 text-neutral-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-sm font-medium text-neutral-200">高清长图正在后台光栅化渲染中...</p>
              <p className="text-xs text-neutral-500">渲染完毕后即可在此预览无损全图并直接复制或下载</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>
</div>
</div>
);
};
