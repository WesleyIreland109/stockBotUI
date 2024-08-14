// Function to fetch data from the backend and display it
async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/stock-data'); // Replace with your API endpoint
        const data = await response.json();

        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        if (data.length > 0) {
            data.forEach(item => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('result-item');
                resultDiv.innerHTML = `
                    <h2>${item.stockName}</h2>
                    <p>Price: $${item.price}</p>
                    <p>Change: ${item.change}%</p>
                `;
                resultsContainer.appendChild(resultDiv);
            });
        } else {
            resultsContainer.innerHTML = '<p>No data available.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('results').innerHTML = '<p>Error loading data.</p>';
    }
}

// Function to show the custom modal
function showModal() {
    document.getElementById('welcome-modal').style.display = 'flex';
}

// Function to close the custom modal
function closeModal() {
    document.getElementById('welcome-modal').style.display = 'none';
}

// Call showModal and fetchData when the page loads
window.onload = function() {
    showModal();
    fetchData();
};
