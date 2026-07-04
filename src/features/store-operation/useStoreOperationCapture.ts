import { computed, reactive, ref } from 'vue';
import { downloadBinaryFile, downloadTextFile } from '../../shared/download';
import { buildExportFilename, type ExportFormat } from '../../shared/exportFilename';
import { readCurrentTabUrl } from '../../shared/page';
import { readPddDigitMapFromPage } from '../goods-effect/goodsEffectDigitMap';
import {
    fetchStoreOperationTradeOverview,
    STORE_OPERATION_ANNUAL_SALES_API,
    STORE_OPERATION_GEOGRAPHY_API,
    STORE_OPERATION_LEAD_PAY_API,
    STORE_OPERATION_NOT_PAY_ORDER_API,
    STORE_OPERATION_TRADE_INFO_API,
    STORE_OPERATION_TRADE_LIST_API
} from './storeOperationApi';
import {
    buildStoreOperationGeographyDateParams,
    buildStoreOperationTradeDateParams,
    isAfterTodayForStoreOperation,
    storeOperationGeographyTimeOptions,
    storeOperationTradeTimeOptions
} from './storeOperationTimeRange';
import type {
    StoreOperationDateRange,
    StoreOperationGeographyTimePreset,
    StoreOperationPickerDate,
    StoreOperationTradeTimePreset
} from './storeOperationTimeRange';
import {
    buildStoreOperationCsvFiles,
    buildStoreOperationXlsx,
    isStoreOperationPage,
    normalizeStoreOperationResult,
    toStoreOperationJson
} from './storeOperationExport';
import {
    assertStoreOperationTokenCacheReady,
    readOptionalStoreOperationTokenFromCache,
    readStoreOperationTokenCacheFromPage,
    readStoreOperationTokenFromCache
} from './storeOperationToken';
import type { StoreOperationApiParams, StoreOperationCaptureTask, StoreOperationTokenCache } from './storeOperationTypes';

const STORE_OPERATION_TOKEN_REQUIREMENTS = [
    { apiUrl: STORE_OPERATION_TRADE_INFO_API, label: '交易概况' },
    { apiUrl: STORE_OPERATION_TRADE_LIST_API, label: '交易趋势' }
];

