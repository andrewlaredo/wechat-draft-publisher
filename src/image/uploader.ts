import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { uploadImageToMaterial } from '../wechat/material.ts';
import { withRetry } from '../utils/retry.ts';
import { logger } from '../utils/logger.ts';
import { ImageRef } from './resolver.ts';
import { optimizeImageBuffer } from './optimizer.ts';
import { computeBufferHash, getCachedMedia, setCachedMedia } from './cache.ts';

export interface ImageUploadPlan {
  originalSrc: string;
  absolutePath: string;
  wechatUrl: string;
  mediaId: string;
}

export interface UploadImagesResult {
  updatedHtml: string;
  uploadedList: ImageUploadPlan[];
}

export interface NewspicImageItem {
  image_media_id: string;
  url: string;
  originalSrc: string;
}

/**
 * Load image file buffer from either local filesystem or remote HTTP URL
 */
export async function loadImageBuffer(
  src: string,
  baseDir: string,
  imagesDir?: string,
  options: { convertWebp?: boolean } = {}
): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!src) return null;

  // Remote URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      const resp = await axios.get(src, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const buffer = Buffer.from(resp.data);
      let filename = 'remote_image.jpg';
      try {
        const u = new URL(src);
        const base = path.basename(u.pathname);
        if (base && ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(path.extname(base).toLowerCase())) {
          filename = base;
        }
      } catch {
        // Ignore URL parse error
      }
      return { buffer, filename };
    } catch (e: any) {
      logger.warn(`下载远程图片失败 (${src}): ${e.message}`);
      return null;
    }
  }

  // Local filesystem
  let resolvedPath = path.isAbsolute(src) ? src : path.resolve(baseDir, src);
  if (!fs.existsSync(resolvedPath) && imagesDir) {
    const alt = path.resolve(imagesDir, path.basename(src));
    if (fs.existsSync(alt)) resolvedPath = alt;
  }

  if (fs.existsSync(resolvedPath)) {
    try {
      const rawBuffer = fs.readFileSync(resolvedPath);
      const rawFilename = path.basename(resolvedPath);
      const optimized = await optimizeImageBuffer(rawBuffer, rawFilename, {
        convertWebp: options.convertWebp,
      });
      return { buffer: optimized.buffer, filename: optimized.filename };
    } catch (e: any) {
      logger.warn(`读取本地图片失败 (${resolvedPath}): ${e.message}`);
      return null;
    }
  }

  return null;
}

export async function processAndUploadImages(
  html: string,
  imageRefs: ImageRef[],
  options: {
    accessToken?: string;
    proxyUrl?: string;
    concurrency?: number;
    dryRun?: boolean;
    retryTimes?: number;
    retryInterval?: number;
    convertWebp?: boolean;
  } = {}
): Promise<UploadImagesResult> {
  const concurrency = options.concurrency || 3;
  const isDryRun = !!options.dryRun;
  const accessToken = options.accessToken;
  const retries = typeof options.retryTimes === 'number' ? options.retryTimes : 3;
  const interval = typeof options.retryInterval === 'number' ? options.retryInterval : 2000;

  const localImages = imageRefs.filter((img) => !img.isRemote && img.exists);
  const uploadMap = new Map<string, ImageUploadPlan>();

  // Process in chunks by concurrency
  for (let i = 0; i < localImages.length; i += concurrency) {
    const chunk = localImages.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (img) => {
        const rawBuffer = fs.readFileSync(img.absolutePath);
        const optimized = await optimizeImageBuffer(rawBuffer, img.filename, {
          convertWebp: options.convertWebp,
        });
        const fileBuffer = optimized.buffer;
        const uploadFilename = optimized.filename;
        const hash = computeBufferHash(fileBuffer);

        if (isDryRun || !accessToken) {
          // Dry-run simulated WeChat mmbiz CDN URL
          const mockUrl = `https://mmbiz.qpic.cn/mmbiz_png/mock_${hash.slice(0, 12)}/640?wx_fmt=png`;
          const mockMediaId = `mock_media_${hash.slice(0, 12)}`;
          uploadMap.set(img.originalSrc, {
            originalSrc: img.originalSrc,
            absolutePath: img.absolutePath,
            wechatUrl: mockUrl,
            mediaId: mockMediaId,
          });
          logger.debug(`[Dry-Run] 模拟上传图片: ${uploadFilename} -> ${mockUrl}`);
        } else {
          // Check persistent media cache first
          const cached = getCachedMedia(hash);
          if (cached) {
            uploadMap.set(img.originalSrc, {
              originalSrc: img.originalSrc,
              absolutePath: img.absolutePath,
              wechatUrl: cached.url,
              mediaId: cached.media_id,
            });
            logger.info(`[素材缓存命中] ${uploadFilename} 命中微信素材库缓存 (media_id: ${cached.media_id})，跳过网络上传`);
            return;
          }

          // Real upload with retry
          logger.debug(`正在上传图片至微信永久素材库: ${uploadFilename}...`);
          const result = await withRetry(
            async () => {
              return await uploadImageToMaterial(accessToken, fileBuffer, uploadFilename, options.proxyUrl);
            },
            {
              retries,
              interval,
              onRetry: (err, attempt) => {
                logger.warn(`图片 ${uploadFilename} 上传失败 (第 ${attempt} 次重试): ${err.message}`);
              },
            }
          );

          // Save to cache
          setCachedMedia(hash, result.media_id, result.url, uploadFilename, fileBuffer.length);

          uploadMap.set(img.originalSrc, {
            originalSrc: img.originalSrc,
            absolutePath: img.absolutePath,
            wechatUrl: result.url,
            mediaId: result.media_id,
          });
          logger.debug(`图片已上传并获取微信 URL: ${result.url}`);
        }
      })
    );
  }

  // Replace src in HTML
  let updatedHtml = html;
  const uploadedList: ImageUploadPlan[] = [];

  for (const [originalSrc, plan] of uploadMap.entries()) {
    uploadedList.push(plan);
    // Escape special regex chars in originalSrc
    const escapedSrc = originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<img\\b[^>]*?\\bsrc\\s*=\\s*["'])${escapedSrc}(["'])`, 'gi');
    updatedHtml = updatedHtml.replace(regex, `$1${plan.wechatUrl}$2`);
  }

  return {
    updatedHtml,
    uploadedList,
  };
}

