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
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  hasSecret: boolean;
  proxyUrl: string;
  onSave: (data: { appId: string; appSecret?: string; proxyUrl?: string }) => Promise<void>;
  onTestToken: (data: { appId: string; appSecret?: string; proxyUrl?: string }) => Promise<{ success: boolean; message?: string; error?: string; token_preview?: string }>;
  onReloadConfig?: () => Promise<void>;
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
}) => {
  const [appId, setAppId] = useState(initialAppId);
  const [appSecret, setAppSecret] = useState('');
  const [proxyUrl, setProxyUrl] = useState(initialProxyUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

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
              <h3 className="text-sm font-semibold text-neutral-100">微信公众号接口与开发者凭据</h3>
              <p className="text-[11px] text-neutral-400">
                配置 AppID / AppSecret 用于自动上传素材及发布草稿
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
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
