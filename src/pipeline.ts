import fs from 'fs';
import path from 'path';
import { parseMarkdownFile, ParsedArticle, extractNewspicText } from './markdown/parser.ts';
import { createMarkdownRenderer } from './markdown/renderer.ts';
import { inlineWechatStyles } from './markdown/style.ts';
import { findImageReferences, validateLocalImages, ImageRef } from './image/resolver.ts';
import {
  processAndUploadImages,
  resolveOrUploadCoverImage,
  uploadImagesForNewspic,
  ImageUploadPlan,
  NewspicImageItem,
} from './image/uploader.ts';
import { WeChatAuth } from './wechat/auth.ts';
import { createWeChatDraft, updateWeChatDraft, WeChatDraftArticle } from './wechat/draft.ts';
import { computeArticleHash, checkIsPublished, savePublishRecord } from './utils/hash.ts';
import { logger } from './utils/logger.ts';
import { AppConfig } from './config.ts';

export interface PublishOptions {
  filePath?: string;
  markdownContent?: string;
  config: AppConfig;
  imagesDir?: string;
  articleTypeOverride?: 'news' | 'newspic';
  titleOverride?: string;
  authorOverride?: string;
  digestOverride?: string;
  coverOverride?: string;
  thumbMediaIdOverride?: string;
  themeOverride?: string;
  codeThemeOverride?: string;
  themeEnabled?: boolean;
  previewMode?: boolean; // Only convert & upload images, don't create draft
  dryRun?: boolean; // Don't call WeChat API at all
  force?: boolean; // Ignore idempotency
  draftId?: string; // Update existing draft
  onStepProgress?: (step: number, total: number, msg: string, status: 'running' | 'done' | 'skip') => void;
}

export interface PublishResult {
  media_id?: string;
  title: string;
  author: string;
  digest: string;
  article_type?: 'news' | 'newspic';
  thumb_media_id: string;
  cover_url?: string;
  content_html: string;
  hash: string;
  is_cached?: boolean;
  uploaded_images: ImageUploadPlan[];
  newspic_images?: NewspicImageItem[];
  dry_run: boolean;
  preview_only: boolean;
  updated_existing_draft?: boolean;
}

export function validateArticlePreflight(params: {
  title: string;
  author?: string;
  digest?: string;
  contentHtml?: string;
  articleType: 'news' | 'newspic';
  coverPath?: string;
  presetThumbMediaId?: string;
  isDryRun?: boolean;
  isPreview?: boolean;
}): void {
  const errors: string[] = [];
  const trimmedTitle = (params.title || '').trim();
  if (!trimmedTitle) {
    errors.push('文章标题 (title) 不能为空');
  } else if (trimmedTitle.length > 64) {
    errors.push(`文章标题长度 (${trimmedTitle.length} 字) 超过微信限制的 64 字符`);
  }

  if (params.author && params.author.trim().length > 16) {
    errors.push(`作者署名长度 (${params.author.trim().length} 字) 超过微信限制的 16 字符`);
  }

  if (params.digest && params.digest.trim().length > 120) {
    errors.push(`文章摘要长度 (${params.digest.trim().length} 字) 超过微信建议的 120 字符`);
  }

  if (params.articleType === 'news') {
    const html = params.contentHtml || '';
    if (!html.trim()) {
      errors.push('正文 HTML 内容不能为空');
    } else if (html.length > 20000) {
      errors.push(`正文 HTML 字符数 (${html.length}) 超过微信 20,000 字符硬性上限`);
    }
    const htmlBytes = Buffer.byteLength(html, 'utf8');
    if (htmlBytes > 1024 * 1024) {
      errors.push(`正文 HTML 字节大小 (${(htmlBytes / 1024).toFixed(1)}KB) 超过微信 1MB 限制`);
    }

    if (!params.isDryRun && !params.isPreview && !params.presetThumbMediaId && (!params.coverPath || !params.coverPath.trim())) {
      errors.push('缺少文章封面图 (请在 Markdown front-matter 中指定 cover 或 thumb_media_id，或使用 --cover 参数)');
    }
  }

  if (errors.length > 0) {
    throw new Error(`[发布前置校验失败，发现 ${errors.length} 个问题]:\n  • ` + errors.join('\n  • '));
  }
}

