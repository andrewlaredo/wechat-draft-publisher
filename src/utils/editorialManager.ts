/**
 * editorialManager.ts
 * 运营日历与发文资产档案管理引擎 (Editorial Calendar & Article Asset Archive)
 * 
 * 核心功能：
 * 1. 发布排期日历管理（支持月历、周历、按账号筛选排期任务）
 * 2. 发文资产全生命周期归档（策划中 -> 草稿箱 -> 已发布 -> 全网矩阵）
 * 3. 统计报表看板（月度发文量、活跃天数、矩阵覆盖率、字数产出）
 * 4. 资产报表一键导出 (CSV / JSON) 与本地台账导入恢复
 */

export interface EditorialTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  accountId: string;
  accountName: string;
  accountTag?: string;
  status: 'planned' | 'drafted' | 'published' | 'matrix';
  category: 'tech' | 'industry' | 'news' | 'story' | 'review' | 'other';
  markdown?: string;
  coverUrl?: string;
  digest?: string;
  mediaId?: string;
  targetPlatforms: string[];
  notes?: string;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_EDITORIAL_TASKS_KEY = 'wechat_editorial_tasks_v1';

export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  tech: { label: '技术深度', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  industry: { label: '行业洞察', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  news: { label: '前沿资讯', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  story: { label: '个人专栏', color: 'bg-purple-950 text-purple-300 border-purple-800' },
  review: { label: '产品评测', color: 'bg-rose-950 text-rose-300 border-rose-800' },
  other: { label: '常规更新', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
};

export const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  planned: { label: '选题策划中', badge: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
  drafted: { label: '已推草稿箱', badge: 'bg-blue-950 text-blue-300 border-blue-800' },
  published: { label: '已正式发布', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  matrix: { label: '多渠道矩阵中', badge: 'bg-purple-950 text-purple-300 border-purple-800' },
};

/**
 * 预设一些精选示例排期数据（首次使用展示）
 */
function getDefaultInitialTasks(): EditorialTask[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // 昨天
  const yesterday = new Date(now.getTime() - 86400000);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 明天
  const tomorrow = new Date(now.getTime() + 86400000);
  const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'task_sample_1',
      title: '微信公众号自动化发布全流程实践指南',
      date: todayStr,
      time: '20:00',
      accountId: 'default-active',
      accountName: '主号 · 科技探索者',
      accountTag: '主号·技术',
      status: 'drafted',
      category: 'tech',
      digest: '从 Markdown 编写到多平台矩阵一键分发的工业级生产力流水线',
      targetPlatforms: ['微信公众号', '知乎专栏', '掘金'],
      wordCount: 3850,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_sample_2',
      title: '自媒体存量博弈时代：如何建立个人内容原子化资产库？',
      date: yStr,
      time: '19:30',
      accountId: 'default-active',
      accountName: '主号 · 科技探索者',
      accountTag: '主号·技术',
      status: 'published',
      category: 'industry',
      digest: '真正拉开创作者差距的不再是更新频率，而是跨平台全域渗透力',
      targetPlatforms: ['微信公众号', '知乎专栏', '小红书'],
      wordCount: 4200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_sample_3',
      title: '新广告法极限词与微信诱导分享合规避坑指南（附自查清单）',
      date: tStr,
      time: '12:00',
      accountId: 'matrix-lifestyle',
      accountName: '矩阵 · 数字漫游指南',
      accountTag: '矩阵·科普',
      status: 'planned',
      category: 'news',
      digest: '深度盘点 2026 最新违规惩罚词与诱导分享阶梯降权判定规则',
      targetPlatforms: ['微信公众号', 'CSDN', '简书'],
      wordCount: 2600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * 读取排期任务列表
 */
export function getStoredEditorialTasks(): EditorialTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EDITORIAL_TASKS_KEY);
    if (!raw) {
      const initial = getDefaultInitialTasks();
      saveEditorialTasks(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultInitialTasks();
  }
}

/**
 * 保存排期任务列表
 */
export function saveEditorialTasks(tasks: EditorialTask[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_EDITORIAL_TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save editorial tasks:', err);
  }
}

/**
 * 新建或更新排期任务
 */
export function upsertEditorialTask(task: Partial<EditorialTask> & { title: string; date: string }): EditorialTask {
  const tasks = getStoredEditorialTasks();
  const now = new Date().toISOString();

  if (task.id) {
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      const updated: EditorialTask = {
        ...tasks[index],
        ...task,
        updatedAt: now,
      };
      tasks[index] = updated;
      saveEditorialTasks(tasks);
      return updated;
    }
  }

  // Create new task
  const newTask: EditorialTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: task.title,
    date: task.date,
    time: task.time || '20:00',
    accountId: task.accountId || 'default-active',
    accountName: task.accountName || '主号公众号',
    accountTag: task.accountTag || '主号',
    status: task.status || 'planned',
    category: task.category || 'tech',
    markdown: task.markdown || '',
    coverUrl: task.coverUrl || '',
    digest: task.digest || '',
    mediaId: task.mediaId || '',
    targetPlatforms: task.targetPlatforms || ['微信公众号'],
    notes: task.notes || '',
    wordCount: task.wordCount || (task.markdown ? task.markdown.length : 0),
    createdAt: now,
    updatedAt: now,
  };

  tasks.unshift(newTask);
  saveEditorialTasks(tasks);
  return newTask;
}

/**
 * 删除排期任务
 */
export function deleteEditorialTask(taskId: string): boolean {
  const tasks = getStoredEditorialTasks();
  const next = tasks.filter((t) => t.id !== taskId);
  if (next.length !== tasks.length) {
    saveEditorialTasks(next);
    return true;
  }
  return false;
}

/**
 * 统计运营指标
 */
export function getEditorialStatistics(tasks: EditorialTask[]) {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTasks = tasks.filter((t) => t.date.startsWith(currentMonthPrefix));
  const publishedCount = tasks.filter((t) => t.status === 'published').length;
  const draftedCount = tasks.filter((t) => t.status === 'drafted').length;
  const plannedCount = tasks.filter((t) => t.status === 'planned').length;
  const matrixCount = tasks.filter((t) => t.status === 'matrix').length;

  const totalWords = tasks.reduce((sum, t) => sum + (t.wordCount || 0), 0);
  const activeDays = new Set(tasks.map((t) => t.date)).size;

  return {
    totalTasks: tasks.length,
    currentMonthTotal: currentMonthTasks.length,
    publishedCount,
    draftedCount,
    plannedCount,
    matrixCount,
    totalWords,
    activeDays,
  };
}

/**
 * 导出资产为 CSV 格式
 */
export function exportEditorialCsv(tasks: EditorialTask[]): void {
  const headers = ['排期日期', '时间', '文章标题', '目标账号', '分类', '状态', '字数', '摘要', '分发渠道', '草稿MediaID'];
  const rows = tasks.map((t) => [
    t.date,
    t.time,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.accountName || '').replace(/"/g, '""')}"`,
    CATEGORY_LABELS[t.category]?.label || t.category,
    STATUS_LABELS[t.status]?.label || t.status,
    t.wordCount || 0,
    `"${(t.digest || '').replace(/"/g, '""')}"`,
    `"${(t.targetPlatforms || []).join(';')}"`,
    t.mediaId || '',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wechat-editorial-schedule-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 导出资产为 JSON 文件
 */
export function exportEditorialJson(tasks: EditorialTask[]): void {
  const jsonStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wechat-editorial-backup-${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 从 JSON 导入恢复排期台账
 */
export function importEditorialJson(jsonStr: string): { success: boolean; count: number; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      return { success: false, count: 0, message: '导入数据格式不正确，需为排期任务数组。' };
    }
    const current = getStoredEditorialTasks();
    const existingIds = new Set(current.map((t) => t.id));
    const merged = [...current];

    let newCount = 0;
    data.forEach((item: any) => {
      if (item && item.title && item.date) {
        if (!existingIds.has(item.id)) {
          merged.push(item);
          newCount++;
        }
      }
    });

    saveEditorialTasks(merged);
    return { success: true, count: newCount, message: `成功导入 ${newCount} 条排期记录！` };
  } catch (err: any) {
    return { success: false, count: 0, message: `导入解析失败: ${err.message}` };
  }
}
