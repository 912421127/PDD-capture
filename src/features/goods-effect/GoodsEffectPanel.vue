<template>
    <CapturePanelShell :status-text="statusText" :message="message" :message-type="messageType">
        <template #form>
            <ASpace direction="vertical" class="form-stack">
                <label class="field-label">时间范围</label>
                <ARadioGroup v-model:value="timePreset" class="time-preset-group" button-style="solid">
                    <ARadioButton v-for="option in goodsEffectTimeOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </ARadioButton>
                </ARadioGroup>

                <template v-if="isWeekTime">
                    <label class="field-label">选择周</label>
                    <AWeekPicker v-model:value="weekPickerDate" class="full-input" placeholder="请选择周" :disabled-date="disabledFutureDate" @change="changeSelectedWeekDate" />
                </template>

                <template v-if="isMonthTime">
                    <label class="field-label">选择月份</label>
                    <AMonthPicker v-model:value="monthPickerDate" class="full-input" placeholder="请选择月份" :disabled-date="disabledFutureDate" @change="changeSelectedMonth" />
                </template>

                <template v-if="isCustomTime">
                    <label class="field-label">选择日期</label>
                    <ADatePicker v-model:value="customDate" class="full-input" value-format="YYYY-MM-DD" placeholder="请选择日期" :disabled-date="disabledFutureDate" />
                </template>
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
import { WeekPicker as AWeekPicker, MonthPicker as AMonthPicker, DatePicker as ADatePicker, Descriptions, Radio as ARadio, Space as ASpace } from 'ant-design-vue';
import CapturePanelShell from '../../shared/components/CapturePanelShell.vue';
import ExportActions from '../../shared/components/ExportActions.vue';
import { useGoodsEffectCapture } from './useGoodsEffectCapture';

const ADescriptionsItem = Descriptions.Item;
const ARadioGroup = ARadio.Group;
const ARadioButton = ARadio.Button;

// 商品效果采集的全部状态和动作，都由 composable 统一管理。
const {
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
} = useGoodsEffectCapture();
</script>
