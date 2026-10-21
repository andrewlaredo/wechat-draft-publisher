import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  TrendingUp,
  Hash,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Check,
  Compass,
  FileText,
  Copy,
  Lightbulb,
  ExternalLink,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  analyzeWechatSeo,
  injectHashtagsIntoMarkdown,
  WechatSeoReport,
} from '../utils/wechatSeoAnalyzer.ts';

interface WechatSeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  digest: string;
  markdown: string;
  onApplyTitle: (newTitle: string) => void;
  onApplyMarkdown: (newMarkdown: string) => void;
  showToast?: (msg: string) => void;
}

export const WechatSeoModal: React.FC<WechatSeoModalProps> = ({
  isOpen,
  onClose,
  title,
  digest,
  markdown,
  onApplyTitle,
  onApplyMarkdown,
  showToast,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);

  const report: WechatSeoReport = useMemo(() => {
    return analyzeWechatSeo({ title, markdown, digest });
  }, [title, markdown, digest]);

  // Initialize tags
  React.useEffect(() => {
    if (report.suggestedHashtags.length > 0) {
      setSelectedTags(report.suggestedHashtags);
    }
  }, [report.suggestedHashtags]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleInjectTags = () => {
    if (selectedTags.length === 0) {
      showToast?.('请先选择至少 1 个话题标签');
      return;
    }
    const updated = injectHashtagsIntoMarkdown(markdown, selectedTags);
    onApplyMarkdown(updated);
    showToast?.('🏷️ 已成功将微信 #话题标签 注入文末！');
  };

  const handleUseTitle = (recTitle: string) => {
    onApplyTitle(recTitle);
    showToast?.(`✨ 已将搜一搜优化标题应用为《${recTitle}》！`);
  };

  const handleCopyTitle = (recTitle: string, idx: number) => {
    navigator.clipboard.writeText(recTitle);
    setCopiedTitleIndex(idx);
    setTimeout(() => setCopiedTitleIndex(null), 2000);
    showToast?.('📋 已复制推荐标题！');
  };

  const scoreBadgeColor =
    report.score >= 90
      ? 'from-emerald-500 to-teal-600'
      : report.score >= 75
      ? 'from-amber-500 to-orange-600'
      : 'from-rose-500 to-red-600';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${scoreBadgeColor} text-white shadow-md`}>
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信搜一搜与看一看 SEO 优化中枢</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-medium">
                  公域自然流
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                深挖微信搜索核心权重机制，前置焦点词、意图词呼应、首段密度与话题标签全域穿透。
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Top Score & Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400">搜一搜健康分</span>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className="text-2xl font-bold text-cyan-400 font-mono">{report.score}</span>
                <span className="text-xs text-neutral-500">/ 100</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">{report.potentialRating}</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400">标题前置权重</span>
              <div className="flex items-center space-x-1.5 my-1">
                {report.titleFrontLoaded ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="text-sm font-bold text-neutral-200">
                  {report.titleFrontLoaded ? '前14字命中核心词' : '前置词偏弱'}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">前 14 字符算法权重最高</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400">首段关键词密度</span>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className="text-2xl font-bold text-amber-400 font-mono">
                  {report.firstParagraphKeywordDensity}%
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">建议在 30%~70% 之间</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400">看一看完读预估</span>
              <div className="flex items-baseline space-x-1.5 my-1">
                <span className="text-2xl font-bold text-purple-400 font-mono">
                  ~{report.readingMinutes}
                </span>
                <span className="text-xs text-neutral-400">分钟</span>
              </div>
              <span className="text-[10px] text-neutral-500">
                {report.headingsCount} 个二级小标题锚点
              </span>
            </div>
          </div>

          {/* Section 1: Title & Keyword Front-Loading */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-neutral-200">当前标题与搜索意图匹配</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                字数: {title.length} 字符
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-750 space-y-2">
              <div className="text-sm font-semibold text-neutral-100 break-words">
                {title || '（当前未设置文章标题）'}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-neutral-400">提炼核心词：</span>
                {report.titleKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono"
                  >
                    {kw}
                  </span>
                ))}
                {report.matchedIntents.length > 0 && (
                  <>
                    <span className="text-neutral-400 ml-2">命中意图：</span>
                    {report.matchedIntents.map((intent, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                      >
                        ✓ {intent}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* AI SEO Titles Recommendation */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>搜一搜高权重建议标题 (一键替换或参考)：</span>
                </span>
                <span className="text-[10px] text-neutral-500">契合高频长尾搜索词</span>
              </div>

              <div className="space-y-2">
                {report.recommendedTitles.map((recTitle, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-600/60 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-medium text-neutral-200 truncate">{recTitle}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        长尾优化方案 0{idx + 1} · 核心词前置 · 增强点击率
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyTitle(recTitle, idx)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs transition flex items-center gap-1"
                        title="复制此标题"
                      >
                        {copiedTitleIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedTitleIndex === idx ? '已复制' : '复制'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUseTitle(recTitle)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1"
                        title="将此标题应用到当前文章"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>选用</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: WeChat Hashtags Hub */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-neutral-200">
                  微信官方 #话题标签 智能推荐与一键注入
                </span>
              </div>
              <button
                type="button"
                onClick={handleInjectTags}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>一键将选定标签注入文末</span>
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              微信公众号正文文末添加 <b>#话题标签</b>，不仅会被自动转换为话题超链接，还会极大增强微信【搜一搜】专栏合辑与公域流量曝光权重。
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {report.suggestedHashtags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-xs'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>#{tag}</span>
                    {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Diagnostic Issues & Preflight Recommendations */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-neutral-200">
                  算法体验诊断项 ({report.issues.length})
                </span>
              </div>
              <span className="text-[11px] text-neutral-500">基于公众号公域推荐模型</span>
            </div>

            {report.issues.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>太棒了！当前文章在微信搜一搜与看一看算法中各项指标均表现优异。</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      issue.type === 'critical'
                        ? 'bg-rose-950/20 border-rose-800/80'
                        : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {issue.type === 'critical' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-xs text-neutral-100">{issue.title}</span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed pl-6">
                      {issue.description}
                    </p>
                    <div className="text-[11px] text-cyan-300/90 pl-6 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{issue.suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
