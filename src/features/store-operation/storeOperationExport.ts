import type { ColInfo } from 'xlsx';
import { decodePddDigitText, getExportHeaderName, type PddDigitMap } from '../goods-effect/goodsEffectExport.ts';
import type { StoreOperationRawResult, StoreOperationResult } from './storeOperationTypes';

type AnyObject = Record<string, unknown>;
type SpreadsheetCell = string | number | boolean | null;

export type StoreOperationWorkbookSheet = {
    name: string;
    rows: SpreadsheetCell[][];
};

const TRADE_INFO_NAME_MAP: Record<string, string> = {
    payOrdrAmt: '成交金额',
    payOrdrCnt: '成交订单数',
    payOrdrUsrCnt: '成交买家数',
    payUvRto: '成交转化率',
    payOrdrAup: '客单价',
    rpayUsrRtoDth: '成交老买家占比',
    mallFavCnt: '昨日关注用户数',
    sucRfOrdrAmt1d: '昨日退款金额',
    sucRfOrdrCnt1d: '昨日退款单数',
    uvCfmVal: '昨日访客价值'
};

const TREND_HEADER_NAME_MAP: Record<string, string> = {
    dataType: '数据类型',
    stateDate: '统计日期',
    hr: '小时',
    payOrdrAmt: '成交金额',
    payOrdrCnt: '成交订单数',
    payOrdrUsrCnt: '成交买家数',
    payOrdrAup: '客单价',
    payUvRto: '成交转化率',
    rpayUsrRtoDth: '成交老买家占比',
    mallFavCnt: '关注用户数',
    sucRfOrdrAmt1d: '退款金额',
    sucRfOrdrCnt1d: '退款单数',
    uvCfmVal: '访客价值'
};

const TRADE_INFO_ORDER = Object.keys(TRADE_INFO_NAME_MAP);
const TREND_HEADER_ORDER = Object.keys(TREND_HEADER_NAME_MAP);

export type StoreOperationCsvFile = {
    name: string;
    data: string;
};

export function isStoreOperationPage(url: string): boolean {
    try {
        const pageUrl = new URL(url);
        return pageUrl.hostname === 'mms.pinduoduo.com' && pageUrl.pathname === '/sycm/stores_data/operation';
    } catch {
        return false;
    }
}

// 经营数据页沿用商品数据页的数字解码逻辑，只负责把接口原字段转成用户能读的明文。
export function normalizeStoreOperationResult(raw: StoreOperationRawResult, digitMap: PddDigitMap): StoreOperationResult {
    const tradeInfo = decodeObject(raw.tradeInfo, digitMap);
    const tradeTrend = decodeObject(raw.tradeTrend, digitMap);
    const orderInfo = decodeObject(raw.orderInfo, digitMap);
    const leadPayInfo = decodeObject(raw.leadPayInfo, digitMap);
    const geographyDistribution = decodeObject(raw.geographyDistribution, digitMap);
    const annualSales = decodeObject(raw.annualSales, digitMap);

    return {
        tradeInfo,
        tradeInfoDisplay: buildTradeInfoDisplay(tradeInfo),
        tradeTrend,
        orderInfo,
        leadPayInfo,
        geographyDistribution,
        annualSales
    };
}

export function toStoreOperationJson(result: StoreOperationResult): string {
    return JSON.stringify(result, null, 2);
}

export function buildStoreOperationCsvFiles(result: StoreOperationResult): StoreOperationCsvFile[] {
    return [
        {
            name: '交易概况-指标卡片',
            data: rowsToCsv(buildTradeInfoRows(result.tradeInfo))
        },
        {
            name: '交易概况-趋势累计',
            data: buildTrendCsv([
                ...readList(result.tradeTrend.todayRtList).map(row => ({ dataType: '今日累计', ...row })),
                ...readList(result.tradeTrend.yesterdayRtList).map(row => ({ dataType: '昨日累计', ...row }))
            ])
        },
        {
            name: '交易概况-趋势分小时',
            data: buildTrendCsv([
                ...readList(result.tradeTrend.todayPerHourRtList).map(row => ({ dataType: '今日分小时', ...row })),
                ...readList(result.tradeTrend.yesterdayPerHourRtList).map(row => ({ dataType: '昨日分小时', ...row }))
            ])
        }
    ];
}

