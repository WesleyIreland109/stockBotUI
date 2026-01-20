import React from 'react';

export default function ExampleOutput() {
    return (
        <div className="example-page">
            <div className="example-content">
                <h1>Example Desired Output</h1>
                <p className="muted">This page is a template where a full example printout will be populated.</p>

                <section className="example-section">
                    <h2>Overview</h2>
                    <p>Placeholder for summary and context about the sample output.</p>
                </section>

                <section className="example-section">
                    <h2>Input Parameters</h2>
                    <ul>
                        <li>Investment amount: <strong>$10,000</strong></li>
                        <li>Time horizon: <strong>1 year</strong></li>
                        <li>Risk preference: <strong>Conservative</strong></li>
                    </ul>
                </section>

                <section className="example-section">
                    <h2>Suggested Allocation (Example)</h2>
                    <table className="example-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Recommended Amount</th>
                                <th>Timeframe</th>
                                <th>Rationale</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ABCD</td>
                                <td>$2,500</td>
                                <td>1 year</td>
                                <td>Statistically low volatility with steady growth</td>
                            </tr>
                            <tr>
                                <td>EFGH</td>
                                <td>$3,000</td>
                                <td>1 year</td>
                                <td>High dividend yield and stable fundamentals</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="example-section">
                    <h2>Detailed Outputs</h2>
                    <p>Placeholder for the full printed analysis: statistics, VWAP, confidence intervals, and narrative explanation.</p>
                </section>
            </div>
        </div>
    );
}
