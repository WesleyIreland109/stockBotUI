import MarketMetrics from './MarketMetrics';

export default function Example() {
    return (
        <div className="example-page">
            <section className="example-hero">
                <div>
                    <span className="eyebrow">Demo workflow</span>
                    <h1>StockBot Market Brief</h1>
                    <p>
                        A polished demo surface for showing how StockBot can combine user intent,
                        market context, and model-ready metrics in one analyst-style workflow.
                    </p>
                </div>
                <img src="./images/stockbot-typing.png" alt="StockBot preparing a market brief" />
            </section>

            <MarketMetrics title="Market Context For The Demo" />

            <section className="example-workflow">
                <div className="workflow-panel">
                    <span className="step-number">01</span>
                    <h2>Capture Intent</h2>
                    <p>Start with investment amount, timeframe, and risk posture so the analysis has a clear shape.</p>
                </div>
                <div className="workflow-panel">
                    <span className="step-number">02</span>
                    <h2>Pull Market State</h2>
                    <p>Use live ETF proxies, volatility, and recent trend data to ground the recommendation.</p>
                </div>
                <div className="workflow-panel">
                    <span className="step-number">03</span>
                    <h2>Explain The Result</h2>
                    <p>Present a recommendation with enough context that a viewer can understand the tradeoff.</p>
                </div>
            </section>
        </div>
    );
}
