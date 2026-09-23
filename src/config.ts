import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import dotenv from 'dotenv';

export interface AppConfig {
  wechat: {
    app_id: string;
    app_secret: string;
    proxy_url?: string;
    token_cache?: string;
  };
  publish: {
    author: string;
    digest_length: number;
    enable_comment: boolean;
    retry_times: number;
    retry_interval: number;
  };
  markdown: {
    theme: string;
    code_theme: string;
    inline_style: boolean;
    mac_style?: boolean;
    theme_enabled?: boolean;
  };
  image: {
    upload_concurrency: number;
    convert_webp: boolean;
  };
}

export const DEFAULT_CONFIG: AppConfig = {
  wechat: {
    app_id: '',
    app_secret: '',
    proxy_url: '',
    token_cache: '.cache/access_token.json',
  },
  publish: {
    author: '公众号作者',
    digest_length: 120,
    enable_comment: true,
    retry_times: 3,
    retry_interval: 2000,
  },
  markdown: {
    theme: 'pie',
    code_theme: 'github',
    inline_style: true,
    mac_style: true,
    theme_enabled: true,
  },
  image: {
    upload_concurrency: 3,
    convert_webp: true,
  },
};

export function loadConfig(options: {
  configFile?: string;
  envFile?: string;
  overrides?: Partial<AppConfig>;
} = {}): AppConfig {
  // 1. Load env file
  const envPath = options.envFile
    ? path.resolve(options.envFile)
    : path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }

  // 2. Load YAML config
  let yamlConfig: any = {};
  const configPath = options.configFile
    ? path.resolve(options.configFile)
    : path.resolve(process.cwd(), 'config.yaml');

  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      yamlConfig = yaml.parse(fileContent) || {};
    } catch (e: any) {
      console.warn(`[Config] 无法解析配置文件 ${configPath}: ${e.message}`);
    }
  }

  // 2.5 Load cached runtime config if exists (.cache/runtime-config.json)
  let runtimeConfig: any = {};
  const runtimeConfigPath = path.resolve(process.cwd(), '.cache/runtime-config.json');
  if (fs.existsSync(runtimeConfigPath)) {
    try {
      runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8')) || {};
    } catch (e: any) {
      console.warn(`[Config] 无法解析运行缓存配置 ${runtimeConfigPath}: ${e.message}`);
    }
  }

  // 3. Merge: Default < YAML < Runtime Cache < Env Vars < Overrides
  const config: AppConfig = {
    wechat: {
      app_id:
        options.overrides?.wechat?.app_id ||
        process.env.WECHAT_APP_ID ||
        runtimeConfig.wechat?.app_id ||
        yamlConfig.wechat?.app_id ||
        DEFAULT_CONFIG.wechat.app_id,
      app_secret:
        options.overrides?.wechat?.app_secret ||
        process.env.WECHAT_APP_SECRET ||
        runtimeConfig.wechat?.app_secret ||
        yamlConfig.wechat?.app_secret ||
        DEFAULT_CONFIG.wechat.app_secret,
      proxy_url:
        options.overrides?.wechat?.proxy_url ||
        process.env.WECHAT_PROXY_URL ||
        runtimeConfig.wechat?.proxy_url ||
        yamlConfig.wechat?.proxy_url ||
        DEFAULT_CONFIG.wechat.proxy_url,
      token_cache:
        options.overrides?.wechat?.token_cache ||
        process.env.WECHAT_TOKEN_CACHE ||
        runtimeConfig.wechat?.token_cache ||
        yamlConfig.wechat?.token_cache ||
        DEFAULT_CONFIG.wechat.token_cache,
    },
    publish: {
      author:
        options.overrides?.publish?.author ||
        process.env.PUBLISH_AUTHOR ||
        runtimeConfig.publish?.author ||
        yamlConfig.publish?.author ||
        DEFAULT_CONFIG.publish.author,
      digest_length:
        options.overrides?.publish?.digest_length ||
        (process.env.PUBLISH_DIGEST_LENGTH ? parseInt(process.env.PUBLISH_DIGEST_LENGTH, 10) : undefined) ||
        runtimeConfig.publish?.digest_length ||
        yamlConfig.publish?.digest_length ||
        DEFAULT_CONFIG.publish.digest_length,
      enable_comment:
        options.overrides?.publish?.enable_comment ??
        runtimeConfig.publish?.enable_comment ??
        yamlConfig.publish?.enable_comment ??
        DEFAULT_CONFIG.publish.enable_comment,
      retry_times:
        options.overrides?.publish?.retry_times ||
        runtimeConfig.publish?.retry_times ||
        yamlConfig.publish?.retry_times ||
        DEFAULT_CONFIG.publish.retry_times,
      retry_interval:
        options.overrides?.publish?.retry_interval ||
        runtimeConfig.publish?.retry_interval ||
        yamlConfig.publish?.retry_interval ||
        DEFAULT_CONFIG.publish.retry_interval,
    },
    markdown: {
      theme:
        options.overrides?.markdown?.theme ||
        runtimeConfig.markdown?.theme ||
        yamlConfig.markdown?.theme ||
        DEFAULT_CONFIG.markdown.theme,
      code_theme:
        options.overrides?.markdown?.code_theme ||
        runtimeConfig.markdown?.code_theme ||
        yamlConfig.markdown?.code_theme ||
        DEFAULT_CONFIG.markdown.code_theme,
      inline_style:
        options.overrides?.markdown?.inline_style ??
        runtimeConfig.markdown?.inline_style ??
        yamlConfig.markdown?.inline_style ??
        DEFAULT_CONFIG.markdown.inline_style,
      mac_style:
        options.overrides?.markdown?.mac_style ??
        runtimeConfig.markdown?.mac_style ??
        yamlConfig.markdown?.mac_style ??
        DEFAULT_CONFIG.markdown.mac_style,
      theme_enabled:
        options.overrides?.markdown?.theme_enabled ??
        runtimeConfig.markdown?.theme_enabled ??
        yamlConfig.markdown?.theme_enabled ??
        DEFAULT_CONFIG.markdown.theme_enabled ??
        true,
    },
    image: {
      upload_concurrency:
        options.overrides?.image?.upload_concurrency ||
        runtimeConfig.image?.upload_concurrency ||
        yamlConfig.image?.upload_concurrency ||
        DEFAULT_CONFIG.image.upload_concurrency,
      convert_webp:
        options.overrides?.image?.convert_webp ??
        runtimeConfig.image?.convert_webp ??
        yamlConfig.image?.convert_webp ??
        DEFAULT_CONFIG.image.convert_webp,
    },
  };

  return config;
}

export function validateConfig(config: AppConfig, options: { dryRun?: boolean } = {}): void {
  if (options.dryRun) {
    return; // Dry-run does not strictly mandate live WeChat credentials
  }

  const missing: string[] = [];
  if (!config.wechat.app_id || config.wechat.app_id.trim() === '') {
    missing.push('wechat.app_id (可在 .env 设置 WECHAT_APP_ID 或在 config.yaml 设置)');
  }
  if (!config.wechat.app_secret || config.wechat.app_secret.trim() === '') {
    missing.push('wechat.app_secret (可在 .env 设置 WECHAT_APP_SECRET 或在 config.yaml 设置)');
  }

  if (missing.length > 0) {
    throw new Error(
      `[配置缺失] 微信公众号发布凭证未完整提供：\n  - ${missing.join(
        '\n  - '
      )}\n\n💡 提示：微信公众号后台 -> 设置与开发 -> 基本配置 中获取 AppID 与 AppSecret。\n如果你正在进行本地排版测试，可使用 --dry-run 参数跳过微信凭证校验。`
    );
  }
}
