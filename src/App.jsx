import { useState, useEffect } from 'react';
import UserInputSection from './components/userInputSection';
import ResultBox from './components/ResultBox';
import About from './components/About';
import ExampleOutput from './components/ExampleOutput';

function App() {
    const [kotlinData, setKotlinData] = useState(null);
    const [connectionError, setConnectionError] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [showIntro, setShowIntro] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [showBoxes, setShowBoxes] = useState(false);

    useEffect(() => {
        // Show disclaimer on window load
        setShowDisclaimer(true);
    }, []);

    const handleDataFetched = (data) => {
        setKotlinData(data);
        setConnectionError(false); // Clear any previous connection errors
    console.log('handleDataFetched: showing boxes');
    setShowBoxes(true);
    };

    const handleConnectionError = () => {
        setConnectionError(true);
        setKotlinData(null); // Clear any existing data
    console.log('handleConnectionError: showing boxes despite error');
    setShowBoxes(true);
    };

    const handleAcknowledge = () => {
        if (acknowledged) {
            setShowDisclaimer(false);
            // Reveal the title/description after the disclaimer is accepted
            setTimeout(() => setShowIntro(true), 80);
        }
    };

    const renderContent = () => {
        if (activeTab === 'about') return <About />;
        if (activeTab === 'example') return <ExampleOutput />;

        return (
            <>
                <div className={`intro ${showIntro ? 'visible' : ''}`}>
                    <h2>StockBot App</h2>
                    <p>Please enter these two parameters to get started (dont worry, we won't ask for anything else after this)</p>
                </div>

                <UserInputSection
                    onDataFetched={handleDataFetched}
                    onConnectionError={handleConnectionError}
                />

                {showBoxes && (
                    <section id="results">
                        <div id="static-boxes">
                            <ResultBox
                                title="Statistics App"
                                description="This Service is a Kotlin/GOLang Application that shows non-AI, statistical conclusions based on user input."
                                data={kotlinData}
                                colorClass="light-blue"
                                connectionError={connectionError}
                                onOpenExample={() => setActiveTab('example')}
                            />
                            <ResultBox
                                title="AI Bot 1"
                                description="This bot will perform its own statistical analysis of the data that is being fed to the local app to the left"
                                colorClass="dark-orange"
                                imageSrc="./images/stockbot-reading.png"
                                onOpenExample={() => setActiveTab('example')}
                            />
                            <ResultBox
                                title="AI Bot 2"
                                description="This bot will be reviewing all Yahoo Finance articles through an API and gather attempted suggestions based on the news"
                                colorClass="dark-orange"
                                imageSrc="./images/stockbot-reading.png"
                                onOpenExample={() => setActiveTab('example')}
                            />
                        </div>
                    </section>
                )}
            </>
        );
    };

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

            <header className="topbar">
                <div className="header-left">
                    <img src="./images/stockbot-logo.png" alt="StockBot Logo" className="logo" />
                    <h1>StockBot Results</h1>
                </div>

                <div className="header-right">
                    {/* Navigation Tabs */}
                    <nav className="nav-tabs">
                        <button 
                            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => setActiveTab('home')}
                        >
                            Home
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'example' ? 'active' : ''}`}
                            onClick={() => setActiveTab('example')}
                        >
                            Example
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'about' ? 'active' : ''}`}
                            onClick={() => setActiveTab('about')}
                        >
                            About
                        </button>
                    </nav>
                </div>
            </header>

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
