import type { GoodsEffectApiParams, GoodsEffectPageResult } from '../types/goodsEffect';
import { browser } from 'wxt/browser';

// 商品效果页已经确认的固定接口。
const GOODS_EFFECT_API = 'https://mms.pinduoduo.com/sydney/api/goodsDataShow/queryGoodsDetailVOListForMMS';

// 从第 1 页开始，循环请求全部分页数据。
export async function fetchAllGoodsEffect(params: GoodsEffectApiParams): Promise<GoodsEffectPageResult> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
        throw new Error('没有找到当前标签页');
    }

    // 把请求函数直接放到当前 PDD 页面执行。
    // 这样请求会使用页面自己的登录态 cookie，也能在页面 Network 里看到。
    const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: fetchGoodsEffectInsidePddPage,
        args: [GOODS_EFFECT_API, params]
    });

    if (!result?.result) {
        throw new Error('页面没有返回采集结果');
    }

    return result.result as GoodsEffectPageResult;
}

// 注意：这个函数会被 Chrome 复制到网页里执行。
// 它必须是“自包含”的，不能调用外面的函数，否则页面里会找不到函数，导致点击后没有请求。
async function fetchGoodsEffectInsidePddPage(apiUrl: string, params: GoodsEffectApiParams): Promise<GoodsEffectPageResult> {
    const allRecords: unknown[] = [];
    let total = 0;
    let currentPage = 1;
    const maxPageCount = 500;

    for (let index = 0; index < maxPageCount; index += 1) {
        currentPage = index + 1;

        const headers: Record<string, string> = {
            'content-type': 'application/json'
        };

        // anti-content 和 crawlerInfo 第一版使用同一个值，由用户从 Network 里复制。
        if (params.crawlerInfo) headers['anti-content'] = params.crawlerInfo;

        // webspiderrule 是另一个动态风控字段，第一版先由用户手动填写。
        if (params.webSpiderRule) headers.webspiderrule = params.webSpiderRule;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                goodsId: '',
                startDate: params.startDate,
                endDate: params.endDate,
                queryType: params.queryType,
                sortCol: 0,
                sortType: 1,
                pageNum: currentPage,
                pageSize: params.pageSize,
                actVs: 1,
                crawlerInfo: params.crawlerInfo
            })
        });

        if (!response.ok) {
            throw new Error(`接口请求失败：HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data?.success) {
            throw new Error(`接口返回失败：${data?.errorMsg || data?.errorCode || '未知错误'}`);
        }

        const records = Array.isArray(data?.result?.goodsDetailList) ? data.result.goodsDetailList : [];
        const pageTotal = Number(data?.result?.totalNum ?? records.length);

        total = pageTotal;
        allRecords.push(...records);

        if (records.length === 0) break;
        if (allRecords.length >= total) break;
        if (records.length < params.pageSize) break;

        // 每页之间等 800ms，降低连续请求太快导致失败的概率。
        await new Promise(resolve => {
            window.setTimeout(resolve, 800);
        });
    }

    return {
        records: allRecords,
        total,
        currentPage,
        pageSize: params.pageSize
    };
}
