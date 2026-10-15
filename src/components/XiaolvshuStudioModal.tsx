import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Sparkles,
  Layers,
  Palette,
  Sliders,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  sliceMarkdownToXiaolvshuCards,
  XIAOLVSHU_THEMES,
  XiaolvshuCard,
  XiaolvshuTheme,
} from '../utils/xiaolvshuSlicer.ts';

interface XiaolvshuStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  title: string;
  author: string;
  digest: string;
  onPublishDraft?: (isXiaolvshu: boolean) => void;
}

export const XiaolvshuStudioModal: React.FC<XiaolvshuStudioModalProps> = ({
  isOpen,
  onClose,
  markdown,
  title,
  author,
  digest,
  onPublishDraft,
}) => {
  const [themeId, setThemeId] = useState<string>('dark-minimal');
  const [cards, setCards] = useState<XiaolvshuCard[]>(() => {
    return sliceMarkdownToXiaolvshuCards(markdown, title, author, digest);
  });
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeTheme: XiaolvshuTheme = useMemo(() => {
    return XIAOLVSHU_THEMES.find((t) => t.id === themeId) || XIAOLVSHU_THEMES[0];
  }, [themeId]);

  const activeCard = cards[activeIndex] || cards[0];

  const handleResetFromArticle = () => {
    const fresh = sliceMarkdownToXiaolvshuCards(markdown, title, author, digest);
    setCards(fresh);
    setActiveIndex(0);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  const handleUpdateCurrentCard = (field: keyof XiaolvshuCard, val: any) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[activeIndex] = { ...copy[activeIndex], [field]: val };
      return copy;
    });
  };

  const handleUpdatePoint = (idx: number, text: string) => {
    setCards((prev) => {
      const copy = [...prev];
      const pts = [...(copy[activeIndex].points || [])];
      pts[idx] = text;
      copy[activeIndex] = { ...copy[activeIndex], points: pts };
      return copy;
    });
  };

  const handleAddPoint = () => {
    setCards((prev) => {
      const copy = [...prev];
      const pts = [...(copy[activeIndex].points || []), '新增核心要点内容'];
      copy[activeIndex] = { ...copy[activeIndex], points: pts };
      return copy;
    });
  };

  const handleDeletePoint = (idx: number) => {
    setCards((prev) => {
      const copy = [...prev];
      const pts = (copy[activeIndex].points || []).filter((_, i) => i !== idx);
      copy[activeIndex] = { ...copy[activeIndex], points: pts };
      return copy;
    });
  };

  // Render a specific card onto an offscreen canvas and return data URL
  const renderCardToCanvas = (card: XiaolvshuCard, index: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200; // 3:4 ratio standard
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 900, 1200);
    if (activeTheme.id === 'dark-minimal') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#090d16');
    } else if (activeTheme.id === 'warm-cream') {
      grad.addColorStop(0, '#fffdfa');
      grad.addColorStop(1, '#f7f3eb');
    } else if (activeTheme.id === 'wechat-forest') {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f4fbf6');
    } else if (activeTheme.id === 'black-gold') {
      grad.addColorStop(0, '#1c1c22');
      grad.addColorStop(1, '#101013');
    } else if (activeTheme.id === 'fresh-avocado') {
      grad.addColorStop(0, '#f0fdf4');
      grad.addColorStop(1, '#e2f6ea');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f1f5f9');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 1200);

    // Decorative border
    ctx.strokeStyle = activeTheme.id.includes('dark') || activeTheme.id.includes('gold') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 828, 1128);

    // Top Header: Tag & Page Number
    const pageNumText = `0${index + 1} / 0${cards.length}`;
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = activeTheme.accentColor;
    ctx.fillText(pageNumText, 60, 90);

    if (card.tag) {
      // Tag pill
      ctx.fillStyle = activeTheme.tagBg;
      ctx.beginPath();
      ctx.roundRect(700, 68, 140, 36, 18);
      ctx.fill();
      ctx.fillStyle = activeTheme.tagText;
      ctx.font = 'bold 18px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(card.tag, 770, 93);
      ctx.textAlign = 'left';
    }

    // Main Title
    ctx.fillStyle = activeTheme.titleColor;
    ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    
    // Title word wrap
    const words = card.title;
    let line = '';
    let y = 180;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 760 && n > 0) {
        ctx.fillText(line, 60, y);
        line = words[n];
        y += 56;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 60, y);
    y += 40;

    // Subtitle if any
    if (card.subtitle) {
      ctx.fillStyle = activeTheme.footerColor;
      ctx.font = '24px -apple-system, sans-serif';
      ctx.fillText(card.subtitle, 60, y);
      y += 50;
    }

    // Divider line
    ctx.strokeStyle = activeTheme.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(160, y);
    ctx.stroke();
    y += 50;

    // Quote box if any
    if (card.quote) {
      ctx.fillStyle = activeTheme.tagBg;
      ctx.beginPath();
      ctx.roundRect(60, y, 780, 160, 16);
      ctx.fill();
      ctx.fillStyle = activeTheme.accentColor;
      ctx.font = 'italic 26px -apple-system, serif';
      // simple 2 lines wrap
      ctx.fillText(card.quote.slice(0, 24), 90, y + 60);
      ctx.fillText(card.quote.slice(24, 48), 90, y + 110);
      y += 200;
    }

    // Bullet points
    if (card.points && card.points.length > 0) {
      card.points.forEach((pt, pIdx) => {
        // Point box
        ctx.fillStyle = activeTheme.id.includes('dark') || activeTheme.id.includes('gold') ? 'rgba(255,255,255,0.04)' : '#ffffff';
        ctx.beginPath();
        ctx.roundRect(60, y, 780, 110, 16);
        ctx.fill();
        ctx.strokeStyle = activeTheme.id.includes('dark') || activeTheme.id.includes('gold') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Accent indicator dot
        ctx.fillStyle = activeTheme.accentColor;
        ctx.beginPath();
        ctx.arc(95, y + 55, 8, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = activeTheme.textColor;
        ctx.font = '26px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        ctx.fillText(pt.slice(0, 25), 125, y + 62);

        y += 130;
      });
    }

    // Bottom Footer Bar
    ctx.fillStyle = activeTheme.footerColor;
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText(`@${card.author || author || '创作者'}`, 60, 1120);

    ctx.textAlign = 'right';
    ctx.fillText('向右滑动查看更多 ➔', 840, 1120);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  };

  // Download single card
  const handleDownloadSingle = () => {
    const dataUrl = renderCardToCanvas(activeCard, activeIndex);
    const link = document.createElement('a');
    link.download = `wechat-note-slide-${activeIndex + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Copy single card to clipboard
  const handleCopySingle = async () => {
    try {
      const dataUrl = renderCardToCanvas(activeCard, activeIndex);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedIndex(activeIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback
    }
  };

  // Batch download all cards
  const handleDownloadAll = () => {
    setIsExporting(true);
    cards.forEach((card, i) => {
      setTimeout(() => {
        const dataUrl = renderCardToCanvas(card, i);
        const link = document.createElement('a');
        link.download = `wechat-note-slide-0${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        if (i === cards.length - 1) {
          setIsExporting(false);
        }
      }, i * 300);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信「小绿书模式」专属九宫格图文卡片工坊</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                  3:4 黄金比例 (1080×1440) · 微信官方图片消息高推荐权重
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                文章自动智能分片为 1~9 张精致轮播卡片，支持高清导出、高频金句荧光笔与一键直推微信小绿书草稿
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

        {/* Toolbar: Themes & View Toggle */}
        <div className="px-5 py-2.5 bg-neutral-950/50 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
          {/* Theme Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
              <Palette className="w-3.5 h-3.5" />
              <span>卡片主题:</span>
            </span>
            {XIAOLVSHU_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  themeId === t.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30"
                  style={{ backgroundColor: t.accentColor }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* Mode Switch: Single Carousel vs Grid */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
              className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{viewMode === 'single' ? '切换九宫格总览' : '切换单卡精修'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFromArticle}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-neutral-200 border border-neutral-700 text-xs transition flex items-center gap-1"
              title="根据当前文章重新自动智能切片"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重新切片</span>
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: Card Display Area (7 cols) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto bg-neutral-950/30 flex flex-col items-center justify-center border-r border-neutral-800 relative">
            {viewMode === 'single' ? (
              <div className="w-full flex flex-col items-center">
                {/* 3:4 Mobile Card Mockup */}
                <div
                  className="w-[330px] sm:w-[360px] h-[480px] sm:h-[510px] rounded-[24px] p-6 shadow-2xl relative flex flex-col justify-between border transition duration-300 select-none overflow-hidden"
                  style={{
                    background: activeTheme.bgGradient,
                    borderColor: activeTheme.id.includes('dark') ? '#334155' : '#cbd5e1',
                  }}
                >
                  {/* Top Bar: Slide Index & Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-sm font-bold tracking-wider"
                      style={{ color: activeTheme.accentColor }}
                    >
                      0{activeIndex + 1} / 0{cards.length}
                    </span>

                    {activeCard.tag && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: activeTheme.tagBg,
                          color: activeTheme.tagText,
                        }}
                      >
                        {activeCard.tag}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="space-y-3.5 my-auto">
                    <h3
                      className="text-xl sm:text-2xl font-black leading-tight tracking-tight line-clamp-3"
                      style={{ color: activeTheme.titleColor }}
                    >
                      {activeCard.title}
                    </h3>

                    {activeCard.subtitle && (
                      <p
                        className="text-xs sm:text-sm line-clamp-2"
                        style={{ color: activeTheme.footerColor }}
                      >
                        {activeCard.subtitle}
                      </p>
                    )}

                    {/* Accent divider line */}
                    <div
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: activeTheme.accentColor }}
                    />

                    {/* Quote box if any */}
                    {activeCard.quote && (
                      <div
                        className="p-3 rounded-xl border text-xs sm:text-sm italic font-medium leading-relaxed"
                        style={{
                          backgroundColor: activeTheme.tagBg,
                          color: activeTheme.tagText,
                          borderColor: activeTheme.accentColor,
                        }}
                      >
                        {activeCard.quote}
                      </div>
                    )}

                    {/* Bullet Points */}
                    {activeCard.points && activeCard.points.length > 0 && (
                      <div className="space-y-2">
                        {activeCard.points.map((pt, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-2xs"
                            style={{
                              backgroundColor:
                                activeTheme.id.includes('dark') || activeTheme.id.includes('gold')
                                  ? 'rgba(255,255,255,0.04)'
                                  : '#ffffff',
                              color: activeTheme.textColor,
                              borderColor:
                                activeTheme.id.includes('dark') || activeTheme.id.includes('gold')
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(0,0,0,0.06)',
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: activeTheme.accentColor }}
                            />
                            <span className="line-clamp-2">{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer */}
                  <div
                    className="flex items-center justify-between text-xs pt-3 border-t"
                    style={{
                      borderColor:
                        activeTheme.id.includes('dark') || activeTheme.id.includes('gold')
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.08)',
                      color: activeTheme.footerColor,
                    }}
                  >
                    <span>@{activeCard.author || author || '创作者'}</span>
                    <span className="font-medium text-[11px]">向右滑动查看更多 ➔</span>
                  </div>
                </div>

                {/* Slider Controls */}
                <div className="flex items-center space-x-4 mt-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition"
                    title="上一张"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {cards.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          activeIndex === i
                            ? 'w-6 bg-emerald-500'
                            : 'w-2 bg-neutral-700 hover:bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition"
                    title="下一张"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Grid Overview (九宫格视图) */
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[620px] p-2">
                {cards.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveIndex(i);
                      setViewMode('single');
                    }}
                    className={`aspect-[3/4] p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between shadow-sm relative ${
                      activeIndex === i
                        ? 'ring-2 ring-emerald-500 border-emerald-400'
                        : 'border-neutral-750 hover:border-neutral-600'
                    }`}
                    style={{ background: activeTheme.bgGradient }}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: activeTheme.accentColor }} className="font-bold">
                        0{i + 1}
                      </span>
                      {c.tag && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px]"
                          style={{ backgroundColor: activeTheme.tagBg, color: activeTheme.tagText }}
                        >
                          {c.tag}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs font-bold line-clamp-2 my-auto"
                      style={{ color: activeTheme.titleColor }}
                    >
                      {c.title}
                    </div>
                    <div
                      className="text-[9px] truncate"
                      style={{ color: activeTheme.footerColor }}
                    >
                      @{c.author || author || '创作者'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Card Detail Editor & Export (5 cols) */}
          <div className="lg:col-span-5 p-5 overflow-y-auto bg-neutral-950/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>编辑第 0{activeIndex + 1} 张卡片文案</span>
                </span>
                <span className="text-[11px] text-neutral-400">
                  共 {cards.length} 张卡片
                </span>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400">卡片主标题：</label>
                <input
                  type="text"
                  value={activeCard.title}
                  onChange={(e) => handleUpdateCurrentCard('title', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Tag & Subtitle */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">分类标签：</label>
                  <input
                    type="text"
                    value={activeCard.tag || ''}
                    onChange={(e) => handleUpdateCurrentCard('tag', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">作者水印：</label>
                  <input
                    type="text"
                    value={activeCard.author || author || ''}
                    onChange={(e) => handleUpdateCurrentCard('author', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Points Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-400">
                    核心观点要点 ({activeCard.points?.length || 0})：
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加要点</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {(activeCard.points || []).map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => handleUpdatePoint(pIdx, e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(pIdx)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400 transition"
                        title="删除该要点"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote Editor if any */}
              {activeCard.type === 'ending' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">文末金句总结：</label>
                  <textarea
                    rows={2}
                    value={activeCard.quote || ''}
                    onChange={(e) => handleUpdateCurrentCard('quote', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Export & Actions Footer */}
            <div className="space-y-2.5 pt-5 border-t border-neutral-800 mt-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>下载当前卡片 PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySingle}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {copiedIndex === activeIndex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">已复制图片</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制到剪贴板</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? '正在批量打包渲染中...' : `一键批量下载全部 ${cards.length} 张高清切片图集`}</span>
              </button>

              {onPublishDraft && (
                <button
                  type="button"
                  onClick={() => onPublishDraft(true)}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>直推微信草稿箱 (小绿书图片消息模式)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