export async function resolveOrUploadCoverImage(
  coverPath: string | undefined,
  baseDir: string,
  imagesDir?: string,
  options: {
    accessToken?: string;
    proxyUrl?: string;
    dryRun?: boolean;
    presetThumbMediaId?: string;
    retryTimes?: number;
    retryInterval?: number;
    convertWebp?: boolean;
  } = {}
): Promise<{ thumb_media_id: string; coverUrl?: string }> {
  const retries = typeof options.retryTimes === 'number' ? options.retryTimes : 3;
  const interval = typeof options.retryInterval === 'number' ? options.retryInterval : 2000;

  // 1. If explicit thumb_media_id was passed
  if (options.presetThumbMediaId) {
    logger.debug(`使用指定的封面素材 ID: ${options.presetThumbMediaId}`);
    return { thumb_media_id: options.presetThumbMediaId };
  }

  // 2. If cover file or URL is specified
  if (coverPath) {
    const loaded = await loadImageBuffer(coverPath, baseDir, imagesDir, {
      convertWebp: options.convertWebp,
    });
    if (loaded) {
      const { buffer, filename } = loaded;
      const hash = computeBufferHash(buffer);

      if (options.dryRun || !options.accessToken) {
        logger.debug(`[Dry-Run] 模拟上传封面: ${filename}`);
        return {
          thumb_media_id: `mock_cover_media_${hash.slice(0, 12)}`,
          coverUrl: `https://mmbiz.qpic.cn/mmbiz_png/mock_cover_${hash.slice(0, 12)}/640?wx_fmt=png`,
        };
      }

      // Check cache for cover
      const cached = getCachedMedia(hash);
      if (cached) {
        logger.info(`[素材缓存命中] 封面 ${filename} 命中素材库缓存 (media_id: ${cached.media_id})`);
        return {
          thumb_media_id: cached.media_id,
          coverUrl: cached.url,
        };
      }

      logger.debug(`正在上传封面素材: ${filename}...`);
      const result = await withRetry(
        async () => uploadImageToMaterial(options.accessToken!, buffer, filename, options.proxyUrl),
        { retries, interval }
      );
      setCachedMedia(hash, result.media_id, result.url, filename, buffer.length);
      return {
        thumb_media_id: result.media_id,
        coverUrl: result.url,
      };
    } else {
      logger.warn(`指定的封面图片无法加载: ${coverPath}`);
    }
  }

  // 3. Fallback: generate a default solid/geometric SVG/PNG buffer cover or use a mock ID
  const defaultCoverHash = 'default_cover_thumb_id';
  if (options.dryRun || !options.accessToken) {
    return { thumb_media_id: defaultCoverHash, coverUrl: 'https://mmbiz.qpic.cn/mmbiz_png/mock_default_cover/640?wx_fmt=png' };
  }

  // In live mode with no cover provided, create a minimalist 900x383 16:9 banner
  try {
    const dummySvg = `<svg width="900" height="383" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="900" height="383" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#f8fafc" font-weight="bold">WECHAT ARTICLE</text>
    </svg>`;
    const dummyBuffer = Buffer.from(dummySvg, 'utf8');
    const result = await uploadImageToMaterial(options.accessToken, dummyBuffer, 'cover.png', options.proxyUrl);
    return { thumb_media_id: result.media_id, coverUrl: result.url };
  } catch (err: any) {
    logger.warn(`自动上传默认封面失败: ${err.message}，尝试使用占位 ID`);
    return { thumb_media_id: 'sample_thumb_media_id' };
  }
}

