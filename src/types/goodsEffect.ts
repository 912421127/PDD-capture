// 采集任务的状态，用来控制 popup 上显示什么文案。
export type CaptureTaskStatus = 'idle' | 'checking' | 'running' | 'success' | 'failed';

// 请求商品效果接口时需要的参数。
export type GoodsEffectApiParams = {
    startDate: string;
    endDate: string;
    queryType: number;
    pageSize: number;
    crawlerInfo: string;
    webSpiderRule: string;
};

// 从 PDD 接口拿到的一页或全部分页结果。
export type GoodsEffectPageResult = {
    records: unknown[];
    total: number;
    currentPage: number;
    pageSize: number;
};

// 一条商品效果数据。raw 保留原始接口数据，方便后续补字段。
export type GoodsEffectRecord = {
    goodsId?: string;
    goodsName?: string;
    statDate?: string;
    goodsUv?: number | string;
    goodsPv?: number | string;
    goodsFavCnt?: number | string;
    payOrdrCnt?: number | string;
    payOrdrAmt?: number | string;
    goodsVcr?: number | string;
    ordrCrtUsrCnt?: number | string;
    ordrVstrRto?: number | string;
    payOrdrRto?: number | string;
    goodsStatus?: number | string;
    hdThumbUrl?: string;
    raw: unknown;
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
