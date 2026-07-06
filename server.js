import express from 'express';
import YahooFinance from 'yahoo-finance2';

const app = express();
const port = process.env.PORT || 5174;
const symbols = ['SPY', 'QQQ', 'DIA', 'IWM', '^VIX'];
const cacheTtlMs = 1000 * 60 * 5;
const yahooFinance = new YahooFinance();

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

app.listen(port, () => {
    console.log(`StockBot metrics API listening on http://localhost:${port}`);
});
