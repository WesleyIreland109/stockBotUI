import React from 'react';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-content">
                <h1>About StockBot</h1>
                
                <section className="about-section">
                    <h2>What is StockBot?</h2>
                    <p>
                        StockBot is an advanced investment analysis tool that combines traditional algorithmic logic 
                        with cutting-edge artificial intelligence to provide data-driven market suggestions. Our platform 
                        leverages multiple AI models and statistical analysis to help users make informed investment decisions.
                    </p>
                </section>

                <section className="about-section">
                    <h2>Our Technology</h2>
                    <div className="tech-grid">
                        <div className="tech-item">
                            <h3>Algorithmic Analysis</h3>
                            <p>
                                Our Kotlin/GoLang backend performs traditional statistical analysis using proven 
                                financial algorithms and market indicators to provide reliable baseline assessments.
                            </p>
                        </div>
                        <div className="tech-item">
                            <h3>AI-Powered Insights</h3>
                            <p>
                                TensorFlow models trained on extensive market data provide AI-driven predictions 
                                and pattern recognition for enhanced decision-making capabilities.
                            </p>
                        </div>
                        <div className="tech-item">
                            <h3>Real-time Market Analysis</h3>
                            <p>
                                Our system continuously monitors market conditions and news articles to provide 
                                up-to-date investment recommendations based on current market trends.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="about-section">
                    <h2>How It Works</h2>
                    <ol className="how-it-works">
                        <li>
                            <strong>Input Parameters:</strong> Enter your investment amount and desired timeframe
                        </li>
                        <li>
                            <strong>Multi-Model Analysis:</strong> Our system runs your parameters through multiple 
                            analysis engines simultaneously
                        </li>
                        <li>
                            <strong>Comprehensive Results:</strong> Receive detailed insights from both algorithmic 
                            and AI-powered analysis
                        </li>
                        <li>
                            <strong>Informed Decisions:</strong> Use the combined insights to make better investment decisions
                        </li>
                    </ol>
                </section>

                <section className="about-section">
                    <h2>Important Disclaimer</h2>
                    <div className="disclaimer-box">
                        <p>
                            <strong>StockBot is not a licensed financial advisor.</strong> All analysis and suggestions 
                            provided are for informational and educational purposes only. Investment decisions carry inherent 
                            risks, and past performance does not guarantee future results.
                        </p>
                        <p>
                            Users are responsible for conducting their own research and consulting with qualified 
                            financial professionals before making any investment decisions. StockBot and its creators 
                            are not liable for any financial losses or gains incurred through the use of this platform.
                        </p>
                    </div>
                </section>

                <section className="about-section">
                    <h2>Contact & Support</h2>
                    <p>
                        For questions, feedback, or support, please reach out to our team. We're committed to 
                        continuously improving StockBot to provide the best possible investment analysis tools.
                    </p>
                </section>
            </div>
        </div>
    );
} 