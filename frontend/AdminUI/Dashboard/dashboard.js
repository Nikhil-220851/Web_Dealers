/* ═══════════════════════════════════════
   LoanPro Admin Dashboard — dashboard.js
═══════════════════════════════════════ */

async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/admin-get-dashboard-stats.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            const data = result.data;
            
            // Stats cards
            document.getElementById('statTotalAmount').textContent = `₹${data.totalAmount.toLocaleString('en-IN')}`;
            document.getElementById('statBorrowers').textContent = data.totalBorrowers;
            document.getElementById('statTotalLoans').textContent = data.totalLoans;
            document.getElementById('statApprovedLoans').textContent = data.approvedLoans;

            // Optional: you can dynamically build Daily Loan Status panels, but we stick to the HTML structure for now if it requires more data or just update numbers.
            // Update Recent Applications table
            renderRecentApplications(data.recentApplications);
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}

function renderRecentApplications(apps) {
    const tbody = document.getElementById('recentAppsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No recent applications</td></tr>`;
        return;
    }

    apps.forEach(app => {
        const avatarLetter = app.borrower_name.charAt(0).toUpperCase();
        // Type color mapping
        const typeMap = {
            'Personal': 'ltype-p',
            'Business': 'ltype-bus', // example
            'Home': 'ltype-h',
            'Car': 'ltype-c'
        };
        const typeClass = typeMap[app.loan_type] || 'ltype-p';
        
        const statusMap = {
            'pending': 'spill-wait',
            'approved': 'spill-ok',
            'rejected': 'spill-no'
        };
        const statusClass = statusMap[app.status] || 'spill-wait';
        const stId = `st_${app.id}`;

        let actionHtml = '';
        if (app.status === 'pending') {
            actionHtml = `
            <div class="act-btns">
              <button class="act-approve" onclick="updateLoanStatusDash('${app.id}', 'approved')"><span class="material-icons-round">check</span> Approve</button>
              <button class="act-reject"  onclick="updateLoanStatusDash('${app.id}', 'rejected')"><span class="material-icons-round">close</span> Reject</button>
            </div>`;
        } else {
            actionHtml = `<span style="color: #64748b; font-size: 0.9rem;">Processed</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="borrower"><div class="ava ava-t">${avatarLetter}</div>${app.borrower_name}</div></td>
            <td><span class="ltype ${typeClass}">${app.loan_type}</span></td>
            <td class="money">₹${app.amount.toLocaleString('en-IN')}</td>
            <td><span class="spill ${statusClass}" id="${stId}">${capitalize(app.status)}</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateLoanStatusDash(loanId, newStatus) {
    try {
        const res = await fetch(`${API_BASE}/admin-update-loan-status.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loan_id: loanId, status: newStatus })
        });
        const data = await res.json();
        if (data.status === 'success') {
            // refresh data
            fetchStats();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Network error');
    }
}

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─── Revenue Chart (Placeholder for now, could be dynamic later) ─── */
function initChart() {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{
        label: 'Revenue (₹)',
        data: [120000,150000,180000,130000,200000,220000,170000,250000,210000,230000,260000,300000],
        borderColor:           '#6366f1',
        backgroundColor:       'rgba(99,102,241,0.08)',
        borderWidth:           2.5,
        pointBackgroundColor:  '#fff',
        pointBorderColor:      '#6366f1',
        pointBorderWidth:      2,
        pointRadius:           4,
        pointHoverRadius:      7,
        tension:               0.42,
        fill:                  true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0b1120',
          titleColor:      '#a5b4fc',
          bodyColor:       '#fff',
          padding:         12,
          cornerRadius:    10,
          callbacks: {
            label: ctx => ' ₹' + ctx.parsed.y.toLocaleString('en-IN')
          }
        }
      },
      scales: {
        y: {
          grid:  { color: 'rgba(99,102,241,0.08)', drawBorder: false },
          ticks: { color: '#94a3b8', font: { size: 12 }, padding: 8, callback: val => '₹' + (val/1000) + 'K' }
        },
        x: {
          grid:  { display: false },
          ticks: { color: '#94a3b8', font: { size: 12 }, padding: 8 }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    initChart();
});
