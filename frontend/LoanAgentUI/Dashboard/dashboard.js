/* ═══════════════════════════════════════
   LoanPro Loan Agent Dashboard — dashboard.js
═══════════════════════════════════════ */

function formatTime(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return mins + " min ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + " hrs ago";

    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return days + " days ago";
}

function safeValue(val) {
    return val === null || val === undefined ? 0 : val;
}

async function fetchDashboardData() {
    try {
        const res = await fetch(`${API_BASE}/get-agent-dashboard.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            const data = result.data;
            
            // Populate KPI Cards
            document.getElementById('statTotalLoans').textContent = safeValue(data.total_loans);
            document.getElementById('statApproved').textContent = safeValue(data.approved_loans);
            document.getElementById('statPending').textContent = safeValue(data.pending_loans);
            document.getElementById('statRejected').textContent = safeValue(data.rejected_loans);
            document.getElementById('statTotalCommission').textContent = `₹${safeValue(data.total_commission).toLocaleString('en-IN')}`;
            document.getElementById('statMonthlyCommission').textContent = `₹${safeValue(data.monthly_commission).toLocaleString('en-IN')}`;

            // Render Recent Table
            renderRecentLoans(data.recent_loans);

            // Hide old activities completely to focus on agent metrics
            document.getElementById("activityList").innerHTML = `<p class="text-muted text-center py-3">Recent activity stream available in reports.</p>`;
        }
    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function renderRecentLoans(list) {
    const container = document.getElementById('recentLoansList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="pending-empty-state">
                <span class="material-icons-round">inbox</span>
                <p>No recent assigned loans</p>
                <span class="pending-empty-sub">Your assigned loans and commissions will appear here</span>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="pending-table-wrap">
            <table class="pending-table">
                <thead><tr>
                    <th>Loan ID</th><th>Loan Amount</th><th>Status</th><th>Commission Earned</th>
                </tr></thead>
                <tbody>
                    ${list.map(item => {
                        let badgeClass = 'status-pending';
                        if (item.status === 'approved') badgeClass = 'status-active';
                        if (item.status === 'rejected') badgeClass = 'status-closed';
                        
                        return `
                        <tr class="pending-row">
                            <td><span style="font-family:monospace;">${escapeHtml(item.loan_id.substring(item.loan_id.length - 8))}</span></td>
                            <td class="amount-cell">₹${Number(item.loan_amount || 0).toLocaleString('en-IN')}</td>
                            <td><span class="status-badge ${badgeClass}">${escapeHtml(item.status.toUpperCase())}</span></td>
                            <td class="amount-cell" style="color:#8B0000; font-weight:bold;">₹${Number(item.commission || 0).toLocaleString('en-IN')}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>`;
}

function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function goTo(page) {
    document.body.classList.add("fade-out");
    setTimeout(() => {
        window.location.href = page;
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});


