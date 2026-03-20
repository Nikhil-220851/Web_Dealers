/* ═══════════════════════════════════════
   LoanPro Admin Dashboard — dashboard.js
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
        const res = await fetch(`${API_BASE}/admin-dashboard-data.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            const data = result.data;
            
            // 1. Populate KPI Cards with safety
            document.getElementById('statTotalApps').textContent = safeValue(data.kpis.totalApplications);
            document.getElementById('statPending').textContent = safeValue(data.kpis.pending);
            document.getElementById('statApproved').textContent = safeValue(data.kpis.approved);
            document.getElementById('statDisbursed').textContent = `₹${safeValue(data.kpis.disbursed).toLocaleString('en-IN')}`;
            document.getElementById('statActive').textContent = safeValue(data.kpis.activeLoans);
            document.getElementById('statDefaulters').textContent = safeValue(data.kpis.defaulters);

            // 2. Render Alerts
            renderPendingApprovals(data.pendingApprovals);
            renderDefaulters(data.defaultersPreview);

            // 3. Render Activity Feed
            renderActivities(data.recentActivities);
        }
    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function renderActivities(activities) {
    const container = document.getElementById("activityList");
    if (!container) return;
    container.innerHTML = "";

    if (!activities || !activities.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle fa-2x mb-2"></i>
                <p>No recent activity yet</p>
            </div>
        `;
        return;
    }

    activities.forEach(act => {
        const div = document.createElement("div");
        div.classList.add("activity-card");
        div.innerHTML = `
            <div class="activity-left">
                <i class="fas ${getIcon(act.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${act.title || 'Activity'}</div>
                <div class="activity-desc">${act.description || ''}</div>
                <div class="activity-time">${formatTime(act.time)}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function getIcon(type) {
    switch (type) {
        case "loan_created": return "fa-file-invoice";
        case "loan_approved": return "fa-check-circle";
        case "loan_rejected": return "fa-times-circle";
        case "emi_paid": return "fa-credit-card";
        case "borrower_added": return "fa-user-plus";
        case "loan_scheme_created": return "fa-briefcase";
        default: return "fa-bell";
    }
}

function goTo(page) {
    document.body.classList.add("fade-out");
    setTimeout(() => {
        window.location.href = page;
    }, 200);
}


function renderPendingApprovals(list) {
    const container = document.getElementById('pendingApprovalsList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="pending-empty-state">
                <span class="material-icons-round">inbox</span>
                <p>No pending requests</p>
                <span class="pending-empty-sub">All loan applications have been reviewed</span>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="pending-table-wrap">
            <table class="pending-table">
                <thead><tr>
                    <th>Borrower</th><th>Loan Type</th><th>Amount</th><th>Applied</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                    ${list.map(item => `
                        <tr class="pending-row">
                            <td><strong>${escapeHtml(item.borrower_name)}</strong></td>
                            <td><span class="loan-type-badge">${escapeHtml(item.loan_type || 'N/A')}</span></td>
                            <td class="amount-cell">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td>
                            <td>${escapeHtml(item.date || 'N/A')}</td>
                            <td><span class="status-badge status-pending">Pending</span></td>
                            <td class="actions-cell">
                                <button class="btn-approve" onclick="updateDashboardLoanStatus('${item.id}', 'approved')" title="Approve">
                                    <span class="material-icons-round">check</span> Approve
                                </button>
                                <button class="btn-reject" onclick="updateDashboardLoanStatus('${item.id}', 'rejected')" title="Reject">
                                    <span class="material-icons-round">close</span> Reject
                                </button>
                            </td>
                        </tr>
                    `).join('')}
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

function renderDefaulters(list) {
    const container = document.getElementById('defaultersList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="defaulters-empty-state">
                <span class="material-icons-round">check_circle</span>
                <p>No defaulters</p>
                <span class="defaulters-empty-sub">All borrowers are up to date</span>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="defaulters-table-wrap">
            <table class="defaulters-table">
                <thead><tr>
                    <th>Borrower</th><th>Overdue</th><th>Missed EMIs</th><th>Last Paid</th><th>Due Amount</th><th>Action</th>
                </tr></thead>
                <tbody>
                    ${list.map(item => `
                        <tr class="defaulter-row">
                            <td><strong>${escapeHtml(item.borrower_name)}</strong></td>
                            <td><span class="overdue-badge">${item.days_overdue || 0} days</span></td>
                            <td>${item.missed_emis || 0}</td>
                            <td>${item.last_paid_date ? escapeHtml(item.last_paid_date) : '—'}</td>
                            <td class="amount-cell">₹${Number(item.total_due || item.amount || 0).toLocaleString('en-IN')}</td>
                            <td>
                                <a href="loan-requests.html" class="btn-view-defaulter" title="View Details">
                                    <span class="material-icons-round">visibility</span>
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}


async function updateDashboardLoanStatus(loanId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/admin-update-loan-status.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loan_id: loanId, status: newStatus, remarks: newStatus === 'approved' ? 'Approved from dashboard' : 'Rejected from dashboard' })
        });
        const data = await res.json();
        if (data.status === 'success') {
            fetchDashboardData();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Network error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});

