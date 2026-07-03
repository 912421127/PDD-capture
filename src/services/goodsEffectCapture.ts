import type { GoodsEffectRecord } from '../types/goodsEffect';

type AnyObject = Record<string, unknown>;

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
export function normalizeGoodsEffectRecord(raw: unknown): GoodsEffectRecord {
    const row = isObject(raw) ? raw : {};
    const record: GoodsEffectRecord = {};

    for (const [key, value] of Object.entries(row)) {
        // raw 是调试用字段，用户导出时不需要看到。
        if (key === 'raw') continue;
        record[key] = value;
    }

    return record;
}

// 把采集结果转成 CSV 文本，方便直接下载到本地。
export function toCsv(records: GoodsEffectRecord[]): string {
    const headers = collectCsvHeaders(records);

    const rows = records.map(record => {
        return headers
            .map(header => {
                return csvCell(record[header]);
            })
            .join(',');
    });

    // Excel 更容易识别带 BOM 的 UTF-8 CSV。
    return `\ufeff${[headers.join(','), ...rows].join('\n')}`;
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

// 简单判断一个值是不是普通对象。
function isObject(value: unknown): value is AnyObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
