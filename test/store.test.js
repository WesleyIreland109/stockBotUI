import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../engine/store.js';

test('database survives reopening and excludes account identity from public snapshot', () => {
    const directory = mkdtempSync(join(tmpdir(), 'stockbot-test-'));
    const path = join(directory, 'engine.sqlite');
    let store;
    try {
        store = new Store(path);
        store.set('accountId', 'private-test-account');
        store.set('control', 'pause');
        store.reserve({ client_order_id: 'test-entry', symbol: 'SPY' }, 'entry', '2026-09-23');
        store.observe({ id: 'test-order', client_order_id: 'test-entry', symbol: 'SPY', side: 'buy', qty: '2', filled_qty: '1', status: 'partially_filled', filled_avg_price: '600' }, new Date());
        store.close();
        store = new Store(path);
        assert.equal(store.count('2026-09-23'), 1);
        assert.equal(store.intents()[0].resolved, 0);
        assert.equal(store.ownedQuantity('SPY'), 1);
        assert.equal(store.get('control'), 'pause');
        assert.ok(!JSON.stringify(store.snapshot()).includes('private-test-account'));
    } finally { store?.close(); rmSync(directory, { recursive: true }); }
});

test('lease is shared across independent connections and recovers after expiration', () => {
    const directory = mkdtempSync(join(tmpdir(), 'stockbot-lease-test-'));
    const first = new Store(join(directory, 'engine.sqlite'));
    const second = new Store(join(directory, 'engine.sqlite'));
    try {
        assert.equal(first.claim('one', 1000), true);
        assert.equal(second.claim('two', 1001), false);
        assert.equal(second.claim('two', 121001), true);
        assert.equal(first.claim('one', 121002), false);
    } finally { first.close(); second.close(); rmSync(directory, { recursive: true }); }
});
