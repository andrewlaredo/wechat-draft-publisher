import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Sliders,
  Image as ImageIcon,
  History,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code as CodeIcon,
  Table as TableIcon,
  Link as LinkIcon,
  List,
  Minus,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  Download,
  RotateCcw,
  Trash2,
  Minimize2,
  Maximize2,
  UploadCloud,
  Search,
  Replace,
  Compass,
  ArrowUp,
  ArrowDown,
  Wand2,
  X,
  ChevronRight,
  Eye,
  Palette,
  Layout,
  Workflow,
  Sigma,
} from 'lucide-react';
import { ArticleMeta, PublishHistoryItem } from '../types/app.ts';
import { wechatHtmlToMarkdown, isHtmlContent } from '../markdown/html2md.ts';
import { pickNativeMarkdown, saveNativeMarkdown } from '../utils/wails.ts';
import { InteractiveComponentsModal } from './InteractiveComponentsModal.tsx';
import { ComponentInspectorModal } from './ComponentInspectorModal.tsx';
import {
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
  DocumentSnapshot,
} from '../utils/snapshotManager.ts';
import { compressImageClient, CompressionResult } from '../utils/imageCompressor.ts';
import {
  extractOutline,
  shiftHeadings,
  formatChineseEnglishSpacing,
  OutlineItem,
} from '../utils/textBeautifier.ts';
import {
  recordEditorCursor,
  wrapWechatComponent,
  detectComponentBlocks,
  DetectedComponentBlock,
} from '../utils/cursorManager.ts';

interface MarkdownEditorProps {
  markdown: string;
  onMarkdownChange: (val: string) => void;
  metadata: ArticleMeta;
  onMetadataChange: (meta: Partial<ArticleMeta>) => void;
  history: PublishHistoryItem[];
  scannedImages: string[];
  onRefreshHistory?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onOpenCoverDesigner?: () => void;
  onOpenStockPhoto?: () => void;
  onOpenSvgInteractive?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onMarkdownChange,
  metadata,
  onMetadataChange,
  history,
  scannedImages,
  onRefreshHistory,
  isZenMode = false,
  onToggleZenMode,
  onOpenCoverDesigner,
  onOpenStockPhoto,
  onOpenSvgInteractive,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'metadata' | 'images' | 'history'>('editor');
  const [cleanNotice, setCleanNotice] = useState<string | null>(null);
  const [isComponentsModalOpen, setIsComponentsModalOpen] = useState(false);
  const [isMermaidMenuOpen, setIsMermaidMenuOpen] = useState(false);

  // Outline / Table of Contents state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);

  // Detected WeChat Components in current markdown
  const [previewComponent, setPreviewComponent] = useState<DetectedComponentBlock | null>(null);
  const [inspectingComponent, setInspectingComponent] = useState<DetectedComponentBlock | null>(null);
  const detectedBlocks = useMemo(() => detectComponentBlocks(markdown), [markdown]);

  const handleLocateComponent = (block: DetectedComponentBlock) => {
    const textarea = textareaRef.current || (document.getElementById('markdown-textarea') as HTMLTextAreaElement);
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(block.startIndex, block.endIndex);
    const totalLines = markdown.split('\n').length;
    const scrollRatio = block.lineStart / Math.max(1, totalLines);
    textarea.scrollTop = Math.max(0, scrollRatio * textarea.scrollHeight - 80);
    recordEditorCursor(textarea);
  };

  const handleUpdateComponentBlock = (blockId: string, newInnerHtml: string, newName?: string) => {
    const targetBlock = detectedBlocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    const wrapped = wrapWechatComponent(newInnerHtml, {
      id: targetBlock.id,
      name: newName || targetBlock.name,
      type: targetBlock.type as any,
    });

    const before = markdown.substring(0, targetBlock.startIndex);
    const after = markdown.substring(targetBlock.endIndex);
    onMarkdownChange(before + wrapped + after);
    showNotice(`✨ 已成功更新组件「${newName || targetBlock.name}」配置！`);
  };

  const handleDeleteComponent = (block: DetectedComponentBlock) => {
    const before = markdown.substring(0, block.startIndex);
    const after = markdown.substring(block.endIndex);
    const cleanBefore = before.replace(/\n+$/, '\n\n');
    const cleanAfter = after.replace(/^\n+/, '\n\n');
    onMarkdownChange((cleanBefore + cleanAfter).trim() + '\n');
    showNotice(`🗑️ 已安全移除组件「${block.name}」！`);
  };

  // Search & Replace state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchMatchesCount, setSearchMatchesCount] = useState(0);

  // Snapshots state
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>(() => getSnapshots());
  const [historySubTab, setHistorySubTab] = useState<'snapshots' | 'publish'>('snapshots');

  // Image compression state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update outline whenever markdown changes
  useEffect(() => {
    setOutlineItems(extractOutline(markdown));
  }, [markdown]);

