/* ═══════════════════════════════════════
   LoanPro Admin Dashboard — script.js
═══════════════════════════════════════ */

/* ─── Sidebar ─── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

/* ─── Revenue Chart ─── */
document.addEventListener('DOMContentLoaded', function () {
  const ctx = document.getElementById('revenueChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{
        label: 'Revenue (₹)',
        data: [120000, 150000, 180000, 130000, 200000, 220000, 170000, 250000, 210000, 230000, 260000, 300000],
        borderColor: '#0d7c6e',
        backgroundColor: 'rgba(13,124,110,0.07)',
        borderWidth: 2.5,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0d7c6e',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.42,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0b1f2e',
          titleColor: '#ccfbf1',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: ctx => ' ₹' + ctx.parsed.y.toLocaleString('en-IN')
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#f0fdfa', drawBorder: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 12 },
            padding: 8,
            callback: val => '₹' + (val / 1000) + 'K'
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 12 }, padding: 8 }
        }
      }
    }
  });
});

/* ─── Approve / Reject ─── */
function approveLoan(btn, id) {
  const pill = document.getElementById(id);
  if (pill) {
    pill.className = 'spill spill-ok';
    pill.textContent = 'Approved';
  }
  const row = btn.closest('tr');
  row.style.animation = 'rowFlash 0.7s ease';
  setTimeout(() => row.style.animation = '', 700);
}

function rejectLoan(btn, id) {
  const pill = document.getElementById(id);
  if (pill) {
    pill.className = 'spill spill-no';
    pill.textContent = 'Rejected';
  }
}