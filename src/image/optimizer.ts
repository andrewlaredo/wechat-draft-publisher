import path from 'path';
import sharp from 'sharp';
import { logger } from '../utils/logger.ts';

export interface ImageOptimizationResult {
  buffer: Buffer;
  filename: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  compressed: boolean;
  convertedFromWebp: boolean;
}

export interface OptimizeImageOptions {
  maxSizeBytes?: number; // default: 2MB (2 * 1024 * 1024)
  maxWidth?: number;     // default: 1920
  quality?: number;      // default: 85
  convertWebp?: boolean; // default: true
}

/**
 * Automatically inspects image buffer, converts WebP to PNG/JPEG,
 * and compresses images exceeding the maximum size limit for WeChat compatibility.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  originalFilename: string,
  options: OptimizeImageOptions = {}
): Promise<ImageOptimizationResult> {
  const maxSizeBytes = options.maxSizeBytes || 2 * 1024 * 1024; // 2MB
  const maxWidth = options.maxWidth || 1920;
  const initialQuality = options.quality || 85;
  const originalSize = inputBuffer.length;
  let ext = path.extname(originalFilename).toLowerCase();

  let workingBuffer = inputBuffer;
  let filename = originalFilename;
  let convertedFromWebp = false;
  let compressed = false;

  try {
    const metadata = await sharp(inputBuffer).metadata();
    const currentFormat = (metadata.format || '').toLowerCase();

    // 1. WebP Conversion: WeChat image upload strictly requires JPG/PNG/BMP/GIF
    if (options.convertWebp !== false && (ext === '.webp' || currentFormat === 'webp')) {
      logger.info(`[图片优化] 检测到 WebP 格式图片 (${originalFilename})，正在转换为高保真 PNG...`);
      workingBuffer = await sharp(inputBuffer)
        .png({ compressionLevel: 8 })
        .toBuffer();
      filename = originalFilename.replace(/\.webp$/i, '.png');
      ext = path.extname(filename).toLowerCase();
      convertedFromWebp = true;
    }

    // 2. Check if compression or resizing is required
    const currentSize = workingBuffer.length;
    const isOverSize = currentSize > maxSizeBytes;
    const isOverWidth = (metadata.width && metadata.width > maxWidth) || false;

    if (isOverSize || isOverWidth) {
      logger.info(
        `[图片优化] 图片 ${filename} (${(currentSize / 1024 / 1024).toFixed(2)}MB, 宽 ${metadata.width || '未知'}px) 触发优化阈值，正在智能压缩...`
      );

      let pipeline = sharp(workingBuffer);

      // Resize if exceeding maxWidth while keeping aspect ratio
      if (metadata.width && metadata.width > maxWidth) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
      }

      // Convert to JPEG for aggressive, high-quality photographic compression if size is still large
      if (ext === '.png' && currentSize > maxSizeBytes) {
        // High quality JPEG compression
        workingBuffer = await pipeline
          .jpeg({ quality: initialQuality, mozjpeg: true })
          .toBuffer();
        filename = filename.replace(/\.png$/i, '.jpg');
      } else if (ext === '.jpg' || ext === '.jpeg') {
        workingBuffer = await pipeline
          .jpeg({ quality: initialQuality, mozjpeg: true })
          .toBuffer();
      } else {
        workingBuffer = await pipeline
          .png({ compressionLevel: 9 })
          .toBuffer();
      }

      // Secondary pass if still over 2MB
      if (workingBuffer.length > maxSizeBytes) {
        workingBuffer = await sharp(workingBuffer)
          .resize({ width: Math.min(maxWidth, 1440), withoutEnlargement: true })
          .jpeg({ quality: 75, mozjpeg: true })
          .toBuffer();
      }

      compressed = true;
      logger.success(
        `[图片优化完成] ${filename}: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(workingBuffer.length / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const finalMeta = await sharp(workingBuffer).metadata();

    return {
      buffer: workingBuffer,
      filename,
      originalSize,
      optimizedSize: workingBuffer.length,
      format: finalMeta.format || 'unknown',
      compressed,
      convertedFromWebp,
    };
  } catch (err: any) {
    logger.warn(`[图片优化警告] 处理 ${originalFilename} 时跳过压缩: ${err.message}`);
    return {
      buffer: inputBuffer,
      filename: originalFilename,
      originalSize,
      optimizedSize: originalSize,
      format: ext.replace('.', ''),
      compressed: false,
      convertedFromWebp: false,
    };
  }
}
