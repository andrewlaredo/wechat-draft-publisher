/**
 * trendingManager.ts
 * 全网实时热点雷达与爆款选题追踪管理引擎
 */

import { TRENDING_ITEMS, TrendingItem, TrendingAngle } from '../data/trendingTopics.ts';
import { upsertEditorialTask } from './editorialManager.ts';

const STORAGE_KEY_FAVORITES = 'wechat_trending_favorites_v1';
const STORAGE_KEY_CUSTOM_TOPICS = 'wechat_trending_custom_topics_v1';

export function getStoredFavoriteTrends(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteTrend(topicId: string): string[] {
  const current = getStoredFavoriteTrends();
  let updated: string[];
  if (current.includes(topicId)) {
    updated = current.filter((id) => id !== topicId);
  } else {
    updated = [topicId, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

/**
 * 将热点选中的切入角度生成结构化的 Markdown 写作大纲
 */
export function buildArticleOutlineFromTrend(
  trend: TrendingItem,
  angle: TrendingAngle,
  author: string = '创作者'
): string {
  const outlineMd = angle.outline.map((item) => `## ${item}\n\n> 💡 写作指引：在此处结合当前热点事件「${trend.title}」与实际案例展开，深入分析痛点与破局策略。\n\n`).join('');

  return `---
title: ${angle.title}
author: ${author}
digest: ${angle.hook.slice(0, 100)}
theme: pie
comment: true
---

# ${angle.title}

> 🎯 **选题背景**：聚焦「${trend.title}」（${trend.sourceName}·热度 ${trend.heat}）  
> 💡 **核心抓手**：${angle.hook}

---

${outlineMd}

## 结语与行动建议

${trend.summary}

---
*欢迎在文末留言交流你的看法，觉得有用请点击「在看」与「赞」支持！*
`;
}

/**
 * 将热点选题一键排期沉淀至运营日历
 */
export function scheduleTrendToCalendar(
  trend: TrendingItem,
  angle: TrendingAngle,
  dateStr: string,
  accountName: string = '默认公众号'
) {
  const outline = buildArticleOutlineFromTrend(trend, angle);
  upsertEditorialTask({
    title: angle.title,
    date: dateStr,
    time: '10:00',
    accountId: 'default',
    accountName: accountName,
    accountTag: '热点排期',
    status: 'planned',
    category: 'industry',
    targetPlatforms: ['微信公众号'],
    digest: angle.hook,
    markdown: outline,
    notes: `来源于【${trend.sourceName}】热点雷达：${trend.title} (全网热度 ${trend.heat})`,
  });
}
