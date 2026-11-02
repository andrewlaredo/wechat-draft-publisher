import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Check,
  Copy,
  ArrowRight,
  Layers,
  Flame,
  BookOpen,
  Zap,
  RefreshCw,
  Sliders,
  FileCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { PolishStyle, PolishedDraftResult } from '../ai/polisher.ts';
import { saveArticle } from '../utils/indexedDBStorage.ts';

interface AiPolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarkdown: string;
  onApplyPolished: (polishedMarkdown: string, newTitle?: string, newDigest?: string, newTheme?: string) => void;
}

interface StyleConfig {
  id: PolishStyle;
  name: string;
  badge: string;
  icon: any;
  desc: string;
  tag: string;
}

const STYLES: StyleConfig[] = [
  {
    id: 'structured',
    name: '极客硬核·结构化精编',
    badge: '推荐',
    icon: Layers,
    desc: '严密逻辑分层、自动提炼核心导读与二级/三级标题、代码数据规范排版',
    tag: '深度技术/干货研报/教程',
  },
  {
    id: 'viral',
    name: '爆款干货·金句提炼',
    badge: '热门',
    icon: Flame,
    desc: '强化视觉抓眼点、提炼 2~3 条高光金句引用框、结尾增加读者互动与行动建议',
    tag: '行业思考/认知提升/商业洞察',
  },
  {
    id: 'literary',
    name: '优雅深度·人文纸书',
    badge: '质感',
    icon: BookOpen,
    desc: '文笔温润克制、段落留白舒适、雅致分割线、强化叙事沉浸感',
    tag: '个人成长/读书随笔/情感故事',
  },
  {
    id: 'minimal',
    name: '极简轻量·排版微修',
    badge: '保守',
    icon: Zap,
    desc: '严格保留原句与原汁原味，仅修复标点病句、盘古规范空格并梳理清晰大纲',
    tag: '口语笔记/会议速记/轻度校对',
  },
];

