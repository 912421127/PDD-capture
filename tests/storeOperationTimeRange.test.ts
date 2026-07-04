import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    buildStoreOperationGeographyDateParams,
    buildStoreOperationTradeDateParams,
    isAfterTodayForStoreOperation
} from '../src/features/store-operation/storeOperationTimeRange.ts';

test('builds trade overview realtime and recent complete-day ranges', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.deepEqual(buildStoreOperationTradeDateParams('realtime', now), {
        queryType: 6,
        queryDate: '2026-07-04'
    });

    assert.deepEqual(buildStoreOperationTradeDateParams('yesterday', now), {
        queryType: 0,
        queryDate: '2026-07-03'
    });

    assert.deepEqual(buildStoreOperationTradeDateParams('last7Days', now), {
        queryType: 1,
        queryDate: '2026-06-27,2026-07-03'
    });

    assert.deepEqual(buildStoreOperationTradeDateParams('last30Days', now), {
        queryType: 2,
        queryDate: '2026-06-04,2026-07-03'
    });
});

test('builds trade overview week month and custom ranges from selected dates', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.deepEqual(buildStoreOperationTradeDateParams('week', now, { selectedWeekDate: ['2026-06-15', '2026-06-21'] }), {
        queryType: 3,
        queryDate: '2026-06-15,2026-06-21'
    });

    assert.deepEqual(buildStoreOperationTradeDateParams('month', now, { selectedMonth: ['2026-02-01', '2026-02-28'] }), {
        queryType: 4,
        queryDate: '2026-02-01,2026-02-28'
    });

    assert.deepEqual(buildStoreOperationTradeDateParams('custom', now, { customDate: '2026-06-18' }), {
        queryType: 5,
        queryDate: '2026-06-18'
    });
});

test('builds geography ranges from supported presets', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.deepEqual(buildStoreOperationGeographyDateParams('yesterday', now), {
        queryType: 0,
        queryDate: '2026-07-03'
    });

    assert.deepEqual(buildStoreOperationGeographyDateParams('last7Days', now), {
        queryType: 1,
        queryDate: '2026-06-27,2026-07-03'
    });

    assert.deepEqual(buildStoreOperationGeographyDateParams('last30Days', now), {
        queryType: 2,
        queryDate: '2026-06-04,2026-07-03'
    });
});

test('detects dates after today for store operation pickers', () => {
    const now = new Date('2026-07-04T10:00:00+08:00');

    assert.equal(isAfterTodayForStoreOperation('2026-07-04', now), false);
    assert.equal(isAfterTodayForStoreOperation('2026-07-05', now), true);
    assert.equal(isAfterTodayForStoreOperation({ format: () => '2026-07-05' }, now), true);
});