/**
 * Upload multiple images for WeChat Newspic (图片消息/贴图)
 * WeChat newspic accepts up to 20 images in image_info.image_list
 * Each image must be uploaded as a permanent material to obtain image_media_id
 */
export async function uploadImagesForNewspic(
  imageSources: string[],
  baseDir: string,
  imagesDir?: string,
  options: {
    accessToken?: string;
    proxyUrl?: string;
    dryRun?: boolean;
    concurrency?: number;
    retryTimes?: number;
    retryInterval?: number;
    convertWebp?: boolean;
  } = {}
): Promise<{
  imageList: NewspicImageItem[];
  thumb_media_id: string;
  coverUrl?: string;
}> {
  const isDryRun = !!options.dryRun;
  const accessToken = options.accessToken;
  const retries = typeof options.retryTimes === 'number' ? options.retryTimes : 3;
  const interval = typeof options.retryInterval === 'number' ? options.retryInterval : 2000;
  const imageList: NewspicImageItem[] = [];

  // Limit to max 20 images per WeChat limit
  const targetSources = imageSources.slice(0, 20);

  for (const src of targetSources) {
    const loaded = await loadImageBuffer(src, baseDir, imagesDir, {
      convertWebp: options.convertWebp,
    });
    if (!loaded) {
      logger.warn(`[图片消息] 无法加载图片: ${src}，已跳过`);
      continue;
    }

    const { buffer, filename } = loaded;
    const hash = computeBufferHash(buffer);

    if (isDryRun || !accessToken) {
      const mockMediaId = `mock_newspic_media_${hash.slice(0, 12)}`;
      const mockUrl = `https://mmbiz.qpic.cn/mmbiz_png/mock_newspic_${hash.slice(0, 12)}/640?wx_fmt=png`;
      imageList.push({
        image_media_id: mockMediaId,
        url: mockUrl,
        originalSrc: src,
      });
      logger.debug(`[Dry-Run] 模拟上传图片消息素材: ${filename} -> media_id=${mockMediaId}`);
    } else {
      // Check cache
      const cached = getCachedMedia(hash);
      if (cached) {
        logger.info(`[素材缓存命中] 贴图素材 ${filename} 命中本地素材库缓存 (media_id: ${cached.media_id})`);
        imageList.push({
          image_media_id: cached.media_id,
          url: cached.url,
          originalSrc: src,
        });
        continue;
      }

      logger.debug(`[图片消息] 正在上传素材: ${filename}...`);
      const result = await withRetry(
        async () => uploadImageToMaterial(accessToken, buffer, filename, options.proxyUrl),
        {
          retries,
          interval,
          onRetry: (err, attempt) => {
            logger.warn(`[图片消息] 素材 ${filename} 上传失败 (第 ${attempt} 次重试): ${err.message}`);
          },
        }
      );
      setCachedMedia(hash, result.media_id, result.url, filename, buffer.length);
      imageList.push({
        image_media_id: result.media_id,
        url: result.url,
        originalSrc: src,
      });
      logger.debug(`[图片消息] 素材已上传: ${filename} -> media_id=${result.media_id}`);
    }
  }

  if (imageList.length === 0) {
    throw new Error('图片消息（贴图）必须包含至少 1 张有效图片，请检查 Markdown 中的图片引用或 cover 字段。');
  }

  const thumb_media_id = imageList[0].image_media_id;
  const coverUrl = imageList[0].url;

  return {
    imageList,
    thumb_media_id,
    coverUrl,
  };
}