export async function runPublishPipeline(options: PublishOptions): Promise<PublishResult> {
  const { config } = options;
  const isDryRun = !!options.dryRun;
  const isPreview = !!options.previewMode;
  const totalSteps = 4;

  const notifyStep = (step: number, msg: string, status: 'running' | 'done' | 'skip') => {
    logger.step(step, totalSteps, msg, status);
    if (options.onStepProgress) {
      options.onStepProgress(step, totalSteps, msg, status);
    }
  };

  // 1. Read Markdown content
  let rawContent = options.markdownContent || '';
  const baseDir = options.filePath ? path.dirname(path.resolve(options.filePath)) : process.cwd();

  if (!rawContent && options.filePath) {
    if (!fs.existsSync(options.filePath)) {
      throw new Error(`找不到指定的 Markdown 文件: ${options.filePath}`);
    }
    rawContent = fs.readFileSync(options.filePath, 'utf8');
  }

  // STEP 1: 解析 Markdown
  notifyStep(1, '解析 Markdown (Front Matter 与正文提取)', 'running');
  const parsed: ParsedArticle = parseMarkdownFile(
    rawContent,
    options.filePath,
    options.authorOverride || config.publish.author
  );

  const title = options.titleOverride || parsed.metadata.title;
  const author = options.authorOverride || parsed.metadata.author;
  let digest = options.digestOverride || parsed.metadata.digest;
  if (digest.length > config.publish.digest_length) {
    digest = digest.slice(0, config.publish.digest_length - 3) + '...';
  }
  const themeName = options.themeOverride || parsed.metadata.theme || config.markdown.theme;
  const codeTheme = options.codeThemeOverride || parsed.metadata.code_theme || config.markdown.code_theme;
  const coverPath = options.coverOverride || parsed.metadata.cover;
  const presetThumbId = options.thumbMediaIdOverride || parsed.metadata.thumb_media_id;
  const articleType: 'news' | 'newspic' = options.articleTypeOverride || parsed.metadata.article_type || 'news';

  notifyStep(1, `解析 Markdown (模式: ${articleType === 'newspic' ? '图片消息/贴图' : '图文长文'})`, 'done');

  // Prepare WeChat Auth if needed
  let accessToken: string | undefined;
  let auth: WeChatAuth | undefined;
  if (!isDryRun) {
    auth = new WeChatAuth(
      config.wechat.app_id,
      config.wechat.app_secret,
      config.wechat.proxy_url,
      config.wechat.token_cache
    );
    try {
      accessToken = await auth.getAccessToken();
    } catch (err: any) {
      logger.error(`获取微信 Access Token 失败: ${err.message}`, err);
      throw err;
    }
  }

  // =========================================================================
  // 📸 BRANCH A: 图片消息 / 贴图 (newspic)
  // =========================================================================
  if (articleType === 'newspic') {
    // STEP 2: 提取说明文案与话题标签
    const textCaption = extractNewspicText(parsed.content);
    notifyStep(2, `提纯图片消息说明文案与话题标签 (${textCaption.length} 字)`, 'running');
    notifyStep(2, `提纯图片消息说明文案与话题标签 (${textCaption.length} 字)`, 'done');

    // STEP 3: 收集并上传多图至永久素材库
    const newspicImagesToUpload: string[] = [];
    if (coverPath) newspicImagesToUpload.push(coverPath);
    if (Array.isArray(parsed.metadata.images)) {
      for (const img of parsed.metadata.images) {
        if (img && !newspicImagesToUpload.includes(img)) {
          newspicImagesToUpload.push(img);
        }
      }
    }

    if (newspicImagesToUpload.length === 0) {
      throw new Error('发布图片消息（贴图）必须包含至少 1 张图片，请在 Markdown 中插入图片或配置 cover/images 字段。');
    }

    notifyStep(3, `上传 ${newspicImagesToUpload.length} 张图片至微信永久素材库 (获得 image_media_id)`, 'running');
    const { imageList, thumb_media_id, coverUrl } = await uploadImagesForNewspic(
      newspicImagesToUpload,
      baseDir,
      options.imagesDir,
      {
        accessToken,
        proxyUrl: config.wechat.proxy_url,
        dryRun: isDryRun,
        concurrency: config.image.upload_concurrency,
        retryTimes: config.publish.retry_times,
        retryInterval: config.publish.retry_interval,
        convertWebp: config.image.convert_webp !== false,
      }
    );
    notifyStep(3, `完成上传 ${imageList.length} 张图片素材`, 'done');

    // Idempotency check for newspic
    const articleHash = computeArticleHash(title, textCaption + JSON.stringify(imageList), thumb_media_id);
    const cached = checkIsPublished(articleHash);

    if (cached.isPublished && !options.force && !options.draftId && !isPreview) {
      logger.info(`命中幂等记录：图片消息未发生变化，已于 ${cached.record?.published_at} 发布过草稿 (media_id: ${cached.record?.media_id})。`);
      return {
        media_id: cached.record?.media_id,
        title,
        author,
        digest: digest || textCaption.slice(0, 54),
        article_type: 'newspic',
        thumb_media_id,
        cover_url: coverUrl,
        content_html: textCaption,
        hash: articleHash,
        is_cached: true,
        uploaded_images: imageList.map((img) => ({
          originalSrc: img.originalSrc,
          absolutePath: img.originalSrc,
          wechatUrl: img.url,
          mediaId: img.image_media_id,
        })),
        newspic_images: imageList,
        dry_run: isDryRun,
        preview_only: isPreview,
      };
    }

    // STEP 4: 发布草稿箱 (article_type: 'newspic')
    if (isPreview) {
      notifyStep(4, '预览模式: 跳过草稿箱发布', 'skip');
      return {
        title,
        author,
        digest: digest || textCaption.slice(0, 54),
        article_type: 'newspic',
        thumb_media_id,
        cover_url: coverUrl,
        content_html: textCaption,
        hash: articleHash,
        uploaded_images: imageList.map((img) => ({
          originalSrc: img.originalSrc,
          absolutePath: img.originalSrc,
          wechatUrl: img.url,
          mediaId: img.image_media_id,
        })),
        newspic_images: imageList,
        dry_run: isDryRun,
        preview_only: true,
      };
    }

    notifyStep(4, options.draftId ? `更新图片消息草稿 (ID: ${options.draftId})` : '创建微信公众号图片消息草稿 (newspic)', 'running');

    const draftArticle: WeChatDraftArticle = {
      article_type: 'newspic',
      title,
      author,
      digest: digest || textCaption.slice(0, 54),
      content: textCaption,
      content_source_url: parsed.metadata.source_url || '',
      thumb_media_id,
      image_info: {
        image_list: imageList.map((img) => ({ image_media_id: img.image_media_id })),
      },
      need_open_comment: config.publish.enable_comment ? 1 : 0,
      only_fans_can_comment: 0,
    };

    let finalMediaId = options.draftId || '';
    if (isDryRun) {
      finalMediaId = options.draftId || `mock_newspic_draft_${articleHash.slice(0, 16)}`;
      logger.success(`[Dry-Run 模式模拟成功] 图片消息草稿 media_id: ${finalMediaId}`);
    } else {
      if (!accessToken) {
        throw new Error('未获取到有效的微信 access_token，无法调用草稿箱接口');
      }
      try {
        if (options.draftId) {
          await updateWeChatDraft(accessToken, options.draftId, 0, draftArticle, config.wechat.proxy_url);
          logger.success(`图片消息草稿更新成功！media_id: ${options.draftId}`);
        } else {
          const resp = await createWeChatDraft(accessToken, draftArticle, config.wechat.proxy_url);
          finalMediaId = resp.media_id;
          logger.success(`图片消息草稿创建成功！media_id: ${finalMediaId}`);
        }
      } catch (err: any) {
        if (err.message?.includes('40001') && auth) {
          logger.warn('检测到微信 40001 access_token 过期，正在自动清理缓存并重新获取...');
          auth.clearCache();
          accessToken = await auth.getAccessToken(true);
          if (options.draftId) {
            await updateWeChatDraft(accessToken, options.draftId, 0, draftArticle, config.wechat.proxy_url);
            logger.success(`重试成功：图片消息草稿更新成功！media_id: ${options.draftId}`);
          } else {
            const resp = await createWeChatDraft(accessToken, draftArticle, config.wechat.proxy_url);
            finalMediaId = resp.media_id;
            logger.success(`重试成功：图片消息草稿创建成功！media_id: ${finalMediaId}`);
          }
        } else {
          throw err;
        }
      }
    }

    notifyStep(4, options.draftId ? '更新图片消息草稿' : '创建微信公众号图片消息草稿', 'done');

    savePublishRecord({
      hash: articleHash,
      media_id: finalMediaId,
      title,
      author,
      theme: 'newspic',
      article_type: 'newspic',
      images_count: imageList.length,
      published_at: new Date().toISOString(),
    });

    return {
      media_id: finalMediaId,
      title,
      author,
      digest: digest || textCaption.slice(0, 54),
      article_type: 'newspic',
      thumb_media_id,
      cover_url: coverUrl,
      content_html: textCaption,
      hash: articleHash,
      uploaded_images: imageList.map((img) => ({
        originalSrc: img.originalSrc,
        absolutePath: img.originalSrc,
        wechatUrl: img.url,
        mediaId: img.image_media_id,
      })),
      newspic_images: imageList,
      dry_run: isDryRun,
      preview_only: false,
      updated_existing_draft: !!options.draftId,
    };
  }

  // =========================================================================
  // 📝 BRANCH B: 经典图文消息 (news)
  // =========================================================================
  const themeEnabled = options.themeEnabled !== undefined ? options.themeEnabled : (config.markdown.theme_enabled !== false);
  const themeLabel = themeEnabled ? `主题: ${themeName}` : '原生极简排版 (主题关闭)';

  // STEP 2: 转换 HTML 与内联样式
  notifyStep(2, `转换 HTML 与内联排版样式 (${themeLabel})`, 'running');
  const renderer = createMarkdownRenderer({
    macStyle: config.markdown.mac_style,
    codeTheme,
  });

  const rawHtml = renderer.render(parsed.content);
  const shouldInline = config.markdown.inline_style !== false;
  const inlinedHtml = shouldInline ? inlineWechatStyles(rawHtml, themeName, themeEnabled) : rawHtml;
  notifyStep(2, '转换 HTML 与内联排版样式', 'done');

  // Preflight validation before image processing or network calls
  validateArticlePreflight({
    title,
    author,
    digest,
    contentHtml: inlinedHtml,
    articleType: 'news',
    coverPath,
    presetThumbMediaId: presetThumbId,
    isDryRun,
    isPreview,
  });

  // STEP 3: 本地图片解析与上传
  const imageRefs: ImageRef[] = findImageReferences(inlinedHtml, baseDir, options.imagesDir);
  const localImagesCount = imageRefs.filter(img => !img.isRemote && img.exists).length;

  notifyStep(3, `处理并上传配图 (${localImagesCount} 张本地图片)`, 'running');
  validateLocalImages(imageRefs);

  const { updatedHtml, uploadedList } = await processAndUploadImages(inlinedHtml, imageRefs, {
    accessToken,
    proxyUrl: config.wechat.proxy_url,
    concurrency: config.image.upload_concurrency,
    dryRun: isDryRun,
    retryTimes: config.publish.retry_times,
    retryInterval: config.publish.retry_interval,
    convertWebp: config.image.convert_webp !== false,
  });

  // Upload or resolve cover image
  const { thumb_media_id, coverUrl } = await resolveOrUploadCoverImage(coverPath, baseDir, options.imagesDir, {
    accessToken,
    proxyUrl: config.wechat.proxy_url,
    dryRun: isDryRun,
    presetThumbMediaId: presetThumbId,
    retryTimes: config.publish.retry_times,
    retryInterval: config.publish.retry_interval,
    convertWebp: config.image.convert_webp !== false,
  });

  notifyStep(3, `处理并上传配图 (${uploadedList.length} 张)`, 'done');

  // Idempotency check
  const articleHash = computeArticleHash(title, updatedHtml, thumb_media_id);
  const cached = checkIsPublished(articleHash);

  if (cached.isPublished && !options.force && !options.draftId && !isPreview) {
    logger.info(`命中幂等记录：文章内容未发生变化，已于 ${cached.record?.published_at} 发布过草稿 (media_id: ${cached.record?.media_id})。`);
    logger.info(`若需重新推送，请附加 --force 参数。`);
    return {
      media_id: cached.record?.media_id,
      title,
      author,
      digest,
      article_type: 'news',
      thumb_media_id,
      cover_url: coverUrl,
      content_html: updatedHtml,
      hash: articleHash,
      is_cached: true,
      uploaded_images: uploadedList,
      dry_run: isDryRun,
      preview_only: isPreview,
    };
  }

  // STEP 4: 创建或更新草稿
  if (isPreview) {
    notifyStep(4, '预览模式: 跳过草稿箱发布', 'skip');
    return {
      title,
      author,
      digest,
      article_type: 'news',
      thumb_media_id,
      cover_url: coverUrl,
      content_html: updatedHtml,
      hash: articleHash,
      uploaded_images: uploadedList,
      dry_run: isDryRun,
      preview_only: true,
    };
  }

  notifyStep(4, options.draftId ? `更新现有草稿 (ID: ${options.draftId})` : '创建微信公众号草稿', 'running');

  const draftArticle: WeChatDraftArticle = {
    article_type: 'news',
    title,
    author,
    digest,
    content: updatedHtml,
    content_source_url: parsed.metadata.source_url || '',
    thumb_media_id,
    need_open_comment: config.publish.enable_comment ? 1 : 0,
    only_fans_can_comment: 0,
  };

  let finalMediaId = options.draftId || '';

  if (isDryRun) {
    finalMediaId = options.draftId || `mock_draft_media_${articleHash.slice(0, 16)}`;
    logger.success(`[Dry-Run 模式模拟成功] 草稿 media_id: ${finalMediaId}`);
  } else {
    if (!accessToken) {
      throw new Error('未获取到有效的微信 access_token，无法调用草稿箱接口');
    }

    try {
      if (options.draftId) {
        await updateWeChatDraft(accessToken, options.draftId, 0, draftArticle, config.wechat.proxy_url);
        logger.success(`草稿更新成功！media_id: ${options.draftId}`);
      } else {
        const resp = await createWeChatDraft(accessToken, draftArticle, config.wechat.proxy_url);
        finalMediaId = resp.media_id;
        logger.success(`草稿创建成功！media_id: ${finalMediaId}`);
      }
    } catch (err: any) {
      if (err.message?.includes('40001') && auth) {
        logger.warn('检测到微信 40001 access_token 过期，正在自动清理缓存并重新获取...');
        auth.clearCache();
        accessToken = await auth.getAccessToken(true);
        if (options.draftId) {
          await updateWeChatDraft(accessToken, options.draftId, 0, draftArticle, config.wechat.proxy_url);
          logger.success(`重试成功：草稿更新成功！media_id: ${options.draftId}`);
        } else {
          const resp = await createWeChatDraft(accessToken, draftArticle, config.wechat.proxy_url);
          finalMediaId = resp.media_id;
          logger.success(`重试成功：草稿创建成功！media_id: ${finalMediaId}`);
        }
      } else {
        throw err;
      }
    }
  }

  notifyStep(4, options.draftId ? '更新现有草稿' : '创建微信公众号草稿', 'done');

  // Record idempotency
  savePublishRecord({
    hash: articleHash,
    media_id: finalMediaId,
    title,
    author,
    theme: themeName,
    article_type: 'news',
    published_at: new Date().toISOString(),
  });

  return {
    media_id: finalMediaId,
    title,
    author,
    digest,
    article_type: 'news',
    thumb_media_id,
    cover_url: coverUrl,
    content_html: updatedHtml,
    hash: articleHash,
    uploaded_images: uploadedList,
    dry_run: isDryRun,
    preview_only: false,
    updated_existing_draft: !!options.draftId,
  };
}

