// 采集任务的状态，用来控制 popup 上显示什么文案。
export type CaptureTaskStatus = 'idle' | 'running' | 'success' | 'failed';

// 请求商品效果接口时需要的参数。
export type GoodsEffectApiParams = {
    startDate: string;
    endDate: string;
    queryType: number;
    pageSize: number;
    crawlerInfo: string;
    antiContent: string;
    webSpiderRule: string;
};

// PDD 商品效果接口需要的动态风控参数。
export type GoodsEffectToken = {
    crawlerInfo: string;
    antiContent: string;
    webSpiderRule: string;
    capturedAt: number;
};

// 从 PDD 接口拿到的一页或全部分页结果。
export type GoodsEffectPageResult = {
    records: unknown[];
    total: number;
    currentPage: number;
    pageSize: number;
};

// 一条商品效果数据。
// PDD 接口字段很多，而且后面可能变，所以这里允许保存任意字段。
export type GoodsEffectRecord = Record<string, unknown>;

// 页面字体信息。用于分析 PDD 字体加密。
export type GoodsEffectFontInfo = {
    fontFaces: Array<{
        family: string;
        status: string;
    }>;
    fontUrls: string[];
    encryptedChars: string[];
    textSamples: string[];
    capturedAt: number;
};

// popup 页面展示用的任务状态。
export type GoodsEffectCaptureTask = {
    status: CaptureTaskStatus;
    pageUrl: string;
    isGoodsEffectPage: boolean;
    total: number;
    currentPage: number;
    pageSize: number;
    records: GoodsEffectRecord[];
    error?: string;
    updatedAt: number;
};
