import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Settings,
  Copy,
  Check,
  Play,
  FileText,
  Sparkles,
  Inbox,
  Heart,
  HelpCircle,
  Share2,
  Layers,
  FolderSync,
  ChevronDown,
  UserCheck,
  DownloadCloud,
  FileImage,
  ShieldCheck,
  Palette,
  Flame,
  Calendar,
  Command,
  Compass,
  Bot,
} from 'lucide-react';
import { WeChatAccountConfig } from '../utils/accountManager.ts';

interface HeaderProps {
  onPublish: (dryRun: boolean) => void;
  onCopyHtml: () => void;
  onOpenSettings: () => void;
  onOpenCli: () => void;
  onOpenAiGenerator: () => void;
  onOpenDraftManager: () => void;
  onOpenSponsor: () => void;
  onOpenHelpGuide: () => void;
  onOpenMatrixPublish?: () => void;
  onOpenWatchMode?: () => void;
  onOpenExtractArticle?: () => void;
  onOpenLongImageExport?: () => void;
  onOpenSafetyAudit?: () => void;
  onOpenCoverDesigner?: () => void;
  onOpenHeadlineLab?: () => void;
  onOpenEditorialCalendar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSvgInteractive?: () => void;
  onOpenStockPhoto?: () => void;
  onOpenXiaolvshuStudio?: () => void;
  onOpenTrendingRadar?: () => void;
  onOpenAutomationWebhook?: () => void;
  accounts?: WeChatAccountConfig[];
  activeAccountId?: string | null;
  onSwitchAccount?: (id: string) => void;
  isCopied: boolean;
  hasCredentials: boolean;
  isPublishing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onPublish,
  onCopyHtml,
  onOpenSettings,
  onOpenCli,
  onOpenAiGenerator,
  onOpenDraftManager,
  onOpenSponsor,
  onOpenHelpGuide,
  onOpenMatrixPublish,
  onOpenWatchMode,
  onOpenExtractArticle,
  onOpenLongImageExport,
  onOpenSafetyAudit,
  onOpenCoverDesigner,
  onOpenHeadlineLab,
  onOpenEditorialCalendar,
  onOpenCommandPalette,
  onOpenSvgInteractive,
  onOpenStockPhoto,
  onOpenXiaolvshuStudio,
  onOpenTrendingRadar,
  onOpenAutomationWebhook,
  accounts = [],
  activeAccountId,
  onSwitchAccount,
  isCopied,
  hasCredentials,
  isPublishing,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="bg-neutral-900/95 backdrop-blur border-b border-neutral-800 sticky top-0 z-30 px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2">
      {/* Brand */}
      <div className="flex items-center space-x-2.5 min-w-0 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 shrink-0">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-100 truncate flex items-center space-x-1.5">
              <span>FlowDraft</span>
              <span className="hidden md:inline-block text-[11px] font-normal text-emerald-400/90 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                工作台
              </span>
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 sm:text-[11px] sm:px-2 sm:py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium shrink-0">
              v2.0
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 hidden xl:block truncate">
            新媒体排版与自动化发布工作台 (WeChat Draft Publisher)
          </p>
        </div>
      </div>

