import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    assertStoreOperationTokenCacheReady,
    createStoreOperationToken,
    readOptionalStoreOperationTokenFromCache,
    saveStoreOperationTokenToCache
} from '../src/features/store-operation/storeOperationToken.ts';
import type { StoreOperationTokenCache } from '../src/features/store-operation/storeOperationTypes.ts';

const TOKEN_REQUIREMENTS = [
    { apiUrl: 'trade-info-api', label: '交易概况' },
    { apiUrl: 'trade-list-api', label: '交易趋势' },
    { apiUrl: 'geography-api', label: '地区交易数据' }
];

test('passes when required store operation tokens are complete', () => {
    const cache: StoreOperationTokenCache = {
        'trade-info-api': createStoreOperationToken({ antiContent: 'anti-a', webSpiderRule: 'rule-a' }),
        'trade-list-api': createStoreOperationToken({ antiContent: 'anti-b', webSpiderRule: 'rule-b' }),
        'geography-api': createStoreOperationToken({ antiContent: 'anti-c', webSpiderRule: 'rule-c' })
    };

    assert.doesNotThrow(() => assertStoreOperationTokenCacheReady(cache, TOKEN_REQUIREMENTS));
});

test('reports readable module names when store operation tokens are incomplete', () => {
    const cache: StoreOperationTokenCache = {
        'trade-info-api': createStoreOperationToken({ antiContent: 'anti-a', webSpiderRule: 'rule-a' }),
        'trade-list-api': createStoreOperationToken({ webSpiderRule: 'rule-b' })
    };

    assert.throws(
        () => assertStoreOperationTokenCacheReady(cache, TOKEN_REQUIREMENTS),
        error => {
            assert(error instanceof Error);
            assert.match(error.message, /交易趋势/);
            assert.match(error.message, /地区交易数据/);
            assert.doesNotMatch(error.message, /交易概况/);
            assert.match(error.message, /刷新页面或切换一次时间筛选/);
            return true;
        }
    );
});

test('stores the latest store operation token for the same api', () => {
    const cache = saveStoreOperationTokenToCache({}, 'trade-info-api', createStoreOperationToken({ antiContent: 'old-anti', webSpiderRule: 'old-rule' }));
    const nextCache = saveStoreOperationTokenToCache(cache, 'trade-info-api', createStoreOperationToken({ antiContent: 'new-anti', webSpiderRule: 'new-rule' }));

    assert.equal(nextCache['trade-info-api'].antiContent, 'new-anti');
    assert.equal(nextCache['trade-info-api'].webSpiderRule, 'new-rule');
});

test('returns optional token only when the api parameter is ready', () => {
    const cache: StoreOperationTokenCache = {
        'trade-info-api': createStoreOperationToken({ antiContent: 'anti-a', webSpiderRule: 'rule-a' }),
        'geography-api': createStoreOperationToken({ webSpiderRule: 'rule-c' })
    };

    assert.equal(readOptionalStoreOperationTokenFromCache(cache, 'trade-info-api')?.antiContent, 'anti-a');
    assert.equal(readOptionalStoreOperationTokenFromCache(cache, 'geography-api'), undefined);
    assert.equal(readOptionalStoreOperationTokenFromCache(cache, 'annual-api'), undefined);
});
