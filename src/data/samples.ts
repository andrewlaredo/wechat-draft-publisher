export interface ArticleSample {
  id: string;
  name: string;
  theme: string;
  articleType?: 'news' | 'newspic';
  markdown: string;
}

export const SAMPLE_ARTICLES: ArticleSample[] = [
  {
    id: 'pie-digital',
    name: '数字生活：高效工作流指南',
    theme: 'pie',
    markdown: `---
title: 数字极客视角：如何搭建优雅舒适的个人工作流
author: 数字极客
digest: 探讨如何用结构化 Markdown 串联日常思考与微信内容分发，兼具阅读美感与高效排版。
cover: https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80
comment: true
theme: pie
code_theme: github
---

## 数字生活的美感与效率

在快节奏的内容创作中，一套**兼具阅读美感与高效分发**的数字工作流至关重要。

排版从来不只是「好看」，更是为了降低受众的认知负荷，让重点信息自然浮现。本排版设计遵循现代数字阅读的经典视觉规范：

1. **左侧强调色条**：二级标题采用厚实主题色条引导视觉焦点；
2. **优雅间距留白**：段间距与字间距经严格视觉微调，适合移动端长时间阅读；
3. **沉浸式代码与引用**：macOS 原生三色圆点与高亮对比，科技感与专业度拉满。

### 核心构建模块推荐

- **输入层**：使用本地 Markdown 专注文字创作，杜绝富文本排版混乱；
- **排版层**：一键切换主题排版开关，支持原生黑白极简与精选主题；
- **分发层**：通过微信官方 API 自动化上传素材库并写入草稿箱。

\`\`\`bash
# 快速启动一键排版与草稿推送
npm run dev
\`\`\`

> **数字创作信条**：好的工具不仅是完成任务的帮手，更赋予创作者持久的专注力与表达欲。

### 常用快捷排版对照

| 语法元素 | 视觉呈现效果 | 适用场景 |
| :--- | :--- | :--- |
| **加粗强调** | 突出关键主题色与字重 | 核心结论、重点名词 |
| \`行内代码\` | 独立浅红/浅灰底色徽章 | 快捷键、参数、路径 |
| 引用区块 | 左侧高饱和色彩引导条 | 名言名句、背景补充 |

在左上角随时打开或关闭「**主题排版开关**」，即可随心对比精美主题与原生极简黑白排版！
`,
  },
  {
    id: 'tech-guide',
    name: '技术实战：微信草稿自动化',
    theme: 'tech-blue',
    markdown: `---
title: 微信公众号草稿自动化发布实战指南
author: 科技探索者
digest: 探索如何通过 Markdown 快速排版、自动内联样式并将图文无缝推送到微信公众号草稿箱，提升自媒体创作者效率。
cover: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80
comment: true
theme: tech-blue
code_theme: github
---

## 为什么需要自动化草稿发布？

在自媒体运营中，Markdown 是绝大多数技术人员与创作者最钟爱的排版语言。然而，微信公众号原生的富文本编辑器对 Markdown 支持有限：

1. **排版格式容易变形**：外部编辑器复制粘贴后段间距、行高常常丢失；
2. **外部图片受限**：微信生态对未上传素材库的外部图片做严格防盗链拦截；
3. **代码块难以横向滑动**：长行代码经常被折断，阅读体验受到影响。

通过本工具，我们可以一键实现本地 Markdown 智能渲染为高质量内联 HTML，并自动上传永久素材！

### 核心功能特性一览

- **全量内联样式**：基于 \`juice\` 引擎将 CSS 完全转为 HTML 元素的行内样式；
- **macOS 风格代码块**：集成经典红黄绿三色圆点，长代码自动横向滚动；
- **图片自动直传**：自动解析配图并上传微信素材库，替换为 \`mmbiz.qpic.cn\` 地址；
- **幂等性保障**：利用 SHA-256 内容指纹，避免重复上传同一版本。

\`\`\`typescript
// 示例：Node.js 快速调用发布流水线
import { runPublishPipeline } from './src/pipeline.ts';

const result = await runPublishPipeline({
  filePath: './posts/article.md',
  config: myConfig,
  themeOverride: 'tech-blue',
  dryRun: false, // 设置为 true 可进行本地试运行
});

console.log('微信草稿 media_id:', result.media_id);
\`\`\`

> **安全提示**：请务必登录微信公众平台，在「开发」-「基本配置」中将服务器公网 IP 加入 **IP 白名单**，否则调用接口将返回 \`40164\` 错误。

### 常用命令对照表

| 选项参数 | 缩写 | 功能说明 |
| :--- | :--- | :--- |
| \`--dry-run\` | 无 | 本地排版测试，不向微信服务器发起真实网络请求 |
| \`--preview\` | 无 | 仅转换和解析配图，不创建草稿 |
| \`--theme\` | 无 | 切换排版主题 (pie, orangeheart, lapis, tech-blue) |
| \`--force\` | 无 | 忽略内容哈希比对，强制重新推送 |

让我们告别繁琐的手工排版，享受自动化写作的乐趣！
`,
  },
  {
    id: 'product-release',
    name: '产品发布：2.0 新版特性',
    theme: 'default',
    markdown: `---
title: 效率跃升！全新 2.0 智能排版发布工具正式上线
author: 产品团队
digest: 带来全新五款微信排版主题、智能配图优化与毫秒级草稿箱直推体验，重塑自媒体创作流。
cover: https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80
comment: true
theme: default
code_theme: github
---

## 重新定义公众号创作体验

经过数周的打磨，我们非常兴奋地向大家介绍 **全新 2.0 自动发布引擎**。我们致力于为内容创作者打造最纯粹、最高效的工作流。

### 本次更新重点

- **五款全新主题**：涵盖科技、极简、暖纸与人文美学；
- **自适应图片压缩**：自动识别超过 10MB 的高分辨率图片并告警提示；
- **草稿箱双向同步**：支持创建全新草稿与覆盖更新已有草稿；
- **本地实时预览**：1:1 还原微信手机客户端真实阅读外观。

> "工具的价值在于将人从重复劳动中解放出来，专注于高价值的内容创作。"

欢迎大家在后台留言，分享您的使用反馈！
`,
  },
  {
    id: 'essay-reading',
    name: '深度阅读：纸墨慢读',
    theme: 'warm-paper',
    markdown: `---
title: 慢阅读时代：重新寻回深度思考的专注力
author: 墨香散人
digest: 在碎片化信息汹涌的时代，如何通过长文阅读重塑心智秩序，在纸墨交错间感受平静的力量。
cover: https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80
comment: true
theme: warm-paper
code_theme: github
---

## 一、在信息洪流中停驻

我们生活在一个注意力被极大瓜分的时代。短视频、即时推送与碎片化讯息如同不断涌来的浪潮，迅速填满每一个细碎的缝隙。

然而，真正具有穿透力的思想，往往诞生于**深度的凝视与沉淀**之中。

> "书籍是最好的避难所，也是最开阔的旷野。在文字构建的静谧中，思维才能展翅飞翔。"

### 二、长文写作的美学

在排版与阅读的体验中，每一个细节都承载着情绪：

1. **字句留白**：合适的行高与行宽让视线得以从容舒展；
2. **温润色调**：微暖的纸张底色能够有效舒缓双眼的疲惫；
3. **节奏起伏**：引用、留白与段落交替，犹如乐曲的呼吸。

愿每一个文字工作者，都能在浮躁的世界里，守护一方深邃的文字天地。
`,
  },
  {
    id: 'newspic-gallery',
    name: '📸 图片消息：桌面美学与治愈贴图',
    theme: 'pie',
    articleType: 'newspic',
    markdown: `---
title: 周末桌面改造手记与极简好物分享
author: 视觉灵感集
type: newspic
digest: 打造舒适沉浸的个人桌面角，分享几件提升生活幸福感的高颜值极简好物。
cover: https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80
images:
  - https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80
  - https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80
  - https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80
  - https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80
comment: true
---

✨ 周末给自己的小书桌来了一次深度断舍离～

花了大半天时间理线和重新布局，把桌面从原来的杂乱堆叠变成了现在的极简纯净空间。当所有杂物归位，暖色台灯亮起的那一刻，工作和阅读的幸福感瞬间拉满！

🌿 几点桌面改造小体会：
1. 藏线是精髓：桌底使用自粘理线槽，视线范围内只保留一条主电源线；
2. 色系一致性：胡桃木色桌垫 + 哑光黑外设，沉稳耐看且不易反光；
3. 植物治愈角：一小株耐阴绿植，给数码冰冷质感增添自然呼吸感。

每次坐在整洁的书桌前，浮躁的心情总能迅速沉静下来。
大家最喜欢的桌面好物是什么？欢迎留言区一起种草交流呀！

#桌面美学 #我的工位长这样 #数码好物 #治愈系生活 #极简主义 #办公空间
`,
  },
];
