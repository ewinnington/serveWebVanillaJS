document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch data from the API
    function fetchData(page = 1) {
        fetch(`/data?page=${page}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(response => {
                renderTable(response.data);
                updatePagination(response.currentPage, response.totalPages);
            })
            .catch(error => console.error('There has been a problem with your fetch operation:', error));
    }

    // Function to render the data into the table
    function renderTable(data) {
        const tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            const urlCell = document.createElement('td');
            const urlLink = document.createElement('a');
            urlLink.href = item.url;
            urlLink.textContent = item.url;
            urlCell.appendChild(urlLink);
            row.appendChild(urlCell);

            const pageCell = document.createElement('td');
            pageCell.textContent = item.page;
            row.appendChild(pageCell);

            tableBody.appendChild(row);
        });
    }

    function updatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', function() {
            fetchData(i);
            });
            pageLink.classList.add('pagination-link');
            if (i === currentPage) {
            pageLink.classList.add('active');
            }

            if (i <= 3 || i > totalPages - 3 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagination.appendChild(pageLink);
            } else if (pagination.lastChild.tagName !== 'SPAN') {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.classList.add('pagination-link');
            pagination.appendChild(ellipsis);
            }
        }
    }

    // Fetch data when the DOM is fully loaded
    fetchData();
});