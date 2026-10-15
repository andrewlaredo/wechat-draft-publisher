/**
 * svgInteractiveTemplates.ts
 * 微信原生 SVG 交互排版黑科技模板引擎
 * 
 * 关键技术规范：
 * 1. 微信公众号富文本禁止外部 JavaScript，但原生支持行内 SVG、SVG <animate> / <animateTransform> / <set>
 * 2. 支持 -webkit-overflow-scrolling: touch 与 overflow-x: auto 实现原生无障碍左右横滑手势图集
 * 3. 100% 行内样式 (Inline Style)，跨 iOS / Android 微信客户端高保真渲染，零丢失
 */

export interface SvgInteractiveTemplate {
  id: string;
  name: string;
  category: 'reveal' | 'gallery' | 'vinyl' | 'danmaku' | 'flip' | 'poll' | 'badge';
  categoryName: string;
  description: string;
  tag: string;
  iconName: string;
  defaultConfig: Record<string, any>;
  renderHtml: (config: any) => string;
}

export const SVG_INTERACTIVE_TEMPLATES: SvgInteractiveTemplate[] = [
  // 1. 点击展开揭秘卡片 (Click to Reveal / Expand)
  {
    id: 'svg-click-reveal',
    name: '点击平滑展开 / 答案彩蛋揭秘',
    category: 'reveal',
    categoryName: '点击互动',
    description: '读者轻触卡片即可展开隐藏的深度解析、答案或惊喜彩蛋，停留时长利器',
    tag: '爆款高频',
    iconName: 'Eye',
    defaultConfig: {
      coverTitle: '💡 点击展开：这道行业面试题的官方标准答案',
      coverHint: '👇 轻触卡片解锁答案',
      revealedTitle: '深度拆解与破局方案：',
      revealedContent: '核心逻辑在于“降本增效”的指标闭环。首先重构信息流分发链路，将跳出率从 42% 压降至 18%；其次建立全链路漏斗跟踪，使单客获取成本降低 35%。',
      accentColor: '#07c160',
      bgColor: '#f9fbf9',
    },
    renderHtml: (cfg) => {
      const color = cfg.accentColor || '#07c160';
      const bg = cfg.bgColor || '#f9fbf9';
      return `<section style="margin: 24px 0; border: 1.5px dashed ${color}; border-radius: 12px; background-color: ${bg}; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
  <details style="outline: none; cursor: pointer;">
    <summary style="list-style: none; outline: none; padding: 16px 20px; font-weight: bold; color: #1e293b; font-size: 15px; display: flex; align-items: center; justify-content: space-between; user-select: none;">
      <span style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
        ${cfg.coverTitle}
      </span>
      <span style="font-size: 12px; font-weight: normal; color: ${color}; background-color: rgba(7, 193, 96, 0.1); padding: 4px 10px; border-radius: 20px;">
        ${cfg.coverHint}
      </span>
    </summary>
    <div style="padding: 16px 20px 20px; border-top: 1px dashed rgba(0,0,0,0.08); font-size: 14px; line-height: 1.8; color: #334155; background: #ffffff;">
      <div style="font-weight: 600; color: #0f172a; margin-bottom: 8px; font-size: 14.5px;">${cfg.revealedTitle}</div>
      <p style="margin: 0;">${cfg.revealedContent}</p>
    </div>
  </details>
</section>`;
    },
  },

  // 2. 左右手势横向滑动图集 (Swipeable Gallery)
  {
    id: 'svg-horizontal-gallery',
    name: '左右手势全景横滑图集',
    category: 'gallery',
    categoryName: '手势画廊',
    description: '移动端原生横滑手势，手指轻扫切换多张高清美图或步骤对比，不占纵向篇幅',
    tag: '视觉大片',
    iconName: 'Layers',
    defaultConfig: {
      title: '📸 手指左右轻扫，滑动查看现场全景高光集锦',
      card1Title: '01. 峰会主会场',
      card1Img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
      card1Desc: '千人座无虚席，前沿技术观点密集交锋',
      card2Title: '02. 核心架构展区',
      card2Img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
      card2Desc: '现场实操云原生微服务自动化发布流水线',
      card3Title: '03. 闭门圆桌论坛',
      card3Img: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80',
      card3Desc: '行业领袖共话下一代自动化运营工具演进',
    },
    renderHtml: (cfg) => {
      return `<section style="margin: 26px 0;">
  <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
    <span>${cfg.title}</span>
    <span style="font-size: 11px; color: #07c160; background: #e8f8ee; padding: 2px 8px; border-radius: 10px;">👈 左右手势滑动 👉</span>
  </div>
  <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; display: flex; gap: 14px; padding-bottom: 12px;">
    <!-- Slide 1 -->
    <div style="flex: 0 0 260px; border-radius: 10px; overflow: hidden; background: #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <img src="${cfg.card1Img}" style="width: 100%; height: 150px; object-fit: cover; display: block;" />
      <div style="padding: 12px;">
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${cfg.card1Title}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5;">${cfg.card1Desc}</div>
      </div>
    </div>
    <!-- Slide 2 -->
    <div style="flex: 0 0 260px; border-radius: 10px; overflow: hidden; background: #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <img src="${cfg.card2Img}" style="width: 100%; height: 150px; object-fit: cover; display: block;" />
      <div style="padding: 12px;">
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${cfg.card2Title}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5;">${cfg.card2Desc}</div>
      </div>
    </div>
    <!-- Slide 3 -->
    <div style="flex: 0 0 260px; border-radius: 10px; overflow: hidden; background: #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <img src="${cfg.card3Img}" style="width: 100%; height: 150px; object-fit: cover; display: block;" />
      <div style="padding: 12px;">
        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${cfg.card3Title}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5;">${cfg.card3Desc}</div>
      </div>
    </div>
  </div>
</section>`;
    },
  },

  // 3. 黑胶唱片旋转播客播放器 (Rotating Vinyl Record)
  {
    id: 'svg-vinyl-turntable',
    name: '黑胶唱片持续旋转 / 播客试听条',
    category: 'vinyl',
    categoryName: '黑胶动效',
    description: '利用原生 SVG transform 顺畅匀速旋转黑胶唱盘，文艺质感十足',
    tag: '文艺高级',
    iconName: 'Disc',
    defaultConfig: {
      songTitle: 'Episode 42: 数字游民与自动化自媒体实录',
      artistName: '创作者播客频道 · 特邀访谈',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
      duration: '46:18',
    },
    renderHtml: (cfg) => {
      return `<section style="margin: 26px 0; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 14px; padding: 18px 20px; color: #ffffff; box-shadow: 0 8px 20px rgba(15,23,42,0.25); display: flex; align-items: center; justify-content: space-between; overflow: hidden;">
  <div style="display: flex; align-items: center; gap: 16px;">
    <!-- SVG 匀速旋转黑胶唱盘 -->
    <div style="width: 64px; height: 64px; flex-shrink: 0; position: relative;">
      <svg width="64" height="64" viewBox="0 0 100 100" style="display: block; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
          <!-- 胶木底盘纹理 -->
          <circle cx="50" cy="50" r="49" fill="#18181b" stroke="#27272a" stroke-width="2"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" stroke-width="1" stroke-dasharray="2,3"/>
          <circle cx="50" cy="50" r="32" fill="none" stroke="#3f3f46" stroke-width="0.8"/>
          <circle cx="50" cy="50" r="24" fill="none" stroke="#27272a" stroke-width="1"/>
          <!-- 中心贴纸 -->
          <circle cx="50" cy="50" r="18" fill="#e11d48"/>
          <circle cx="50" cy="50" r="5" fill="#ffffff"/>
        </g>
      </svg>
    </div>

    <!-- 歌曲信息与声波条 -->
    <div>
      <div style="font-size: 14.5px; font-weight: bold; color: #f8fafc; letter-spacing: 0.3px;">${cfg.songTitle}</div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${cfg.artistName}</div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
        <span style="font-size: 10px; color: #e2e8f0; background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px;">时长 ${cfg.duration}</span>
        <span style="font-size: 10px; color: #fb7185;">▶ 正在持续旋转播放中</span>
      </div>
    </div>
  </div>
</section>`;
    },
  },

  // 4. 全景弹幕滚动墙 (Danmaku Marquee Wall)
  {
    id: 'svg-danmaku-wall',
    name: '全景读者好评弹幕滚动墙',
    category: 'danmaku',
    categoryName: '弹幕滚动',
    description: 'SVG 横向无限循环平移动态，模拟高能弹幕飘过，展现高人气与读者热评',
    tag: '高互动度',
    iconName: 'MessageSquare',
    defaultConfig: {
      headline: '🔥 往期读者真实反馈与社群打卡弹幕',
      track1: '“照着这份攻略推了一篇，阅读直接破万了！” · “终于告别繁琐手动配图！” · “太干货了，已转发到团队群”',
      track2: '“九套排版主题简直救命，极客蓝吹爆” · “已入正版，自动化效率提升十倍！” · “吹爆这个长图导出”',
    },
    renderHtml: (cfg) => {
      return `<section style="margin: 26px 0; background: #0f172a; border-radius: 12px; padding: 14px 16px; overflow: hidden; border: 1px solid #1e293b;">
  <div style="font-size: 12px; font-weight: bold; color: #fbbf24; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
    <span>⚡</span>
    <span>${cfg.headline}</span>
  </div>
  <!-- Track 1 -->
  <div style="overflow: hidden; white-space: nowrap; margin-bottom: 6px;">
    <svg width="100%" height="24" style="display: block;">
      <text y="17" fill="#e2e8f0" font-size="12" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
        <animate attributeName="x" from="100%" to="-120%" dur="14s" repeatCount="indefinite" />
        ${cfg.track1}
      </text>
    </svg>
  </div>
  <!-- Track 2 (Reverse/Offset Speed) -->
  <div style="overflow: hidden; white-space: nowrap;">
    <svg width="100%" height="24" style="display: block;">
      <text y="17" fill="#38bdf8" font-size="12" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
        <animate attributeName="x" from="100%" to="-120%" dur="18s" begin="2s" repeatCount="indefinite" />
        ${cfg.track2}
      </text>
    </svg>
  </div>
</section>`;
    },
  },

  // 5. 正反面双栏对比评测卡 (Before vs After Split)
  {
    id: 'svg-before-after',
    name: '红绿焦点：优化前 vs 优化后对比',
    category: 'flip',
    categoryName: '对比呈现',
    description: '两栏鲜明色块对比，左侧避坑反面、右侧标准破局，说服力拉满',
    tag: '强说服力',
    iconName: 'Columns',
    defaultConfig: {
      leftTitle: '❌ 传统低效做法 (Before)',
      leftList: '• 手动上传图片并频繁报错防盗链\n• 排版样式在手机端文字错乱\n• 耗时 2 小时排版仍平平无奇',
      rightTitle: '✅ 自动化工业级闭环 (After)',
      rightList: '• 本地 Markdown 一键编译内联 CSS\n• 图片自动 WebP 转码并入库缓存\n• 3 秒推送至草稿箱，格式 1:1 还原',
    },
    renderHtml: (cfg) => {
      const leftItems = cfg.leftList.split('\n').filter(Boolean).map((t: string) => `<div style="margin: 4px 0;">${t}</div>`).join('');
      const rightItems = cfg.rightList.split('\n').filter(Boolean).map((t: string) => `<div style="margin: 4px 0;">${t}</div>`).join('');
      return `<section style="margin: 24px 0; display: flex; flex-direction: column; gap: 10px;">
  <!-- Left / Before Card -->
  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px;">
    <div style="font-size: 13.5px; font-weight: bold; color: #991b1b; margin-bottom: 6px;">${cfg.leftTitle}</div>
    <div style="font-size: 12.5px; color: #7f1d1d; line-height: 1.6;">${leftItems}</div>
  </div>
  <!-- Right / After Card -->
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e; border-radius: 8px; padding: 14px 16px;">
    <div style="font-size: 13.5px; font-weight: bold; color: #166534; margin-bottom: 6px;">${cfg.rightTitle}</div>
    <div style="font-size: 12.5px; color: #14532d; line-height: 1.6;">${rightItems}</div>
  </div>
</section>`;
    },
  },

  // 6. 互动投票模拟表决卡 (Interactive Poll Card)
  {
    id: 'svg-interactive-poll',
    name: '文末互动表决卡与观点投票',
    category: 'poll',
    categoryName: '互动投票',
    description: '呈现结构化投票条形比率，引导读者在留言区发表阵营观点',
    tag: '引爆留言',
    iconName: 'CheckSquare',
    defaultConfig: {
      question: '今日互动议题：你在日常写作中，最头疼的是哪一步？',
      opt1Text: 'A. 选题枯竭，不知道写什么好',
      opt1Pct: '42%',
      opt2Text: 'B. 排版与找配图耗费太多精力',
      opt2Pct: '39%',
      opt3Text: 'C. 标题打磨不够吸引人，打开率低',
      opt3Pct: '19%',
      footerHint: '欢迎在文末留言区留下你的投票选项与实操心得！',
    },
    renderHtml: (cfg) => {
      return `<section style="margin: 26px 0; border: 1.5px solid #07c160; border-radius: 12px; padding: 18px 20px; background: #fafdfa;">
  <div style="font-size: 14.5px; font-weight: bold; color: #0f172a; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px;">
    <span style="background: #07c160; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; margin-top: 2px;">投票互动</span>
    <span>${cfg.question}</span>
  </div>
  
  <!-- Option 1 -->
  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 500; color: #334155; margin-bottom: 4px;">
      <span>${cfg.opt1Text}</span>
      <span style="color: #07c160; font-weight: bold;">${cfg.opt1Pct}</span>
    </div>
    <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
      <div style="width: ${cfg.opt1Pct}; height: 100%; background: #07c160; border-radius: 4px;"></div>
    </div>
  </div>

  <!-- Option 2 -->
  <div style="margin-bottom: 10px;">
    <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 500; color: #334155; margin-bottom: 4px;">
      <span>${cfg.opt2Text}</span>
      <span style="color: #0284c7; font-weight: bold;">${cfg.opt2Pct}</span>
    </div>
    <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
      <div style="width: ${cfg.opt2Pct}; height: 100%; background: #0284c7; border-radius: 4px;"></div>
    </div>
  </div>

  <!-- Option 3 -->
  <div style="margin-bottom: 12px;">
    <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 500; color: #334155; margin-bottom: 4px;">
      <span>${cfg.opt3Text}</span>
      <span style="color: #ea580c; font-weight: bold;">${cfg.opt3Pct}</span>
    </div>
    <div style="width: 100%; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
      <div style="width: ${cfg.opt3Pct}; height: 100%; background: #ea580c; border-radius: 4px;"></div>
    </div>
  </div>

  <div style="font-size: 11.5px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
    ${cfg.footerHint}
  </div>
</section>`;
    },
  },

  // 7. 脉冲微光呼吸徽章 (Pulsing Glow Highlight Badge)
  {
    id: 'svg-pulsing-badge',
    name: '动态呼吸闪烁金句徽章',
    category: 'badge',
    categoryName: '动态徽章',
    description: 'SVG 渐进变色微光呼吸边框，将全篇最关键的一句话点石成金',
    tag: '视觉焦点',
    iconName: 'Sparkles',
    defaultConfig: {
      badgeText: '核心破局金句',
      quote: '“真正拉开人与人差距的，从不是投入的绝对时间，而是是否拥有一套可以不知疲倦自主运转的生产力系统。”',
      author: '—— 引自本期专栏总结',
    },
    renderHtml: (cfg) => {
      return `<section style="margin: 26px 0; position: relative; border-radius: 12px; background: linear-gradient(135deg, #fefce8, #fffbeb); border: 1.5px solid #facc15; padding: 20px 22px; box-shadow: 0 4px 16px rgba(250,204,21,0.18);">
  <div style="position: absolute; top: -11px; left: 20px; background: linear-gradient(90deg, #eab308, #ca8a04); color: #ffffff; font-size: 11px; font-weight: bold; padding: 2px 10px; border-radius: 10px; box-shadow: 0 2px 6px rgba(202,138,4,0.3); display: flex; align-items: center; gap: 4px;">
    <span>✦</span>
    <span>${cfg.badgeText}</span>
  </div>
  <p style="font-size: 14.5px; font-weight: 600; color: #713f12; line-height: 1.8; margin: 6px 0 10px; font-style: italic;">
    ${cfg.quote}
  </p>
  <div style="font-size: 12px; color: #a16207; text-align: right; font-weight: 500;">
    ${cfg.author}
  </div>
</section>`;
    },
  },
];
