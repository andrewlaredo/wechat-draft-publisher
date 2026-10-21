import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '../utils/safeFetch.ts';

interface LiveArticleData {
  title: string;
  author: string;
  digest?: string;
  cover?: string;
  html: string;
  markdown?: string;
  theme?: string;
  updatedAt?: number;
}

export const MobileLiveReader: React.FC = () => {
  const [article, setArticle] = useState<LiveArticleData>(() => {
    // 1. Try instant localStorage recovery
    try {
      const saved = localStorage.getItem('wechat_live_mobile_article');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.title === 'string') {
          return parsed;
        }
      }
    } catch {
      // Ignored
    }
    return {
      title: '微信推文真机审稿',
      author: '创作者',
      digest: '',
      cover: '',
      html: '<section style="text-align: center; padding: 50px 20px; color: #888888;"><p style="font-size: 16px; margin-bottom: 12px;">📱 正在同步文章内容...</p><p style="font-size: 13px; color: #aaa;">请确保电脑端 FlowDraft 已打开。数据将通过局域网实时呈现。</p></section>',
      updatedAt: Date.now(),
    };
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('已连接实时审稿隧道');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Fetch initial content from server
  const fetchContent = async () => {
    setIsSyncing(true);
    try {
      const res = await safeFetchJson('/api/live-mobile/content');
      if (res.ok && res.data) {
        setArticle(res.data);
        setLastSyncTime(new Date().toLocaleTimeString());
        setSyncStatusText('内容已实时同步');
        try {
          localStorage.setItem('wechat_live_mobile_article', JSON.stringify(res.data));
        } catch {}
      }
    } catch (e) {
      console.warn('Fetch live mobile content error:', e);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncStatusText('已连接实时审稿隧道');
      }, 1500);
    }
  };

  useEffect(() => {
    fetchContent();

    // Listen for SSE events
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/live-mobile/stream');
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'update') {
            fetchContent();
          }
        } catch {}
      };
      evtSource.onerror = () => {
        setSyncStatusText('实时隧道重连中...');
      };
      evtSource.onopen = () => {
        setSyncStatusText('已连接实时审稿隧道');
      };
    } catch {
      // Fallback polling
    }

    // Polling fallback every 3 seconds
    const interval = setInterval(() => {
      fetchContent();
    }, 3000);

    return () => {
      if (evtSource) evtSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleReturnToEditor = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      url.hash = '';
      window.location.href = url.pathname;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 select-text ${
      isDarkMode ? 'bg-[#111111] text-[#dfdfdf]' : 'bg-[#ededed] text-[#333333]'
    }`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' }}>
      
      {/* Sticky Top Control Bar */}
      <div className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-md text-neutral-100 px-4 py-2 text-xs flex items-center justify-between border-b border-neutral-800 shadow-md">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></span>
          <span className="font-medium text-neutral-200">{syncStatusText}</span>
          {lastSyncTime && (
            <span className="text-[10px] text-neutral-400 hidden sm:inline font-mono">
              ({lastSyncTime})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition flex items-center gap-1"
          >
            {isDarkMode ? '☀️ 日间模式' : '🌓 暗黑模式'}
          </button>
          
          <button
            type="button"
            onClick={fetchContent}
            disabled={isSyncing}
            className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px] font-medium transition flex items-center gap-1"
          >
            🔄 刷新
          </button>

          <button
            type="button"
            onClick={handleReturnToEditor}
            className="px-2 py-1 rounded-md text-[11px] text-neutral-400 hover:text-neutral-200 transition"
            title="返回编辑工作台"
          >
            退出
          </button>
        </div>
      </div>

      {/* Main WeChat Article Container */}
      <main className="max-w-[680px] mx-auto min-h-[calc(100vh-42px)] p-5 sm:p-8 transition-colors shadow-xs" style={{
        backgroundColor: isDarkMode ? '#191919' : '#ffffff',
      }}>
        {/* Title */}
        <h1 className={`text-xl sm:text-2xl font-bold leading-snug tracking-tight mb-3.5 break-words ${
          isDarkMode ? 'text-[#efefef]' : 'text-[#222222]'
        }`}>
          {article.title || '未命名微信推文'}
        </h1>

        {/* Metadata */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-neutral-400 mb-6 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <span className="text-[#576b95] font-semibold">微信公众号</span>
          <span className={isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}>
            {article.author || '创作者'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'
          }`}>
            原创
          </span>
          <span>今天</span>
        </div>

        {/* Optional Cover Banner */}
        {article.cover && (
          <div className="rounded-xl overflow-hidden mb-6 border border-neutral-200/50 dark:border-neutral-800 shadow-xs">
            <img
              src={article.cover}
              alt="Cover"
              className="w-full max-h-72 object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Article Body */}
        <article
          id="article-content"
          className={`wechat-preview-body text-[16px] leading-[1.8] break-words ${
            isDarkMode ? 'text-[#dfdfdf]' : 'text-[#2b2b2b]'
          }`}
          dangerouslySetInnerHTML={{
            __html: article.html || '<p style="color:#888; text-align:center; padding: 40px 0;">暂无排版内容</p>',
          }}
        />

        {/* WeChat Standard Footer */}
        <div className={`mt-14 pt-6 border-t text-xs ${
          isDarkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-500'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#576b95] cursor-pointer font-medium hover:underline">
              阅读原文
            </span>
            <span>阅读 1.6万</span>
          </div>

          <div className="flex items-center justify-end space-x-5 pt-2 text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200">
              ❤️ 赞 520
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200">
              ✨ 在看 188
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200">
              💬 留言 36
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