      {/* Action Buttons (wrap on narrow screens so nothing gets clipped / unreachable) */}
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 min-w-0 flex-1">
        {/* Global Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            id="btn-header-command-palette"
            className="flex items-center space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 transition shadow-xs group"
            title="全局指令面板与极速调度（快捷键: ⌘K 或 Ctrl+K）"
          >
            <Command className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">搜索动作...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] text-neutral-400 border border-neutral-700 font-mono">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Copy Formatted HTML for WeChat direct paste */}
        <button
          onClick={onCopyHtml}
          id="btn-copy-wechat-html"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          title="复制高兼容内联 HTML，可直接在微信公众号后台富文本编辑器中粘贴（快捷键: ⌘+⇧+C）"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs hidden sm:inline">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">复制微信排版</span>
              <span className="hidden sm:inline xl:hidden">复制排版</span>
            </>
          )}
        </button>

        {/* Headline Lab Button */}
        {onOpenHeadlineLab && (
          <button
            onClick={onOpenHeadlineLab}
            id="btn-header-headline-lab"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-orange-300 border border-neutral-700 transition"
            title="爆款标题实验室：实时微信列表截断诊断与 6 大体系公式生成"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden xl:inline">爆款标题</span>
            <span className="hidden sm:inline xl:hidden">标题</span>
          </button>
        )}

        {/* Editorial Calendar Button */}
        {onOpenEditorialCalendar && (
          <button
            onClick={onOpenEditorialCalendar}
            id="btn-header-editorial-calendar"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-blue-300 border border-neutral-700 transition"
            title="运营日历与发文资产档案管理：排期看板、资产复盘与数据看板"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xl:inline">运营日历</span>
            <span className="hidden sm:inline xl:hidden">日历</span>
          </button>
        )}

        {/* Long Image Export Button */}
        {onOpenLongImageExport && (
          <button
            onClick={onOpenLongImageExport}
            id="btn-header-long-image-export"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
            title="一键将排版文章导出为高清长图（手机仿真/长微博/卡片海报）"
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">长图导出</span>
            <span className="hidden sm:inline xl:hidden">长图</span>
          </button>
        )}

        {/* Cover Designer Button */}
        {onOpenCoverDesigner && (
          <button
            onClick={onOpenCoverDesigner}
            id="btn-header-cover-designer"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-rose-300 border border-neutral-700 transition"
            title="微信封面图设计工坊：自动根据标题合成 2.35:1 大封面，带微信安全区辅助线"
          >
            <Palette className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">封面工坊</span>
            <span className="hidden sm:inline xl:hidden">封面</span>
          </button>
        )}

        {/* Trending Topic Radar Button */}
        {onOpenTrendingRadar && (
          <button
            onClick={onOpenTrendingRadar}
            id="btn-header-trending-radar"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-orange-300 border border-neutral-700 transition"
            title="全网实时热点雷达：聚合微信、知乎、36氪、GitHub 爆款热词与选题立意大纲派生"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden 2xl:inline">热点雷达</span>
            <span className="hidden xl:inline 2xl:hidden">热点</span>
          </button>
        )}

        {/* Automation & Team Webhooks Button */}
        {onOpenAutomationWebhook && (
          <button
            onClick={onOpenAutomationWebhook}
            id="btn-header-automation-webhook"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-indigo-300 border border-neutral-700 transition"
            title="自动化协同与发布通知管道：企微/飞书/钉钉机器人播报、手机扫码审稿与定时调度"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden 2xl:inline">自动协同</span>
          </button>
        )}

        {/* AI Article Generator Button */}
        <button
          onClick={onOpenAiGenerator}
          id="btn-open-ai-generator"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xs shadow-purple-900/40 border border-purple-500/40 transition"
          title="使用 Gemini AI 按照格式一键生成微信长文或小绿书贴图"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="hidden md:inline">AI 智能撰文</span>
          <span className="hidden sm:inline md:hidden">AI 撰文</span>
        </button>

        {/* WeChat Online Article Reverse Extractor */}
        {onOpenExtractArticle && (
          <button
            onClick={onOpenExtractArticle}
            id="btn-header-extract-article"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-blue-300 border border-blue-700/60 transition"
            title="输入任意微信推文公开链接，一键抓取并逆向清洗为干净排版的 Markdown"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">文章提取</span>
            <span className="hidden sm:inline md:hidden">提取</span>
          </button>
        )}

        {/* Multi-platform Matrix Publisher Button */}
        {onOpenMatrixPublish && (
          <button
            onClick={onOpenMatrixPublish}
            id="btn-header-matrix-publish"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-xs border border-amber-500/40 transition"
            title="一键 9 大渠道矩阵分发（微信、知乎、稀土掘金、CSDN、小红书、今日头条、简书、博客园、微博）"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden lg:inline">多平台矩阵</span>
          </button>
        )}

        {/* Pre-publish Safety & Compliance Guard */}
        {onOpenSafetyAudit && (
          <button
            onClick={onOpenSafetyAudit}
            id="btn-header-safety-audit"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-750 text-emerald-300 border border-emerald-800/60 transition"
            title="内容合规体检：新广告法极限词、微信诱导分享与外链风险扫描"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">合规体检</span>
          </button>
        )}

        {/* Draft Box & Multi-article Management */}
        <button
          onClick={onOpenDraftManager}
          id="btn-open-draft-manager"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          title="管理公众号官方草稿箱、多图文合集创建与一键正式群发"
        >
          <Inbox className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">草稿管理</span>
        </button>

        {/* WeChat Credentials Config with Gentle Status Indicator */}
        <button
          onClick={onOpenSettings}
          id="btn-open-settings"
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition relative border ${
            hasCredentials
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-800/80 shadow-xs'
          }`}
          title={
            hasCredentials
              ? '微信开发者凭据已就绪（可直接推送草稿箱）'
              : '未配置微信凭据。当前处于本地排版安全模式（支持实时双栏预览、9大主题一键复制排版与免凭据试运行）'
          }
        >
          <Settings className={`w-3.5 h-3.5 ${hasCredentials ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="hidden lg:inline">{hasCredentials ? '凭据配置' : '未配置凭据'}</span>
          {hasCredentials ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5 ring-2 ring-neutral-900" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 ring-2 ring-neutral-900 animate-pulse" />
          )}
        </button>

        {/* Multi-Account Fast Switcher */}
        {accounts.length > 0 && onSwitchAccount && (
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              id="btn-account-switcher"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 transition"
              title="一键快速切换目标公众号凭据"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="max-w-[90px] truncate hidden md:inline">
                {activeAccount?.name || '默认公众号'}
              </span>
              {activeAccount?.tag && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 hidden 2xl:inline">
                  {activeAccount.tag}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-neutral-850 border border-neutral-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider border-b border-neutral-800 flex justify-between items-center">
                  <span>切换目标公众号</span>
                  <span className="text-neutral-500 font-normal">{accounts.length} 个账号</span>
                </div>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onSwitchAccount(acc.id);
                      setIsAccountMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-800 transition ${
                      acc.id === activeAccount?.id ? 'text-emerald-400 font-semibold bg-emerald-950/30' : 'text-neutral-200'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{acc.name}</span>
                        {acc.tag && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-neutral-800 text-neutral-400 border border-neutral-750 shrink-0">
                            {acc.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">{acc.appId}</div>
                    </div>
                    {acc.id === activeAccount?.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-blue-400 hover:bg-neutral-800 transition flex items-center gap-1"
                  >
                    <span>+ 矩阵管理与账号体检</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Local Directory Watch Mode Trigger */}
        {onOpenWatchMode && (
          <button
            onClick={onOpenWatchMode}
            id="btn-open-watch-mode"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
            title="本地目录监听自动发布模式 (Obsidian / Notion / VS Code 自动同步微信草稿箱)"
          >
            <FolderSync className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">监听模式</span>
          </button>
        )}

        {/* Help & Guide Modal button */}
        <button
          onClick={onOpenHelpGuide}
          id="btn-open-help-guide"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          title="使用说明、Front Matter 规范与避坑指南（快捷键: ⌘+/ 或 F1）"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden xl:inline">使用说明</span>
          <span className="text-[10px] text-neutral-400 hidden 2xl:inline font-mono">⌘/</span>
        </button>

        {/* CLI command modal */}
        <button
          onClick={onOpenCli}
          id="btn-open-cli"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          title="查看对应 CLI 命令行指令"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden 2xl:inline">CLI 命令</span>
        </button>

        {/* Sponsor / Donation */}
        <button
          onClick={onOpenSponsor}
          id="btn-open-sponsor"
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-rose-950/40 text-neutral-200 hover:text-rose-300 border border-neutral-700 hover:border-rose-800/60 transition group"
          title="支持与赞助 FlowDraft 开源项目"
        >
          <Heart className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="hidden xl:inline">赞助支持</span>
        </button>

        {/* Dry-Run Simulation Button (Empowered for beginners) */}
        <button
          onClick={() => onPublish(true)}
          disabled={isPublishing}
          id="btn-dry-run"
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 border ${
            !hasCredentials
              ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/70 shadow-xs shadow-emerald-900/20'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
          }`}
          title="进行本地排版与解析测试，不向微信服务器实际请求（零门槛免凭据体验全流程，快捷键: ⌘+↵）"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">{!hasCredentials ? '一键试运行' : '试运行'}</span>
          <span className="text-[10px] text-neutral-400 hidden xl:inline font-mono">⌘↵</span>
        </button>

        {/* Real Publish to WeChat Button */}
        <button
          onClick={() => onPublish(false)}
          disabled={isPublishing}
          id="btn-publish-draft"
          className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/50 transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">推送草稿箱</span>
          <span className="sm:hidden">推送</span>
        </button>
      </div>
    </header>
  );
};

