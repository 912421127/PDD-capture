<template>
    <section>
        <a-typography-paragraph class="status-text">{{ statusText }}</a-typography-paragraph>

        <slot name="form" />

        <slot name="actions" />

        <a-alert v-if="message" class="tip-box" :type="messageType" show-icon :message="message" />

        <a-descriptions class="summary-box" size="small" bordered :column="1">
            <slot name="summary" />
        </a-descriptions>
    </section>
</template>

<script setup lang="ts">
// 这个组件只负责采集面板的通用外壳，不处理任何采集、导出等业务逻辑。
// 各个功能面板通过 slot 放入自己的表单、按钮和概览内容。
defineProps<{
    statusText: string;
    message: string;
    messageType: 'success' | 'info' | 'warning' | 'error';
}>();
</script>
