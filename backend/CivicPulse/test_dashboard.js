// Fetch dashboard data from backend (Google Sheet)
fetch('http://127.0.0.1:8000/dashboard-data').then(r => r.json()).then(data => {
    // Table
    let table = document.getElementById('reportTable');
    if (table) {
        table.innerHTML = '';
        data.reports.slice(0, 50).forEach(r => {
            let row = document.createElement('tr');
            row.innerHTML = `<td>${r.report}</td><td>${r.category}</td><td>${r.prediction}</td><td>${r.priority}</td><td>${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}</td><td>${r.time}</td>`;
            table.appendChild(row);
        });
    }
    // Prepare data for charts
    const categories = Object.keys(data.issueBreakdown);
    const numReports = Object.values(data.issueBreakdown);
    // Calculate average confidence per category
    const avgConfidence = categories.map(cat => {
        const filtered = data.reports.filter(r => r.category === cat && r.confidence !== undefined);
        if (filtered.length === 0) return 0;
        return filtered.reduce((sum, r) => sum + parseFloat(r.confidence || 0), 0) / filtered.length;
    });
    // Bar Chart (Performance by Issue Category)
    if (document.getElementById('barChart')) {
        new Chart(document.getElementById('barChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Average Confidence',
                        data: avgConfidence,
                        backgroundColor: '#2196f3',
                        borderRadius: 6,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Number of Reports',
                        data: numReports,
                        backgroundColor: '#4caf50',
                        borderRadius: 6,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Average Confidence' },
                        beginAtZero: true,
                        min: 0,
                        max: 1
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Number of Reports' },
                        beginAtZero: true,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
    // Pie Chart (Priority Distribution)
    if (document.getElementById('pieChart')) {
        const priorities = Object.keys(data.priorityBreakdown);
        const priorityCounts = Object.values(data.priorityBreakdown);
        new Chart(document.getElementById('pieChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: priorities,
                datasets: [{
                    data: priorityCounts,
                    backgroundColor: ['#4caf50','#ffeb3b','#f44336','#2196f3','#e91e63']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
});
