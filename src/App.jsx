import { useState } from 'react';
import UserInputSection from './components/userInputSection';
import ResultBox from './components/ResultBox';

function App() {
    const [kotlinData, setKotlinData] = useState(null);

    const handleDataFetched = (data) => {
        setKotlinData(data);
    };

    return (
        <div className="app">
            <header>
                <img src="/stockbot-logo.png" alt="StockBot Logo" className="logo" />
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
                            imageSrc="/stockbot-reading.png"
                        />
                        <ResultBox
                            title="Tensorflow Bot 2"
                            description="This one trained on the market and reads the latest articles for suggestions."
                            colorClass="dark-orange"
                            imageSrc="/stockbot-reading.png"
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
