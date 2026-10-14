import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Palette,
  Download,
  Check,
  Copy,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Grid,
  Layers,
  Type,
  Maximize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Upload,
} from 'lucide-react';

interface CoverDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  digest: string;
  onApplyCover: (coverDataUrl: string) => void;
}

type AspectRatio = '2.35:1' | '1:1' | '3:4';

interface CoverTemplate {
  id: string;
  name: string;
  category: string;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  hasGridPattern?: boolean;
}

const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: 'cyber-tech',
    name: '极客深空',
    category: '科技代码',
    bgColor: '#0f172a',
    bgGradient: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)',
    textColor: '#f8fafc',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
    hasGridPattern: true,
  },
  {
    id: 'warm-sunset',
    name: '暖阳落霞',
    category: '热点资讯',
    bgColor: '#431407',
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #b45309 50%, #ea580c 100%)',
    textColor: '#ffffff',
    accentColor: '#fde047',
    badgeBg: 'rgba(253, 224, 71, 0.25)',
    badgeText: '#fef08a',
  },
  {
    id: 'emerald-wechat',
    name: '微信竹绿',
    category: '官方原味',
    bgColor: '#064e3b',
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
    textColor: '#ffffff',
    accentColor: '#6ee7b7',
    badgeBg: 'rgba(110, 231, 183, 0.2)',
    badgeText: '#6ee7b7',
  },
  {
    id: 'aurora-night',
    name: '极光幻夜',
    category: '前沿设计',
    bgColor: '#042f2e',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #065f46 100%)',
    textColor: '#ffffff',
    accentColor: '#2dd4bf',
    badgeBg: 'rgba(45, 212, 191, 0.2)',
    badgeText: '#2dd4bf',
    hasGridPattern: true,
  },
  {
    id: 'editorial-paper',
    name: '素雅人文',
    category: '深度长文',
    bgColor: '#faf9f6',
    bgGradient: 'linear-gradient(135deg, #faf9f6 0%, #f5f5f4 100%)',
    textColor: '#1c1917',
    accentColor: '#b91c1c',
    badgeBg: 'rgba(185, 28, 28, 0.1)',
    badgeText: '#b91c1c',
  },
  {
    id: 'crimson-bold',
    name: '烈焰大牌',
    category: '商业洞察',
    bgColor: '#450a0a',
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #881337 50%, #be123c 100%)',
    textColor: '#ffffff',
    accentColor: '#fecdd3',
    badgeBg: 'rgba(254, 205, 211, 0.25)',
    badgeText: '#fff1f2',
  },
  {
    id: 'minimal-notion',
    name: '极简灰卡',
    category: '效率知识',
    bgColor: '#18181b',
    bgGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    textColor: '#f4f4f5',
    accentColor: '#a1a1aa',
    badgeBg: 'rgba(161, 161, 170, 0.2)',
    badgeText: '#e4e4e7',
    hasGridPattern: true,
  },
  {
    id: 'dark-gold',
    name: '黑金奢雅',
    category: '精英专栏',
    bgColor: '#1c1917',
    bgGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
    textColor: '#fef08a',
    accentColor: '#eab308',
    badgeBg: 'rgba(234, 179, 8, 0.2)',
    badgeText: '#fde047',
  },
];

