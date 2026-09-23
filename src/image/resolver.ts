import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.ts';

export interface ImageRef {
  originalSrc: string; // The exact string in src="..."
  absolutePath: string;
  isRemote: boolean;
  isDataUri: boolean;
  filename: string;
  exists: boolean;
  sizeBytes?: number;
}

const SUPPORTED_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export function findImageReferences(
  html: string,
  baseDir: string,
  imagesDir?: string
): ImageRef[] {
  const imgRegex = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  const references: ImageRef[] = [];
  const seenOriginals = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = (match[1] || match[2] || match[3] || '').trim();
    if (!src || seenOriginals.has(src)) continue;
    seenOriginals.add(src);

    const isRemote = /^https?:\/\//i.test(src);
    const isDataUri = /^data:image\//i.test(src);

    if (isRemote) {
      references.push({
        originalSrc: src,
        absolutePath: src,
        isRemote: true,
        isDataUri: false,
        filename: path.basename(src.split('?')[0]) || 'image.png',
        exists: true,
      });
      continue;
    }

    if (isDataUri) {
      references.push({
        originalSrc: src,
        absolutePath: '',
        isRemote: false,
        isDataUri: true,
        filename: 'data-uri-image.png',
        exists: true,
      });
      continue;
    }

    // Clean brackets e.g. <./images/photo.png>
    const cleanSrc = src.replace(/^<|>$/g, '').trim();

    // Resolve local path
    let candidatePath = path.isAbsolute(cleanSrc)
      ? cleanSrc
      : path.resolve(baseDir, cleanSrc);

    if (!fs.existsSync(candidatePath) && imagesDir) {
      const altCandidate = path.resolve(imagesDir, path.basename(cleanSrc));
      if (fs.existsSync(altCandidate)) {
        candidatePath = altCandidate;
      }
    }

    const exists = fs.existsSync(candidatePath);
    let sizeBytes = 0;
    if (exists) {
      try {
        const stats = fs.statSync(candidatePath);
        sizeBytes = stats.size;
      } catch {
        // Ignore stat error
      }
    }

    references.push({
      originalSrc: src,
      absolutePath: candidatePath,
      isRemote: false,
      isDataUri: false,
      filename: path.basename(candidatePath),
      exists,
      sizeBytes,
    });
  }

  return references;
}

export function validateLocalImages(images: ImageRef[]): void {
  const missing: string[] = [];
  const oversized: string[] = [];
  const unsupported: string[] = [];

  for (const img of images) {
    if (img.isRemote || img.isDataUri) continue;

    if (!img.exists) {
      missing.push(`${img.originalSrc} (解析目标: ${img.absolutePath})`);
      continue;
    }

    const ext = path.extname(img.filename).toLowerCase();
    if (!SUPPORTED_EXTS.includes(ext)) {
      unsupported.push(`${img.filename} (格式: ${ext})`);
    }

    if (img.sizeBytes && img.sizeBytes > 10 * 1024 * 1024) {
      const mb = (img.sizeBytes / (1024 * 1024)).toFixed(2);
      oversized.push(`${img.filename} (${mb}MB > 10MB)`);
    }
  }

  const errors: string[] = [];
  if (missing.length > 0) {
    errors.push(`以下本地配图文件未找到:\n  - ${missing.join('\n  - ')}`);
  }
  if (oversized.length > 0) {
    errors.push(`以下图片大小超过微信素材库 10MB 限制:\n  - ${oversized.join('\n  - ')}`);
  }
  if (unsupported.length > 0) {
    errors.push(`以下图片格式微信素材库不支持 (.png, .jpg, .jpeg, .gif, .webp):\n  - ${unsupported.join('\n  - ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`[图片校验失败]\n${errors.join('\n\n')}`);
  }
}
