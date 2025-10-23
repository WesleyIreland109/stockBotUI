import { useState } from 'react';

export default function UserInputSection({ onDataFetched, onConnectionError }) {
    const [amount, setAmount] = useState('');
    const [timeframeValue, setTimeframeValue] = useState('');
    const [timeframeUnit, setTimeframeUnit] = useState('month');
    const [loading, setLoading] = useState(false);

    // Format number as USD
    const formatUSD = (value) => {
        if (!value) return '';
        const number = Number(value.replace(/[^0-9.]/g, ''));
        if (isNaN(number)) return '';
        return number.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    };

    // Handle amount input and formatting
    const handleAmountChange = (e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        // Only allow one decimal point
        const parts = raw.split('.');
        let formatted = parts[0];
        if (parts.length > 1) {
            formatted += '.' + parts[1].slice(0, 2); // max 2 decimals
        }
        setAmount(formatted);
    };

    // Handle timeframe value input (numbers only)
    const handleTimeframeValueChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        setTimeframeValue(raw);
    };

    const handleAnalyze = async () => {
        if (!amount || !timeframeValue) {
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
                    timeframe: `${timeframeValue} ${timeframeUnit}${timeframeValue > 1 ? 's' : ''}`
                })
            });
            const data = await response.json();
            onDataFetched(data);
        } catch (err) {
            console.error(err);
            onConnectionError();
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="user-input-section">
            <h2>Investment Parameters</h2>
            <div className="user-inputs">
                {/* Amount input with $ sign and formatting */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 4 }}>$</span>
                    <input
                        type="text"
                        placeholder="Investment Amount (USD)"
                        value={formatUSD(amount)}
                        onChange={handleAmountChange}
                        min="0"
                        inputMode="decimal"
                        style={{ width: 160 }}
                    />
                </div>
                {/* Timeframe input: number + dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                        type="text"
                        placeholder="Timeframe"
                        value={timeframeValue}
                        onChange={handleTimeframeValueChange}
                        min="1"
                        inputMode="numeric"
                        style={{ width: 80 }}
                    />
                    <select
                        value={timeframeUnit}
                        onChange={e => setTimeframeUnit(e.target.value)}
                        style={{ height: 28 }}
                    >
                        <option value="year">Year(s)</option>
                        <option value="month">Month(s)</option>
                        <option value="day">Day(s)</option>
                    </select>
                </div>
                <button onClick={handleAnalyze} disabled={loading}>
                    {loading ? "Analyzing..." : "Analyze Investment"}
                </button>
            </div>
        </section>
    );
}
