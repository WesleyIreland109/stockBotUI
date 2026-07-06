import { useEffect, useMemo, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

const fallbackMetrics = {
    updatedAt: new Date().toISOString(),
    source: 'Demo fallback',
    marketData: [
        {
            symbol: 'SPY',
            name: 'S&P 500 ETF',
            price: 623.42,
            changePercent: 0.42,
            monthChangePercent: 2.2,
            history: [
                { date: '2026-06-06', close: 610.1 },
                { date: '2026-06-13', close: 614.9 },
                { date: '2026-06-20', close: 618.6 },
                { date: '2026-06-27', close: 621.4 },
                { date: '2026-07-03', close: 623.42 },
            ],
        },
        {
            symbol: 'QQQ',
            name: 'Nasdaq 100 ETF',
            price: 556.18,
            changePercent: 0.76,
            monthChangePercent: 3.4,
            history: [
                { date: '2026-06-06', close: 538.2 },
                { date: '2026-06-13', close: 544.8 },
                { date: '2026-06-20', close: 548.1 },
                { date: '2026-06-27', close: 552.6 },
                { date: '2026-07-03', close: 556.18 },
            ],
        },
        {
            symbol: 'DIA',
            name: 'Dow 30 ETF',
            price: 446.05,
            changePercent: 0.21,
            monthChangePercent: 1.1,
            history: [
                { date: '2026-06-06', close: 441.0 },
                { date: '2026-06-13', close: 442.4 },
                { date: '2026-06-20', close: 443.2 },
                { date: '2026-06-27', close: 445.0 },
                { date: '2026-07-03', close: 446.05 },
            ],
        },
        {
            symbol: 'IWM',
            name: 'Russell 2000 ETF',
            price: 218.77,
            changePercent: -0.18,
            monthChangePercent: -0.7,
            history: [
                { date: '2026-06-06', close: 220.2 },
                { date: '2026-06-13', close: 219.9 },
                { date: '2026-06-20', close: 217.8 },
                { date: '2026-06-27', close: 218.1 },
                { date: '2026-07-03', close: 218.77 },
            ],
        },
    ],
};

const percentFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

function formatPercent(value) {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${percentFormatter.format(value)}%`;
}

function formatPrice(value) {
    if (value === null || value === undefined) return 'N/A';
    return dollarFormatter.format(value);
}

function buildIndexSeries(marketData) {
    const tracked = marketData.filter((item) => item.symbol !== '^VIX' && item.history?.length);
    const dates = [...new Set(tracked.flatMap((item) => item.history.map((point) => point.date)))];

    return dates.map((date) => {
        const point = { date: date.slice(5) };
        tracked.forEach((item) => {
            const first = item.history[0]?.close;
            const match = item.history.find((historyPoint) => historyPoint.date === date);
            if (first && match?.close) {
                point[item.symbol] = Number((((match.close - first) / first) * 100).toFixed(2));
            }
        });
        return point;
    });
}

function buildEmbedCode(widget) {
    const origin = window.location.origin;
    return `<iframe src="${origin}/metrics?embed=${widget}" width="100%" height="420" style="border:0;border-radius:8px;overflow:hidden;" loading="lazy"></iframe>`;
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

function WidgetShell({ id, title, caption, children, onCopy, copied }) {
    return (
        <div className="chart-card embed-widget">
            <div className="chart-title">
                <div>
                    <h3>{title}</h3>
                    {caption && <p>{caption}</p>}
                </div>
                {onCopy && (
                    <button className="copy-embed-btn" type="button" onClick={() => onCopy(id)}>
                        {copied ? 'Copied' : 'Copy Embed'}
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

export default function MarketMetrics({ variant = 'full', title = 'Live Market Metrics', embedTarget = null }) {
    const [metrics, setMetrics] = useState(null);
    const [status, setStatus] = useState('loading');
    const [copiedWidget, setCopiedWidget] = useState(null);

    useEffect(() => {
        let active = true;

        fetch('/api/metrics')
            .then((response) => {
                if (!response.ok) throw new Error('Metrics API unavailable');
                return response.json();
            })
            .then((data) => {
                if (!active) return;
                setMetrics(data);
                setStatus('ready');
            })
            .catch(() => {
                if (!active) return;
                setMetrics(fallbackMetrics);
                setStatus('fallback');
            });

        return () => {
            active = false;
        };
    }, []);

    const marketData = useMemo(() => metrics?.marketData ?? [], [metrics]);
    const indexSeries = useMemo(() => buildIndexSeries(marketData), [marketData]);
    const monthlyBars = useMemo(() => marketData
        .filter((item) => item.symbol !== '^VIX')
        .map((item) => ({
            symbol: item.symbol,
            change: Number((item.monthChangePercent ?? 0).toFixed(2)),
        })), [marketData]);
    const compact = variant === 'compact';
    const embedded = Boolean(embedTarget);
    const draggable = !compact && !embedded;
    const featured = marketData.find((item) => item.symbol === 'SPY') ?? marketData[0];
    const layouts = {
        lg: [
            { i: 'performance', x: 0, y: 0, w: 8, h: 8, minW: 5, minH: 6 },
            { i: 'movers', x: 8, y: 0, w: 4, h: 8, minW: 3, minH: 6 },
        ],
        md: [
            { i: 'performance', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
            { i: 'movers', x: 6, y: 0, w: 4, h: 8, minW: 3, minH: 6 },
        ],
        sm: [
            { i: 'performance', x: 0, y: 0, w: 6, h: 7, minW: 4, minH: 5 },
            { i: 'movers', x: 0, y: 7, w: 6, h: 7, minW: 4, minH: 5 },
        ],
    };

    const handleCopyEmbed = async (widget) => {
        const embedCode = buildEmbedCode(widget);
        try {
            await navigator.clipboard.writeText(embedCode);
        } catch {
            fallbackCopy(embedCode);
        }
        setCopiedWidget(widget);
        window.setTimeout(() => setCopiedWidget(null), 1400);
    };

    const performanceWidget = (
        <WidgetShell
            id="performance"
            title="One-Month Relative Performance"
            caption={featured && `${featured.symbol} leads the demo view at ${formatPercent(featured.monthChangePercent)} over the period.`}
            onCopy={draggable ? handleCopyEmbed : null}
            copied={copiedWidget === 'performance'}
        >
            <ResponsiveContainer width="100%" height="82%">
                <AreaChart data={indexSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                        <linearGradient id="spyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="qqqGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2ea043" stopOpacity={0.42} />
                            <stop offset="95%" stopColor="#2ea043" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#8b949e" tickLine={false} />
                    <YAxis stroke="#8b949e" tickLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                        contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
                        formatter={(value, name) => [`${value}%`, name]}
                    />
                    <Area type="monotone" dataKey="SPY" stroke="#58a6ff" fill="url(#spyGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="QQQ" stroke="#2ea043" fill="url(#qqqGradient)" strokeWidth={2} />
                    {!compact && <Area type="monotone" dataKey="DIA" stroke="#d18616" fill="transparent" strokeWidth={2} />}
                    {!compact && <Area type="monotone" dataKey="IWM" stroke="#f85149" fill="transparent" strokeWidth={2} />}
                </AreaChart>
            </ResponsiveContainer>
        </WidgetShell>
    );

    const moversWidget = (
        <WidgetShell
            id="movers"
            title="Monthly Movers"
            caption="ETF proxy performance for broad market segments."
            onCopy={draggable ? handleCopyEmbed : null}
            copied={copiedWidget === 'movers'}
        >
            <ResponsiveContainer width="100%" height="82%">
                <BarChart data={monthlyBars} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
                    <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" stroke="#8b949e" tickLine={false} />
                    <YAxis stroke="#8b949e" tickLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                        contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
                        formatter={(value) => [`${value}%`, '1M change']}
                    />
                    <Bar dataKey="change" fill="#d18616" radius={[5, 5, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </WidgetShell>
    );

    if (status === 'loading' || !metrics) {
        return (
            <section className={`metrics-panel ${compact ? 'compact' : ''} ${embedded ? 'embedded' : ''}`}>
                <div className="metrics-header">
                    <div>
                        <span className="eyebrow">Market pulse</span>
                        <h2>{title}</h2>
                    </div>
                </div>
                <div className="metrics-loading">Loading market data...</div>
            </section>
        );
    }

    return (
        <section className={`metrics-panel ${compact ? 'compact' : ''} ${embedded ? 'embedded' : ''}`}>
            {!embedded && (
                <div className="metrics-header">
                    <div>
                        <span className="eyebrow">Market pulse</span>
                        <h2>{title}</h2>
                    </div>
                    <div className="metrics-meta">
                        <span>{metrics.source}</span>
                        <span>{new Date(metrics.updatedAt).toLocaleString()}</span>
                        {status === 'fallback' && <span>Offline demo data</span>}
                    </div>
                </div>
            )}

            {!embedded && (
                <div className="ticker-strip">
                    {marketData.map((item) => (
                        <div className="ticker-card" key={item.symbol}>
                            <span>{item.symbol}</span>
                            <strong>{formatPrice(item.price)}</strong>
                            <em className={(item.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}>
                                {formatPercent(item.changePercent)}
                            </em>
                        </div>
                    ))}
                </div>
            )}

            {embedded ? (
                <div className="embedded-widget-frame">
                    {embedTarget === 'movers' ? moversWidget : performanceWidget}
                </div>
            ) : draggable ? (
                <ResponsiveGridLayout
                    className="metrics-layout"
                    layouts={layouts}
                    breakpoints={{ lg: 996, md: 768, sm: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6 }}
                    rowHeight={38}
                    margin={[16, 16]}
                    resizeHandles={['se']}
                    draggableHandle=".chart-title"
                >
                    <div key="performance">
                        {performanceWidget}
                    </div>
                    <div key="movers">
                        {moversWidget}
                    </div>
                </ResponsiveGridLayout>
            ) : (
                <div className="metrics-grid">
                    <div className="compact-chart-wrap">
                        {performanceWidget}
                    </div>
                </div>
            )}
        </section>
    );
}
