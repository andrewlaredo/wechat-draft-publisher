/**
 * interactiveComponents.ts
 * 微信公众号专属特色互动排版组件库
 * 包含：
 * 1. 吸顶悬浮精华卡片 (Sticky Summary Card)
 * 2. 点击展开/折叠答疑 (Accordion FAQ Card)
 * 3. 左右手势滑动图集 (Horizontal Scroll Gallery)
 * 4. 引导关注/点赞在看卡片 (Call-to-Action Follow Card)
 * 5. 重点提炼高光卡片 (Key Highlights Card)
 * 6. 往期精选两列推荐 (Recommended Articles Card)
 */

export interface InteractiveComponentItem {
  id: string;
  name: string;
  description: string;
  category: 'interaction' | 'card' | 'gallery' | 'guide';
  icon: string;
  template: string;
  previewHtml: string;
}

export const INTERACTIVE_COMPONENTS: InteractiveComponentItem[] = [
  {
    id: 'faq-accordion',
    name: '点击展开/折叠答疑',
    description: '利用原生 details/summary 实现点击展开收起，增加读者互动与停留时长',
    category: 'interaction',
    icon: '💡',
    template: `<details class="wechat-faq-card">
  <summary class="faq-summary">💡 点击揭晓深度思考题与解析</summary>
  <div class="faq-content">
    <p><strong>【核心要点】</strong>微信官方草稿箱 API 对 HTML 内容长度有 20k 限制，但网页端后台没有此限制。利用本工具的<strong>自动极限压缩</strong>与<strong>一键复制排版</strong>功能，即可轻松突破发布障碍！</p>
  </div>
</details>

`,
    previewHtml: `<div style="border: 1.5px dashed #1e80ff; background: #f0f7ff; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #1e80ff; cursor: pointer;">💡 <strong>点击揭晓深度思考题与解析</strong> <span style="font-size: 11px; float: right;">[展开]</span></div>`,
  },
  {
    id: 'scroll-gallery',
    name: '左右滑动多图图集',
    description: '手势横向无缝滑动卡片，适合展示多张连贯摄影、产品细节或对比配图',
    category: 'gallery',
    icon: '🎠',
    template: `<section class="wechat-scroll-gallery">
  <div class="gallery-track">
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="配图1" />
      <span class="gallery-caption">图 1 · 架构设计</span>
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" alt="配图2" />
      <span class="gallery-caption">图 2 · 实时渲染</span>
    </div>
    <div class="gallery-item">
      <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80" alt="配图3" />
      <span class="gallery-caption">图 3 · 矩阵分发</span>
    </div>
  </div>
  <p class="gallery-hint">👉 左右手势滑动浏览完整图集</p>
</section>

`,
    previewHtml: `<div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; display: flex; gap: 8px; overflow-x: hidden;"><div style="background: #e0e7ff; width: 80px; height: 50px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #4338ca;">图 1</div><div style="background: #fce7f3; width: 80px; height: 50px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #be185d;">图 2</div><div style="background: #dcfce7; width: 80px; height: 50px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #15803d;">图 3</div></div>`,
  },
  {
    id: 'sticky-summary',
    name: '吸顶/悬浮精华卡片',
    description: '带有品牌色阴影与高亮角标的重点总结卡片，开门见山强化核心观点',
    category: 'card',
    icon: '📌',
    template: `<section class="wechat-sticky-card">
  <div class="sticky-badge">✨ 本期速读精华</div>
  <p class="sticky-text">本文全面剖析自媒体自动化排版与微信草稿箱无缝对接实战。掌握这 3 个技巧，即可将每周推文排版耗时从 3 小时缩短至 5 分钟！</p>
</section>

`,
    previewHtml: `<div style="background: #fff; border-left: 4px solid #da282a; box-shadow: 0 4px 12px rgba(218,40,42,0.12); padding: 12px 14px; border-radius: 6px;"><span style="background: #da282a; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">✨ 本期速读精华</span><p style="margin: 6px 0 0; font-size: 12px; color: #374151;">本文全面剖析自媒体自动化排版实战...</p></div>`,
  },
  {
    id: 'quote-box',
    name: '浮雕金句引用框',
    description: '居中大双引号立体质感金句框，优雅展示名人名言或核心座右铭',
    category: 'card',
    icon: '💬',
    template: `<section class="wechat-quote-card">
  <div class="quote-mark">“</div>
  <p class="quote-text">工欲善其事，必先利其器。优秀的自媒体创作者应当将时间倾注于深度思考与洞察，而将机械的排版与分发交由自动化流水线。</p>
  <div class="quote-author">— 科技探索者 · 随笔</div>
</section>

`,
    previewHtml: `<div style="text-align: center; background: #fdfbf7; border: 1px solid #f3ebd8; padding: 14px; border-radius: 8px;"><div style="font-size: 24px; color: #b45309; line-height: 1;">“</div><div style="font-size: 12px; color: #78350f; font-style: italic;">工欲善其事，必先利其器...</div><div style="font-size: 10px; color: #92400e; margin-top: 4px;">— 随笔</div></div>`,
  },
  {
    id: 'follow-card',
    name: '引导在看/关注底卡',
    description: '文末引导点赞、在看与长按关注的高转化精致卡片，呼应主题主色系',
    category: 'guide',
    icon: '🚀',
    template: `<section class="wechat-follow-card">
  <div class="follow-title">欢迎关注「科技探索者」</div>
  <div class="follow-desc">每周分享优质 Markdown 排版技巧、全栈开发与效率神器实战</div>
  <div class="follow-badge-container">
    <span class="follow-badge">👆 长按指纹识别关注</span>
    <span class="follow-badge">❤️ 点击右下角「在看」</span>
    <span class="follow-badge">🔁 转发给身边的朋友</span>
  </div>
</section>

`,
    previewHtml: `<div style="text-align: center; background: linear-gradient(135deg, #1e80ff0d, #8b5cf61a); border: 1px solid #1e80ff33; border-radius: 10px; padding: 14px;"><strong style="color: #1e80ff; font-size: 13px;">欢迎关注「科技探索者」</strong><div style="font-size: 11px; color: #64748b; margin-top: 4px;">每周分享优质干货实战</div><div style="display: inline-block; margin-top: 8px; font-size: 10px; background: #1e80ff; color: #fff; padding: 2px 8px; border-radius: 99px;">点赞 · 在看 · 分享</div></div>`,
  },
  {
    id: 'math-formula-sample',
    name: '数学公式 (LaTeX / KaTeX)',
    description: '支持行内公式 $E=mc^2$ 与多行复杂微积分、矩阵公式的高保真内联渲染',
    category: 'interaction',
    icon: '📐',
    template: `### 核心数理推导

行内公式示例：根据相对论质能方程 $E = mc^2$，以及动量关系 $p = \\hbar k$。

块级高斯积分与极限公式：

$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

多元矩阵运算示例：

$$
\\mathbf{A} = \\begin{pmatrix}
a_{11} & a_{12} \\\\
a_{21} & a_{22}
\\end{pmatrix}, \\quad
\\det(\\mathbf{A}) = a_{11}a_{22} - a_{12}a_{21}
$$

`,
    previewHtml: `<div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; font-family: serif; font-size: 14px; color: #1f2937;">∫ e<sup>-x²</sup> dx = √π</div>`,
  },
  {
    id: 'mermaid-diagram-sample',
    name: 'Mermaid 流程图 / 时序图',
    description: '直接编写 Mermaid 代码块，自动渲染为微信全端兼容的矢量流程图卡片',
    category: 'interaction',
    icon: '📊',
    template: `### 微信发布系统数据流向

\`\`\`mermaid
graph TD
  A[Markdown 源文件] -->|解析 Front-Matter| B[AST 语法树]
  B -->|Juice 样式注入| C[内联 CSS HTML]
  C -->|极速压图与去重| D[微信素材库 CDN]
  D -->|draft/add API| E[微信官方草稿箱]
  E -->|一键正式群发| F[全网读者推送]
\`\`\`

`,
    previewHtml: `<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px;"><span style="background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px;">Markdown</span> ➔ <span style="background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px;">草稿箱</span> ➔ <span style="background: #8b5cf6; color: #fff; padding: 2px 6px; border-radius: 4px;">正式群发</span></div>`,
  },
];
