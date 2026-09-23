/**
 * Wails v2 Desktop Bridge & Detection Helpers
 * Seamlessly integrates desktop native dialogs (File Pickers, Save Dialog, External Browser)
 * when running inside Wails desktop mode, while falling back cleanly in standard web mode.
 */

declare global {
  interface Window {
    go?: {
      main?: {
        App?: {
          SelectMarkdownFile?: () => Promise<{
            path: string;
            name: string;
            content: string;
            size: number;
          } | null>;
          SaveMarkdownFile?: (defaultName: string, content: string) => Promise<string>;
          SelectImageFile?: () => Promise<{
            path: string;
            name: string;
            dataUri?: string;
            size: number;
          } | null>;
          ReadLocalFile?: (filePath: string) => Promise<string>;
          WriteLocalFile?: (filePath: string, content: string) => Promise<void>;
          OpenInBrowser?: (url: string) => Promise<void>;
          ShowMessage?: (title: string, message: string) => Promise<void>;
          ShowError?: (title: string, message: string) => Promise<void>;
          GetDesktopInfo?: () => Promise<{
            isDesktop: boolean;
            platform: string;
            arch: string;
            version: string;
            wails: string;
          }>;
        };
      };
    };
    runtime?: any;
  }
}

/**
 * Returns true if the application is currently running inside the Wails desktop environment.
 */
export function isWails(): boolean {
  return typeof window !== 'undefined' && Boolean(window.go?.main?.App || window.runtime);
}

/**
 * Prompts user with native OS file picker to choose a local Markdown file.
 * Returns file info and content if in Wails, or null if cancelled or in web mode.
 */
export async function pickNativeMarkdown(): Promise<{
  path: string;
  name: string;
  content: string;
} | null> {
  if (!isWails() || !window.go?.main?.App?.SelectMarkdownFile) {
    return null;
  }
  try {
    const res = await window.go.main.App.SelectMarkdownFile();
    return res;
  } catch (err) {
    console.warn('[Wails] Native file picker error:', err);
    return null;
  }
}

/**
 * Prompts user with native OS save dialog to save Markdown file.
 * Returns saved path if in Wails, or null if cancelled or in web mode.
 */
export async function saveNativeMarkdown(defaultName: string, content: string): Promise<string | null> {
  if (!isWails() || !window.go?.main?.App?.SaveMarkdownFile) {
    return null;
  }
  try {
    const res = await window.go.main.App.SaveMarkdownFile(defaultName, content);
    return res;
  } catch (err) {
    console.warn('[Wails] Native save dialog error:', err);
    return null;
  }
}

/**
 * Opens a link in the system's default desktop web browser.
 */
export function openExternalUrl(url: string): void {
  if (isWails() && window.go?.main?.App?.OpenInBrowser) {
    window.go.main.App.OpenInBrowser(url);
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
