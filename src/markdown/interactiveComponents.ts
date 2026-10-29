/**
 * interactiveComponents.ts
 * 微信公众号爆款排版组件与视觉物料库 (Rich Visual Blocks & Material Library)
 * 
 * 所有组件均采用 100% 微信富文本内联样式（Inline CSS），
 * 无论通过 Juice 自动化内联编译，还是直接复制到微信公众号网页后台，
 * 均可实现零样式丢失、高保真矢量渲染、跨移动端与桌面端自适应。
 */

export interface InteractiveComponentItem {
  id: string;
  name: string;
  description: string;
  category: 'quote' | 'step' | 'chat' | 'card' | 'divider' | 'guide' | 'interactive';
  icon: string;
  tag: string;
  template: string;
  previewHtml: string;
}

export const INTERACTIVE_CATEGORIES = [
  { id: 'all', name: '全部物料' },
  { id: 'quote', name: '金句与重点强调' },
  { id: 'step', name: '步骤条与对比卡' },
  { id: 'chat', name: '微信对话气泡' },
  { id: 'card', name: '导读与知识卡片' },
  { id: 'divider', name: '风格分割线' },
  { id: 'guide', name: '文首文末互动' },
  { id: 'interactive', name: '折叠答疑与画廊' },
];

export const INTERACTIVE_COMPONENTS: InteractiveComponentItem[] = [
  // 1. 金句与重点强调 (Quote & Highlights)
  {
    id: 'gradient-quote-card',
    name: '渐变微光金句框',
    description: '科技大厂爆款金句框，带渐变边框与半透明背景，强化核心观点与格言',
    category: 'quote',
    icon: '✨',
    tag: '爆款标配',
    template: `<section style="margin: 24px 0; padding: 18px 20px; background: linear-gradient(135deg, rgba(30,128,255,0.06) 0%, rgba(139,92,246,0.06) 100%); border-left: 4px solid #1e80ff; border-radius: 0 12px 12px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
  <div style="font-size: 26px; line-height: 1; color: #1e80ff; font-family: Georgia, serif; margin-bottom: 6px;">“</div>
  <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #1f2937; font-weight: 500; letter-spacing: 0.5px;">
    优秀的自媒体创作者应当将时间倾注于深度思考与洞察，而将机械的排版与分发交由自动化流水线。
  </p>
  <div style="margin-top: 10px; font-size: 12px; color: #6b7280; text-align: right; font-style: italic;">
    — 核心思考金句
  </div>
</section>

`,
    previewHtml: `<div style="padding: 12px 14px; background: linear-gradient(135deg, rgba(30,128,255,0.08), rgba(139,92,246,0.08)); border-left: 3px solid #1e80ff; border-radius: 0 8px 8px 0;"><span style="color: #1e80ff; font-size: 16px; font-weight: bold;">“</span><span style="font-size: 12px; color: #1f2937; margin-left: 4px;">优秀的自媒体创作者应当将时间倾注于深度思考...</span></div>`,
  },
  {
    id: 'notion-paper-card',
    name: '极简便签纸卡片',
    description: '日系杂货/Notion 风格双层纸感便签卡，带微距阴影与细致边框',
    category: 'quote',
    icon: '📝',
    tag: '文艺纸感',
    template: `<section style="margin: 24px 0; padding: 16px 20px; background: #faf9f6; border: 1px solid #e7e5e4; border-radius: 10px; box-shadow: 2px 4px 12px rgba(0,0,0,0.04); position: relative;">
  <div style="display: inline-block; padding: 2px 8px; background: #78716c; color: #ffffff; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
    📌 创作者备忘
  </div>
  <p style="margin: 0; font-size: 14px; line-height: 1.75; color: #44403c;">
    微信公众平台官方草稿箱 API 对 HTML 代码总体积有 20,000 字符限制。建议长图文合理复用永久素材库已有 MediaID，减少内联代码膨胀。
  </p>
</section>

`,
    previewHtml: `<div style="padding: 10px 14px; background: #faf9f6; border: 1px solid #e7e5e4; border-radius: 6px;"><span style="background: #78716c; color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 3px;">📌 备忘</span><div style="font-size: 11px; color: #44403c; margin-top: 4px;">微信草稿箱 API 具有 20k 字符限制...</div></div>`,
  },
  {
    id: 'warning-callout',
    name: '高危避坑警告卡',
    description: '醒目的红橙色双色警示框，提示读者重点注意事项与常见踩坑点',
    category: 'quote',
    icon: '⚠️',
    tag: '避坑必读',
    template: `<section style="margin: 20px 0; padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 8px;">
  <div style="font-size: 14px; font-weight: bold; color: #991b1b; display: flex; align-items: center; margin-bottom: 4px;">
    ⚠️ 核心避坑风险提醒
  </div>
  <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #7f1d1d;">
    请切勿在正文中出现“转发朋友圈领取”、“点击在看送资料”等诱导分享惩罚词，否则文章极易被微信官方系统拦截或面临账号阶梯降权！
  </p>
</section>

`,
    previewHtml: `<div style="padding: 10px 12px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;"><strong style="font-size: 11px; color: #991b1b;">⚠️ 避坑风险提醒</strong><p style="margin: 3px 0 0; font-size: 10px; color: #7f1d1d;">切勿在正文中出现违规诱导分享词汇...</p></div>`,
  },

  // 2. 步骤条与对比卡 (Step & Comparison Blocks)
  {
    id: 'timeline-steps-3',
    name: '三步极速操作流程卡',
    description: '带有序数字勋章与垂直连接线的实战教程步骤卡片',
    category: 'step',
    icon: '🪜',
    tag: '实战教程',
    template: `<section style="margin: 28px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 16px; text-align: center;">
    🚀 三步极速发布标准流水线
  </div>
  
  <div style="display: flex; margin-bottom: 14px; align-items: flex-start;">
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #1e80ff; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; margin-right: 12px;">1</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">本地 Markdown 编写与排版</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">自由切换 9 大官方排版主题，实时双栏查看微信手机端效果。</div>
    </div>
  </div>

  <div style="display: flex; margin-bottom: 14px; align-items: flex-start;">
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #10b981; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; margin-right: 12px;">2</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">合规体检与配图秒级压图</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">一键扫描新广告法极限词，自动上传本地配图至微信永久素材库。</div>
    </div>
  </div>

  <div style="display: flex; align-items: flex-start;">
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #8b5cf6; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; margin-right: 12px;">3</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">官方草稿箱直推与全网矩阵同步</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">草稿箱无缝生成，一键多发至知乎、掘金、小红书与头条号。</div>
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;"><div style="font-size: 11px; font-weight: bold; margin-bottom: 6px;">🚀 三步操作流程</div><div style="display: flex; gap: 6px; font-size: 10px;"><span style="background: #1e80ff; color: #fff; border-radius: 50%; width: 16px; height: 16px; text-align: center; line-height: 16px;">1</span><span>编写</span> ➔ <span style="background: #10b981; color: #fff; border-radius: 50%; width: 16px; height: 16px; text-align: center; line-height: 16px;">2</span><span>体检</span> ➔ <span style="background: #8b5cf6; color: #fff; border-radius: 50%; width: 16px; height: 16px; text-align: center; line-height: 16px;">3</span><span>推送</span></div></div>`,
  },
  {
    id: 'pros-cons-card',
    name: '正面 vs 反面双栏对比卡',
    description: '对比卡片（推荐做法 vs 避坑做法 / 传统方案 vs 创新方案）',
    category: 'step',
    icon: '⚖️',
    tag: '深度剖析',
    template: `<section style="margin: 24px 0; display: flex; flex-direction: column; gap: 12px;">
  <div style="padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
    <div style="font-size: 14px; font-weight: bold; color: #065f46; margin-bottom: 4px;">
      ✅ 推荐做法 (Best Practice)
    </div>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #047857;">
      使用 Markdown 规范写作，通过自动化流水线完成 100% 深度内联，多渠道分发时自动适配对应 Front-Matter 与话题标签。
    </p>
  </div>

  <div style="padding: 14px 16px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
    <div style="font-size: 14px; font-weight: bold; color: #9f1239; margin-bottom: 4px;">
      ❌ 传统手工作法 (Anti-Pattern)
    </div>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #be123c;">
      反复在微信编辑器中拖拽字体和色块，换到知乎掘金又得重新复制粘贴找图片，耗时费力且容易出现样式丢失。
    </p>
  </div>
</section>

`,
    previewHtml: `<div style="display: flex; gap: 6px;"><div style="flex: 1; padding: 6px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 10px; color: #065f46;"><strong>✅ 推荐做法</strong><br/>自动化流水线排版</div><div style="flex: 1; padding: 6px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; font-size: 10px; color: #9f1239;"><strong>❌ 传统手工</strong><br/>重复手动排版复制</div></div>`,
  },

  // 3. 微信对话气泡组 (WeChat Chat Bubbles)
  {
    id: 'wechat-chat-bubbles',
    name: '微信仿真对话气泡组',
    description: '生动模拟微信聊天记录（左侧读者提问气泡 + 右侧博主回复绿气泡），自媒体爆款答疑利器',
    category: 'chat',
    icon: '💬',
    tag: '吸睛沉浸',
    template: `<section style="margin: 26px 0; padding: 18px 16px; background: #ededed; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="text-align: center; font-size: 11px; color: #8c8c8c; margin-bottom: 14px;">— 微信读者来信提问 —</div>

  <!-- 左侧读者提问 -->
  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
    <div style="width: 36px; height: 36px; border-radius: 6px; background: #3b82f6; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-right: 10px;">读者</div>
    <div style="position: relative; max-width: 80%; background: #ffffff; border-radius: 8px; padding: 10px 14px; font-size: 13px; line-height: 1.5; color: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      博主你好！请问使用这个发布器把 Markdown 推送到微信公众平台，真的能自动将代码高亮并上传所有配图吗？
    </div>
  </div>

  <!-- 右侧博主回复 -->
  <div style="display: flex; align-items: flex-start; justify-content: flex-end;">
    <div style="position: relative; max-width: 80%; background: #95ec69; border-radius: 8px; padding: 10px 14px; font-size: 13px; line-height: 1.5; color: #000000; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-right: 10px;">
      100% 自动！系统会并发把本地图片直传微信永久素材库，并用 SHA-256 校验幂等性防重复，正文代码块全部高保真内联渲染！
    </div>
    <div style="width: 36px; height: 36px; border-radius: 6px; background: #07c160; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">作者</div>
  </div>
</section>

`,
    previewHtml: `<div style="background: #ededed; padding: 10px; border-radius: 8px;"><div style="display: flex; gap: 6px; margin-bottom: 8px;"><span style="background: #3b82f6; color: #fff; width: 20px; height: 20px; border-radius: 4px; font-size: 9px; text-align: center; line-height: 20px;">问</span><span style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px;">推送代码块能高亮吗？</span></div><div style="display: flex; justify-content: flex-end; gap: 6px;"><span style="background: #95ec69; padding: 4px 8px; border-radius: 4px; font-size: 10px;">100% 自动高亮！</span><span style="background: #07c160; color: #fff; width: 20px; height: 20px; border-radius: 4px; font-size: 9px; text-align: center; line-height: 20px;">答</span></div></div>`,
  },

  // 4. 导读与知识卡片 (Card & Overview)
  {
    id: 'article-header-brief',
    name: '开篇深度导读名片',
    description: '开宗明义标注建议阅读时间、文章主题与核心收获，让读者瞬间抓住重点',
    category: 'card',
    icon: '🧭',
    tag: '专业大刊',
    template: `<section style="margin: 24px 0; padding: 18px 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px;">
    <span style="font-size: 13px; font-weight: bold; color: #1e80ff; display: flex; align-items: center; gap: 4px;">
      📖 本期深度实战导读
    </span>
    <span style="font-size: 11px; color: #9ca3af;">⏱️ 预计耗时 5 分钟</span>
  </div>
  <p style="margin: 0; font-size: 13.5px; line-height: 1.75; color: #374151;">
    <strong>【核心收获】：</strong>读完本篇，你将彻底掌握从纯文本 Markdown 编写、智能素材提纯、广告法安全体检到全网 9 大渠道矩阵一键分发的工业级内容生产全流程。
  </p>
</section>

`,
    previewHtml: `<div style="padding: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;"><div style="display: flex; justify-content: space-between; font-size: 11px; color: #1e80ff; font-weight: bold;"><span>📖 深度导读</span><span style="color: #9ca3af; font-size: 9px;">5 分钟</span></div><div style="font-size: 10px; color: #4b5563; margin-top: 4px;">【核心收获】掌握全网矩阵分发全流程...</div></div>`,
  },
  {
    id: 'author-bio-card',
    name: '精美作者专栏名片',
    description: '文末作者简介卡片，包含头像占位、专栏介绍与个人标语',
    category: 'card',
    icon: '👤',
    tag: '打造IP',
    template: `<section style="margin: 28px 0; padding: 16px 20px; background: #fdfbf7; border: 1px solid #f3ebd8; border-radius: 12px; display: flex; align-items: center; gap: 16px;">
  <div style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0; box-shadow: 0 4px 10px rgba(245,158,11,0.25);">
    专
  </div>
  <div style="flex: 1;">
    <div style="font-size: 15px; font-weight: bold; color: #78350f;">创作者专栏 · 科技探索者</div>
    <div style="font-size: 12px; color: #92400e; margin-top: 3px; line-height: 1.5;">
      聚焦前沿全栈工程、自媒体自动化与数字生产力。让每一篇好文章更有价值。
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #fdfbf7; border: 1px solid #f3ebd8; border-radius: 8px;"><div style="width: 32px; height: 32px; border-radius: 50%; background: #f59e0b; color: #fff; text-align: center; line-height: 32px; font-size: 12px; font-weight: bold;">专</div><div><strong style="font-size: 11px; color: #78350f;">创作者专栏</strong><div style="font-size: 10px; color: #92400e;">聚焦全栈工程与数字生产力</div></div></div>`,
  },

  // 5. 文首文末互动 (Guide & Call-to-Action)
  {
    id: 'follow-card-modern',
    name: '高转化引导在看/关注底卡',
    description: '呼应主题色，包含三联三连倡导（点赞·在看·分享）的高转化底卡',
    category: 'guide',
    icon: '🚀',
    tag: '高转化三连',
    template: `<section style="margin: 32px 0 16px; padding: 22px 20px; text-align: center; background: linear-gradient(135deg, rgba(7,193,96,0.06) 0%, rgba(30,128,255,0.06) 100%); border: 1.5px dashed #07c160; border-radius: 14px;">
  <div style="font-size: 16px; font-weight: bold; color: #07c160; margin-bottom: 4px;">
    🌟 感谢阅读与陪伴
  </div>
  <div style="font-size: 13px; color: #64748b; margin-bottom: 14px;">
    如果本期分享对你有启发，别忘了三连支持我们继续创作！
  </div>
  <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
    <span style="display: inline-block; padding: 4px 12px; background: #07c160; color: #ffffff; font-size: 12px; font-weight: 500; border-radius: 99px;">👍 点赞支持</span>
    <span style="display: inline-block; padding: 4px 12px; background: #1e80ff; color: #ffffff; font-size: 12px; font-weight: 500; border-radius: 99px;">❤️ 推荐在看</span>
    <span style="display: inline-block; padding: 4px 12px; background: #8b5cf6; color: #ffffff; font-size: 12px; font-weight: 500; border-radius: 99px;">🔁 分享给朋友</span>
  </div>
</section>

`,
    previewHtml: `<div style="text-align: center; padding: 12px; background: linear-gradient(135deg, rgba(7,193,96,0.08), rgba(30,128,255,0.08)); border: 1.5px dashed #07c160; border-radius: 8px;"><strong style="color: #07c160; font-size: 11px;">🌟 感谢阅读与陪伴</strong><div style="margin-top: 6px; display: flex; justify-content: center; gap: 4px;"><span style="background: #07c160; color: #fff; font-size: 9px; padding: 1px 6px; border-radius: 99px;">👍 点赞</span><span style="background: #1e80ff; color: #fff; font-size: 9px; padding: 1px 6px; border-radius: 99px;">❤️ 在看</span><span style="background: #8b5cf6; color: #fff; font-size: 9px; padding: 1px 6px; border-radius: 99px;">🔁 分享</span></div></div>`,
  },
  {
    id: 'recommend-article-grid',
    name: '往期精选两列推荐卡片',
    description: '双列紧凑排列往期爆款文章推荐，有效拉动历史内容长尾阅读量',
    category: 'guide',
    icon: '📚',
    tag: '长尾流量',
    template: `<section style="margin: 26px 0;">
  <div style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
    🔥 往期深度精选推荐
  </div>
  <div style="display: flex; gap: 10px; flex-direction: column;">
    <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 500; color: #1e293b;">👉 《如何从零搭建自动化微信自媒体推送矩阵》</span>
      <span style="font-size: 11px; color: #3b82f6;">阅读 ➔</span>
    </div>
    <div style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 500; color: #1e293b;">👉 《Markdown 微信排版样式 100% 深度内联实战》</span>
      <span style="font-size: 11px; color: #3b82f6;">阅读 ➔</span>
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;"><div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">🔥 往期精选</div><div style="font-size: 9px; color: #1e80ff;">👉 《自媒体自动化矩阵》<br/>👉 《Markdown 排版深度内联》</div></div>`,
  },

  // 6. 交互折叠与画廊 (Interactive & Gallery)
  {
    id: 'faq-accordion',
    name: '点击展开/折叠答疑卡片',
    description: '利用 HTML5 原生 details/summary 实现点击展开揭晓，大幅提升读者停留与互动率',
    category: 'interactive',
    icon: '💡',
    tag: '原生折叠',
    template: `<details style="margin: 22px 0; border: 1.5px solid #1e80ff; border-radius: 10px; background: #f0f7ff; overflow: hidden; cursor: pointer;">
  <summary style="padding: 12px 16px; font-size: 14px; font-weight: bold; color: #1e80ff; outline: none; list-style: none; display: flex; justify-content: space-between; align-items: center;">
    <span>💡 思考题：微信草稿箱 API 与网页后台有何区别？</span>
    <span style="font-size: 11px; background: #1e80ff; color: #ffffff; padding: 2px 8px; border-radius: 99px;">点击展开解析</span>
  </summary>
  <div style="padding: 14px 16px; background: #ffffff; border-top: 1px solid #dbeafe; font-size: 13.5px; line-height: 1.75; color: #374151;">
    <strong>【核心要点】：</strong>微信官方草稿箱 API 对 HTML 字符长度有 20,000 字符限制；但微信公众平台网页版后台富文本编辑器没有该限制。本工具提供“极速压缩”与“一键复制微信排版”双通道，完美兼顾两种场景！
  </div>
</details>

`,
    previewHtml: `<div style="border: 1.5px solid #1e80ff; background: #f0f7ff; padding: 10px 12px; border-radius: 6px; font-size: 11px; color: #1e80ff;">💡 <strong>思考题：API 与网页后台有何区别？</strong> <span style="font-size: 9px; float: right; background: #1e80ff; color: #fff; padding: 1px 4px; border-radius: 4px;">展开</span></div>`,
  },
  {
    id: 'scroll-gallery',
    name: '左右手势滑动图集画廊',
    description: '微信原生横向滑动多图轨道，适合展示连续摄影图组或产品细节对比',
    category: 'interactive',
    icon: '🎠',
    tag: '手势滑动',
    template: `<section style="margin: 24px 0; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
    <div style="flex: 0 0 240px; border-radius: 8px; overflow: hidden; background: #e2e8f0;">
      <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 140px; object-fit: cover; display: block;" alt="配图1" />
      <div style="padding: 6px 8px; font-size: 11px; color: #475569; text-align: center; background: #fff;">图 1 · 极简架构设计</div>
    </div>
    <div style="flex: 0 0 240px; border-radius: 8px; overflow: hidden; background: #e2e8f0;">
      <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 140px; object-fit: cover; display: block;" alt="配图2" />
      <div style="padding: 6px 8px; font-size: 11px; color: #475569; text-align: center; background: #fff;">图 2 · 实时渲染引擎</div>
    </div>
    <div style="flex: 0 0 240px; border-radius: 8px; overflow: hidden; background: #e2e8f0;">
      <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 140px; object-fit: cover; display: block;" alt="配图3" />
      <div style="padding: 6px 8px; font-size: 11px; color: #475569; text-align: center; background: #fff;">图 3 · 全网矩阵分发</div>
    </div>
  </div>
  <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 6px;">👉 左右手势滑动查看全部图片</div>
</section>

`,
    previewHtml: `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; display: flex; gap: 6px; overflow-x: hidden;"><div style="background: #e0e7ff; width: 60px; height: 36px; border-radius: 4px; font-size: 9px; display: flex; align-items: center; justify-content: center;">图 1</div><div style="background: #fce7f3; width: 60px; height: 36px; border-radius: 4px; font-size: 9px; display: flex; align-items: center; justify-content: center;">图 2</div><div style="background: #dcfce7; width: 60px; height: 36px; border-radius: 4px; font-size: 9px; display: flex; align-items: center; justify-content: center;">图 3</div></div>`,
  },
  {
    id: 'code-snippet-card',
    name: 'Mac 终端风格代码金句卡',
    description: '带 macOS 红黄绿三色控制圆点与半透明磨砂质感的高颜值代码片段卡',
    category: 'card',
    icon: '💻',
    tag: '极客美学',
    template: `<section style="margin: 24px 0; background: #1e1e2e; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.18); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
  <div style="background: #181825; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #313244;">
    <div style="display: flex; gap: 6px;">
      <span style="display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: #ff5f56;"></span>
      <span style="display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: #ffbd2e;"></span>
      <span style="display: inline-block; width: 11px; height: 11px; border-radius: 50%; background: #27c93f;"></span>
    </div>
    <span style="font-size: 11px; color: #a6adc8; letter-spacing: 0.5px;">publish-pipeline.ts</span>
    <span style="font-size: 10px; color: #89b4fa; background: #313244; padding: 1px 6px; border-radius: 4px;">TypeScript</span>
  </div>
  <pre style="margin: 0; padding: 16px; font-size: 13px; line-height: 1.7; color: #cdd6f4; overflow-x: auto; background: transparent;"><code style="font-family: inherit;"><span style="color: #cba6f7;">const</span> pipeline = <span style="color: #89b4fa;">createWeChatPipeline</span>({
  appId: <span style="color: #a6e3a1;">"wx123456789"</span>,
  autoInlineCss: <span style="color: #fab387;">true</span>,
  autoUploadMedia: <span style="color: #fab387;">true</span>
});
<span style="color: #cba6f7;">await</span> pipeline.<span style="color: #89b4fa;">publishDraft</span>(markdown);</code></pre>
</section>

`,
    previewHtml: `<div style="background: #1e1e2e; border-radius: 6px; padding: 8px;"><div style="display: flex; gap: 4px; margin-bottom: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #ff5f56; display: inline-block;"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: #ffbd2e; display: inline-block;"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: #27c93f; display: inline-block;"></span></div><div style="font-size: 10px; color: #89b4fa; font-family: monospace;">pipeline.publishDraft()</div></div>`,
  },
  {
    id: 'podcast-audio-mock',
    name: '沉浸式音频/播客试听条',
    description: '模拟微信官方语音/播客播放条视觉，提升文章多媒体质感与停留时长',
    category: 'interactive',
    icon: '🎙️',
    tag: '播客原声',
    template: `<section style="margin: 26px 0; padding: 14px 18px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
  <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
    <div style="width: 40px; height: 40px; border-radius: 50%; background: #07c160; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(7,193,96,0.3);">
      ▶
    </div>
    <div>
      <div style="font-size: 14px; font-weight: 600; color: #111827;">🎙️ 本期作者原声语音划重点 · 03分42秒</div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">建议戴上耳机，边听作者拆解边阅读</div>
    </div>
  </div>
  <div style="display: flex; align-items: center; gap: 3px; height: 20px;">
    <span style="width: 3px; height: 8px; background: #07c160; border-radius: 2px;"></span>
    <span style="width: 3px; height: 16px; background: #07c160; border-radius: 2px;"></span>
    <span style="width: 3px; height: 12px; background: #07c160; border-radius: 2px;"></span>
    <span style="width: 3px; height: 18px; background: #07c160; border-radius: 2px;"></span>
    <span style="width: 3px; height: 10px; background: #07c160; border-radius: 2px;"></span>
  </div>
</section>

`,
    previewHtml: `<div style="background: #f3f4f6; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;"><div style="display: flex; align-items: center; gap: 8px;"><span style="width: 24px; height: 24px; border-radius: 50%; background: #07c160; color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center;">▶</span><span style="font-size: 11px; font-weight: 600;">🎙️ 作者原声重点 · 03:42</span></div><span style="color: #07c160; font-size: 12px;">ıılIı</span></div>`,
  },
  {
    id: 'poll-voting-card',
    name: '文末互动投票表决卡',
    description: '直观的双选项观点投票模拟卡，强力激发读者在评论区留言表态',
    category: 'interactive',
    icon: '📊',
    tag: '促评神器',
    template: `<section style="margin: 28px 0; padding: 18px 20px; background: #fdf4ff; border: 1.5px solid #f0abfc; border-radius: 14px;">
  <div style="font-size: 15px; font-weight: bold; color: #86198f; margin-bottom: 12px; text-align: center;">
    🗳️ 读者态度大调查：你平时用哪种方式排版微信？
  </div>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #f5d0fe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 500; color: #701a75;">A. 坚持 Markdown 极简排版，追求效率与美观</span>
      <span style="font-size: 12px; color: #a21caf; font-weight: bold;">83% 同行支持</span>
    </div>
    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #f5d0fe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 500; color: #701a75;">B. 传统富文本拖拽修改，习惯了手工微调</span>
      <span style="font-size: 12px; color: #a21caf; font-weight: bold;">17% 同行支持</span>
    </div>
  </div>
  <div style="text-align: center; font-size: 11px; color: #a21caf; margin-top: 10px;">
    💬 欢迎在右下角「写留言」分享你的观点与工作流！
  </div>
</section>

`,
    previewHtml: `<div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 8px 10px;"><strong style="font-size: 10px; color: #86198f;">🗳️ 互动调查：你用什么方式排版？</strong><div style="margin-top: 4px; font-size: 9px; color: #701a75;"><div style="background: #fff; padding: 2px 6px; border-radius: 4px; margin-bottom: 2px;">A. Markdown 极速流 (83%)</div><div style="background: #fff; padding: 2px 6px; border-radius: 4px;">B. 传统富文本 (17%)</div></div></div>`,
  },
  {
    id: 'gold-badge-highlight',
    name: '黑金奢雅深度研报框',
    description: '深黑底色与烫金边框，专为高端商业分析、行业深度研报打造',
    category: 'quote',
    icon: '👑',
    tag: '大厂研报',
    template: `<section style="margin: 26px 0; padding: 20px 22px; background: #1c1917; border: 1px solid #d97706; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.25);">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #44403c; padding-bottom: 8px;">
    <span style="font-size: 12px; font-weight: bold; color: #fbbf24; letter-spacing: 1px;">
      👑 INDUSTRY INSIGHT · 行业洞察
    </span>
    <span style="font-size: 10px; color: #a8a29e; background: #292524; padding: 2px 6px; border-radius: 4px;">深度研判</span>
  </div>
  <p style="margin: 0; font-size: 14px; line-height: 1.85; color: #fef08a;">
    在自媒体进入存量博弈时代的今天，真正拉开创作者差距的不再是发布频率，而是内容的原子化沉淀与跨平台全域渗透能力。
  </p>
</section>

`,
    previewHtml: `<div style="background: #1c1917; border: 1px solid #d97706; border-radius: 6px; padding: 8px 10px;"><div style="font-size: 9px; color: #fbbf24; font-weight: bold;">👑 行业洞察</div><p style="margin: 3px 0 0; font-size: 10px; color: #fef08a;">自媒体进入存量博弈，核心是跨平台渗透...</p></div>`,
  },
  {
    id: 'quote-dialogue-split',
    name: '红蓝思辨观点对撞卡',
    description: '左翼正方观点 vs 右翼反方观点，适合科技伦理、商业趋势等思辨话题',
    category: 'step',
    icon: '⚡',
    tag: '双向思辨',
    template: `<section style="margin: 28px 0; padding: 18px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
  <div style="font-size: 14px; font-weight: bold; text-align: center; color: #111827; margin-bottom: 14px;">
    ⚡ 焦点思辨：自动化会削弱自媒体的温度吗？
  </div>
  <div style="display: flex; gap: 12px; flex-direction: column;">
    <div style="padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0;">
      <div style="font-size: 12px; font-weight: bold; color: #1d4ed8; margin-bottom: 2px;">🔵 正方视角：效率解放思考</div>
      <div style="font-size: 13px; color: #1e40af; line-height: 1.6;">工具抹平了重复劳动，让创作者有更多精力与读者深入交流、打磨深度观点。</div>
    </div>
    <div style="padding: 12px; background: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 0 8px 8px 0;">
      <div style="font-size: 12px; font-weight: bold; color: #be123c; margin-bottom: 2px;">🔴 反方视角：警惕同质化泛滥</div>
      <div style="font-size: 13px; color: #9f1239; line-height: 1.6;">过度依赖流水线套路容易让内容沦为格式相同的批量制品，丧失个人鲜明的笔触。</div>
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="padding: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;"><div style="font-size: 10px; font-weight: bold; text-align: center;">⚡ 观点对撞</div><div style="font-size: 9px; color: #1d4ed8; background: #eff6ff; padding: 2px 4px; border-radius: 3px; margin: 3px 0;">🔵 效率解放思考</div><div style="font-size: 9px; color: #be123c; background: #fff1f2; padding: 2px 4px; border-radius: 3px;">🔴 警惕同质化</div></div>`,
  },

  // 7. 居中超大引号经典金句框 (Center Giant Quote)
  {
    id: 'center-giant-quote',
    name: '居中超大双引号金句卡',
    description: '采用优雅衬线大字号引号与居中文学排版，极适合名人格言、文章核心主旨或阶段性总结',
    category: 'quote',
    icon: '❝',
    tag: '经典金句',
    template: `<section style="margin: 32px 0; padding: 24px 20px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 14px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
  <div style="font-family: Georgia, serif; font-size: 42px; line-height: 1; color: #da282a; opacity: 0.85; margin-bottom: 8px;">“</div>
  <p style="margin: 0 auto; max-width: 90%; font-size: 16px; line-height: 1.85; color: #1e293b; font-weight: 600; letter-spacing: 0.5px;">
    在信息爆炸的时代，决定一篇公众号文章价值的，从来不是字数的堆砌，而是信息密度的沉淀与直击人心的观点。
  </p>
  <div style="width: 32px; height: 2px; background: #da282a; margin: 16px auto 12px; border-radius: 1px; opacity: 0.6;"></div>
  <div style="font-size: 12px; color: #64748b; font-style: italic; letter-spacing: 0.5px;">
    —— 资深内容主编卷首语
  </div>
</section>

`,
    previewHtml: `<div style="text-align: center; padding: 12px; background: #fff; border: 1px solid #f1f5f9; border-radius: 8px;"><span style="color: #da282a; font-size: 20px; font-family: serif;">“</span><div style="font-size: 11px; font-weight: 600; color: #1e293b;">决定文章价值的，是信息密度与沉淀...</div><div style="font-size: 9px; color: #64748b; margin-top: 4px;">—— 卷首语</div></div>`,
  },

  // 8. 渐变圆角数字徽章步骤组 (Numbered Steps Pills)
  {
    id: 'numbered-steps-pills',
    name: '渐变数字圆标三步核心卡',
    description: '01/02/03 醒目渐变胶囊徽标，结构极其清晰，极大提升手机端读者的章节导航舒适度',
    category: 'step',
    icon: '🔢',
    tag: '清晰结构',
    template: `<section style="margin: 28px 0; padding: 18px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
  <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
    <span style="display: inline-block; width: 4px; height: 16px; background: #1e80ff; border-radius: 2px;"></span>
    <span>高效内容发布三大核心法则</span>
  </div>

  <div style="display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start;">
    <div style="background: linear-gradient(135deg, #1e80ff, #3b82f6); color: #fff; font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; font-family: monospace;">01</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">明确读者搜索意图与核心痛点</div>
      <div style="font-size: 12.5px; color: #64748b; margin-top: 2px; line-height: 1.6;">在第一屏给出清晰答案，降低读者认知负荷与流失率。</div>
    </div>
  </div>

  <div style="display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; font-family: monospace;">02</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">统一视觉规范与盘古中英排版</div>
      <div style="font-size: 12.5px; color: #64748b; margin-top: 2px; line-height: 1.6;">字间隙与行高严格贴合移动端视口，多用卡片化微版式隔离重点。</div>
    </div>
  </div>

  <div style="display: flex; gap: 14px; align-items: flex-start;">
    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; font-family: monospace;">03</div>
    <div style="flex: 1;">
      <div style="font-size: 14px; font-weight: 600; color: #1e293b;">文末自动化外链转脚注与互动闭环</div>
      <div style="font-size: 12.5px; color: #64748b; margin-top: 2px; line-height: 1.6;">规范引文出处，附带三连引导与精选推荐卡片，沉淀读者资产。</div>
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;"><div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">核心三大法则</div><div style="font-size: 9px; display: flex; gap: 4px; align-items: center;"><span style="background: #1e80ff; color: #fff; padding: 1px 4px; border-radius: 3px;">01</span><span>意图匹配</span> <span style="background: #10b981; color: #fff; padding: 1px 4px; border-radius: 3px;">02</span><span>排版规范</span> <span style="background: #8b5cf6; color: #fff; padding: 1px 4px; border-radius: 3px;">03</span><span>互动闭环</span></div></div>`,
  },

  // 9. 顶端引导关注与阅读时长条 (Header Follow Banner)
  {
    id: 'header-follow-banner',
    name: '文首引导关注与星标置顶条',
    description: '置于文章顶部第一行，提示预计阅读时长、公号定位与星标置顶引导',
    category: 'guide',
    icon: '📌',
    tag: '文首引流',
    template: `<section style="margin: 0 0 24px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span style="font-size: 16px;">💡</span>
    <span style="font-size: 12.5px; color: #166534; font-weight: 500;">
      欢迎关注<strong>【公众号名称】</strong>并设为星标，第一时间接收前沿干货
    </span>
  </div>
  <div style="font-size: 11px; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 99px; flex-shrink: 0; font-weight: 600;">
    ⏱️ 预计 4 分钟
  </div>
</section>

`,
    previewHtml: `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 10px; color: #166534;">💡 欢迎关注并设为星标</span><span style="font-size: 9px; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 99px;">⏱️ 4 分钟</span></div>`,
  },

  // 10. 核心速览与关键结论要点卡 (Key Takeaways Card)
  {
    id: 'key-takeaways-card',
    name: '核心速览与结论清单卡',
    description: '绿色对勾徽章清单，让快速翻阅的读者能在 10 秒内锁定整篇文章的核心价值',
    category: 'card',
    icon: '✅',
    tag: '速览总结',
    template: `<section style="margin: 26px 0; padding: 18px 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #10b981; border-radius: 0 12px 12px 0;">
  <div style="font-size: 14.5px; font-weight: 700; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
    <span>⚡ 本篇核心速览与关键结论</span>
  </div>
  <ul style="margin: 0; padding: 0; list-style: none;">
    <li style="margin-bottom: 8px; font-size: 13.5px; color: #334155; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px;">
      <span style="color: #10b981; font-weight: bold; flex-shrink: 0;">✓</span>
      <span>所有富文本样式必须 100% 深度内联，微信富文本粘贴引擎才会完整保留。</span>
    </li>
    <li style="margin-bottom: 8px; font-size: 13.5px; color: #334155; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px;">
      <span style="color: #10b981; font-weight: bold; flex-shrink: 0;">✓</span>
      <span>外链自动转文末脚注能够有效化解微信外链无法点击的体验短板。</span>
    </li>
    <li style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px;">
      <span style="color: #10b981; font-weight: bold; flex-shrink: 0;">✓</span>
      <span>中英文与数字间规范盘古之白空格，是专业大厂文章的标志性排版标准。</span>
    </li>
  </ul>
</section>

`,
    previewHtml: `<div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 8px 12px; border-radius: 0 6px 6px 0;"><strong style="font-size: 10px; color: #0f172a;">⚡ 核心速览与关键结论</strong><div style="font-size: 9px; color: #334155; margin-top: 3px;">✓ 样式 100% 深度内联<br/>✓ 外链自动转文末脚注<br/>✓ 规范盘古之白空格</div></div>`,
  },

  // 11. 文末作者签名致谢与二维码名片卡 (Author Signature Footer)
  {
    id: 'author-signature-footer',
    name: '文末作者名片与二维码扫码卡',
    description: '包含作者头像圆形勋章、公众号名字与个人标语，带右侧二维码扫码位，大幅拉升长尾关注',
    category: 'card',
    icon: '📇',
    tag: '作者名片',
    template: `<section style="margin: 34px 0 16px; padding: 20px; background: #fdfbf7; border: 1px solid #f3ebd8; border-radius: 14px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 200px;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #07c160); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 12px rgba(7,193,96,0.25);">
        专
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 700; color: #78350f;">创作者专栏 · 深度工程思考</div>
        <div style="font-size: 12px; color: #92400e; margin-top: 3px; line-height: 1.5;">
          专注探索自媒体工业级流水线排版、自动化全网矩阵推送与前沿技术实战。
        </div>
      </div>
    </div>
    <div style="text-align: center; border-left: 1px dashed #f3ebd8; padding-left: 16px; flex-shrink: 0;">
      <div style="width: 68px; height: 68px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #9ca3af; margin: 0 auto;">
        [二维码位]
      </div>
      <div style="font-size: 11px; color: #78350f; font-weight: 600; margin-top: 4px;">长按扫码关注</div>
    </div>
  </div>
</section>

`,
    previewHtml: `<div style="padding: 8px 12px; background: #fdfbf7; border: 1px solid #f3ebd8; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; gap: 8px; align-items: center;"><div style="width: 28px; height: 28px; border-radius: 50%; background: #10b981; color: #fff; text-align: center; line-height: 28px; font-size: 11px; font-weight: bold;">专</div><div><div style="font-size: 10px; font-weight: bold; color: #78350f;">深度工程思考</div><div style="font-size: 9px; color: #92400e;">专注自媒体工业级排版</div></div></div><span style="font-size: 9px; color: #78350f; border: 1px dashed #d97706; padding: 2px 4px; border-radius: 3px;">长按扫码</span></div>`,
  },

  // 12. 风格分割线系列 - 剪刀虚线 (Divider Scissor)
  {
    id: 'divider-scissor',
    name: '剪刀裁切虚线分割线',
    description: '经典的纸质裁切线，带左侧或居中小剪刀图标，适合章节过渡与附录区分',
    category: 'divider',
    icon: '✂️',
    tag: '经典分割',
    template: `<div style="margin: 32px 0; text-align: center; position: relative;">
  <div style="border-top: 1.5px dashed #cbd5e1; height: 1px; width: 100%;"></div>
  <span style="display: inline-block; background: #ffffff; padding: 0 10px; position: relative; top: -11px; color: #94a3b8; font-size: 13px;">✂️ - - - - - - - - - -</span>
</div>

`,
    previewHtml: `<div style="text-align: center; padding: 8px 0; border-top: 1px dashed #cbd5e1; position: relative; margin: 10px 0;"><span style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 6px; font-size: 10px; color: #94a3b8;">✂️ - - - - -</span></div>`,
  },

  // 13. 风格分割线系列 - 渐变微光渐隐线 (Divider Gradient)
  {
    id: 'divider-gradient',
    name: '极简微光双向渐隐分割线',
    description: '现代大厂极简风格，由中心向两端渐隐的细线，清爽无任何视觉杂质',
    category: 'divider',
    icon: '➖',
    tag: '现代极简',
    template: `<div style="margin: 36px auto; width: 80%; height: 1.5px; background: linear-gradient(90deg, rgba(203,213,225,0) 0%, rgba(30,128,255,0.7) 50%, rgba(203,213,225,0) 100%); border-radius: 1px;"></div>

`,
    previewHtml: `<div style="margin: 12px auto; width: 70%; height: 2px; background: linear-gradient(90deg, transparent, #1e80ff, transparent);"></div>`,
  },

  // 14. 风格分割线系列 - 几何菱形三点线 (Divider Diamonds)
  {
    id: 'divider-diamonds',
    name: '雅致几何菱形三点线',
    description: '居中排列的古典几何菱形符号，给人静谧有品位的纸书阅读体验',
    category: 'divider',
    icon: '◆',
    tag: '雅致人文',
    template: `<div style="margin: 32px 0; text-align: center; font-size: 12px; letter-spacing: 8px; color: #94a3b8; opacity: 0.85;">
  ◆ · ◆ · ◆
</div>

`,
    previewHtml: `<div style="text-align: center; font-size: 10px; letter-spacing: 6px; color: #94a3b8; padding: 6px 0;">◆ · ◆ · ◆</div>`,
  },

  // 15. 清新技巧提示框 (Tip Success Card)
  {
    id: 'tip-success-card',
    name: '清新技巧与成功提示框',
    description: '青绿底色柔光边框，适合小技巧、实战心得或操作成功的正向反馈',
    category: 'quote',
    icon: '💡',
    tag: '技巧心得',
    template: `<section style="margin: 22px 0; padding: 14px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4.5px solid #10b981; border-radius: 8px;">
  <div style="font-size: 14px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
    <span>💡 实战效率提升小妙招</span>
  </div>
  <p style="margin: 0; font-size: 13.5px; line-height: 1.7; color: #14532d;">
    建议在本地写作时开启「中英排版规范化」，配合「外链转脚注」，只需一次点击即可让全文达到专业学术大刊级别的严谨度！
  </p>
</section>

`,
    previewHtml: `<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 8px 12px; border-radius: 4px;"><strong style="color: #166534; font-size: 10px;">💡 实战小妙招</strong><p style="margin: 2px 0 0; color: #14532d; font-size: 9px;">开启中英排版规范化与外链转脚注...</p></div>`,
  },
];


