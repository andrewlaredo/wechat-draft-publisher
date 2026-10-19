import React, { useState, useMemo } from 'react';
import {
  X,
  Radio,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Users,
  Settings,
  ChevronRight,
  Sliders,
  Share2,
} from 'lucide-react';
import { WeChatAccountConfig } from '../utils/accountManager.ts';
import { upsertEditorialTask } from '../utils/editorialManager.ts';
import { broadcastPublishNotification } from '../utils/webhookManager.ts';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface BroadcastAccountStatus {
  accountId: string;
  status: 'idle' | 'queued' | 'publishing' | 'success' | 'error';
  mediaId?: string;
  error?: string;
  durationMs?: number;
  customTitle?: string;
  customAuthor?: string;
}

interface MultiAccountBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: WeChatAccountConfig[];
  currentArticle: {
    title: string;
    author: string;
    digest: string;
    cover: string;
    markdown: string;
    inlinedHtml?: string;
    theme?: string;
    articleType?: 'news' | 'newspic';
  };
  onOpenSettingsAccounts?: () => void;
  onRefreshHistory?: () => void;
  showToast?: (msg: string) => void;
}

export const MultiAccountBroadcastModal: React.FC<MultiAccountBroadcastModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentArticle,
  onOpenSettingsAccounts,
  onRefreshHistory,
  showToast,
}) => {
  // Selected account IDs for matrix distribution
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(() => {
    return accounts.map((a) => a.id);
  });

  // Per-account status map
  const [accountStatusMap, setAccountStatusMap] = useState<Record<string, BroadcastAccountStatus>>({});

  // Options
  const [isDryRun, setIsDryRun] = useState(false);
  const [titleStrategy, setTitleStrategy] = useState<'identical' | 'suffix' | 'custom'>('identical');
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});
  const [customAuthors, setCustomAuthors] = useState<Record<string, string>>({});
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'config' | 'running' | 'report'>('config');

  // Overall stats
  const totalCount = selectedAccountIds.length;
  const completedCount = useMemo(() => {
    return Object.values(accountStatusMap).filter((s) => s.status === 'success').length;
  }, [accountStatusMap]);
  const failedCount = useMemo(() => {
    return Object.values(accountStatusMap).filter((s) => s.status === 'error').length;
  }, [accountStatusMap]);

  // Quick Select Helpers
  const handleSelectAll = () => {
    setSelectedAccountIds(accounts.map((a) => a.id));
  };
  const handleInvertSelect = () => {
    setSelectedAccountIds(accounts.filter((a) => !selectedAccountIds.includes(a.id)).map((a) => a.id));
  };
  const handleSelectServiceOnly = () => {
    setSelectedAccountIds(accounts.filter((a) => a.accountType === 'service').map((a) => a.id));
  };
  const handleSelectSubscriptionOnly = () => {
    setSelectedAccountIds(accounts.filter((a) => a.accountType === 'subscription').map((a) => a.id));
  };

  const toggleAccount = (id: string) => {
    if (isBroadcasting) return;
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds(selectedAccountIds.filter((item) => item !== id));
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  // Compute final title for an account
  const getAccountTitle = (acc: WeChatAccountConfig, idx: number) => {
    if (titleStrategy === 'custom' && customTitles[acc.id]) {
      return customTitles[acc.id];
    }
    if (titleStrategy === 'suffix') {
      const tagSuffix = acc.tag ? `【${acc.tag}】` : idx === 0 ? '' : `【分发号 0${idx + 1}】`;
      return `${currentArticle.title} ${tagSuffix}`.trim();
    }
    return currentArticle.title;
  };

  // Compute final author for an account
  const getAccountAuthor = (acc: WeChatAccountConfig) => {
    if (customAuthors[acc.id]) {
      return customAuthors[acc.id];
    }
    return currentArticle.author || acc.name || '微信运营团队';
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast?.('📋 已成功复制草稿 Media ID 到剪贴板！');
  };

  // Batch Broadcast Execution Engine
  const startMatrixBroadcast = async () => {
    if (selectedAccountIds.length === 0) {
      showToast?.('⚠️ 请至少选择一个需要分发的公众号！');
      return;
    }

    setIsBroadcasting(true);
    setActiveStepTab('running');

    // Initialize all selected accounts to queued
    const initialMap: Record<string, BroadcastAccountStatus> = {};
    selectedAccountIds.forEach((id) => {
      initialMap[id] = {
        accountId: id,
        status: 'queued',
      };
    });
    setAccountStatusMap(initialMap);

    const successfulAccounts: Array<{ name: string; mediaId?: string }> = [];

    // Execute in sequence to avoid rate-limiting and allow clear step-by-step UI monitoring
    for (let i = 0; i < selectedAccountIds.length; i++) {
      const accId = selectedAccountIds[i];
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) continue;

      const titleForAcc = getAccountTitle(acc, i);
      const authorForAcc = getAccountAuthor(acc);

      // Mark current account as publishing
      setAccountStatusMap((prev) => ({
        ...prev,
        [accId]: {
          ...prev[accId],
          status: 'publishing',
        },
      }));

      const startTime = Date.now();

      try {
        const publishBody = {
          markdown: currentArticle.markdown,
          inlinedHtml: currentArticle.inlinedHtml,
          dryRun: isDryRun,
          force: true,
          articleType: currentArticle.articleType || 'news',
          articleTypeOverride: currentArticle.articleType || 'news',
          theme: currentArticle.theme,
          titleOverride: titleForAcc,
          authorOverride: authorForAcc,
          digestOverride: currentArticle.digest,
          coverOverride: currentArticle.cover,
          accountConfig: {
            appId: acc.appId,
            appSecret: acc.appSecret,
            proxyUrl: acc.proxyUrl,
          },
        };

        const res = await safeFetchJson('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishBody),
        });

        const durationMs = Date.now() - startTime;

        if (res.ok && res.data?.success) {
          const mediaId = res.data.result?.media_id || `sim_${Date.now()}`;
          setAccountStatusMap((prev) => ({
            ...prev,
            [accId]: {
              accountId: accId,
              status: 'success',
              mediaId,
              durationMs,
              customTitle: titleForAcc,
              customAuthor: authorForAcc,
            },
          }));

          successfulAccounts.push({ name: acc.name, mediaId });

          // Auto record into editorial task archive
          upsertEditorialTask({
            title: titleForAcc,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            accountId: acc.id,
            accountName: acc.name,
            accountTag: acc.tag || '矩阵号',
            status: isDryRun ? 'drafted' : 'published',
            category: 'industry',
            markdown: currentArticle.markdown,
            digest: currentArticle.digest,
            coverUrl: currentArticle.cover,
            mediaId,
            targetPlatforms: ['微信公众号矩阵'],
            wordCount: currentArticle.markdown.length,
          });
        } else {
          const errMsg = res.data?.error || res.error || '推送草稿箱接口报错';
          setAccountStatusMap((prev) => ({
            ...prev,
            [accId]: {
              accountId: accId,
              status: 'error',
              error: errMsg,
              durationMs,
              customTitle: titleForAcc,
              customAuthor: authorForAcc,
            },
          }));
        }
      } catch (err: any) {
        setAccountStatusMap((prev) => ({
          ...prev,
          [accId]: {
            accountId: accId,
            status: 'error',
            error: err.message || '网络连接超时',
            durationMs: Date.now() - startTime,
            customTitle: titleForAcc,
            customAuthor: authorForAcc,
          },
        }));
      }
    }

    setIsBroadcasting(false);
    setActiveStepTab('report');
    onRefreshHistory?.();

    // Trigger Team Webhook Broadcast Notification
    if (successfulAccounts.length > 0 && !isDryRun) {
      try {
        await broadcastPublishNotification({
          event: 'publish_success',
          title: `【矩阵分发已完成】${currentArticle.title}`,
          author: currentArticle.author,
          digest: `已成功同步至 ${successfulAccounts.map((a) => a.name).join('、')} 共 ${successfulAccounts.length} 个微信公众号草稿箱！`,
          coverUrl: currentArticle.cover,
          charCount: currentArticle.markdown.length,
          draftMediaId: successfulAccounts[0]?.mediaId,
          accountName: `矩阵广播 (${successfulAccounts.length}个账号)`,
        });
      } catch {
        // Ignore webhook non-fatal errors
      }
    }

    showToast?.(`🎉 矩阵分发已结束：成功 ${successfulAccounts.length} / ${selectedAccountIds.length} 个公众号！`);
  };

  // Retry single failed account
  const handleRetrySingle = async (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return;

    setAccountStatusMap((prev) => ({
      ...prev,
      [accId]: {
        ...prev[accId],
        status: 'publishing',
        error: undefined,
      },
    }));

    const titleForAcc = customTitles[acc.id] || currentArticle.title;
    const authorForAcc = customAuthors[acc.id] || currentArticle.author || acc.name;
    const startTime = Date.now();

    try {
      const publishBody = {
        markdown: currentArticle.markdown,
        inlinedHtml: currentArticle.inlinedHtml,
        dryRun: isDryRun,
        force: true,
        articleType: currentArticle.articleType || 'news',
        theme: currentArticle.theme,
        titleOverride: titleForAcc,
        authorOverride: authorForAcc,
        digestOverride: currentArticle.digest,
        coverOverride: currentArticle.cover,
        accountConfig: {
          appId: acc.appId,
          appSecret: acc.appSecret,
          proxyUrl: acc.proxyUrl,
        },
      };

      const res = await safeFetchJson('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishBody),
      });

      const durationMs = Date.now() - startTime;

      if (res.ok && res.data?.success) {
        const mediaId = res.data.result?.media_id || `sim_${Date.now()}`;
        setAccountStatusMap((prev) => ({
          ...prev,
          [accId]: {
            accountId: accId,
            status: 'success',
            mediaId,
            durationMs,
          },
        }));
        showToast?.(`✅ 【${acc.name}】重试推送成功！`);
      } else {
        setAccountStatusMap((prev) => ({
          ...prev,
          [accId]: {
            accountId: accId,
            status: 'error',
            error: res.data?.error || res.error || '失败',
            durationMs,
          },
        }));
      }
    } catch (err: any) {
      setAccountStatusMap((prev) => ({
        ...prev,
        [accId]: {
          accountId: accId,
          status: 'error',
          error: err.message,
          durationMs: Date.now() - startTime,
        },
      }));
    }
  };

  // Copy all media IDs
  const handleCopyAllMediaIds = () => {
    const lines = Object.entries(accountStatusMap)
      .filter(([_, s]) => s.status === 'success' && s.mediaId)
      .map(([id, s]) => {
        const acc = accounts.find((a) => a.id === id);
        return `${acc?.name || id}: ${s.mediaId}`;
      });

    if (lines.length === 0) return;
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
    showToast?.('📋 已打包复制所有分发成功的草稿 Media ID！');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">多公众号一键矩阵发布 (Multi-Account Broadcast)</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-medium">
                  矩阵分发中枢 · P0
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                一次性向多达数十个公众号自动同步草稿，支持标题防重差异化配置、管道级实时状态监测与团队通知广播。
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {accounts.length > 0 && onOpenSettingsAccounts && (
              <button
                type="button"
                onClick={onOpenSettingsAccounts}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
                title="管理公众号矩阵档案凭据"
              >
                <Settings className="w-3.5 h-3.5 text-neutral-400" />
                <span>管理账号库 ({accounts.length})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Navigation Tabs */}
        <div className="px-5 py-2.5 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveStepTab('config')}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeStepTab === 'config'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. 矩阵选择与分身防重策略</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <button
              type="button"
              onClick={() => setActiveStepTab('running')}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeStepTab === 'running'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>2. 实时分发管道监控 {isBroadcasting && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <button
              type="button"
              onClick={() => setActiveStepTab('report')}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeStepTab === 'report'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>3. 分发报告与归档</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-400">
            已选中 <span className="text-emerald-400 font-bold">{selectedAccountIds.length}</span> / {accounts.length} 个公众号
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {accounts.length === 0 ? (
            /* No Accounts Warning */
            <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
              <Users className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-200">暂未配置多公众号矩阵档案</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                矩阵发布需要配置至少一个微信公众号的 AppID 与 AppSecret。请点击下方按钮快速录入您的主号与副号。
              </p>
              {onOpenSettingsAccounts && (
                <button
                  type="button"
                  onClick={onOpenSettingsAccounts}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition inline-flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>立即录入微信公众号凭据</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: Config & Account Selection */}
              {activeStepTab === 'config' && (
                <div className="space-y-5">
                  {/* Quick Select Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-neutral-400 font-medium">快捷筛选：</span>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs transition"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={handleInvertSelect}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs transition"
                      >
                        反选
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectSubscriptionOnly}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs transition"
                      >
                        仅订阅号
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectServiceOnly}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs transition"
                      >
                        仅服务号
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer text-amber-300">
                        <input
                          type="checkbox"
                          checked={isDryRun}
                          onChange={(e) => setIsDryRun(e.target.checked)}
                          className="rounded bg-neutral-900 border-neutral-700 text-amber-500 cursor-pointer"
                        />
                        <span className="font-medium text-xs">空跑演练 (Dry-Run 仿真，不写真实草稿箱)</span>
                      </label>
                    </div>
                  </div>

                  {/* Differentiation / Anti-Duplication Strategy */}
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>矩阵防重分身策略 (Anti-Duplication Strategy)：</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'identical',
                          title: '统一主标题',
                          desc: '所有公众号完全统一使用当前文章主标题',
                        },
                        {
                          id: 'suffix',
                          title: '智能后缀区分 (推荐)',
                          desc: '根据账号标签自动追加【技术版】/【精选】等后缀',
                        },
                        {
                          id: 'custom',
                          title: '独立自定义标题',
                          desc: '为各个公众号单独手工指定不同的吸睛爆款标题',
                        },
                      ].map((strat) => (
                        <button
                          key={strat.id}
                          type="button"
                          onClick={() => setTitleStrategy(strat.id as any)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            titleStrategy === strat.id
                              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                              : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="font-bold text-xs">{strat.title}</span>
                          <span className="text-[11px] mt-1 text-neutral-400 leading-snug">{strat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Grid */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      选择参与矩阵分发的公众号列表：
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accounts.map((acc, idx) => {
                        const isSelected = selectedAccountIds.includes(acc.id);
                        const computedTitle = getAccountTitle(acc, idx);
                        const computedAuthor = getAccountAuthor(acc);

                        return (
                          <div
                            key={acc.id}
                            onClick={() => toggleAccount(acc.id)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-neutral-850 border-emerald-600/80 shadow-md ring-1 ring-emerald-500/20'
                                : 'bg-neutral-950/70 border-neutral-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded bg-neutral-900 border-neutral-700 text-emerald-600 cursor-pointer pointer-events-none"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-neutral-100 text-xs">{acc.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-neutral-300">
                                      {acc.accountType === 'service' ? '服务号' : acc.accountType === 'subscription' ? '订阅号' : '测试号'}
                                    </span>
                                    {acc.tag && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                        {acc.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                                    AppID: {acc.appId}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Custom Inputs if customized mode enabled */}
                            {titleStrategy === 'custom' && isSelected && (
                              <div
                                className="mt-3 pt-3 border-t border-neutral-800 space-y-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="space-y-1">
                                  <span className="text-[10px] text-neutral-400">该账号专属标题：</span>
                                  <input
                                    type="text"
                                    value={customTitles[acc.id] !== undefined ? customTitles[acc.id] : currentArticle.title}
                                    onChange={(e) => setCustomTitles({ ...customTitles, [acc.id]: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            )}

                            {titleStrategy !== 'custom' && (
                              <div className="mt-2.5 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400 flex items-center justify-between">
                                <span className="truncate max-w-[240px]">预计标题：《{computedTitle}》</span>
                                <span className="text-neutral-500 shrink-0">作者: {computedAuthor}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2 & 3: Running Pipeline & Live Execution Ticker */}
              {(activeStepTab === 'running' || activeStepTab === 'report') && (
                <div className="space-y-5">
                  {/* Progress Header Banner */}
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isBroadcasting ? (
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : completedCount === totalCount ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold text-sm text-neutral-100">
                          {isBroadcasting
                            ? '正在全自动化向公众号矩阵推送草稿箱...'
                            : completedCount === totalCount
                            ? '🎉 矩阵全员分发圆满完成！'
                            : `矩阵分发已结束：成功 ${completedCount} 个，失败 ${failedCount} 个`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {completedCount > 0 && (
                          <button
                            type="button"
                            onClick={handleCopyAllMediaIds}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
                          >
                            {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>复制全部草稿 ID</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 h-full transition-all duration-300"
                        style={{
                          width: `${totalCount > 0 ? ((completedCount + failedCount) / totalCount) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>总计: {totalCount} 个公众号</span>
                      <span>已完成: {completedCount} 成功 · {failedCount} 失败</span>
                    </div>
                  </div>

                  {/* Account Live Status Cards */}
                  <div className="space-y-2.5">
                    {selectedAccountIds.map((accId) => {
                      const acc = accounts.find((a) => a.id === accId);
                      const statusObj = accountStatusMap[accId] || { status: 'idle' };
                      if (!acc) return null;

                      return (
                        <div
                          key={accId}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                            statusObj.status === 'success'
                              ? 'bg-emerald-950/20 border-emerald-800/80'
                              : statusObj.status === 'error'
                              ? 'bg-rose-950/20 border-rose-800/80'
                              : statusObj.status === 'publishing'
                              ? 'bg-blue-950/30 border-blue-600/80 ring-1 ring-blue-500/30'
                              : 'bg-neutral-950 border-neutral-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-neutral-100">{acc.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-neutral-300">
                                {acc.accountType === 'service' ? '服务号' : '订阅号'}
                              </span>
                              {acc.tag && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-neutral-800 text-neutral-400">
                                  {acc.tag}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              标题: 《{statusObj.customTitle || currentArticle.title}》
                            </div>
                          </div>

                          {/* Status Badge & Action */}
                          <div className="flex items-center space-x-3 shrink-0">
                            {statusObj.status === 'queued' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] bg-neutral-800 text-neutral-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                <span>排队中</span>
                              </span>
                            )}
                            {statusObj.status === 'publishing' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1.5 font-medium animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                                <span>推送中 (压缩配图与提交草稿)...</span>
                              </span>
                            )}
                            {statusObj.status === 'success' && (
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-1 rounded-full text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-mono">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>发布成功 ({((statusObj.durationMs || 1000) / 1000).toFixed(1)}s)</span>
                                </span>
                                {statusObj.mediaId && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(statusObj.mediaId!, acc.id)}
                                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition"
                                    title="复制草稿 media_id"
                                  >
                                    {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            )}
                            {statusObj.status === 'error' && (
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-1 rounded-full text-[11px] bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 font-mono max-w-[220px] truncate" title={statusObj.error}>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span className="truncate">{statusObj.error || '失败'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRetrySingle(acc.id)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-rose-300 border border-rose-900/60 text-xs transition"
                                >
                                  重试
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>自动同步至本地日历任务与企业微信/飞书团队 Webhook 通知管道</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isBroadcasting}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-750 text-xs font-medium transition disabled:opacity-50"
            >
              关闭
            </button>

            {activeStepTab === 'config' ? (
              <button
                type="button"
                onClick={startMatrixBroadcast}
                disabled={selectedAccountIds.length === 0 || isBroadcasting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>立即向选中的 {selectedAccountIds.length} 个公众号矩阵分发草稿</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStepTab('config')}
                disabled={isBroadcasting}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
              >
                返回重新配置
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
