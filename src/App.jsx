import { useState, useEffect } from 'react';
import UserInputSection from './components/userInputSection';
import ResultBox from './components/ResultBox';

function App() {
    const [kotlinData, setKotlinData] = useState(null);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        // Show disclaimer on window load
        setShowDisclaimer(true);
    }, []);

    const handleDataFetched = (data) => {
        setKotlinData(data);
    };

    const handleAcknowledge = () => {
        if (acknowledged) {
            setShowDisclaimer(false);
        }
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

            <header>
                <img src="./images/stockbot-logo.png" alt="StockBot Logo" className="logo" />
                <h1>StockBot Results</h1>
            </header>
            <main>
                <UserInputSection onDataFetched={handleDataFetched} />
                <section id="results">
                    <div id="static-boxes">
                        <ResultBox
                            title="Kotlin/GOlang Local App"
                            description="This section shows the algorithmic, non-AI statistical analysis based on user input."
                            data={kotlinData}
                            colorClass="light-blue"
                        />
                        <ResultBox
                            title="Tensorflow Bot 1"
                            description="This section does what the Kotlin app does but AI."
                            colorClass="dark-orange"
                            imageSrc="./images/stockbot-reading.png"
                        />
                        <ResultBox
                            title="Tensorflow Bot 2"
                            description="This one trained on the market and reads the latest articles for suggestions."
                            colorClass="dark-orange"
                            imageSrc="./images/stockbot-reading.png"
                        />
                    </div>
                </section>
            </main>
            <footer>
                <p>&copy; 2025 StockBot</p>
            </footer>
        </div>
    );
}

export default App;
