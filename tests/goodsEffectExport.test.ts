import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toCsv } from '../src/features/goods-effect/goodsEffectExport.ts';

test('goods effect csv translates extra interface fields to readable chinese headers', () => {
    const csv = toCsv([
        {
            goodsId: '123',
            payOrdrAmtPct: '12%',
            payOrdrAmtPctRised: true,
            payOrdrAmtIsPercent: false,
            unknownMetric: 'keep'
        }
    ]);

    const headers = csv.slice(1).split('\n')[0].split(',');

    assert.deepEqual(headers, ['商品ID', '成交金额对比值', '成交金额是否上涨', '成交金额是否百分比', '未知指标']);
});
