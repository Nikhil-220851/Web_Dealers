/**
 * LoanPro Agent Analytics — analytics.js
 * Completely rebuilt for fintech-style UI with Chart.js
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics();
});

async function fetchAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/loanagent-analytics.php`);
        const data = await response.json();

        if (data.status === "success") {
            renderStats(data);
            renderCharts(data);
        } else {
            console.error("Failed to fetch analytics:", data.message);
        }
    } catch (error) {
        console.error("Error fetching analytics:", error);
    }
}

function renderStats(data) {
    document.getElementById("totalLoans").innerText = data.total_loans || 0;
    document.getElementById("approvalRate").innerText = (data.approval_rate_overall || 0) + "%";
    document.getElementById("totalCommission").innerText = "₹" + (data.total_commission || 0).toLocaleString('en-IN');
    document.getElementById("pendingLoans").innerText = data.pending || 0;
}

function renderCharts(data) {
    // Global Chart Config
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.color = '#64748b';

    // 1. Loan Funnel (BAR)
    new Chart(document.getElementById("loanFunnelChart"), {
        type: 'bar',
        data: {
            labels: ['Pending', 'Review', 'Approved', 'Rejected'],
            datasets: [{
                label: 'Loan Applications',
                data: [
                    data.pending || 0,
                    data.review || 0,
                    data.approved || 0,
                    data.rejected || 0
                ],
                backgroundColor: [
                    '#f59e0b', // Pending (Orange)
                    '#6366f1', // Review (Indigo)
                    '#10b981', // Approved (Green)
                    '#ef4444'  // Rejected (Red)
                ],
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Monthly Loans (LINE)
    new Chart(document.getElementById("monthlyLoansChart"), {
        type: 'line',
        data: {
            labels: data.months || [],
            datasets: [{
                label: 'Volume',
                data: data.monthly_loans || [],
                borderColor: '#8B0000',
                backgroundColor: 'rgba(139, 0, 0, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 3. Commission Trend (LINE)
    new Chart(document.getElementById("commissionChart"), {
        type: 'line',
        data: {
            labels: data.months || [],
            datasets: [{
                label: 'Commission (₹)',
                data: data.monthly_commission || [],
                borderColor: '#DC143C',
                backgroundColor: 'rgba(220, 20, 60, 0.05)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Status Distribution (DOUGHNUT)
    new Chart(document.getElementById("statusChart"), {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [
                    data.approved || 0,
                    data.pending || 0,
                    data.rejected || 0
                ],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                hoverOffset: 12,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { weight: '600' } } }
            },
            cutout: '72%'
        }
    });

    // 5. Approval Rate Trend (LINE)
    new Chart(document.getElementById("approvalTrendChart"), {
        type: 'line',
        data: {
            labels: data.months || [],
            datasets: [{
                label: 'Approval %',
                data: data.approval_rate || [],
                borderColor: '#1e293b',
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });
}
