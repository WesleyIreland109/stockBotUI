import React from 'react';
import MarketMetrics from './MarketMetrics';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-content">
                <h1>About StockBot</h1>
                <MarketMetrics variant="compact" title="Market Data StockBot Watches" />
                
                <section className="about-section">
                    <h2>What is StockBot?</h2>
                    <p>
                        StockBot is Wesley Ireland's ongoing personal project. It began as an exploration of
                        market analysis and machine learning. This temporary excursion revisits it as a
                        self-hosted paper-trading experiment, starting with $1,000 in simulated money and
                        making the progress visible in public.
                    </p>
                </section>

                <section className="about-section">
                    <h2>The Current Setup</h2>
                    <div className="tech-grid">
                        <div className="tech-item">
                            <h3>A Simple Strategy</h3>
                            <p>
                                A Node.js engine watches five-minute SPYM and SCHG bars for a 5/20
                                moving-average crossover. It uses whole-share, long-only paper orders
                                with position limits, broker stop/target orders, and a daily loss halt.
                            </p>
                        </div>
                        <div className="tech-item">
                            <h3>Self-Hosted Execution</h3>
                            <p>
                                Docker runs the engine in an Ubuntu VM on Proxmox. SQLite records order
                                intents and fills across restarts. Orders go only to Alpaca's paper API;
                                the current engine has no live-money mode or TensorFlow predictions.
                            </p>
                        </div>
                        <div className="tech-item">
                            <h3>Public Results</h3>
                            <p>
                                The website shows paper equity, positions, orders, and engine activity
                                through a read-only HTTPS connection. The bot uses IEX market data;
                                the separate market-context charts use Yahoo Finance and label fallback data.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="about-section">
                    <h2>How It Works</h2>
                    <ol className="how-it-works">
                        <li>
                            <strong>Start Small:</strong> Begin with $1,000 in a dedicated simulated account.
                        </li>
                        <li>
                            <strong>Wait for Evidence:</strong> Require complete session bars, a crossover, and a fresh quote before considering an entry.
                        </li>
                        <li>
                            <strong>Apply Limits:</strong> Cap exposure, stop new entries near the close, and attempt to finish the day flat.
                        </li>
                        <li>
                            <strong>Learn in Public:</strong> Inspect the Paper Trading page for actual simulated results, including errors and missed exits.
                        </li>
                    </ol>
                </section>

                <section className="about-section">
                    <h2>Important Disclaimer</h2>
                    <div className="disclaimer-box">
                        <p>
                            <strong>This is a software experiment, not investment advice.</strong> No real
                            money is traded by the current engine. Paper fills do not reproduce all live
                            execution costs or constraints, and simulated returns do not prove a profitable strategy.
                        </p>
                        <p>
                            Risk controls are not guarantees. Data gaps, software bugs, broker rejections,
                            or home-server outages can prevent entries or exits. An overnight position
                            is an exception to investigate, not an intended part of the strategy.
                        </p>
                    </div>
                </section>

                <section className="about-section">
                    <h2>Contact & Support</h2>
                    <p>
                        For questions, feedback, or support, connect with the project maintainer on GitHub.
                        Feedback on the code, experiments, and failure cases is welcome.
                    </p>
                    <p>
                        <a className="profile-link" href="https://github.com/WesleyIreland109" target="_blank" rel="noreferrer">
                            View Wesley Ireland on GitHub
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
} 