export const CoverDesignerModal: React.FC<CoverDesignerModalProps> = ({
  isOpen,
  onClose,
  title: initialTitle,
  author: initialAuthor,
  digest: initialDigest,
  onApplyCover,
}) => {
  // Config state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('2.35:1');
  const [selectedTemplate, setSelectedTemplate] = useState<CoverTemplate>(COVER_TEMPLATES[0]);
  const [title, setTitle] = useState(initialTitle || '微信公众号自动化发布实战指南');
  const [subtitle, setSubtitle] = useState(initialDigest || '从纯文本 Markdown 到全网矩阵分发');
  const [badgeText, setBadgeText] = useState('深度实战 · 推荐');
  const [author, setAuthor] = useState(initialAuthor || '科技探索者');
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [titleFontSize, setTitleFontSize] = useState(38);
  const [textAlign, setTextAlign] = useState<'left' | 'center'>('left');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  const [hasApplied, setHasApplied] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with incoming props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle);
      if (initialAuthor) setAuthor(initialAuthor);
      if (initialDigest) setSubtitle(initialDigest);
    }
  }, [isOpen, initialTitle, initialAuthor, initialDigest]);

  // Dimension setup
  const dimensions = {
    '2.35:1': { width: 940, height: 400 }, // Official 2.35:1 WeChat standard canvas
    '1:1': { width: 600, height: 600 },
    '3:4': { width: 600, height: 800 },
  }[aspectRatio];

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Draw background
    if (customBgImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        // Add dark gradient overlay to ensure text contrast
        const overlay = ctx.createLinearGradient(0, 0, width, height);
        overlay.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
        drawForegroundContent(ctx, width, height);
      };
      img.src = customBgImage;
      return;
    }

    // Default gradient
    const tpl = selectedTemplate;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (tpl.id === 'cyber-tech') {
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(0.5, '#1e1b4b');
      gradient.addColorStop(1, '#0f172a');
    } else if (tpl.id === 'warm-sunset') {
      gradient.addColorStop(0, '#7c2d12');
      gradient.addColorStop(0.6, '#b45309');
      gradient.addColorStop(1, '#ea580c');
    } else if (tpl.id === 'emerald-wechat') {
      gradient.addColorStop(0, '#064e3b');
      gradient.addColorStop(0.5, '#047857');
      gradient.addColorStop(1, '#059669');
    } else if (tpl.id === 'aurora-night') {
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#134e4a');
      gradient.addColorStop(1, '#065f46');
    } else if (tpl.id === 'editorial-paper') {
      gradient.addColorStop(0, '#faf9f6');
      gradient.addColorStop(1, '#f5f5f4');
    } else if (tpl.id === 'crimson-bold') {
      gradient.addColorStop(0, '#450a0a');
      gradient.addColorStop(0.5, '#881337');
      gradient.addColorStop(1, '#be123c');
    } else if (tpl.id === 'dark-gold') {
      gradient.addColorStop(0, '#1c1917');
      gradient.addColorStop(0.5, '#292524');
      gradient.addColorStop(1, '#44403c');
    } else {
      gradient.addColorStop(0, '#18181b');
      gradient.addColorStop(1, '#27272a');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Optional Grid Texture
    if (tpl.hasGridPattern) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    drawForegroundContent(ctx, width, height);
  }, [dimensions, selectedTemplate, customBgImage, title, subtitle, badgeText, author, showSubtitle, showBadge, titleFontSize, textAlign]);

  const drawForegroundContent = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const tpl = selectedTemplate;
    const paddingX = width * 0.08;
    const paddingY = height * 0.12;

    let currentY = paddingY;

    // 1. Draw Badge
    if (showBadge && badgeText.trim()) {
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 20;
      const badgeHeight = 26;

      const badgeX = textAlign === 'center' ? width / 2 - badgeWidth / 2 : paddingX;

      ctx.fillStyle = tpl.badgeBg;
      ctx.beginPath();
      ctx.roundRect(badgeX, currentY, badgeWidth, badgeHeight, 6);
      ctx.fill();

      ctx.fillStyle = tpl.badgeText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgeWidth / 2, currentY + badgeHeight / 2);

      currentY += badgeHeight + 16;
    } else {
      currentY += 10;
    }

    // 2. Draw Title (Multi-line word wrap)
    ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = tpl.textColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top';

    const maxTitleWidth = width - paddingX * 2;
    const words = title.split('');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        lines.push(line);
        line = words[n];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Limit to max 3 lines
    const displayLines = lines.slice(0, 3);
    const lineHeight = titleFontSize * 1.3;

    displayLines.forEach((l) => {
      const drawX = textAlign === 'center' ? width / 2 : paddingX;
      ctx.fillText(l, drawX, currentY);
      currentY += lineHeight;
    });

    // 3. Draw Subtitle
    if (showSubtitle && subtitle.trim()) {
      currentY += 10;
      ctx.font = 'normal 15px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.fillStyle = tpl.textColor === '#ffffff' || tpl.textColor === '#f8fafc' ? 'rgba(255, 255, 255, 0.75)' : '#57534e';
      ctx.textAlign = textAlign;

      const subWords = subtitle.split('');
      let subLine = '';
      const subLines: string[] = [];
      for (let n = 0; n < subWords.length; n++) {
        const testLine = subLine + subWords[n];
        if (ctx.measureText(testLine).width > maxTitleWidth && n > 0) {
          subLines.push(subLine);
          subLine = subWords[n];
        } else {
          subLine = testLine;
        }
      }
      subLines.push(subLine);

      // Max 2 sublines
      subLines.slice(0, 2).forEach((sl) => {
        const drawX = textAlign === 'center' ? width / 2 : paddingX;
        ctx.fillText(sl, drawX, currentY);
        currentY += 22;
      });
    }

    // 4. Draw Footer (Author & Decorative dot)
    if (author.trim()) {
      const footerY = height - paddingY - 8;
      ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.fillStyle = tpl.accentColor;
      ctx.textAlign = textAlign;
      const footerX = textAlign === 'center' ? width / 2 : paddingX;
      ctx.fillText(`✍️ ${author} · 专栏首发`, footerX, footerY);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Apply to article cover
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onApplyCover(dataUrl);
    setHasApplied(true);
    setTimeout(() => {
      setHasApplied(false);
      onClose();
    }, 1200);
  };

  // Download image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `wechat-cover-${aspectRatio.replace(':', 'x')}-${Date.now()}.png`;
    a.click();
  };

  // Copy image to clipboard
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      });
    } catch {
      // Fallback
    }
  };

  // Handle custom upload background
  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomBgImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信封面图设计工坊</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
                  微信 2.35:1 官方标准
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                智能自适应大封面、次条小图与小绿书贴图，提供微信会话安全区防裁切指引
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {/* Left Column: Parameter Controls (5 cols) */}
          <div className="lg:col-span-5 p-4 overflow-y-auto space-y-4 bg-neutral-950/40">
            {/* Aspect Ratio Switcher */}
            <div>
              <label className="text-xs font-semibold text-neutral-200 block mb-1.5">
                封面比例与类型
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('2.35:1')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    aspectRatio === '2.35:1'
                      ? 'bg-neutral-800 border-amber-500 text-neutral-100 ring-1 ring-amber-500/30'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-bold text-xs font-mono">2.35 : 1</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">头条大封面 (900×383)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    aspectRatio === '1:1'
                      ? 'bg-neutral-800 border-amber-500 text-neutral-100 ring-1 ring-amber-500/30'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-bold text-xs font-mono">1 : 1</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">次条方形小图</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('3:4')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    aspectRatio === '3:4'
                      ? 'bg-neutral-800 border-amber-500 text-neutral-100 ring-1 ring-amber-500/30'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-bold text-xs font-mono">3 : 4</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">小绿书/小红书</span>
                </button>
              </div>
            </div>

            {/* Template Presets Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-200">
                  视觉设计主题模板
                </label>
                {customBgImage && (
                  <button
                    type="button"
                    onClick={() => setCustomBgImage(null)}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    恢复预设底色
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {COVER_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate.id === tpl.id && !customBgImage;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setCustomBgImage(null);
                      }}
                      className={`h-12 rounded-lg border p-1 flex flex-col justify-between transition relative overflow-hidden ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                      style={{ background: tpl.bgGradient }}
                    >
                      <span className="text-[10px] font-bold px-1 rounded bg-black/40 text-white truncate max-w-full">
                        {tpl.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-amber-400 absolute right-1 bottom-1 drop-shadow" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upload Custom Background */}
              <div className="mt-2">
                <label className="w-full py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-neutral-400" />
                  <span>上传自定义背景原图</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBg}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Text Inputs */}
            <div className="space-y-3 pt-1 border-t border-neutral-800/80">
              <div>
                <label className="text-xs text-neutral-300 block mb-1">主标题内容</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  placeholder="文章主标题"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-300">副标题 / 导语</label>
                  <label className="text-[11px] text-neutral-400 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSubtitle}
                      onChange={(e) => setShowSubtitle(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>显示副标题</span>
                  </label>
                </div>
                {showSubtitle && (
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                    placeholder="简明副标题或导语"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-300">标签徽标</label>
                    <label className="text-[11px] text-neutral-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBadge}
                        onChange={(e) => setShowBadge(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>显示</span>
                    </label>
                  </div>
                  {showBadge && (
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs text-neutral-300 block mb-1">作者署名</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100"
                  />
                </div>
              </div>

              {/* Fine-Tuning Controls */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">标题字号: {titleFontSize}px</span>
                  <input
                    type="range"
                    min="26"
                    max="52"
                    value={titleFontSize}
                    onChange={(e) => setTitleFontSize(Number(e.target.value))}
                    className="w-32 accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">对齐排版方式:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTextAlign('left')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                        textAlign === 'left'
                          ? 'bg-neutral-800 text-amber-300 border border-amber-800'
                          : 'text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      左对齐
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('center')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                        textAlign === 'center'
                          ? 'bg-neutral-800 text-amber-300 border border-amber-800'
                          : 'text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      居中对齐
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
                  <span className="text-neutral-400">微信会话安全区辅助线:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300">
                    <input
                      type="checkbox"
                      checked={showSafeZone}
                      onChange={(e) => setShowSafeZone(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>开启安全区</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Canvas Preview (7 cols) */}
          <div className="lg:col-span-7 p-5 bg-neutral-950 flex flex-col min-h-0 items-center justify-center relative">
            {/* Visual Canvas Container */}
            <div className="relative w-full max-w-lg shadow-2xl rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center bg-black/40">
              <canvas
                ref={canvasRef}
                className="w-full h-auto object-contain block"
              />

              {/* Safe Zone Grid Overlay */}
              {showSafeZone && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer border */}
                  <div className="w-[86%] h-[82%] border-2 border-emerald-400/70 border-dashed rounded-lg relative flex flex-col justify-between p-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono text-[9px] border border-emerald-800/80 self-start">
                      🛡️ 微信订阅号核心视觉安全区 (无裁切)
                    </span>

                    {/* Chat Share 1:1 Center Box */}
                    {aspectRatio === '2.35:1' && (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[42%] h-[90%] border border-amber-400/60 rounded flex items-end justify-center pb-1">
                        <span className="text-[8px] bg-amber-950/80 text-amber-300 px-1 rounded border border-amber-800">
                          微信聊天卡片 1:1 提取区
                        </span>
                      </div>
                    )}

                    <span className="text-[8px] text-emerald-400/80 self-end">
                      建议关键文字在此虚线框内
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Helper Specs */}
            <div className="mt-3 text-[11px] text-neutral-400 text-center space-y-0.5">
              <div>
                当前导出画布规格: <span className="font-mono text-neutral-200">{dimensions.width} × {dimensions.height} px</span> ({aspectRatio})
              </div>
              <p className="text-neutral-500 text-[10px]">
                符合微信公众平台官方素材库大图标准尺寸，无缝消除模糊与比例拉伸。
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{hasCopied ? '已复制封面图' : '复制图片'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>下载高清 PNG</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium transition"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="py-1.5 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
            >
              {hasApplied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{hasApplied ? '已成功应用封面' : '应用为当前文章封面'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