  // Compute search match count
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchesCount(0);
      return;
    }
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = markdown.match(new RegExp(escaped, flags));
      setSearchMatchesCount(matches ? matches.length : 0);
    } catch {
      setSearchMatchesCount(0);
    }
  }, [searchQuery, caseSensitive, markdown]);

  const showNotice = (msg: string) => {
    setCleanNotice(msg);
    setTimeout(() => setCleanNotice(null), 3500);
  };

  const handlePurifyHtml = () => {
    const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const targetContent = fmMatch ? fmMatch[2] : markdown;

    if (!isHtmlContent(targetContent)) {
      showNotice('当前内容已是纯净 Markdown，未检测到 HTML 标签，格式保持不变。');
      return;
    }

    if (fmMatch) {
      const frontMatter = fmMatch[1];
      const purified = wechatHtmlToMarkdown(targetContent);
      onMarkdownChange(`---\n${frontMatter}\n---\n\n${purified}`);
    } else {
      onMarkdownChange(wechatHtmlToMarkdown(markdown));
    }
    showNotice('已成功纯化富文本 HTML 为标准 Markdown！');
  };

  // Chinese-English Pangu Spacing Beautifier
  const handleFormatChineseEnglishSpacing = () => {
    const { formatted, changed } = formatChineseEnglishSpacing(markdown);
    if (!changed) {
      showNotice('当前中英文排版与间距已非常规范，无需调整！');
      return;
    }
    onMarkdownChange(formatted);
    showNotice('✨ 已完成中英文盘古间距与标点排版规范化！');
  };

  // Heading shift
  const handleShiftHeadings = (direction: 'promote' | 'demote') => {
    const updated = shiftHeadings(markdown, direction);
    onMarkdownChange(updated);
    showNotice(`已将文章各级标题整体${direction === 'promote' ? '升级 (+1)' : '降级 (-1)'}！`);
  };

  // Jump to heading in textarea
  const handleScrollToHeading = (item: OutlineItem) => {
    const textarea = textareaRef.current || (document.getElementById('markdown-textarea') as HTMLTextAreaElement);
    if (!textarea) return;

    const lines = markdown.split(/\r?\n/);
    let charIndex = 0;
    for (let i = 0; i < Math.min(item.line - 1, lines.length); i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }

    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex + (lines[item.line - 1]?.length || 0));

    // Calculate approximate scroll percentage
    const linePercent = (item.line - 1) / Math.max(1, lines.length);
    textarea.scrollTop = linePercent * textarea.scrollHeight;
    showNotice(`已定位至标题：${item.text}`);
  };

  // Search Next
  const handleSearchNext = () => {
    if (!searchQuery.trim()) return;
    const textarea = textareaRef.current || (document.getElementById('markdown-textarea') as HTMLTextAreaElement);
    if (!textarea) return;

    const text = textarea.value;
    const startFrom = textarea.selectionEnd || 0;
    const flags = caseSensitive ? '' : 'i';
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let matchIndex = text.slice(startFrom).search(new RegExp(escaped, flags));
    if (matchIndex !== -1) {
      matchIndex += startFrom;
    } else {
      // Loop back to beginning
      matchIndex = text.search(new RegExp(escaped, flags));
    }

    if (matchIndex !== -1) {
      textarea.focus();
      textarea.setSelectionRange(matchIndex, matchIndex + searchQuery.length);
      const lineIndex = text.slice(0, matchIndex).split('\n').length;
      textarea.scrollTop = (lineIndex / text.split('\n').length) * textarea.scrollHeight;
    } else {
      showNotice('未找到匹配内容');
    }
  };

  // Replace Current
  const handleReplaceCurrent = () => {
    const textarea = textareaRef.current || (document.getElementById('markdown-textarea') as HTMLTextAreaElement);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    const matches = caseSensitive
      ? selected === searchQuery
      : selected.toLowerCase() === searchQuery.toLowerCase();

    if (matches && selected.length > 0) {
      const nextValue = textarea.value.substring(0, start) + replaceQuery + textarea.value.substring(end);
      onMarkdownChange(nextValue);
      setTimeout(() => {
        handleSearchNext();
      }, 50);
    } else {
      handleSearchNext();
    }
  };

  // Replace All
  const handleReplaceAll = () => {
    if (!searchQuery.trim()) return;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nextValue = markdown.replace(new RegExp(escaped, flags), replaceQuery);
      onMarkdownChange(nextValue);
      showNotice(`已替换全部 ${searchMatchesCount} 处匹配内容！`);
    } catch (err: any) {
      alert(`替换失败: ${err.message}`);
    }
  };

  const handleCreateSnapshot = () => {
    const saved = saveSnapshot({
      title: metadata.title,
      markdown,
      theme: metadata.theme,
      tag: 'manual',
      label: `手动保存 (${new Date().toLocaleTimeString()})`,
    });
    if (saved) {
      setSnapshots(getSnapshots());
      showNotice('📸 已成功保存当前文档版本快照！');
    }
  };

  const handleRollbackSnapshot = (snap: DocumentSnapshot) => {
    if (confirm(`确定回滚还原至版本「${snap.label}」吗？当前编辑器中的内容将被覆盖。`)) {
      onMarkdownChange(snap.markdown);
      showNotice(`⏪ 已成功回滚至 ${new Date(snap.timestamp).toLocaleTimeString()} 版本！`);
    }
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSnapshot(id);
    setSnapshots(getSnapshots());
  };

  // Periodic auto-snapshot
  useEffect(() => {
    if (!markdown || markdown.trim().length < 20) return;
    const timer = setTimeout(() => {
      const saved = saveSnapshot({
        title: metadata.title,
        markdown,
        theme: metadata.theme,
        tag: 'auto',
        label: `自动快照 (${new Date().toLocaleTimeString()})`,
      });
      if (saved) {
        setSnapshots(getSnapshots());
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [markdown, metadata.title, metadata.theme]);

  const handleCompressFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const res = await compressImageClient(file, { maxSizeKB: 1200 });
      setCompressionResult(res);
      showNotice(`⚡ 图片无损压缩完成：${(res.originalSize / 1024).toFixed(0)}KB ➔ ${(res.compressedSize / 1024).toFixed(0)}KB (节省 ${res.savedPercent}%)！`);
    } catch (err: any) {
      alert(`图片压缩处理失败: ${err.message}`);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleEditorPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        setIsCompressing(true);
        try {
          const res = await compressImageClient(file, { maxSizeKB: 1000 });
          setCompressionResult(res);
          insertText(`\n![剪贴板配图](${res.dataUrl})\n`);
          showNotice(`⚡ 剪贴板图片已离线无损压缩：${(res.originalSize / 1024).toFixed(0)}KB ➔ ${(res.compressedSize / 1024).toFixed(0)}KB (节省 ${res.savedPercent}%) 并插入正文！`);
        } catch (err: any) {
          alert(`图片压缩处理失败: ${err.message}`);
        } finally {
          setIsCompressing(false);
        }
        return;
      }
    }
  };

  const handleEditorDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      e.preventDefault();
      setIsCompressing(true);
      try {
        const res = await compressImageClient(file, { maxSizeKB: 1000 });
        setCompressionResult(res);
        insertText(`\n![拖拽配图](${res.dataUrl})\n`);
        showNotice(`⚡ 拖拽图片已离线无损压缩：${(res.originalSize / 1024).toFixed(0)}KB ➔ ${(res.compressedSize / 1024).toFixed(0)}KB (节省 ${res.savedPercent}%) 并插入正文！`);
      } catch (err: any) {
        alert(`图片压缩处理失败: ${err.message}`);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const insertText = (before: string, after = '') => {
    const textarea = textareaRef.current || (document.getElementById('markdown-textarea') as HTMLTextAreaElement);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selection = previous.substring(start, end) || (after ? '文本' : '');

    const replacement = `${before}${selection}${after}`;
    const nextValue = previous.substring(0, start) + replacement + previous.substring(end);
    onMarkdownChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      const cursorTarget = start + before.length + selection.length;
      textarea.setSelectionRange(cursorTarget, cursorTarget);
      recordEditorCursor(textarea);
    }, 10);
  };

  const handleOpenMarkdownFile = async () => {
    const nativeFile = await pickNativeMarkdown();
    if (nativeFile) {
      onMarkdownChange(nativeFile.content);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (typeof content === 'string') {
          onMarkdownChange(content);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportMarkdownFile = async () => {
    const defaultName = (metadata.title || 'article').replace(/[\\/:*?"<>|]/g, '_') + '.md';
    const savedPath = await saveNativeMarkdown(defaultName, markdown);
    if (savedPath) return;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut for Ctrl+F
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  };

  // Statistics calculation
  const linesCount = markdown ? markdown.split('\n').length : 0;
  const chineseCharsCount = (markdown.match(/[\u4e00-\u9fa5]/g) || []).length;
  const estimatedReadingMinutes = Math.max(1, Math.ceil(chineseCharsCount / 350));

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 relative">
      {/* Editor Tabs & Quick Zen Control */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-3 shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition ${
              activeTab === 'editor'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-850/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown 编辑</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition ${
              activeTab === 'metadata'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-850/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Front Matter 元数据</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center space-x-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition ${
              activeTab === 'images'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-850/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>配图清单 ({scannedImages.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              onRefreshHistory?.();
            }}
            className={`flex items-center space-x-1.5 py-2.5 px-3 border-b-2 text-xs font-medium transition ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-850/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>发布历史 ({history.length})</span>
          </button>
        </div>

        {/* Zen Mode Switch Button */}
        {onToggleZenMode && (
          <button
            type="button"
            onClick={onToggleZenMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
              isZenMode
                ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                : 'bg-neutral-800 border-neutral-750 text-neutral-400 hover:text-neutral-200'
            }`}
            title={isZenMode ? '退出全屏沉浸专注模式 (恢复双栏实时预览)' : '开启全屏沉浸专注写作模式 (隐藏右侧预览)'}
          >
            {isZenMode ? <Minimize2 className="w-3 h-3 text-amber-400" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isZenMode ? '退出专注' : '沉浸专注'}</span>
          </button>
        )}
      </div>

      {/* Tab 1: Markdown Editor */}
      {activeTab === 'editor' && (
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Enhanced Quick Insert Toolbar */}
          <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 bg-neutral-850 border-b border-neutral-800 text-neutral-400 text-xs shrink-0">
            <button
              onClick={() => insertText('## ')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="二级标题 H2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('### ')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="三级标题 H3"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            {/* Heading Shifters */}
            <button
              type="button"
              onClick={() => handleShiftHeadings('promote')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="整体提升标题层级 (H2->H1, H3->H2)"
            >
              <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => handleShiftHeadings('demote')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="整体降低标题层级 (H1->H2, H2->H3)"
            >
              <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
            </button>

            <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />
            <button
              onClick={() => insertText('**', '**')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="粗体"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('*', '*')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="斜体"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />
            <button
              onClick={() => insertText('> ')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="引用块"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('`', '`')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="行内代码"
            >
              <CodeIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('```typescript\n', '\n```')}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-700 hover:text-neutral-100 transition font-mono text-[11px]"
              title="插入多语言代码高亮块"
            >
              代码块
            </button>

            {/* Mermaid 矢量图表快捷插入菜单 */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsMermaidMenuOpen((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                  isMermaidMenuOpen
                    ? 'bg-blue-600/40 text-blue-300 border border-blue-500/60 shadow-sm'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-blue-300 border border-blue-800/60'
                }`}
                title="插入微信高保真纯矢量图表（流程图、时序图、架构图、饼图，免图床）"
              >
                <Workflow className="w-3 h-3 text-blue-400" />
                <span>图表</span>
              </button>

              {isMermaidMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 w-64 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-1.5 z-40 animate-fadeIn text-xs"
                  onMouseLeave={() => setIsMermaidMenuOpen(false)}
                >
                  <div className="text-[10px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider border-b border-neutral-800 mb-1 flex items-center justify-between">
                    <span>矢量图表模板 (SVG 直出)</span>
                    <span className="text-emerald-400 font-normal">微信免图床</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      insertText('\n```mermaid\ngraph TD\nA([开始：选题策划]) --> B[大纲提炼与正文撰写]\nB --> C{初稿自检审核}\nC -->|审核通过| D[微信高保真排版]\nC -->|待优化调整| B\nD --> E[(一键发布或复制)]\n```\n');
                      setIsMermaidMenuOpen(false);
                      showNotice('📊 已插入业务流程图 (TD) 模板，支持直接在正文中修改文字！');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-blue-300 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200 group-hover:text-blue-300">🔀 纵向流程图 (TD)</div>
                      <div className="text-[10px] text-neutral-400">自上而下、条件分支判断</div>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">业务</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      insertText('\n```mermaid\ngraph LR\nA[手机端微信] --> B[API网关]\nB --> C[排版渲染微服务]\nC --> D[SVG矢量图转换引擎]\nD --> E[(CDN分发网络)]\n```\n');
                      setIsMermaidMenuOpen(false);
                      showNotice('📊 已插入横向架构图 (LR) 模板！');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-blue-300 transition flex items-center justify-between group mt-0.5"
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200 group-hover:text-blue-300">➡️ 横向架构图 (LR)</div>
                      <div className="text-[10px] text-neutral-400">左右流转、调用链路</div>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">系统</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      insertText('\n```mermaid\nsequenceDiagram\nparticipant User as 读者用户\nparticipant WeChat as 微信公众号\nparticipant Server as 后台服务\nUser ->> WeChat: 扫描临时审稿二维码\nWeChat ->> Server: 请求最新渲染草稿\nServer -->> WeChat: 返回内联富文本与矢量图\nWeChat -->> User: 呈现移动端真机预览\n```\n');
                      setIsMermaidMenuOpen(false);
                      showNotice('📊 已插入交互时序图 (Sequence) 模板！');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-blue-300 transition flex items-center justify-between group mt-0.5"
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200 group-hover:text-blue-300">⏱️ 交互时序图 (Sequence)</div>
                      <div className="text-[10px] text-neutral-400">参与者交互、消息往返</div>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">时序</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      insertText('\n```mermaid\npie title 公众号读者阅读终端占比\n"微信移动端 iOS" : 54\n"微信移动端 Android" : 36\n"微信电脑客户端" : 7\n"浏览器外部链接" : 3\n```\n');
                      setIsMermaidMenuOpen(false);
                      showNotice('📊 已插入环形占比饼图 (Pie) 模板！');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-blue-300 transition flex items-center justify-between group mt-0.5"
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200 group-hover:text-blue-300">🍩 环形占比饼图 (Pie)</div>
                      <div className="text-[10px] text-neutral-400">数据占比统计、份额分布</div>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">数据</span>
                  </button>
                </div>
              )}
            </div>

            {/* LaTeX 数学公式快捷插入 */}
            <button
              type="button"
              onClick={() => {
                insertText('\n$$\n\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n');
                showNotice('📐 已插入 LaTeX 数学公式块！');
              }}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-emerald-300 transition text-[11px] flex items-center space-x-1"
              title="插入 LaTeX 数学公式块 (KaTeX 高精渲染)"
            >
              <Sigma className="w-3 h-3 text-emerald-400" />
              <span>公式</span>
            </button>
            <button
              onClick={() => insertText('| 标题1 | 标题2 |\n| :--- | :--- |\n| 内容1 | 内容2 |\n')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="表格"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('[链接描述](', ')')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="链接"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('![图片描述](', ')')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="插入图片语法"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            {onOpenStockPhoto && (
              <button
                type="button"
                onClick={onOpenStockPhoto}
                className="px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 text-[11px] font-medium transition flex items-center space-x-1"
                title="免版权高清商用配图库：Unsplash 免费商用授权配图即搜即用"
              >
                <ImageIcon className="w-3 h-3 text-sky-400" />
                <span>免版权图库</span>
              </button>
            )}
            <button
              onClick={() => insertText('- ')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="无序列表"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertText('\n---\n')}
              className="p-1 rounded hover:bg-neutral-700 hover:text-neutral-100 transition"
              title="分割线"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />

            {/* Outline Navigation Toggle */}
            <button
              type="button"
              onClick={() => setIsOutlineOpen((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                isOutlineOpen
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60'
              }`}
              title="展开文章大纲树 (快速跳转各级章节)"
            >
              <Compass className="w-3 h-3 text-blue-400" />
              <span>大纲 ({outlineItems.length})</span>
            </button>

            {/* Search and Replace Toggle */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                isSearchOpen
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60'
              }`}
              title="查找与替换 (快捷键 Ctrl+F)"
            >
              <Search className="w-3 h-3 text-emerald-400" />
              <span>查找替换</span>
            </button>

            {/* Pangu Spacing Beautifier */}
            <button
              type="button"
              onClick={handleFormatChineseEnglishSpacing}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-600/40 text-[11px] font-medium transition flex items-center space-x-1"
              title="排版效能：一键自动为中英文与数字之间添加标准盘古空格，修正重复标点，遵循中文排版指南规范"
            >
              <Wand2 className="w-3 h-3 text-amber-400" />
              <span>中英排版规范化</span>
            </button>

            <button
              type="button"
              onClick={() => setIsComponentsModalOpen(true)}
              className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition flex items-center space-x-1"
              title="插入微信爆款排版物料库（金句框、微信对话气泡、流程步骤条、导读名片）"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>排版物料</span>
            </button>

            {onOpenSvgInteractive && (
              <button
                type="button"
                onClick={onOpenSvgInteractive}
                className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[11px] font-medium transition flex items-center space-x-1"
                title="微信原生 SVG 交互排版黑科技工坊：点击展开、手势横滑图集、黑胶唱片旋转"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>SVG动效</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePurifyHtml}
              className="px-2 py-0.5 rounded hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition text-[11px] flex items-center space-x-1"
              title="一键纯化富文本 HTML 为标准 Markdown"
            >
              <Sparkles className="w-3 h-3" />
              <span>纯化 HTML</span>
            </button>

            <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />

            <button
              type="button"
              onClick={handleOpenMarkdownFile}
              className="px-2 py-0.5 rounded hover:bg-neutral-700 hover:text-neutral-100 transition text-[11px] flex items-center space-x-1"
              title="打开并加载本地 Markdown 文件"
            >
              <FolderOpen className="w-3 h-3 text-blue-400" />
              <span>打开 .md</span>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdownFile}
              className="px-2 py-0.5 rounded hover:bg-neutral-700 hover:text-neutral-100 transition text-[11px] flex items-center space-x-1"
              title="导出当前内容为本地 Markdown 文件"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>导出 .md</span>
            </button>
          </div>

          {/* Search & Replace Floating Bar */}
          {isSearchOpen && (
            <div className="bg-neutral-850/95 border-b border-neutral-750 px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-20 animate-fadeIn">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchNext()}
                    placeholder="查找文本..."
                    className="w-36 sm:w-44 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  {searchMatchesCount > 0 && (
                    <span className="absolute right-2 top-1 text-[10px] text-neutral-400 font-mono">
                      {searchMatchesCount}处
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="替换为..."
                  className="w-36 sm:w-44 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:border-emerald-500"
                />

                <label className="flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700 text-emerald-500"
                  />
                  <span>区分大小写</span>
                </label>

                <button
                  type="button"
                  onClick={handleSearchNext}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition text-xs"
                >
                  下一个
                </button>
                <button
                  type="button"
                  onClick={handleReplaceCurrent}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded transition text-xs"
                >
                  替换
                </button>
                <button
                  type="button"
                  onClick={handleReplaceAll}
                  disabled={searchMatchesCount === 0}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded transition text-xs"
                >
                  全部替换 ({searchMatchesCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Clean notice toast/banner */}
          {cleanNotice && (
            <div className="bg-emerald-950/90 border-b border-emerald-800 px-3.5 py-1.5 text-xs flex items-center justify-between text-emerald-200 animate-fadeIn shrink-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{cleanNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCleanNotice(null)}
                className="text-emerald-400 hover:text-emerald-200 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Alert banner if raw dirty external HTML is detected */}
          {(() => {
            const stripped = markdown.replace(/<!--\s*\[WECHAT_COMPONENT[\s\S]*?\[\/WECHAT_COMPONENT\]\s*-->/g, '');
            return /<section\b[^>]*style=|<span\b[^>]*leaf=|<p\b[^>]*style=|<blockquote\b[^>]*style=/i.test(stripped);
          })() && (
            <div className="bg-amber-950/80 border-b border-amber-800/80 px-3.5 py-2 text-xs flex items-center justify-between text-amber-200 shrink-0">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  检测到正文中包含外部粘贴的杂乱 HTML 代码。建议纯化为标准 Markdown。
                </span>
              </div>
              <button
                type="button"
                onClick={handlePurifyHtml}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition text-xs shrink-0 ml-2 shadow-sm flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>一键纯化为纯净 Markdown</span>
              </button>
            </div>
          )}

          {/* Detected WeChat Components Inspector Bar */}
          {detectedBlocks.length > 0 && (
            <div className="bg-neutral-850/95 border-b border-neutral-750 px-3 py-1.5 text-xs flex items-center justify-between gap-2 overflow-x-auto shrink-0 animate-fadeIn">
              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>已嵌入微信组件 ({detectedBlocks.length})</span>
                </span>
                <span className="text-[11px] text-neutral-400 hidden lg:inline">
                  已开启防污染沙盒隔离：
                </span>
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
                {detectedBlocks.map((block: DetectedComponentBlock) => {
                  const isImage = block.type === 'image';
                  const isSvg = block.type === 'svg';
                  return (
                    <div
                      key={block.id + block.startIndex}
                      className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[11px] shrink-0 transition group ${
                        isImage
                          ? 'bg-sky-950/70 border-sky-800/80 text-sky-200 hover:border-sky-500'
                          : isSvg
                          ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200 hover:border-emerald-500'
                          : 'bg-neutral-800 border-neutral-750 text-neutral-200 hover:border-indigo-500/60'
                      }`}
                    >
                      <span className="text-amber-400 font-mono text-[10px]">L{block.lineStart}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                          isImage
                            ? 'bg-sky-900/60 text-sky-300'
                            : isSvg
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-indigo-950 text-indigo-300'
                        }`}
                      >
                        {isImage ? '配图' : isSvg ? 'SVG' : '物料'}
                      </span>
                      <span className="font-medium max-w-[120px] truncate" title={block.name}>
                        {block.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectingComponent(block)}
                        className="p-0.5 hover:text-emerald-300 text-neutral-400 transition"
                        title="打开表单属性修改器 (Inline Form Inspector)"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewComponent(block)}
                        className="p-0.5 hover:text-amber-300 text-neutral-400 transition ml-0.5"
                        title="单独预览此组件效果"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLocateComponent(block)}
                        className="p-0.5 hover:text-blue-300 text-neutral-400 transition"
                        title="定位到该组件源码所在行"
                      >
                        <Compass className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComponent(block)}
                        className="p-0.5 hover:text-rose-400 text-neutral-400 transition"
                        title="安全移除此组件，不留多余 HTML"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Editing Area + Optional Outline Drawer */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Outline Drawer / Sidebar */}
            {isOutlineOpen && (
              <div className="w-56 border-r border-neutral-800 bg-neutral-900/95 flex flex-col shrink-0 animate-fadeIn text-xs">
                <div className="p-2.5 border-b border-neutral-800 flex items-center justify-between text-neutral-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    <span>文章大纲 ({outlineItems.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOutlineOpen(false)}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {outlineItems.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500 text-[11px]">
                      正文中暂未检测到 # 标题。键入 ## 标题 即可自动生成大纲。
                    </div>
                  ) : (
                    outlineItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleScrollToHeading(item)}
                        className={`w-full text-left py-1 px-2 rounded-md hover:bg-neutral-800 transition flex items-center gap-1.5 text-neutral-300 hover:text-white truncate ${
                          item.level === 1
                            ? 'font-bold text-neutral-100 pl-1'
                            : item.level === 2
                            ? 'pl-3 font-medium'
                            : item.level === 3
                            ? 'pl-5 text-neutral-400'
                            : 'pl-7 text-neutral-500'
                        }`}
                      >
                        <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate">{item.text}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              id="markdown-textarea"
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              onSelect={(e) => recordEditorCursor(e.currentTarget)}
              onClick={(e) => recordEditorCursor(e.currentTarget)}
              onKeyUp={(e) => recordEditorCursor(e.currentTarget)}
              onFocus={(e) => recordEditorCursor(e.currentTarget)}
              onBlur={(e) => recordEditorCursor(e.currentTarget)}
              onPaste={handleEditorPaste}
              onDrop={handleEditorDrop}
              onKeyDown={handleKeyDown}
              placeholder="在此键入 Markdown 内容，支持头部 Front Matter..."
              className="flex-1 w-full p-4 bg-neutral-900 text-neutral-200 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-emerald-900/60"
              spellCheck={false}
            />
          </div>

          {/* Enhanced Bottom Status Bar */}
          <div className="px-3.5 py-1.5 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-[11px] text-neutral-400 font-mono shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span>共 {linesCount} 行</span>
              <span>·</span>
              <span>{markdown.length} 字符</span>
              <span>·</span>
              <span className="text-neutral-300 font-medium">汉字 {chineseCharsCount} 字</span>
              <span>·</span>
              <span className="text-emerald-400">预计阅读 ~{estimatedReadingMinutes} 分钟</span>
            </div>

            <div className="flex items-center gap-2">
              {isZenMode && (
                <span className="text-amber-400 font-sans">
                  ✨ 专注模式中
                </span>
              )}
              <span className="text-neutral-500">Ctrl+F 查找替换</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Front Matter Metadata Form */}
      {activeTab === 'metadata' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="font-semibold text-neutral-200 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              文章头部元数据 (YAML Front Matter)
            </h3>
            <p className="text-neutral-400">
              修改此处的元数据将同步体现在文章头部，并作为微信草稿箱的标题、作者、摘要与封面。
            </p>

            {/* Article Type Selection */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                发布消息类型 (article_type / type)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onMetadataChange({ article_type: 'news' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                    metadata.article_type !== 'newspic'
                      ? 'bg-neutral-800 border-emerald-500 text-neutral-100 ring-1 ring-emerald-500/50'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    📝 经典图文消息 (news)
                  </span>
                  <span className="text-[10px] text-neutral-500 leading-tight">
                    排版长文，支持主题样式、代码高亮与正文配图
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onMetadataChange({ article_type: 'newspic' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                    metadata.article_type === 'newspic'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-rose-400">
                    📸 图片消息 / 贴图 (newspic)
                  </span>
                  <span className="text-[10px] text-neutral-500 leading-tight">
                    小绿书风格，多张高清图片轮播 + 简短说明文案
                  </span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                文章标题 (title) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => onMetadataChange({ title: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                placeholder="例如：微信公众号草稿自动化发布实战指南"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                作者名称 (author) <span className="text-neutral-500 text-[11px]">(限20字)</span>
              </label>
              <input
                type="text"
                maxLength={20}
                value={metadata.author}
                onChange={(e) => onMetadataChange({ author: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                placeholder="例如：科技探索者"
              />
            </div>

            {/* Digest */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-neutral-300 font-medium">
                  文章摘要 (digest) <span className="text-neutral-500 text-[11px]">(微信限制最多120字)</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    metadata.digest.length > 120 ? 'text-red-400 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {metadata.digest.length}/120
                </span>
              </div>
              <textarea
                rows={3}
                value={metadata.digest}
                onChange={(e) => onMetadataChange({ digest: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="简要概括文章主旨，若超过120字将被微信截断..."
              />
            </div>

            {/* Cover image */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-neutral-300 font-medium text-xs">
                  封面图路径或 URL (cover)
                </label>
                {onOpenCoverDesigner && (
                  <button
                    type="button"
                    onClick={onOpenCoverDesigner}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition"
                    title="打开微信封面图设计工坊在线制作 2.35:1 大封面"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>封面工坊在线制作</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={metadata.cover || ''}
                onChange={(e) => onMetadataChange({ cover: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                placeholder="./images/cover.png 或 https://..."
              />
              {metadata.cover && (
                <div className="mt-2 p-2 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center space-x-3">
                  <img
                    src={metadata.cover}
                    alt="Cover preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-10 object-cover rounded"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const cover = metadata.cover;
                      if (!img.dataset.triedFallback && cover && (cover.startsWith('./') || cover.startsWith('images/'))) {
                        img.dataset.triedFallback = 'true';
                        img.src = `/api/local-image?path=${encodeURIComponent(cover)}`;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                  <div className="text-[11px] text-neutral-400 truncate">
                    封面缩略预览: {metadata.cover}
                  </div>
                </div>
              )}
            </div>

            {/* Thumb Media ID */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                指定已有封面素材 ID (thumb_media_id, 可选)
              </label>
              <input
                type="text"
                value={metadata.thumb_media_id || ''}
                onChange={(e) => onMetadataChange({ thumb_media_id: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                placeholder="留空则由工具自动上传封面图并生成"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                阅读原文链接 (source_url, 可选)
              </label>
              <input
                type="text"
                value={metadata.source_url || ''}
                onChange={(e) => onMetadataChange({ source_url: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                placeholder="https://..."
              />
            </div>

            {/* Comment Switch */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div>
                <span className="text-neutral-200 font-medium block">开启微信文章留言功能</span>
                <span className="text-neutral-500 text-[11px]">需公众号已开通留言权限</span>
              </div>
              <input
                type="checkbox"
                checked={metadata.comment}
                onChange={(e) => onMetadataChange({ comment: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Scanned Images & Lossless Compressor */}
      {activeTab === 'images' && (
        <div className="flex-1 p-5 overflow-y-auto text-xs space-y-4">
          <div className="bg-gradient-to-br from-neutral-850 to-neutral-900 p-4 rounded-xl border border-neutral-750 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-100 text-xs flex items-center gap-2">
                <Minimize2 className="w-4 h-4 text-sky-400" />
                本地图片无损压缩引擎 (防超微信 2MB 素材上限)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 border border-sky-800 text-sky-300 font-mono">
                Canvas 离线高速压缩
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              微信接口严格限制单张图片最大不可超过 2MB。拖入或选择大图，自动等比缩放并压缩至 1.2MB 以内，保留超清画质。
            </p>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-xs">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isCompressing ? '正在极速压图中...' : '选择本地大图测试压缩'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCompressFile}
                  disabled={isCompressing}
                  className="hidden"
                />
              </label>

              {compressionResult && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/80">
                  <span>{(compressionResult.originalSize / 1024).toFixed(0)}KB ➔ {(compressionResult.compressedSize / 1024).toFixed(0)}KB</span>
                  <span className="font-bold text-emerald-300">(-{compressionResult.savedPercent}%)</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-neutral-300">
                当前文章正文引用的所有配图 ({scannedImages.length})
              </h4>
              <span className="text-[11px] text-neutral-500">
                发布时将自动上传为永久素材并替换为微信 CDN
              </span>
            </div>

            {scannedImages.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 bg-neutral-850 rounded-xl border border-neutral-800">
                正文中暂未检测到配图。可在左侧拖拽或粘贴图片直接插入。
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {scannedImages.map((imgPath, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-850 rounded-xl border border-neutral-800 flex flex-col justify-between space-y-2 group"
                  >
                    <div className="aspect-video w-full rounded-lg bg-neutral-900 overflow-hidden flex items-center justify-center border border-neutral-800">
                      <img
                        src={imgPath}
                        alt={`Scanned ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.dataset.triedFallback && (imgPath.startsWith('./') || imgPath.startsWith('images/'))) {
                            img.dataset.triedFallback = 'true';
                            img.src = `/api/local-image?path=${encodeURIComponent(imgPath)}`;
                          } else {
                            img.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="truncate flex-1 font-mono">{imgPath}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onMetadataChange({ cover: imgPath });
                          showNotice(`已将第 ${idx + 1} 张图片设为封面！`);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 shrink-0 ml-1"
                      >
                        设为封面
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Snapshots & Publish History */}
      {activeTab === 'history' && (
        <div className="flex-1 p-5 overflow-y-auto text-xs space-y-4">
          <div className="flex items-center gap-2 p-1 bg-neutral-850 rounded-xl border border-neutral-800 w-fit">
            <button
              type="button"
              onClick={() => setHistorySubTab('snapshots')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                historySubTab === 'snapshots'
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              本地版本快照 ({snapshots.length})
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab('publish')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                historySubTab === 'publish'
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              草稿推送历史 ({history.length})
            </button>
          </div>

          {/* Subtab 1: Snapshots */}
          {historySubTab === 'snapshots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">
                  支持自动每 30 秒与推送前防丢快照，误删误改随时一键回退还原
                </span>
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  创建当前快照
                </button>
              </div>

              {snapshots.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 bg-neutral-850 rounded-xl border border-neutral-800">
                  暂无本地版本快照。
                </div>
              ) : (
                <div className="space-y-2.5">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3.5 bg-neutral-850 rounded-xl border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-neutral-200 text-xs truncate">
                            {snap.label}
                          </h4>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                            snap.tag === 'manual'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : snap.tag === 'publish'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {snap.tag === 'manual' ? '手动' : snap.tag === 'publish' ? '推送前' : '自动'}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2 font-mono">
                          <span>{new Date(snap.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{snap.charCount} 字符</span>
                          <span>•</span>
                          <span>主题: {snap.theme}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRollbackSnapshot(snap)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-neutral-700 shadow-xs"
                          title="一键还原编辑器至此历史版本"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>回滚还原</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
                          title="删除此快照"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Publish History */}
          {historySubTab === 'publish' && (
            <div className="space-y-2.5">
              {history.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 bg-neutral-850 rounded-xl border border-neutral-800">
                  暂无已推送的草稿记录。
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-neutral-850 rounded-xl border border-neutral-800 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-neutral-200 text-xs leading-snug">
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                        {item.media_id ? item.media_id.slice(0, 14) + '...' : '草稿'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span>发布时间: {new Date(item.published_at).toLocaleString()}</span>
                      <span>指纹: {item.hash.slice(0, 8)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Components insertion modal */}
      <InteractiveComponentsModal
        isOpen={isComponentsModalOpen}
        onClose={() => setIsComponentsModalOpen(false)}
        onInsertComponent={(template, name) => {
          const wrapped = wrapWechatComponent(template, { name, type: 'material' });
          insertText(`\n\n${wrapped}\n\n`, '');
          showNotice(`✨ 已在光标处插入特色组件「${name}」！`);
        }}
      />

      {/* Component Mini Preview Modal */}
      {previewComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
              <div className="flex items-center space-x-2">
                {previewComponent.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                ) : previewComponent.type === 'svg' ? (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Layout className="w-4 h-4 text-amber-400" />
                )}
                <h3 className="text-sm font-bold text-neutral-100">{previewComponent.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  {previewComponent.type === 'image' ? '配图' : previewComponent.type === 'svg' ? 'SVG动效' : '排版物料'} · 第 {previewComponent.lineStart} 行
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewComponent(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto bg-neutral-950 flex flex-col items-center justify-center min-h-[180px]">
              <div
                className="w-full max-w-md bg-white p-4 rounded-xl shadow-inner text-neutral-900 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: previewComponent.innerHtml }}
              />
            </div>

            <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between text-xs">
              <span className="text-neutral-400 text-[11px]">
                提示：可在右侧微信真实仿真阅读器中体验完整交互与动画
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectingComponent(previewComponent);
                    setPreviewComponent(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 transition flex items-center gap-1 font-medium"
                  title="在表单修改器中可视化编辑文案与样式"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>表单修改</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLocateComponent(previewComponent);
                    setPreviewComponent(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition"
                >
                  定位源码
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteComponent(previewComponent);
                    setPreviewComponent(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition"
                >
                  删除组件
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Form Inspector Modal */}
      <ComponentInspectorModal
        isOpen={!!inspectingComponent}
        onClose={() => setInspectingComponent(null)}
        block={inspectingComponent}
        onUpdateBlock={handleUpdateComponentBlock}
      />
    </div>
  );
};
