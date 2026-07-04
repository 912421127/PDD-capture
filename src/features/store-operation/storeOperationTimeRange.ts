export type StoreOperationTradeTimePreset = 'realtime' | 'yesterday' | 'last7Days' | 'last30Days' | 'week' | 'month' | 'custom';
export type StoreOperationGeographyTimePreset = 'yesterday' | 'last7Days' | 'last30Days';

export type StoreOperationDateParams = {
    queryType: number;
    queryDate: string;
};

export type StoreOperationDateRange = [string, string];

export type StoreOperationDateSelection = {
    customDate: string;
    selectedWeekDate: StoreOperationDateRange | string;
    selectedMonth: StoreOperationDateRange | string;
};

export type StoreOperationPickerDate = string | { format: (format: string) => string };

export const storeOperationTradeTimeOptions: Array<{ label: string; value: StoreOperationTradeTimePreset }> = [
    { label: '实时', value: 'realtime' },
    { label: '昨日', value: 'yesterday' },
    { label: '7日', value: 'last7Days' },
    { label: '30日', value: 'last30Days' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
    { label: '自定义', value: 'custom' }
];

export const storeOperationGeographyTimeOptions: Array<{ label: string; value: StoreOperationGeographyTimePreset }> = [
    { label: '昨日', value: 'yesterday' },
    { label: '7日', value: 'last7Days' },
    { label: '30日', value: 'last30Days' }
];

// 经营数据页多个模块都有时间筛选，这里集中维护 queryType 和日期，避免接口参数写散。
export function buildStoreOperationTradeDateParams(
    preset: StoreOperationTradeTimePreset,
    now = new Date(),
    selection: Partial<StoreOperationDateSelection> = {}
): StoreOperationDateParams {
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);

    if (preset === 'yesterday') {
        const date = formatDate(yesterday);
        return buildParams(0, date);
    }

    if (preset === 'last7Days') {
        return buildParams(1, buildRangeText(addDays(yesterday, -6), yesterday));
    }

    if (preset === 'last30Days') {
        return buildParams(2, buildRangeText(addDays(yesterday, -29), yesterday));
    }

    if (preset === 'week') {
        const selectedWeekRange = readDateRange(selection.selectedWeekDate);
        if (selectedWeekRange) return buildParams(3, selectedWeekRange.join(','));

        const selectedWeekDate = parseDate(readDateValue(selection.selectedWeekDate), today);
        const weekStartDate = startOfWeek(selectedWeekDate);
        return buildParams(3, buildRangeText(weekStartDate, addDays(weekStartDate, 6)));
    }

    if (preset === 'month') {
        const selectedMonthRange = readDateRange(selection.selectedMonth);
        if (selectedMonthRange) return buildParams(4, selectedMonthRange.join(','));

        const selectedMonth = parseDate(readDateValue(selection.selectedMonth), today);
        return buildParams(4, buildRangeText(startOfMonth(selectedMonth), endOfMonth(selectedMonth)));
    }

    if (preset === 'custom') {
        return buildParams(5, selection.customDate || formatDate(today));
    }

    return buildParams(6, formatDate(today));
}

export function buildStoreOperationGeographyDateParams(
    preset: StoreOperationGeographyTimePreset,
    now = new Date()
): StoreOperationDateParams {
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);

    if (preset === 'last7Days') {
        return buildParams(1, buildRangeText(addDays(yesterday, -6), yesterday));
    }

    if (preset === 'last30Days') {
        return buildParams(2, buildRangeText(addDays(yesterday, -29), yesterday));
    }

    const date = formatDate(yesterday);
    return buildParams(0, date);
}

export function isAfterTodayForStoreOperation(value: StoreOperationPickerDate, now = new Date()): boolean {
    const dateText = typeof value === 'string' ? value : value.format('YYYY-MM-DD');
    const date = parseDate(dateText, startOfDay(now));

    return date.getTime() > startOfDay(now).getTime();
}

function buildParams(queryType: number, queryDate: string): StoreOperationDateParams {
    return {
        queryType,
        queryDate
    };
}

function buildRangeText(startDate: Date, endDate: Date): string {
    return `${formatDate(startDate)},${formatDate(endDate)}`;
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

function readDateRange(value: StoreOperationDateRange | string | undefined): StoreOperationDateRange | undefined {
    if (!Array.isArray(value)) return undefined;
    if (!value[0] || !value[1]) return undefined;

    return value;
}

function readDateValue(value: StoreOperationDateRange | string | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
