import React, { useState } from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  Keyboard,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Key,
  Layers,
  Zap,
  ExternalLink,
  Code,
  RotateCcw,
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWelcomeGuide: () => void;
  onOpenSettings: () => void;
  onLoadSample: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenWelcomeGuide,
  onOpenSettings,
  onLoadSample,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'frontmatter' | 'styling' | 'limits' | 'shortcuts'>('quickstart');
  const [copiedFm, setCopiedFm] = useState<boolean>(false);

  if (!isOpen) return null;

  const sampleFrontMatter = `---
title: 微信公众号草稿自动化发布实战指南
author: 科技探索者
digest: 探索如何通过 Markdown 快速排版并自动内联样式推送到微信公众号草稿箱。
cover: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80
theme: tech-blue
code_theme: github
comment: true
type: news
---`;

  const handleCopyFm = async () => {
    try {
      await navigator.clipboard.writeText(sampleFrontMatter);
      setCopiedFm(true);
      setTimeout(() => setCopiedFm(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>使用说明与技巧指南</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  按 ⌘/ 或 F1 快速调出
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                掌握 Front Matter 规范、9 大内联排版主题、避坑清单与高频快捷键
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="关闭说明"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900 px-4 overflow-x-auto text-xs font-medium scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'quickstart'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3分钟极速上手</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frontmatter')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'frontmatter'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Front Matter 元数据速查</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('styling')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'styling'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>排版内联与特色</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'limits'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>微信限制与避坑清单</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>快捷键指南</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-neutral-200 flex-1 min-h-[350px]">
          {/* TAB 1: Quickstart */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-100">
                  从撰写到发布的标准流转步骤
                </h3>
                <p className="text-xs text-neutral-400">
                  支持「API 直推官方草稿箱」与「免凭据一键复制排版」双轨工作流。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300">
                    Step 1
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-100">撰写 Markdown</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    在左栏书写文章，支持标准语法、插入图片、代码块、引用等。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300">
                    Step 2
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-100">挑选主题与模式</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    在顶栏切换 9 套主题或切换为小绿书九宫格模式，右栏真机实时渲染。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300">
                    Step 3
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-100">试运行排版校验</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    按 <kbd className="font-mono text-emerald-400">⌘+↵</kbd> 启动本地 Dry-Run 校验，零风险检查字数与规范。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                    Step 4
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-100">发布或复制</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    直推官方草稿箱；或点击「复制微信排版」，在公众号后台直接粘贴。
                  </p>
                </div>
              </div>

              {/* Workflow comparison */}
              <div className="p-4 bg-neutral-800/40 border border-neutral-700/60 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-neutral-200">两种工作模式任选：</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-1">
                    <span className="font-semibold text-emerald-400">模式 A：免配置凭据（极简模式）</span>
                    <p className="text-[11px] text-neutral-400">
                      无需输入 AppID 与 Secret。直接编写排版，点击「复制微信排版」或按 <kbd className="font-mono text-neutral-300">⌘+⇧+C</kbd>，直接到微信公众号后台富文本粘贴即可，格式完全保留。
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800 space-y-1">
                    <span className="font-semibold text-blue-400">模式 B：配置微信凭据（自动化直推）</span>
                    <p className="text-[11px] text-neutral-400">
                      录入 AppID 与 AppSecret 并加好 IP 白名单。点击「推送草稿箱」，自动转码图片并上传永久素材库，一键进公众号草稿箱，适合多号管理与团队协作。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Front Matter */}
          {activeTab === 'frontmatter' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">
                    Front Matter 元数据配置规范
                  </h3>
                  <p className="text-xs text-neutral-400">
                    位于 Markdown 顶部的 YAML 区块（以 <code>---</code> 包裹），用于自动化填充微信元数据。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFm}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center space-x-1 transition"
                >
                  {copiedFm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFm ? '已复制模版' : '复制模版'}</span>
                </button>
              </div>

              {/* Code block */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 font-mono text-xs text-emerald-300 relative overflow-x-auto">
                <pre>{sampleFrontMatter}</pre>
              </div>

              {/* Table */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-800/80 text-neutral-300 border-b border-neutral-800 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2">字段</th>
                      <th className="px-3.5 py-2">类型</th>
                      <th className="px-3.5 py-2">说明与默认行为</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">title</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2">文章标题。未填写时自动提取正文首个 <code># 一级标题</code>（≤64 字符）。</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">author</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2">作者署名（≤16 字符）。</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">digest</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2">微信图文摘要（硬性限制 ≤120 字符，超长系统自动安全截断并加省略号）。</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">cover</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2">封面图路径，支持本地图片（如 <code>./images/cover.png</code>）或网络 URL。</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">theme</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2">排版主题，如 <code>tech-blue</code>, <code>pie</code>, <code>orangeheart</code> 等。</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-mono text-emerald-400">type</td>
                      <td className="px-3.5 py-2 text-neutral-400">string</td>
                      <td className="px-3.5 py-2"><code>news</code> (默认长文) 或 <code>newspic</code> (小绿书贴图模式)。</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Styling & Tech */}
          {activeTab === 'styling' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-100">
                  排版特色与 Juice 深度内联技术原理
                </h3>
                <p className="text-xs text-neutral-400">
                  彻底解决微信公众平台过滤外链 CSS 与 <code>&lt;style&gt;</code> 标签的问题。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                    <Code className="w-4 h-4" />
                    <span>为什么其他排版工具容易样式错乱？</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    微信公众号后台安全机制极其严苛，在文章保存时会自动剥离所有 <code>&lt;style&gt;</code> 样式标签和类名选择器。本工具利用 Juice 引擎，在渲染阶段将所有 CSS 规则 100% 内联转换写入每个 HTML 节点的 <code>style="..."</code> 属性中，确保样式在任何客户端设备上均永不丢失。
                  </p>
                </div>

                <div className="p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>macOS 拟物三色窗控代码块</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    内置 macOS 风格红黄绿三点控件与深色代码胶囊容器，搭配 Highlight.js 语法分析器，支持 TypeScript、Go、Python、JSON 等主流语言着色，在手机端保持优雅横向滚动与等宽字体。
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-800/40 border border-neutral-700/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-neutral-200">小绿书（贴图/多图卡片模式）技巧：</h4>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
                  <li>建议图片宽高比保持在 <strong>3:4</strong> 或 <strong>1:1</strong>，在微信移动端瀑布流中拥有最佳视觉展示效果；</li>
                  <li>小绿书正文采用极简卡片摘要排版，适合短资讯、读书笔记与摄影作品分享。</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Limits & Troubleshooting */}
          {activeTab === 'limits' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-100">
                  微信接口硬性限制与常见报错自查
                </h3>
                <p className="text-xs text-neutral-400">
                  本工具内置了 Pre-flight 前置拦截机制，绝大多数问题在点击前即可被自动拦截并修复。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-1">
                  <span className="font-semibold text-rose-400">1. 标题与摘要字符限制</span>
                  <p className="text-[11px] text-neutral-400">
                    标题必须 ≤ 64 字符；作者 ≤ 16 字符；摘要硬性限制 ≤ 120 字符（超长时系统会自动安全截断）。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-1">
                  <span className="font-semibold text-amber-400">2. 单篇正文体积上限</span>
                  <p className="text-[11px] text-neutral-400">
                    单篇正文 HTML 字符数必须 ≤ 20,000 且总体积 ≤ 1MB。工具顶栏带有实时字符与体积计数器。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-1">
                  <span className="font-semibold text-emerald-400">3. WebP 格式图片自适应转码</span>
                  <p className="text-[11px] text-neutral-400">
                    微信素材库严禁直接上传 <code>.webp</code> 格式（会报错 40007）。工具底层使用 Sharp 自动将其无损转码为 <code>.png</code>。
                  </p>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl space-y-1">
                  <span className="font-semibold text-blue-400">4. 微信外部超链接限制</span>
                  <p className="text-[11px] text-neutral-400">
                    除微信公众号文章自身的链接外，普通外链在微信文章内无法直接点击跳转，建议以脚注形式展示。
                  </p>
                </div>
              </div>

              {/* Error code dictionary */}
              <div className="p-3.5 bg-neutral-800/40 border border-neutral-700/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-neutral-200">常见微信 API 错误代码与应对策略：</h4>
                <div className="space-y-1.5 text-[11px] text-neutral-300">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-rose-400 font-bold">40164</span>
                    <span><strong>invalid ip</strong>：当前机器的公网出口 IP 未加入微信后台的「IP 白名单」，前往公众号后台添加即可。</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-rose-400 font-bold">40001</span>
                    <span><strong>invalid credential</strong>：AppSecret 不正确或已被重置，请在凭据配置中重新录入并保存。</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-rose-400 font-bold">45009</span>
                    <span><strong>reach max api daily quota</strong>：微信公众号每日 API 额度超限，可使用本工具内置的「复制排版」模式直接粘贴。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-100">
                  全局与常用快捷键速查表
                </h3>
                <p className="text-xs text-neutral-400">
                  支持 Mac (Cmd) 与 Windows/Linux (Ctrl) 双键位适配，键盘盲操极速写作。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200">保存并导出 Markdown</span>
                    <p className="text-[11px] text-neutral-400">下载当前文档为本地 .md 文件</p>
                  </div>
                  <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded font-mono text-emerald-400 text-xs shadow-xs">
                    Ctrl/Cmd + S
                  </kbd>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200">触发一键试运行</span>
                    <p className="text-[11px] text-neutral-400">全流程解析与 Dry-Run 校验</p>
                  </div>
                  <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded font-mono text-emerald-400 text-xs shadow-xs">
                    Ctrl/Cmd + Enter
                  </kbd>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200">复制微信内联 HTML</span>
                    <p className="text-[11px] text-neutral-400">直接粘贴进微信公众号后台</p>
                  </div>
                  <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded font-mono text-emerald-400 text-xs shadow-xs">
                    Ctrl/Cmd + Shift + C
                  </kbd>
                </div>

                <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-200">打开使用说明与帮助</span>
                    <p className="text-[11px] text-neutral-400">随时调出本手册</p>
                  </div>
                  <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded font-mono text-emerald-400 text-xs shadow-xs">
                    Ctrl/Cmd + / 或 F1
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Quick Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWelcomeGuide();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>重新打开新手向导</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLoadSample();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>载入全语法示范文章</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center space-x-1"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>微信凭据配置</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              完成阅读
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
