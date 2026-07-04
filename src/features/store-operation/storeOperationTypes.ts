import type { CaptureTaskStatus } from '../goods-effect/goodsEffectTypes';
import type { StoreOperationDateParams } from './storeOperationTimeRange';

export type StoreOperationToken = {
    antiContent: string;
    webSpiderRule: string;
    crawlerInfo?: string;
    capturedAt: number;
};

export type StoreOperationTokenCache = Record<string, StoreOperationToken>;

export type StoreOperationApiParams = {
    tradeQuery: StoreOperationDateParams;
    geographyQuery: StoreOperationDateParams;
    tradeInfoToken: StoreOperationToken;
    tradeListToken: StoreOperationToken;
    notPayOrderToken?: StoreOperationToken;
    leadPayToken?: StoreOperationToken;
    geographyToken?: StoreOperationToken;
    annualSalesToken?: StoreOperationToken;
};

export type StoreOperationRawResult = {
    tradeInfo: Record<string, unknown>;
    tradeTrend: Record<string, unknown>;
    orderInfo: Record<string, unknown>;
    leadPayInfo: Record<string, unknown>;
    geographyDistribution: Record<string, unknown>;
    annualSales: Record<string, unknown>;
};

export type StoreOperationResult = StoreOperationRawResult & {
    tradeInfoDisplay: Record<string, unknown>;
};

export type StoreOperationCaptureTask = {
    status: CaptureTaskStatus;
    pageUrl: string;
    isStoreOperationPage: boolean;
    result?: StoreOperationResult;
    error?: string;
    updatedAt: number;
};
