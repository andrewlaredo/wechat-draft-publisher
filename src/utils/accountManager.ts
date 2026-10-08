/**
 * accountManager.ts
 * 多公众号凭据管理与快速切换引擎
 * 
 * 支持保存和无缝切换：
 * - 个人订阅号 (Subscription)
 * - 企业服务号 (Service)
 * - 微信开发者测试号 (Test)
 */

export interface WeChatAccountConfig {
  id: string;
  name: string;
  appId: string;
  appSecret?: string;
  hasSecret?: boolean;
  proxyUrl?: string;
  accountType: 'subscription' | 'service' | 'test';
  createdAt: number;
}

const STORAGE_ACCOUNTS_KEY = 'wechat_publisher_multi_accounts_v1';
const STORAGE_ACTIVE_ID_KEY = 'wechat_publisher_active_account_id_v1';

export function getStoredAccounts(): WeChatAccountConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredAccounts(accounts: WeChatAccountConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore
  }
}

export function getActiveAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveAccountId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch {
    // Ignore
  }
}
