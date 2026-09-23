import React, { useState } from 'react';
import { X, Terminal, Copy, Check, Info } from 'lucide-react';

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
}

export const CliModal: React.FC<CliModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const commands = [
    {
      title: '1. 本地试运行 (Dry-Run 模式，不请求微信)',
      cmd: `npm run cli -- tests/fixtures/article.md --theme ${activeTheme} --dry-run`,
      desc: '验证 Markdown 语法解析、图片路径与主题内联样式效果',
    },
    {
      title: '2. 真实推送至微信公众号草稿箱',
      cmd: `npm run cli -- ./article.md --theme ${activeTheme}`,
      desc: '上传本地配图至微信永久素材库，并创建对应草稿',
    },
    {
      title: '3. 强制推送 (跳过 SHA-256 幂等性校验)',
      cmd: `npm run cli -- ./article.md --theme ${activeTheme} --force`,
      desc: '若文章内容未变更但需在草稿箱重新生成一篇副本时使用',
    },
    {
      title: '4. 更新已有草稿 (覆盖指定 media_id)',
      cmd: `npm run cli -- ./article.md --draft-id "YOUR_MEDIA_ID"`,
      desc: '调用微信 draft/update 接口覆盖更新原草稿，不增加新草稿',
    },
    {
      title: '5. 指定独立配图目录与详细日志输出',
      cmd: `npm run cli -- ./posts/hello.md -i ./posts/assets --verbose`,
      desc: '从自定义目录查找配图，并输出详细 HTTP 握手日志',
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">CLI 终端常用指令清单</h3>
              <p className="text-[11px] text-neutral-400">
                支持在本地 Terminal、CI/CD 自动化流水线或脚本中一键调度
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

        {/* Commands List */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {commands.map((c, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-neutral-850 rounded-xl border border-neutral-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200">{c.title}</span>
                <span className="text-[11px] text-neutral-500">{c.desc}</span>
              </div>
              <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-sky-300 font-mono text-[11px]">
                <code className="truncate mr-2">{c.cmd}</code>
                <button
                  onClick={() => handleCopy(c.cmd, idx)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition flex-shrink-0"
                  title="复制命令"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              全局安装或软链接后可直接使用 <code className="text-neutral-200 font-mono">wechat-publish article.md</code> 命令进行快速推送。完整文档请参阅项目根目录中的 <code className="text-neutral-200 font-mono">README.md</code>。
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
