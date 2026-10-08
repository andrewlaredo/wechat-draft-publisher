import React, { useState } from 'react';
import {
  X,
  Key,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
  RefreshCw,
  Users,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import {
  WeChatAccountConfig,
  getStoredAccounts,
  saveStoredAccounts,
  getActiveAccountId,
  setActiveAccountId,
} from '../utils/accountManager.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  hasSecret: boolean;
  proxyUrl: string;
  onSave: (data: { appId: string; appSecret?: string; proxyUrl?: string }) => Promise<void>;
  onTestToken: (data: { appId: string; appSecret?: string; proxyUrl?: string }) => Promise<{ success: boolean; message?: string; error?: string; token_preview?: string }>;
  onReloadConfig?: () => Promise<void>;
  onAccountsChange?: (accounts: WeChatAccountConfig[], activeId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appId: initialAppId,
  hasSecret,
  proxyUrl: initialProxyUrl,
  onSave,
  onTestToken,
  onReloadConfig,
  onAccountsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'accounts'>('current');
  const [appId, setAppId] = useState(initialAppId);
  const [appSecret, setAppSecret] = useState('');
  const [proxyUrl, setProxyUrl] = useState(initialProxyUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Multi-accounts state
  const [accounts, setAccounts] = useState<WeChatAccountConfig[]>(() => {
    const list = getStoredAccounts();
    if (list.length === 0 && initialAppId) {
      const defaultAcc: WeChatAccountConfig = {
        id: 'acc-default',
        name: '当前微信公众号',
        appId: initialAppId,
        accountType: 'subscription',
        createdAt: Date.now(),
      };
      saveStoredAccounts([defaultAcc]);
      return [defaultAcc];
    }
    return list;
  });
  const [activeAccId, setActiveAccId] = useState<string>(() => getActiveAccountId() || 'acc-default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'subscription' | 'service' | 'test'>('subscription');
  const [newAccAppId, setNewAccAppId] = useState('');
  const [newAccSecret, setNewAccSecret] = useState('');

  if (!isOpen) return null;

  const handleAddAccount = () => {
    if (!newAccName.trim() || !newAccAppId.trim()) {
      alert('请填写公众号名称与 AppID');
      return;
    }
    const newAcc: WeChatAccountConfig = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      appId: newAccAppId.trim(),
      appSecret: newAccSecret.trim() || undefined,
      accountType: newAccType,
      createdAt: Date.now(),
    };
    const nextList = [...accounts, newAcc];
    setAccounts(nextList);
    saveStoredAccounts(nextList);
    setShowAddForm(false);
    setNewAccName('');
    setNewAccAppId('');
    setNewAccSecret('');
    onAccountsChange?.(nextList, activeAccId);
  };

  const handleSwitchAccount = async (acc: WeChatAccountConfig) => {
    setActiveAccId(acc.id);
    setActiveAccountId(acc.id);
    setAppId(acc.appId);
    if (acc.appSecret) setAppSecret(acc.appSecret);
    await onSave({
      appId: acc.appId,
      appSecret: acc.appSecret,
    });
    onAccountsChange?.(accounts, acc.id);
    setTestResult({
      success: true,
      message: `已成功切换发布目标为「${acc.name}」！`,
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('确定删除该公众号账号配置吗？')) {
      const nextList = accounts.filter((a) => a.id !== id);
      setAccounts(nextList);
      saveStoredAccounts(nextList);
      onAccountsChange?.(nextList, activeAccId);
    }
  };

  const handleReload = async () => {
    if (!onReloadConfig) return;
    setIsReloading(true);
    setTestResult(null);
    try {
      await onReloadConfig();
      setTestResult({
        success: true,
        message: '已从本地磁盘 (config.yaml / .env / 运行缓存) 重新加载最新配置！',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '重载配置失败',
      });
    } finally {
      setIsReloading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestToken({ appId, appSecret: appSecret || undefined, proxyUrl });
      if (res.success) {
        setTestResult({
          success: true,
          message: `${res.message} (凭据预览: ${res.token_preview})`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || '获取 access_token 失败',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '网络连接失败',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        appId,
        appSecret: appSecret || undefined,
        proxyUrl,
      });
      onClose();
    } catch {
      // Handled
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">微信公众号接口与多账号切换</h3>
              <p className="text-[11px] text-neutral-400">
                配置 AppID / AppSecret 用于自动上传素材、草稿发布与多账号矩阵管理
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center space-x-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`py-2.5 flex items-center space-x-1.5 border-b-2 transition ${
              activeTab === 'current'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>当前凭据配置</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`py-2.5 flex items-center space-x-1.5 border-b-2 transition ${
              activeTab === 'accounts'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>多公众号账号管理 ({accounts.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[60vh]">
          {activeTab === 'current' && (
            <>
              {/* App ID */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  开发者 ID (AppID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="例如: wx1234567890abcdef"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* App Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-medium">
                    开发者密码 (AppSecret) <span className="text-red-400">*</span>
                  </label>
                  {hasSecret && (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 已配置秘钥 (输入新密码将覆盖)
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder={hasSecret ? '••••••••••••••••••••••••••••••••' : '从微信公众平台获取的 32 位秘钥'}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Proxy URL */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  代理服务器地址 (proxy_url, 可选)
                </label>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="例如: https://api-proxy.example.com (留空则直连微信官网)"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  用于需要统一固定出口 IP 白名单或境外加速访问微信 API 的场景。
                </p>
              </div>

              {/* Test connection result */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start space-x-2 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/80 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs whitespace-pre-wrap leading-relaxed">{testResult.message}</div>
                </div>
              )}

              {/* WeChat IP Whitelist notice */}
              <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2 text-neutral-400">
                <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  关键提示：配置 IP 白名单 (常见 40164 报错)
                </div>
                <p className="text-[11px] leading-relaxed">
                  微信接口严格要求调用方 IP 处于公众平台白名单中。请登录微信公众平台后台，进入「设置与开发」➡️「基本配置」➡️「IP 白名单」，将当前环境公网 IP 填入保存。
                </p>
                <a
                  href="https://mp.weixin.qq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium text-[11px]"
                >
                  登录微信公众平台后台 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {/* Persistence notice */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-[11px] text-emerald-400">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>配置保存后将自动持久化至本地运行缓存 (<code>.cache/runtime-config.json</code>)，服务重启后依然生效。</span>
              </div>
            </>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-200 text-xs">已保存的公众号账号列表</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    保存多个订阅号、服务号与测试号，顶栏支持一键下拉无缝切换。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm((p) => !p)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加账号</span>
                </button>
              </div>

              {/* Add Account Inline Form */}
              {showAddForm && (
                <div className="p-3.5 bg-neutral-850 rounded-xl border border-neutral-750 space-y-2.5">
                  <div className="font-semibold text-neutral-200 text-xs">新建公众号凭据配置</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">账号备注名 (如: 极客周刊)</label>
                      <input
                        type="text"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        placeholder="例如: 科技前沿订阅号"
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">账号类型</label>
                      <select
                        value={newAccType}
                        onChange={(e) => setNewAccType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100"
                      >
                        <option value="subscription">个人/企业订阅号</option>
                        <option value="service">企业认证服务号</option>
                        <option value="test">开发者测试号</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">AppID</label>
                    <input
                      type="text"
                      value={newAccAppId}
                      onChange={(e) => setNewAccAppId(e.target.value)}
                      placeholder="wx..."
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">AppSecret</label>
                    <input
                      type="password"
                      value={newAccSecret}
                      onChange={(e) => setNewAccSecret(e.target.value)}
                      placeholder="32位AppSecret秘钥"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded text-xs"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAccount}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      保存并加入
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts List */}
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const isActive = acc.id === activeAccId || acc.appId === appId;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-950/30 border-emerald-800'
                          : 'bg-neutral-850 border-neutral-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-neutral-200 text-xs">{acc.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                            acc.accountType === 'service'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : acc.accountType === 'test'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {acc.accountType === 'service' ? '服务号' : acc.accountType === 'test' ? '测试号' : '订阅号'}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-600 text-white font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> 当前激活
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500">
                          AppID: {acc.appId} {acc.appSecret ? '• [含Secret]' : ''}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(acc)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition"
                          >
                            设为当前目标
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1 text-neutral-500 hover:text-rose-400 rounded transition"
                          title="删除此账号"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !appId}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs border border-neutral-700 transition disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>测试凭据连接</span>
            </button>

            {onReloadConfig && (
              <button
                onClick={handleReload}
                disabled={isReloading}
                title="重新从 config.yaml / .env / 运行缓存重新载入配置"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs border border-neutral-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                <span>重载配置</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
