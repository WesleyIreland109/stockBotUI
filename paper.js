// Intentionally fixed to Alpaca's paper host; this module has no order-writing API.
const PAPER_URL = 'https://paper-api.alpaca.markets/v2';

export function createPaperReader({ env = process.env, request = fetch } = {}) {
    let cached;
    let pending;
    const number = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    async function get(path) {
        const response = await request(`${PAPER_URL}/${path}`, {
            method: 'GET',
            redirect: 'error',
            headers: { 'APCA-API-KEY-ID': env.APCA_API_KEY_ID, 'APCA-API-SECRET-KEY': env.APCA_API_SECRET_KEY },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(response.status === 401 || response.status === 403
                ? 'Paper credentials were rejected. Check the paper API keys on the VM.'
                : `Alpaca is unavailable (HTTP ${response.status}).`);
        }
        return response.json();
    }
    async function load() {
        const [account, positions, orders, clock] = await Promise.all([
            get('account'), get('positions'), get('orders?status=all&limit=50&direction=desc'), get('clock'),
        ]);
        if (!account.status || !Array.isArray(positions) || !Array.isArray(orders) || typeof clock.is_open !== 'boolean') {
            throw new Error('Unexpected response from Alpaca.');
        }
        const equity = number(account.equity);
        const lastEquity = number(account.last_equity);
        cached = {
            mode: 'paper', execution: 'disabled', updatedAt: new Date().toISOString(),
            account: { status: account.status, equity, cash: number(account.cash), buyingPower: number(account.buying_power),
                equityChange: equity !== null && lastEquity !== null ? equity - lastEquity : null },
            market: { open: clock.is_open, nextOpen: clock.next_open, nextClose: clock.next_close },
            positions: positions.map(p => ({ symbol: p.symbol, quantity: p.qty, marketValue: number(p.market_value), unrealizedPL: number(p.unrealized_pl) })),
            orders: orders.map(o => ({ id: o.id, symbol: o.symbol, side: o.side, quantity: o.qty, filled: o.filled_qty, price: number(o.filled_avg_price), status: o.status, submittedAt: o.submitted_at })),
        };
        return cached;
    }
    return async () => {
        if (!env.APCA_API_KEY_ID || !env.APCA_API_SECRET_KEY) throw new Error('Paper API keys have not been configured on the server.');
        if (cached && Date.now() - Date.parse(cached.updatedAt) < 15000) return cached;
        if (!pending) pending = load().finally(() => { pending = null; });
        return pending;
    };
}
