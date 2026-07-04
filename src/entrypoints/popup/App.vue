<template>
    <main class="popup-page">
        <a-typography>
            <a-typography-title :level="4">PDD 店铺数据采集</a-typography-title>
            <a-typography-paragraph class="status-text">选择功能后执行采集导出</a-typography-paragraph>
        </a-typography>

        <section class="feature-picker">
            <label class="field-label">功能</label>
            <a-select
                v-model:value="activeFeature"
                class="full-input"
                :options="POPUP_FEATURE_OPTIONS"
                placeholder="请选择要使用的采集功能"
            />
            <a-typography-paragraph v-if="activeFeatureDescription" class="status-text feature-description">
                {{ activeFeatureDescription }}
            </a-typography-paragraph>
        </section>

        <GoodsEffectPanel v-if="activeFeature === 'goods-effect'" />
        <StoreOperationPanel v-if="activeFeature === 'store-operation'" />
    </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import GoodsEffectPanel from '../../features/goods-effect/GoodsEffectPanel.vue';
import StoreOperationPanel from '../../features/store-operation/StoreOperationPanel.vue';
import { getDefaultPopupFeature, POPUP_FEATURE_OPTIONS, type PopupFeatureKey } from './popupFeatures';

const activeFeature = ref<PopupFeatureKey>(getDefaultPopupFeature());

const activeFeatureDescription = computed(() => {
    return POPUP_FEATURE_OPTIONS.find(option => option.value === activeFeature.value)?.description || '';
});
</script>
