import axios from 'axios';
import { logger } from '../utils/logger.ts';

export interface WeChatDraftArticle {
  title: string;
  author?: string;
  digest?: string;
  article_type?: 'news' | 'newspic';
  content: string; // inline-styled HTML for news, or clean text for newspic
  content_source_url?: string;
  thumb_media_id: string; // Required cover media_id
  image_info?: {
    image_list: Array<{ image_media_id: string }>;
  };
  need_open_comment?: number; // 1: open, 0: close
  only_fans_can_comment?: number; // 1: only fans, 0: all
}

export interface CreateDraftResponse {
  media_id: string;
}

export interface DraftListItem {
  media_id: string;
  update_time: number;
  content: {
    news_item: Array<{
      title: string;
      author: string;
      digest: string;
      content: string;
      thumb_media_id: string;
      thumb_url: string;
      url: string;
      content_source_url: string;
      update_time: number;
    }>;
  };
}

export async function createWeChatDraft(
  accessToken: string,
  article: WeChatDraftArticle | WeChatDraftArticle[],
  proxyUrl?: string
): Promise<CreateDraftResponse> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`;

  const articlesArray = Array.isArray(article) ? article : [article];
  if (articlesArray.length === 0) {
    throw new Error('草稿内容不能为空');
  }
  if (articlesArray.length > 8) {
    throw new Error(`微信草稿箱单条最多支持 8 篇多图文，当前传入 ${articlesArray.length} 篇。`);
  }

  const payloadArticles = articlesArray.map((art, idx) => {
    const contentLength = art.content.length;
    const contentBytes = Buffer.byteLength(art.content, 'utf8');
    if (contentLength > 20000) {
      throw new Error(`第 ${idx + 1} 篇正文 HTML 字符数 (${contentLength}) 超过微信 20,000 字符硬性上限，请精简正文或精简内联排版样式。`);
    }
    if (contentBytes > 1024 * 1024) {
      throw new Error(`第 ${idx + 1} 篇正文 HTML 字节大小 (${(contentBytes / 1024).toFixed(1)}KB) 超过微信 1MB 上限。`);
    }

    const item: any = {
      title: art.title,
      author: art.author || '',
      digest: art.digest || '',
      content: art.content,
      content_source_url: art.content_source_url || '',
      thumb_media_id: art.thumb_media_id,
      need_open_comment: art.need_open_comment ?? 1,
      only_fans_can_comment: art.only_fans_can_comment ?? 0,
    };

    if (art.article_type) {
      item.article_type = art.article_type;
    }
    if (art.image_info && art.image_info.image_list && art.image_info.image_list.length > 0) {
      item.image_info = art.image_info;
    }
    return item;
  });

  const payload = {
    articles: payloadArticles,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      if (data.errcode === 40001) {
        throw new Error(`[微信错误 40001] access_token 无效或已过期`);
      }
      if (data.errcode === 40007) {
        throw new Error(`[微信错误 40007] 封面 thumb_media_id 不合法，请确认封面已成功上传为永久素材`);
      }
      if (data.errcode === 45009) {
        throw new Error(`[微信错误 45009] 接口调用频率超出限制，已触发微信官方 API 配额保护，请稍后重试`);
      }
      if (data.errcode === 45166) {
        throw new Error(`[微信错误 45166] 包含不合规字符或内容未通过微信安全过滤`);
      }
      throw new Error(`[微信草稿创建失败 ${data.errcode}] ${data.errmsg || '未知错误'}`);
    }

    if (!data.media_id) {
      throw new Error(`微信草稿创建接口未返回 media_id: ${JSON.stringify(data)}`);
    }

    logger.debug(`草稿创建成功: media_id=${data.media_id}`);
    return { media_id: data.media_id };
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[微信草稿创建失败 ${resp.errcode}] ${resp.errmsg || err.message}`);
    }
    throw err;
  }
}

