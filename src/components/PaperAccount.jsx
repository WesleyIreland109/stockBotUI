import { useEffect, useState } from 'react';

const money = value => value == null ? '--' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function PaperAccount() {
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let disposed = false;
        let timer;
        const controller = new AbortController();
        async function refresh() {
            try {
                const response = await fetch('/api/paper', { signal: controller.signal });
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
        <div className="paper-heading"><div><span className="eyebrow">Alpaca / PAPER</span><h2>Paper account</h2></div><span>Automated trading: off</span></div>
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
    </section>;
}
