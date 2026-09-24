import MarketMetrics from './MarketMetrics';

export default function Example() {
    return (
        <div className="example-page">
            <section className="example-hero">
                <div>
                    <span className="eyebrow">Inside the experiment</span>
                    <h1>From signal to paper trade</h1>
                    <p>
                        The current excursion tests a simple idea with $1,000 in simulated funds:
                        watch completed five-minute bars, enter only on a qualifying crossover,
                        and record what actually happens. A signal is not a promise of profit.
                    </p>
                </div>
                <img src="./images/stockbot-typing.png" alt="StockBot preparing a market brief" />
            </section>

            <MarketMetrics title="Broad-Market Context" />

            <section className="example-workflow">
                <div className="workflow-panel">
                    <span className="step-number">01</span>
                    <h2>Wait for a signal</h2>
                    <p>The bot watches SPYM and SCHG for a five-bar average crossing above a twenty-bar average. Missing or stale IEX data means waiting, not inventing a trade.</p>
                </div>
                <div className="workflow-panel">
                    <span className="step-number">02</span>
                    <h2>Size a paper order</h2>
                    <p>Whole-share entries stay within 10% of equity, available cash, and the risk budget. At $1,000 equity, that means at most $100 per position, with broker stop and target orders.</p>
                </div>
                <div className="workflow-panel">
                    <span className="step-number">03</span>
                    <h2>Observe the outcome</h2>
                    <p>The public paper account shows fills, open positions, equity, and warnings. The engine aims to exit before the session ends; failed exits stay visible and require recovery.</p>
                </div>
            </section>
        </div>
    );
}
