---
title: 微信公众号草稿自动化发布实战指南
author: 科技探索者
digest: 探索如何通过 Markdown 快速排版、自动内联样式并将图文无缝推送到微信公众号草稿箱，提升自媒体创作者效率。
cover: ./images/cover.png
comment: true
theme: tech-blue
code_theme: github
---

## 为什么需要自动化草稿发布？

在自媒体运营中，Markdown 是绝大多数开发者与技术创作者最偏爱的写作语言。然而，微信公众号原生的富文本编辑器对 Markdown 的支持一直非常有限，经常面临：

1. **排版格式错乱**：外部编辑器复制粘贴后段距、行高、代码高亮丢失。
2. **图片外链被吞**：微信公众号严格拦截外部图片外链，必须手动逐张重新上传并替换。
3. **代码块缺乏高亮与横向滑动**：长代码经常折行变形，阅读体验极差。

通过本工具，我们可以一键将本地 Markdown 转换为高兼容内联样式 HTML，并自动上传本地素材！

### 核心功能特性

- **主题定制**：内置科技蓝、清新竹绿、暖纸人文等多种排版主题；
- **全内联样式**：使用 `juice` 引擎深度内联所有 CSS，杜绝公众号样式丢失；
- **代码高亮与 macOS 控件**：集成 `highlight.js`，呈现精致代码块风格；
- **图片自动上传**：自动解析配图并直传微信永久素材库，替换为 `mmbiz.qpic.cn`；
- **幂等性防护**：基于 SHA-256 内容指纹，避免重复发布草稿。

```typescript
// 示例：快速配置微信公众号客户端
import { WeChatAuth } from './wechat/auth.ts';

const auth = new WeChatAuth(
  process.env.WECHAT_APP_ID!,
  process.env.WECHAT_APP_SECRET!
);

const token = await auth.getAccessToken();
console.log('WeChat Token ready:', token);
```

> **温馨提示**：在微信公众平台的「设置与开发」-「基本配置」中，请务必将部署服务器的公网 IP 加入 **IP 白名单**，否则接口将返回 `40164` 错误代码。

### 常用命令对照表

| 选项参数 | 简写 | 描述说明 |
| :--- | :--- | :--- |
| `--dry-run` | 无 | 本地排版测试，不向微信服务器发起真实请求 |
| `--preview` | 无 | 仅转换和解析上传，不创建草稿 |
| `--theme` | 无 | 指定排版主题 (tech-blue, warm-paper, default) |
| `--force` | 无 | 忽略幂等哈希，强制重新发布 |

欢迎体验并分享这套自动发布工作流！
