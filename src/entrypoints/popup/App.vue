<template>
    <main class="popup-page">
        <a-typography>
            <a-typography-title :level="4">PDD 店铺数据采集</a-typography-title>
            <a-typography-paragraph class="status-text">当前版本仅完成插件框架</a-typography-paragraph>
        </a-typography>
        <a-button type="primary" block>开始配置</a-button>
        <a-alert class="tip-box" type="info" show-icon message="后续会逐步加入登录检测、订单采集、商品采集" />
    </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const isConfiguring = ref(false);
</script>
