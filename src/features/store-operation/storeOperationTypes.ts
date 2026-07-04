import type { CaptureTaskStatus } from '../goods-effect/goodsEffectTypes';

export type StoreOperationToken = {
    antiContent: string;
    webSpiderRule: string;
    capturedAt: number;
};

export type StoreOperationTokenCache = Record<string, StoreOperationToken>;

export type StoreOperationApiParams = {
    queryType: number;
    queryDate: string;
    tradeInfoToken: StoreOperationToken;
    tradeListToken: StoreOperationToken;
};

export type StoreOperationRawResult = {
    tradeInfo: Record<string, unknown>;
    tradeTrend: Record<string, unknown>;
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
