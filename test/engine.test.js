import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../engine/store.js';
import { Engine } from '../engine/runner.js';
import { createBroker, BrokerError } from '../engine/broker.js';
import { signalFor, sizeEntry, marketDate } from '../engine/strategy.js';

const time = new Date('2026-09-23T15:16:00Z');
const bars = () => [...Array(19).fill(100), 99, 105].map((c, i) => ({ t: new Date(Date.parse('2026-09-23T13:30:00Z') + i * 300000).toISOString(), c }));
const quote = () => ({ ap: 105, bp: 104.95, t: time.toISOString() });
function fixture(t, enabled = true) {
    const store = new Store(':memory:');
    t.after(() => store.close());
    const state = { now: time, positions: [], orders: [], submitted: [], canceled: [], lookup: new Map(), account: { id: 'paper-test', status: 'ACTIVE', equity: '10000', last_equity: '10000', cash: '10000' } };
    const broker = {
        clock: async () => ({ is_open: true, timestamp: state.now.toISOString(), next_close: '2026-09-23T20:00:00Z' }),
        account: async () => state.account, positions: async () => state.positions, openOrders: async () => state.orders,
        bars: async () => ({ SPYM: bars(), SCHG: bars() }), quote: async () => quote(),
        order: async id => { if (!state.lookup.has(id)) throw new BrokerError(404); return state.lookup.get(id); },
        submit: async body => {
            state.submitted.push(body);
            const order = { ...body, id: body.client_order_id, status: 'new', filled_qty: '0', submitted_at: state.now.toISOString() };
            state.lookup.set(body.client_order_id, order); state.orders.push(order); return order;
        },
        cancel: async id => { state.canceled.push(id); state.orders = state.orders.filter(o => o.id !== id); },
    };
    const engine = new Engine({ broker, store, enabled, now: () => state.now });
    return { engine, store, broker, state };
}
test('strategy requires complete continuous bars and an upward crossover', () => {
    assert.equal(signalFor(bars(), time).buy, true);
    assert.equal(signalFor(bars().slice(0, 20), time).buy, false);
    assert.equal(signalFor(bars().filter((_, i) => i !== 5), time).buy, false);
    assert.equal(signalFor(bars(), new Date(+time + 300000)).buy, false);
    assert.equal(signalFor(bars().map(b => ({ ...b, c: 100 })), time).buy, false);
    assert.equal(marketDate('2026-09-24T01:00:00Z'), '2026-09-23');
});
test('sizing respects cash, exposure, quote age, spread and whole shares', () => {
    const account = { equity: '10000', cash: '10000' }, size = sizeEntry(quote(), account, time);
    assert.ok(size.qty * size.price <= 1000);
    assert.ok(size.qty * (size.price - size.stop) <= 25);
    assert.equal(sizeEntry(quote(), { ...account, cash: '50' }, time), null);
    assert.equal(sizeEntry({ ...quote(), t: 'invalid' }, account, time), null);
    assert.equal(sizeEntry({ ...quote(), bp: 100 }, account, time), null);
    assert.equal(sizeEntry(quote(), account, new Date(+time + 31000)), null);
});
test('$1,000 paper account can submit protected whole-share entries within $100', async t => {
    const { engine, broker, state } = fixture(t);
    state.account = { ...state.account, equity: '1000', last_equity: '1000', cash: '1000' };
    broker.quote = async () => ({ ap: 85, bp: 84.98, t: time.toISOString() });
    await engine.tick();
    assert.equal(state.submitted.length, 1);
    const order = state.submitted[0];
    assert.equal(order.symbol, 'SPYM');
    assert.equal(order.qty, '1');
    assert.equal(order.order_class, 'bracket');
    assert.ok(Number(order.qty) * Number(order.limit_price) <= 100);
    assert.ok(Number(order.qty) * (Number(order.limit_price) - Number(order.stop_loss.stop_price)) <= 2.5);
    const size = sizeEntry({ ap: 35, bp: 34.99, t: time.toISOString() }, state.account, time);
    assert.equal(size.qty, 2);
    assert.equal(sizeEntry(quote(), state.account, time), null);
});
test('market data symbols follow the configured small-account strategy', async () => {
    let requested;
    const broker = createBroker({ APCA_API_KEY_ID: 'x', APCA_API_SECRET_KEY: 'y' }, async url => {
        requested = new URL(url);
        return { ok: true, status: 200, json: async () => ({ bars: {} }) };
    });
    await broker.bars('2026-09-23', time);
    assert.equal(requested.searchParams.get('symbols'), 'SPYM,SCHG');
    assert.equal(requested.searchParams.get('feed'), 'iex');
});
test('disabled engine performs no broker calls', async t => {
    const { engine, broker, store } = fixture(t, false);
    broker.clock = () => assert.fail('unexpected broker call');
    await engine.tick(); assert.equal(store.snapshot().state, 'disabled');
});
test('one crossover creates one bracket; repeat cycles and restart do not duplicate', async t => {
    const { engine, store, broker, state } = fixture(t);
    await engine.tick(); assert.equal(state.submitted.length, 1);
    assert.equal(state.submitted[0].order_class, 'bracket');
    await engine.tick(); store.release(engine.owner);
    await new Engine({ broker, store, enabled: true, now: () => state.now }).tick();
    assert.equal(state.submitted.length, 1);
});
test('ambiguous submission blocks retries even when lookup returns 404', async t => {
    const { engine, broker, store, state } = fixture(t);
    broker.submit = async body => { state.submitted.push(body); throw new Error('Timeout'); };
    await engine.tick(); await engine.tick();
    assert.equal(state.submitted.length, 1);
    assert.equal(store.snapshot().state, 'attention'); assert.equal(store.intents()[0].resolved, 0);
});
test('existing manual holdings are never canceled or sold', async t => {
    const { engine, state, store } = fixture(t);
    state.positions = [{ symbol: 'SPYM', qty: '2' }];
    await engine.tick(); assert.equal(store.snapshot().state, 'attention');
    assert.equal(state.submitted.length, 0); assert.equal(state.canceled.length, 0);
});
test('daily loss halt persists even if equity recovers', async t => {
    const { engine, state, store } = fixture(t);
    state.account.equity = '9800'; await engine.tick();
    state.account.equity = '10000'; await engine.tick();
    assert.equal(store.get('day').halted, true); assert.equal(state.submitted.length, 0);
});
test('six persisted entry attempts prevent a seventh', async t => {
    const { engine, store, state } = fixture(t);
    for (let i = 0; i < 6; i++) {
        const id = `old-${i}`;
        store.reserve({ client_order_id: id, symbol: 'SPYM' }, 'entry', '2026-09-23'); store.resolve(id);
    }
    await engine.tick(); assert.equal(state.submitted.length, 0); assert.match(store.snapshot().reason, /six/);
});
test('early-close liquidation waits for cancellation before selling', async t => {
    const { engine, store, state, broker } = fixture(t);
    state.now = new Date('2026-09-23T16:51:00Z');
    broker.clock = async () => ({ is_open: true, timestamp: state.now.toISOString(), next_close: '2026-09-23T17:00:00Z' });
    store.set('accountId', 'paper-test');
    const entry = { id: 'entry', client_order_id: 'sb-entry', symbol: 'SPYM', side: 'buy', qty: '1', filled_qty: '1', status: 'filled', filled_avg_price: '100', legs: [{ id: 'stop', client_order_id: 'stop', symbol: 'SPYM', side: 'sell', qty: '1', filled_qty: '0', status: 'new' }] };
    store.reserve(entry, 'entry', '2026-09-23'); state.lookup.set('sb-entry', entry);
    state.orders = [entry]; state.positions = [{ symbol: 'SPYM', qty: '1' }];
    broker.cancel = async id => { state.canceled.push(id); entry.legs[0].status = 'canceled'; state.orders = []; };
    await engine.tick(); assert.deepEqual(state.canceled, ['stop']); assert.equal(state.submitted.length, 0);
    await engine.tick(); assert.equal(state.submitted.length, 1);
    assert.equal(state.submitted[0].side, 'sell'); assert.equal(state.submitted[0].qty, '1');
});
test('closed market and pause never open positions', async t => {
    const { engine, broker, state, store } = fixture(t);
    store.set('control', 'pause'); await engine.tick(); assert.equal(store.snapshot().state, 'paused');
    store.set('control', 'run'); broker.clock = async () => ({ is_open: false, timestamp: state.now.toISOString() });
    await engine.tick(); assert.equal(state.submitted.length, 0); assert.equal(store.snapshot().state, 'closed');
});
test('exclusive lease prevents concurrent engines from sending two entries', async t => {
    const { engine, store, broker, state } = fixture(t);
    const other = new Engine({ store, broker, enabled: true, now: () => state.now });
    await Promise.all([engine.tick(), other.tick()]); assert.equal(state.submitted.length, 1);
});
test('broker writes remain pinned to paper despite a live URL in environment', async () => {
    const requests = [];
    const broker = createBroker({ APCA_API_KEY_ID: 'x', APCA_API_SECRET_KEY: 'y', APCA_API_BASE_URL: 'https://api.alpaca.markets' }, async (url, options) => {
        requests.push({ url, options }); return { ok: true, status: 200, json: async () => ({}) };
    });
    await broker.submit({ symbol: 'SPYM' });
    assert.equal(requests[0].url, 'https://paper-api.alpaca.markets/v2/orders');
    assert.equal(requests[0].options.method, 'POST'); assert.equal(requests[0].options.redirect, 'error');
});

