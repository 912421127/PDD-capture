import { browser } from 'wxt/browser';
import type { StoreOperationApiParams, StoreOperationRawResult } from './storeOperationTypes';

export const STORE_OPERATION_TRADE_INFO_API = 'https://mms.pinduoduo.com/sydney/api/mallTrade/getMallTradeInfo';
export const STORE_OPERATION_TRADE_LIST_API = 'https://mms.pinduoduo.com/sydney/api/mallTrade/queryMallTradeList';
export const STORE_OPERATION_NOT_PAY_ORDER_API = 'https://mms.pinduoduo.com/sydney/api/mallTrade/getMallNotPayOrderInfoV2';
export const STORE_OPERATION_LEAD_PAY_API = 'https://mms.pinduoduo.com/sydney/api/mallTrade/getLeadPayOrderInfo';
export const STORE_OPERATION_GEOGRAPHY_API = 'https://mms.pinduoduo.com/sydney/api/mallCoreData/queryMallGeographyDistributionList';
export const STORE_OPERATION_ANNUAL_SALES_API = 'https://mms.pinduoduo.com/sydney/api/mallScore/queryMallConfigurationList';

export async function fetchStoreOperationTradeOverview(params: StoreOperationApiParams): Promise<StoreOperationRawResult> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
        throw new Error('没有找到当前标签页');
    }

    const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: fetchStoreOperationInsidePddPage,
        args: [
            STORE_OPERATION_TRADE_INFO_API,
            STORE_OPERATION_TRADE_LIST_API,
            STORE_OPERATION_NOT_PAY_ORDER_API,
            STORE_OPERATION_LEAD_PAY_API,
            STORE_OPERATION_GEOGRAPHY_API,
            STORE_OPERATION_ANNUAL_SALES_API,
            params
        ]
    });

    if (!result?.result) {
        throw new Error('页面没有返回经营数据采集结果');
    }

    return result.result as StoreOperationRawResult;
}

// 这个函数会被 Chrome 复制到 PDD 页面执行，必须保持自包含。
async function fetchStoreOperationInsidePddPage(
    tradeInfoApi: string,
    tradeListApi: string,
    notPayOrderApi: string,
    leadPayApi: string,
    geographyApi: string,
    annualSalesApi: string,
    params: StoreOperationApiParams
): Promise<StoreOperationRawResult> {
    async function postJson(apiUrl: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`经营数据接口请求失败：HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data?.success) {
            throw new Error(`经营数据接口返回失败：${data?.errorMsg || data?.errorCode || '未知错误'}`);
        }

        return data;
    }

    function readResultObject(data: unknown): Record<string, unknown> {
        const result = (data as { result?: unknown })?.result;
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return result as Record<string, unknown>;
        }

        return {};
    }

    function buildHeaders(token: { antiContent: string; webSpiderRule: string }): Record<string, string> {
        const headers: Record<string, string> = {
            'content-type': 'application/json'
        };

        if (token.antiContent) headers['anti-content'] = token.antiContent;
        if (token.webSpiderRule) headers.webspiderrule = token.webSpiderRule;

        return headers;
    }

    const body = {
        queryType: params.queryType,
        queryDate: params.queryDate
    };

    const tradeInfoHeaders = buildHeaders(params.tradeInfoToken);
    const tradeListHeaders = buildHeaders(params.tradeListToken);
    const notPayOrderHeaders = buildHeaders(params.notPayOrderToken);
    const leadPayHeaders = buildHeaders(params.leadPayToken);
    const geographyHeaders = buildHeaders(params.geographyToken);
    const annualSalesHeaders = buildHeaders(params.annualSalesToken);

    const [tradeInfo, tradeTrend, orderInfo, leadPayInfo, geographyDistribution, annualSales] = await Promise.all([
        postJson(tradeInfoApi, tradeInfoHeaders, body),
        postJson(tradeListApi, tradeListHeaders, body),
        postJson(notPayOrderApi, notPayOrderHeaders, {}),
        postJson(leadPayApi, leadPayHeaders, {}),
        // 地区交易数据的 queryType=0 对应页面上的“昨日”，年度数据后续再单独扩展。
        postJson(geographyApi, geographyHeaders, { queryType: 0 }),
        // 年度经营情况接口的 body 里必须带 crawlerInfo，页面请求里它通常和 anti-content 一样。
        postJson(annualSalesApi, annualSalesHeaders, {
            crawlerInfo: params.annualSalesToken.crawlerInfo || params.annualSalesToken.antiContent
        })
    ]);

    return {
        tradeInfo: readResultObject(tradeInfo),
        tradeTrend: readResultObject(tradeTrend),
        orderInfo: readResultObject(orderInfo),
        leadPayInfo: readResultObject(leadPayInfo),
        geographyDistribution: readResultObject(geographyDistribution),
        annualSales: readResultObject(annualSales)
    };
}
