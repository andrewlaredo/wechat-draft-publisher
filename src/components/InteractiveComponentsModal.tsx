import React, { useState, useMemo } from 'react';
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
  Search,
  Code,
  FileText,
  MessageSquare,
  Bookmark,
  Share2,
} from 'lucide-react';
import {
  INTERACTIVE_COMPONENTS,
  INTERACTIVE_CATEGORIES,
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeItem, setActiveItem] = useState<InteractiveComponentItem>(INTERACTIVE_COMPONENTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewSource, setViewSource] = useState<boolean>(false);

  const filteredComponents = useMemo(() => {
    return INTERACTIVE_COMPONENTS.filter((c) => {
      const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信爆款排版组件物料库</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-medium">
                  {INTERACTIVE_COMPONENTS.length} 款专业排版物料
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                一键插入金句框、微信对话气泡、步骤流程条、深度导读名片与高转化文末互动卡
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

        {/* Toolbar: Categories & Search */}
        <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/60 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {INTERACTIVE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索组件名称或关键词..."
              className="w-full pl-8 pr-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Main Body: Master-Detail Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left: Components List (5 cols) */}
          <div className="md:col-span-5 p-3 overflow-y-auto space-y-2 bg-neutral-950/40">
            {filteredComponents.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                未找到匹配的排版组件物料
              </div>
            ) : (
              filteredComponents.map((item) => {
                const isSelected = activeItem.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-neutral-850 border-amber-500/80 ring-1 ring-amber-500/30 text-neutral-100 shadow-sm'
                        : 'bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-850/60'
                    }`}
                  >
                    <span className="text-xl p-1.5 rounded-lg bg-neutral-800/80 shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-300 border border-neutral-700 font-medium shrink-0">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Live Preview & Action Area (7 cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-neutral-900/90">
            {/* Preview Toolbar */}
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0 bg-neutral-950/30">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{activeItem.icon}</span>
                <div>
                  <div className="text-xs font-bold text-neutral-200">{activeItem.name}</div>
                  <div className="text-[10px] text-neutral-400">{activeItem.description}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setViewSource((p) => !p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center gap-1 ${
                    viewSource
                      ? 'bg-neutral-800 text-amber-300 border-amber-800'
                      : 'bg-neutral-850 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{viewSource ? '实时视效' : '源码代码'}</span>
                </button>
              </div>
            </div>

            {/* Preview Screen */}
            <div className="flex-1 overflow-y-auto p-5 bg-neutral-950 flex flex-col items-center justify-center">
              {viewSource ? (
                <div className="w-full h-full max-h-96 p-4 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-300 overflow-y-auto leading-relaxed select-text">
                  <pre className="whitespace-pre-wrap">{activeItem.template}</pre>
                </div>
              ) : (
                <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 text-neutral-800 antialiased my-auto select-none">
                  {/* WeChat Reader Mock Card Outer */}
                  <div className="text-[10px] text-neutral-400 mb-3 border-b border-neutral-100 pb-1 flex justify-between">
                    <span>📱 微信图文排版原生渲染效果</span>
                    <span>100% 深度内联样式</span>
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: activeItem.template }}
                    className="wechat-preview-block"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => handleCopyCode(activeItem)}
                className="py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition"
              >
                {copiedId === activeItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已复制组件代码</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>复制代码片段</span>
                  </>
                )}
              </button>

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
                  onClick={() => handleInsert(activeItem)}
                  className="py-1.5 px-4 rounded-lg bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>插入当前文章光标处</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
