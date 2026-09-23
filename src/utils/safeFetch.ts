/**
 * Safe fetch helper for network and desktop IPC calls.
 * Guarantees that "Unexpected end of JSON input" is never thrown to the user,
 * gracefully handling empty bodies, non-JSON 502/500 proxy responses, and connection timeouts.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();
    let data: any = null;

    if (!text || !text.trim()) {
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data: {} as T,
          error: `本地服务响应为空 (HTTP ${res.status})，请稍候或检查后台服务`,
        };
      }
      return {
        ok: true,
        status: res.status,
        data: {} as T,
      };
    }

    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: res.status,
        data: {} as T,
        error:
          text.length > 120
            ? `服务返回非 JSON 响应 (HTTP ${res.status})`
            : text || `服务返回未知响应 (HTTP ${res.status})`,
      };
    }

    const hasError = !res.ok || (data && typeof data === 'object' && data.success === false);
    return {
      ok: !hasError,
      status: res.status,
      data: data as T,
      error: data?.error || data?.errmsg || (res.ok ? undefined : `请求失败 (HTTP ${res.status})`),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      error: err.message || '网络连接失败，请确认服务已启动',
    };
  }
}
