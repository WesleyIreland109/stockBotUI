const PAPER = 'https://paper-api.alpaca.markets/v2';
const DATA = 'https://data.alpaca.markets/v2';

export class BrokerError extends Error {
    constructor(status) {
        super(status === 401 || status === 403 ? 'Alpaca rejected the paper credentials.' : `Alpaca request failed (HTTP ${status}).`);
        this.status = status;
    }
}

export function createBroker(env = process.env, request = fetch) {
    async function call(base, path, method = 'GET', body) {
        if (!env.APCA_API_KEY_ID || !env.APCA_API_SECRET_KEY) throw new Error('Paper API keys are missing.');
        let response;
        try {
            response = await request(`${base}/${path}`, {
                method, redirect: 'error', signal: AbortSignal.timeout(10000),
                headers: { 'APCA-API-KEY-ID': env.APCA_API_KEY_ID, 'APCA-API-SECRET-KEY': env.APCA_API_SECRET_KEY, 'Content-Type': 'application/json' },
                ...(body ? { body: JSON.stringify(body) } : {}),
            });
        } catch {
            throw new Error('Alpaca network timeout or connection error.');
        }
        if (!response.ok) throw new BrokerError(response.status);
        return response.status === 204 ? null : response.json();
    }
    return {
        account: () => call(PAPER, 'account'),
        clock: () => call(PAPER, 'clock'),
        positions: () => call(PAPER, 'positions'),
        openOrders: () => call(PAPER, 'orders?status=open&limit=500&nested=true'),
        order: async clientId => {
            const order = await call(PAPER, `orders:by_client_order_id?client_order_id=${encodeURIComponent(clientId)}`);
            return call(PAPER, `orders/${encodeURIComponent(order.id)}?nested=true`);
        },
        submit: body => call(PAPER, 'orders', 'POST', body),
        cancel: id => call(PAPER, `orders/${encodeURIComponent(id)}`, 'DELETE'),
        bars: async (date, now) => {
            // Start at UTC midnight; strategy filters regular-session bars in New York time.
            const query = new URLSearchParams({ symbols: 'SPY,QQQ', timeframe: '5Min', start: `${date}T00:00:00Z`, end: now.toISOString(), feed: 'iex', adjustment: 'raw', limit: '1000', sort: 'asc' });
            const data = await call(DATA, `stocks/bars?${query}`);
            if (data.next_page_token) throw new Error('Incomplete market data; entries paused.');
            return data.bars || {};
        },
        quote: async symbol => (await call(DATA, `stocks/${symbol}/quotes/latest?feed=iex`)).quote,
    };
}
