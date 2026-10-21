import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.ts';

export interface CachedMediaItem {
  hash: string;
  media_id: string;
  url: string;
  filename: string;
  size: number;
  cached_at: string;
}

import { getCacheFilePath, safeReadJsonCache, safeWriteJsonCache } from '../utils/cacheDir.ts';

export function getMediaCacheFilePath(): string {
  return getCacheFilePath('media_cache.json');
}

export function loadMediaCache(): Record<string, CachedMediaItem> {
  const filePath = getMediaCacheFilePath();
  return safeReadJsonCache<Record<string, CachedMediaItem>>(filePath, {});
}

export function saveMediaCache(cache: Record<string, CachedMediaItem>) {
  const filePath = getMediaCacheFilePath();
  safeWriteJsonCache(filePath, cache);
}

export function computeBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function getCachedMedia(hash: string): CachedMediaItem | null {
  const cache = loadMediaCache();
  return cache[hash] || null;
}

export function setCachedMedia(
  hash: string,
  media_id: string,
  url: string,
  filename: string,
  size: number
) {
  const cache = loadMediaCache();
  cache[hash] = {
    hash,
    media_id,
    url,
    filename,
    size,
    cached_at: new Date().toISOString(),
  };
  saveMediaCache(cache);
  logger.debug(`[素材缓存] 已缓存媒体: ${filename} (sha256: ${hash.slice(0, 10)}... -> media_id: ${media_id})`);
}
