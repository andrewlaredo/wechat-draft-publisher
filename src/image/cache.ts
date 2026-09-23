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

const CACHE_FILE = path.resolve(process.cwd(), '.cache/media_cache.json');

function ensureCacheDir() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadMediaCache(): Record<string, CachedMediaItem> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err: any) {
    logger.warn(`读取素材缓存失败: ${err.message}`);
  }
  return {};
}

export function saveMediaCache(cache: Record<string, CachedMediaItem>) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err: any) {
    logger.warn(`写入素材缓存失败: ${err.message}`);
  }
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
