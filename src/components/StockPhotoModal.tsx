import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Sliders,
  Filter,
  Sparkles,
  Download,
  Info,
  Maximize2,
} from 'lucide-react';
import { STOCK_PHOTOS, StockPhoto } from '../data/stockPhotos.ts';
import { wrapWechatComponent } from '../utils/cursorManager.ts';

interface StockPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMarkdown: (text: string) => void;
  onSetCover: (imageUrl: string) => void;
}

export const StockPhotoModal: React.FC<StockPhotoModalProps> = ({
  isOpen,
  onClose,
  onInsertMarkdown,
  onSetCover,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<StockPhoto>(STOCK_PHOTOS[0]);
  const [borderRadius, setBorderRadius] = useState<'none' | 'small' | 'large'>('small');
  const [enableShadow, setEnableShadow] = useState(true);
  const [captionText, setCaptionText] = useState('图源：Unsplash 免费商用授权');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const filteredPhotos = useMemo(() => {
    return STOCK_PHOTOS.filter((photo) => {
      // Category filter
      if (selectedCategory !== 'all' && photo.category !== selectedCategory) {
        return false;
      }
      // Ratio filter
      if (selectedRatio !== 'all' && photo.ratio !== selectedRatio) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = photo.title.toLowerCase().includes(q);
        const matchesAuthor = photo.author.toLowerCase().includes(q);
        const matchesKeywords = photo.keywords.some((k) => k.toLowerCase().includes(q));
        return matchesTitle || matchesAuthor || matchesKeywords;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedRatio]);

  // Generate WeChat compliant Inline HTML for the photo
  const generatedWeChatHtml = useMemo(() => {
    const radiusPx = borderRadius === 'large' ? '16px' : borderRadius === 'small' ? '8px' : '0';
    const shadowStyle = enableShadow ? 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);' : '';
    const captionHtml = captionText.trim()
      ? `<div style="text-align: center; font-size: 11.5px; color: #888888; margin-top: 8px; line-height: 1.4;">${captionText.trim()}</div>`
      : '';

    return `<section style="margin: 24px 0; text-align: center;">
  <img src="${activePhoto.url}" alt="${activePhoto.title}" style="max-width: 100%; height: auto; border-radius: ${radiusPx}; display: inline-block; ${shadowStyle} border: 1px solid rgba(0,0,0,0.05);" />
  ${captionHtml}
</section>`;
  }, [activePhoto, borderRadius, enableShadow, captionText]);

  const handleInsertWeChatHtml = () => {
    const wrapped = wrapWechatComponent(generatedWeChatHtml, {
      name: activePhoto.title ? `配图·${activePhoto.title}` : '免版权商用配图',
      type: 'image',
    });
    onInsertMarkdown(wrapped);
    onClose();
  };

  const handleInsertMarkdown = () => {
    const captionPart = captionText.trim() ? `\n*${captionText.trim()}*` : '';
    const md = `![${activePhoto.title}](${activePhoto.url})${captionPart}\n\n`;
    onInsertMarkdown(md);
    onClose();
  };

  const handleApplyCover = () => {
    onSetCover(activePhoto.url);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activePhoto.url);
    setCopiedUrl(activePhoto.id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600 text-white shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">免版权高清商用图库与智能配图流水线</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                  Unsplash 商业免版权授权 · 零侵权风险
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                精选优质自媒体配图，支持按比例快速检索、圆角/阴影/图注美化容器与一键设为微信封面
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 bg-neutral-950/50 border-b border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索场景关键词（如：AI、代码、会议、极简、咖啡、星空、商务、城市）..."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Ratio Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>比例:</span>
            </span>
            {[
              { id: 'all', label: '全部' },
              { id: '16:9', label: '16:9 宽屏' },
              { id: '2.35:1', label: '2.35:1 头条封面' },
              { id: '1:1', label: '1:1 方形' },
              { id: '3:4', label: '3:4 小绿书竖图' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRatio(r.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  selectedRatio === r.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-5 py-2 border-b border-neutral-800 bg-neutral-900 flex items-center gap-1.5 overflow-x-auto text-xs flex-shrink-0">
          {[
            { id: 'all', label: '全部精选' },
            { id: 'tech', label: '科技互联网' },
            { id: 'business', label: '职场商务' },
            { id: 'minimal', label: '极简生活' },
            { id: 'nature', label: '自然风景' },
            { id: 'city', label: '城市建筑' },
            { id: 'abstract', label: '艺术抽象' },
            { id: 'team', label: '团队协作' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Photo Gallery Grid (7.5 cols) */}
          <div className="lg:col-span-8 p-4 overflow-y-auto bg-neutral-950/20">
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
                <ImageIcon className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">未找到符合条件的配图，请尝试更换关键词或筛选条件</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredPhotos.map((photo) => {
                  const isSelected = photo.id === activePhoto.id;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setActivePhoto(photo)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition flex flex-col justify-between bg-neutral-850 ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                          : 'border-neutral-750 hover:border-neutral-600 hover:shadow-md'
                      }`}
                    >
                      {/* Image Preview Container */}
                      <div className="aspect-video w-full overflow-hidden bg-neutral-900 relative">
                        <img
                          src={photo.previewUrl}
                          alt={photo.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] bg-black/70 backdrop-blur-sm text-neutral-200 font-mono">
                          {photo.ratioName}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Info Footer */}
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-neutral-200 line-clamp-1">
                          {photo.title}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-400">
                          <span>摄影师: {photo.author}</span>
                          <span className="text-blue-400 hover:underline flex items-center gap-0.5">
                            Unsplash
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Inspector & Decorator Panel (4.5 cols) */}
          <div className="lg:col-span-4 p-5 overflow-y-auto bg-neutral-950/60 border-l border-neutral-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 border-b border-neutral-800 pb-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>智能排版装饰与容器定制</span>
              </div>

              {/* Active Image Preview */}
              <div className="rounded-xl overflow-hidden border border-neutral-750 bg-neutral-900 shadow-md">
                <img
                  src={activePhoto.previewUrl}
                  alt={activePhoto.title}
                  className="w-full max-h-[160px] object-cover"
                />
                <div className="p-2.5 bg-neutral-850 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-neutral-200">{activePhoto.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {activePhoto.ratioName} · {activePhoto.categoryName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition"
                    title="复制高清图片 CDN 直链"
                  >
                    {copiedUrl === activePhoto.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Style Controls */}
              <div className="space-y-3">
                {/* Border Radius */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">圆角弧度：</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: '无圆角 (0px)' },
                      { id: 'small', label: '适中 (8px)' },
                      { id: 'large', label: '大圆角 (16px)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBorderRadius(item.id as any)}
                        className={`py-1 px-2 rounded-lg text-xs font-medium border transition ${
                          borderRadius === item.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-750 hover:text-neutral-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soft Shadow */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-neutral-300">启用柔和立体微阴影</span>
                  <input
                    type="checkbox"
                    checked={enableShadow}
                    onChange={(e) => setEnableShadow(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Caption Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-400">
                    智能居中图注 (Caption)：
                  </label>
                  <input
                    type="text"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="输入图注说明（留空则不显示）..."
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Insertion Action Buttons */}
            <div className="space-y-2 pt-5 border-t border-neutral-800 mt-5">
              <button
                type="button"
                onClick={handleInsertWeChatHtml}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>插入微信美化排版容器 (推荐)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApplyCover}
                  className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition flex items-center justify-center gap-1"
                  title="将当前选中的高清配图直接设置为文章封面"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>设为文章封面</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertMarkdown}
                  className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-750 text-xs font-medium transition flex items-center justify-center gap-1"
                  title="插入标准简洁的 Markdown 图片语法"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>插入 Markdown</span>
                </button>
              </div>

              <div className="text-[11px] text-neutral-400 text-center pt-1">
                已带 Unsplash 免费商用署名规范，商业发布安全无忧
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
