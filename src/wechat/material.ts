import FormData from 'form-data';
import axios from 'axios';
import path from 'path';
import { logger } from '../utils/logger.ts';

export interface UploadMaterialResult {
  media_id: string;
  url: string; // mmbiz.qpic.cn URL
}

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadImageToMaterial(
  accessToken: string,
  imageBuffer: Buffer,
  filename: string,
  proxyUrl?: string
): Promise<UploadMaterialResult> {
  const ext = path.extname(filename).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`不支持的图片格式: ${ext}。微信素材库仅支持 .png, .jpg, .jpeg, .gif, .webp。`);
  }

  if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (imageBuffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`图片文件超出微信限制 (${sizeMb}MB > 10MB): ${filename}，请先压缩图片。`);
  }

  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/material/add_material?access_token=${encodeURIComponent(
    accessToken
  )}&type=image`;

  const form = new FormData();
  form.append('media', imageBuffer, {
    filename: path.basename(filename),
    contentType: ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg',
  });

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'wechat-draft-publisher/1.0',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      if (data.errcode === 40001) {
        throw new Error(`[微信错误 40001] access_token 已过期或无效`);
      }
      throw new Error(`[微信素材上传失败 ${data.errcode}] ${data.errmsg || '未知错误'}`);
    }

    if (!data.media_id) {
      throw new Error(`微信接口返回缺少 media_id: ${JSON.stringify(data)}`);
    }

    logger.debug(`素材上传成功: media_id=${data.media_id}, url=${data.url}`);
    return {
      media_id: data.media_id,
      url: data.url,
    };
  } catch (err: any) {
    if (err.response?.data) {
      const respData = err.response.data;
      if (respData.errcode) {
        throw new Error(`[微信素材上传失败 ${respData.errcode}] ${respData.errmsg || '未知错误'}`);
      }
    }
    throw err;
  }
}
