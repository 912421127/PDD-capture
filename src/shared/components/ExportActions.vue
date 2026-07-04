<template>
    <a-space direction="vertical" class="action-stack">
        <a-button type="primary" block :loading="loading" @click="emit('primary')">
            {{ primaryText }}
        </a-button>
        <a-space-compact block>
            <a-button block :disabled="disabled" @click="emit('export-json')">导出 JSON</a-button>
            <a-button block :disabled="disabled" @click="emit('export-file')">{{ secondaryText }}</a-button>
        </a-space-compact>
    </a-space>
</template>

<script setup lang="ts">
// 两个采集面板都有同样的按钮结构，抽出来后页面会更短、更容易看懂。
defineProps<{
    primaryText: string;
    secondaryText: string;
    loading: boolean;
    disabled: boolean;
}>();

const emit = defineEmits<{
    primary: [];
    'export-json': [];
    'export-file': [];
}>();
</script>
