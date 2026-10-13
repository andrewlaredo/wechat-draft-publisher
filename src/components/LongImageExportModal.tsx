import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
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
  CheckCircle2,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  Shrink,
  Newspaper,
  BookOpen,
  Scissors,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { ArticleMeta } from '../types/app.ts';

interface LongImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inlinedHtml: string;
  metadata: ArticleMeta;
  activeTheme: string;
  currentThemeObj?: { id: string; name: string; primaryColor?: string; color?: string };
}

export type PosterStyleType = 'mobile' | 'weibo' | 'card' | 'editorial' | 'knowledge';
export type PaperToneType = 'white' | 'warm-paper' | 'slate' | 'cream';
export type SliceModeType = 'none' | 'red_3_4' | 'moments_1_1' | 'custom_parts';

export interface SlicedItem {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

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
  const [paperTone, setPaperTone] = useState<PaperToneType>('white');
  const [showCover, setShowCover] = useState<boolean>(true);
  const [showMetaHeader, setShowMetaHeader] = useState<boolean>(true);
  const [showFooterInteraction, setShowFooterInteraction] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [customWatermarkText, setCustomWatermarkText] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);
  const [previewMode, setPreviewMode] = useState<'canvas' | 'image' | 'slices'>('canvas');
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slicing state (九宫格/分页切片)
  const [sliceMode, setSliceMode] = useState<SliceModeType>('none');
  const [slicePartsCount, setSlicePartsCount] = useState<number>(6);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);
  const [slicedImages, setSlicedImages] = useState<SlicedItem[]>([]);

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
  }, [
    posterStyle,
    posterWidth,
    paperTone,
    showCover,
    showMetaHeader,
    showFooterInteraction,
    showWatermark,
    customWatermarkText,
    inlinedHtml,
  ]);

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
      // Ensure fonts & DOM reflow are settled
      await new Promise((r) => setTimeout(r, 260));

      const el = captureContainerRef.current;
      const width = el.offsetWidth || posterWidth;
      const height = el.scrollHeight || el.offsetHeight;

      const options = {
        pixelRatio,
        cacheBust: true,
        quality: imageFormat === 'jpeg' ? 0.94 : undefined,
        width,
        height,
      };

      let dataUrl = '';
      if (imageFormat === 'jpeg') {
        dataUrl = await toJpeg(captureContainerRef.current, {
          ...options,
          backgroundColor: paperTone === 'warm-paper' ? '#faf8f5' : paperTone === 'cream' ? '#fcfbf7' : '#ffffff',
        });
      } else {
        dataUrl = await toPng(captureContainerRef.current, options);
      }

      setGeneratedDataUrl(dataUrl);
      setImageDimensions({ width: width * pixelRatio, height: height * pixelRatio });
      setPreviewMode('image');
      showToast('🎉 高清长图已成功光栅化渲染完毕！');
    } catch (err: any) {
      alert(`渲染长图失败: ${err.message || '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [pixelRatio, imageFormat, posterWidth, paperTone]);

  // Generate image on open or when parameters change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleFitWidth();
        handleGenerateImage();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Perform Image Slicing using Canvas
  const handlePerformSlicing = useCallback(async (sourceUrl = generatedDataUrl) => {
    if (!sourceUrl) return;
    setIsSlicing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = sourceUrl;
      });

      const totalWidth = img.width;
      const totalHeight = img.height;

      let sliceHeight = 0;
      let totalSlices = 1;

      if (sliceMode === 'red_3_4') {
        // Xiaohongshu 3:4 ratio: height = width * 4 / 3
        sliceHeight = Math.round(totalWidth * (4 / 3));
        totalSlices = Math.max(1, Math.ceil(totalHeight / sliceHeight));
      } else if (sliceMode === 'moments_1_1') {
        // Moments 1:1 ratio: height = width
        sliceHeight = totalWidth;
        totalSlices = Math.max(1, Math.ceil(totalHeight / sliceHeight));
      } else if (sliceMode === 'custom_parts') {
        totalSlices = Math.max(2, Math.min(9, slicePartsCount));
        sliceHeight = Math.ceil(totalHeight / totalSlices);
      } else {
        setSlicedImages([]);
        setIsSlicing(false);
        return;
      }

      const results: SlicedItem[] = [];

      for (let i = 0; i < totalSlices; i++) {
        const sy = i * sliceHeight;
        const sh = Math.min(sliceHeight, totalHeight - sy);
        if (sh <= 0) break;

        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(img, 0, sy, totalWidth, sh, 0, 0, totalWidth, sh);
        const sliceDataUrl = canvas.toDataURL('image/png');
        results.push({
          index: i + 1,
          dataUrl: sliceDataUrl,
          width: totalWidth,
          height: sh,
        });
      }

      setSlicedImages(results);
      setPreviewMode('slices');
      showToast(`✂️ 成功完成分页切片，共生成 ${results.length} 张连续切片！`);
    } catch (err: any) {
      alert(`切片处理失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSlicing(false);
    }
  }, [generatedDataUrl, sliceMode, slicePartsCount]);

  // Download Sliced Images sequentially
  const handleDownloadAllSlices = async () => {
    if (slicedImages.length === 0) return;
    const baseName = (metadata.title || 'wechat_long_poster').replace(/[\\/:*?"<>|]/g, '_');
    for (let i = 0; i < slicedImages.length; i++) {
      const item = slicedImages[i];
      const link = document.createElement('a');
      link.download = `${baseName}_slice_${item.index}_of_${slicedImages.length}.png`;
      link.href = item.dataUrl;
      link.click();
      await new Promise((r) => setTimeout(r, 200));
    }
    showToast(`✅ 已触发全部 ${slicedImages.length} 张分页切片极速下载！`);
  };

  // Download single long image
  const handleDownload = () => {
    if (!generatedDataUrl) return;
    const link = document.createElement('a');
    const safeTitle = (metadata.title || 'wechat_long_poster').replace(/[\\/:*?"<>|]/g, '_');
    link.download = `${safeTitle}.${imageFormat}`;
    link.href = generatedDataUrl;
    link.click();
    showToast(`📥 长图已开始下载 (${imageFormat.toUpperCase()})！`);
  };

  // Copy Image to System Clipboard
  const handleCopy = async () => {
    if (!generatedDataUrl) return;
    try {
      const response = await fetch(generatedDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setIsCopied(true);
      showToast('📋 已成功复制超清长图到系统剪贴板！可直接在微信/QQ聊天窗口按 Ctrl+V 粘贴发送');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err: any) {
      const link = document.createElement('a');
      link.href = generatedDataUrl;
      link.download = `${(metadata.title || 'poster').replace(/[\\/:*?"<>|]/g, '_')}.${imageFormat}`;
      link.click();
      showToast('浏览器安全限制禁止直接写入剪贴板，已为您自动触发本地下载保存！');
    }
  };

  if (!isOpen) return null;

  const scaledWidth = Math.ceil(posterWidth * previewZoom);
  const scaledHeight = contentHeight ? Math.ceil(contentHeight * previewZoom) : 0;

  // Background tone mapping
  const toneBgColor =
    paperTone === 'warm-paper'
      ? '#faf8f5'
      : paperTone === 'cream'
      ? '#fcfbf7'
      : paperTone === 'slate'
      ? '#f1f5f9'
      : '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[94vh] max-h-[96vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-850/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">
                  高清长图渲染与海报切片导出
                </h3>
                <span className="text-[11px] text-amber-400 font-mono">
                  · Retina 视网膜光栅化引擎
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                一键将整篇文章排版渲染为超清长图，支持多款设计版式、分页切片与剪贴板极速复制
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
          <div className="w-full lg:w-84 border-b lg:border-b-0 lg:border-r border-neutral-800 p-4 space-y-4 overflow-y-auto bg-neutral-900/80 shrink-0 text-xs">
            {/* Style Preset Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>长图排版版式体系</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPosterStyle('mobile')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    posterStyle === 'mobile'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-semibold shadow-xs'
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
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-semibold shadow-xs'
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
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-semibold shadow-xs'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>浮空卡片</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterStyle('editorial')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    posterStyle === 'editorial'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-semibold shadow-xs'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Newspaper className="w-4 h-4" />
                  <span>文艺早报</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterStyle('knowledge')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 col-span-2 ${
                    posterStyle === 'knowledge'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-semibold shadow-xs'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>知识金句卡片 (Notion 风格)</span>
                </button>
              </div>
            </div>

            {/* Paper Tone & Palette */}
            <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-200 font-medium">
                <span className="flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  <span>纸张底色与背景质感</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'white', name: '纯白', bg: '#ffffff', border: '#e2e8f0' },
                  { id: 'warm-paper', name: '暖纸', bg: '#faf8f5', border: '#e6ded3' },
                  { id: 'cream', name: '米乳', bg: '#fcfbf7', border: '#ede8dc' },
                  { id: 'slate', name: '冷灰', bg: '#f1f5f9', border: '#cbd5e1' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setPaperTone(tone.id as PaperToneType)}
                    className={`p-1.5 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                      paperTone === tone.id
                        ? 'border-amber-500 bg-neutral-750 text-amber-300 font-semibold'
                        : 'border-neutral-750 bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
                    />
                    <span className="text-[10px]">{tone.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-slice (九宫格/小红书分页切片) */}
            <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-neutral-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-rose-400" />
                  <span>多图分页切片导出</span>
                </span>
                <span className="text-[10px] text-neutral-400">朋友圈 / 小红书防模糊</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSliceMode('none')}
                  className={`py-1.5 px-2 rounded-lg border transition text-[11px] ${
                    sliceMode === 'none'
                      ? 'bg-neutral-750 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-800 border-neutral-750 text-neutral-400'
                  }`}
                >
                  整张长图 (单张)
                </button>
                <button
                  type="button"
                  onClick={() => setSliceMode('red_3_4')}
                  className={`py-1.5 px-2 rounded-lg border transition text-[11px] ${
                    sliceMode === 'red_3_4'
                      ? 'bg-neutral-750 border-rose-500 text-rose-300 font-medium'
                      : 'bg-neutral-800 border-neutral-750 text-neutral-400'
                  }`}
                >
                  小红书 3:4 切片
                </button>
                <button
                  type="button"
                  onClick={() => setSliceMode('moments_1_1')}
                  className={`py-1.5 px-2 rounded-lg border transition text-[11px] ${
                    sliceMode === 'moments_1_1'
                      ? 'bg-neutral-750 border-emerald-500 text-emerald-300 font-medium'
                      : 'bg-neutral-800 border-neutral-750 text-neutral-400'
                  }`}
                >
                  朋友圈 1:1 九宫格
                </button>
                <button
                  type="button"
                  onClick={() => setSliceMode('custom_parts')}
                  className={`py-1.5 px-2 rounded-lg border transition text-[11px] ${
                    sliceMode === 'custom_parts'
                      ? 'bg-neutral-750 border-blue-500 text-blue-300 font-medium'
                      : 'bg-neutral-800 border-neutral-750 text-neutral-400'
                  }`}
                >
                  自定义等分切片
                </button>
              </div>

              {sliceMode === 'custom_parts' && (
                <div className="flex items-center justify-between text-[11px] text-neutral-300 pt-1">
                  <span>切片数量:</span>
                  <div className="flex items-center gap-1">
                    {[3, 6, 9].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSlicePartsCount(count)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition ${
                          slicePartsCount === count
                            ? 'bg-blue-600 border-blue-500 text-white font-bold'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {count} 张等分
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sliceMode !== 'none' && (
                <button
                  type="button"
                  onClick={() => handlePerformSlicing()}
                  disabled={!generatedDataUrl || isSlicing}
                  className="w-full py-1.5 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  {isSlicing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>正在智能切割...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-3.5 h-3.5 text-rose-400" />
                      <span>立即执行切片 (预览 & 下载)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Width & Pixel Ratio & Format */}
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

            {/* Elements Toggles & Custom Watermark */}
            <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                <span>包含视觉模块与签名</span>
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
                <span>包含品牌水印</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
              </label>

              {showWatermark && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customWatermarkText}
                    onChange={(e) => setCustomWatermarkText(e.target.value)}
                    placeholder="自定义文末签名（留空为默认）"
                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
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
                <span>下载整张长图 ({imageFormat.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!generatedDataUrl || isGenerating}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? '已复制长图到剪贴板！' : '复制长图到剪贴板 (Ctrl+V发送)'}</span>
              </button>
            </div>
          </div>

          {/* Right: Live Canvas & High-fidelity Preview */}
          <div className="flex-1 bg-neutral-950 flex flex-col h-full overflow-hidden relative">
            {/* Top Control Bar: Mode Toggle + Full Zoom Controls */}
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 z-10">
              {/* Left: Mode Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-neutral-850 rounded-xl border border-neutral-750">
                <button
                  type="button"
                  onClick={() => setPreviewMode('canvas')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'canvas'
                      ? 'bg-neutral-700 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>实时排版画布</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!generatedDataUrl) {
                      handleGenerateImage();
                    } else {
                      setPreviewMode('image');
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    previewMode === 'image'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>已生成高清长图</span>
                  {generatedDataUrl && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
                {slicedImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewMode('slices')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      previewMode === 'slices'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>分页切片 ({slicedImages.length})</span>
                  </button>
                )}
              </div>

              {/* Right: Zoom Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFitToScreen}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1"
                  title="全图自适应视野：自动缩放完整显示整篇长图，不裁切上下任何内容"
                >
                  <Shrink className="w-3 h-3 text-emerald-400" />
                  <span>自适应全图</span>
                </button>
                <button
                  type="button"
                  onClick={handleFitWidth}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1"
                  title="适合宽度：贴合容器宽度垂直滚动浏览"
                >
                  <Maximize2 className="w-3 h-3 text-blue-400" />
                  <span>适合宽度</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1.0)}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg text-[11px] text-neutral-300 hover:text-white transition"
                  title="100% 原始大小"
                >
                  100%
                </button>

                {/* Stepper Zoom Buttons & Range Slider */}
                <div className="flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-700 text-xs">
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
                          backgroundColor:
                            posterStyle === 'card'
                              ? '#f1f5f9'
                              : posterStyle === 'editorial'
                              ? '#fbf9f5'
                              : posterStyle === 'knowledge'
                              ? '#0f172a'
                              : toneBgColor,
                          color: posterStyle === 'knowledge' ? '#f8fafc' : '#2b2b2b',
                          padding: posterStyle === 'card' ? '20px 16px' : posterStyle === 'knowledge' ? '18px 14px' : '0px',
                          boxSizing: 'border-box',
                        }}
                        className="font-sans select-none"
                      >
                        {/* Outer Wrapper for Card Style */}
                        <div
                          style={{
                            backgroundColor:
                              posterStyle === 'knowledge'
                                ? '#1e293b'
                                : toneBgColor,
                            color: posterStyle === 'knowledge' ? '#e2e8f0' : '#2b2b2b',
                            borderRadius: posterStyle === 'card' || posterStyle === 'knowledge' ? '14px' : '0px',
                            boxShadow:
                              posterStyle === 'card' || posterStyle === 'knowledge'
                                ? '0 10px 30px rgba(0,0,0,0.12)'
                                : 'none',
                            overflow: 'hidden',
                            border: posterStyle === 'editorial' ? '1px solid #e7dfd5' : 'none',
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
                                justifySelf: 'stretch',
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

                          {/* Style 4: Editorial Top Header */}
                          {posterStyle === 'editorial' && (
                            <div
                              style={{
                                borderBottom: '3px double #2c2c2c',
                                padding: '16px 20px 12px 20px',
                                textAlign: 'center',
                                backgroundColor: '#fcfaf6',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  letterSpacing: '3px',
                                  textTransform: 'uppercase',
                                  color: '#78716c',
                                  fontWeight: 600,
                                  marginBottom: '4px',
                                }}
                              >
                                THE DAILY DIGEST · 深度专栏
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#a8a29e',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  borderTop: '1px solid #e7e5e4',
                                  paddingTop: '4px',
                                  marginTop: '6px',
                                }}
                              >
                                <span>{new Date().toLocaleDateString('zh-CN')}</span>
                                <span>{metadata.author || '主理人原创'}</span>
                                <span>VOL. 2026</span>
                              </div>
                            </div>
                          )}

                          {/* Style 5: Knowledge Card Gradient Banner */}
                          {posterStyle === 'knowledge' && (
                            <div
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                padding: '12px 18px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              <span>💡 KNOWLEDGE CARD · 精选知识卡片</span>
                              <span style={{ opacity: 0.85 }}>{metadata.author || '精选思考'}</span>
                            </div>
                          )}

                          {/* Optional Cover Image */}
                          {showCover && metadata.cover && (
                            <div style={{ width: '100%', maxHeight: '240px', overflow: 'hidden' }}>
                              <img
                                src={metadata.cover}
                                alt="封面"
                                referrerPolicy="no-referrer"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                crossOrigin="anonymous"
                              />
                            </div>
                          )}

                          {/* Header / Title Section */}
                          {showMetaHeader && (
                            <div style={{ padding: '20px 20px 12px 20px' }}>
                              <h1
                                style={{
                                  fontSize:
                                    posterStyle === 'weibo'
                                      ? '22px'
                                      : posterStyle === 'editorial'
                                      ? '23px'
                                      : '20px',
                                  fontWeight: 700,
                                  lineHeight: 1.35,
                                  color: posterStyle === 'knowledge' ? '#f8fafc' : '#1a1a1a',
                                  margin: '0 0 10px 0',
                                  fontFamily: posterStyle === 'editorial' ? 'serif, system-ui' : 'inherit',
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
                                  color: posterStyle === 'knowledge' ? '#94a3b8' : '#888888',
                                  marginBottom: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    color:
                                      posterStyle === 'knowledge'
                                        ? '#38bdf8'
                                        : currentThemeObj?.primaryColor || '#576b95',
                                    fontWeight: 600,
                                  }}
                                >
                                  {metadata.author || '原创'}
                                </span>
                                <span>•</span>
                                <span>{new Date().toLocaleDateString('zh-CN')}</span>
                                {metadata.digest && (
                                  <span
                                    style={{
                                      backgroundColor: posterStyle === 'knowledge' ? '#334155' : '#f3f4f6',
                                      color: posterStyle === 'knowledge' ? '#cbd5e1' : '#6b7280',
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
                                    backgroundColor:
                                      posterStyle === 'knowledge'
                                        ? '#0f172a'
                                        : posterStyle === 'editorial'
                                        ? '#f5f2eb'
                                        : '#f8fafc',
                                    borderLeft: `3px solid ${
                                      posterStyle === 'knowledge'
                                        ? '#38bdf8'
                                        : currentThemeObj?.primaryColor || '#1e80ff'
                                    }`,
                                    padding: '10px 14px',
                                    fontSize: '12px',
                                    color: posterStyle === 'knowledge' ? '#cbd5e1' : '#475569',
                                    lineHeight: 1.55,
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
                              padding: '8px 20px 24px 20px',
                              fontSize: '15px',
                              lineHeight: '1.75',
                              color: posterStyle === 'knowledge' ? '#e2e8f0' : '#333333',
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
                                backgroundColor:
                                  posterStyle === 'knowledge'
                                    ? '#0f172a'
                                    : '#fbfbfb',
                                borderTop:
                                  posterStyle === 'knowledge'
                                    ? '1px solid #334155'
                                    : '1px solid #f0f0f0',
                                textAlign: 'center',
                                fontSize: '10px',
                                color: posterStyle === 'knowledge' ? '#64748b' : '#a3a3a3',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>
                                {customWatermarkText.trim() ||
                                  `✨ 排版生成于 WeChat Draft Publisher · 主题：${currentThemeObj?.name || activeTheme}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : previewMode === 'slices' ? (
                /* Multi-slice View */
                <div className="m-auto flex flex-col items-center gap-4 py-4 max-w-full">
                  <div className="flex items-center justify-between gap-3 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl shadow-md w-full max-w-xl">
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" />
                      已切分为 {slicedImages.length} 张独立图片
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadAllSlices}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>打包极速下载全部切片</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl p-2">
                    {slicedImages.map((slice) => (
                      <div
                        key={slice.index}
                        className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 shadow-md flex flex-col gap-2"
                      >
                        <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                          <span className="text-rose-300 font-bold">切片 #{slice.index}</span>
                          <span>{slice.width} × {slice.height}px</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-neutral-750 bg-white">
                          <img
                            src={slice.dataUrl}
                            alt={`切片 ${slice.index}`}
                            className="w-full h-auto object-cover display-block"
                          />
                        </div>
                        <a
                          href={slice.dataUrl}
                          download={`slice_${slice.index}.png`}
                          className="w-full py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded text-center text-xs transition"
                        >
                          单独下载此切片
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Rendered Image View */
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
