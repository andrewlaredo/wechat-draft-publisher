/**
 * accountManager.ts
 * 多公众号凭据与矩阵账号管理引擎 (Multi-Account Matrix Manager)
 * 
 * 支持保存、安全检测与无缝切换：
 * - 个人订阅号 (Subscription)
 * - 企业服务号 (Service)
 * - 微信开发者测试号 (Test)
 * 
 * 增强能力：
 * 1. 账号分组标签 (主号、副号、商业资讯、垂直技术)
 * 2. 账号健康状态检测与记录 (连通性、Access Token 有效期)
 * 3. 账号配置安全导出备份与一键恢复导入
 */

export interface WeChatAccountConfig {
  id: string;
  name: string;
  appId: string;
  appSecret?: string;
  hasSecret?: boolean;
  proxyUrl?: string;
  accountType: 'subscription' | 'service' | 'test';
  tag?: string; // 标签，如「主号·技术」、「矩阵·资讯」
  color?: string; // 标识色彩 (emerald, blue, purple, amber, rose)
  notes?: string; // 运营备忘说明
  lastTestedAt?: number; // 上次连通性测试时间
  lastTestStatus?: 'ok' | 'fail' | 'untested';
  lastTestMessage?: string;
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

/**
 * 导出全部账号凭据配置 (JSON 格式备份)
 */
export function exportAccountsBackupJson(accounts: WeChatAccountConfig[], includeSecrets = false): string {
  const exportList = accounts.map((acc) => ({
    ...acc,
    appSecret: includeSecrets ? acc.appSecret : acc.appSecret ? '******' : undefined,
  }));
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'WeChat Draft Publisher',
      accounts: exportList,
    },
    null,
    2
  );
}

/**
 * 恢复导入账号配置
 */
export function importAccountsFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const list = Array.isArray(data) ? data : data.accounts;
    if (!Array.isArray(list) || list.length === 0) {
      return { success: false, count: 0, error: 'JSON 数据格式不正确或账号列表为空' };
    }

    const current = getStoredAccounts();
    const existingIds = new Set(current.map((a) => a.id));
    const merged = [...current];

    let addedCount = 0;
    for (const item of list) {
      if (item.appId) {
        const id = item.id && !existingIds.has(item.id) ? item.id : `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        merged.push({
          id,
          name: item.name || '导入公众号',
          appId: item.appId,
          appSecret: item.appSecret && item.appSecret !== '******' ? item.appSecret : undefined,
          accountType: item.accountType || 'subscription',
          tag: item.tag || '已导入',
          color: item.color || 'blue',
          notes: item.notes || '',
          createdAt: item.createdAt || Date.now(),
        });
        existingIds.add(id);
        addedCount++;
      }
    }

    saveStoredAccounts(merged);
    return { success: true, count: addedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'JSON 解析失败' };
  }
}
