import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function run() {
  console.log('Generating public/icon.png and images/architecture.png...');

  // Ensure directories exist
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }
  if (!fs.existsSync('images')) {
    fs.mkdirSync('images', { recursive: true });
  }

  // 1. Generate public/icon.png (512x512)
  const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="docGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#047857" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background squircle -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#bgGrad)" filter="url(#dropShadow)"/>

  <!-- Subtle glow ring -->
  <rect x="28" y="28" width="456" height="456" rx="100" fill="none" stroke="#6ee7b7" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Document Paper -->
  <rect x="120" y="96" width="272" height="320" rx="20" fill="url(#docGrad)" filter="url(#dropShadow)"/>
  
  <!-- Fold corner -->
  <path d="M332 96 L392 156 L332 156 Z" fill="#e2e8f0"/>
  <path d="M332 96 L392 156" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Document Header lines -->
  <rect x="160" y="146" width="130" height="18" rx="9" fill="#059669"/>
  
  <!-- Front Matter block representation -->
  <rect x="160" y="180" width="192" height="44" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
  <rect x="174" y="192" width="70" height="8" rx="4" fill="#64748b"/>
  <rect x="254" y="192" width="80" height="8" rx="4" fill="#059669"/>
  <rect x="174" y="206" width="50" height="8" rx="4" fill="#64748b"/>
  <rect x="234" y="206" width="100" height="8" rx="4" fill="#3b82f6"/>

  <!-- Content text lines -->
  <rect x="160" y="242" width="192" height="10" rx="5" fill="#94a3b8"/>
  <rect x="160" y="260" width="160" height="10" rx="5" fill="#94a3b8"/>

  <!-- Code Snippet with Mac dots -->
  <rect x="160" y="286" width="192" height="52" rx="10" fill="#1e293b"/>
  <circle cx="178" cy="302" r="4.5" fill="#f87171"/>
  <circle cx="192" cy="302" r="4.5" fill="#fbbf24"/>
  <circle cx="206" cy="302" r="4.5" fill="#34d399"/>
  <rect x="176" y="318" width="60" height="8" rx="4" fill="#38bdf8"/>
  <rect x="244" y="318" width="80" height="8" rx="4" fill="#a78bfa"/>

  <!-- WeChat Publish Badge (Green circle with paper plane / check) -->
  <circle cx="360" cy="360" r="50" fill="#07c160" filter="url(#softShadow)"/>
  <circle cx="360" cy="360" r="46" fill="none" stroke="#a7f3d0" stroke-width="3" stroke-opacity="0.6"/>
  <!-- Paper airplane / publish arrow -->
  <path d="M342 362 L380 344 L364 380 L358 366 Z" fill="#ffffff"/>
  <path d="M380 344 L358 366" stroke="#10b981" stroke-width="2"/>
</svg>
`;

  await sharp(Buffer.from(iconSvg))
    .png({ quality: 95 })
    .toFile('public/icon.png');
  console.log('✅ Generated public/icon.png');

  // 2. Generate images/architecture.png (1200x680)
  const archSvg = `
