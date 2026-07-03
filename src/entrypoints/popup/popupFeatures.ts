export type PopupFeatureKey = '' | 'goods-effect';

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
    }
];

export function getDefaultPopupFeature(): PopupFeatureKey {
    return '';
}
