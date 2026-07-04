import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGoodsEffectDateParams, GOODS_EFFECT_PAGE_SIZE } from '../src/features/goods-effect/goodsEffectTimeRange.ts';

test('builds realtime params with fixed page size', () => {
    assert.equal(GOODS_EFFECT_PAGE_SIZE, 50);
    assert.deepEqual(buildGoodsEffectDateParams('realtime', new Date('2026-07-04T10:00:00+08:00')), {
        startDate: '2026-07-04',
        endDate: '2026-07-04',
        queryType: 6,
        pageSize: 50
    });
});

test('builds recent complete-day ranges', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.deepEqual(buildGoodsEffectDateParams('yesterday', now), {
        startDate: '2026-07-03',
        endDate: '2026-07-03',
        queryType: 0,
        pageSize: 50
    });

    assert.deepEqual(buildGoodsEffectDateParams('last7Days', now), {
        startDate: '2026-06-27',
        endDate: '2026-07-03',
        queryType: 1,
        pageSize: 50
    });

    assert.deepEqual(buildGoodsEffectDateParams('last30Days', now), {
        startDate: '2026-06-04',
        endDate: '2026-07-03',
        queryType: 2,
        pageSize: 50
    });
});

test('builds week month and custom ranges from selected dates', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.deepEqual(buildGoodsEffectDateParams('week', now, { selectedWeekDate: ['2026-06-15', '2026-06-21'] }), {
        startDate: '2026-06-15',
        endDate: '2026-06-21',
        queryType: 3,
        pageSize: 50
    });

    assert.deepEqual(buildGoodsEffectDateParams('month', now, { selectedMonth: ['2026-02-01', '2026-02-28'] }), {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        queryType: 4,
        pageSize: 50
    });

    assert.deepEqual(buildGoodsEffectDateParams('custom', now, { customDate: '2026-06-18' }), {
        startDate: '2026-06-18',
        endDate: '2026-06-18',
        queryType: 5,
        pageSize: 50
    });
});
