import { useState, useEffect } from 'react';
import About from './components/About';
import Example from './components/Example';
import MarketMetrics from './components/MarketMetrics';
import PaperAccount from './components/PaperAccount';

const tabs = {
    '/': 'home',
    '/example': 'example',
    '/about': 'about',
    '/metrics': 'metrics',
    '/paper': 'paper',
};

function App() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [activeTab, setActiveTab] = useState(tabs[window.location.pathname] || 'home');
    const embedTarget = new URLSearchParams(window.location.search).get('embed');
    const isEmbedView = activeTab === 'metrics' && embedTarget;
    const isPaperView = activeTab === 'paper';

    useEffect(() => {
        const accepted = sessionStorage.getItem('stockbotDisclaimerAccepted') === 'true';
        setAcknowledged(accepted);
        setShowDisclaimer(!accepted && !isEmbedView && !isPaperView);
    }, [isEmbedView, isPaperView]);

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
        if (activeTab === 'paper') return <PaperAccount />;
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
                        <span className="eyebrow">A $1,000 paper-trading experiment</span>
                        <h1>StockBot</h1>
                        <p>
                            An old project, a new experiment: a self-hosted bot trading simulated money
                            and sharing the results in public. Follow its signals, orders, and equity
                            in Paper Trading. No real money is being traded.
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
                                StockBot is an experimental, self-hosted paper-trading project starting with $1,000 in simulated funds. The current bot uses a simple moving-average strategy, not AI predictions.
                            </p>
                            <p>
                                Paper fills and returns do not establish real-world profitability. Data gaps, bugs, outages, and rejected orders can interrupt trading or leave a position open. This project is educational, not investment advice or a recommendation to trade.
                            </p>
                        </div>
                        <div className="disclaimer-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                />
                                I understand that these are simulated trades, not investment advice
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
                    <h1>Paper Trading Lab</h1>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="nav-tabs">
                <button
                    className={`nav-tab ${activeTab === 'paper' ? 'active' : ''}`}
                    onClick={() => navigateTo('paper', '/paper')}
                >
                    Paper Trading
                </button>
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
