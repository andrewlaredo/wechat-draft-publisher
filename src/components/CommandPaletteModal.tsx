import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  Send,
  Sparkles,
  Palette,
  ShieldCheck,
  Smartphone,
  Share2,
  Calendar,
  Flame,
  FileText,
  Sliders,
  Image as ImageIcon,
  Layers,
  Settings,
  HelpCircle,
  FolderOpen,
  Eye,
  Minimize2,
  Maximize2,
  Terminal,
  Download,
  Users,
  Check,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'publish' | 'format' | 'visual' | 'operation' | 'view';
  icon: React.ReactNode;
  shortcut?: string;
  keywords: string[];
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

const CATEGORY_NAMES: Record<string, string> = {
  publish: '发布与多渠道分发',
  format: '排版主题与文本美化',
  visual: '视觉设计与爆款物料',
  operation: '运营日程与数据资产',
  view: '视图模式与辅助工具',
};

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter((c) => {
      return (
        c.title.toLowerCase().includes(lower) ||
        c.subtitle.toLowerCase().includes(lower) ||
        c.keywords.some((kw) => kw.toLowerCase().includes(lower))
      );
    });
  }, [commands, query]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      scrollSelectedIntoView((selectedIndex + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      scrollSelectedIntoView((selectedIndex - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll('[data-command-item]');
    const targetEl = items[index] as HTMLElement;
    if (targetEl) {
      targetEl.scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <Command className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="键入动作名称、拼音缩写或功能关键词（如 发布、封面、主题、体检、日历...）"
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-1 shrink-0 text-[11px] text-neutral-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">ESC</span>
              <span>退出</span>
            </div>
          )}
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-neutral-850/60"
        >
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              <Search className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              未找到匹配的指令，请尝试输入其他关键词。
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-command-item
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                      : 'text-neutral-300 hover:bg-neutral-850 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-neutral-100 truncate">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                          {CATEGORY_NAMES[cmd.category] || cmd.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    {cmd.shortcut && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-300 border border-neutral-700">
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 transition ${
                        isSelected ? 'text-amber-400 translate-x-0.5' : 'text-neutral-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <span className="px-1 rounded bg-neutral-800 border border-neutral-700">↑</span>
              <span className="px-1 rounded bg-neutral-800 border border-neutral-700">↓</span>
              <span>切换</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 rounded bg-neutral-800 border border-neutral-700">Enter</span>
              <span>执行</span>
            </span>
          </div>
          <span>全键盘支持 · 极速调度</span>
        </div>
      </div>
    </div>
  );
};
