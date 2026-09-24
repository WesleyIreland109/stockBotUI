import { SETTINGS, marketDate, signalFor, sizeEntry, terminal } from './strategy.js';
import { randomUUID } from 'node:crypto';

const flattenOrders = orders => orders.flatMap(o => [o, ...(o.legs || [])]);
const validClock = (clock, now) => Number.isFinite(Date.parse(clock.timestamp)) && Math.abs(Date.parse(clock.timestamp) - now) <= 90000;

export class Engine {
    constructor({ broker, store, enabled = false, now = () => new Date() }) {
        Object.assign(this, { broker, store, enabled, now });
        this.busy = false;
        this.owner = randomUUID();
    }
    status(state, reason, extra = {}) {
        const previous = this.store.get('status');
        if (previous?.reason !== reason) this.store.event(state, reason, this.now());
        this.store.set('status', { state, reason, updatedAt: this.now().toISOString(), enabled: this.enabled, settings: SETTINGS, ...extra });
    }
    async reconcile(now) {
        let unresolved = false;
        for (const intent of this.store.intents().filter(i => !i.resolved)) {
            try {
                const order = await this.broker.order(intent.client_id);
                this.store.observe(order, now);
                if (terminal(order.status) && (order.legs || []).every(l => terminal(l.status))) this.store.resolve(intent.client_id);
            } catch (err) {
                if (err.status !== 404) throw err;
                unresolved = true;
            }
        }
        return unresolved;
    }
    async send(body, kind, date) {
        if (kind === 'entry' && this.stopping) return;
        if (!this.store.claim(this.owner, this.now().getTime())) throw new Error('Another engine owns execution; waiting.');
        // Persist the intent before transmitting. An ambiguous response is reconciled,
        // never blindly retried, including after a crash or container restart.
        if (!this.store.reserve(body, kind, date)) return;
        try {
            const order = await this.broker.submit(body);
            this.store.observe(order, this.now());
        } catch (err) {
            if ([400, 401, 403, 422].includes(err.status)) {
                // Duplicate client IDs are also 422: resolve through a lookup first.
                try { this.store.observe(await this.broker.order(body.client_order_id), this.now()); }
                catch (lookup) { if (lookup.status === 404) this.store.resolve(body.client_order_id); }
            }
            throw err;
        }
    }
    async cancel(orders) {
        if (!this.store.claim(this.owner, this.now().getTime())) throw new Error('Another engine owns execution; waiting.');
        for (const order of orders.filter(o => !terminal(o.status))) {
            try { await this.broker.cancel(order.id); }
            catch (err) { if (![404, 422].includes(err.status)) throw err; }
        }
    }
    async flatten(positions, orders, date, reason) {
        this.status('closing', reason);
        // Wait for cancellation confirmation before selling. Pending cancels can still fill.
        if (orders.length) { await this.cancel(orders); return; }
        const clock = await this.broker.clock();
        if (!validClock(clock, this.now()) || !clock.is_open || !(Date.parse(clock.next_close) > this.now().getTime())) { this.status('attention', 'Market is closed or its clock is stale. Liquidation is waiting for a confirmed open session.'); return; }
        for (const p of positions) {
            const qty = Number(p.qty);
            if (!(qty > 0)) { this.status('attention', 'Unexpected short position; manual review required.'); return; }
            const serial = this.store.intents().filter(i => i.kind === 'exit').length;
            await this.send({ symbol: p.symbol, qty: String(qty), side: 'sell', type: 'market', time_in_force: 'day', client_order_id: `sb-exit-${date}-${serial}` }, 'exit', date);
        }
        if (!positions.length) this.status('flat', reason);
    }
    async tick() {
        if (this.busy) return;
        if (!this.store.claim(this.owner, this.now().getTime())) return;
        this.busy = true;
        try { await this.cycle(); }
        catch (err) { this.status('error', err.message); }
        finally { this.busy = false; }
    }
    async cycle() {
        if (!this.enabled) { this.status('disabled', 'Paper engine disabled in server configuration.'); return; }
        const now = this.now(), date = marketDate(now);
        const clock = await this.broker.clock();
        if (!validClock(clock, now)) throw new Error('Broker clock is stale or VM time is incorrect.');
        const account = await this.broker.account();
        if (!account.id) throw new Error('Invalid paper account response.');
        const bound = this.store.get('accountId');
        if (bound && bound !== account.id) { this.status('attention', 'Paper account changed. Restore the original credentials or use a fresh engine data volume.'); return; }
        const unresolved = await this.reconcile(now);
        const [positions, nestedOrders] = await Promise.all([this.broker.positions(), this.broker.openOrders()]);
        const orders = flattenOrders(nestedOrders).filter(o => !terminal(o.status));
        if (!bound) {
            if (positions.length || orders.length) { this.status('attention', 'Start with an empty, dedicated paper account: positions or orders already exist.'); return; }
            this.store.set('accountId', account.id);
        }
        this.store.sample(now, Number(account.equity));
        const intents = this.store.intents();
        const ownedIds = new Set(intents.map(i => i.client_id));
        const ownRoots = nestedOrders.filter(o => ownedIds.has(o.client_order_id));
        const ownOrders = flattenOrders(ownRoots).filter(o => !terminal(o.status));
        const foreignOrders = nestedOrders.some(o => !ownedIds.has(o.client_order_id));
        const mismatch = positions.some(p => !SETTINGS.symbols.includes(p.symbol)) || SETTINGS.symbols.some(symbol =>
            Math.abs(Number(positions.find(p => p.symbol === symbol)?.qty || 0) - this.store.ownedQuantity(symbol)) > 0.000001);
        if (unresolved) { this.status('attention', 'An order submission is unconfirmed. Entries paused; reconciling with Alpaca without resubmitting.'); return; }
        if (foreignOrders || mismatch) { this.status('attention', 'Account state differs from the bot ledger. Entries paused; do not mix manual trades with this account.'); return; }
        const equity = Number(account.equity), previousEquity = Number(account.last_equity);
        if (!(equity > 0 && previousEquity > 0)) throw new Error('Invalid account equity; entries paused.');
        let day = this.store.get('day');
        if (day?.date !== date) { day = { date, baseline: previousEquity, halted: false }; }
        if (equity <= day.baseline * (1 - SETTINGS.dailyLoss)) day.halted = true;
        this.store.set('day', day);
        if (!clock.is_open) {
            this.status(positions.length ? 'attention' : 'closed', positions.length ? 'Market closed with a remaining position; it will be closed when the market reopens.' : 'Market closed. Waiting for the next session.');
            return;
        }
        const minutesLeft = (Date.parse(clock.next_close) - now) / 60000;
        if (!Number.isFinite(minutesLeft) || minutesLeft <= 0) throw new Error('Invalid market closing time.');
        const control = this.store.get('control', 'run');
        const overnight = positions.some(p => intents.filter(i => i.kind === 'entry' && i.symbol === p.symbol).map(i => i.date).sort().at(-1) < date);
        if (minutesLeft <= 10 || day.halted || control === 'flatten' || overnight || this.store.get('closing', false)) {
            this.store.set('closing', positions.length > 0 || ownOrders.length > 0);
            await this.flatten(positions, ownOrders, date, day.halted ? 'Daily equity loss limit reached; halted for this session.' : control === 'flatten' ? 'Flatten requested from VM console.' : 'Closing positions before session end or completing an earlier exit.');
            if (!positions.length && !ownOrders.length && control === 'flatten') this.store.set('control', 'pause');
            return;
        }
        const staleEntries = ownRoots.filter(o => o.side === 'buy' && !terminal(o.status) && now - Date.parse(o.submitted_at) > 60000);
        if (staleEntries.length) {
            // A previously empty order can partially fill while its cancel is in flight.
            this.store.set('closing', true);
            await this.cancel(flattenOrders(staleEntries));
            this.status('waiting', 'Canceling an entry that has not fully filled within one minute.');
            return;
        }
        if (positions.length && !ownOrders.length) {
            this.store.set('closing', true);
            await this.flatten(positions, ownOrders, date, 'Position has no working protection; closing it.');
            return;
        }
        if (positions.length || ownOrders.length) { this.status('holding', 'Managing the existing position and broker stop/target orders.'); return; }
        if (control !== 'run') { this.status('paused', 'Paused from the VM console. No new entries.'); return; }
        if (minutesLeft <= 30) { this.status('waiting', 'New entries stop 30 minutes before the session closes.'); return; }
        if (account.status !== 'ACTIVE' || account.trading_blocked || account.account_blocked) { this.status('attention', 'Broker account is not enabled for trading.'); return; }
        if (this.store.count(date) >= SETTINGS.maxEntries) { this.status('waiting', 'Daily limit of six entry attempts reached.'); return; }
        const bars = await this.broker.bars(date, now);
        const signals = SETTINGS.symbols.map(symbol => ({ symbol, ...signalFor(bars[symbol] || [], now) }));
        this.store.set('signals', signals);
        for (const signal of signals) {
            if (!signal.bar || this.store.get(`bar-${signal.symbol}`) === signal.bar) continue;
            this.store.set(`bar-${signal.symbol}`, signal.bar);
            this.store.event('signal', `${signal.symbol}: ${signal.reason}`, now);
            if (!signal.buy) continue;
            const quote = await this.broker.quote(signal.symbol);
            const sizing = sizeEntry(quote, account, this.now());
            if (!sizing) { this.store.event('skip', `${signal.symbol}: stale/wide quote or insufficient cash for a whole share within limits.`, now); continue; }
            const latestClock = await this.broker.clock();
            if (!validClock(latestClock, this.now()) || !latestClock.is_open || !((Date.parse(latestClock.next_close) - this.now()) / 60000 > 30)) return;
            if (!sizeEntry(quote, account, this.now())) return;
            if (this.store.get('control', 'run') !== 'run') return;
            const clientId = `sb-${signal.symbol}-${Date.parse(signal.bar)}`;
            await this.send({ symbol: signal.symbol, qty: String(sizing.qty), side: 'buy', type: 'limit', limit_price: sizing.price.toFixed(2),
                time_in_force: 'day', order_class: 'bracket', stop_loss: { stop_price: sizing.stop.toFixed(2) }, take_profit: { limit_price: sizing.target.toFixed(2) }, client_order_id: clientId }, 'entry', date);
            this.status('submitted', `Paper bracket entry submitted for ${signal.symbol}: ${sizing.qty} share(s).`);
            return;
        }
        this.status('watching', 'Watching completed five-minute bars for a 5/20 upward crossover.');
    }
}
