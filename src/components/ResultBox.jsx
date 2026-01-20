import { useState } from 'react';

export default function ResultBox({ title, description, data, colorClass, imageSrc, connectionError, onOpenExample }) {
    const [showServerPopup, setShowServerPopup] = useState(true);

    const closePopup = () => setShowServerPopup(false);

    return (
        <div className={`box ${colorClass}`}>
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="dynamic-data">
                {connectionError ? (
                    <>
                        {showServerPopup && (
                            <div className="modal">
                                <div className="modal-content server-modal">
                                    <h2>Servers Are Expensive</h2>
                                    <div className="server-text">
                                        <p>
                                            StockBot is still in its beginning phases. Due to the cost of the API used to pull the stock data and the cost of storing the data, the full algorithmic results are not available for the public just yet.
                                        </p>
                                        <p>
                                            <a
                                                className="info-link"
                                                href="#example"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (typeof onOpenExample === 'function') onOpenExample();
                                                    closePopup();
                                                }}
                                            >
                                                Click this link here
                                            </a>{' '}
                                            to see an example for desired results
                                        </p>
                                    </div>
                                    <div className="modal-actions">
                                        <button className="acknowledge-btn" onClick={closePopup}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <img src="./images/stockbot-unplugged.png" alt="StockBot Unplugged" width="300" />
                    </>
                ) : data ? (
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
