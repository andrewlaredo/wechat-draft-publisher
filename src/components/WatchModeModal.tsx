import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Radio,
  FolderSync,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  Sparkles,
  Info,
} from 'lucide-react';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface WatchModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncDraftToEditor?: (markdown: string) => void;
}

export const WatchModeModal: React.FC<WatchModeModalProps> = ({
  isOpen,
  onClose,
  onSyncDraftToEditor,
}) => {
  const [targetDir, setTargetDir] = useState<string>('./watch');
  const [autoPublish, setAutoPublish] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warn' }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await safeFetchJson('/api/watch/status');
      if (res.ok && res.data) {
        setIsWatching(res.data.isWatching);
        if (res.data.targetDir) setTargetDir(res.data.targetDir);
        if (typeof res.data.autoPublish === 'boolean') setAutoPublish(res.data.autoPublish);
        if (Array.isArray(res.data.logs)) setLogs(res.data.logs);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const timer = setInterval(fetchStatus, 2500);
      return () => clearInterval(timer);
    }
  }, [isOpen, fetchStatus]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson('/api/watch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir, autoPublish }),
      });
      if (res.ok && res.data?.watchState) {
        setIsWatching(true);
        setLogs(res.data.watchState.logs || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson('/api/watch/stop', {
        method: 'POST',
      });
      if (res.ok && res.data?.watchState) {
        setIsWatching(false);
        setLogs(res.data.watchState.logs || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-neutral-100">本地目录监听自动发布 (Watch Mode)</h2>
                {isWatching ? (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 监听运行中
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-medium">
                    已停止
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                监听 Obsidian / Notion / VS Code 导出的 Markdown 目录，文件保存时自动完成排版并同步微信草稿箱
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Target directory input */}
          <div className="bg-neutral-850 p-4 rounded-xl border border-neutral-800 space-y-3">
            <label className="text-xs font-semibold text-neutral-200 block">
              监听本地目录路径 (绝对路径或相对项目路径)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                disabled={isWatching}
                placeholder="./watch 或 /Users/username/ObsidianVault/Posts"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-60"
              />
              {isWatching ? (
                <button
                  onClick={handleStop}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5" />
                  停止监听
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  启动监听
                </button>
              )}
            </div>

            {/* Auto publish toggle */}
            <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chk-auto-publish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  disabled={isWatching}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-0 focus:outline-none bg-neutral-900 border-neutral-700"
                />
                <label htmlFor="chk-auto-publish" className="text-xs text-neutral-300 font-medium cursor-pointer">
                  检测到文件变动时，直接自动推送到微信公众号草稿箱 (API draft/add)
                </label>
              </div>
              <span className="text-[11px] text-neutral-500">
                {autoPublish ? '自动云端发布' : '仅同步至本地工作区'}
              </span>
            </div>
          </div>

          {/* Workflow guide */}
          <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed text-neutral-300">
              <strong className="text-sky-300 block">Obsidian / Typora / VS Code 协同工作流：</strong>
              <p>1. 在外部编辑器中将导出或文章目录设置为上述监听路径；</p>
              <p>2. 支持在 Markdown 头部包含标准 Front-Matter (<code>title</code>, <code>digest</code>, <code>cover</code>)；</p>
              <p>3. 每次按 <code>⌘S</code> 保存时，系统将在 800ms 内完成防抖、内联排版与微信草稿箱发布！</p>
            </div>
          </div>

          {/* Live log monitor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                实时监听与处理日志
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {logs.length} 条记录
              </span>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl h-48 overflow-y-auto font-mono text-xs space-y-1.5">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                  暂无日志记录，点击「启动监听」开启文件变动监控
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2 text-[11px] leading-relaxed">
                    <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400 font-medium'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : 'text-neutral-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
