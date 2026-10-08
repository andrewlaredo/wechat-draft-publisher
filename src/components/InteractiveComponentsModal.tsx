import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Copy,
  Plus,
  Check,
  Eye,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import {
  INTERACTIVE_COMPONENTS,
  InteractiveComponentItem,
} from '../markdown/interactiveComponents.ts';

interface InteractiveComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertComponent: (template: string, name: string) => void;
}

export const InteractiveComponentsModal: React.FC<InteractiveComponentsModalProps> = ({
  isOpen,
  onClose,
  onInsertComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<InteractiveComponentItem>(INTERACTIVE_COMPONENTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: '全部组件' },
    { id: 'interaction', name: '互动与答疑' },
    { id: 'card', name: '高光与总结' },
    { id: 'gallery', name: '图集画廊' },
    { id: 'guide', name: '引导关注' },
  ];

  const filtered = selectedCategory === 'all'
    ? INTERACTIVE_COMPONENTS
    : INTERACTIVE_COMPONENTS.filter((c) => c.category === selectedCategory);

  const handleCopyCode = (item: InteractiveComponentItem) => {
    navigator.clipboard.writeText(item.template);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (item: InteractiveComponentItem) => {
    onInsertComponent(item.template, item.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信专属特色互动组件库</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-medium">
                  微信全端兼容
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                一键插入吸顶卡片、点击展开答疑、左右滑动图集、引导在看与 LaTeX/Mermaid 矢量排版
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

        {/* Category Tabs */}
        <div className="px-5 py-2.5 border-b border-neutral-800 bg-neutral-900 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content: Left list, Right preview & code */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left: Components list */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2">
            {filtered.map((item) => {
              const isSelected = activeItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-neutral-800 border-amber-600/80 shadow-sm'
                      : 'bg-neutral-850/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-200 truncate">
                        {item.name}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-neutral-600'}`} />
                </div>
              );
            })}
          </div>

          {/* Right: Live Preview & Insertion */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between overflow-y-auto bg-neutral-950/40">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    渲染预览效果
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ID: {activeItem.id}
                  </span>
                </div>
                {/* HTML Sandbox preview */}
                <div
                  className="mt-2.5 p-4 rounded-xl bg-neutral-900 border border-neutral-800 min-h-[100px] flex flex-col justify-center"
                  dangerouslySetInnerHTML={{ __html: activeItem.previewHtml }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    组件代码模板 (Markdown / HTML)
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeItem)}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition"
                  >
                    {copiedId === activeItem.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">已复制模板</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>复制代码</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 p-3 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
                  <pre className="text-xs font-mono text-neutral-300 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                    {activeItem.template.trim()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-neutral-800 mt-6 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                插入后将在编辑器光标处生成对应的标准排版结构
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
                >
                  取消
                </button>
                <button
                  onClick={() => handleInsert(activeItem)}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  插入到正文
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
