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
  Download,
  Upload,
  Activity,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import {
  WeChatAccountConfig,
  getStoredAccounts,
  saveStoredAccounts,
  getActiveAccountId,
  setActiveAccountId,
  exportAccountsBackupJson,
  importAccountsFromJson,
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
  const [isBatchTesting, setIsBatchTesting] = useState(false);
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
        tag: '主号·默认',
        color: 'emerald',
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
  const [newAccTag, setNewAccTag] = useState('主号·核心');
  const [newAccNotes, setNewAccNotes] = useState('');
  const [newAccAppId, setNewAccAppId] = useState('');
  const [newAccSecret, setNewAccSecret] = useState('');

  if (!isOpen) return null;

  const handleAddAccount = () => {
    if (!newAccName.trim() || !newAccAppId.trim()) {
      alert('请填写公众号名称与 AppID');
      return;
    }
    const colorMap: Record<string, string> = {
      subscription: 'emerald',
      service: 'blue',
      test: 'purple',
    };
    const newAcc: WeChatAccountConfig = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      appId: newAccAppId.trim(),
      appSecret: newAccSecret.trim() || undefined,
      accountType: newAccType,
      tag: newAccTag.trim() || '通用账号',
      color: colorMap[newAccType] || 'emerald',
      notes: newAccNotes.trim() || undefined,
      createdAt: Date.now(),
    };
    const nextList = [...accounts, newAcc];
    setAccounts(nextList);
    saveStoredAccounts(nextList);
    setShowAddForm(false);
    setNewAccName('');
    setNewAccAppId('');
    setNewAccSecret('');
    setNewAccNotes('');
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
      message: `已成功切换当前发布目标为「${acc.name}」！`,
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

  // Batch health diagnosis for all accounts
  const handleBatchHealthCheck = async () => {
    setIsBatchTesting(true);
    const updated = [...accounts];

    for (let i = 0; i < updated.length; i++) {
      const acc = updated[i];
      try {
        const res = await onTestToken({
          appId: acc.appId,
          appSecret: acc.appSecret,
          proxyUrl,
        });
        if (res.success) {
          updated[i] = {
            ...acc,
            lastTestedAt: Date.now(),
            lastTestStatus: 'ok',
            lastTestMessage: res.message || 'Token 有效',
          };
        } else {
          updated[i] = {
            ...acc,
            lastTestedAt: Date.now(),
            lastTestStatus: 'fail',
            lastTestMessage: res.error || '连接失败',
          };
        }
      } catch (err: any) {
        updated[i] = {
          ...acc,
          lastTestedAt: Date.now(),
          lastTestStatus: 'fail',
          lastTestMessage: err.message || '网络异常',
        };
      }
    }

    setAccounts(updated);
    saveStoredAccounts(updated);
    setIsBatchTesting(false);
    onAccountsChange?.(updated, activeAccId);
  };

  // Export account configs
  const handleExportAccounts = () => {
    const jsonStr = exportAccountsBackupJson(accounts, false);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wechat-accounts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import account configs
  const handleImportAccounts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const res = importAccountsFromJson(text);
      if (res.success) {
        const nextList = getStoredAccounts();
        setAccounts(nextList);
        onAccountsChange?.(nextList, activeAccId);
        alert(`成功导入 ${res.count} 个公众号账号配置！`);
      } else {
        alert(`导入失败: ${res.error}`);
      }
    };
    input.click();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">公众号接口凭据与矩阵账号管理</h3>
              <p className="text-[11px] text-neutral-400">
                支持管理订阅号、服务号与测试号，具备健康体检与安全导入导出备份
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
        <div className="px-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center space-x-4">
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
              <span>当前凭据与网络设置</span>
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
              <span>矩阵账号档案 ({accounts.length})</span>
            </button>
          </div>

          {activeTab === 'accounts' && (
            <div className="flex items-center gap-1.5 py-1">
              <button
                type="button"
                onClick={handleBatchHealthCheck}
                disabled={isBatchTesting}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-[11px] font-medium border border-neutral-700 flex items-center gap-1 transition"
                title="批量测试所有账号 Token 连通性"
              >
                {isBatchTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3 text-emerald-400" />}
                <span>一键体检</span>
              </button>
              <button
                type="button"
                onClick={handleExportAccounts}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-neutral-200 transition"
                title="导出账号配置备份 (JSON)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleImportAccounts}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-neutral-200 transition"
                title="从 JSON 文件导入账号"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[64vh]">
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
                  关键安全提示：配置 IP 白名单 (防止 40164 报错)
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
                  <h4 className="font-semibold text-neutral-200 text-xs">公众号账号矩阵列表</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    管理全网微信公众号资产，支持分组标签、Token 健康体检与一键切换。
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
                <div className="p-4 bg-neutral-850 rounded-xl border border-neutral-750 space-y-3">
                  <div className="font-semibold text-neutral-200 text-xs">录入新公众号凭据配置</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">账号名称 (如: 极客周刊)</label>
                      <input
                        type="text"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        placeholder="科技前沿订阅号"
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
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">矩阵分组标签</label>
                      <select
                        value={newAccTag}
                        onChange={(e) => setNewAccTag(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100"
                      >
                        <option value="主号·技术深耕">主号·技术深耕</option>
                        <option value="副号·职场生活">副号·职场生活</option>
                        <option value="矩阵·商业资讯">矩阵·商业资讯</option>
                        <option value="测试·排版演练">测试·排版演练</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      <label className="text-[11px] text-neutral-400 block mb-1">AppSecret (可选，用于自动推送)</label>
                      <input
                        type="password"
                        value={newAccSecret}
                        onChange={(e) => setNewAccSecret(e.target.value)}
                        placeholder="32位AppSecret秘钥"
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">运营备忘说明 (可选)</label>
                    <input
                      type="text"
                      value={newAccNotes}
                      onChange={(e) => setNewAccNotes(e.target.value)}
                      placeholder="例如: 每日早8点发文，读者主要为一线城市工程师"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100"
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
                      保存并加入矩阵
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
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-950/30 border-emerald-800 ring-1 ring-emerald-500/30'
                          : 'bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-neutral-100 text-xs">{acc.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              acc.accountType === 'service'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : acc.accountType === 'test'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {acc.accountType === 'service' ? '服务号' : acc.accountType === 'test' ? '测试号' : '订阅号'}
                          </span>
                          {acc.tag && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {acc.tag}
                            </span>
                          )}
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-600 text-white font-bold flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> 当前目标
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 font-mono">
                          <span>AppID: {acc.appId}</span>
                          <span>{acc.appSecret ? '• [已设Secret]' : '• [免Secret模式]'}</span>
                          {acc.lastTestStatus && (
                            <span
                              className={`flex items-center gap-1 ${
                                acc.lastTestStatus === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  acc.lastTestStatus === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              {acc.lastTestStatus === 'ok' ? '连通正常' : '连通异常'}
                            </span>
                          )}
                        </div>

                        {acc.notes && (
                          <div className="text-[11px] text-neutral-500 italic">
                            备忘: {acc.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(acc)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition"
                          >
                            设为发布目标
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
              <span>测试当前凭据</span>
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
              关闭
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>保存当前配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
