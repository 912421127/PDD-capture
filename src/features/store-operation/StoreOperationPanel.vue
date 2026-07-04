<template>
    <CapturePanelShell :status-text="statusText" :message="message" :message-type="messageType">
        <template #form>
            <a-space direction="vertical" class="form-stack">
                <label class="field-label">查询日期</label>
                <a-input v-model:value="queryDate" placeholder="例如：2026-07-03" />
            </a-space>
        </template>

        <template #actions>
            <ExportActions
                primary-text="一键采集并导出"
                secondary-text="导出 Excel"
                :loading="task.status === 'running'"
                :disabled="!canExport"
                @primary="captureAndExport"
                @export-json="exportJson"
                @export-file="exportExcel"
            />
        </template>

        <template #summary>
            <a-descriptions-item label="页面">{{ task.isStoreOperationPage ? '经营数据页' : '未检测' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusName }}</a-descriptions-item>
            <a-descriptions-item label="采集内容">{{ task.result ? '交易概况' : '-' }}</a-descriptions-item>
        </template>
    </CapturePanelShell>
</template>

<script setup lang="ts">
import CapturePanelShell from '../../shared/components/CapturePanelShell.vue';
import ExportActions from '../../shared/components/ExportActions.vue';
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
