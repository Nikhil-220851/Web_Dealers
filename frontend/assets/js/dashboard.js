        /* ═══════════════════════════════════════════════
           INIT — EMI area chart on dashboard
        ═══════════════════════════════════════════════ */
        (function initDashChart() {
          const ctx = document.getElementById('emiChart');
          if (!ctx) return;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const vals = [8200, 8200, 8200, 8200, 8200, 7900, 7900, 7900, 7900, 7600, 7600, 7600];
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: months,
              datasets: [{
                data: vals,
                borderColor: '#6C47FF', borderWidth: 2.5,
                pointRadius: 0, pointHoverRadius: 5,
                pointHoverBackgroundColor: '#6C47FF',
                pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
                fill: true,
                backgroundColor: (ctx2) => {
                  const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 160);
                  g.addColorStop(0, 'rgba(108,71,255,0.18)');
                  g.addColorStop(1, 'rgba(108,71,255,0.01)');
                  return g;
                },
                tension: 0.4
              }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false }, tooltip: {
                  backgroundColor: '#fff', titleColor: '#1A1433', bodyColor: '#6C47FF',
                  borderColor: '#E4E0F5', borderWidth: 1, padding: 10,
                  callbacks: { label: ctx3 => '  ₹' + ctx3.raw.toLocaleString('en-IN') }
                }
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#9B94B8', font: { size: 11, family: "'Plus Jakarta Sans'" } } },
                y: { grid: { color: '#E4E0F5' }, ticks: { color: '#9B94B8', font: { size: 11 }, callback: v => '₹' + (v / 1000).toFixed(1) + 'K' } }
              }
            }
          });
        })();

        /* ═══════════════════════════════════════════════
           STEP 1: APPLY TXN-ROW CLASS TO TRANSACTION ROWS
           (done at runtime below for dashboard transactions)
        ═══════════════════════════════════════════════ */