export async function updateWeChatDraft(
  accessToken: string,
  mediaId: string,
  index = 0,
  article: WeChatDraftArticle,
  proxyUrl?: string
): Promise<boolean> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/draft/update?access_token=${encodeURIComponent(accessToken)}`;

  const contentLength = article.content.length;
  const contentBytes = Buffer.byteLength(article.content, 'utf8');
  if (contentLength > 20000) {
    throw new Error(`更新草稿正文 HTML 字符数 (${contentLength}) 超过微信 20,000 字符硬性上限，请精简正文或排版样式。`);
  }
  if (contentBytes > 1024 * 1024) {
    throw new Error(`更新草稿正文 HTML 字节大小 (${(contentBytes / 1024).toFixed(1)}KB) 超过微信 1MB 上限。`);
  }

  const updateArticleItem: any = {
    title: article.title,
    author: article.author || '',
    digest: article.digest || '',
    content: article.content,
    content_source_url: article.content_source_url || '',
    thumb_media_id: article.thumb_media_id,
    need_open_comment: article.need_open_comment ?? 1,
    only_fans_can_comment: article.only_fans_can_comment ?? 0,
  };

  if (article.article_type) {
    updateArticleItem.article_type = article.article_type;
  }
  if (article.image_info && article.image_info.image_list && article.image_info.image_list.length > 0) {
    updateArticleItem.image_info = article.image_info;
  }

  const payload = {
    media_id: mediaId,
    index,
    articles: updateArticleItem,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`[微信草稿更新失败 ${data.errcode}] ${data.errmsg || '更新草稿失败'}`);
    }
    return true;
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[微信草稿更新失败 ${resp.errcode}] ${resp.errmsg || err.message}`);
    }
    throw err;
  }
}

export async function getWeChatDrafts(
  accessToken: string,
  offset = 0,
  count = 20,
  noContent = 1,
  proxyUrl?: string
): Promise<{ total_count: number; item_count: number; item: DraftListItem[] }> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/draft/batchget?access_token=${encodeURIComponent(accessToken)}`;

  const payload = {
    offset,
    count,
    no_content: noContent,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`[获取草稿列表失败 ${data.errcode}] ${data.errmsg}`);
    }

    return {
      total_count: data.total_count || 0,
      item_count: data.item_count || 0,
      item: data.item || [],
    };
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[获取草稿列表失败 ${resp.errcode}] ${resp.errmsg}`);
    }
    throw err;
  }
}

/**
 * Delete a draft from WeChat draft box
 */
export async function deleteWeChatDraft(
  accessToken: string,
  mediaId: string,
  proxyUrl?: string
): Promise<boolean> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/draft/delete?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await axios.post(
      url,
      { media_id: mediaId },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`[删除草稿失败 ${data.errcode}] ${data.errmsg || '删除草稿失败'}`);
    }
    return true;
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[删除草稿失败 ${resp.errcode}] ${resp.errmsg}`);
    }
    throw err;
  }
}

/**
 * Get detailed draft content from WeChat draft box
 */
export async function getWeChatDraftContent(
  accessToken: string,
  mediaId: string,
  proxyUrl?: string
): Promise<{ news_item: any[] }> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/draft/get?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await axios.post(
      url,
      { media_id: mediaId },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`[获取草稿内容失败 ${data.errcode}] ${data.errmsg}`);
    }
    return data;
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[获取草稿内容失败 ${resp.errcode}] ${resp.errmsg}`);
    }
    throw err;
  }
}

/**
 * Submit draft for formal free publishing (微信公众号群发 / 发布能力)
 */
export async function submitWeChatFreePublish(
  accessToken: string,
  mediaId: string,
  proxyUrl?: string
): Promise<{ publish_id: string }> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/freepublish/submit?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await axios.post(
      url,
      { media_id: mediaId },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      if (data.errcode === 40001) throw new Error('[微信错误 40001] access_token 无效或已过期');
      if (data.errcode === 45009) throw new Error('[微信错误 45009] 群发/发布频次超限');
      throw new Error(`[微信正式发布失败 ${data.errcode}] ${data.errmsg}`);
    }
    return { publish_id: data.publish_id };
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[微信正式发布失败 ${resp.errcode}] ${resp.errmsg}`);
    }
    throw err;
  }
}

/**
 * Check publishing status of a freepublish task
 */
export async function getWeChatPublishStatus(
  accessToken: string,
  publishId: string,
  proxyUrl?: string
): Promise<{
  publish_id: string;
  publish_status: number; // 0: 成功, 1: 发布中, 2: 原创审核中, 3: 失败
  article_id?: string;
  article_detail?: any;
  fail_idx?: number[];
}> {
  const baseUrl = proxyUrl ? proxyUrl.replace(/\/$/, '') : 'https://api.weixin.qq.com';
  const url = `${baseUrl}/cgi-bin/freepublish/get?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await axios.post(
      url,
      { publish_id: publishId },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const data = response.data;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`[获取发布状态失败 ${data.errcode}] ${data.errmsg}`);
    }
    return data;
  } catch (err: any) {
    if (err.response?.data?.errcode) {
      const resp = err.response.data;
      throw new Error(`[获取发布状态失败 ${resp.errcode}] ${resp.errmsg}`);
    }
    throw err;
  }
}
