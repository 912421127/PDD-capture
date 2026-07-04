import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildStoreOperationWorkbookData } from '../src/features/store-operation/storeOperationExport.ts';
import type { StoreOperationResult } from '../src/features/store-operation/storeOperationTypes.ts';

test('builds workbook data with the three trade overview sheets', () => {
    const result: StoreOperationResult = {
        tradeInfo: {
            payOrdrAmt: '100.50',
            payOrdrAmtPct: '12%',
            payOrdrAmtIsPercent: false,
            payOrdrAmtPctRised: true
        },
        tradeInfoDisplay: {},
        tradeTrend: {
            todayRtList: [{ stateDate: '2026-07-04', payOrdrAmt: '100.50' }],
            yesterdayRtList: [{ stateDate: '2026-07-03', payOrdrAmt: '80.00' }],
            todayPerHourRtList: [{ stateDate: '2026-07-04', hr: 10, payOrdrCnt: '2' }],
            yesterdayPerHourRtList: [{ stateDate: '2026-07-03', hr: 10, payOrdrCnt: '1' }]
        }
    };

    const workbook = buildStoreOperationWorkbookData(result);

    assert.deepEqual(
        workbook.map(sheet => sheet.name),
        ['指标卡片', '趋势累计', '趋势分小时']
    );

    assert.deepEqual(workbook[0].rows[0], ['指标', '当前值', '对比值', '是否百分比', '是否上涨']);
    assert.deepEqual(workbook[0].rows[1], ['成交金额', '100.50', '12%', false, true]);

    assert.deepEqual(workbook[1].rows[0].slice(0, 4), ['数据类型', '统计日期', '成交金额']);
    assert.equal(workbook[1].rows[1][0], '今日累计');
    assert.equal(workbook[1].rows[2][0], '昨日累计');

    assert.deepEqual(workbook[2].rows[0].slice(0, 4), ['数据类型', '统计日期', '小时', '成交订单数']);
    assert.equal(workbook[2].rows[1][0], '今日分小时');
    assert.equal(workbook[2].rows[2][0], '昨日分小时');
});
