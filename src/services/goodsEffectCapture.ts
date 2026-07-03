import type { GoodsEffectRecord } from '../types/goodsEffect';

type AnyObject = Record<string, unknown>;

// 判断当前页面是不是 PDD 商品效果页。
export function isGoodsEffectPage(url: string): boolean {
    try {
        const pageUrl = new URL(url);
        return pageUrl.hostname === 'mms.pinduoduo.com' && pageUrl.pathname === '/sycm/goods_effect';
    } catch {
        return false;
    }
}

// 把接口返回的原始商品数据，整理成我们导出时使用的固定字段。
export function normalizeGoodsEffectRecord(raw: unknown): GoodsEffectRecord {
    const row = isObject(raw) ? raw : {};

    return {
        goodsId: readText(row, 'goodsId'),
        goodsName: readText(row, 'goodsName'),
        statDate: readText(row, 'statDate'),
        goodsUv: readValue(row, 'goodsUv'),
        goodsPv: readValue(row, 'goodsPv'),
        goodsFavCnt: readValue(row, 'goodsFavCnt'),
        payOrdrCnt: readValue(row, 'payOrdrCnt'),
        payOrdrAmt: readValue(row, 'payOrdrAmt'),
        goodsVcr: readValue(row, 'goodsVcr'),
        ordrCrtUsrCnt: readValue(row, 'ordrCrtUsrCnt'),
        ordrVstrRto: readValue(row, 'ordrVstrRto'),
        payOrdrRto: readValue(row, 'payOrdrRto'),
        goodsStatus: readValue(row, 'goodsStatus'),
        hdThumbUrl: readText(row, 'hdThumbUrl'),
        raw
    };
}

// 把采集结果转成 CSV 文本，方便直接下载到本地。
export function toCsv(records: GoodsEffectRecord[]): string {
    const headers = [
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
        'hdThumbUrl',
        'raw'
    ];

    const rows = records.map(record => {
        return headers
            .map(header => {
                const value = header === 'raw' ? JSON.stringify(record.raw) : record[header as keyof GoodsEffectRecord];
                return csvCell(value);
            })
            .join(',');
    });

    // Excel 更容易识别带 BOM 的 UTF-8 CSV。
    return `\ufeff${[headers.join(','), ...rows].join('\n')}`;
}

// 读取文本字段。
function readText(row: AnyObject, key: string): string | undefined {
    const value = readValue(row, key);
    if (value === undefined) return undefined;
    return String(value);
}

// 读取数字或文本字段。
function readValue(row: AnyObject, key: string): number | string | undefined {
    const value = row[key];
    if (typeof value === 'string' || typeof value === 'number') return value;
    return undefined;
}

// CSV 单元格用双引号包起来，里面的双引号要转义。
function csvCell(value: unknown): string {
    const text = value === undefined || value === null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

// 简单判断一个值是不是普通对象。
function isObject(value: unknown): value is AnyObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
