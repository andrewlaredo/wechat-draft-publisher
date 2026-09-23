import React from 'react';
import { ShieldAlert, Key, Play, Copy, X, CheckCircle2 } from 'lucide-react';

interface NoCredentialsNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onDryRun: () => void;
  onCopyHtml: () => void;
}

export const NoCredentialsNoticeModal: React.FC<NoCredentialsNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onDryRun,
  onCopyHtml,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                尚未配置微信开发者凭据
              </h3>
              <p className="text-[11px] text-neutral-400">
                当前正处于【本地排版安全模式】
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs text-neutral-300">
          <p className="leading-relaxed">
            直接将文章推送到微信公众号官方草稿箱需要填入微信公众平台的 <strong>AppID</strong> 与 <strong>AppSecret</strong>，并在后台开启 <strong>IP 白名单</strong>。
          </p>

          <div className="p-3.5 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-2">
            <div className="font-semibold text-neutral-200">免凭据也可畅快创作：</div>
            <ul className="text-[11px] text-neutral-400 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-emerald-400">一键试运行</strong>：零凭据跑通 Markdown 解析、Juice 100% 深度内联与字数校验。
              </li>
              <li>
                <strong className="text-emerald-400">复制微信排版</strong>：一键复制高保真内联富文本，在微信公众平台文章编辑器中直接 <kbd className="font-mono text-neutral-300">Ctrl/Cmd + V</kbd> 粘贴。
              </li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-850 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCopyHtml();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center justify-center space-x-1"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-400" />
            <span>复制排版</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDryRun();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition flex items-center justify-center space-x-1"
          >
            <Play className="w-3.5 h-3.5" />
            <span>一键试运行</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center space-x-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span>前往配置凭据</span>
          </button>
        </div>
      </div>
    </div>
  );
};
