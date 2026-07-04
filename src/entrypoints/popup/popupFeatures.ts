import { isGoodsEffectPage } from '../../features/goods-effect/goodsEffectExport.ts';
import { isStoreOperationPage } from '../../features/store-operation/storeOperationExport.ts';

export type PopupFeatureKey = '' | 'goods-effect' | 'store-operation';

export type PopupFeatureOption = {
    label: string;
    value: Exclude<PopupFeatureKey, ''>;
    description: string;
};

// popup 只在这里登记功能，后续新增页面采集时先加选项，再接入对应面板。
export const POPUP_FEATURE_OPTIONS: PopupFeatureOption[] = [
    {
        label: '商品数据页面采集',
        value: 'goods-effect',
        description: '打开 PDD 商品数据页面后，采集并导出商品数据'
    },
    {
        label: '经营数据页面采集',
        value: 'store-operation',
        description: '打开 PDD 经营数据页面后，采集并导出交易概况'
    }
];

export function getDefaultPopupFeature(pageUrl = ''): PopupFeatureKey {
    // 打开 popup 时按当前页面精确匹配采集功能；没有匹配时保持未选择，避免误导用户。
    if (isGoodsEffectPage(pageUrl)) return 'goods-effect';
    if (isStoreOperationPage(pageUrl)) return 'store-operation';
    return '';
}
