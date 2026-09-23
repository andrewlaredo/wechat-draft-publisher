import React, { useState } from 'react';
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
  ExternalLink,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  Download,
} from 'lucide-react';
import { ArticleMeta, PublishHistoryItem } from '../types/app.ts';
import { wechatHtmlToMarkdown, isHtmlContent } from '../markdown/html2md.ts';
import { pickNativeMarkdown, saveNativeMarkdown, isWails } from '../utils/wails.ts';

interface MarkdownEditorProps {
  markdown: string;
  onMarkdownChange: (val: string) => void;
  metadata: ArticleMeta;
  onMetadataChange: (meta: Partial<ArticleMeta>) => void;
  history: PublishHistoryItem[];
  scannedImages: string[];
  onRefreshHistory?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onMarkdownChange,
  metadata,
  onMetadataChange,
  history,
  scannedImages,
  onRefreshHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'metadata' | 'images' | 'history'>('editor');
  const [cleanNotice, setCleanNotice] = useState<string | null>(null);

  const handlePurifyHtml = () => {
    const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const targetContent = fmMatch ? fmMatch[2] : markdown;

    if (!isHtmlContent(targetContent)) {
      setCleanNotice('当前内容已是纯净 Markdown，未检测到 HTML 标签，格式保持不变。');
      setTimeout(() => setCleanNotice(null), 3000);
      return;
    }

    if (fmMatch) {
      const frontMatter = fmMatch[1];
      const purified = wechatHtmlToMarkdown(targetContent);
      onMarkdownChange(`---\n${frontMatter}\n---\n\n${purified}`);
    } else {
      onMarkdownChange(wechatHtmlToMarkdown(markdown));
    }
    setCleanNotice('已成功纯化富文本 HTML 为标准 Markdown！');
    setTimeout(() => setCleanNotice(null), 3000);
  };

  const insertText = (before: string, after = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selection = previous.substring(start, end) || '文本';

    const replacement = `${before}${selection}${after}`;
    const nextValue = previous.substring(0, start) + replacement + previous.substring(end);
    onMarkdownChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selection.length);
    }, 10);
  };

  const handleOpenMarkdownFile = async () => {
    // If in Wails desktop, use native OS dialog
    const nativeFile = await pickNativeMarkdown();
    if (nativeFile) {
      onMarkdownChange(nativeFile.content);
      return;
    }
    // Web fallback using file input
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

    // Web fallback using Blob download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Editor Tabs */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-900/80 px-3">
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

      {/* Tab 1: Markdown Editor */}
      {activeTab === 'editor' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Quick Insert Toolbar */}
          <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 bg-neutral-850 border-b border-neutral-800 text-neutral-400 text-xs">
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
              title="代码块"
            >
              代码块
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
              title="插入图片"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
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
            <button
              type="button"
              onClick={handlePurifyHtml}
              className="px-2 py-0.5 rounded hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition text-[11px] flex items-center space-x-1"
              title="如果正文包含微信或网页 HTML 标签，点击一键纯化转换为纯净 Markdown（已是纯 Markdown 时自动保护格式不被修改）"
            >
              <Sparkles className="w-3 h-3" />
              <span>纯化 HTML</span>
            </button>

            <span className="w-px h-3.5 bg-neutral-700 mx-0.5" />

            <button
              type="button"
              onClick={handleOpenMarkdownFile}
              className="px-2 py-0.5 rounded hover:bg-neutral-700 hover:text-neutral-100 transition text-[11px] flex items-center space-x-1"
              title="打开并加载本地 Markdown 文件 (桌面客户端下支持系统原生对话框)"
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

          {/* Clean notice toast/banner */}
          {cleanNotice && (
            <div className="bg-emerald-950/90 border-b border-emerald-800 px-3.5 py-1.5 text-xs flex items-center justify-between text-emerald-200 animate-fadeIn">
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

          {/* Alert banner if raw HTML is detected */}
          {/<section\b[^>]*style=|<span\b[^>]*leaf=|<p\b[^>]*style=|<blockquote\b[^>]*style=/i.test(markdown) && (
            <div className="bg-amber-950/80 border-b border-amber-800/80 px-3.5 py-2 text-xs flex items-center justify-between text-amber-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  检测到正文中包含微信富文本 HTML 代码（如 <code>&lt;section style=...&gt;</code>）。建议纯化为标准 Markdown。
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

          <textarea
            id="markdown-textarea"
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder="在此键入 Markdown 内容，支持头部 Front Matter..."
            className="flex-1 w-full p-4 bg-neutral-900 text-neutral-200 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-emerald-900/60"
            spellCheck={false}
          />
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
              <label className="block text-neutral-300 font-medium mb-1.5">
                封面图路径或 URL (cover)
              </label>
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
                    className="w-16 h-10 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
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

      {/* Tab 3: Scanned Images */}
      {activeTab === 'images' && (
        <div className="flex-1 p-5 overflow-y-auto text-xs space-y-4">
          <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-800">
            <h3 className="font-semibold text-neutral-200 text-sm mb-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              文章配图解析与素材库状态
            </h3>
            <p className="text-neutral-400 text-xs mb-4">
              推送草稿时，工具将自动上传未入库的本地图片至微信永久素材库，并将其 URL 替换为微信 mmbiz.qpic.cn 地址。
            </p>

            {scannedImages.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                当前文章未检测到配图引用。可通过顶部工具栏快速插入配图。
              </div>
            ) : (
              <div className="space-y-2.5">
                {scannedImages.map((src, index) => {
                  const isRemote = /^https?:\/\//i.test(src);
                  return (
                    <div
                      key={index}
                      className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-700">
                          {isRemote ? (
                            <img src={src} alt="thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-neutral-200 font-mono truncate text-xs">{src}</div>
                          <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span>类型: {isRemote ? '网络外链' : '本地相对路径'}</span>
                            <span>•</span>
                            <span className="text-emerald-400">就绪</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 flex-shrink-0">
                        {isRemote ? '微信外链' : '待上传至素材库'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Publish History */}
      {activeTab === 'history' && (
        <div className="flex-1 p-5 overflow-y-auto text-xs space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-200 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              本地推送历史缓存记录 (.cache/published.json)
            </h3>
            {onRefreshHistory && (
              <button
                onClick={onRefreshHistory}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition flex items-center gap-1 border border-neutral-700 cursor-pointer"
                title="重新获取发布历史"
              >
                刷新记录
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 bg-neutral-850 rounded-xl border border-neutral-800">
              暂无已推送的草稿记录。
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item, idx) => (
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
