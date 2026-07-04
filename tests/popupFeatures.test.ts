import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getDefaultPopupFeature } from '../src/entrypoints/popup/popupFeatures.ts';

test('selects goods effect feature for the goods effect page', () => {
    assert.equal(getDefaultPopupFeature('https://mms.pinduoduo.com/sycm/goods_effect'), 'goods-effect');
});

test('selects store operation feature for the store operation page', () => {
    assert.equal(getDefaultPopupFeature('https://mms.pinduoduo.com/sycm/stores_data/operation'), 'store-operation');
});

test('keeps popup unselected for unmatched or invalid urls', () => {
    assert.equal(getDefaultPopupFeature('https://mms.pinduoduo.com/sycm/other_page'), '');
    assert.equal(getDefaultPopupFeature('not a url'), '');
    assert.equal(getDefaultPopupFeature(''), '');
});
