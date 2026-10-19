import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sliders,
  Check,
  Eye,
  Code,
  Image as ImageIcon,
  Sparkles,
  Layout,
  Palette,
  RotateCcw,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { DetectedComponentBlock } from '../utils/cursorManager.ts';

interface ComponentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: DetectedComponentBlock | null;
  onUpdateBlock: (blockId: string, newInnerHtml: string, newName?: string) => void;
}

const PRESET_ACCENT_COLORS = [
  { name: '微信青绿', hex: '#07c160' },
  { name: '科技深蓝', hex: '#2563eb' },
  { name: '优雅丁香紫', hex: '#7c3aed' },
  { name: '暖阳明亮橙', hex: '#ea580c' },
  { name: '珊瑚胭脂红', hex: '#e11d48' },
  { name: '典雅墨灰黑', hex: '#374151' },
];

export const ComponentInspectorModal: React.FC<ComponentInspectorModalProps> = ({
  isOpen,
  onClose,
  block,
  onUpdateBlock,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'raw'>('form');

  // Form states
  const [componentName, setComponentName] = useState('');
  const [rawHtml, setRawHtml] = useState('');

  // Image-specific states
  const [imgSrc, setImgSrc] = useState('');
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [borderRadius, setBorderRadius] = useState<'0' | '8px' | '16px' | '9999px'>('8px');
  const [enableShadow, setEnableShadow] = useState(true);
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');
  const [maxWidthPercent, setMaxWidthPercent] = useState<number>(100);

  // Material / Text specific states
  const [contentTitle, setContentTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [contentFooter, setContentFooter] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [bgStyle, setBgStyle] = useState<'light' | 'soft' | 'pure-white'>('light');

  // Determine type
  const isImageBlock = block?.type === 'image' || (block?.innerHtml.includes('<img') && !block?.innerHtml.includes('<svg'));
  const isSvgBlock = block?.type === 'svg' || (block?.innerHtml.includes('<svg') ?? false);

  // Initialize values when block changes
  useEffect(() => {
    if (!block) return;
    setComponentName(block.name || '微信组件');
    setRawHtml(block.innerHtml);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${block.innerHtml}</div>`, 'text/html');

      // 1. If contains <img>
      const img = doc.querySelector('img');
      if (img) {
        setImgSrc(img.getAttribute('src') || '');
        setImgAlt(img.getAttribute('alt') || '');

        const style = img.getAttribute('style') || '';
        if (style.includes('border-radius: 16px')) setBorderRadius('16px');
        else if (style.includes('border-radius: 0')) setBorderRadius('0');
        else if (style.includes('border-radius: 9999px')) setBorderRadius('9999px');
        else setBorderRadius('8px');

        setEnableShadow(style.includes('box-shadow'));

        // Caption check
        const captionEl = doc.querySelector('div, p, figcaption');
        if (captionEl && captionEl !== img.parentElement) {
          setImgCaption(captionEl.textContent?.trim() || '');
        } else {
          setImgCaption('');
        }
      }

      // 2. Headings & Main Texts for materials
      const heading = doc.querySelector('h1, h2, h3, h4, strong, .title');
      const paragraphs = Array.from(doc.querySelectorAll('p, blockquote, div'));
      
      if (heading) {
        setContentTitle(heading.textContent?.trim() || '');
      }

      // Find largest paragraph for contentText
      let longestText = '';
      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || '';
        if (text.length > longestText.length && text !== heading?.textContent?.trim()) {
          longestText = text;
        }
      });
      setContentText(longestText || block.innerHtml.replace(/<[^>]+>/g, '').trim());

      // Find footer / author
      const footerEl = doc.querySelector('.author, .footer, small');
      if (footerEl) {
        setContentFooter(footerEl.textContent?.trim() || '');
      }

      // Detect color
      const colorMatch = block.innerHtml.match(/(?:color|background(?:-color)?|border(?:-color)?):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
      if (colorMatch && colorMatch[1]) {
        setAccentColor(colorMatch[1]);
      }
    } catch {
      // Fallback
    }
  }, [block]);

  // Dynamically compute preview HTML based on form states
  const generatedPreviewHtml = useMemo(() => {
    if (activeTab === 'raw') {
      return rawHtml;
    }

    if (!block) return '';

    // If Image block
    if (isImageBlock) {
      const shadowStyle = enableShadow ? 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);' : '';
      const captionHtml = imgCaption.trim()
        ? `<div style="text-align: ${textAlign}; font-size: 11.5px; color: #888888; margin-top: 8px; line-height: 1.4;">${imgCaption.trim()}</div>`
        : '';

      return `<section style="margin: 24px 0; text-align: ${textAlign};">
  <img src="${imgSrc || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&q=80'}" alt="${imgAlt || '配图'}" style="max-width: ${maxWidthPercent}%; height: auto; border-radius: ${borderRadius}; display: inline-block; ${shadowStyle} border: 1px solid rgba(0,0,0,0.05);" />
  ${captionHtml}
</section>`;
    }

    // If SVG / Interactive Block
    if (isSvgBlock) {
      return rawHtml;
    }

    // Material Block customization
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${block.innerHtml}</div>`, 'text/html');

      // Update heading text
      if (contentTitle.trim()) {
        const heading = doc.querySelector('h1, h2, h3, h4, strong, .title');
        if (heading) {
          heading.textContent = contentTitle.trim();
        }
      }

      // Update main text
      if (contentText.trim()) {
        const paragraphs = Array.from(doc.querySelectorAll('p, blockquote'));
        if (paragraphs.length > 0) {
          paragraphs[0].textContent = contentText.trim();
        }
      }

      // Update footer
      if (contentFooter.trim()) {
        const footer = doc.querySelector('.author, .footer, small');
        if (footer) {
          footer.textContent = contentFooter.trim();
        }
      }

      const res = doc.body.firstElementChild?.innerHTML || block.innerHtml;
      return res;
    } catch {
      return block.innerHtml;
    }
  }, [
    activeTab,
    rawHtml,
    block,
    isImageBlock,
    isSvgBlock,
    imgSrc,
    imgAlt,
    imgCaption,
    borderRadius,
    enableShadow,
    textAlign,
    maxWidthPercent,
    contentTitle,
    contentText,
    contentFooter,
  ]);

  const handleApplyUpdate = () => {
    if (!block) return;
    const finalHtml = activeTab === 'raw' ? rawHtml.trim() : generatedPreviewHtml.trim();
    onUpdateBlock(block.id, finalHtml, componentName.trim() || block.name);
    onClose();
  };

  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl text-white shadow-md ${
              isImageBlock
                ? 'bg-gradient-to-tr from-sky-500 to-blue-600'
                : isSvgBlock
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">组件表单修改器 (Inline Form Inspector)</h2>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-medium ${
                  isImageBlock
                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                    : isSvgBlock
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {isImageBlock ? '商用配图容器' : isSvgBlock ? '微信原生 SVG 动效' : '特色排版物料'}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  第 {block.lineStart} 行
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                直接在此修改文案、色调、圆角与图片，无需手动修改复杂 HTML 标签，自动无损更新至 Markdown。
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch */}
            <div className="flex items-center bg-neutral-800 p-0.5 rounded-lg border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>可视化表单</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  activeTab === 'raw'
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>原生 HTML</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split view (Form controls on left, WeChat simulated preview on right) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Form Controls */}
          <div className="w-full lg:w-1/2 p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-neutral-800 space-y-4 text-xs">
            {/* Component Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-neutral-400" />
                <span>组件语义标识名称：</span>
              </label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="为当前组件命名（在顶部组件栏中便于辨认）..."
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {activeTab === 'raw' ? (
              /* Raw HTML Code Tab */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <label className="text-[11px] font-semibold flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-amber-400" />
                    <span>原生 HTML / SVG 源码编辑：</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    支持即时响应渲染
                  </span>
                </div>
                <textarea
                  value={rawHtml}
                  onChange={(e) => setRawHtml(e.target.value)}
                  rows={14}
                  className="w-full bg-neutral-950 text-neutral-200 font-mono text-xs p-3.5 rounded-xl border border-neutral-750 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  placeholder="在此直接输入或微调 HTML 代码..."
                />
              </div>
            ) : isImageBlock ? (
              /* Image Component Form */
              <div className="space-y-4">
                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>图片网络直链 (URL)：</span>
                    <span className="text-[10px] text-neutral-500">支持 Unsplash / CDN 直链 / Base64</span>
                  </label>
                  <input
                    type="text"
                    value={imgSrc}
                    onChange={(e) => setImgSrc(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Alt & Caption */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      图片说明 / Alt 占位：
                    </label>
                    <input
                      type="text"
                      value={imgAlt}
                      onChange={(e) => setImgAlt(e.target.value)}
                      placeholder="图片主体描述..."
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      下方居中图注 (Caption)：
                    </label>
                    <input
                      type="text"
                      value={imgCaption}
                      onChange={(e) => setImgCaption(e.target.value)}
                      placeholder="如：图源 / 摄影师版权..."
                      className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Corner Radius & Shadow */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      容器圆角风格：
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: '0', label: '直角 0px' },
                        { id: '8px', label: '微圆角 8px' },
                        { id: '16px', label: '大圆角 16px' },
                        { id: '9999px', label: '全胶囊' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBorderRadius(item.id as any)}
                          className={`py-1.5 px-2 rounded-lg border text-center text-xs transition ${
                            borderRadius === item.id
                              ? 'bg-blue-950 border-blue-600 text-blue-200 font-bold'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      立体质感阴影：
                    </label>
                    <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableShadow}
                        onChange={(e) => setEnableShadow(e.target.checked)}
                        className="rounded bg-neutral-900 border-neutral-700 text-blue-600 cursor-pointer"
                      />
                      <span className="text-xs text-neutral-200">启用柔和层次微阴影</span>
                    </label>
                  </div>
                </div>

                {/* Alignment & Max Width */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      对齐方式：
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'left', icon: AlignLeft, label: '居左' },
                        { id: 'center', icon: AlignCenter, label: '居中' },
                        { id: 'right', icon: AlignRight, label: '居右' },
                      ].map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => setTextAlign(al.id as any)}
                          className={`py-1.5 rounded-lg border flex items-center justify-center gap-1 text-xs transition ${
                            textAlign === al.id
                              ? 'bg-blue-950 border-blue-600 text-blue-200 font-bold'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <al.icon className="w-3 h-3" />
                          <span>{al.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      宽度缩放比 ({maxWidthPercent}%)：
                    </label>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      step={5}
                      value={maxWidthPercent}
                      onChange={(e) => setMaxWidthPercent(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : isSvgBlock ? (
              /* SVG Block Controls */
              <div className="space-y-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>微信原生 SVG 动效沙盒已就绪</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    当前动效包含手势滑动、渐进展开或点击触发动画。您可以在右侧窗口直接点击并测试交互效果，若需调整特定文字或数值，请切换至「原生 HTML」选项卡精准微调。
                  </p>
                </div>
              </div>
            ) : (
              /* Material Component Form */
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    物料核心标题 / 提示标签：
                  </label>
                  <input
                    type="text"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="输入金句标题、步骤序号或气泡名字..."
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Main Body */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    正文文案 / 引用名言内容：
                  </label>
                  <textarea
                    rows={4}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="输入展示的正文段落..."
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Footer / Author */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    底部作者 / 角色出处：
                  </label>
                  <input
                    type="text"
                    value={contentFooter}
                    onChange={(e) => setContentFooter(e.target.value)}
                    placeholder="如：—— 稻盛和夫 《干法》..."
                    className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live WeChat Container Simulation */}
          <div className="w-full lg:w-1/2 p-5 bg-neutral-950 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
            <div className="w-full max-w-sm flex items-center justify-between pb-2 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>微信公众号仿真渲染画布</span>
              </span>
              <span className="font-mono text-neutral-500">宽度: 375px</span>
            </div>

            {/* Mobile Canvas Box */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-neutral-750/50 text-neutral-900 max-h-[55vh] overflow-y-auto">
              <div
                className="wechat-preview-body"
                dangerouslySetInnerHTML={{ __html: generatedPreviewHtml }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 mt-2 text-center">
              实时同步渲染，更新后自动无损替换原 Markdown 中的隔离块
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400">
            提示：更新仅作用于当前组件块，前后段落与 Front Matter 绝不受影响
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-750 text-xs font-medium transition"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleApplyUpdate}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>保存并无损更新到正文</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
