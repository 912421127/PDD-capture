import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildStoreOperationCsvFiles, buildStoreOperationWorkbookData } from '../src/features/store-operation/storeOperationExport.ts';
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
            yesterdayRtList: [{ stateDate: '2026-07-03', payOrdrAmt: '80.00', payOrdrAmtPct: '25%' }],
            todayPerHourRtList: [{ stateDate: '2026-07-04', hr: 10, payOrdrCnt: '2' }],
            yesterdayPerHourRtList: [{ stateDate: '2026-07-03', hr: 10, payOrdrCnt: '1' }]
        },
        orderInfo: {
            readyDate: '2026-07-04 10:03:04',
            notPayOrderCnt: 4,
            notPayOrderAmountCnt: 72610,
            settlementShippingAmount: 3921295
        },
        leadPayInfo: {
            readyDate: '2026-07-03',
            allLeadPayPplCnt1m: 31,
            allLeadPayOrdrAmt1m: 656533
        },
        geographyDistribution: {
            geographyDistributionVOList: [
                {
                    provinceName: '河北',
                    statDate: '2026-07-03',
                    cfmOrdrAmt: 1056,
                    cfmOrdrCnt: 4,
                    cfmOrdrUsrCnt: 4,
                    cfmOrdrAop: 264,
                    cfmOrdrAup: 264
                }
            ]
        },
        annualSales: {
            manageConfigureVOList: [],
            currentDataVOList: [
                { month: 1, year: 2026, payOrdrAmt: '16143.83' },
                { month: 7, year: 2026, payOrdrAmt: '21235.76' }
            ],
            historyDataVOList: [
                { month: 1, year: 2025, payOrdrAmt: '0.0' },
                { month: 7, year: 2025, payOrdrAmt: '17562.2' },
                { month: 12, year: 2025, payOrdrAmt: '15737.46' }
            ]
        }
    };

    const workbook = buildStoreOperationWorkbookData(result);

    assert.deepEqual(
        workbook.map(sheet => sheet.name),
        ['指标卡片', '趋势累计', '趋势分小时', '年度经营情况', '订单数据', '催付数据', '地区交易数据']
    );

    assert.deepEqual(workbook[0].rows[0], ['指标', '当前值', '对比值', '是否百分比', '是否上涨']);
    assert.deepEqual(workbook[0].rows[1], ['成交金额', '100.50', '12%', false, true]);

    assert.deepEqual(workbook[1].rows[0].slice(0, 4), ['数据类型', '统计日期', '成交金额', '成交金额对比值']);
    assert.equal(workbook[1].rows[1][0], '今日累计');
    assert.equal(workbook[1].rows[2][0], '昨日累计');

    assert.deepEqual(workbook[2].rows[0].slice(0, 4), ['数据类型', '统计日期', '小时', '成交订单数']);
    assert.equal(workbook[2].rows[1][0], '今日分小时');
    assert.equal(workbook[2].rows[2][0], '昨日分小时');

    assert.deepEqual(workbook[3].rows[0], ['月份', '25年成交额(元)', '26年成交额(元)', '26年目标成交额(元)', '每月完成度']);
    assert.deepEqual(workbook[3].rows[1], ['1月', '0.0', '16143.83', 0, '--%']);
    assert.deepEqual(workbook[3].rows[7], ['7月', '17562.2', '21235.76', 0, '--%']);
    assert.deepEqual(workbook[3].rows[12], ['12月', '15737.46', null, 0, '--%']);

    assert.deepEqual(workbook[4].rows[0], ['统计时间', '下单待付款订单数', '下单待付款金额', '待到账金额']);
    assert.deepEqual(workbook[4].rows[1], ['2026-07-04 10:03:04', 4, 726.1, 39212.95]);

    assert.deepEqual(workbook[5].rows[0], ['统计日期', '引导下单人数', '引导成交金额']);
    assert.deepEqual(workbook[5].rows[1], ['2026-07-03', 31, 6565.33]);

    assert.deepEqual(workbook[6].rows[0], ['省份', '统计日期', '成交金额(元)', '成交订单数', '成交买家数', '成交订单单价(元)', '成交客单价(元)']);
    assert.deepEqual(workbook[6].rows[1], ['河北', '2026-07-03', 1056, 4, 4, 264, 264]);

    const trendCsv = buildStoreOperationCsvFiles(result)[1].data;
    assert.match(trendCsv.split('\n')[0], /成交金额对比值/);
});
