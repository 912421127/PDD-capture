<template>
    <section>
        <p class="status-text">{{ statusText }}</p>

        <slot name="form" />

        <slot name="actions" />

        <AAlert v-if="message" class="tip-box" :type="messageType" show-icon :message="message" />

        <ADescriptions class="summary-box" size="small" bordered :column="1">
            <slot name="summary" />
        </ADescriptions>
    </section>
</template>

<script setup lang="ts">
import { Alert as AAlert, Descriptions as ADescriptions } from 'ant-design-vue';

// 这个组件只负责采集面板的通用外壳，不处理任何采集、导出等业务逻辑。
// 各个功能面板通过 slot 放入自己的表单、按钮和概览内容。
defineProps<{
    statusText: string;
    message: string;
    messageType: 'success' | 'info' | 'warning' | 'error';
}>();
</script>
