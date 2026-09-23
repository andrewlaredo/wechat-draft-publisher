import React, { useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Key,
  Play,
  ShieldAlert,
  Zap,
  BookOpen,
} from 'lucide-react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onDryRun: () => void;
  onLoadSample: () => void;
  hasCredentials: boolean;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onDryRun,
  onLoadSample,
  hasCredentials,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('wechat_publisher_welcomed_v1', 'true');
    } catch {
      // Ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>欢迎使用 WeChat Draft Publisher</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  新手向导 ({step}/{totalSteps})
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                专为公众号创作者打造的 Markdown 极速排版与草稿推送工作台
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            title="跳过并关闭向导"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-neutral-800 h-1">
          <div
            className="bg-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-neutral-200 flex-1 min-h-[340px]">
          {/* STEP 1: Core Workspace & Dual Mode */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  第一步 • 认识工作台
                </span>
                <h3 className="text-lg font-bold text-neutral-100">
                  左栏极简 Markdown，右栏 1:1 移动端真机还原
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  摆脱传统微信编辑器繁琐排版的困扰，专注于纯粹写作。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-neutral-800/70 border border-neutral-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">经典图文长文</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    支持 ATX 标题、表格、任务列表、公式与带 macOS 窗控三色圆点的代码块着色。
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-800/70 border border-neutral-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">图片消息（贴图模式）</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    一键切换为移动端九宫格卡片多图模式，适合高清摄影、好物分享与快资讯图文传播。
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-800/70 border border-neutral-700/70 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-950/80 text-blue-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100">9 套精美内联主题</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    内置经典科技蓝、晚秋暖橙、青葱雅致等，CSS 100% 深度内联，绝不被微信过滤。
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-800/40 border border-neutral-700/50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-neutral-300">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>想先看看完整渲染效果？可直接载入官方全语法示范样本。</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLoadSample();
                    setStep(2);
                  }}
                  className="px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-lg font-medium transition text-xs shrink-0 ml-2"
                >
                  载入示范文章
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: WeChat Credentials & IP Whitelist */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  第二步 • 微信凭据配置（可选）
                </span>
                <h3 className="text-lg font-bold text-neutral-100">
                  连接微信公众号官方草稿箱 API
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  若需一键将文章直推至公众号后台草稿箱，请录入您的开发者凭据。
                </p>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
                  hasCredentials
                    ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                }`}
              >
                {hasCredentials ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <p className="font-semibold">
                    {hasCredentials
                      ? '已检测到有效凭据：当前已具备草稿箱直接推送权限！'
                      : '当前尚未配置凭据：系统已启用【本地安全排版模式】'}
                  </p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {hasCredentials
                      ? '您可以直接在顶栏点击「推送草稿箱」，或使用「多图文草稿管理」合辑发布。'
                      : '暂时不配置凭据也完全不影响使用！您可以随时点击顶栏的【复制微信排版】，一键粘贴至公众号后台富文本编辑器中；也能使用【试运行】跑通全流程校验。'}
                  </p>
                </div>
              </div>

              {/* Guide tips */}
              <div className="space-y-2.5 text-xs text-neutral-300 bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/60">
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    登录<strong>微信公众平台</strong> (mp.weixin.qq.com) ➡️ 设置与开发 ➡️ 基本配置。
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    获取 <strong>开发者ID (AppID)</strong> 与 <strong>开发者密码 (AppSecret)</strong>。
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-neutral-700 text-neutral-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>特别注意</strong>：务必将当前主机的出口公网 IP 添加到公众号的 <strong>IP 白名单</strong> 中（否则微信会拦截并报 40164 错误）。
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-400">随时可点击顶栏齿轮图标修改配置</span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>打开凭据配置面板</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI Assistant & Multi-Article */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  第三步 • AI 智能撰文与多图文合辑
                </span>
                <h3 className="text-lg font-bold text-neutral-100">
                  释放创作灵感，一站式管理官方草稿箱
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  内置 Google Gemini 智能引擎，从灵感捕捉到终稿发布一路畅通。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-gradient-to-br from-purple-950/40 to-neutral-900 border border-purple-800/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-purple-300">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-bold text-neutral-100">AI 智能撰文 (Gemini)</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    点击顶栏「AI 智能撰文」，输入主题或大纲即可秒级生成符合微信排版规范的 Markdown 草稿。
                  </p>
                  <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
                    <li>支持选择「专业技术长文」或「小绿书快讯贴图」</li>
                    <li>提供参考资料/本地笔记 RAG 知识扩写</li>
                    <li>严格的人机共创机制：所有 AI 内容均进入编辑器供作者审核修改</li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-950/40 to-neutral-900 border border-blue-800/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-blue-300">
                    <Layers className="w-4 h-4" />
                    <h4 className="text-xs font-bold text-neutral-100">多图文合集与官方草稿管理</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    点击顶栏「草稿管理」，可直接同步拉取微信公众号后台的现有草稿列表。
                  </p>
                  <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
                    <li>支持把多篇独立 Markdown 聚合为多图文合辑一次性推送</li>
                    <li>草稿箱回显与二次编辑（自带 HTML 智能反解）</li>
                    <li>支持 FreePublish 正式群发与草稿快速删除</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl text-xs text-neutral-300 flex items-center justify-between">
                <span>💡 小贴士：按 <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-[11px] font-mono text-emerald-300">Ctrl/Cmd + S</kbd> 可随时将当前文档导出为本地 .md 文件。</span>
              </div>
            </div>
          )}

          {/* STEP 4: Zero-Friction Test Run */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  第四步 • 零门槛即刻体验
                </span>
                <h3 className="text-lg font-bold text-neutral-100">
                  无需凭据，立即体验全流程「一键试运行」
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  通过本地 Dry-Run 机制，在不消耗任何微信配额的情况下完整执行解析、排版与规范拦截。
                </p>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                  <Play className="w-4 h-4" />
                  <span>试运行（Dry-Run）为您检查的内容：</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Markdown AST 语法树解析</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Juice 全量 CSS 深度内联</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>微信标题/摘要长度限制校验</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>HTML 体积与图片格式检查</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-800/70 border border-neutral-700/80 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-neutral-200">立即启动试运行</h5>
                  <p className="text-[11px] text-neutral-400">点击下方按钮直接在弹窗中观察各步骤执行日志</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleFinish();
                    onDryRun();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition text-xs flex items-center space-x-1.5 shadow-sm shadow-emerald-700/50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>一键试运行 (Dry-Run)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-850 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>上一步</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition"
              >
                跳过向导
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 shadow-sm"
              >
                <span>下一步</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 shadow-sm shadow-emerald-800/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>进入工作台开始创作</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
