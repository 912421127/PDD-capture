<template>
    <CapturePanelShell :status-text="statusText" :message="message" :message-type="messageType">
        <template #form>
            <ASpace direction="vertical" class="form-stack">
                <label class="field-label">开始日期</label>
                <AInput v-model:value="startDate" placeholder="例如：2026-07-03" />

                <label class="field-label">结束日期</label>
                <AInput v-model:value="endDate" placeholder="例如：2026-07-03" />

                <label class="field-label">每页数量</label>
                <AInputNumber v-model:value="pageSize" class="full-input" :min="1" :max="100" />
            </ASpace>
        </template>

        <template #actions>
            <ExportActions
                primary-text="一键采集并导出 CSV"
                secondary-text="导出 CSV"
                :loading="task.status === 'running'"
                :disabled="!canExport"
                @primary="captureAndExportCsv"
                @export-json="exportJson"
                @export-file="exportCsv"
            />
        </template>

        <template #summary>
            <ADescriptionsItem label="页面">{{ task.isGoodsEffectPage ? '商品效果页' : '未检测' }}</ADescriptionsItem>
            <ADescriptionsItem label="状态">{{ statusName }}</ADescriptionsItem>
            <ADescriptionsItem label="已采集">{{ task.records.length }}</ADescriptionsItem>
            <ADescriptionsItem label="总数">{{ task.total || '-' }}</ADescriptionsItem>
        </template>
    </CapturePanelShell>
</template>

<script setup lang="ts">
import { Descriptions, Input as AInput, InputNumber as AInputNumber, Space as ASpace } from 'ant-design-vue';
import CapturePanelShell from '../../shared/components/CapturePanelShell.vue';
import ExportActions from '../../shared/components/ExportActions.vue';
import { useGoodsEffectCapture } from './useGoodsEffectCapture';

const ADescriptionsItem = Descriptions.Item;

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
