import type { GoodsEffectRecord } from '../types/goodsEffect';

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

// 解码 PDD 字体加密数字。没有加密字符时返回 undefined，避免多生成空字段。
function decodePddDigitText(value: unknown, digitMap: PddDigitMap): string | undefined {
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
