import React from 'react';
import { X, Heart, ExternalLink, QrCode, Sparkles } from 'lucide-react';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WECHAT_PAY_QR_URL = '/wechat-pay.svg';

export const SponsorModal: React.FC<SponsorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100 flex items-center gap-1.5">
                微信赞赏与支持
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  WeChat Pay
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                如果工具对您有帮助，欢迎微信扫码为作者买杯咖啡 ☕
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Direct WeChat Pay QR Sticker */}
        <div className="p-6 overflow-y-auto flex flex-col items-center space-y-4">
          {/* QR Code Sticker Card (Fixed Image) */}
          <div className="relative group bg-white p-3 rounded-2xl shadow-xl border border-neutral-200 max-w-[280px] w-full flex flex-col items-center">
            <div className="w-full aspect-[4/5] overflow-hidden rounded-xl bg-neutral-50 flex items-center justify-center">
              <img
                src={WECHAT_PAY_QR_URL}
                alt="微信支付赞赏码"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>微信扫一扫 · 赞赏支持作者</span>
            </div>
          </div>

          {/* Secondary: GitHub Sponsors Link */}
          <div className="w-full pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-850 border border-neutral-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-neutral-200">GitHub 官方 Sponsors</div>
                  <div className="text-[11px] text-neutral-400">支持 Visa / MasterCard 及 PayPal</div>
                </div>
              </div>
              <a
                href="https://github.com/sponsors/andrewlaredo"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-neutral-700 hover:border-rose-800/50 transition shrink-0"
              >
                <span>前往赞助</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between text-xs text-neutral-400">
          <span>💖 感谢每一位支持项目持续维护的伙伴</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
