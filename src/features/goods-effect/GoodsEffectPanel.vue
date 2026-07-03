<template>
    <section>
        <a-typography-paragraph class="status-text">{{ statusText }}</a-typography-paragraph>

        <a-space direction="vertical" class="form-stack">
            <label class="field-label">开始日期</label>
            <a-input v-model:value="startDate" placeholder="例如：2026-07-03" />

            <label class="field-label">结束日期</label>
            <a-input v-model:value="endDate" placeholder="例如：2026-07-03" />

            <label class="field-label">每页数量</label>
            <a-input-number v-model:value="pageSize" class="full-input" :min="1" :max="100" />
        </a-space>

        <a-space direction="vertical" class="action-stack">
            <a-button type="primary" block @click="captureAndExportCsv" :loading="task.status === 'running'">一键采集并导出 CSV</a-button>
            <a-space-compact block>
                <a-button block :disabled="!canExport" @click="exportJson">导出 JSON</a-button>
                <a-button block :disabled="!canExport" @click="exportCsv">导出 CSV</a-button>
            </a-space-compact>
        </a-space>

        <a-alert v-if="message" class="tip-box" :type="messageType" show-icon :message="message" />

        <a-descriptions class="summary-box" size="small" bordered :column="1">
            <a-descriptions-item label="页面">{{ task.isGoodsEffectPage ? '商品效果页' : '未检测' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusName }}</a-descriptions-item>
            <a-descriptions-item label="已采集">{{ task.records.length }}</a-descriptions-item>
            <a-descriptions-item label="总数">{{ task.total || '-' }}</a-descriptions-item>
        </a-descriptions>
    </section>
</template>

<script setup lang="ts">
import { useGoodsEffectCapture } from './useGoodsEffectCapture';

// 商品效果采集的全部状态和动作，都由 composable 统一管理。
const {
    startDate,
    endDate,
    pageSize,
    task,
    message,
    messageType,
    canExport,
    statusText,
    statusName,
    captureAndExportCsv,
    exportJson,
    exportCsv
} = useGoodsEffectCapture();
</script>
