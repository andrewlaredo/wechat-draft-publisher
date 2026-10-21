import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Sparkles,
  CheckCircle,
  FileText,
  Send,
  Radio,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Flame,
  Clock,
  Eye,
  Sliders,
  Play,
} from 'lucide-react';
import { TRENDING_ITEMS, TrendingItem, TrendingAngle } from '../data/trendingTopics.ts';
import {
  executeTrendToDraftPipeline,
  TrendToDraftResult,
} from '../utils/trendToDraftPipeline.ts';
import { upsertEditorialTask } from '../utils/editorialManager.ts';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface TrendToDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrend?: TrendingItem | null;
  initialAngle?: TrendingAngle | null;
  authorName?: string;
  onLoadIntoEditor: (markdown: string, title: string, cover: string, digest: string) => void;
  onOpenMatrixBroadcast?: () => void;
  onOpenCalendar?: () => void;
  showToast?: (msg: string) => void;
}

export const TrendToDraftModal: React.FC<TrendToDraftModalProps> = ({
  isOpen,
  onClose,
  initialTrend,
  initialAngle,
  authorName = '创作者',
  onLoadIntoEditor,
  onOpenMatrixBroadcast,
  onOpenCalendar,
  showToast,
}) => {
  const [selectedTrend, setSelectedTrend] = useState<TrendingItem>(() => {
    return initialTrend || TRENDING_ITEMS[0];
  });

  const [selectedAngle, setSelectedAngle] = useState<TrendingAngle>(() => {
    return initialAngle || (initialTrend ? initialTrend.angles[0] : TRENDING_ITEMS[0].angles[0]);
  });

  const [toneStyle, setToneStyle] = useState<'tech_depth' | 'business_insight' | 'guide_tutorial' | 'quick_brief'>('tech_depth');
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium');

  // Pipeline states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentStepName, setCurrentStepName] = useState<string>('');
  const [currentStepDetail, setCurrentStepDetail] = useState<string>('');
  const [result, setResult] = useState<TrendToDraftResult | null>(null);
  const [isInstantPublishing, setIsInstantPublishing] = useState<boolean>(false);
  const [publishedMediaId, setPublishedMediaId] = useState<string | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialTrend) {
      setSelectedTrend(initialTrend);
      setSelectedAngle(initialAngle || initialTrend.angles[0]);
    }
  }, [initialTrend, initialAngle]);

  const handleStartPipeline = async () => {
    setIsRunning(true);
    setResult(null);
    setPublishedMediaId(null);

    try {
      const generated = await executeTrendToDraftPipeline({
        trend: selectedTrend,
        angle: selectedAngle,
        toneStyle,
        targetLength,
        authorName,
        onStepProgress: (step, _total, name, detail) => {
          setCurrentStep(step);
          setCurrentStepName(name);
          setCurrentStepDetail(detail);
        },
      });

      setResult(generated);
      showToast?.('🎉 热点生文全自动流水线执行完毕！');
    } catch (err: any) {
      showToast?.(`流水线异常: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyToEditor = () => {
    if (!result) return;
    onLoadIntoEditor(result.markdown, result.title, result.cover, result.digest);
    showToast?.(`📝 已成功将《${result.title}》装载至主工作台！`);
    onClose();
  };

  const handleInstantPublishToDraft = async () => {
    if (!result) return;
    setIsInstantPublishing(true);

    try {
      const res = await safeFetchJson('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: result.markdown,
          dryRun: false,
          force: true,
          articleType: 'news',
          titleOverride: result.title,
          authorOverride: result.author,
          digestOverride: result.digest,
          coverOverride: result.cover,
          theme: result.theme,
        }),
      });

      if (res.ok && res.data?.success) {
        const mediaId = res.data.result?.media_id || `sim_${Date.now()}`;
        setPublishedMediaId(mediaId);

        // Record in editorial task manager
        upsertEditorialTask({
          title: result.title,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          accountId: 'default',
          accountName: '主号公众号',
          accountTag: '热点直推',
          status: 'published',
          category: 'industry',
          markdown: result.markdown,
          digest: result.digest,
          coverUrl: result.cover,
          mediaId,
          targetPlatforms: ['微信公众号草稿箱'],
          wordCount: result.stats.words,
        });

        showToast?.('🚀 已成功秒级推送到微信公众号草稿箱！');
      } else {
        showToast?.(`推送失败: ${res.data?.error || res.error || '接口异常'}`);
      }
    } catch (err: any) {
      showToast?.(`网络通讯故障: ${err.message}`);
    } finally {
      setIsInstantPublishing(false);
    }
  };

  const handleScheduleToCalendar = () => {
    if (!result) return;
    upsertEditorialTask({
      title: result.title,
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      accountId: 'default',
      accountName: '主号公众号',
      accountTag: '热点排期',
      status: 'planned',
      category: 'industry',
      markdown: result.markdown,
      digest: result.digest,
      coverUrl: result.cover,
      targetPlatforms: ['微信公众号'],
      wordCount: result.stats.words,
    });
    showToast?.('📅 已加入运营日历排期任务看板！');
    onClose();
    onOpenCalendar?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">一键热点生文全自动流水线 (Trend-to-Draft)</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-medium">
                  全闭环自动化
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                从全网热点情报 ➔ 立意提炼 ➔ 深度正文 ➔ 商用配图容器 ➔ 微信物料沙盒 ➔ 一键直通草稿箱全自动落地。
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
          {/* Section 1: Selected Trending Intelligence Card */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {selectedTrend.sourceName}
                </span>
                <span className="font-bold text-sm text-neutral-100">{selectedTrend.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                  🔥 热度: {selectedTrend.heat}
                </span>
              </div>

              {/* Trend selector dropdown if want to switch */}
              <select
                value={selectedTrend.id}
                onChange={(e) => {
                  const t = TRENDING_ITEMS.find((item) => item.id === e.target.value);
                  if (t) {
                    setSelectedTrend(t);
                    setSelectedAngle(t.angles[0]);
                  }
                }}
                className="bg-neutral-900 border border-neutral-750 text-neutral-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                {TRENDING_ITEMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.sourceName}] {t.title.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              {selectedTrend.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-400 border-t border-neutral-800/80">
              <span>🎯 核心受众：{selectedTrend.targetAudience}</span>
              <span>⚡ 核心看点：{selectedTrend.coreControversy}</span>
            </div>
          </div>

          {/* Section 2: Angle Strategy Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>选择切入立意与派生方案：</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedTrend.angles.map((ang) => (
                <div
                  key={ang.title}
                  onClick={() => setSelectedAngle(ang)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    selectedAngle.title === ang.title
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-amber-300">
                        {ang.styleName}
                      </span>
                      <span className="font-bold text-xs text-neutral-100">{ang.title}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 italic">
                      "{ang.hook}"
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800/60 text-[10px] text-neutral-500 flex items-center justify-between">
                    <span>包含 {ang.outline.length} 个结构小节</span>
                    {selectedAngle.title === ang.title && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>已选定立意</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Style & Configuration Settings */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>流水线参数定制：</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tone Style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-400">
                  行文风格与叙事语调：
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'tech_depth', label: '🚀 深度专业内参' },
                    { id: 'business_insight', label: '💡 商业认知破局' },
                    { id: 'guide_tutorial', label: '🛠️ 新手避坑指南' },
                    { id: 'quick_brief', label: '⚡ 极简热点速递' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setToneStyle(item.id as any)}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        toneStyle === item.id
                          ? 'bg-blue-950 border-blue-500 text-blue-200 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length & Elements */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-neutral-400">
                  目标篇幅与装载组件：
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'short', label: '精炼速览 (~1200字)' },
                    { id: 'medium', label: '标准长文 (~1800字)' },
                  ].map((len) => (
                    <button
                      key={len.id}
                      type="button"
                      onClick={() => setTargetLength(len.id as any)}
                      className={`p-2 rounded-lg border text-center text-xs transition ${
                        targetLength === len.id
                          ? 'bg-blue-950 border-blue-500 text-blue-200 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {len.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-neutral-400 pt-1 flex items-center gap-2">
                  <span className="text-emerald-400">✓ 自动匹配商用配图</span>
                  <span>·</span>
                  <span className="text-emerald-400">✓ 注入金句沙盒物料</span>
                  <span>·</span>
                  <span className="text-emerald-400">✓ 盘古空格美化</span>
                </div>
              </div>
            </div>

            {/* Pipeline Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartPipeline}
                disabled={isRunning}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>流水线高速运转中：步骤 {currentStep} - {currentStepName}...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>立即启动全自动流水线：秒级生成整篇高质推文</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Running Progress Bar if active */}
          {isRunning && (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>流水线处理中：{currentStepName}</span>
                </span>
                <span className="font-mono text-neutral-400">第 {currentStep} / 6 阶段</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-neutral-400">{currentStepDetail}</div>
            </div>
          )}

          {/* Section 4: Generated Result Card */}
          {result && (
            <div className="p-5 bg-gradient-to-b from-neutral-850 to-neutral-900 rounded-2xl border border-emerald-600/60 space-y-4 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-neutral-100">
                    整篇推文已全自动合成完毕！
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    合规得分: {result.safetyScore}分 (安全)
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 font-mono">
                  {result.stats.chars} 汉字 · 预估耗时 {result.stats.readingMinutes} 分钟 · 配图 {result.matchedPhotosCount} 张
                </div>
              </div>

              {/* Title & Preview Details */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-start gap-3">
                  {result.cover && (
                    <img
                      src={result.cover}
                      alt="封面"
                      className="w-24 h-16 object-cover rounded-lg border border-neutral-750 shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-neutral-100">{result.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2">{result.digest}</p>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      作者: {result.author} · 推荐色彩主题: {result.theme}
                    </div>
                  </div>
                </div>
              </div>

              {publishedMediaId && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                  <span>🚀 已推送到微信公众号草稿箱！Media ID: <code className="font-mono bg-black/40 px-1 py-0.5 rounded">{publishedMediaId}</code></span>
                </div>
              )}

              {/* Multi-action Delivery Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleApplyToEditor}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>载入主编辑器精修</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantPublishToDraft}
                  disabled={isInstantPublishing}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isInstantPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>一键秒推微信草稿箱</span>
                </button>

                <button
                  type="button"
                  onClick={handleScheduleToCalendar}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>排入运营日历看板</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>自动装配语义沙盒隔离块，符合微信公众号官方最新排版规范</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-750 text-xs font-medium transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
