import React from 'react';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-content">
                <h1>About StockBot</h1>
                <section className="about-section">
                    <h2>What is StockBot?</h2>
                    <p>
                        StockBot is a data-driven investing platform designed to help everyday investors make
                        statistically informed stock investment decisions. The product emphasizes transparency,
                        education, and statistical reasoning rather than opaque bullish/bearish signals.
                    </p>
                </section>

                <section className="about-section">
                    <h2>Project Goals & Differentiators</h2>
                    <ul>
                        <li>Provide statistically informed investment suggestions based on user parameters.</li>
                        <li>Be transparent about how recommendations are derived and provide educational context.</li>
                        <li>Automate market data collection, storage, and analysis for reliable, repeatable results.</li>
                        <li>Offer customizable inputs (investment amount, timeframe, risk) instead of one-size-fits-all advice.</li>
                    </ul>
                </section>

                <section className="about-section">
                    <h2>Current Status</h2>
                    <p>
                        StockBot is early-stage and partially implemented. The frontend (this UI) is functional
                        and deployed. Backend ingestion, storage, and analysis engines are under active
                        development. The project's repositories are split into the frontend (`StockBotUI`),
                        a market data ingestion service (`StockBot`), and the analysis engine (`StockBotLogic`).
                    </p>
                </section>

                <section className="about-section">
                    <h2>Repositories</h2>
                    <ul>
                        <li><strong>StockBotUI</strong> — Frontend (React + Vite): user input, results display, and example outputs.</li>
                        <li><strong>StockBot</strong> — Market data ingestion service (pulls data from providers like Polygon).</li>
                        <li><strong>StockBotLogic</strong> — Analysis and decision engine that processes stored market data.</li>
                    </ul>
                </section>

                <section className="about-section">
                    <h2>Important Disclaimer</h2>
                    <div className="disclaimer-box">
                        <p>
                            <strong>StockBot is not a licensed financial advisor.</strong> All analysis and suggestions
                            provided are for informational and educational purposes only. Investment decisions carry
                            inherent risks; past performance does not guarantee future results.
                        </p>
                    </div>
                </section>

                <section className="about-section">
                    <h2>Author & Source</h2>
                    <p>
                        StockBot is authored and maintained by Wesley Ireland. For more information, source code,
                        and related repositories, visit the StockBot organization on GitHub and the author's GitHub:
                    </p>
                    <p>
                        <a className="info-link" href="https://github.com/StockBotApp" target="_blank" rel="noreferrer">StockBot organization</a>
                        {' '}•{' '}
                        <a className="info-link" href="https://github.com/WesleyIreland109" target="_blank" rel="noreferrer">Wesley Ireland (author)</a>
                    </p>
                </section>
            </div>
        </div>
    );
} 