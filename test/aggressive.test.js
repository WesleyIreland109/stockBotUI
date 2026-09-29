import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('aggressive process uses larger paper brackets and enforces its session limits', () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { Store } from './engine/store.js';
        import { Engine } from './engine/runner.js';
        const now = new Date('2026-09-29T15:16:00Z');
        const rows = [...Array(19).fill(35), 34, 40].map((c, i) => ({
            t: new Date(Date.parse('2026-09-29T13:30:00Z') + i * 300000).toISOString(), c,
        }));
        for (const scenario of ['entry', 'loss', 'limit', 'pause', 'closed']) {
            const store = new Store(':memory:');
            const submitted = [];
            const broker = {
                clock: async () => ({ is_open: scenario !== 'closed', timestamp: now.toISOString(), next_close: '2026-09-29T20:00:00Z' }),
                account: async () => ({ id: 'paper-test', status: 'ACTIVE', equity: scenario === 'loss' ? '849' : '1000', last_equity: '1000', cash: '1000' }),
                positions: async () => [], openOrders: async () => [],
                bars: async () => ({ SPYM: rows, SCHG: rows }),
                quote: async () => ({ ap: 35, bp: 34.99, t: now.toISOString() }),
                submit: async body => { submitted.push(body); return { ...body, id: 'entry', status: 'new', filled_qty: '0' }; },
            };
            if (scenario === 'limit') for (let i = 0; i < 12; i++) {
                store.reserve({ client_order_id: 'old-' + i, symbol: 'SPYM' }, 'entry', '2026-09-29');
                store.resolve('old-' + i);
            }
            if (scenario === 'pause') store.set('control', 'pause');
            const engine = new Engine({ broker, store, enabled: true, now: () => now });
            await engine.tick();
            assert.equal(store.snapshot().settings.profile, 'aggressive-paper');
            assert.notEqual(store.snapshot().state, 'error');
            assert.equal(submitted.length, scenario === 'entry' ? 1 : 0);
            if (scenario === 'entry') {
                assert.equal(submitted[0].qty, '25');
                assert.equal(submitted[0].order_class, 'bracket');
                assert.equal(submitted[0].stop_loss.stop_price, '33.28');
                assert.equal(submitted[0].take_profit.limit_price, '38.55');
            }
            if (scenario === 'loss') assert.equal(store.get('day').halted, true);
            if (scenario === 'limit') assert.match(store.snapshot().reason, /12 entry/);
            store.close();
        }
    `], { cwd: new URL('..', import.meta.url), env: { ...process.env, STOCKBOT_RISK_PROFILE: 'aggressive-paper' }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
});
