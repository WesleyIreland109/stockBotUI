const dynamicContainer = document.getElementById('dynamic-data');
dynamicContainer.innerHTML = ''; // Only clears the dynamic part

// Function to fetch data from the backend and display it
// Function to fetch data from the backend and display it
async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/stock-data'); // Replace with your actual API
        const data = await response.json();

        // Example logic — update each of the 3 boxes
        const boxes = [
            document.querySelector('#box-kotlin .dynamic-data'),
            document.querySelector('#box-ai1 .dynamic-data'),
            document.querySelector('#box-ai2 .dynamic-data')
        ];

        if (data.length > 0) {
            boxes.forEach((container, index) => {
                container.innerHTML = ''; // Clear before inserting
                const item = data[index % data.length]; // Loop through data if less than 3
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('result-item');
                resultDiv.innerHTML = `
                    <h4>${item.stockName}</h4>
                    <p>Price: $${item.price}</p>
                    <p>Change: ${item.change}%</p>
                `;
                container.appendChild(resultDiv);
            });
        } else {
            throw new Error("Empty data array");
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Show error inside each box
        document.querySelectorAll('.dynamic-data').forEach(container => {
            container.innerHTML = '<p style="color: red;">Error loading data.</p>';
        });
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
window.onload = function () {
    showModal();
    fetchData();
};