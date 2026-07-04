<template>
    <ASpace direction="vertical" class="action-stack">
        <AButton type="primary" block :loading="loading" @click="emit('primary')">
            {{ primaryText }}
        </AButton>
        <!-- <ASpaceCompact block>
            <AButton block :disabled="disabled" @click="emit('export-json')">导出 JSON</AButton>
            <AButton block :disabled="disabled" @click="emit('export-file')">{{ secondaryText }}</AButton>
        </ASpaceCompact> -->
    </ASpace>
</template>

<script setup lang="ts">
import { Button as AButton, Space as ASpace } from 'ant-design-vue';

const ASpaceCompact = ASpace.Compact;

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