export function buildStoreOperationWorkbookData(result: StoreOperationResult): StoreOperationWorkbookSheet[] {
    return [
        {
            name: '指标卡片',
            rows: buildTradeInfoRows(result.tradeInfo)
        },
        {
            name: '趋势累计',
            rows: buildTrendRows([
                ...readList(result.tradeTrend.todayRtList).map(row => ({ dataType: '今日累计', ...row })),
                ...readList(result.tradeTrend.yesterdayRtList).map(row => ({ dataType: '昨日累计', ...row }))
            ])
        },
        {
            name: '趋势分小时',
            rows: buildTrendRows([
                ...readList(result.tradeTrend.todayPerHourRtList).map(row => ({ dataType: '今日分小时', ...row })),
                ...readList(result.tradeTrend.yesterdayPerHourRtList).map(row => ({ dataType: '昨日分小时', ...row }))
            ])
        },
        {
            name: '年度经营情况',
            rows: buildAnnualSalesRows(result.annualSales)
        },
        {
            name: '订单数据',
            rows: buildOrderInfoRows(result.orderInfo)
        },
        {
            name: '催付数据',
            rows: buildLeadPayRows(result.leadPayInfo)
        },
        {
            name: '地区交易数据',
            rows: buildGeographyRows(result.geographyDistribution)
        }
    ];
}

