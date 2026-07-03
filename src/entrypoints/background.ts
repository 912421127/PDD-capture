import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { createGoodsEffectToken, mergeGoodsEffectToken, TOKEN_STORAGE_KEY } from '../services/goodsEffectToken';
import type { GoodsEffectToken } from '../types/goodsEffect';

type RequestHeader = {
    name: string;
    value?: string;
};

type RequestBodyDetails = {
    requestBody?: {
        raw?: Array<{
            bytes?: ArrayBuffer;
        }>;
    };
};

// 商品效果接口。background 会监听这个接口，从真实请求里拿动态参数。
const GOODS_EFFECT_API = 'https://mms.pinduoduo.com/sydney/api/goodsDataShow/queryGoodsDetailVOListForMMS';

// requestId 是浏览器给每个请求分配的 id。
// 请求体和请求头会分两次进来，所以先临时存在这里再合并。
const tokenMap = new Map<string, GoodsEffectToken>();

export default defineBackground(() => {
    // 监听请求体：这里主要拿 crawlerInfo。
    browser.webRequest.onBeforeRequest.addListener(
        details => {
            savePartToken(details.requestId, {
                requestBody: readRequestBody(details)
            });
            return undefined;
        },
        { urls: [GOODS_EFFECT_API] },
        ['requestBody']
    );

    // 监听请求头：这里主要拿 anti-content 和 webspiderrule。
    browser.webRequest.onBeforeSendHeaders.addListener(
        details => {
            savePartToken(details.requestId, {
                antiContent: readHeader(details.requestHeaders, 'anti-content'),
                webSpiderRule: readHeader(details.requestHeaders, 'webspiderrule')
            });
            return undefined;
        },
        { urls: [GOODS_EFFECT_API] },
        ['requestHeaders', 'extraHeaders']
    );
});

// 保存一部分参数。两次事件都会调用这里，最后合并成完整参数。
async function savePartToken(requestId: string, input: { antiContent?: string; webSpiderRule?: string; requestBody?: string }) {
    const oldToken = tokenMap.get(requestId);
    const newToken = createGoodsEffectToken(input);
    const mergedToken = mergeGoodsEffectToken(oldToken, newToken);

    tokenMap.set(requestId, mergedToken);

    // 只要有任何更新就写入 storage，popup 随时可以读取最近一次结果。
    await browser.storage.local.set({
        [TOKEN_STORAGE_KEY]: mergedToken
    });
}

// 从请求头数组里读取指定字段，不区分大小写。
function readHeader(headers: RequestHeader[] | undefined, name: string): string {
    const targetName = name.toLowerCase();
    const header = headers?.find(item => item.name.toLowerCase() === targetName);
    return typeof header?.value === 'string' ? header.value : '';
}

// 从请求体里还原 JSON 字符串。
function readRequestBody(details: RequestBodyDetails): string {
    const rawBytes = details.requestBody?.raw?.[0]?.bytes;
    if (!rawBytes) return '';

    try {
        return new TextDecoder().decode(rawBytes);
    } catch {
        return '';
    }
}
