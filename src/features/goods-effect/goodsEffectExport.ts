import type { GoodsEffectRecord } from './goodsEffectTypes';

type AnyObject = Record<string, unknown>;
export type PddDigitMap = Record<string, string>;

// 常用字段放在前面，导出的 CSV 更好读。
const FIRST_HEADERS = [
    'goodsId',
    'goodsName',
    'statDate',
    'goodsUv',
    'goodsPv',
    'goodsFavCnt',
    'payOrdrCnt',
    'payOrdrAmt',
    'goodsVcr',
    'ordrCrtUsrCnt',
    'ordrVstrRto',
    'payOrdrRto',
    'goodsStatus',
    'hdThumbUrl'
];

// 导出 CSV 时展示给用户看的中文表头。
// 没写在这里的字段会保留接口原字段名，避免漏字段。
const HEADER_NAME_MAP: Record<string, string> = {
    goodsId: '商品ID',
    goodsName: '商品名称',
    statDate: '统计日期',
    goodsUv: '商品访客数',
    goodsPv: '商品浏览量',
    goodsFavCnt: '商品收藏用户数',
    payOrdrCnt: '成交订单数',
    payOrdrAmt: '成交金额',
    goodsVcr: '成交转化率',
    ordrCrtUsrCnt: '下单用户数',
    ordrVstrRto: '下单率',
    payOrdrRto: '成交率',
    goodsStatus: '商品状态',
    hdThumbUrl: '商品主图',
    activityInfo: '活动信息',
    adStrategy: '推广策略',
    adStrategyDesc: '推广策略说明',
    adStrategyJumpUrl: '推广跳转链接',
    adStrategyStatus: '推广策略状态',
    cate1Id: '一级类目ID',
    cate1Name: '一级类目名称',
    cate2Id: '二级类目ID',
    cate2Name: '二级类目名称',
    cate3Id: '三级类目ID',
    cate3Name: '三级类目名称',
    cate3AvgGoodsVcr: '三级类目平均成交转化率',
    cate3PctGoodsVcr: '三级类目成交转化率排名',
    cate3IsPgvAbove: '三级类目是否高于均值',
    cfmOrdrCnt: '确认订单数',
    cfmOrdrCntYtd: '昨日确认订单数',
    cfmOrdrGoodsQty: '确认订单商品件数',
    cfmOrdrGoodsQtyYtd: '昨日确认订单商品件数',
    cnsltUsrQty: '咨询用户数',
    cnsltUsrQtyYtd: '昨日咨询用户数',
    goodsFavCntYtd: '昨日商品收藏用户数',
    goodsLabel: '商品标签',
    goodsPtHelpRate: '商品助力率',
    goodsPvYtd: '昨日商品浏览量',
    goodsUvYtd: '昨日商品访客数',
    goodsVcrYtd: '昨日成交转化率',
    hotGoodsActivityInfo: '热销商品活动信息',
    imprUsrCnt: '曝光用户数',
    imprUsrCntYtd: '昨日曝光用户数',
    imprUsrCntDetail: '曝光用户详情',
    isCreated1m: '是否近1月创建',
    isNewstyle: '是否新款',
    ordrCrtUsrCntYtd: '昨日下单用户数',
    ordrVstrRtoYtd: '昨日下单率',
    payOrdrAmtYtd: '昨日成交金额',
    payOrdrCntYtd: '昨日成交订单数',
    payOrdrGoodsQty: '成交商品件数',
    payOrdrGoodsQtyYtd: '昨日成交商品件数',
    payOrdrRtoYtd: '昨日成交率',
    payOrdrUsrCnt: '成交买家数',
    payOrdrUsrCntYtd: '昨日成交买家数',
    pctGoodsVcr: '成交转化率百分位',
    pctGoodsVcrYtd: '昨日成交转化率百分位',
    peerPerfGoodsCvr: '同行优秀商品转化率',
    peerPerfGoodsFavCnt: '同行优秀商品收藏数',
    peerPerfGoodsPtHelpRate: '同行优秀商品助力率',
    peerPerfGoodsPv: '同行优秀商品浏览量',
    peerPerfGoodsUv: '同行优秀商品访客数',
    peerPerfOrdrVstrRto: '同行优秀下单率',
    peerPerfPayOrdrAmt: '同行优秀成交金额',
    peerPerfPayOrdrRto: '同行优秀成交率',
    showCol: '展示列',
    url: '商品链接'
};

const HEADER_SUFFIX_NAME_MAP: Array<[string, string]> = [
    ['PctRised', '是否上涨'],
    ['IsPercent', '是否百分比'],
    ['Pct', '对比值'],
    ['Ytd', '昨日']
];

