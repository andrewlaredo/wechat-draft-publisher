import fs from 'fs';
import path from 'path';
import os from 'os';

let cachedWritableDir: string | null = null;

/**
 * Returns a guaranteed writable directory for caching.
 * Resolves .cache in current working directory first.
 * If that fails (e.g. read-only container/serverless like /var/task in AWS Lambda / Vercel),
 * falls back to os.tmpdir()/wechat-publisher-cache.
 */
export function getAppCacheDir(): string {
  if (cachedWritableDir && fs.existsSync(cachedWritableDir)) {
    return cachedWritableDir;
  }

  // 1. Try process.cwd()/.cache
  try {
    const cwdCache = path.resolve(process.cwd(), '.cache');
    if (!fs.existsSync(cwdCache)) {
      fs.mkdirSync(cwdCache, { recursive: true });
    }
    // Verify write permissions with a temporary probe
    const testFile = path.join(cwdCache, `.probe_${Date.now()}`);
    fs.writeFileSync(testFile, 'probe', 'utf8');
    fs.unlinkSync(testFile);
    cachedWritableDir = cwdCache;
    return cwdCache;
  } catch {
    // Current working directory is read-only (e.g., /var/task in Serverless/Container)
  }

  // 2. Try os.tmpdir()/wechat-publisher-cache
  try {
    const tmpCache = path.join(os.tmpdir(), 'wechat-publisher-cache');
    if (!fs.existsSync(tmpCache)) {
      fs.mkdirSync(tmpCache, { recursive: true });
    }
    cachedWritableDir = tmpCache;
    return tmpCache;
  } catch {
    // 3. Fallback directly to os.tmpdir()
    cachedWritableDir = os.tmpdir();
    return cachedWritableDir;
  }
}

/**
 * Returns an absolute path for a cache file name in the guaranteed writable cache directory.
 */
export function getCacheFilePath(filename: string): string {
  const dir = getAppCacheDir();
  return path.join(dir, filename);
}

/**
 * Safe in-memory fallback store in case disk writes are completely restricted.
 */
const inMemoryCache = new Map<string, any>();

/**
 * Safely writes JSON cache with try-catch and in-memory fallback.
 */
export function safeWriteJsonCache(filePath: string, data: any): void {
  inMemoryCache.set(filePath, data);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    console.warn(`[Cache Warning] Disk cache write failed (${err.message}). Using in-memory fallback.`);
  }
}

/**
 * Safely reads JSON cache with try-catch and in-memory fallback.
 */
export function safeReadJsonCache<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Disk read failed, fallback to in-memory cache
  }
  if (inMemoryCache.has(filePath)) {
    return inMemoryCache.get(filePath) as T;
  }
  return fallback;
}
