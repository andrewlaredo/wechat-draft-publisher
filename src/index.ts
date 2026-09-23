import { Command } from 'commander';
import path from 'path';
import { loadConfig, validateConfig } from './config.ts';
import { runPublishPipeline } from './pipeline.ts';
import { logger } from './utils/logger.ts';

const program = new Command();

program
  .name('wechat-publish')
  .description('微信公众号草稿箱自动推送与排版工具 (Markdown -> 微信内联 HTML -> 上传图片 -> 创建草稿)')
  .version('1.0.0')
  .argument('<markdown-file>', '待发布的 Markdown 文件路径')
  .option('-i, --images <dir>', '配图目录 (默认使用 Markdown 文件所在目录)')
  .option('-c, --config <file>', '配置文件路径 (默认 ./config.yaml)')
  .option('-e, --env <file>', '环境变量文件 (默认 ./.env)')
  .option('-t, --title <title>', '覆盖文章标题')
  .option('-a, --author <author>', '覆盖文章作者')
  .option('-d, --digest <digest>', '覆盖文章摘要 (最多120字)')
  .option('--cover <path>', '覆盖封面图片路径')
  .option('--thumb-media-id <id>', '指定已存在的封面永久素材 ID')
  .option('--preview', '预览模式：处理排版与配图上传至微信素材库，但跳过草稿箱创建 (若需完全不触碰微信 API 请叠加 --dry-run)', false)
  .option('--dry-run', '本地模拟运行：完全不调用微信服务器接口 (模拟图片上传与草稿创建)', false)
  .option('--force', '忽略幂等性哈希校验，强制重新推送', false)
  .option('--draft-id <id>', '更新已有的草稿 media_id (覆盖更新模式)')
  .option('--theme <name>', '排版主题 (pie / tech-blue / orangeheart / phycat / lapis / medium / sakura / warm-paper / default)')
  .option('--verbose', '输出详细调试日志', false)
  .action(async (markdownFile, options) => {
    if (options.verbose) {
      logger.setVerbose(true);
    }

    try {
      const resolvedMdPath = path.resolve(markdownFile);

      // Construct overrides only from explicitly provided CLI flags
      const publishOverrides: Record<string, any> = {};
      if (options.author) publishOverrides.author = options.author;

      const markdownOverrides: Record<string, any> = {};
      if (options.theme) markdownOverrides.theme = options.theme;

      // Load config
      const config = loadConfig({
        configFile: options.config,
        envFile: options.env,
        overrides: {
          publish: Object.keys(publishOverrides).length > 0 ? publishOverrides as any : undefined,
          markdown: Object.keys(markdownOverrides).length > 0 ? markdownOverrides as any : undefined,
        },
      });

      // Validate config unless in dry-run
      validateConfig(config, { dryRun: options.dryRun });

      // Run pipeline
      const result = await runPublishPipeline({
        filePath: resolvedMdPath,
        config,
        imagesDir: options.images,
        titleOverride: options.title,
        authorOverride: options.author,
        digestOverride: options.digest,
        coverOverride: options.cover,
        thumbMediaIdOverride: options.thumbMediaId,
        themeOverride: options.theme,
        previewMode: options.preview,
        dryRun: options.dryRun,
        force: options.force,
        draftId: options.draftId,
      });

      console.log('\n----------------------------------------');
      if (result.preview_only) {
        logger.success(`预览生成成功！(已处理 ${result.uploaded_images.length} 张配图)`);
      } else if (result.is_cached) {
        logger.info(`文章已存在于草稿箱中 (幂等跳过): media_id = ${result.media_id}`);
      } else {
        logger.success(`🎉 草稿发布成功！`);
        console.log(`\x1b[32m✅ media_id:\x1b[0m \x1b[1m${result.media_id}\x1b[0m`);
        console.log(`\x1b[34m📄 标题:\x1b[0m ${result.title}`);
        console.log(`\x1b[34m👤 作者:\x1b[0m ${result.author}`);
        console.log(`\x1b[34m🖼 封面素材ID:\x1b[0m ${result.thumb_media_id}`);
        console.log(`\x1b[90m🔑 指纹哈希:\x1b[0m ${result.hash}`);
        console.log('\n提示: 您可以登录微信公众平台后台 -> 草稿箱中查看并预览该图文。');
      }
      console.log('----------------------------------------\n');
    } catch (err: any) {
      logger.error(err.message, err);
      process.exit(1);
    }
  });

export function runCli(argv = process.argv) {
  program.parse(argv);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
