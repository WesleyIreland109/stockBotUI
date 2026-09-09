import { useState, useEffect } from 'react';
import About from './components/About';
import Example from './components/Example';
import MarketMetrics from './components/MarketMetrics';

const tabs = {
    '/': 'home',
    '/example': 'example',
    '/about': 'about',
    '/metrics': 'metrics',
};

function App() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [activeTab, setActiveTab] = useState(tabs[window.location.pathname] || 'home');
    const embedTarget = new URLSearchParams(window.location.search).get('embed');
    const isEmbedView = activeTab === 'metrics' && embedTarget;

    useEffect(() => {
        const accepted = sessionStorage.getItem('stockbotDisclaimerAccepted') === 'true';
        setAcknowledged(accepted);
        setShowDisclaimer(!accepted && !isEmbedView);
    }, [isEmbedView]);

    useEffect(() => {
        const handlePopState = () => {
            setActiveTab(tabs[window.location.pathname] || 'home');
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigateTo = (tab, path) => {
        window.history.pushState({}, '', path);
        setActiveTab(tab);
    };

    const handleAcknowledge = () => {
        if (acknowledged) {
            sessionStorage.setItem('stockbotDisclaimerAccepted', 'true');
            setShowDisclaimer(false);
        }
    };

    const renderContent = () => {
        if (activeTab === 'about') {
            return <About />;
        }

        if (activeTab === 'example') {
            return <Example />;
        }

        if (activeTab === 'metrics') {
            return (
                <div className="metrics-page">
                    <MarketMetrics title="StockBot Metrics Endpoint" embedTarget={embedTarget} />
                </div>
            );
        }

        return (
            <div className="home-page">
                <section className="home-hero">
                    <div>
                        <span className="eyebrow">StockBot live demo</span>
                        <h1>Market context, ready for the next recommendation.</h1>
                        <p>
                            StockBot now pulls live broad-market signals into a focused dashboard,
                            keeping the original bot workflow grounded in current price action.
                        </p>
                    </div>
                    <img src="./images/stockbot-head.png" alt="StockBot" />
                </section>

                <MarketMetrics variant="compact" title="Today’s Market Pulse" />

                {/*
                <UserInputSection onDataFetched={handleDataFetched} onConnectionError={handleConnectionError} />
                <section id="results">...</section>
                */}
            </div>
        );
    };

    if (isEmbedView) {
        return (
            <main className="embed-shell">
                {renderContent()}
            </main>
        );
    }

    return (
        <div className="app">
            {/* Disclaimer Modal */}
            {showDisclaimer && (
                <div className="modal">
                    <div className="modal-content disclaimer-modal">
                        <h2>StockBot Disclaimer</h2>
                        <div className="disclaimer-text">
                            <p>
                                StockBot is a tool that combines traditional algorithmic logic with artificial intelligence to provide data-driven market suggestions.
                            </p>
                            <p>
                                It is not a licensed financial advisor and does not guarantee results. By using this platform, users acknowledge and accept that all 
                                financial decisions are made at their own discretion and risk. StockBot and its creators are not liable for any gains or losses incurred. 
                                This tool is intended solely for informational and educational purposes.
                            </p>
                        </div>
                        <div className="disclaimer-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                />
                                I acknowledge and accept the terms and conditions stated above
                            </label>
                        </div>
                        <button 
                            className="acknowledge-btn"
                            onClick={handleAcknowledge}
                            disabled={!acknowledged}
                        >
                            I Understand and Accept
                        </button>
                    </div>
                </div>
            )}

            <header>
                <img src="./images/stockbot-logo.png" alt="StockBot Logo" className="logo" />
                <div>
                    <span className="eyebrow">StockBot</span>
                    <h1>Market Intelligence</h1>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="nav-tabs">
                <button 
                    className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => navigateTo('home', '/')}
                >
                    Home
                </button>
                <button
                    className={`nav-tab ${activeTab === 'example' ? 'active' : ''}`}
                    onClick={() => navigateTo('example', '/example')}
                >
                    Example
                </button>
                <button 
                    className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`}
                    onClick={() => navigateTo('about', '/about')}
                >
                    About
                </button>
            </nav>

            <main>
                {renderContent()}
            </main>
            <footer>
                <p>&copy; 2026 StockBot</p>
            </footer>
        </div>
    );
}

export default App;
