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

export function getPublishCacheFilePath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  const cacheDir = path.resolve(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return path.join(cacheDir, 'published.json');
}

export function loadPublishCache(cachePath?: string): PublishCache {
  const filePath = getPublishCacheFilePath(cachePath);
  if (!fs.existsSync(filePath)) {
    return { records: {} };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data.records === 'object' ? data : { records: {} };
  } catch {
    return { records: {} };
  }
}

export function checkIsPublished(
  hash: string,
  cachePath?: string
): { isPublished: boolean; record?: PublishRecord } {
  const cache = loadPublishCache(cachePath);
  if (cache.records[hash]) {
    return { isPublished: true, record: cache.records[hash] };
  }
  return { isPublished: false };
}

export function savePublishRecord(record: PublishRecord, cachePath?: string): void {
  const filePath = getPublishCacheFilePath(cachePath);
  const cache = loadPublishCache(cachePath);
  cache.records[record.hash] = record;
  try {
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save publish record cache:', err);
  }
}
