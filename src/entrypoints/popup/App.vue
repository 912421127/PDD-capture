<template>
    <main class="popup-page">
        <header class="popup-header">
            <h1 class="popup-title">PDD 店铺数据采集</h1>
            <p class="status-text">选择功能后执行采集导出</p>
        </header>

        <section class="feature-picker">
            <label class="field-label" for="popup-feature-select">功能</label>
            <select id="popup-feature-select" v-model="activeFeature" class="native-select">
                <option value="">请选择要使用的采集功能</option>
                <option v-for="option in POPUP_FEATURE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
            <p v-if="activeFeatureDescription" class="status-text feature-description">
                {{ activeFeatureDescription }}
            </p>
        </section>

        <GoodsEffectPanel v-if="activeFeature === 'goods-effect'" />
        <StoreOperationPanel v-if="activeFeature === 'store-operation'" />
    </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { getDefaultPopupFeature, POPUP_FEATURE_OPTIONS, type PopupFeatureKey } from './popupFeatures';

// popup 首屏只加载选择器，具体采集面板等用户选中后再加载，减少打开时的等待。
const GoodsEffectPanel = defineAsyncComponent(() => import('../../features/goods-effect/GoodsEffectPanel.vue'));
const StoreOperationPanel = defineAsyncComponent(() => import('../../features/store-operation/StoreOperationPanel.vue'));

const activeFeature = ref<PopupFeatureKey>(getDefaultPopupFeature());

const activeFeatureDescription = computed(() => {
    return POPUP_FEATURE_OPTIONS.find(option => option.value === activeFeature.value)?.description || '';
});
</script>
