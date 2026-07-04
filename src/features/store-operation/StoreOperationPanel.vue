<template>
    <CapturePanelShell :status-text="statusText" :message="message" :message-type="messageType">
        <template #form>
            <ASpace direction="vertical" class="form-stack">
                <label class="field-label">交易概况时间</label>
                <ARadioGroup v-model:value="tradeTimePreset" class="time-preset-group" button-style="solid">
                    <ARadioButton v-for="option in storeOperationTradeTimeOptions" :key="option.value" :value="option.value">
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

                <label class="field-label">地区交易时间</label>
                <ARadioGroup v-model:value="geographyTimePreset" class="time-preset-group" button-style="solid">
                    <ARadioButton v-for="option in storeOperationGeographyTimeOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </ARadioButton>
                </ARadioGroup>
            </ASpace>
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
            <ADescriptionsItem label="页面">{{ task.isStoreOperationPage ? '经营数据页' : '未检测' }}</ADescriptionsItem>
            <ADescriptionsItem label="状态">{{ statusName }}</ADescriptionsItem>
            <ADescriptionsItem label="采集内容">{{ task.result ? '交易概况' : '-' }}</ADescriptionsItem>
        </template>
    </CapturePanelShell>
</template>

<script setup lang="ts">
import { WeekPicker as AWeekPicker, MonthPicker as AMonthPicker, DatePicker as ADatePicker, Descriptions, Radio as ARadio, Space as ASpace } from 'ant-design-vue';
import CapturePanelShell from '../../shared/components/CapturePanelShell.vue';
import ExportActions from '../../shared/components/ExportActions.vue';
import { useStoreOperationCapture } from './useStoreOperationCapture';

const ADescriptionsItem = Descriptions.Item;
const ARadioGroup = ARadio.Group;
const ARadioButton = ARadio.Button;

const {
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
    exportJson,
    exportExcel
} = useStoreOperationCapture();
</script>
