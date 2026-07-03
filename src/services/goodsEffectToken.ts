import { browser } from 'wxt/browser';
import type { GoodsEffectToken } from '../types/goodsEffect';

type TokenInput = {
    antiContent?: string;
    webSpiderRule?: string;
    requestBody?: string;
};

// 保存参数的位置。background 会写入，popup 会读取。
export const TOKEN_STORAGE_KEY = 'PDD_GOODS_EFFECT_TOKEN';

// 把请求头和请求体整理成采集接口需要的参数。
export function createGoodsEffectToken(input: TokenInput): GoodsEffectToken {
    return {
        crawlerInfo: readCrawlerInfo(input.requestBody),
        antiContent: input.antiContent || '',
        webSpiderRule: input.webSpiderRule || '',
        capturedAt: Date.now()
    };
}

// 请求体和请求头是在两个 webRequest 事件里拿到的，这里负责合并。
export function mergeGoodsEffectToken(oldToken: GoodsEffectToken | undefined, newToken: GoodsEffectToken): GoodsEffectToken {
    return {
        crawlerInfo: newToken.crawlerInfo || oldToken?.crawlerInfo || '',
        antiContent: newToken.antiContent || oldToken?.antiContent || '',
        webSpiderRule: newToken.webSpiderRule || oldToken?.webSpiderRule || '',
        capturedAt: Math.max(oldToken?.capturedAt || 0, newToken.capturedAt)
    };
}

// 一键采集时，从插件本地缓存读取最近一次风控参数。
export async function readGoodsEffectTokenFromPage(): Promise<GoodsEffectToken> {
    const data = await browser.storage.local.get(TOKEN_STORAGE_KEY);
    const token = data[TOKEN_STORAGE_KEY] as GoodsEffectToken | undefined;

    if (!token) {
        throw new Error('还没有捕获到参数：请确认已重新加载插件，然后刷新商品效果页或点击页面查询');
    }

    if (!token.crawlerInfo || !token.antiContent || !token.webSpiderRule) {
        throw new Error('参数捕获不完整：请刷新商品效果页或点击页面查询后再试');
    }

    return token;
}

// 从请求体 JSON 里读取 crawlerInfo。
function readCrawlerInfo(requestBody?: string): string {
    if (!requestBody) return '';

    try {
        const body = JSON.parse(requestBody);
        return typeof body?.crawlerInfo === 'string' ? body.crawlerInfo : '';
    } catch {
        return '';
    }
}
