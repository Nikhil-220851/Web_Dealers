/* ═══════════════════════════════════════
   LoanPro Admin — analytics.js
═══════════════════════════════════════ */

// Colors matching the dashboard theme
const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];

async function fetchAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/admin-get-analytics.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            const data = result.data;
            initLoansByTypeChart(data.loansByType);
            initLoansByStatusChart(data.loansByStatus);
            initMonthlyLoansChart(data.loansByMonth);
        }
    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

function initLoansByTypeChart(data) {
    const ctx = document.getElementById('loansByTypeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
            }
        }
    });
}

function initLoansByStatusChart(data) {
    const ctx = document.getElementById('loansByStatusChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: ['#14b8a6', '#f59e0b', '#ef4444'], // roughly ok, pending, rejected
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e2e8f0' } }
            }
        }
    });
}

function initMonthlyLoansChart(data) {
    const ctx = document.getElementById('monthlyLoansChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Applications',
                data: data.data,
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics();
    fetchDefaulters();
});

// ---- Defaulters Report Logic ----

let defaultersData = [];

async function fetchDefaulters() {
    try {
        const res = await fetch(`${API_BASE}/admin-get-defaulters.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            defaultersData = result.data;
            renderDefaulters();
        }
    } catch (err) {
        console.error('Failed to load defaulters:', err);
    }
}

function renderDefaulters() {
    const tbody = document.getElementById('defaultersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (defaultersData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No defaulters found</td></tr>`;
        return;
    }

    defaultersData.forEach(d => {
        const shortId = d.id.substring(d.id.length - 6).toUpperCase();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="font-weight:600; color:#1e293b;">${d.borrower_name}</div></td>
            <td><span class="lid" title="${d.id}">${shortId}</span></td>
            <td>₹${d.amount.toLocaleString('en-IN')}</td>
            <td>₹${d.emi_amount.toLocaleString('en-IN')}</td>
            <td>${d.due_date}</td>
            <td style="color:#ef4444; font-weight:700;">${d.missed_payments}</td>
            <td><span class="spill spill-no">${d.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function downloadDefaultersCSV() {
    if (defaultersData.length === 0) {
        alert("No data to export.");
        return;
    }

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Borrower Name,Loan ID,Loan Amount,EMI Amount,Due Date,Missed Payments,Status\n";

    // CSV Rows
    defaultersData.forEach(d => {
        const row = [
            `"${d.borrower_name}"`,
            d.id,
            d.amount,
            d.emi_amount,
            d.due_date,
            d.missed_payments,
            `"${d.status}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    // Create Download Link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "defaulters_report_" + new Date().toISOString().slice(0,10) + ".csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}
