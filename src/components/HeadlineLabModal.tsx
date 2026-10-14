import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Smartphone,
  Eye,
  MessageSquare,
  Share2,
  Bookmark,
  Star,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  diagnoseHeadline,
  generateViralHeadlines,
  extractCoreTopic,
  getVisualCharWeight,
  ViralTitleTemplate,
  HeadlineDiagnosticResult,
} from '../utils/headlineAnalyzer.ts';

interface HeadlineLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  author: string;
  digest: string;
  coverUrl?: string;
  onApplyTitle: (newTitle: string) => void;
}

export const HeadlineLabModal: React.FC<HeadlineLabModalProps> = ({
  isOpen,
  onClose,
  currentTitle: initialTitle,
  author,
  digest,
  coverUrl,
  onApplyTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'formulas' | 'ab_test'>('diagnostic');
  const [testTitle, setTestTitle] = useState<string>(initialTitle || '');
  const [topicSeed, setTopicSeed] = useState<string>(() => {
    return extractCoreTopic(initialTitle || '').topic;
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [savedFavorites, setSavedFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wechat_headline_favorites_v1') || '[]');
    } catch {
      return [];
    }
  });

  // Keep testTitle and topicSeed in sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setTestTitle(initialTitle || '');
      const extracted = extractCoreTopic(initialTitle || '').topic;
      if (extracted) {
        setTopicSeed(extracted);
      }
    }
  }, [isOpen, initialTitle]);

  // Diagnostic result
  const diagnosis: HeadlineDiagnosticResult = useMemo(() => {
    return diagnoseHeadline(testTitle);
  }, [testTitle]);

  // Viral formulas - derived cleanly from topicSeed to prevent recursive nesting/stacking
  const viralFormulas = useMemo(() => {
    return generateViralHeadlines(topicSeed || testTitle || initialTitle, digest);
  }, [topicSeed, testTitle, initialTitle, digest]);

  const handleInspectTitle = (titleToInspect: string) => {
    setTestTitle(titleToInspect);
    setActiveTab('diagnostic');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApply = (titleToApply: string) => {
    onApplyTitle(titleToApply);
    onClose();
  };

  const handleToggleFavorite = (titleToFav: string) => {
    setSavedFavorites((prev) => {
      let updated: string[];
      if (prev.includes(titleToFav)) {
        updated = prev.filter((t) => t !== titleToFav);
      } else {
        updated = [titleToFav, ...prev];
      }
      try {
        localStorage.setItem('wechat_headline_favorites_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  if (!isOpen) return null;

  const scoreBadgeColor =
    diagnosis.overallScore >= 90
      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
      : diagnosis.overallScore >= 75
      ? 'bg-amber-950 text-amber-300 border-amber-800'
      : 'bg-rose-950 text-rose-300 border-rose-800';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 text-white shadow-md">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">爆款标题实验室与截断诊断</h2>
                <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${scoreBadgeColor}`}>
                  综合得分: {diagnosis.overallScore} · {diagnosis.level}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                实时模拟微信订阅号常读流、对话转发与朋友圈卡片截断，生成 6 大爆款体系高转化标题
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

        {/* Input Bar & Score Summary */}
        <div className="p-4 bg-neutral-950/50 border-b border-neutral-800 flex flex-col gap-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="input-headline-test"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="输入待诊断或打磨的文章标题..."
                className="w-full bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
              />
              <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-mono">
                {testTitle.length} 字 (汉字 {diagnosis.wordCountChinese})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleApply(testTitle)}
                disabled={!testTitle.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                title="应用此标题到当前正在编写的文章"
              >
                <Check className="w-4 h-4" />
                <span>应用为文章标题</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(testTitle)}
                className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs transition flex items-center gap-1"
                title="复制当前标题"
              >
                {copiedText === testTitle ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">复制</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-t border-neutral-850 pt-2 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('diagnostic')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  activeTab === 'diagnostic'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>📱 微信三端真实截断模拟</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('formulas')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  activeTab === 'formulas'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>💡 6 大爆款标题公式库 ({viralFormulas.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ab_test')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  activeTab === 'ab_test'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>⭐ A/B 标题对比候选池 ({savedFavorites.length})</span>
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-neutral-400 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 推荐 14-26 字
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 28 字以上折行
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* TAB 1: 真实截断模拟与健康诊断 */}
          {activeTab === 'diagnostic' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: 3 WeChat Scenarios Mockups */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>微信真机多场景视觉截断模拟</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    微信客户端最新卡片比例渲染
                  </span>
                </div>

                {/* Scenario 1: 订阅号消息列表大卡片 */}
                <div className="bg-neutral-850 border border-neutral-750 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5 pb-2 border-b border-neutral-750">
                    <span className="font-semibold text-neutral-300">场景 1：微信订阅号常读大卡片 (订阅号消息列表)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${diagnosis.truncation.feedCard.isTruncated ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {diagnosis.truncation.feedCard.isTruncated ? '⚠️ 末尾折断' : '✅ 完整显示'}
                    </span>
                  </div>

                  {/* Feed Card Visual */}
                  <div className="bg-[#1f1f1f] text-white rounded-lg overflow-hidden border border-neutral-700/80 max-w-sm mx-auto shadow-md">
                    {/* Cover Header */}
                    <div className="relative h-36 bg-gradient-to-r from-neutral-800 to-neutral-750 flex items-center justify-center overflow-hidden">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3">
                          <span className="text-2xl">📰</span>
                          <div className="text-xs text-neutral-400 mt-1">2.35:1 微信大封面展示区</div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-3">
                        <p className="text-sm font-bold text-white leading-snug drop-shadow-sm line-clamp-2">
                          {diagnosis.truncation.feedCard.displayTitle}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#242424] flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{author || '微信公众号作者'}</span>
                      <span>今天 19:30</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 mt-2.5 leading-relaxed">
                    💡 <strong>截断规律：</strong>大卡片在封面底部遮罩渲染，单行限制约 14 汉字，超过则换行；超过两行后尾部将以省略号强制截断。建议将<strong>最吸引人的利益词放在前 14 个字</strong>内！
                  </p>
                </div>

                {/* Scenario 2: 微信单聊/群聊转发小卡片 */}
                <div className="bg-neutral-850 border border-neutral-750 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5 pb-2 border-b border-neutral-750">
                    <span className="font-semibold text-neutral-300">场景 2：微信好友/群聊转发图文小卡片</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${diagnosis.truncation.chatCard.isTruncated ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {diagnosis.truncation.chatCard.isTruncated ? '⚠️ 两行超限' : '✅ 完美展示'}
                    </span>
                  </div>

                  {/* Chat Message Bubble Mockup */}
                  <div className="bg-[#ededed] p-4 rounded-xl flex justify-start">
                    <div className="bg-white rounded-lg p-3 max-w-[290px] shadow-sm border border-neutral-300/80">
                      <div className="text-[13px] font-bold text-neutral-900 leading-snug line-clamp-2 mb-1.5">
                        {diagnosis.truncation.chatCard.displayTitle}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-neutral-500 line-clamp-2 flex-1 leading-relaxed">
                          {digest || '点击阅读全文，查看深度实战剖析与排版分发技巧...'}
                        </p>
                        <div className="w-12 h-12 rounded bg-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Thumb" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">📄</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>微信公众号</span>
                        <span>图文消息</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario 3: 朋友圈图文分享 */}
                <div className="bg-neutral-850 border border-neutral-750 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 pb-2 border-b border-neutral-750">
                    <span className="font-semibold text-neutral-300">场景 3：微信朋友圈分享链接卡片</span>
                    <span className="text-[10px] text-neutral-400">单行视觉截断点约 20 字符</span>
                  </div>

                  <div className="bg-[#ededed] p-3 rounded-xl">
                    <div className="bg-[#f7f7f7] p-2 rounded border border-neutral-300 flex items-center gap-2.5 max-w-[320px]">
                      <div className="w-10 h-10 rounded bg-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Thumb" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">🌟</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-900 truncate">
                          {diagnosis.truncation.momentsCard.displayTitle}
                        </p>
                        <span className="text-[10px] text-neutral-400 block truncate">
                          {author || '微信公众号'} · 深度推荐
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Diagnostic Scores & Actionable Tips */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-neutral-850 border border-neutral-750 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-750">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">标题多维诊断打分</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">微信公域推荐算法与点击率模型</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {diagnosis.overallScore}
                      </span>
                      <span className="text-xs text-neutral-400"> / 100</span>
                    </div>
                  </div>

                  {/* Score Breakdown List */}
                  <div className="mt-3.5 space-y-3">
                    {diagnosis.scoreItems.map((item) => (
                      <div key={item.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                            {item.status === 'good' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : item.status === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-red-400" />
                            )}
                            {item.label}
                          </span>
                          <span className="font-mono text-neutral-400">{item.score} / 20</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'good'
                                ? 'bg-emerald-500'
                                : item.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(item.score / 20) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Highlights */}
                {diagnosis.keyHighlights.length > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-3.5">
                    <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>亮点优势</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {diagnosis.keyHighlights.map((hl, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[11px] border border-emerald-700/60">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {diagnosis.suggestions.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3.5">
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>优化提升建议</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside">
                      {diagnosis.suggestions.map((sug, i) => (
                        <li key={i} className="text-[11px] leading-relaxed">{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 6 大爆款标题公式库 */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>基于核心主题生成的 6 大经典爆款标题体系</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    涵盖数字利益、痛点避坑、好奇悬念、权威背书、认知重塑与第一人称故事
                  </p>
                </div>
              </div>

              {/* 核心主题输入与提纯控制栏 (防止嵌套叠加) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-neutral-300 whitespace-nowrap flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>当前公式衍生核心主题：</span>
                  </span>
                  <input
                    type="text"
                    value={topicSeed}
                    onChange={(e) => setTopicSeed(e.target.value)}
                    placeholder="输入主题关键词（如：微信自动化排版、副业变现）..."
                    className="bg-neutral-900 text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-neutral-700 focus:outline-none focus:border-amber-500 flex-1 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const { topic } = extractCoreTopic(testTitle);
                    setTopicSeed(topic);
                  }}
                  className="text-[11px] text-neutral-300 hover:text-neutral-100 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 whitespace-nowrap flex items-center justify-center gap-1.5 transition"
                  title="从当前输入的测试标题中自动提纯提取纯净核心主题，拒绝套壳叠加"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>提纯提取主题</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {viralFormulas.map((tpl, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-850 hover:bg-neutral-800/90 border border-neutral-750 hover:border-amber-700/60 rounded-xl p-4 transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 border border-neutral-700 text-amber-300">
                          {tpl.categoryName}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {tpl.title.length} 字符
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-100 leading-snug mb-2 select-all">
                        {tpl.title}
                      </h4>

                      <div className="text-[11px] text-neutral-400 space-y-1 mb-3 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
                        <div>
                          <strong className="text-neutral-300">底层公式：</strong>{tpl.formula}
                        </div>
                        <div className="text-emerald-400">
                          <strong>核心优势：</strong>{tpl.advantage}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-750">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(tpl.title)}
                          className={`p-1.5 rounded-lg border transition ${
                            savedFavorites.includes(tpl.title)
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-amber-300'
                          }`}
                          title={savedFavorites.includes(tpl.title) ? '取消收藏' : '加入 A/B 候选池'}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectTitle(tpl.title)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs transition flex items-center gap-1 hover:border-amber-600/70"
                          title="将此标题载入诊断框并立即进入三端截断模拟分析"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>诊断分析</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(tpl.title)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs transition flex items-center gap-1"
                        >
                          {copiedText === tpl.title ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>复制</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApply(tpl.title)}
                          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>一键采用</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: A/B 测试收藏夹 */}
          {activeTab === 'ab_test' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>A/B 测试候选标题池</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    在正式发布前收录并对比备选标题，挑选点击转化率最高方案
                  </p>
                </div>
                {savedFavorites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSavedFavorites([]);
                      localStorage.removeItem('wechat_headline_favorites_v1');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    清空对比池
                  </button>
                )}
              </div>

              {savedFavorites.length === 0 ? (
                <div className="text-center py-12 bg-neutral-850/60 rounded-xl border border-dashed border-neutral-800">
                  <Bookmark className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">
                    暂无收藏的候选标题。请在「6 大爆款标题公式库」中点击星标 ⭐ 收藏加入！
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedFavorites.map((fav, i) => (
                    <div
                      key={i}
                      className="bg-neutral-850 border border-neutral-750 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-amber-700/60 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-100">{fav}</p>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {fav.length} 字符 · 视觉权重 {getVisualCharWeight(fav)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInspectTitle(fav)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs border border-neutral-700 transition flex items-center gap-1 hover:border-amber-600/70"
                          title="放入诊断框并立即查看三端截断模拟"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>放入诊断</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(fav)}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs border border-neutral-700 transition"
                          title="复制标题"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApply(fav)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>采用此标题</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(fav)}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 transition"
                          title="移出候选池"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
