import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from '../utils/logger.ts';

export interface TokenCacheData {
  access_token: string;
  expires_at: number; // Unix timestamp in ms
}

export class WeChatAuth {
  private static inflightRequests: Map<string, Promise<string>> = new Map();
  private appId: string;
  private appSecret: string;
  private proxyUrl?: string;
  private tokenCachePath: string;

  constructor(appId: string, appSecret: string, proxyUrl?: string, tokenCachePath = '.cache/access_token.json') {
    this.appId = appId.trim();
    this.appSecret = appSecret.trim();
    this.proxyUrl = proxyUrl?.trim();
    this.tokenCachePath = path.resolve(tokenCachePath);
  }

  public static clearCachedToken(tokenCachePath = '.cache/access_token.json'): void {
    try {
      const fullPath = path.resolve(tokenCachePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.debug(`已清除失效的 Token 缓存: ${fullPath}`);
      }
    } catch (err: any) {
      logger.warn(`清除 Token 缓存失败: ${err.message}`);
    }
  }

  private readCache(): TokenCacheData | null {
    try {
      if (!fs.existsSync(this.tokenCachePath)) {
        return null;
      }
      const raw = fs.readFileSync(this.tokenCachePath, 'utf8');
      const data: TokenCacheData = JSON.parse(raw);
      if (data && data.access_token && typeof data.expires_at === 'number') {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private writeCache(token: string, expiresInSeconds: number): void {
    try {
      const dir = path.dirname(this.tokenCachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Cache expires 5 minutes earlier to be safe
      const safeExpiresInMs = Math.max(expiresInSeconds - 300, 60) * 1000;
      const cacheData: TokenCacheData = {
        access_token: token,
        expires_at: Date.now() + safeExpiresInMs,
      };
      fs.writeFileSync(this.tokenCachePath, JSON.stringify(cacheData, null, 2), 'utf8');
      logger.debug(`Token 已缓存至 ${this.tokenCachePath}，将在 ${new Date(cacheData.expires_at).toLocaleTimeString()} 前过期`);
    } catch (err: any) {
      logger.warn(`写入 Token 缓存文件失败: ${err.message}`);
    }
  }

  public clearCache(): void {
    try {
      if (fs.existsSync(this.tokenCachePath)) {
        fs.unlinkSync(this.tokenCachePath);
        logger.debug(`已清除失效的 Token 缓存: ${this.tokenCachePath}`);
      }
    } catch (err: any) {
      logger.warn(`清除 Token 缓存失败: ${err.message}`);
    }
  }

  /**
   * 获取微信 access_token（优先使用有效缓存，过期前5分钟自动续期）
   */
  public async getAccessToken(forceRefresh = false): Promise<string> {
    if (!this.appId || !this.appSecret) {
      throw new Error('缺少微信 AppID 或 AppSecret，无法获取 access_token');
    }

    if (!forceRefresh) {
      const cached = this.readCache();
      if (cached && cached.expires_at > Date.now()) {
        logger.debug('命中 access_token 缓存，直接使用缓存凭据');
        return cached.access_token;
      }
    }

    const inflightKey = `${this.appId}`;
    if (!forceRefresh && WeChatAuth.inflightRequests.has(inflightKey)) {
      return await WeChatAuth.inflightRequests.get(inflightKey)!;
    }

    const fetchPromise = (async () => {
      logger.debug('从微信官方服务器请求新的 access_token...');
      const baseUrl = this.proxyUrl ? this.proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
      const requestUrl = `${baseUrl}/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(
        this.appId
      )}&secret=${encodeURIComponent(this.appSecret)}`;

      try {
        const response = await axios.get(requestUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'wechat-draft-publisher/1.0',
          },
        });

        const data = response.data;

        if (data.errcode && data.errcode !== 0) {
          if (data.errcode === 40164) {
            const matchIp = data.errmsg ? data.errmsg.match(/ipv6?:\s*([0-9a-fA-F:.]+)/i) : null;
            const ipStr = matchIp ? matchIp[1] : '当前公网IP';
            throw new Error(
              `[微信错误 40164] 调用接口的服务器 IP (${ipStr}) 不在微信公众号的 IP 白名单中。\n` +
              `👉 解决办法：登录微信公众平台 -> 设置与开发 -> 基本配置 -> IP白名单，将 ${ipStr} 添加进白名单中，等待2分钟后重试。`
            );
          } else if (data.errcode === 40001) {
            throw new Error(`[微信错误 40001] 获取 access_token 时 AppSecret 错误或 AppID 不匹配，请检查配置。`);
          } else if (data.errcode === 40013) {
            throw new Error(`[微信错误 40013] 不合法的 AppID，请检查配置中的 AppID 是否输入正确。`);
          } else {
            throw new Error(`[微信错误 ${data.errcode}] ${data.errmsg || '获取 access_token 失败'}`);
          }
        }

        if (!data.access_token) {
          throw new Error(`微信接口返回异常，未包含 access_token: ${JSON.stringify(data)}`);
        }

        this.writeCache(data.access_token, data.expires_in || 7200);
        return data.access_token;
      } catch (err: any) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          throw new Error(`连接微信服务器超时，请检查网络或是否配置了可用的 proxy_url。`);
        }
        throw err;
      }
    })();

    WeChatAuth.inflightRequests.set(inflightKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      WeChatAuth.inflightRequests.delete(inflightKey);
    }
  }
}
