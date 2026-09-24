import indicators from 'technicalindicators';

export const SETTINGS = Object.freeze({ symbols: Object.freeze(['SPYM', 'SCHG']), maxPosition: 1000, allocation: 0.10, risk: 0.0025, dailyLoss: 0.01, maxEntries: 6, stop: 0.01, target: 0.02 });
export const terminal = status => ['filled', 'canceled', 'expired', 'rejected', 'replaced'].includes(status);

export function marketDate(time) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time));
}

export function marketMinutes(time) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(time));
    return Number(parts.find(p => p.type === 'hour').value) * 60 + Number(parts.find(p => p.type === 'minute').value);
}

export function signalFor(rows, now) {
    const bars = [...rows].filter(b => marketDate(b.t) === marketDate(now) && marketMinutes(b.t) >= 570 && Date.parse(b.t) + 300000 <= now.getTime())
        .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    const latest = bars.at(-1);
    if (!latest || now - Date.parse(latest.t) > 420000) return { buy: false, reason: 'Waiting for a fresh completed five-minute bar.' };
    const recent = bars.slice(-21);
    if (recent.length < 21) return { buy: false, bar: latest.t, reason: `Warming up: ${recent.length}/21 session bars.` };
    if (recent.some((b, i) => !Number.isFinite(b.c) || b.c <= 0 || (i && Date.parse(b.t) - Date.parse(recent[i - 1].t) !== 300000))) {
        return { buy: false, bar: latest.t, reason: 'Missing or invalid bars; waiting for continuous data.' };
    }
    const values = recent.map(b => b.c);
    const fast = indicators.SMA.calculate({ period: 5, values });
    const slow = indicators.SMA.calculate({ period: 20, values });
    const buy = fast.at(-2) <= slow.at(-2) && fast.at(-1) > slow.at(-1);
    return { buy, bar: latest.t, fast: fast.at(-1), slow: slow.at(-1), reason: buy ? '5-bar average crossed above the 20-bar average.' : 'Waiting for an upward 5/20 crossover.' };
}

export function sizeEntry(quote, account, now) {
    if (!quote || !Number.isFinite(quote.ap) || !Number.isFinite(quote.bp) || quote.bp <= 0 || quote.ap < quote.bp || !Number.isFinite(Date.parse(quote.t)) || now - Date.parse(quote.t) > 30000 || Date.parse(quote.t) > now.getTime() + 5000) return null;
    if ((quote.ap - quote.bp) / quote.ap > 0.002) return null;
    const equity = Number(account.equity), cash = Number(account.cash);
    if (!(equity > 0 && cash > 0)) return null;
    const price = Math.ceil(quote.ap * 1.001 * 100) / 100;
    const stop = Math.floor(price * (1 - SETTINGS.stop) * 100) / 100;
    const qty = Math.floor(Math.min(SETTINGS.maxPosition / price, equity * SETTINGS.allocation / price, cash / price, equity * SETTINGS.risk / (price - stop)));
    return qty >= 1 ? { qty, price, stop, target: Math.ceil(price * (1 + SETTINGS.target) * 100) / 100 } : null;
}