export interface MultiPublishItem {
  markdownContent?: string;
  filePath?: string;
  titleOverride?: string;
  authorOverride?: string;
  digestOverride?: string;
  coverOverride?: string;
  thumbMediaIdOverride?: string;
  themeOverride?: string;
}

export interface MultiPublishOptions {
  items: MultiPublishItem[];
  config: AppConfig;
  imagesDir?: string;
  dryRun?: boolean;
  onStepProgress?: (step: number, total: number, msg: string, status: 'running' | 'done' | 'skip') => void;
}

export interface MultiPublishResult {
  media_id: string;
  total_articles: number;
  articles: Array<{
    title: string;
    author: string;
    digest: string;
    thumb_media_id: string;
  }>;
  dry_run: boolean;
}

/**
 * Multi-article publishing pipeline: merges up to 8 markdown articles into a single WeChat draft
 */
export async function runMultiPublishPipeline(options: MultiPublishOptions): Promise<MultiPublishResult> {
  const { items, config, dryRun = false } = options;
  if (!items || items.length === 0) {
    throw new Error('多图文合集必须包含至少 1 篇文章');
  }
  if (items.length > 8) {
    throw new Error(`微信公众号单条草稿最多允许 8 篇多图文，当前提供了 ${items.length} 篇`);
  }

  let accessToken: string | undefined;
  let auth: WeChatAuth | undefined;
  if (!dryRun) {
    auth = new WeChatAuth(config.wechat.app_id, config.wechat.app_secret, config.wechat.proxy_url);
    accessToken = await auth.getAccessToken();
  }

  const draftArticles: WeChatDraftArticle[] = [];
  const articleSummaries: Array<{ title: string; author: string; digest: string; thumb_media_id: string }> = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    logger.info(`[多图文处理 ${idx + 1}/${items.length}] 开始解析与排版...`);

    let raw = item.markdownContent || '';
    const baseDir = item.filePath ? path.dirname(path.resolve(item.filePath)) : process.cwd();
    if (!raw && item.filePath) {
      if (fs.existsSync(item.filePath)) {
        raw = fs.readFileSync(item.filePath, 'utf-8');
      }
    }

    const parsed = parseMarkdownFile(raw, item.filePath, config.publish.author);
    const title = (item.titleOverride || parsed.metadata.title || `图文 ${idx + 1}`).trim().slice(0, 64);
    const author = (item.authorOverride || parsed.metadata.author || config.publish.author || '').trim();
    const digest = (item.digestOverride || parsed.metadata.digest || '').trim().slice(0, 120);
    const themeName = item.themeOverride || parsed.metadata.theme || config.markdown.theme || 'pie';

    // Render & inline HTML
    const isThemeEnabled = config.markdown.theme_enabled !== false;
    const renderer = createMarkdownRenderer({
      macStyle: config.markdown.mac_style,
      codeTheme: config.markdown.code_theme || 'github',
    });
    const rawHtml = renderer.render(parsed.content);
    const shouldInline = config.markdown.inline_style !== false;
    const inlinedHtml = shouldInline ? inlineWechatStyles(rawHtml, themeName, isThemeEnabled) : rawHtml;

    // Preflight validation before uploading images
    const coverPath = item.coverOverride || parsed.metadata.cover || '';
    const presetThumbId = item.thumbMediaIdOverride || parsed.metadata.thumb_media_id;
    validateArticlePreflight({
      title,
      author,
      digest,
      contentHtml: inlinedHtml,
      articleType: 'news',
      coverPath,
      presetThumbMediaId: presetThumbId,
      isDryRun: dryRun,
    });

    // Resolve & upload images
    const imageRefs = findImageReferences(inlinedHtml, baseDir, options.imagesDir);
    validateLocalImages(imageRefs);
    const { updatedHtml } = await processAndUploadImages(inlinedHtml, imageRefs, {
      accessToken,
      proxyUrl: config.wechat.proxy_url,
      dryRun,
      concurrency: config.image.upload_concurrency || 3,
      retryTimes: config.publish.retry_times,
      retryInterval: config.publish.retry_interval,
      convertWebp: config.image.convert_webp !== false,
    });

    // Resolve cover
    const { thumb_media_id } = await resolveOrUploadCoverImage(coverPath, baseDir, options.imagesDir, {
      accessToken,
      proxyUrl: config.wechat.proxy_url,
      dryRun,
      presetThumbMediaId: item.thumbMediaIdOverride || parsed.metadata.thumb_media_id,
      retryTimes: config.publish.retry_times,
      retryInterval: config.publish.retry_interval,
      convertWebp: config.image.convert_webp !== false,
    });

    draftArticles.push({
      article_type: 'news',
      title,
      author,
      digest,
      content: updatedHtml,
      content_source_url: parsed.metadata.source_url || '',
      thumb_media_id,
      need_open_comment: config.publish.enable_comment ? 1 : 0,
      only_fans_can_comment: 0,
    });

    articleSummaries.push({
      title,
      author,
      digest,
      thumb_media_id,
    });
  }

  let finalMediaId = '';
  if (dryRun) {
    finalMediaId = `mock_multi_draft_${Date.now()}`;
    logger.success(`[Dry-Run 模式模拟成功] 多图文草稿 media_id: ${finalMediaId} (共 ${draftArticles.length} 篇)`);
  } else {
    if (!accessToken) {
      throw new Error('未获取到微信 access_token，无法发布多图文草稿');
    }
    try {
      const resp = await createWeChatDraft(accessToken, draftArticles, config.wechat.proxy_url);
      finalMediaId = resp.media_id;
      logger.success(`多图文草稿创建成功！media_id: ${finalMediaId} (共 ${draftArticles.length} 篇)`);
    } catch (err: any) {
      if (err.message?.includes('40001') && auth) {
        logger.warn('检测到 40001 过期，正在重新获取 Token 重试多图文草稿...');
        auth.clearCache();
        accessToken = await auth.getAccessToken(true);
        const resp = await createWeChatDraft(accessToken, draftArticles, config.wechat.proxy_url);
        finalMediaId = resp.media_id;
        logger.success(`重试成功：多图文草稿创建成功！media_id: ${finalMediaId}`);
      } else {
        throw err;
      }
    }
  }

  return {
    media_id: finalMediaId,
    total_articles: draftArticles.length,
    articles: articleSummaries,
    dry_run: dryRun,
  };
}

