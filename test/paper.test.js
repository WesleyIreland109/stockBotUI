import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaperReader } from '../paper.js';

test('missing credentials never send a request', async () => {
    const read = createPaperReader({ env: {}, request: () => assert.fail('unexpected network call') });
    await assert.rejects(read(), /not been configured/);
});

test('only reads paper host, omits identifiers, deduplicates and caches requests', async () => {
    const calls = [];
    const read = createPaperReader({ env: { APCA_API_KEY_ID: 'test', APCA_API_SECRET_KEY: 'secret' }, request: async (url, options) => {
        calls.push(url);
        assert.ok(url.startsWith('https://paper-api.alpaca.markets/v2/'));
        assert.equal(options.method, 'GET');
        assert.equal(options.redirect, 'error');
        const value = url.endsWith('/account') ? { status: 'ACTIVE', id: 'private-account', equity: '100', last_equity: '95', cash: '80' }
            : url.endsWith('/clock') ? { is_open: false } : [];
        return { ok: true, json: async () => value };
    } });
    const [a, b] = await Promise.all([read(), read()]);
    assert.equal(a, b);
    assert.equal(a.account.equityChange, 5);
    assert.equal(a.account.buyingPower, null);
    assert.equal(a.execution, 'disabled');
    assert.ok(!JSON.stringify(a).includes('private-account'));
    await read();
    assert.equal(calls.length, 4);
});

test('does not return upstream secrets in errors and retries failed requests', async () => {
    let calls = 0;
    const read = createPaperReader({ env: { APCA_API_KEY_ID: 'test', APCA_API_SECRET_KEY: 'secret' }, request: async () => {
        calls++;
        return { ok: false, status: 401, json: async () => ({ secret: 'private' }) };
    } });
    await assert.rejects(read(), /credentials were rejected/);
    await assert.rejects(read(), /credentials were rejected/);
    assert.equal(calls, 8);
});
