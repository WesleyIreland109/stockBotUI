import { useState } from 'react';

export default function UserInputSection({ onDataFetched }) {
    const [amount, setAmount] = useState('');
    const [timeframe, setTimeframe] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!amount || !timeframe) {
            alert("Please enter both amount and timeframe.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/stock-data/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    timeframe
                })
            });
            const data = await response.json();
            onDataFetched(data);
        } catch (err) {
            console.error(err);
            alert("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="user-input-section">
            <h2>Investment Parameters</h2>
            <div className="user-inputs">
                <input
                    type="number"
                    placeholder="Investment Amount (USD)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                />
                <input
                    type="text"
                    placeholder="Timeframe (e.g., 6 months)"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                />
                <button onClick={handleAnalyze} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Investment"}
                </button>
            </div>
        </section>
    );
}
