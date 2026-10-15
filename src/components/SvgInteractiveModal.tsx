import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Disc,
  MessageSquare,
  Columns,
  CheckSquare,
  Eye,
  Copy,
  Check,
  Plus,
  Sliders,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  SVG_INTERACTIVE_TEMPLATES,
  SvgInteractiveTemplate,
} from '../markdown/svgInteractiveTemplates.ts';

interface SvgInteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertComponent: (htmlContent: string, componentName: string) => void;
}

export const SvgInteractiveModal: React.FC<SvgInteractiveModalProps> = ({
  isOpen,
  onClose,
  onInsertComponent,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('svg-click-reveal');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [config, setConfig] = useState<Record<string, any>>(() => {
    return { ...SVG_INTERACTIVE_TEMPLATES[0].defaultConfig };
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    return SVG_INTERACTIVE_TEMPLATES.find((t) => t.id === selectedTemplateId) || SVG_INTERACTIVE_TEMPLATES[0];
  }, [selectedTemplateId]);

  // When switching template, load its default config
  const handleSelectTemplate = (template: SvgInteractiveTemplate) => {
    setSelectedTemplateId(template.id);
    setConfig({ ...template.defaultConfig });
  };

  const currentGeneratedHtml = useMemo(() => {
    return selectedTemplate.renderHtml(config);
  }, [selectedTemplate, config]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return SVG_INTERACTIVE_TEMPLATES;
    return SVG_INTERACTIVE_TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentGeneratedHtml);
    setCopiedId(selectedTemplate.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = () => {
    onInsertComponent(currentGeneratedHtml, selectedTemplate.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信原生 SVG 交互黑科技排版工坊</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                  100% 微信富文本原生兼容 · 无需外部 JS
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                利用微信原生支持的 SVG 动画、交互折叠与手势滑动容器，让文章具备媲美大厂长文的生动触感
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

        {/* Category Filter Pills */}
        <div className="px-5 py-2.5 bg-neutral-950/50 border-b border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-xs flex-shrink-0">
          {[
            { id: 'all', label: '全部组件', icon: Layers },
            { id: 'reveal', label: '点击展开揭秘', icon: Eye },
            { id: 'gallery', label: '左右横滑图集', icon: Smartphone },
            { id: 'vinyl', label: '黑胶唱片旋转', icon: Disc },
            { id: 'danmaku', label: '全景弹幕滚动', icon: MessageSquare },
            { id: 'flip', label: '正反对照对比', icon: Columns },
            { id: 'poll', label: '文末互动表决', icon: CheckSquare },
            { id: 'badge', label: '呼吸闪烁金句', icon: Sparkles },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Column 1: Component Cards List (4 cols) */}
          <div className="lg:col-span-4 p-4 border-r border-neutral-800 overflow-y-auto space-y-2.5 bg-neutral-950/30">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1">
              选择交互动效模板 ({filteredTemplates.length})
            </div>

            {filteredTemplates.map((item) => {
              const isSelected = item.id === selectedTemplateId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectTemplate(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left relative ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-neutral-850 border-neutral-750 hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-neutral-200">
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-emerald-400 border border-neutral-700">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Column 2: Live Phone Simulation Preview (4.5 cols) */}
          <div className="lg:col-span-5 p-5 border-r border-neutral-800 overflow-y-auto flex flex-col items-center bg-neutral-900/50">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1 font-medium text-neutral-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>微信公众号端真实交互预览 (支持点击/手势)</span>
              </span>
              <span className="text-[11px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 border border-neutral-700">
                可直接在画面中操作
              </span>
            </div>

            {/* Mobile Device Frame Mockup */}
            <div className="w-full max-w-[390px] bg-white text-neutral-900 rounded-[28px] border-4 border-neutral-750 shadow-2xl p-4 min-h-[480px] overflow-hidden flex flex-col justify-between">
              {/* Fake WeChat Article Header */}
              <div className="border-b border-neutral-100 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">示例推文阅读效果</div>
                  <div className="text-[10px] text-neutral-400">创作者专栏 · 刚刚发布</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              {/* Rendered HTML inside preview */}
              <div
                className="flex-1 py-2 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: currentGeneratedHtml }}
              />

              {/* Fake WeChat Bottom Interaction Bar */}
              <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between text-[11px] text-neutral-400">
                <span>阅读 10万+</span>
                <div className="flex items-center space-x-3">
                  <span>👍 赞 3.2k</span>
                  <span>✨ 在看 1.8k</span>
                  <span>💬 留言</span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-neutral-400 text-center flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>说明：基于原生 SVG 与标准 CSS 渲染，粘贴进微信后台或直推草稿箱完全一致</span>
            </div>
          </div>

          {/* Column 3: Live Customization Panel (3.5 cols) */}
          <div className="lg:col-span-3 p-5 overflow-y-auto bg-neutral-950/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 border-b border-neutral-800 pb-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>参数微调定制</span>
              </div>

              {/* Dynamic Inputs based on selected template */}
              <div className="space-y-3">
                {Object.keys(config).map((key) => {
                  const val = config[key];
                  const isLongText = typeof val === 'string' && (val.length > 30 || val.includes('\n'));
                  const isColor = typeof val === 'string' && (val.startsWith('#') || key.toLowerCase().includes('color'));

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
                        <span>{key}</span>
                        {isColor && (
                          <span
                            className="w-3.5 h-3.5 rounded border border-neutral-700"
                            style={{ backgroundColor: val }}
                          />
                        )}
                      </label>
                      {isLongText ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      ) : (
                        <input
                          type={isColor ? 'text' : 'text'}
                          value={val}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-6 border-t border-neutral-800 mt-6">
              <button
                type="button"
                onClick={handleInsert}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>一键插入当前文章光标处</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHtml}
                className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-750 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                {copiedId === selectedTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制内联 HTML</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制微信内联 HTML</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