export async function buildStoreOperationXlsx(result: StoreOperationResult): Promise<ArrayBuffer> {
    // xlsx 体积较大，只有用户真的导出 Excel 时才加载，避免拖慢 popup 打开速度。
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    for (const sheet of buildStoreOperationWorkbookData(result)) {
        const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
        worksheet['!cols'] = buildColumnWidths(sheet.rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

function buildTradeInfoDisplay(tradeInfo: AnyObject): AnyObject {
    const display: AnyObject = {};

    for (const [key, name] of Object.entries(TRADE_INFO_NAME_MAP)) {
        if (hasValue(tradeInfo[key])) display[name] = tradeInfo[key];

        const pctKey = `${key}Pct`;
        if (hasValue(tradeInfo[pctKey])) display[`${name}对比值`] = tradeInfo[pctKey];

        const risedKey = `${key}PctRised`;
        if (hasValue(tradeInfo[risedKey])) display[`${name}是否上涨`] = tradeInfo[risedKey];
    }

    return display;
}

function buildTrendCsv(rows: AnyObject[]): string {
    return rowsToCsv(buildTrendRows(rows));
}

function buildTradeInfoRows(tradeInfo: AnyObject): SpreadsheetCell[][] {
    const rows = TRADE_INFO_ORDER.map(key => [
        TRADE_INFO_NAME_MAP[key],
        toSpreadsheetCell(tradeInfo[key]),
        toSpreadsheetCell(tradeInfo[`${key}Pct`]),
        toSpreadsheetCell(tradeInfo[`${key}IsPercent`]),
        toSpreadsheetCell(tradeInfo[`${key}PctRised`])
    ]).filter(row => hasValue(row[1]) || hasValue(row[2]));

    return [['指标', '当前值', '对比值', '是否百分比', '是否上涨'], ...rows];
}

function buildTrendRows(rows: AnyObject[]): SpreadsheetCell[][] {
    const headers = collectHeaders(rows, TREND_HEADER_ORDER);
    // 趋势接口可能临时增加字段，导出时统一走中文表头，避免用户看到接口英文名。
    const displayHeaders = headers.map(header => TREND_HEADER_NAME_MAP[header] || getExportHeaderName(header));
    const bodyRows = rows.map(row => headers.map(header => toSpreadsheetCell(row[header])));

    return [displayHeaders, ...bodyRows];
}

function buildAnnualSalesRows(annualSales: AnyObject): SpreadsheetCell[][] {
    const historyRows = readList(annualSales.historyDataVOList);
    const currentRows = readList(annualSales.currentDataVOList);
    const targetRows = readList(annualSales.manageConfigureVOList);

    const rows: SpreadsheetCell[][] = [['月份', '25年成交额(元)', '26年成交额(元)', '26年目标成交额(元)', '每月完成度']];

    for (let month = 1; month <= 12; month += 1) {
        const historyAmount = readMonthValue(historyRows, month, 'payOrdrAmt');
        const currentAmount = readMonthValue(currentRows, month, 'payOrdrAmt');
        const targetAmount = readAnnualTarget(targetRows, month);

        rows.push([`${month}月`, historyAmount, currentAmount, targetAmount, buildMonthProgress(currentAmount, targetAmount)]);
    }

    return rows;
}

function buildOrderInfoRows(orderInfo: AnyObject): SpreadsheetCell[][] {
    return [
        ['统计时间', '下单待付款订单数', '下单待付款金额', '待到账金额'],
        [
            toSpreadsheetCell(orderInfo.readyDate),
            toSpreadsheetCell(orderInfo.notPayOrderCnt),
            // 订单接口里的金额单位是“分”，导出给用户看时统一换算成“元”。
            centsToYuan(orderInfo.notPayOrderAmountCnt),
            centsToYuan(orderInfo.settlementShippingAmount)
        ]
    ];
}

function buildLeadPayRows(leadPayInfo: AnyObject): SpreadsheetCell[][] {
    return [
        ['统计日期', '引导下单人数', '引导成交金额'],
        [
            toSpreadsheetCell(leadPayInfo.readyDate),
            toSpreadsheetCell(leadPayInfo.allLeadPayPplCnt1m),
            // 催付接口里的金额单位也是“分”，这里换算成截图里展示的“元”。
            centsToYuan(leadPayInfo.allLeadPayOrdrAmt1m)
        ]
    ];
}

function buildGeographyRows(geographyDistribution: AnyObject): SpreadsheetCell[][] {
    const rows = readList(geographyDistribution.geographyDistributionVOList).map(row => [
        toSpreadsheetCell(row.provinceName),
        toSpreadsheetCell(row.statDate),
        toSpreadsheetCell(row.cfmOrdrAmt),
        toSpreadsheetCell(row.cfmOrdrCnt),
        toSpreadsheetCell(row.cfmOrdrUsrCnt),
        toSpreadsheetCell(row.cfmOrdrAop),
        toSpreadsheetCell(row.cfmOrdrAup)
    ]);

    return [['省份', '统计日期', '成交金额(元)', '成交订单数', '成交买家数', '成交订单单价(元)', '成交客单价(元)'], ...rows];
}

function readMonthValue(rows: AnyObject[], month: number, key: string): SpreadsheetCell {
    const row = rows.find(item => Number(item.month) === month);
    return toSpreadsheetCell(row?.[key]);
}

function readAnnualTarget(rows: AnyObject[], month: number): SpreadsheetCell {
    const row = rows.find(item => Number(item.month) === month);
    const target = row?.targetPayOrdrAmt ?? row?.targetOrdrAmt ?? row?.payOrdrAmt ?? row?.target;
    const cell = toSpreadsheetCell(target);

    // 页面没有配置月目标时显示 0，完成度也会显示为 --%。
    return cell ?? 0;
}

function buildMonthProgress(currentAmount: SpreadsheetCell, targetAmount: SpreadsheetCell): SpreadsheetCell {
    const current = Number(currentAmount);
    const target = Number(targetAmount);

    if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return '--%';
    return `${((current / target) * 100).toFixed(2)}%`;
}

function rowsToCsv(rows: SpreadsheetCell[][]): string {
    return `\ufeff${rows.map(row => row.map(csvCell).join(',')).join('\n')}`;
}

function collectHeaders(rows: AnyObject[], firstHeaders: string[]): string[] {
    const headers = new Set<string>();

    for (const header of firstHeaders) {
        if (rows.some(row => hasValue(row[header]))) headers.add(header);
    }

    for (const row of rows) {
        for (const key of Object.keys(row)) {
            headers.add(key);
        }
    }

    return Array.from(headers);
}

function buildColumnWidths(rows: SpreadsheetCell[][]): ColInfo[] {
    const columnCount = Math.max(0, ...rows.map(row => row.length));

    return Array.from({ length: columnCount }, (_, columnIndex) => {
        const maxLength = Math.max(
            8,
            ...rows.map(row => valueToText(row[columnIndex]).length)
        );

        return { wch: Math.min(Math.max(maxLength + 2, 10), 28) };
    });
}

function decodeObject(value: unknown, digitMap: PddDigitMap): AnyObject {
    if (!isObject(value)) return {};

    const output: AnyObject = {};
    for (const [key, item] of Object.entries(value)) {
        output[key] = decodeValue(item, digitMap);
    }

    return output;
}

function decodeValue(value: unknown, digitMap: PddDigitMap): unknown {
    const decodedText = decodePddDigitText(value, digitMap);
    if (decodedText !== undefined) return decodedText;

    if (Array.isArray(value)) {
        return value.map(item => decodeValue(item, digitMap));
    }

    if (isObject(value)) {
        return decodeObject(value, digitMap);
    }

    return value;
}

function readList(value: unknown): AnyObject[] {
    if (!Array.isArray(value)) return [];
    return value.filter(isObject);
}

function csvCell(value: unknown): string {
    const text = valueToText(value);
    return `"${text.replace(/"/g, '""')}"`;
}

function toSpreadsheetCell(value: unknown): SpreadsheetCell {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    return JSON.stringify(value);
}

function centsToYuan(value: unknown): SpreadsheetCell {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Math.round(numberValue) / 100;
}

function valueToText(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

function hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
}

function isObject(value: unknown): value is AnyObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
