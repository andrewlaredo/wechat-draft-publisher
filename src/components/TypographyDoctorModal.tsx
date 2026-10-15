import React, { useState, useMemo } from 'react';
import {
  X,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  BookOpen,
  Clock,
  FileText,
  AlignLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  diagnoseTypography,
  autoFixTypography,
  TypographyReport,
} from '../utils/typographyDoctor.ts';
import {
  scanExternalLinks,
  convertLinksToFootnotes,
  ExternalLinkItem,
} from '../utils/footnoteConverter.ts';

interface TypographyDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  onApplyMarkdown: (newMarkdown: string) => void;
}

export const TypographyDoctorModal: React.FC<TypographyDoctorModalProps> = ({
  isOpen,
  onClose,
  markdown,
  onApplyMarkdown,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'footnotes' | 'guide'>('diagnosis');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Readability report
  const report: TypographyReport = useMemo(() => {
    return diagnoseTypography(markdown);
  }, [markdown]);

  // Scanned external links
  const externalLinks: ExternalLinkItem[] = useMemo(() => {
    return scanExternalLinks(markdown);
  }, [markdown]);

  if (!isOpen) return null;

  const handleRunAutoFix = () => {
    const { fixedMarkdown, changesCount } = autoFixTypography(markdown);
    if (changesCount > 0) {
      onApplyMarkdown(fixedMarkdown);
      setAppliedNotice('✨ 已成功执行智能规范化排版（盘古空格、标点与多余空行已优化）！');
    } else {
      setAppliedNotice('🎉 当前正文排版已极为规范，无需额外调整！');
    }
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const handleConvertFootnotes = () => {
    const { convertedMarkdown, linkCount } = convertLinksToFootnotes(markdown, {
      footnoteStyle: 'superscript',
      includeWeChatLinks: false,
    });
    if (linkCount > 0) {
      onApplyMarkdown(convertedMarkdown);
      setAppliedNotice(`📚 已成功将 ${linkCount} 处外部链接转换为文末优雅脚注与延伸阅读卡！`);
    } else {
      setAppliedNotice('文中未检测到可转换的外部链接或均为微信内链。');
    }
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const scoreColor =
    report.overallScore >= 90
      ? 'text-emerald-400'
      : report.overallScore >= 75
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">微信排版医生与阅读体验体检</h2>
                <span className={`text-xs font-semibold ${scoreColor}`}>
                  阅读健康分: {report.overallScore} · {report.level}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                盘古空格规范、段落压迫度诊断、标点校正与微信外链转文末脚注
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Feedback Notification Bar */}
        {appliedNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{appliedNotice}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('diagnosis')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'diagnosis'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>排版体检诊断 ({report.suggestions.length} 项建议)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('footnotes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'footnotes'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>外链转文末脚注 ({externalLinks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'guide'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>大厂排版规范准则</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunAutoFix}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            title="一键自动执行中英文盘古空格、标点规范与多余空行折叠"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>一键智能规范化排版</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* TAB 1: DIAGNOSIS */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-5">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-850 border border-neutral-750 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>总字数 / 预估耗时</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-neutral-100 font-mono">
                    {report.wordCount} <span className="text-xs font-normal text-neutral-400">字</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    约 {report.readingTimeMinutes} 分钟完读 (按 400字/分)
                  </div>
                </div>

                <div className="bg-neutral-850 border border-neutral-750 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>段落与视觉压迫</span>
                    <AlignLeft className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-neutral-100 font-mono">
                    {report.paragraphCount} <span className="text-xs font-normal text-neutral-400">段</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    平均每段 {report.avgParagraphWords} 字
                  </div>
                </div>

                <div className="bg-neutral-850 border border-neutral-750 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>盘古空格瑕疵</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono">
                    <span className={report.spacingIssuesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {report.spacingIssuesCount}
                    </span>
                    <span className="text-xs font-normal text-neutral-400 ml-1">处紧贴</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {report.spacingIssuesCount === 0 ? '中英文间隔极佳' : '建议一键插入标准空格'}
                  </div>
                </div>

                <div className="bg-neutral-850 border border-neutral-750 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                    <span>图文配比感官</span>
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-neutral-100 font-mono">
                    {report.imageCount} <span className="text-xs font-normal text-neutral-400">图</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 truncate" title={report.imageRatioText}>
                    {report.imageRatioText}
                  </div>
                </div>
              </div>

              {/* Highlights & Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suggestions List */}
                <div className="bg-neutral-850 border border-neutral-750 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>排版优化建议 ({report.suggestions.length})</span>
                  </h3>
                  {report.suggestions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>非常棒！正文排版规范完全符合微信大厂阅读标准。</span>
                    </div>
                  ) : (
                    <ul className="space-y-2 text-xs text-neutral-300">
                      {report.suggestions.map((sug, i) => (
                        <li key={i} className="flex items-start gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span className="leading-relaxed">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Highlights List */}
                <div className="bg-neutral-850 border border-neutral-750 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>优秀排版亮点</span>
                  </h3>
                  {report.highlights.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500">
                      暂未检测到显著排版亮点
                    </div>
                  ) : (
                    <ul className="space-y-2 text-xs text-neutral-300">
                      {report.highlights.map((hl, i) => (
                        <li key={i} className="flex items-start gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{hl}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Long Paragraph Warning Section */}
              {report.longParagraphs.length > 0 && (
                <div className="bg-neutral-850 border border-amber-900/50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-neutral-200">
                        微信窄屏高压长段落预警 (共 {report.longParagraphs.length} 处超过 180 字)
                      </h4>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      手机端超过 5 行未分段易造成阅读跳读
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {report.longParagraphs.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="text-amber-400 font-mono font-semibold mr-2">
                            第 {item.line} 行 ({item.wordCount} 字)
                          </span>
                          <span className="text-neutral-300 italic">{item.snippet}</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 whitespace-nowrap">
                          建议拆为 2 段
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOOTNOTES GENERATOR */}
          {activeTab === 'footnotes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-cyan-400" />
                    <span>正文外部链接转文末优雅脚注与延伸阅读卡</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    微信正文不支持外链直跳。转换为学术角标 `^[1]` 并附带美观参考资料底卡，既合规又极具专业感。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConvertFootnotes}
                  disabled={externalLinks.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 shrink-0"
                  title="将文中的外部超链接一键转换为角标并在文末生成高质感参考资料卡片"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>一键转换为文末脚注</span>
                </button>
              </div>

              {externalLinks.length === 0 ? (
                <div className="py-12 text-center bg-neutral-850/60 rounded-xl border border-dashed border-neutral-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-neutral-300 font-medium">
                    文中未检测到外部超链接，无微信死链风险！
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    若需要引用行业研报或官网，可直接在 Markdown 中输入 `[文本](https://...)` 后点击此处一键转脚注。
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs text-neutral-400 flex items-center justify-between">
                    <span>检测到 {externalLinks.length} 处外部超链接：</span>
                    <span className="text-[11px] text-amber-400">⚠️ 微信端读者点击这些链接均无法直接跳转</span>
                  </div>

                  <div className="space-y-2">
                    {externalLinks.map((link) => (
                      <div
                        key={link.id}
                        className="bg-neutral-850 border border-neutral-750 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                            {link.id}
                          </span>
                          <div className="truncate">
                            <span className="font-semibold text-neutral-200 mr-2">{link.text}</span>
                            <span className="text-neutral-500 font-mono text-[11px]">{link.url}</span>
                          </div>
                        </div>

                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0">
                          {link.isWeChatInternal ? '微信公众号内链' : '外部网页'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="bg-neutral-850 border border-neutral-750 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-neutral-100 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>1. 盘古之白排版规范 (Pangu Spacing)</span>
                </h4>
                <p className="text-neutral-400">
                  有研究显示，打字的时候在中文与英文、数字之间插入空格，能显著提升手机窄屏界面的字符辨识度与阅读流畅感。
                </p>
                <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 space-y-1 font-mono text-[11px]">
                  <div className="text-rose-400 line-through">❌ 苹果发布了iPhone16Pro搭载A18芯片性能提升30%</div>
                  <div className="text-emerald-400">✅ 苹果发布了 iPhone 16 Pro 搭载 A18 芯片性能提升 30%</div>
                </div>
              </div>

              <div className="bg-neutral-850 border border-neutral-750 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-neutral-100 text-sm flex items-center gap-1.5">
                  <AlignLeft className="w-4 h-4 text-cyan-400" />
                  <span>2. 微信手机端呼吸感黄金法则</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  <li><strong>控制单段长度</strong>：手机端屏幕狭窄，单段文字尽量控制在 80~140 字以内，避免形成黑压压的“文字大山”。</li>
                  <li><strong>图文穿插节奏</strong>：长文推荐每 300~500 字配一张示意图、流程卡或金句框，形成张弛有度的视觉驻留点。</li>
                  <li><strong>巧用文末脚注</strong>：微信外链不能直接跳转，用角标 `^[1]` 搭配文末参考资料底卡，既合规又显得专业严谨。</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
