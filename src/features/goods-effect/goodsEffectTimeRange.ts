import type { GoodsEffectApiParams } from './goodsEffectTypes';

export const GOODS_EFFECT_PAGE_SIZE = 50;

export type GoodsEffectTimePreset = 'realtime' | 'yesterday' | 'last7Days' | 'last30Days' | 'week' | 'month' | 'custom';

export type GoodsEffectDateParams = Pick<GoodsEffectApiParams, 'startDate' | 'endDate' | 'queryType' | 'pageSize'>;

export type GoodsEffectDateRange = [string, string];

export type GoodsEffectDateSelection = {
    customDate: string;
    selectedWeekDate: GoodsEffectDateRange | string;
    selectedMonth: GoodsEffectDateRange | string;
};

export const goodsEffectTimeOptions: Array<{ label: string; value: GoodsEffectTimePreset }> = [
    { label: '实时', value: 'realtime' },
    { label: '昨日', value: 'yesterday' },
    { label: '7日', value: 'last7Days' },
    { label: '30日', value: 'last30Days' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
    { label: '自定义', value: 'custom' }
];

// 商品数据页的时间选项要和 PDD 页面保持一致，这里集中维护 queryType 和日期范围。
export function buildGoodsEffectDateParams(
    preset: GoodsEffectTimePreset,
    now = new Date(),
    selection: Partial<GoodsEffectDateSelection> = {}
): GoodsEffectDateParams {
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);

    if (preset === 'yesterday') {
        const date = formatDate(yesterday);
        return buildParams(date, date, 0);
    }

    if (preset === 'last7Days') {
        return buildParams(formatDate(addDays(yesterday, -6)), formatDate(yesterday), 1);
    }

    if (preset === 'last30Days') {
        return buildParams(formatDate(addDays(yesterday, -29)), formatDate(yesterday), 2);
    }

    if (preset === 'week') {
        const selectedWeekRange = readDateRange(selection.selectedWeekDate);
        if (selectedWeekRange) return buildParams(selectedWeekRange[0], selectedWeekRange[1], 3);

        const selectedWeekDate = parseDate(readDateValue(selection.selectedWeekDate), today);
        const weekStartDate = startOfWeek(selectedWeekDate);
        return buildParams(formatDate(weekStartDate), formatDate(addDays(weekStartDate, 6)), 3);
    }

    if (preset === 'month') {
        const selectedMonthRange = readDateRange(selection.selectedMonth);
        if (selectedMonthRange) return buildParams(selectedMonthRange[0], selectedMonthRange[1], 4);

        const selectedMonth = parseDate(readDateValue(selection.selectedMonth), today);
        return buildParams(formatDate(startOfMonth(selectedMonth)), formatDate(endOfMonth(selectedMonth)), 4);
    }

    if (preset === 'custom') {
        const customDate = selection.customDate || formatDate(today);
        return buildParams(customDate, customDate, 5);
    }

    const date = formatDate(today);
    return buildParams(date, date, 6);
}

function buildParams(startDate: string, endDate: string, queryType: number): GoodsEffectDateParams {
    return {
        startDate,
        endDate,
        queryType,
        pageSize: GOODS_EFFECT_PAGE_SIZE
    };
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
    // PDD 页面里的“周”按自然周展示，国内习惯从周一开始。
    const daysFromMonday = (date.getDay() + 6) % 7;
    return addDays(date, -daysFromMonday);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function parseDate(value: string | undefined, fallback: Date): Date {
    if (!value) return fallback;

    const parts = value.split('-').map(part => Number(part));
    const year = parts[0];
    const month = parts[1];
    const day = parts[2] || 1;

    if (!year || !month || !day) return fallback;

    return new Date(year, month - 1, day);
}

function readDateRange(value: GoodsEffectDateRange | string | undefined): GoodsEffectDateRange | undefined {
    if (!Array.isArray(value)) return undefined;
    if (!value[0] || !value[1]) return undefined;

    return value;
}

function readDateValue(value: GoodsEffectDateRange | string | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
