/**
 * snapshotManager.ts
 * 本地文档版本历史与快照回滚系统 (Git-like Timeline Snapshots)
 * 
 * 功能：
 * 1. 定时防丢失自动快照 (Auto-Snapshot)
 * 2. 推送/大改动前重要里程碑备份 (Pre-Publish Snapshot)
 * 3. 用户手动版本打标 (Manual Snapshot with custom notes)
 * 4. 一键回滚到任意历史版本 (One-click Rollback)
 */

export interface DocumentSnapshot {
  id: string;
  timestamp: number;
  title: string;
  markdown: string;
  charCount: number;
  theme: string;
  tag: 'auto' | 'manual' | 'publish';
  label: string;
}

const STORAGE_KEY = 'wechat_draft_history_snapshots_v1';
const MAX_SNAPSHOTS = 40;

export function getSnapshots(): DocumentSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(
  data: {
    title: string;
    markdown: string;
    theme?: string;
    tag?: 'auto' | 'manual' | 'publish';
    label?: string;
  }
): DocumentSnapshot | null {
  if (typeof window === 'undefined') return null;
  if (!data.markdown || !data.markdown.trim()) return null;

  try {
    const list = getSnapshots();
    const now = Date.now();

    // Avoid saving identical content consecutively within 20 seconds
    if (list.length > 0) {
      const latest = list[0];
      if (latest.markdown.trim() === data.markdown.trim()) {
        return null;
      }
      if (data.tag === 'auto' && now - latest.timestamp < 15000) {
        return null;
      }
    }

    const defaultLabel =
      data.label ||
      (data.tag === 'publish'
        ? '草稿推送前自动归档'
        : data.tag === 'manual'
        ? '手动保存版本'
        : `自动编辑快照 (${new Date(now).toLocaleTimeString()})`);

    const newSnapshot: DocumentSnapshot = {
      id: `snap-${now}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      title: data.title || '未命名微信文章',
      markdown: data.markdown,
      charCount: data.markdown.length,
      theme: data.theme || 'pie',
      tag: data.tag || 'auto',
      label: defaultLabel,
    };

    const updated = [newSnapshot, ...list].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch (err) {
    console.warn('Failed to save snapshot:', err);
    return null;
  }
}

export function deleteSnapshot(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export function clearSnapshots(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
