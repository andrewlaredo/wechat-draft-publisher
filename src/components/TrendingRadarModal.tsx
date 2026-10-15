import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  Flame,
  Search,
  Star,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  Plus,
  BookOpen,
  Filter,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { TRENDING_ITEMS, TrendingItem, TrendingAngle } from '../data/trendingTopics.ts';
import {
  getStoredFavoriteTrends,
  toggleFavoriteTrend,
  buildArticleOutlineFromTrend,
  scheduleTrendToCalendar,
} from '../utils/trendingManager.ts';

interface TrendingRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: string;
  onApplyOutline: (markdown: string, title: string) => void;
  onOpenCalendar?: () => void;
}

export const TrendingRadarModal: React.FC<TrendingRadarModalProps> = ({
  isOpen,
  onClose,
  author,
  onApplyOutline,
  onOpenCalendar,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('tr-wx-1');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getStoredFavoriteTrends());
  const [copiedAngleIndex, setCopiedAngleIndex] = useState<number | null>(null);
  const [scheduledNotice, setScheduledNotice] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    return TRENDING_ITEMS.filter((item) => {
      // Source / Favorite filter
      if (selectedSource === 'favorites') {
        if (!favoriteIds.includes(item.id)) return false;
      } else if (selectedSource !== 'all' && item.source !== selectedSource) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesTag = item.tag.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesTag;
      }
      return true;
    });
  }, [selectedSource, searchQuery, favoriteIds]);

  const activeTopic = useMemo(() => {
    return (
      TRENDING_ITEMS.find((t) => t.id === selectedTopicId) ||
      filteredTopics[0] ||
      TRENDING_ITEMS[0]
    );
  }, [selectedTopicId, filteredTopics]);

  const handleToggleFav = (id: string) => {
    const updated = toggleFavoriteTrend(id);
    setFavoriteIds(updated);
  };

  const handleApplyAngle = (angle: TrendingAngle) => {
    const outline = buildArticleOutlineFromTrend(activeTopic, angle, author);
    onApplyOutline(outline, angle.title);
    onClose();
  };

  const handleCopyAngleOutline = (angle: TrendingAngle, idx: number) => {
    const outline = buildArticleOutlineFromTrend(activeTopic, angle, author);
    navigator.clipboard.writeText(outline);
    setCopiedAngleIndex(idx);
    setTimeout(() => setCopiedAngleIndex(null), 2000);
  };

  const handleScheduleAngle = (angle: TrendingAngle) => {
    // default schedule tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    scheduleTrendToCalendar(activeTopic, angle, dateStr, '默认公众号');
    setScheduledNotice(`已将《${angle.title}》安排至明日 (${dateStr}) 运营日历！`);
    setTimeout(() => setScheduledNotice(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 text-white shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">全网实时热点雷达与爆款选题中心</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                  实时聚合 · 3 大立意角度派生 · 一键生成大纲
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                追踪微信公域推荐、知乎热榜、36氪与 GitHub 开源风向，告别“不知道写什么”的选题焦虑
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

        {/* Source Tabs & Search */}
        <div className="px-5 py-3 bg-neutral-950/50 border-b border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0 text-xs">
          {/* Source Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {[
              { id: 'all', label: '全部热榜' },
              { id: 'wechat', label: '微信看一看' },
              { id: 'zhihu', label: '知乎热榜' },
              { id: 'tech36kr', label: '36氪商业' },
              { id: 'github', label: 'GitHub趋势' },
              { id: 'evergreen', label: '常青爆款库' },
              { id: 'favorites', label: `⭐ 收藏夹 (${favoriteIds.length})` },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSource(s.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
                  selectedSource === s.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索热点关键词或领域..."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Notice alert */}
        {scheduledNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 px-5 py-2 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{scheduledNotice}</span>
            </div>
            {onOpenCalendar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCalendar();
                }}
                className="underline hover:text-white"
              >
                前往运营日历查看 ➔
              </button>
            )}
          </div>
        )}

        {/* Main Work Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left: Trending Topics List (5 cols) */}
          <div className="lg:col-span-5 p-4 border-r border-neutral-800 overflow-y-auto bg-neutral-950/30 space-y-2.5">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1 mb-1 flex items-center justify-between">
              <span>热度风向标榜单 ({filteredTopics.length})</span>
              <span className="text-[10px] text-neutral-500">分钟级热度刷新</span>
            </div>

            {filteredTopics.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-800 rounded-xl">
                <Compass className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">暂无匹配的热点，尝试更换分类或清空搜索</p>
              </div>
            ) : (
              filteredTopics.map((topic, i) => {
                const isSelected = topic.id === activeTopic.id;
                const isFav = favoriteIds.includes(topic.id);
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-left relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-850 border-neutral-750 hover:border-neutral-600 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                            i === 0 ? 'bg-red-950 text-red-400 border border-red-800' :
                            i === 1 ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                            i === 2 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-neutral-800 text-neutral-400'
                          }`}>
                            0{i + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                            {topic.sourceName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            🔥 {topic.heat}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFav(topic.id);
                          }}
                          className={`p-1 rounded text-neutral-400 hover:text-amber-400 transition ${
                            isFav ? 'text-amber-400' : ''
                          }`}
                          title={isFav ? '取消收藏' : '收藏选题'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-neutral-100 leading-snug line-clamp-2">
                        {topic.title}
                      </h4>

                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                        {topic.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-750/60 text-[10px] text-neutral-400">
                      <span>🏷️ {topic.tag}</span>
                      <span className="text-emerald-400 font-medium">
                        提供 {topic.angles.length} 个切入方案 ➔
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Deep Dive & 3 Angles Generator (7 cols) */}
          <div className="lg:col-span-7 p-5 overflow-y-auto bg-neutral-900/60 flex flex-col justify-between space-y-4">
            {/* Topic Overview Card */}
            <div className="space-y-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                  {activeTopic.badgeName} · {activeTopic.sourceName}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  全网综合热度: <strong className="text-amber-300 font-bold">{activeTopic.heat}</strong>
                </span>
              </div>

              <h3 className="text-base font-bold text-neutral-100 leading-snug">
                {activeTopic.title}
              </h3>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {activeTopic.summary}
              </p>

              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1 text-xs">
                <div>
                  <strong className="text-amber-400">核心冲突/看点：</strong>
                  <span className="text-neutral-300">{activeTopic.coreControversy}</span>
                </div>
                <div>
                  <strong className="text-blue-400">高共鸣目标受众：</strong>
                  <span className="text-neutral-400">{activeTopic.targetAudience}</span>
                </div>
              </div>
            </div>

            {/* Angle Solutions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>爆款立意切入角度推荐 ({activeTopic.angles.length})</span>
                </span>
                <span className="text-[11px] text-neutral-400">
                  可一键生成大纲直接进入写作
                </span>
              </div>

              <div className="space-y-3">
                {activeTopic.angles.map((angle, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-850 border border-neutral-750 hover:border-amber-600/70 transition shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-amber-300 border border-neutral-700">
                        {angle.styleName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        方案 0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-neutral-100 leading-snug">
                      {angle.title}
                    </h4>

                    {/* Hook statement */}
                    <div className="text-xs text-amber-300/90 italic bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                      <strong>开篇吸睛钩子：</strong>{angle.hook}
                    </div>

                    {/* Outline tree preview */}
                    <div className="text-xs text-neutral-300 space-y-1 bg-neutral-900/40 p-2 rounded-lg">
                      <div className="text-[11px] font-semibold text-neutral-400">核心结构大纲：</div>
                      {angle.outline.map((pt, pIdx) => (
                        <div key={pIdx} className="text-[11px] text-neutral-400 pl-2 border-l border-neutral-700">
                          {pt}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons for this angle */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-neutral-750 gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCopyAngleOutline(angle, idx)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs transition flex items-center gap-1"
                        >
                          {copiedAngleIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">已复制大纲</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制代码</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleScheduleAngle(angle)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs transition flex items-center gap-1"
                          title="将此立意一键安排至运营日历排期"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>加入排期</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyAngle(angle)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>以此立意一键载入写作</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