<svg width="1200" height="680" viewBox="0 0 1200 680" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="cardBg1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="680" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <g opacity="0.06" stroke="#ffffff" stroke-width="1">
    <path d="M 0 80 L 1200 80 M 0 160 L 1200 160 M 0 240 L 1200 240 M 0 320 L 1200 320 M 0 400 L 1200 400 M 0 480 L 1200 480 M 0 560 L 1200 560 M 0 640 L 1200 640"/>
    <path d="M 100 0 L 100 680 M 200 0 L 200 680 M 300 0 L 300 680 M 400 0 L 400 680 M 500 0 L 500 680 M 600 0 L 600 680 M 700 0 L 700 680 M 800 0 L 800 680 M 900 0 L 900 680 M 1000 0 L 1000 680 M 1100 0 L 1100 680"/>
  </g>

  <!-- Top Header Title -->
  <text x="600" y="54" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="24" font-weight="700" fill="#f8fafc" letter-spacing="1">
    WeChat Draft Publisher 技术架构与数据流水线
  </text>
  <text x="600" y="80" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
    从 Markdown 原文编译、主题内联、图片转码上传到微信草稿箱 API 的端到端流水线
  </text>

  <!-- Pipeline Stages -->

  <!-- STAGE 1: Input -->
  <g transform="translate(60, 115)">
    <rect width="230" height="490" rx="16" fill="url(#cardBg1)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)"/>
    <rect width="230" height="44" rx="16" fill="#1e293b"/>
    <rect x="0" y="30" width="230" height="14" fill="#1e293b"/>
    <line x1="0" y1="44" x2="230" y2="44" stroke="#334155" stroke-width="1"/>
    
    <!-- Stage 1 Title -->
    <circle cx="28" cy="22" r="9" fill="#10b981"/>
    <text x="28" y="26" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">1</text>
    <text x="46" y="26" font-family="sans-serif" font-size="14" font-weight="700" fill="#f8fafc">输入层 (Input)</text>

    <!-- Items -->
    <g transform="translate(16, 65)">
      <rect width="198" height="68" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#38bdf8">📄 Markdown 文档</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">标准语法、段落、引用</text>
      <text x="14" y="58" font-family="sans-serif" font-size="11" fill="#64748b">代码块、表格、列表</text>
    </g>

    <g transform="translate(16, 148)">
      <rect width="198" height="74" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#a78bfa">🏷️ Front Matter 元数据</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">title / author / digest</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#64748b">cover / theme / comment</text>
    </g>

    <g transform="translate(16, 237)">
      <rect width="198" height="74" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#f59e0b">🖼️ 本地配图清单</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">相对路径配图自动探测</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#64748b">WebP / PNG / JPG / GIF</text>
    </g>

    <g transform="translate(16, 326)">
      <rect width="198" height="74" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#10b981">⚙️ 五级配置策略</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">CLI &gt; FM &gt; .env &gt; YAML</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#64748b">自动按权重逐级继承覆盖</text>
    </g>

    <g transform="translate(16, 415)">
      <rect width="198" height="58" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#34d399">🤖 AI 辅助撰稿</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">Gemini + RAG 知识扩写</text>
    </g>
  </g>

  <!-- Arrow 1 -> 2 -->
  <g transform="translate(300, 345)" stroke="#10b981" stroke-width="2.5" fill="none">
    <path d="M 0 0 L 32 0" />
    <polygon points="32,-5 42,0 32,5" fill="#10b981" stroke="none"/>
  </g>

  <!-- STAGE 2: Processing & Rendering -->
  <g transform="translate(352, 115)">
    <rect width="250" height="490" rx="16" fill="url(#cardBg1)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)"/>
    <rect width="250" height="44" rx="16" fill="#1e293b"/>
    <rect x="0" y="30" width="250" height="14" fill="#1e293b"/>
    <line x1="0" y1="44" x2="250" y2="44" stroke="#334155" stroke-width="1"/>

    <!-- Stage 2 Title -->
    <circle cx="28" cy="22" r="9" fill="#3b82f6"/>
    <text x="28" y="26" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">2</text>
    <text x="46" y="26" font-family="sans-serif" font-size="14" font-weight="700" fill="#f8fafc">解析与样式编译 (Render)</text>

    <!-- Items -->
    <g transform="translate(16, 65)">
      <rect width="218" height="90" rx="10" fill="#0f172a" stroke="#2563eb" stroke-width="1.2"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#60a5fa">🌲 gray-matter + markdown-it</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">Markdown AST 抽象语法树</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">Highlight.js 语法着色</text>
      <text x="14" y="76" font-family="sans-serif" font-size="11" fill="#38bdf8">macOS 拟物三色窗控胶囊</text>
    </g>

    <g transform="translate(16, 170)">
      <rect width="218" height="96" rx="10" fill="#0f172a" stroke="#d97706" stroke-width="1.2"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#fbbf24">🎨 Juice 全量 CSS 内联引擎</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">9 大质感排版主题 CSS</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">100% 内联写入 style 属性</text>
      <text x="14" y="78" font-family="sans-serif" font-size="11" fill="#f59e0b">剥离 &lt;style&gt; 绕开微信过滤</text>
    </g>

    <g transform="translate(16, 282)">
      <rect width="218" height="96" rx="10" fill="#0f172a" stroke="#059669" stroke-width="1.2"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#34d399">🧼 严格 HTML 安全过滤</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">sanitizeWechatHtml 净化</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">清除 script / iframe / onclick</text>
      <text x="14" y="78" font-family="sans-serif" font-size="11" fill="#10b981">规范 section 与 blockquote</text>
    </g>

    <g transform="translate(16, 394)">
      <rect width="218" height="80" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">📱 移动端 1:1 双栏实时渲染</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">微信 iOS 阅读器容器还原</text>
      <text x="14" y="62" font-family="sans-serif" font-size="11" fill="#64748b">字数 / 摘要实时长度感知</text>
    </g>
  </g>

  <!-- Arrow 2 -> 3 -->
  <g transform="translate(612, 345)" stroke="#3b82f6" stroke-width="2.5" fill="none">
    <path d="M 0 0 L 32 0" />
    <polygon points="32,-5 42,0 32,5" fill="#3b82f6" stroke="none"/>
  </g>

  <!-- STAGE 3: Pre-flight & Media -->
  <g transform="translate(664, 115)">
    <rect width="230" height="490" rx="16" fill="url(#cardBg1)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)"/>
    <rect width="230" height="44" rx="16" fill="#1e293b"/>
    <rect x="0" y="30" width="230" height="14" fill="#1e293b"/>
    <line x1="0" y1="44" x2="230" y2="44" stroke="#334155" stroke-width="1"/>

    <!-- Stage 3 Title -->
    <circle cx="28" cy="22" r="9" fill="#f59e0b"/>
    <text x="28" y="26" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">3</text>
    <text x="46" y="26" font-family="sans-serif" font-size="14" font-weight="700" fill="#f8fafc">校验与素材处理 (Asset)</text>

    <!-- Items -->
    <g transform="translate(16, 65)">
      <rect width="198" height="96" rx="10" fill="#0f172a" stroke="#d97706" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#fbbf24">🛡️ Pre-flight 微信硬性限制</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">标题 ≤ 64 字符</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">摘要 ≤ 120 字符 (超长截断)</text>
      <text x="14" y="78" font-family="sans-serif" font-size="11" fill="#f59e0b">HTML ≤ 20k 字符 &amp; ≤ 1MB</text>
    </g>

    <g transform="translate(16, 176)">
      <rect width="198" height="96" rx="10" fill="#0f172a" stroke="#9333ea" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#c084fc">⚡ Sharp 图像转码管道</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">自动探测 WebP 格式</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">无损转码为 PNG/JPEG</text>
      <text x="14" y="78" font-family="sans-serif" font-size="11" fill="#a855f7">规避微信素材库 40007 报错</text>
    </g>

    <g transform="translate(16, 287)">
      <rect width="198" height="96" rx="10" fill="#0f172a" stroke="#059669" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#34d399">🔑 SHA-256 幂等性缓存</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">图片文件哈希指纹校验</text>
      <text x="14" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">.cache/ 命中直接复用</text>
      <text x="14" y="78" font-family="sans-serif" font-size="11" fill="#10b981">零重复消耗上传配额与流量</text>
    </g>

    <g transform="translate(16, 398)">
      <rect width="198" height="76" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="14" y="24" font-family="sans-serif" font-size="13" font-weight="600" fill="#38bdf8">🧪 Dry-Run 预演模式</text>
      <text x="14" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">不消耗网络与正式草稿箱</text>
      <text x="14" y="62" font-family="sans-serif" font-size="11" fill="#64748b">CI / CD 自动化测试校验</text>
    </g>
  </g>

  <!-- Arrow 3 -> 4 -->
  <g transform="translate(904, 345)" stroke="#f59e0b" stroke-width="2.5" fill="none">
    <path d="M 0 0 L 32 0" />
    <polygon points="32,-5 42,0 32,5" fill="#f59e0b" stroke="none"/>
  </g>

  <!-- STAGE 4: WeChat API & Desktop -->
  <g transform="translate(946, 115)">
    <rect width="194" height="490" rx="16" fill="url(#cardBg1)" stroke="#334155" stroke-width="1.5" filter="url(#cardShadow)"/>
    <rect width="194" height="44" rx="16" fill="#1e293b"/>
    <rect x="0" y="30" width="194" height="14" fill="#1e293b"/>
    <line x1="0" y1="44" x2="194" y2="44" stroke="#334155" stroke-width="1"/>

    <!-- Stage 4 Title -->
    <circle cx="28" cy="22" r="9" fill="#10b981"/>
    <text x="28" y="26" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">4</text>
    <text x="46" y="26" font-family="sans-serif" font-size="14" font-weight="700" fill="#f8fafc">发布与发布终端</text>

    <!-- Items -->
    <g transform="translate(14, 65)">
      <rect width="166" height="96" rx="10" fill="#0f172a" stroke="#059669" stroke-width="1.2"/>
      <text x="12" y="24" font-family="sans-serif" font-size="12" font-weight="600" fill="#34d399">☁️ 微信永久素材库</text>
      <text x="12" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">封面 thumb_media_id</text>
      <text x="12" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">正文图片上传图床</text>
      <text x="12" y="78" font-family="sans-serif" font-size="11" fill="#10b981">自动替换为 mmbiz URL</text>
    </g>

    <g transform="translate(14, 176)">
      <rect width="166" height="96" rx="10" fill="#0f172a" stroke="#2563eb" stroke-width="1.2"/>
      <text x="12" y="24" font-family="sans-serif" font-size="12" font-weight="600" fill="#60a5fa">📬 官方草稿箱 API</text>
      <text x="12" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">/cgi-bin/draft/add</text>
      <text x="12" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">单图文 / 多图文合辑</text>
      <text x="12" y="78" font-family="sans-serif" font-size="11" fill="#38bdf8">指数退避自动重试</text>
    </g>

    <g transform="translate(14, 287)">
      <rect width="166" height="96" rx="10" fill="#0f172a" stroke="#9333ea" stroke-width="1.2"/>
      <text x="12" y="24" font-family="sans-serif" font-size="12" font-weight="600" fill="#c084fc">🚀 正式群发与发布</text>
      <text x="12" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">FreePublish 官方发布</text>
      <text x="12" y="60" font-family="sans-serif" font-size="11" fill="#94a3b8">草稿拉取与回显二次编辑</text>
      <text x="12" y="78" font-family="sans-serif" font-size="11" fill="#a855f7">草稿一键快速删除</text>
    </g>

    <g transform="translate(14, 398)">
      <rect width="166" height="76" rx="10" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="12" y="24" font-family="sans-serif" font-size="12" font-weight="600" fill="#fbbf24">💻 Wails v2 桌面客户端</text>
      <text x="12" y="44" font-family="sans-serif" font-size="11" fill="#94a3b8">Win / Mac / Linux</text>
      <text x="12" y="62" font-family="sans-serif" font-size="11" fill="#64748b">系统原生对话框支持</text>
    </g>
  </g>

  <!-- Bottom Footer Info -->
  <text x="600" y="640" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#475569">
    WeChat Draft Publisher • High-Compatibility Native Markdown Publishing Pipeline • MIT License
  </text>
</svg>
`;

  await sharp(Buffer.from(archSvg))
    .png({ quality: 95 })
    .toFile('images/architecture.png');
  console.log('✅ Generated images/architecture.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
