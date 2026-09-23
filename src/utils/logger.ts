import fs from 'fs';
import path from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'step';

class Logger {
  private verbose = false;
  private logFilePath: string | null = null;

  constructor() {
    try {
      const cacheDir = path.resolve(process.cwd(), '.cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      this.logFilePath = path.join(cacheDir, 'publish.log');
    } catch {
      // ignore in browser/restricted env
    }
  }

  setVerbose(verbose: boolean) {
    this.verbose = verbose;
  }

  private writeToFile(message: string) {
    if (!this.logFilePath) return;
    try {
      const timestamp = new Date().toISOString();
      fs.appendFileSync(this.logFilePath, `[${timestamp}] ${message}\n`);
    } catch {
      // Ignore file append errors
    }
  }

  step(stepIndex: number, totalSteps: number, message: string, status?: 'running' | 'done' | 'skip') {
    const statusText = status === 'done' ? '完成' : status === 'skip' ? '跳过' : '';
    const prefix = `[${stepIndex}/${totalSteps}]`;
    const fullMsg = statusText ? `${prefix} ${message}... ${statusText}` : `${prefix} ${message}...`;
    console.log(`\x1b[36m${prefix}\x1b[0m ${message}... ${statusText ? `\x1b[32m${statusText}\x1b[0m` : ''}`);
    this.writeToFile(fullMsg);
  }

  info(msg: string) {
    console.log(`\x1b[34mℹ\x1b[0m ${msg}`);
    this.writeToFile(`[INFO] ${msg}`);
  }

  success(msg: string) {
    console.log(`\x1b[32m✔\x1b[0m ${msg}`);
    this.writeToFile(`[SUCCESS] ${msg}`);
  }

  warn(msg: string) {
    console.warn(`\x1b[33m⚠ 警告:\x1b[0m ${msg}`);
    this.writeToFile(`[WARN] ${msg}`);
  }

  error(msg: string, err?: any) {
    console.error(`\x1b[31m✖ 错误:\x1b[0m ${msg}`);
    if (err) {
      if (err.stack) {
        console.error(`\x1b[90m${err.stack}\x1b[0m`);
      } else {
        console.error(err);
      }
    }
    const errDetails = err ? (err.stack || err.message || JSON.stringify(err)) : '';
    this.writeToFile(`[ERROR] ${msg} ${errDetails}`);
  }

  debug(msg: string, data?: any) {
    if (!this.verbose) return;
    console.log(`\x1b[90m[DEBUG] ${msg}\x1b[0m`, data || '');
    this.writeToFile(`[DEBUG] ${msg} ${data ? JSON.stringify(data) : ''}`);
  }
}

export const logger = new Logger();
