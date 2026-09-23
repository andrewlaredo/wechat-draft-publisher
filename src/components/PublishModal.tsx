import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Play,
  RotateCcw,
} from 'lucide-react';
import { PublishLogItem } from '../types/app.ts';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDryRun: boolean;
  isPublishing: boolean;
  result: any | null;
  error: string | null;
  logs: PublishLogItem[];
  onRetry: (dryRun: boolean, force: boolean) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  isDryRun,
  isPublishing,
  result,
  error,
  logs,
  onRetry,
}) => {
  if (!isOpen) return null;

  const steps = [
    { num: 1, title: '解析 Markdown', desc: '提取 Front Matter、标题与摘要' },
    { num: 2, title: '转换 HTML 与内联排版', desc: '应用主题样式与 Juice 100% 深度内联' },
    { num: 3, title: '处理配图与素材库', desc: '并发直传微信永久素材库与替换 URL' },
    { num: 4, title: '发布微信草稿箱', desc: 'SHA-256 幂等性校验与草稿创建' },
  ];

  // Determine active step from logs
  const latestLog = logs[logs.length - 1];
  const currentStep = latestLog ? latestLog.step : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDryRun
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
              }`}
            >
              {isDryRun ? <Play className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                {isDryRun ? 'Dry-Run 本地试运行与排版验证' : '推送图文至微信公众号草稿箱'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {isDryRun ? '模拟全流程，不向微信服务器实际请求' : '直连微信公众平台官方接口'}
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* 4 Pipeline Steps */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((s) => {
              const isDone = (!isPublishing && !!result) || currentStep > s.num;
              const isRunning = isPublishing && currentStep === s.num;

              return (
                <div
                  key={s.num}
                  className={`p-3 rounded-xl border transition ${
                    isDone
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                      : isRunning
                      ? 'bg-neutral-800 border-neutral-600 text-neutral-100 ring-1 ring-emerald-500/40'
                      : 'bg-neutral-850 border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold">[{s.num}/4]</span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-neutral-700" />
                    )}
                  </div>
                  <div className="font-medium text-xs truncate">{s.title}</div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">{s.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Success Box */}
          {result && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {result.is_cached
                    ? '命中幂等记录：文章内容未变动，草稿已存在'
                    : isDryRun
                    ? 'Dry-Run 试运行成功！排版与配图映射验证完毕'
                    : '🎉 微信公众号草稿创建成功！'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">草稿 media_id:</span>
                  <span className="text-emerald-300 font-bold">{result.media_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">消息类型:</span>
                  <span className={result.article_type === 'newspic' ? 'text-rose-400 font-medium' : 'text-neutral-200'}>
                    {result.article_type === 'newspic' ? '📸 图片消息 / 贴图 (newspic)' : '📝 经典图文长文 (news)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">文章标题:</span>
                  <span className="text-neutral-200">{result.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">作者 / 主题:</span>
                  <span className="text-neutral-200">
                    {result.author} / {result.article_type === 'newspic' ? '原生小绿书轮播' : result.theme || 'default'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">已处理配图:</span>
                  <span className="text-neutral-200">
                    {result.uploaded_images?.length || 0} 张 {result.article_type === 'newspic' ? '(永久素材库 image_info)' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">内容指纹 (SHA-256):</span>
                  <span className="text-neutral-400 truncate max-w-[240px]">
                    {result.hash}
                  </span>
                </div>
              </div>

              {!isDryRun && (
                <div className="flex items-center justify-between text-neutral-400 text-xs pt-1">
                  <span>可登录微信公众平台查看并预览草稿</span>
                  <a
                    href="https://mp.weixin.qq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    前往微信公众平台 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Error Box */}
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl space-y-3">
              <div className="flex items-start space-x-2 text-red-400 font-semibold text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <div>发布遇到问题</div>
                  <div className="font-normal text-xs text-red-300 mt-1 whitespace-pre-wrap">
                    {error}
                  </div>
                </div>
              </div>

              {/* IP Whitelist quick tip */}
              {error.includes('40164') && (
                <div className="p-3 bg-neutral-900/90 rounded-lg border border-red-900/60 text-neutral-300 text-xs space-y-1.5">
                  <div className="font-semibold text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> 微信 IP 白名单解决方案
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    1. 访问微信公众平台后台 (mp.weixin.qq.com) ➡️ 设置与开发 ➡️ 基本配置 ➡️ IP 白名单。<br />
                    2. 将上方提示中报错的公网 IP 填入白名单列表。<br />
                    3. 保存后等待约 1~2 分钟生效，然后重新尝试推送。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Real-time Logs Terminal */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-neutral-400 text-[11px] font-mono">
              <Terminal className="w-3 h-3" />
              <span>执行流水线日志</span>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 max-h-40 overflow-y-auto space-y-1 leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-neutral-500">等待任务启动...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-neutral-500">[{log.timestamp}]</span>
                    <span className="text-emerald-400 font-bold">[{log.step}/4]</span>
                    <span className="text-neutral-200">{log.msg}</span>
                    {log.status === 'done' && (
                      <span className="text-emerald-400 text-[10px] ml-auto">完成</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition"
          >
            关闭
          </button>

          <div className="flex items-center space-x-2">
            {result?.is_cached && (
              <button
                onClick={() => onRetry(isDryRun, true)}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
                title="忽略内容指纹，强制创建新草稿"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>强制重新发布 (--force)</span>
              </button>
            )}

            {error && (
              <button
                onClick={() => onRetry(true, true)}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>改用 Dry-Run 本地测试</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
