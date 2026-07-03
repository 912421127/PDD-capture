<template>
    <main class="popup-page">
        <a-typography>
            <a-typography-title :level="4">PDD 商品效果采集</a-typography-title>
            <a-typography-paragraph class="status-text">{{ statusText }}</a-typography-paragraph>
        </a-typography>

        <a-space direction="vertical" class="form-stack">
            <label class="field-label">开始日期</label>
            <a-input v-model:value="startDate" placeholder="例如：2026-07-03" />

            <label class="field-label">结束日期</label>
            <a-input v-model:value="endDate" placeholder="例如：2026-07-03" />

            <label class="field-label">每页数量</label>
            <a-input-number v-model:value="pageSize" class="full-input" :min="1" :max="100" />

            <label class="field-label">anti-content / crawlerInfo</label>
            <a-textarea v-model:value="crawlerInfo" :rows="3" placeholder="从 Network 请求头里复制 anti-content" />

            <label class="field-label">webspiderrule</label>
            <a-textarea v-model:value="webSpiderRule" :rows="2" placeholder="从 Network 请求头里复制 webspiderrule" />
        </a-space>

        <a-space direction="vertical" class="action-stack">
            <a-button block @click="detectPage" :loading="task.status === 'checking'">检测页面</a-button>
            <a-button type="primary" block @click="startCapture" :loading="task.status === 'running'">开始采集</a-button>
            <a-space-compact block>
                <a-button block :disabled="!canExport" @click="exportData('json')">导出 JSON</a-button>
                <a-button block :disabled="!canExport" @click="exportData('csv')">导出 CSV</a-button>
            </a-space-compact>
        </a-space>

        <a-alert v-if="message" class="tip-box" :type="messageType" show-icon :message="message" />

        <a-descriptions class="summary-box" size="small" bordered :column="1">
            <a-descriptions-item label="页面">{{ task.isGoodsEffectPage ? '商品效果页' : '未检测' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusName }}</a-descriptions-item>
            <a-descriptions-item label="已采集">{{ task.records.length }}</a-descriptions-item>
            <a-descriptions-item label="总数">{{ task.total || '-' }}</a-descriptions-item>
        </a-descriptions>
    </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { browser } from 'wxt/browser';
import { fetchAllGoodsEffect } from '../../services/goodsEffectApi';
import { isGoodsEffectPage, normalizeGoodsEffectRecord, toCsv } from '../../services/goodsEffectCapture';
import type { GoodsEffectApiParams, GoodsEffectCaptureTask } from '../../types/goodsEffect';

// 默认日期先取今天，后面你想加日期选择器时，只需要替换这里的输入控件。
const today = new Date().toISOString().slice(0, 10);

// 页面上的表单值。
const startDate = ref(today);
const endDate = ref(today);
const pageSize = ref(50);
const crawlerInfo = ref('');
const webSpiderRule = ref('');

// task 保存当前采集任务状态，popup 的展示都从这里读取。
const task = reactive<GoodsEffectCaptureTask>({
    status: 'idle',
    pageUrl: '',
    isGoodsEffectPage: false,
    total: 0,
    currentPage: 0,
    pageSize: 50,
    records: [],
    updatedAt: Date.now()
});

// message 是页面上的提示文案，messageType 控制提示颜色。
const message = ref('');
const messageType = ref<'success' | 'info' | 'warning' | 'error'>('info');

// 有数据以后，才允许导出。
const canExport = computed(() => task.records.length > 0);

// popup 顶部展示的一句话状态。
const statusText = computed(() => {
    if (task.status === 'running') return '正在按固定接口采集全部分页数据';
    if (task.status === 'success') return `采集完成，共 ${task.records.length} 条`;
    if (task.status === 'failed') return task.error || '采集失败';
    return '打开 PDD 商品效果页后，填写风控字段并开始采集';
});

// 把状态码转成更容易看懂的中文。
const statusName = computed(() => {
    const names = {
        idle: '待开始',
        checking: '检测中',
        running: '采集中',
        success: '已完成',
        failed: '失败'
    };
    return names[task.status];
});

// 点击“检测页面”：只检查当前标签页 URL，不再监听接口。
async function detectPage() {
    task.status = 'checking';
    clearMessage();

    try {
        const pageUrl = await readCurrentTabUrl();
        task.pageUrl = pageUrl;
        task.isGoodsEffectPage = isGoodsEffectPage(pageUrl);
        task.status = 'idle';
        task.updatedAt = Date.now();

        if (!task.isGoodsEffectPage) {
            showMessage('error', '当前标签页不是 PDD 商品效果页，请打开指定页面后重试');
            return;
        }

        showMessage('success', '页面正确，可以开始采集');
    } catch (error) {
        failTask(error);
    }
}

// 点击“开始采集”：把固定接口请求函数注入到当前 PDD 页面里执行。
async function startCapture() {
    task.status = 'running';
    task.records = [];
    task.total = 0;
    task.currentPage = 0;
    task.pageSize = pageSize.value || 50;
    task.error = undefined;
    clearMessage();

    try {
        const pageUrl = await readCurrentTabUrl();
        task.pageUrl = pageUrl;
        task.isGoodsEffectPage = isGoodsEffectPage(pageUrl);

        if (!task.isGoodsEffectPage) {
            throw new Error('当前标签页不是 PDD 商品效果页，请打开商品效果页后重试');
        }

        const result = await fetchAllGoodsEffect(buildParams());
        task.status = 'success';
        task.records = result.records.map(normalizeGoodsEffectRecord);
        task.total = result.total;
        task.currentPage = result.currentPage;
        task.pageSize = result.pageSize;
        task.updatedAt = Date.now();
        showMessage('success', `采集完成：${task.records.length}/${task.total} 条`);
    } catch (error) {
        failTask(error);
    }
}

// 点击导出：直接把 popup 当前保存的数据下载到本地。
function exportData(format: 'json' | 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pdd-goods-effect-${timestamp}.${format}`;
    const data = format === 'csv' ? toCsv(task.records) : JSON.stringify(task.records, null, 2);
    const type = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';

    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// 组装接口参数。queryType=6 表示第一版默认实时查询。
function buildParams(): GoodsEffectApiParams {
    return {
        startDate: startDate.value,
        endDate: endDate.value,
        queryType: 6,
        pageSize: pageSize.value || 50,
        crawlerInfo: crawlerInfo.value.trim(),
        webSpiderRule: webSpiderRule.value.trim()
    };
}

// 读取当前 Chrome 标签页地址。
async function readCurrentTabUrl(): Promise<string> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) throw new Error('没有找到当前标签页地址');
    return tab.url;
}

// 统一处理采集失败。
function failTask(error: unknown) {
    task.status = 'failed';
    task.error = error instanceof Error ? error.message : String(error);
    task.updatedAt = Date.now();
    showMessage('error', task.error);
}

// 清空提示。
function clearMessage() {
    message.value = '';
}

// 显示提示。
function showMessage(type: typeof messageType.value, text: string) {
    messageType.value = type;
    message.value = text;
}
</script>
