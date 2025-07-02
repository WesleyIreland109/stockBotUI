export default function ResultBox({ title, description, data, colorClass, imageSrc }) {
    return (
        <div className={`box ${colorClass}`}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="dynamic-data">
                {data ? (
                    <div className="result-item">
                        <h4>{data.ticker}</h4>
                        <p><strong>Recommended Amount:</strong> ${data.recommendedAmount}</p>
                        <p><strong>Timeframe:</strong> {data.timeframe}</p>
                        <p><strong>VWAP:</strong> {data.vwap}</p>
                    </div>
                ) : (
                    <>
                        <p>Awaiting user input...</p>
                        {imageSrc && <img src={imageSrc} alt="StockBot" width="300" />}
                    </>
                )}
            </div>
        </div>
    );
}
