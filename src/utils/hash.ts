import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface PublishRecord {
  hash: string;
  media_id: string;
  title: string;
  published_at: string;
  author?: string;
  theme?: string;
  article_type?: 'news' | 'newspic';
  images_count?: number;
}

export interface PublishCache {
  records: Record<string, PublishRecord>;
}

export function computeArticleHash(
  title: string,
  contentHtml: string,
  thumbMediaId?: string
): string {
  const content = `${title}::${contentHtml}::${thumbMediaId || ''}`;
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

import { getCacheFilePath, safeReadJsonCache, safeWriteJsonCache } from './cacheDir.ts';

export function getPublishCacheFilePath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  return getCacheFilePath('published.json');
}

export function loadPublishCache(cachePath?: string): PublishCache {
  const filePath = getPublishCacheFilePath(cachePath);
  return safeReadJsonCache<PublishCache>(filePath, { records: {} });
}

export function checkIsPublished(
  hash: string,
  cachePath?: string
): { isPublished: boolean; record?: PublishRecord } {
  const cache = loadPublishCache(cachePath);
  if (cache.records && cache.records[hash]) {
    return { isPublished: true, record: cache.records[hash] };
  }
  return { isPublished: false };
}

export function savePublishRecord(record: PublishRecord, cachePath?: string): void {
  const filePath = getPublishCacheFilePath(cachePath);
  const cache = loadPublishCache(cachePath);
  if (!cache.records) cache.records = {};
  cache.records[record.hash] = record;
  safeWriteJsonCache(filePath, cache);
}