test('a partial fill during entry cancellation is closed on the next cycle', async t => {
    const { engine, broker, store, state } = fixture(t);
    await engine.tick();
    const buy = state.orders[0];
    state.now = new Date(+time + 65000);
    broker.cancel = async () => {
        buy.status = 'canceled'; buy.filled_qty = '1'; buy.filled_avg_price = '105';
        state.positions = [{ symbol: 'SPYM', qty: '1' }]; state.orders = [];
    };
    await engine.tick();
    assert.equal(store.get('closing'), true);
    await engine.tick();
    assert.equal(state.submitted.length, 2);
    assert.equal(state.submitted[1].side, 'sell');
    assert.equal(state.submitted[1].qty, '1');
});

test('filled position with canceled protection is flattened', async t => {
    const { engine, store, state } = fixture(t);
    await engine.tick();
    const buy = state.orders[0];
    buy.status = 'filled'; buy.filled_qty = buy.qty; buy.filled_avg_price = '105';
    state.positions = [{ symbol: 'SPYM', qty: buy.qty }]; state.orders = [];
    await engine.tick();
    assert.equal(state.submitted.at(-1).side, 'sell');
    assert.equal(store.get('closing'), true);
});

test('stale final clock suppresses an otherwise valid entry', async t => {
    const { engine, broker, state } = fixture(t);
    let clocks = 0;
    broker.clock = async () => ({ is_open: true, timestamp: ++clocks === 1 ? time.toISOString() : 'invalid', next_close: '2026-09-23T20:00:00Z' });
    await engine.tick();
    assert.equal(state.submitted.length, 0);
});