export const AiPolishModal: React.FC<AiPolishModalProps> = ({
  isOpen,
  onClose,
  currentMarkdown,
  onApplyPolished,
}) => {
  const [roughText, setRoughText] = useState(currentMarkdown || '');
  const [selectedStyle, setSelectedStyle] = useState<PolishStyle>('structured');
  const [customInstruction, setCustomInstruction] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PolishedDraftResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'metadata'>('preview');
  const [copied, setCopied] = useState(false);
  const [savedToDrafts, setSavedToDrafts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRoughText(currentMarkdown || '');
      setErrorMsg(null);
      setSavedToDrafts(false);
      setCopied(false);
    }
  }, [isOpen, currentMarkdown]);

  if (!isOpen) return null;

  const handleStartPolish = async () => {
    if (!roughText.trim()) {
      setErrorMsg('请在文本框中输入或粘贴需要润色的文章草稿或粗糙笔记');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Retrieve local AI config if user customized in settings
    let localAiConfig: any = {};
    try {
      const stored = localStorage.getItem('wechat_markdown_ai_config');
      if (stored) {
        localAiConfig = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }

    try {
      const res = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughContent: roughText,
          polishStyle: selectedStyle,
          customInstruction: customInstruction.trim() || undefined,
          provider: localAiConfig.provider,
          baseUrl: localAiConfig.baseUrl,
          apiKey: localAiConfig.apiKey,
          model: localAiConfig.model,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI 润色排版请求失败');
      }

      setResult(data.result);
      setActiveTab('preview');
    } catch (err: any) {
      setErrorMsg(err.message || '润色失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEditor = () => {
    if (!result) return;
    onApplyPolished(result.markdown, result.title, result.digest, result.theme);
    onClose();
  };

  const handleSaveAsLocalDraft = async () => {
    if (!result) return;
    try {
      const now = Date.now();
      await saveArticle({
        id: `draft_${now}_${Math.random().toString(36).slice(2, 7)}`,
        title: result.title || 'AI 润色排版草稿',
        markdown: result.markdown,
        theme: result.theme || 'default',
        author: result.author || '创作者',
        digest: result.digest || '',
        cover: '',
        wordCount: result.markdown.length,
        createdAt: now,
        updatedAt: now,
        tags: ['AI一键润色', selectedStyle],
      });
      setSavedToDrafts(true);
      setTimeout(() => setSavedToDrafts(false), 3000);
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">AI 粗稿一键排版润色</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Phase 3 高级生态
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                智能提炼核心大纲、注入高光金句、修复错漏病句与盘古排版规范
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#27272a]">
          {/* Left Column: Style Config & Input */}
          <div className="md:col-span-5 flex flex-col h-full bg-[#141416] p-5 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                1. 选择排版润色风格
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {STYLES.map((st) => {
                  const Icon = st.icon;
                  const isSelected = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/60 shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                          : 'bg-[#18181b] border-[#27272a] hover:border-zinc-700 hover:bg-[#202024]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-emerald-300' : 'text-zinc-200'}`}>
                            {st.name}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {st.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-1.5">{st.desc}</p>
                      <div className="text-[11px] text-zinc-500 font-mono">适用: {st.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Input area */}
            <div className="flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  2. 待润色原文 / 粗糙笔记 ({roughText.length} 字)
                </label>
                {currentMarkdown && roughText !== currentMarkdown && (
                  <button
                    onClick={() => setRoughText(currentMarkdown)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    重置为编辑器原文
                  </button>
                )}
              </div>
              <textarea
                value={roughText}
                onChange={(e) => setRoughText(e.target.value)}
                placeholder="在此粘贴未排版的文本、会议纪要、录音转写或口语初稿..."
                className="flex-1 w-full bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Custom Instruction Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>自定义提示词 / 润色要求</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="例如: 多保留生活化比喻、强调结尾读者行动引导、提炼4点干货..."
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleStartPolish}
              disabled={isLoading || !roughText.trim()}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 正在结构重组与精细润色中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>开始一键润色与排版升华</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Comparison & Result */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#18181b] overflow-hidden">
            {result ? (
              <div className="flex flex-col h-full">
                {/* Result Top Subheader */}
                <div className="px-5 py-3 border-b border-[#27272a] bg-[#1a1a1e] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === 'preview'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]'
                      }`}
                    >
                      排版预览
                    </button>
                    <button
                      onClick={() => setActiveTab('markdown')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === 'markdown'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]'
                      }`}
                    >
                      Markdown 源码
                    </button>
                    <button
                      onClick={() => setActiveTab('metadata')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === 'metadata'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#27272a]'
                      }`}
                    >
                      提炼摘要 & 变更点
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-[#27272a] hover:bg-[#323238] rounded flex items-center gap-1.5 transition-colors"
                      title="复制润色后的 Markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '已复制' : '复制代码'}</span>
                    </button>
                    <button
                      onClick={handleSaveAsLocalDraft}
                      className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-[#27272a] hover:bg-[#323238] rounded flex items-center gap-1.5 transition-colors"
                      title="另存为本地新文章"
                    >
                      {savedToDrafts ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCheck className="w-3.5 h-3.5" />}
                      <span>{savedToDrafts ? '已另存' : '另存为草稿'}</span>
                    </button>
                  </div>
                </div>

                {/* Stat pills bar */}
                <div className="px-5 py-2 bg-[#141416] border-b border-[#27272a] flex items-center justify-between text-xs text-zinc-400 overflow-x-auto gap-4">
                  <div className="flex items-center gap-4 shrink-0">
                    <span>
                      字数: <strong className="text-zinc-200">{result.stats.originalLength}</strong> →{' '}
                      <strong className="text-emerald-400">{result.stats.polishedLength}</strong>
                    </span>
                    <span>
                      大纲层级: <strong className="text-zinc-200">{result.stats.sectionsAdded}</strong> 个
                    </span>
                    <span>
                      金句卡片: <strong className="text-emerald-400">{result.stats.quotesExtracted}</strong> 条
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 shrink-0 font-mono">
                    模型: {result.modelUsed}
                  </div>
                </div>

                {/* Content body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'preview' && (
                    <div className="max-w-2xl mx-auto space-y-4">
                      {/* Title block */}
                      <div className="border-b border-[#27272a] pb-4">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                          AI 推荐标题
                        </span>
                        <h1 className="text-xl font-bold text-zinc-100 mt-1">{result.title}</h1>
                        {result.digest && (
                          <p className="text-xs text-zinc-400 mt-2 bg-[#202024] p-2.5 rounded border border-[#2e2e34] leading-relaxed">
                            <span className="text-zinc-300 font-semibold">导读摘要：</span>
                            {result.digest}
                          </p>
                        )}
                      </div>

                      {/* Rendered content */}
                      <div className="prose prose-invert prose-sm max-w-none space-y-3 font-sans leading-relaxed text-zinc-300">
                        {result.markdown.split('\n\n').map((paragraph, idx) => {
                          if (paragraph.startsWith('## ')) {
                            return (
                              <h2 key={idx} className="text-base font-bold text-emerald-400 border-l-2 border-emerald-500 pl-2 mt-4 mb-2">
                                {paragraph.replace(/^##\s+/, '')}
                              </h2>
                            );
                          }
                          if (paragraph.startsWith('### ')) {
                            return (
                              <h3 key={idx} className="text-sm font-semibold text-zinc-200 mt-3 mb-1">
                                {paragraph.replace(/^###\s+/, '')}
                              </h3>
                            );
                          }
                          if (paragraph.startsWith('> ')) {
                            return (
                              <blockquote
                                key={idx}
                                className="border-l-4 border-emerald-500 bg-emerald-500/10 px-4 py-2.5 rounded-r text-xs text-emerald-200 my-3 font-medium"
                              >
                                {paragraph.replace(/^>\s*/gm, '')}
                              </blockquote>
                            );
                          }
                          return (
                            <p key={idx} className="text-xs text-zinc-300 leading-relaxed">
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'markdown' && (
                    <textarea
                      readOnly
                      value={result.markdown}
                      className="w-full h-full bg-[#121214] border border-[#27272a] rounded-lg p-4 font-mono text-xs text-zinc-200 resize-none leading-relaxed focus:outline-none"
                    />
                  )}

                  {activeTab === 'metadata' && (
                    <div className="space-y-5 max-w-2xl mx-auto text-xs">
                      <div>
                        <h3 className="text-zinc-400 uppercase font-mono tracking-wider mb-2 font-semibold">
                          推荐文章元数据
                        </h3>
                        <div className="bg-[#141416] border border-[#27272a] rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-zinc-500 block mb-0.5">文章标题:</span>
                            <span className="text-sm font-medium text-zinc-100">{result.title}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block mb-0.5">摘要 (用于列表页/消息推送卡片):</span>
                            <span className="text-zinc-300 leading-relaxed">{result.digest}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block mb-0.5">推荐主题风格:</span>
                            <span className="text-emerald-400 font-mono">{result.theme}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-zinc-400 uppercase font-mono tracking-wider mb-2 font-semibold">
                          结构重构 & 润色亮点清单
                        </h3>
                        <div className="bg-[#141416] border border-[#27272a] rounded-lg p-4">
                          <ul className="space-y-2">
                            {result.summaryOfChanges.map((change, i) => (
                              <li key={i} className="flex items-start gap-2 text-zinc-300">
                                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result Bottom Action Bar */}
                <div className="px-6 py-3 border-t border-[#27272a] bg-[#141416] flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    润色满意？点击应用将直接覆盖并更新至主编辑器。
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleApplyToEditor}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>一键应用到当前编辑器</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state before running */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <div className="w-16 h-16 rounded-2xl bg-[#202024] border border-[#2e2e34] flex items-center justify-center text-zinc-400 mb-4">
                  <Sparkles className="w-8 h-8 text-emerald-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">等待开始 AI 排版润色</h3>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
                  在左侧选择您偏好的风格模型，点击「开始一键润色与排版升华」，即可在此实时对比查看重组后的大纲、金句卡片与排版效果。
                </p>
                <div className="grid grid-cols-2 gap-3 text-left max-w-md w-full">
                  <div className="p-3 bg-[#141416] border border-[#27272a] rounded-lg">
                    <div className="text-xs font-medium text-zinc-200 mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>结构分层与提炼</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">自动解析核心论点，梳理二级与三级小标题，提炼核心摘要</p>
                  </div>
                  <div className="p-3 bg-[#141416] border border-[#27272a] rounded-lg">
                    <div className="text-xs font-medium text-zinc-200 mb-1 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>爆款金句高亮</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">将关键洞察与发人深省之语提炼为独立引用块，提高读者停留时长</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
