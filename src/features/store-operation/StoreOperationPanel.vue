<template>
    <section>
        <a-typography-paragraph class="status-text">{{ statusText }}</a-typography-paragraph>

        <a-space direction="vertical" class="form-stack">
            <label class="field-label">查询日期</label>
            <a-input v-model:value="queryDate" placeholder="例如：2026-07-03" />
        </a-space>

        <a-space direction="vertical" class="action-stack">
            <a-button type="primary" block @click="captureAndExport" :loading="task.status === 'running'">一键采集并导出</a-button>
            <a-space-compact block>
                <a-button block :disabled="!canExport" @click="exportJson">导出 JSON</a-button>
                <a-button block :disabled="!canExport" @click="exportExcel">导出 Excel</a-button>
            </a-space-compact>
        </a-space>

        <a-alert v-if="message" class="tip-box" :type="messageType" show-icon :message="message" />

        <a-descriptions class="summary-box" size="small" bordered :column="1">
            <a-descriptions-item label="页面">{{ task.isStoreOperationPage ? '经营数据页' : '未检测' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusName }}</a-descriptions-item>
            <a-descriptions-item label="采集内容">{{ task.result ? '交易概况' : '-' }}</a-descriptions-item>
        </a-descriptions>
    </section>
</template>

<script setup lang="ts">
import { useStoreOperationCapture } from './useStoreOperationCapture';

const {
    queryDate,
    task,
    message,
    messageType,
    canExport,
    statusText,
    statusName,
    captureAndExport,
    exportJson,
    exportExcel
} = useStoreOperationCapture();
</script>