const HEADER_WORD_NAME_MAP: Record<string, string> = {
    ad: '推广',
    activity: '活动',
    amount: '金额',
    amt: '金额',
    annual: '年度',
    aop: '订单单价',
    aup: '客单价',
    avg: '平均',
    cate: '类目',
    cfm: '确认',
    cnt: '数',
    cnslt: '咨询',
    created: '创建',
    crt: '创建',
    cvr: '转化率',
    data: '数据',
    date: '日期',
    desc: '说明',
    detail: '详情',
    fav: '收藏',
    geography: '地区',
    goods: '商品',
    help: '助力',
    hot: '热销',
    id: 'ID',
    impr: '曝光',
    info: '信息',
    is: '是否',
    jump: '跳转',
    label: '标签',
    lead: '催付',
    list: '列表',
    mall: '店铺',
    metric: '指标',
    month: '月份',
    name: '名称',
    newstyle: '新款',
    ordr: '订单',
    order: '订单',
    pay: '成交',
    pct: '百分比',
    peer: '同行',
    perf: '优秀',
    pgv: '均值',
    province: '省份',
    pt: '拼团',
    pv: '浏览量',
    qty: '件数',
    rank: '排名',
    rate: '率',
    rf: '退款',
    rised: '上涨',
    rpay: '老买家',
    rto: '率',
    show: '展示',
    stat: '统计',
    status: '状态',
    strategy: '策略',
    suc: '成功',
    target: '目标',
    thumb: '主图',
    time: '时间',
    unknown: '未知',
    url: '链接',
    usr: '用户',
    uv: '访客数',
    val: '价值',
    vcr: '成交转化率',
    vo: '',
    vstr: '访客',
    ytd: '昨日'
};

// 当前页面字体里确认出来的数字映射。
// 后续如果 PDD 更换字体，再升级成自动解析字体文件。
const PDD_DIGIT_MAP: PddDigitMap = {
    '': '0',
    '': '1',
    '': '2',
    '': '3',
    '': '4',
    '': '5',
    '': '6',
    '': '7',
    '': '8',
    '': '9'
};

// 判断当前页面是不是 PDD 商品效果页。
export function isGoodsEffectPage(url: string): boolean {
    try {
        const pageUrl = new URL(url);
        return pageUrl.hostname === 'mms.pinduoduo.com' && pageUrl.pathname === '/sycm/goods_effect';
    } catch {
        return false;
    }
}

// 把接口返回的原始商品数据整理成导出对象。
// 第一版不丢字段：接口里有什么字段，这里就保留什么字段。
export function normalizeGoodsEffectRecord(raw: unknown, digitMap: PddDigitMap = PDD_DIGIT_MAP): GoodsEffectRecord {
    const row = isObject(raw) ? raw : {};
    const record: GoodsEffectRecord = {};

    for (const [key, value] of Object.entries(row)) {
        // raw 是调试用字段，用户导出时不需要看到。
        if (key === 'raw') continue;
        // 如果字段里含有 PDD 加密数字，直接把原字段替换成明文。
        // 这样 Excel 里不会再看到加密字符，也不会多出一堆重复列。
        const decodedValue = decodePddDigitText(value, digitMap);
        record[key] = decodedValue ?? value;
    }

    return record;
}

// 把采集结果转成 CSV 文本，方便直接下载到本地。
export function toCsv(records: GoodsEffectRecord[]): string {
    const headers = collectCsvHeaders(records);
    const displayHeaders = headers.map(getExportHeaderName);

    const rows = records.map(record => {
        return headers
            .map(header => {
                return csvCell(record[header]);
            })
            .join(',');
    });

    // Excel 更容易识别带 BOM 的 UTF-8 CSV。
    return `\ufeff${[displayHeaders.join(','), ...rows].join('\n')}`;
}

// 收集 CSV 表头：常用字段排前面，其余字段按接口出现顺序追加。
function collectCsvHeaders(records: GoodsEffectRecord[]): string[] {
    const headerSet = new Set<string>();

    for (const header of FIRST_HEADERS) {
        if (records.some(record => hasExportValue(record[header]))) {
            headerSet.add(header);
        }
    }

    for (const record of records) {
        for (const key of Object.keys(record)) {
            if (key === 'raw') continue;
            headerSet.add(key);
        }
    }

    return Array.from(headerSet);
}

// CSV 单元格用双引号包起来，里面的双引号要转义。
function csvCell(value: unknown): string {
    const text = valueToText(value);
    return `"${text.replace(/"/g, '""')}"`;
}

// 把各种字段值转成适合放进 CSV 的文本。
function valueToText(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

// 判断字段是否有可导出的值。
function hasExportValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
}

// 把接口字段名转成中文表头。未收录的新字段会按常见接口缩写拆词，尽量避免导出英文表头。
export function getExportHeaderName(header: string): string {
    const directName = HEADER_NAME_MAP[header];
    if (directName) return directName;

    for (const [suffix, suffixName] of HEADER_SUFFIX_NAME_MAP) {
        if (!header.endsWith(suffix)) continue;

        const baseHeader = header.slice(0, -suffix.length);
        const baseName = getExportHeaderName(baseHeader);
        if (baseName !== baseHeader) return `${baseName}${suffixName}`;
    }

    return header
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map(word => HEADER_WORD_NAME_MAP[word.toLowerCase()] ?? word)
        .join('');
}

// 解码 PDD 字体加密数字。没有加密字符时返回 undefined，避免多生成空字段。
export function decodePddDigitText(value: unknown, digitMap: PddDigitMap): string | undefined {
    if (typeof value !== 'string') return undefined;

    let hasEncryptedChar = false;
    let decodedText = '';

    for (const char of value) {
        const decodedChar = digitMap[char];
        if (decodedChar !== undefined) {
            hasEncryptedChar = true;
            decodedText += decodedChar;
        } else {
            decodedText += char;
        }
    }

    return hasEncryptedChar ? decodedText : undefined;
}

// 简单判断一个值是不是普通对象。
function isObject(value: unknown): value is AnyObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
