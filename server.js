import express from 'express';
import YahooFinance from 'yahoo-finance2';
import { resolve } from 'node:path';
import { createPaperReader } from './paper.js';
import { Store } from './engine/store.js';
import { createBroker } from './engine/broker.js';
import { Engine } from './engine/runner.js';

const app = express();
const port = process.env.PORT || 5174;
const symbols = ['SPY', 'QQQ', 'DIA', 'IWM', '^VIX'];
const cacheTtlMs = 1000 * 60 * 5;
const yahooFinance = new YahooFinance();
const readPaper = createPaperReader();
const store = new Store(process.env.ENGINE_DB || './data/engine.sqlite');
const engine = new Engine({ broker: createBroker(), store, enabled: process.env.PAPER_TRADING_ENABLED === 'true' });
const tick = () => engine.tick().catch(() => console.error('Engine storage failure; trading cycle stopped.'));
await tick();
const engineTimer = setInterval(tick, 20000);

app.get('/api/engine', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(store.snapshot());
});

app.get('/api/paper', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        res.json({ ...await readPaper(), execution: engine.enabled ? 'paper' : 'disabled' });
    } catch (error) {
        const expected = /^(Paper |Alpaca |Unexpected response)/.test(error.message);
        res.status(503).json({ error: expected ? error.message : 'Unable to reach Alpaca. Check the VM network and try again.' });
    }
});

let cachedMetrics = null;
let cachedAt = 0;

function toNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatHistoryPoint(row) {
    return {
        date: row.date?.toISOString().slice(0, 10),
        close: Number(row.close?.toFixed(2)),
        volume: row.volume ?? 0,
    };
}

async function loadMetrics() {
    const now = Date.now();
    if (cachedMetrics && now - cachedAt < cacheTtlMs) {
        return cachedMetrics;
    }

    const period2 = new Date();
    const period1 = new Date(period2);
    period1.setMonth(period1.getMonth() - 1);

    const marketData = await Promise.all(symbols.map(async (symbol) => {
        const [quote, history] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.historical(symbol, { period1, period2, interval: '1d' }),
        ]);

        const historyPoints = history.map(formatHistoryPoint).filter((point) => point.date);
        const firstClose = historyPoints[0]?.close ?? null;
        const lastClose = historyPoints.at(-1)?.close ?? toNumber(quote.regularMarketPrice);
        const monthChangePercent = firstClose && lastClose
            ? ((lastClose - firstClose) / firstClose) * 100
            : toNumber(quote.regularMarketChangePercent);

        return {
            symbol,
            name: quote.shortName || quote.longName || symbol,
            price: toNumber(quote.regularMarketPrice),
            change: toNumber(quote.regularMarketChange),
            changePercent: toNumber(quote.regularMarketChangePercent),
            monthChangePercent: toNumber(monthChangePercent),
            dayHigh: toNumber(quote.regularMarketDayHigh),
            dayLow: toNumber(quote.regularMarketDayLow),
            volume: quote.regularMarketVolume ?? null,
            history: historyPoints,
        };
    }));

    cachedMetrics = {
        updatedAt: new Date().toISOString(),
        marketData,
        leaders: [...marketData]
            .filter((item) => item.monthChangePercent !== null)
            .sort((a, b) => b.monthChangePercent - a.monthChangePercent)
            .slice(0, 3),
        source: 'Yahoo Finance',
    };
    cachedAt = now;

    return cachedMetrics;
}

app.get('/api/metrics', async (_req, res) => {
    try {
        const metrics = await loadMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Unable to load market metrics:', error);
        res.status(502).json({
            error: 'Unable to load market metrics right now.',
            detail: error.message,
        });
    }
});

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint' }));
app.use(express.static(resolve('dist')));
app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));

const server = app.listen(port, process.env.HOST || '127.0.0.1', () => {
    console.log(`StockBot metrics API listening on http://localhost:${port}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    engine.stopping = true;
    clearInterval(engineTimer);
    server.close();
    const waitForCycle = setInterval(() => {
        if (!engine.busy) {
            clearInterval(waitForCycle);
            store.release(engine.owner);
            store.close();
            process.exit(0);
        }
    }, 100);
});
