import { computed, reactive, ref } from 'vue';
import { downloadTextFile } from '../../shared/download';
import { buildExportFilename, type ExportFormat } from '../../shared/exportFilename';
import { readCurrentTabUrl } from '../../shared/page';
import { fetchAllGoodsEffect } from './goodsEffectApi';
import { isGoodsEffectPage, normalizeGoodsEffectRecord, toCsv } from './goodsEffectExport';
import { readPddDigitMapFromPage } from './goodsEffectDigitMap';
import {
    buildGoodsEffectDateParams,
    GOODS_EFFECT_PAGE_SIZE,
    goodsEffectTimeOptions,
    isAfterTodayForGoodsEffect
} from './goodsEffectTimeRange';
import { readGoodsEffectTokenFromPage } from './goodsEffectToken';
import type { GoodsEffectDateRange, GoodsEffectPickerDate, GoodsEffectTimePreset } from './goodsEffectTimeRange';
import type { GoodsEffectApiParams, GoodsEffectCaptureTask, GoodsEffectToken } from './goodsEffectTypes';

// 商品效果采集面板的全部状态和动作都放在这里。
// popup 只负责展示组件，后续新增功能不会继续挤进 App.vue。
export function useGoodsEffectCapture() {
    const today = buildGoodsEffectDateParams('realtime').startDate;

    // 页面表单值。
    const timePreset = ref<GoodsEffectTimePreset>('realtime');
    const customDate = ref(today);
    const weekPickerDate = ref();
    const monthPickerDate = ref();
    const selectedWeekDate = ref<GoodsEffectDateRange>(readRangeFromDateParams(buildGoodsEffectDateParams('week')));
    const selectedMonth = ref<GoodsEffectDateRange>(readRangeFromDateParams(buildGoodsEffectDateParams('month')));
    const isCustomTime = computed(() => timePreset.value === 'custom');
    const isWeekTime = computed(() => timePreset.value === 'week');
    const isMonthTime = computed(() => timePreset.value === 'month');

    // PDD 接口需要的动态风控参数，由 background 监听页面请求后缓存。
    const crawlerInfo = ref('');
    const antiContent = ref('');
    const webSpiderRule = ref('');

    const task = reactive<GoodsEffectCaptureTask>({
        status: 'idle',
        pageUrl: '',
        isGoodsEffectPage: false,
        total: 0,
        currentPage: 0,
        pageSize: GOODS_EFFECT_PAGE_SIZE,
        records: [],
        updatedAt: Date.now()
    });

    const message = ref('');
    const messageType = ref<'success' | 'info' | 'warning' | 'error'>('info');

    const canExport = computed(() => task.records.length > 0);

    const statusText = computed(() => {
        if (task.status === 'running') return '正在按固定接口采集全部分页数据';
        if (task.status === 'success') return `采集完成，共 ${task.records.length} 条`;
        if (task.status === 'failed') return task.error || '采集失败';
        return '打开 PDD 商品效果页后，可以一键采集并导出';
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

    async function captureAndExportCsv() {
        await startCapture();

        if (task.status === 'success' && task.records.length > 0) {
            exportCsv();
        }
    }

    async function startCapture() {
        task.status = 'running';
        task.records = [];
        task.total = 0;
        task.currentPage = 0;
        task.pageSize = GOODS_EFFECT_PAGE_SIZE;
        task.error = undefined;
        clearMessage();

        try {
            const pageUrl = await readCurrentTabUrl();
            task.pageUrl = pageUrl;
            task.isGoodsEffectPage = isGoodsEffectPage(pageUrl);

            if (!task.isGoodsEffectPage) {
                throw new Error('当前标签页不是 PDD 商品效果页，请打开商品效果页后重试');
            }

            // 采集前自动读取风控参数，用户不需要手动复制 anti-content。
            if (!hasToken()) {
                const token = await readGoodsEffectTokenFromPage();
                applyToken(token);
            }

            // 每次采集前都读取当前页面最新字体，避免 PDD 换字体后导出乱码。
            const digitMap = await readPddDigitMapFromPage();
            const result = await fetchAllGoodsEffect(buildParams());

            task.status = 'success';
            task.records = result.records.map(record => normalizeGoodsEffectRecord(record, digitMap));
            task.total = result.total;
            task.currentPage = result.currentPage;
            task.pageSize = result.pageSize;
            task.updatedAt = Date.now();
            showMessage('success', `采集完成：${task.records.length}/${task.total} 条，数字已解码`);
        } catch (error) {
            failTask(error);
        }
    }

    function exportJson() {
        exportData('json');
    }

    function exportCsv() {
        exportData('csv');
    }

    function exportData(format: ExportFormat) {
        // 文件名用中文功能标识 + 北京时间，方便用户直接从下载列表里识别来源。
        const filename = buildExportFilename('商品数据页面导出', format);
        const data = format === 'csv' ? toCsv(task.records) : JSON.stringify(task.records, null, 2);
        const type = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';

        downloadTextFile(filename, data, type);
    }

    function buildParams(): GoodsEffectApiParams {
        // 时间范围只允许来自页面固定选项，避免用户随手输入导致接口参数不符合 PDD 页面行为。
        const dateParams = buildGoodsEffectDateParams(timePreset.value, new Date(), {
            customDate: customDate.value,
            selectedWeekDate: selectedWeekDate.value,
            selectedMonth: selectedMonth.value
        });

        return {
            ...dateParams,
            crawlerInfo: crawlerInfo.value.trim(),
            antiContent: antiContent.value.trim(),
            webSpiderRule: webSpiderRule.value.trim()
        };
    }

    function changeSelectedWeekDate(date: unknown, dateString: string | string[]) {
        const value = readPickerDate(date, dateString, 'YYYY-MM-DD');
        if (!value) return;

        selectedWeekDate.value = readRangeFromDateParams(buildGoodsEffectDateParams('week', new Date(), { selectedWeekDate: value }));
    }

    function changeSelectedMonth(date: unknown, dateString: string | string[]) {
        const value = readPickerDate(date, dateString, 'YYYY-MM');
        if (!value) return;

        selectedMonth.value = readRangeFromDateParams(buildGoodsEffectDateParams('month', new Date(), { selectedMonth: value }));
    }

    function disabledFutureDate(current: GoodsEffectPickerDate) {
        // 日期选择器只允许选今天及以前，避免传入 PDD 还没有数据的未来日期。
        return isAfterTodayForGoodsEffect(current);
    }

    function hasToken(): boolean {
        return Boolean(crawlerInfo.value && antiContent.value && webSpiderRule.value);
    }

    function applyToken(token: GoodsEffectToken) {
        crawlerInfo.value = token.crawlerInfo;
        antiContent.value = token.antiContent;
        webSpiderRule.value = token.webSpiderRule;
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
        timePreset,
        isCustomTime,
        isWeekTime,
        isMonthTime,
        goodsEffectTimeOptions,
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
        captureAndExportCsv,
        exportJson,
        exportCsv
    };
}

function readRangeFromDateParams(params: Pick<GoodsEffectApiParams, 'startDate' | 'endDate'>): GoodsEffectDateRange {
    return [params.startDate, params.endDate];
}

function readPickerDate(date: unknown, dateString: string | string[], format: string): string {
    if (hasFormatFunction(date)) return date.format(format);

    return Array.isArray(dateString) ? dateString[0] || '' : dateString;
}

function hasFormatFunction(value: unknown): value is { format: (format: string) => string } {
    return Boolean(value && typeof value === 'object' && 'format' in value && typeof value.format === 'function');
}
