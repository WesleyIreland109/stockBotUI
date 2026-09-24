import { useEffect, useState } from 'react';
import { apiUrl } from '../api.js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const money = value => value == null ? '--' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function PaperAccount() {
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [engine, setEngine] = useState(null);
    const [engineError, setEngineError] = useState('');
    useEffect(() => {
        let disposed = false;
        let timer;
        const controller = new AbortController();
        async function refresh() {
            try {
                try {
                    const response = await fetch(apiUrl('/api/engine'), { signal: controller.signal });
                    if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Engine status unavailable.');
                    const status = await response.json();
                    if (!disposed) { setEngine(status); setEngineError(''); }
                } catch (err) { if (!disposed) setEngineError(err.message); }
                const response = await fetch(apiUrl('/api/paper'), { signal: controller.signal });
                if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Paper account service is unavailable on this host.');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Paper account unavailable.');
                if (!disposed) { setSnapshot(data); setError(''); }
            } catch (err) {
                if (!disposed) setError(err.message);
            } finally {
                if (!disposed) timer = setTimeout(refresh, 15000);
            }
        }
        refresh();
        return () => { disposed = true; clearTimeout(timer); controller.abort(); };
    }, []);
    return <section className="paper-account">
        <div className="paper-heading"><div><span className="eyebrow">Alpaca / PAPER</span><h2>Paper account</h2></div><span>Engine: {engineError ? 'disconnected' : engine?.state || 'connecting'}</span></div>
        {engineError && <p role="alert" className="paper-error">{engineError}</p>}
        {engine && <>
            <p className="paper-meta">{engine.reason} {engine.updatedAt && <span>Last cycle: {new Date(engine.updatedAt).toLocaleString()}</span>}</p>
            {engine.settings && <p className="paper-meta">{engine.settings.symbols.join(' / ')} · 5/20 SMA · 5-minute bars · IEX · Allocation {engine.settings.allocation * 100}%{snapshot && ` (${money(Math.min(engine.settings.maxPosition, snapshot.account.equity * engine.settings.allocation))} maximum)`} · 1% stop / 2% target · Max 6 entries/day</p>}
            {engine.control !== 'run' && <p className="paper-error">New entries are paused by console control, including when the market reopens.</p>}
            {!!engine.signals?.length && <div className="paper-signals">{engine.signals.map(s => <div key={s.symbol}><strong>{s.symbol}</strong><span>{s.reason}</span>{s.fast != null && <small>SMA 5: {money(s.fast)} / SMA 20: {money(s.slow)}</small>}</div>)}</div>}
            {engine.history?.length > 1 && <div className="paper-chart"><h3>Paper account equity</h3><ResponsiveContainer width="100%" height={230}><LineChart data={engine.history}><XAxis dataKey="time" minTickGap={60} tickFormatter={v => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} /><YAxis domain={['auto', 'auto']} width={85} tickFormatter={v => `$${Math.round(v).toLocaleString()}`} /><Tooltip labelFormatter={v => new Date(v).toLocaleString()} formatter={money} contentStyle={{ background: '#161b22', borderColor: '#343e46' }} /><Line dataKey="equity" name="Equity" stroke="#7ee787" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}
        </>}
        {error && <p role="alert" className="paper-error">{error}{snapshot && ' Displaying the last successful update.'}</p>}
        {!snapshot && !error && <p role="status">Connecting to paper account...</p>}
        {snapshot && <>
            <p className="paper-meta">{snapshot.account.status} · Market {snapshot.market.open ? 'open' : 'closed'} · Updated {new Date(snapshot.updatedAt).toLocaleString()}</p>
            <dl className="paper-stats">{[
                ['Equity', snapshot.account.equity], ['Cash', snapshot.account.cash],
                ['Buying power', snapshot.account.buyingPower], ['Equity change since prior close', snapshot.account.equityChange],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}</dl>
            <h3>Positions</h3>
            {!snapshot.positions.length ? <p className="paper-empty">No open positions.</p> : <div className="paper-table"><table><thead><tr><th>Symbol</th><th>Quantity</th><th>Market value</th><th>Unrealized P&amp;L</th></tr></thead><tbody>{snapshot.positions.map(p => <tr key={p.symbol}><td>{p.symbol}</td><td>{p.quantity}</td><td>{money(p.marketValue)}</td><td>{money(p.unrealizedPL)}</td></tr>)}</tbody></table></div>}
            <h3>Recent orders</h3>
            {!snapshot.orders.length ? <p className="paper-empty">No orders yet.</p> : <div className="paper-table"><table><thead><tr><th>Submitted</th><th>Symbol</th><th>Side</th><th>Filled / Qty</th><th>Fill price</th><th>Status</th></tr></thead><tbody>{snapshot.orders.map(o => <tr key={o.id}><td>{o.submittedAt ? new Date(o.submittedAt).toLocaleString() : '--'}</td><td>{o.symbol}</td><td>{o.side}</td><td>{o.filled} / {o.quantity ?? '--'}</td><td>{money(o.price)}</td><td>{o.status}</td></tr>)}</tbody></table></div>}
        </>}
        {!!engine?.events?.length && <><h3>Engine activity</h3><div className="paper-events">{engine.events.map(event => <div key={event.id}><time>{new Date(event.time).toLocaleString()}</time><span>{event.message}</span></div>)}</div></>}
    </section>;
}
