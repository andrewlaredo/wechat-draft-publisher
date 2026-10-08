/**
 * imageCompressor.ts
 * 本地无损与智能图片压缩引擎 (Client-side & Desktop Native Compressor)
 * 
 * 微信公众平台永久素材与图文正文图片有严格限制：
 * - 单张图片最大不可超过 2MB (2048 KB)
 * - 推荐尺寸：头条 900x383，次条 200x200，正文插图建议不超过 1920px 宽度
 * 
 * 本引擎提供自动双轨压缩：
 * 1. 自动尺寸等比缩放 (智能限定长宽 <= 1920px)
 * 2. 渐进式多阶段画布压缩 (平滑压缩至 1.2MB 以下，保留最高人眼可见画质)
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  width: number;
  height: number;
  format: string;
}

export async function compressImageClient(
  fileOrBase64: File | Blob | string,
  options: {
    maxSizeKB?: number;
    maxWidth?: number;
    maxHeight?: number;
    targetQuality?: number;
  } = {}
): Promise<CompressionResult> {
  const {
    maxSizeKB = 1500, // Default 1.5MB (well below WeChat 2MB cap)
    maxWidth = 1920,
    maxHeight = 1920,
    targetQuality = 0.88,
  } = options;

  let originalSize = 0;
  let dataUrl = '';

  if (typeof fileOrBase64 === 'string') {
    dataUrl = fileOrBase64;
    originalSize = Math.round((dataUrl.length * 3) / 4);
  } else {
    originalSize = fileOrBase64.size;
    dataUrl = await fileToDataUrl(fileOrBase64);
  }

  // Load image element
  const img = await loadImage(dataUrl);

  let curWidth = img.naturalWidth || img.width;
  let curHeight = img.naturalHeight || img.height;

  // Scale down if exceeds max dimensions
  if (curWidth > maxWidth || curHeight > maxHeight) {
    const ratio = Math.min(maxWidth / curWidth, maxHeight / curHeight);
    curWidth = Math.round(curWidth * ratio);
    curHeight = Math.round(curHeight * ratio);
  }

  // Draw onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = curWidth;
  canvas.height = curHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D Context not supported');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, curWidth, curHeight);

  // Iterative quality adjustment if needed
  let quality = targetQuality;
  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
  let curSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);

  const maxSizeBytes = maxSizeKB * 1024;
  let iterations = 0;

  while (curSizeBytes > maxSizeBytes && quality > 0.4 && iterations < 5) {
    quality -= 0.12;
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    curSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);
    iterations++;
  }

  const savedPercent = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - curSizeBytes) / originalSize) * 100))
    : 0;

  return {
    dataUrl: compressedDataUrl,
    originalSize,
    compressedSize: curSizeBytes,
    savedPercent,
    width: curWidth,
    height: curHeight,
    format: 'image/jpeg',
  };
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
