import { browser } from 'wxt/browser';
import type { StoreOperationToken, StoreOperationTokenCache } from './storeOperationTypes';

export const STORE_OPERATION_TOKEN_STORAGE_KEY = 'PDD_STORE_OPERATION_TOKEN';

export function createStoreOperationTokenCache(): StoreOperationTokenCache {
    return {};
}

export function createStoreOperationToken(input: { antiContent?: string; webSpiderRule?: string; crawlerInfo?: string }): StoreOperationToken {
    return {
        antiContent: input.antiContent || '',
        webSpiderRule: input.webSpiderRule || '',
        crawlerInfo: input.crawlerInfo || '',
        capturedAt: Date.now()
    };
}

export function mergeStoreOperationToken(
    oldToken: StoreOperationToken | undefined,
    newToken: StoreOperationToken
): StoreOperationToken {
    return {
        antiContent: newToken.antiContent || oldToken?.antiContent || '',
        webSpiderRule: newToken.webSpiderRule || oldToken?.webSpiderRule || '',
        crawlerInfo: newToken.crawlerInfo || oldToken?.crawlerInfo || '',
        capturedAt: Math.max(oldToken?.capturedAt || 0, newToken.capturedAt)
    };
}

export function saveStoreOperationTokenToCache(
    cache: StoreOperationTokenCache,
    apiUrl: string,
    token: StoreOperationToken
): StoreOperationTokenCache {
    const oldToken = cache[apiUrl];

    return {
        ...cache,
        [apiUrl]: mergeStoreOperationToken(oldToken, token)
    };
}

export function readStoreOperationTokenFromCache(cache: StoreOperationTokenCache, apiUrl: string): StoreOperationToken {
    const token = cache[apiUrl];

    if (!token?.antiContent) {
        throw new Error('经营数据页参数获取不完整。请先在 PDD 经营数据页面点击查询/切换日期，等页面数据加载完成后，再回到插件点击采集。');
    }

    return token;
}

export async function readStoreOperationTokenCacheFromPage(): Promise<StoreOperationTokenCache> {
    const data = await browser.storage.local.get(STORE_OPERATION_TOKEN_STORAGE_KEY);
    const cache = data[STORE_OPERATION_TOKEN_STORAGE_KEY] as StoreOperationTokenCache | undefined;

    if (!cache || typeof cache !== 'object') {
        throw new Error('还没有获取到经营数据页参数。请先在 PDD 经营数据页面点击查询/切换日期，等页面数据加载完成后，再回到插件点击采集。');
    }

    return cache;
}
