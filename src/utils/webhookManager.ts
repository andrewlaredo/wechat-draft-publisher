/**
 * webhookManager.ts
 * 自动化协同与发布通知管道管理引擎 (Automation & Team Webhooks)
 */

export interface WebhookConfig {
  id: string;
  name: string;
  type: 'wecom' | 'feishu' | 'dingtalk' | 'custom';
  url: string;
  secret?: string;
  enabled: boolean;
  triggers: {
    publishSuccess: boolean;
    matrixDispatch: boolean;
    safetyWarning: boolean;
  };
}

export interface WebhookPayload {
  event: 'publish_success' | 'matrix_dispatch' | 'safety_warning' | 'test';
  title: string;
  author: string;
  digest: string;
  coverUrl?: string;
  charCount?: number;
  draftMediaId?: string;
  accountName?: string;
  time?: string;
}

const STORAGE_KEY_WEBHOOKS = 'wechat_publisher_webhooks_v1';
const STORAGE_KEY_SCHEDULED_JOBS = 'wechat_publisher_scheduled_jobs_v1';

export const DEFAULT_WEBHOOK_CONFIGS: WebhookConfig[] = [
  {
    id: 'wecom-default',
    name: '企业微信群运营机器人',
    type: 'wecom',
    url: '',
    enabled: false,
    triggers: {
      publishSuccess: true,
      matrixDispatch: true,
      safetyWarning: true,
    },
  },
  {
    id: 'feishu-default',
    name: '飞书团队发布播报助手',
    type: 'feishu',
    url: '',
    enabled: false,
    triggers: {
      publishSuccess: true,
      matrixDispatch: false,
      safetyWarning: true,
    },
  },
  {
    id: 'dingtalk-default',
    name: '钉钉群工作流机器人',
    type: 'dingtalk',
    url: '',
    enabled: false,
    triggers: {
      publishSuccess: true,
      matrixDispatch: false,
      safetyWarning: false,
    },
  },
];

export function getStoredWebhooks(): WebhookConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEBHOOKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_WEBHOOK_CONFIGS;
}

export function saveWebhooks(configs: WebhookConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WEBHOOKS, JSON.stringify(configs));
  } catch {
    // ignore
  }
}

/**
 * 格式化并向各平台机器人发送 Webhook 通知
 */
export async function sendWebhookNotification(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ success: boolean; message: string }> {
  if (!config.url || !config.url.trim()) {
    return { success: false, message: 'Webhook 地址未配置' };
  }

  const timestamp = payload.time || new Date().toLocaleString();
  let bodyPayload: any = {};

  if (config.type === 'wecom') {
    // 企业微信群机器人 Markdown 规范
    bodyPayload = {
      msgtype: 'markdown',
      markdown: {
        content: `### 📢 微信公众号文章发布提醒\n> **文章标题**：<font color="info">《${payload.title}》</font>\n> **作者**：${payload.author}\n> **目标账号**：${payload.accountName || '主公众号'}\n> **字数统计**：${payload.charCount || 0} 字\n> **发布时间**：${timestamp}\n${payload.draftMediaId ? `> **永久素材 MediaID**：\`${payload.draftMediaId}\`\n` : ''}> **摘要**：${payload.digest.slice(0, 80)}...\n\n<font color="comment">🎉 文章已就绪，请在手机端微信公众号助手核对并确认正式群发。</font>`,
      },
    };
  } else if (config.type === 'feishu') {
    // 飞书自定义机器人富文本卡片
    bodyPayload = {
      msg_type: 'interactive',
      card: {
        header: {
          title: {
            tag: 'plain_text',
            content: '🚀 微信公众号文章自动发布通知',
          },
          template: 'green',
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: `**文章标题**：${payload.title}\n**作者**：${payload.author} | **字数**：${payload.charCount || 0} 字\n**时间**：${timestamp}\n**摘要**：${payload.digest}`,
            },
          },
        ],
      },
    };
  } else if (config.type === 'dingtalk') {
    // 钉钉自定义机器人 Markdown
    bodyPayload = {
      msgtype: 'markdown',
      markdown: {
        title: `文章发布提醒: ${payload.title}`,
        text: `### 微信公众号发文提醒\n\n- **标题**: 《${payload.title}》\n- **作者**: ${payload.author}\n- **字数**: ${payload.charCount || 0} 字\n- **时间**: ${timestamp}\n\n> ${payload.digest}`,
      },
    };
  } else {
    // 通用 HTTP POST Webhook
    bodyPayload = {
      ...payload,
      timestamp,
      source: 'wechat-draft-publisher',
    };
  }

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      return { success: true, message: '通知发送成功' };
    }
    return { success: false, message: `请求响应状态码: ${res.status}` };
  } catch (err: any) {
    return { success: false, message: `网络异常或跨域: ${err.message || err}` };
  }
}

/**
 * 广播给所有已启用的 Webhook
 */
export async function broadcastPublishNotification(payload: WebhookPayload) {
  const configs = getStoredWebhooks().filter((c) => c.enabled);
  for (const c of configs) {
    if (payload.event === 'publish_success' && !c.triggers.publishSuccess) continue;
    if (payload.event === 'matrix_dispatch' && !c.triggers.matrixDispatch) continue;
    if (payload.event === 'safety_warning' && !c.triggers.safetyWarning) continue;

    sendWebhookNotification(c, payload).catch(() => {});
  }
}
