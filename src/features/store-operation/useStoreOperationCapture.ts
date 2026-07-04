import { computed, reactive, ref } from 'vue';
import { downloadBinaryFile, downloadTextFile } from '../../shared/download';
import { buildExportFilename, type ExportFormat } from '../../shared/exportFilename';
import { readCurrentTabUrl } from '../../shared/page';
import { readPddDigitMapFromPage } from '../goods-effect/goodsEffectDigitMap';
import {
    fetchStoreOperationTradeOverview,
    STORE_OPERATION_TRADE_INFO_API,
    STORE_OPERATION_TRADE_LIST_API
} from './storeOperationApi';
import {
    buildStoreOperationCsvFiles,
    buildStoreOperationXlsx,
    isStoreOperationPage,
    normalizeStoreOperationResult,
    toStoreOperationJson
} from './storeOperationExport';
import { readStoreOperationTokenCacheFromPage, readStoreOperationTokenFromCache } from './storeOperationToken';
import type { StoreOperationApiParams, StoreOperationCaptureTask, StoreOperationTokenCache } from './storeOperationTypes';

export function useStoreOperationCapture() {
    const today = new Date().toISOString().slice(0, 10);

    const queryDate = ref(today);
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
            exportExcel();
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

            if (!tokenCache.value) {
                tokenCache.value = await readStoreOperationTokenCacheFromPage();
            }

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

    function exportExcel() {
        if (!task.result) return;
        exportData('xlsx');
    }

    function exportData(format: ExportFormat) {
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
                buildStoreOperationXlsx(task.result),
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
        return {
            queryType: 6,
            queryDate: queryDate.value,
            tradeInfoToken: readStoreOperationTokenFromCache(tokenCache.value || {}, STORE_OPERATION_TRADE_INFO_API),
            tradeListToken: readStoreOperationTokenFromCache(tokenCache.value || {}, STORE_OPERATION_TRADE_LIST_API)
        };
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
        queryDate,
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