export function useStoreOperationCapture() {
    const today = buildStoreOperationTradeDateParams('realtime').queryDate;

    const tradeTimePreset = ref<StoreOperationTradeTimePreset>('realtime');
    const geographyTimePreset = ref<StoreOperationGeographyTimePreset>('yesterday');
    const customDate = ref(today);
    const weekPickerDate = ref();
    const monthPickerDate = ref();
    const selectedWeekDate = ref<StoreOperationDateRange>(readRangeFromQueryDate(buildStoreOperationTradeDateParams('week').queryDate));
    const selectedMonth = ref<StoreOperationDateRange>(readRangeFromQueryDate(buildStoreOperationTradeDateParams('month').queryDate));
    const isCustomTime = computed(() => tradeTimePreset.value === 'custom');
    const isWeekTime = computed(() => tradeTimePreset.value === 'week');
    const isMonthTime = computed(() => tradeTimePreset.value === 'month');
    const tokenCache = ref<StoreOperationTokenCache>();

    const task = reactive<StoreOperationCaptureTask>({
        status: 'idle',
        pageUrl: '',
        isStoreOperationPage: false,
        updatedAt: Date.now()
    });

    const message = ref('');
    const messageType = ref<'success' | 'info' | 'warning' | 'error'>('info');

    const canExport = computed(() => Boolean(task.result));

    const statusText = computed(() => {
        if (task.status === 'running') return '正在采集经营数据页交易概况';
        if (task.status === 'success') return '交易概况采集完成';
        if (task.status === 'failed') return task.error || '采集失败';
        return '打开 PDD 经营数据页后，可以一键采集并导出交易概况';
    });

    const statusName = computed(() => {
        const names = {
            idle: '待开始',
            running: '采集中',
            success: '已完成',
            failed: '失败'
        };
        return names[task.status];
    });

    async function captureAndExport() {
        await startCapture();

        if (task.status === 'success' && task.result) {
            exportJson();
            await exportExcel();
        }
    }

    async function startCapture() {
        task.status = 'running';
        task.result = undefined;
        task.error = undefined;
        clearMessage();

        try {
            const pageUrl = await readCurrentTabUrl();
            task.pageUrl = pageUrl;
            task.isStoreOperationPage = isStoreOperationPage(pageUrl);

            if (!task.isStoreOperationPage) {
                throw new Error('当前标签页不是 PDD 经营数据页，请打开经营数据页后重试');
            }

            // 每次采集都重新读取最新缓存，避免 popup 复用上一次失败时留下的残缺参数。
            tokenCache.value = await readStoreOperationTokenCacheFromPage();

            // 复用商品数据页的动态字体读取，统一处理 PDD 加密数字。
            const digitMap = await readPddDigitMapFromPage();
            const rawResult = await fetchStoreOperationTradeOverview(buildParams());

            task.status = 'success';
            task.result = normalizeStoreOperationResult(rawResult, digitMap);
            task.updatedAt = Date.now();
            showMessage('success', '交易概况采集完成，数字已解码');
        } catch (error) {
            failTask(error);
        }
    }

    function exportJson() {
        if (!task.result) return;
        exportData('json');
    }

    async function exportExcel() {
        if (!task.result) return;

        try {
            await exportData('xlsx');
        } catch (error) {
            failTask(error);
        }
    }

    async function exportData(format: ExportFormat) {
        if (!task.result) return;

        if (format === 'json') {
            const filename = buildExportFilename('经营数据页面导出', 'json');
            downloadTextFile(filename, toStoreOperationJson(task.result), 'application/json;charset=utf-8');
            return;
        }

        if (format === 'xlsx') {
            const filename = buildExportFilename('交易概况', 'xlsx');
            downloadBinaryFile(
                filename,
                await buildStoreOperationXlsx(task.result),
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            return;
        }

        for (const file of buildStoreOperationCsvFiles(task.result)) {
            const filename = buildExportFilename(file.name, 'csv');
            downloadTextFile(filename, file.data, 'text/csv;charset=utf-8');
        }
    }

    function buildParams(): StoreOperationApiParams {
        // 交易概况和地区交易数据在 PDD 页面上是两个独立筛选器，接口参数也分开构造。
        const tradeQuery = buildStoreOperationTradeDateParams(tradeTimePreset.value, new Date(), {
            customDate: customDate.value,
            selectedWeekDate: selectedWeekDate.value,
            selectedMonth: selectedMonth.value
        });
        const geographyQuery = buildStoreOperationGeographyDateParams(geographyTimePreset.value);
        const cache = tokenCache.value || {};

        assertStoreOperationTokenCacheReady(cache, STORE_OPERATION_TOKEN_REQUIREMENTS);

        return {
            tradeQuery,
            geographyQuery,
            tradeInfoToken: readStoreOperationTokenFromCache(cache, STORE_OPERATION_TRADE_INFO_API),
            tradeListToken: readStoreOperationTokenFromCache(cache, STORE_OPERATION_TRADE_LIST_API),
            notPayOrderToken: readOptionalStoreOperationTokenFromCache(cache, STORE_OPERATION_NOT_PAY_ORDER_API),
            leadPayToken: readOptionalStoreOperationTokenFromCache(cache, STORE_OPERATION_LEAD_PAY_API),
            geographyToken: readOptionalStoreOperationTokenFromCache(cache, STORE_OPERATION_GEOGRAPHY_API),
            annualSalesToken: readOptionalStoreOperationTokenFromCache(cache, STORE_OPERATION_ANNUAL_SALES_API)
        };
    }

    function changeSelectedWeekDate(date: unknown, dateString: string | string[]) {
        const value = readPickerDate(date, dateString, 'YYYY-MM-DD');
        if (!value) return;

        selectedWeekDate.value = readRangeFromQueryDate(buildStoreOperationTradeDateParams('week', new Date(), { selectedWeekDate: value }).queryDate);
    }

    function changeSelectedMonth(date: unknown, dateString: string | string[]) {
        const value = readPickerDate(date, dateString, 'YYYY-MM');
        if (!value) return;

        selectedMonth.value = readRangeFromQueryDate(buildStoreOperationTradeDateParams('month', new Date(), { selectedMonth: value }).queryDate);
    }

    function disabledFutureDate(current: StoreOperationPickerDate) {
        // 未来日期在 PDD 页面没有数据，插件这里直接禁用，减少接口失败。
        return isAfterTodayForStoreOperation(current);
    }

    function failTask(error: unknown) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : String(error);
        task.updatedAt = Date.now();
        showMessage('error', task.error);
    }

    function clearMessage() {
        message.value = '';
    }

    function showMessage(type: typeof messageType.value, text: string) {
        messageType.value = type;
        message.value = text;
    }

    return {
        tradeTimePreset,
        geographyTimePreset,
        isCustomTime,
        isWeekTime,
        isMonthTime,
        storeOperationTradeTimeOptions,
        storeOperationGeographyTimeOptions,
        customDate,
        weekPickerDate,
        monthPickerDate,
        changeSelectedWeekDate,
        changeSelectedMonth,
        disabledFutureDate,
        task,
        message,
        messageType,
        canExport,
        statusText,
        statusName,
        captureAndExport,
        startCapture,
        exportJson,
        exportExcel
    };
}

function readRangeFromQueryDate(queryDate: string): StoreOperationDateRange {
    const parts = queryDate.split(',');
    return [parts[0] || '', parts[1] || parts[0] || ''];
}

function readPickerDate(date: unknown, dateString: string | string[], format: string): string {
    if (hasFormatFunction(date)) return date.format(format);

    return Array.isArray(dateString) ? dateString[0] || '' : dateString;
}

function hasFormatFunction(value: unknown): value is { format: (format: string) => string } {
    return Boolean(value && typeof value === 'object' && 'format' in value && typeof value.format === 'function');
}
