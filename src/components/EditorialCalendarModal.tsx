import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Download,
  Upload,
  BarChart3,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Bookmark,
  Share2,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  EditorialTask,
  getStoredEditorialTasks,
  saveEditorialTasks,
  upsertEditorialTask,
  deleteEditorialTask,
  getEditorialStatistics,
  exportEditorialCsv,
  exportEditorialJson,
  importEditorialJson,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '../utils/editorialManager.ts';
import { WeChatAccountConfig } from '../utils/accountManager.ts';

interface EditorialCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: WeChatAccountConfig[];
  currentEditorArticle?: {
    title: string;
    author: string;
    markdown: string;
    digest: string;
    cover?: string;
  };
  onLoadTaskIntoEditor: (task: EditorialTask) => void;
}

export const EditorialCalendarModal: React.FC<EditorialCalendarModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentEditorArticle,
  onLoadTaskIntoEditor,
}) => {
  const [tasks, setTasks] = useState<EditorialTask[]>(() => getStoredEditorialTasks());
  const [activeTab, setActiveTab] = useState<'calendar' | 'archive' | 'stats'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<EditorialTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter in archive tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Form state for task create / edit
  const [formTask, setFormTask] = useState<Partial<EditorialTask>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    accountId: accounts[0]?.id || 'default',
    accountName: accounts[0]?.name || '主号公众号',
    category: 'tech',
    status: 'planned',
    digest: '',
    targetPlatforms: ['微信公众号'],
    notes: '',
  });

  // KPI Stats
  const stats = useMemo(() => {
    return getEditorialStatistics(tasks);
  }, [tasks]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const monthTitle = `${year}年 ${month + 1}月`;

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered tasks in archive tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchQuery =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.digest && t.digest.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.accountName && t.accountName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAccount =
        selectedAccountFilter === 'all' || t.accountId === selectedAccountFilter;

      const matchStatus =
        selectedStatusFilter === 'all' || t.status === selectedStatusFilter;

      return matchQuery && matchAccount && matchStatus;
    });
  }, [tasks, searchQuery, selectedAccountFilter, selectedStatusFilter]);

  // Handle open create for specific date
  const handleOpenCreateForDate = (dateStr: string) => {
    setFormTask({
      id: undefined,
      title: '',
      date: dateStr,
      time: '20:00',
      accountId: accounts[0]?.id || 'default',
      accountName: accounts[0]?.name || '主号公众号',
      category: 'tech',
      status: 'planned',
      digest: '',
      targetPlatforms: ['微信公众号'],
      notes: '',
      markdown: '',
      wordCount: 0,
    });
    setIsCreateModalOpen(true);
  };

  // Fill from current editor
  const handleFillFromEditor = () => {
    if (!currentEditorArticle) return;
    setFormTask((prev) => ({
      ...prev,
      title: currentEditorArticle.title || prev.title,
      digest: currentEditorArticle.digest || prev.digest,
      markdown: currentEditorArticle.markdown || prev.markdown,
      coverUrl: currentEditorArticle.cover || prev.coverUrl,
      wordCount: currentEditorArticle.markdown?.length || 0,
    }));
  };

  // Save task
  const handleSaveFormTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTask.title?.trim() || !formTask.date) return;

    const acc = accounts.find((a) => a.id === formTask.accountId) || accounts[0];
    const saved = upsertEditorialTask({
      ...formTask,
      title: formTask.title.trim(),
      date: formTask.date,
      accountName: acc?.name || formTask.accountName || '微信公众号',
      accountTag: acc?.tag || '主号',
    });

    setTasks(getStoredEditorialTasks());
    setIsCreateModalOpen(false);
    setSelectedTask(saved);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    deleteEditorialTask(id);
    setTasks(getStoredEditorialTasks());
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importEditorialJson(content);
        if (res.success) {
          setTasks(getStoredEditorialTasks());
          alert(res.message);
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow-md">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">运营日历与发文资产档案管理</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-950 border border-blue-800 text-blue-300 font-medium">
                  共收录 {tasks.length} 篇排期与资产
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                全生命周期追踪微信与矩阵账号发布计划，直观月历甘特看板与一键载入编辑
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

        {/* Action Bar: Stats Summary, Navigation Tabs, Export Buttons */}
        <div className="px-5 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>📅 月度排期日历</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'archive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📚 资产全量档案库 ({tasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 运营数据看板</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => handleOpenCreateForDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建排期任务</span>
            </button>

            <button
              type="button"
              onClick={() => exportEditorialCsv(tasks)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition flex items-center space-x-1"
              title="导出排期台账为 Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出 CSV</span>
            </button>

            <label
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition flex items-center space-x-1 cursor-pointer"
              title="导入历史排期 JSON 备份"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导入</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* TAB 1: Calendar View */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Calendar Month Controls */}
              <div className="flex items-center justify-between bg-neutral-850/80 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <span>{monthTitle}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-2 py-0.5 rounded text-xs bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700"
                  >
                    今天
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700"
                    title="上个月"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700"
                    title="下个月"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-neutral-400 py-1">
                <div>周一</div>
                <div>周二</div>
                <div>周三</div>
                <div>周四</div>
                <div>周五</div>
                <div className="text-amber-400">周六</div>
                <div className="text-amber-400">周日</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty offset padding */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div
                    key={`empty_${i}`}
                    className="min-h-[105px] bg-neutral-950/30 rounded-xl border border-neutral-850/40 p-2 opacity-30"
                  />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayTasks = tasks.filter((t) => t.date === dayStr);
                  const isToday =
                    new Date().toISOString().split('T')[0] === dayStr;

                  return (
                    <div
                      key={`day_${dayNum}`}
                      className={`min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition group relative ${
                        isToday
                          ? 'bg-blue-950/20 border-blue-600/60 shadow-xs'
                          : 'bg-neutral-850/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : 'text-neutral-400 group-hover:text-neutral-200'
                          }`}
                        >
                          {dayNum}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenCreateForDate(dayStr)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-750 text-neutral-400 hover:text-white transition"
                          title="在当天新建排期"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Day Tasks List */}
                      <div className="space-y-1 overflow-y-auto max-h-[85px] flex-1">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`px-1.5 py-1 rounded text-[11px] cursor-pointer transition border truncate ${
                              task.status === 'published'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                                : task.status === 'drafted'
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800/80 hover:bg-blue-900/60'
                                : task.status === 'matrix'
                                ? 'bg-purple-950/60 text-purple-300 border-purple-800/80 hover:bg-purple-900/60'
                                : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                            }`}
                            title={`${task.time} · ${task.title}`}
                          >
                            <span className="font-mono text-[10px] opacity-75 mr-1">{task.time}</span>
                            <span>{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Asset Archive List View */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-850 p-3 rounded-xl border border-neutral-800">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="按文章标题、摘要或公众号搜索发文资产..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-neutral-900 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="all">所有状态</option>
                    <option value="published">已发布</option>
                    <option value="drafted">已推草稿</option>
                    <option value="matrix">矩阵分发中</option>
                    <option value="planned">策划中</option>
                  </select>

                  <select
                    value={selectedAccountFilter}
                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                    className="bg-neutral-900 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="all">全部公众号账号</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.tag})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Archive List Cards */}
              <div className="space-y-2.5">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs bg-neutral-850/50 rounded-xl border border-dashed border-neutral-800">
                    <Layers className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    没有找到符合条件的发文资产记录。
                  </div>
                ) : (
                  filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-neutral-850 hover:bg-neutral-800/90 border border-neutral-750 hover:border-blue-700/60 rounded-xl p-3.5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {t.coverUrl ? (
                            <img src={t.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-neutral-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-neutral-100 truncate">
                              {t.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border font-medium shrink-0 ${
                                STATUS_LABELS[t.status]?.badge || 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {STATUS_LABELS[t.status]?.label || t.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1">
                            <span>📅 {t.date} {t.time}</span>
                            <span className="text-neutral-300">🏢 {t.accountName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] border border-neutral-700">
                              {CATEGORY_LABELS[t.category]?.label || t.category}
                            </span>
                            {t.wordCount ? <span>约 {t.wordCount} 字</span> : null}
                          </div>

                          {t.digest && (
                            <p className="text-xs text-neutral-500 mt-1 truncate max-w-xl">
                              {t.digest}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadTaskIntoEditor(t);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>载入编辑</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTask(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs transition"
                        >
                          详情
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-300 border border-neutral-700 transition"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KPI Statistics Dashboard */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-750">
                  <div className="text-xs text-neutral-400 mb-1">当月排期任务</div>
                  <div className="text-2xl font-black text-neutral-100 font-mono">
                    {stats.currentMonthTotal}
                  </div>
                  <div className="text-[11px] text-blue-400 mt-1">本月计划发文指标</div>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-750">
                  <div className="text-xs text-neutral-400 mb-1">已正式发布篇数</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {stats.publishedCount}
                  </div>
                  <div className="text-[11px] text-emerald-300 mt-1">完成率 {stats.totalTasks ? Math.round((stats.publishedCount / stats.totalTasks) * 100) : 0}%</div>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-750">
                  <div className="text-xs text-neutral-400 mb-1">草稿与矩阵中</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {stats.draftedCount + stats.matrixCount}
                  </div>
                  <div className="text-[11px] text-purple-300 mt-1">多平台分发加速</div>
                </div>

                <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-750">
                  <div className="text-xs text-neutral-400 mb-1">累计产出字数</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {(stats.totalWords / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[11px] text-amber-300 mt-1">活跃创作天数: {stats.activeDays}天</div>
                </div>
              </div>

              {/* Matrix Multi-Channel Overview */}
              <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-750">
                <h4 className="text-sm font-bold text-neutral-200 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <span>矩阵账号矩阵渗透矩阵</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {accounts.map((acc) => {
                    const accTasks = tasks.filter((t) => t.accountId === acc.id);
                    return (
                      <div key={acc.id} className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-neutral-200">{acc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                            {acc.tag}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex justify-between mt-2">
                          <span>排期文章:</span>
                          <span className="font-mono text-neutral-200">{accTasks.length} 篇</span>
                        </div>
                        <div className="text-xs text-neutral-400 flex justify-between mt-1">
                          <span>已发草稿:</span>
                          <span className="font-mono text-emerald-400">
                            {accTasks.filter((t) => t.status === 'published' || t.status === 'drafted').length} 篇
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Task Detail Slideover / Modal */}
        {selectedTask && (
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-blue-400">{selectedTask.date} {selectedTask.time}</span>
                <span className="text-sm font-bold text-neutral-100 truncate">{selectedTask.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_LABELS[selectedTask.status]?.badge}`}>
                  {STATUS_LABELS[selectedTask.status]?.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 truncate">
                目标账号：{selectedTask.accountName} · 分发渠道：{(selectedTask.targetPlatforms || []).join('、')}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onLoadTaskIntoEditor(selectedTask);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>载入当前编辑器</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs border border-neutral-700"
              >
                收起
              </button>
            </div>
          </div>
        )}

        {/* Modal: Create / Edit Task */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span>{formTask.id ? '编辑排期任务' : '新建发文排期任务'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFormTask} className="space-y-3.5 text-xs">
                {/* Title */}
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">文章标题 *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={formTask.title || ''}
                      onChange={(e) => setFormTask({ ...formTask, title: e.target.value })}
                      placeholder="输入计划发布的文章标题..."
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-blue-500"
                    />
                    {currentEditorArticle?.title && (
                      <button
                        type="button"
                        onClick={handleFillFromEditor}
                        className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-blue-300 border border-neutral-700 text-xs whitespace-nowrap"
                        title="快速填入当前编辑器正在写的文章信息"
                      >
                        填入当前文章
                      </button>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">排期日期 *</label>
                    <input
                      type="date"
                      required
                      value={formTask.date || ''}
                      onChange={(e) => setFormTask({ ...formTask, date: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">计划推送时间</label>
                    <input
                      type="time"
                      value={formTask.time || '20:00'}
                      onChange={(e) => setFormTask({ ...formTask, time: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Account & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">发布目标账号</label>
                    <select
                      value={formTask.accountId || ''}
                      onChange={(e) => {
                        const acc = accounts.find((a) => a.id === e.target.value);
                        setFormTask({
                          ...formTask,
                          accountId: e.target.value,
                          accountName: acc?.name || '公众号',
                        });
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.tag})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">内容分类</label>
                    <select
                      value={formTask.category || 'tech'}
                      onChange={(e) => setFormTask({ ...formTask, category: e.target.value as any })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">当前排期状态</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFormTask({ ...formTask, status: k as any })}
                        className={`py-1.5 rounded-lg border text-xs font-medium transition ${
                          formTask.status === k
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Digest */}
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">文章摘要 / 备注说明</label>
                  <textarea
                    rows={2}
                    value={formTask.digest || ''}
                    onChange={(e) => setFormTask({ ...formTask, digest: e.target.value })}
                    placeholder="输入微信文章导读摘要或选题排期重点..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-neutral-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition"
                  >
                    保存排期
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
