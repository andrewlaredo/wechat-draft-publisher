import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  performSafetyAudit,
  autoFixContent,
  SafetyAuditReport,
  SensitiveIssue,
} from '../utils/safetyAudit.ts';

interface SafetyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  title: string;
  digest: string;
  inlinedHtml: string;
  onApplyFixedMarkdown: (fixedMarkdown: string) => void;
}

export const SafetyAuditModal: React.FC<SafetyAuditModalProps> = ({
  isOpen,
  onClose,
  markdown,
  title,
  digest,
  inlinedHtml,
  onApplyFixedMarkdown,
}) => {
  const [fixedApplied, setFixedApplied] = useState(false);

  const report: SafetyAuditReport = useMemo(() => {
    return performSafetyAudit({
      markdown,
      title,
      digest,
      inlinedHtml,
    });
  }, [markdown, title, digest, inlinedHtml]);

  if (!isOpen) return null;

  const handleAutoFix = () => {
    const { fixedMarkdown, replaceCount } = autoFixContent(markdown);
    onApplyFixedMarkdown(fixedMarkdown);
    setFixedApplied(true);
    setTimeout(() => setFixedApplied(false), 3000);
  };

  const scoreColor =
    report.score >= 90
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : report.score >= 70
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">内容安全与发布合规体检</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
                  广告法 & 微信防封盾
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                扫描广告法极限词、微信诱导分享违规词、外链风险与 HTML 字符限制
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Health Score Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400">内容合规健康评分</div>
              <div className="text-sm font-bold text-neutral-200">{report.summary}</div>
              <div className="text-[11px] text-neutral-500">
                HTML 总字符数: {report.htmlLength.toLocaleString()} / 20,000 | 纯文本: {report.charCount} 字
              </div>
            </div>

            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-bold shrink-0 ${scoreColor}`}>
              <span className="text-2xl font-mono leading-none">{report.score}</span>
              <span className="text-[10px] mt-0.5 font-medium">分</span>
            </div>
          </div>

          {/* Issue summary counters */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-neutral-400 text-[11px]">高危阻断项</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${report.highCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {report.highCount} 处
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-neutral-400 text-[11px]">广告法极限词</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${report.mediumCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {report.mediumCount} 处
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-neutral-400 text-[11px]">外部链接提醒</div>
              <div className="text-base font-bold font-mono mt-0.5 text-neutral-300">
                {report.lowCount} 处
              </div>
            </div>
          </div>

          {/* Action: One-click Auto Fix */}
          {report.issues.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-neutral-950 rounded-xl border border-emerald-800/60 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  智能合规一键修复
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  自动将极限词与诱导词替换为合规安全的同义词
                </div>
              </div>

              <button
                onClick={handleAutoFix}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                {fixedApplied ? <Check className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                {fixedApplied ? '已成功修复' : '一键自动修复'}
              </button>
            </div>
          )}

          {/* Issues List */}
          <div className="space-y-2">
            <div className="font-semibold text-neutral-300 text-xs">检测详情报告</div>
            {report.issues.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-medium text-neutral-200">未发现任何违规与阻断风险！</div>
                <p className="text-[11px] text-neutral-500">
                  当前文章符合新广告法规范与微信公众平台发布准则，可放心推送到微信草稿箱或全网分发。
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {issue.severity === 'high' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : issue.severity === 'medium' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span className="font-semibold text-neutral-200">{issue.title}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          issue.severity === 'high'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : issue.severity === 'medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {issue.severity === 'high' ? '高危' : issue.severity === 'medium' ? '中危' : '提醒'}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {issue.description}
                    </p>

                    {issue.replacement && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <span>合规替代建议:</span>
                        <code className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/80 font-mono text-emerald-300">
                          {issue.replacement}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-neutral-400">
            合规检测仅供参考，请严格遵守《中华人民共和国广告法》与微信公众平台运营规范。
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
