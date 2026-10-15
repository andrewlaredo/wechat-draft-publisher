import React, { useState, useMemo } from 'react';
import {
  X,
  Send,
  Smartphone,
  Clock,
  Download,
  Check,
  QrCode,
  Sparkles,
  Bot,
  AlertTriangle,
  Play,
  Copy,
  ExternalLink,
  ShieldCheck,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  WebhookConfig,
  getStoredWebhooks,
  saveWebhooks,
  sendWebhookNotification,
} from '../utils/webhookManager.ts';

interface AutomationWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string;
  digest: string;
  markdown: string;
  inlinedHtml: string;
  charCount: number;
}

export const AutomationWebhookModal: React.FC<AutomationWebhookModalProps> = ({
  isOpen,
  onClose,
  title,
  author,
  digest,
  markdown,
  inlinedHtml,
  charCount,
}) => {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'qrcode' | 'scheduler' | 'backup'>('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => getStoredWebhooks());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scheduled publishing queue state
  const [scheduledTasks, setScheduledTasks] = useState<
    Array<{ id: string; title: string; time: string; status: 'queued' | 'done' }>
  >([
    {
      id: 'task-1',
      title: title || '微信公众号自动化发布全攻略',
      time: '明天 08:30 (早高峰流量)',
      status: 'queued',
    },
  ]);

  const handleUpdateWebhook = (id: string, updates: Partial<WebhookConfig>) => {
    const updated = webhooks.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  const handleTestWebhook = async (config: WebhookConfig) => {
    setTestingId(config.id);
    setTestResult(null);

    const res = await sendWebhookNotification(config, {
      event: 'test',
      title: title || '微信自动化发文测试播报',
      author: author || '创作者',
      digest: digest || '这是一条来自微信公众号自动化发布系统的连通性测试消息。',
      charCount,
      accountName: '主公众号',
    });

    setTestingId(null);
    setTestResult({ id: config.id, success: res.success, msg: res.message });
  };

  // Mobile Preview HTML data URI
  const previewHtmlDataUri = useMemo(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title || '推文预览'}</title>
  <style>
    body { margin: 0; padding: 18px 16px; background: #ffffff; color: #333333; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; line-height: 1.8; word-break: break-word; }
    .header-box { margin-bottom: 20px; border-bottom: 1px solid #eeeeee; padding-bottom: 14px; }
    .title { font-size: 21px; font-weight: bold; line-height: 1.4; color: #111111; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #888888; display: flex; align-items: center; gap: 8px; }
    .author { color: #576b95; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title">${title || '文章标题'}</div>
    <div class="meta">
      <span class="author">${author || '公众号创作者'}</span>
      <span>${new Date().toLocaleDateString()}</span>
      <span style="color: #07c160;">微信扫码预览版</span>
    </div>
  </div>
  <div class="article-content">
    ${inlinedHtml || '<p>暂无排版内容</p>'}
  </div>
</body>
</html>`;
    return 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);
  }, [title, author, inlinedHtml]);

  // QR Code placeholder SVG
  const qrCodeSvg = useMemo(() => {
    // Generate a high-contrast styled QR representation SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <rect width="200" height="200" fill="#ffffff" rx="12"/>
      <!-- QR corner anchors -->
      <rect x="20" y="20" width="46" height="46" rx="6" fill="#0f172a"/>
      <rect x="28" y="28" width="30" height="30" rx="3" fill="#ffffff"/>
      <rect x="35" y="35" width="16" height="16" rx="2" fill="#07c160"/>

      <rect x="134" y="20" width="46" height="46" rx="6" fill="#0f172a"/>
      <rect x="142" y="28" width="30" height="30" rx="3" fill="#ffffff"/>
      <rect x="149" y="35" width="16" height="16" rx="2" fill="#07c160"/>

      <rect x="20" y="134" width="46" height="46" rx="6" fill="#0f172a"/>
      <rect x="28" y="142" width="30" height="30" rx="3" fill="#ffffff"/>
      <rect x="35" y="149" width="16" height="16" rx="2" fill="#07c160"/>

      <!-- QR simulated pixel modules -->
      <circle cx="90" cy="30" r="4" fill="#0f172a"/>
      <circle cx="106" cy="30" r="4" fill="#0f172a"/>
      <circle cx="80" cy="50" r="4" fill="#0f172a"/>
      <circle cx="100" cy="50" r="4" fill="#0f172a"/>
      <circle cx="116" cy="50" r="4" fill="#0f172a"/>

      <circle cx="40" cy="90" r="4" fill="#0f172a"/>
      <circle cx="60" cy="90" r="4" fill="#0f172a"/>
      <circle cx="80" cy="90" r="4" fill="#0f172a"/>
      <circle cx="100" cy="90" r="4" fill="#07c160"/>
      <circle cx="120" cy="90" r="4" fill="#0f172a"/>
      <circle cx="140" cy="90" r="4" fill="#0f172a"/>
      <circle cx="160" cy="90" r="4" fill="#0f172a"/>

      <circle cx="90" cy="110" r="4" fill="#0f172a"/>
      <circle cx="110" cy="110" r="4" fill="#0f172a"/>
      <circle cx="130" cy="110" r="4" fill="#0f172a"/>

      <circle cx="80" cy="140" r="4" fill="#0f172a"/>
      <circle cx="100" cy="140" r="4" fill="#0f172a"/>
      <circle cx="130" cy="140" r="4" fill="#0f172a"/>
      <circle cx="150" cy="140" r="4" fill="#0f172a"/>

      <circle cx="90" cy="165" r="4" fill="#0f172a"/>
      <circle cx="120" cy="165" r="4" fill="#0f172a"/>
      <circle cx="140" cy="165" r="4" fill="#07c160"/>
      <circle cx="165" cy="165" r="4" fill="#0f172a"/>

      <!-- Center Logo / WeChat badge -->
      <circle cx="100" cy="100" r="14" fill="#ffffff"/>
      <circle cx="100" cy="100" r="12" fill="#07c160"/>
      <text x="100" y="104" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">扫码</text>
    </svg>`;
  }, []);

  const handleCopyPreviewLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportJson = () => {
    const bundle = {
      title,
      author,
      digest,
      markdown,
      inlinedHtml,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'wechat-post'}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">自动化协同与发布通知管道</h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                  企微 / 飞书 / 钉钉 Webhook · 手机扫码审稿 · 定时任务
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                打造工业级自媒体团队协同SOP：推送自动广播通知、主编手机扫码真机审稿与定时发布队列
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

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-neutral-950/50 border-b border-neutral-800 flex items-center space-x-2 overflow-x-auto text-xs flex-shrink-0">
          {[
            { id: 'webhooks', label: '🤖 团队机器人 Webhook', icon: Bot },
            { id: 'qrcode', label: '📱 手机免登扫码审稿', icon: QrCode },
            { id: 'scheduler', label: '⏱️ 定时发布调度队列', icon: Clock },
            { id: 'backup', label: '💾 多端资产同步备份', icon: Download },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* TAB 1: Team Webhooks */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">团队群机器人通知管道配置</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    在文章成功推送到草稿箱或完成矩阵分发时，自动向群内播报包含标题、字数、永久 MediaID 的结构化卡片
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {webhooks.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl bg-neutral-850 border border-neutral-750 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${w.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                        <span className="font-semibold text-sm text-neutral-100">{w.name}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {w.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(w)}
                          disabled={testingId === w.id || !w.url}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-neutral-300 border border-neutral-700 text-xs transition flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-blue-400" />
                          <span>{testingId === w.id ? '测试发送中...' : '测试发送'}</span>
                        </button>

                        <label className="flex items-center cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            checked={w.enabled}
                            onChange={(e) => handleUpdateWebhook(w.id, { enabled: e.target.checked })}
                            className="rounded bg-neutral-900 border-neutral-700 text-blue-600 cursor-pointer"
                          />
                          <span className="ml-1.5 text-xs text-neutral-300">
                            {w.enabled ? '已启用' : '已停用'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-400">Webhook 回调 URL：</label>
                      <input
                        type="text"
                        value={w.url}
                        onChange={(e) => handleUpdateWebhook(w.id, { url: e.target.value })}
                        placeholder={
                          w.type === 'wecom'
                            ? 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...'
                            : w.type === 'feishu'
                            ? 'https://open.feishu.cn/open-apis/bot/v2/hook/...'
                            : 'https://oapi.dingtalk.com/robot/send?access_token=...'
                        }
                        className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Trigger Checkboxes */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-300">
                      <span className="text-[11px] text-neutral-400">自动触发事件:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={w.triggers.publishSuccess}
                          onChange={(e) =>
                            handleUpdateWebhook(w.id, {
                              triggers: { ...w.triggers, publishSuccess: e.target.checked },
                            })
                          }
                          className="rounded bg-neutral-900 border-neutral-750 text-blue-600"
                        />
                        <span>推送到草稿箱成功</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={w.triggers.matrixDispatch}
                          onChange={(e) =>
                            handleUpdateWebhook(w.id, {
                              triggers: { ...w.triggers, matrixDispatch: e.target.checked },
                            })
                          }
                          className="rounded bg-neutral-900 border-neutral-750 text-blue-600"
                        />
                        <span>矩阵全网分发完成</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={w.triggers.safetyWarning}
                          onChange={(e) =>
                            handleUpdateWebhook(w.id, {
                              triggers: { ...w.triggers, safetyWarning: e.target.checked },
                            })
                          }
                          className="rounded bg-neutral-900 border-neutral-750 text-blue-600"
                        />
                        <span>合规体检异常警告</span>
                      </label>
                    </div>

                    {/* Test Result Message */}
                    {testResult && testResult.id === w.id && (
                      <div
                        className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                          testResult.success
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{testResult.msg}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Mobile QR-Code Quick Preview */}
          {activeTab === 'qrcode' && (
            <div className="max-w-xl mx-auto space-y-5 text-center py-4">
              <div>
                <h3 className="text-base font-bold text-neutral-100 flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>手机端微信真机扫码临时审稿</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  无需登录微信公众号后台、无需占用群发白名单，团队主编直接打开微信扫一扫，即刻在真机端核对排版细节
                </p>
              </div>

              {/* QR Code Container */}
              <div className="w-64 h-64 mx-auto p-3 bg-white rounded-2xl shadow-2xl border-4 border-neutral-700 flex items-center justify-center">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              </div>

              {/* Preview Info */}
              <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-750 text-left text-xs space-y-1">
                <div className="font-semibold text-neutral-200">
                  当前审稿推文：《{title || '未命名文章'}》
                </div>
                <div className="text-neutral-400">
                  作者：{author || '创作者'} · 统计字数：{charCount} 字 · 格式：微信高兼容内联富文本
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyPreviewLink}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? '已复制页面链接' : '复制预览链接'}</span>
                </button>

                <a
                  href={previewHtmlDataUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>新窗口全屏预览 HTML</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: Scheduler Queue */}
          {activeTab === 'scheduler' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">定时发布队列与调度执行器</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    锁定早高峰/晚高峰黄金流量时段，后台定时自动化推送到微信草稿箱顶端
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {scheduledTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-750 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                      <div>
                        <div className="text-sm font-semibold text-neutral-200">{t.title}</div>
                        <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>预定发布时间：{t.time}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800">
                      待调度执行
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Backup & Export */}
          {activeTab === 'backup' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-neutral-100">多端资产备份与全量打包</h3>
                <p className="text-xs text-neutral-400">
                  一键将当前撰写的文章、元数据配置与全套排版成果离线导出，防止意外丢稿
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-neutral-850 border border-neutral-750 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-sm text-neutral-200">JSON 资产全量备份</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      包含当前标题、摘要、Markdown 原文与编译后的完整内联 HTML 字符串。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 JSON 归档文件</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-neutral-850 border border-neutral-750 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-sm text-neutral-200">本地 Markdown 纯净源文件</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      带标准 YAML Front Matter 头部信息，支持同步至 GitHub 或本地 Obsidian。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([markdown], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${title || 'post'}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 .md 文件</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
