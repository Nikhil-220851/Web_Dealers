/* ═══════════════════════════════════════════════
   EMI CALCULATOR
═══════════════════════════════════════════════ */
function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

function calcEMI() {
  const P = +document.getElementById('amt-slider').value;
  const r = +document.getElementById('rate-slider').value / 12 / 100;
  const n = +document.getElementById('tenure-slider').value;
  const emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;

  document.getElementById('amt-display').textContent = fmt(P);
  document.getElementById('rate-display').textContent = (+document.getElementById('rate-slider').value).toFixed(1) + '% p.a.';
  document.getElementById('tenure-display').textContent = n + ' months (' + Math.round(n / 12) + ' yrs)';
  document.getElementById('emi-display').textContent = fmt(emi);
  document.getElementById('b-principal').textContent = fmt(P);
  document.getElementById('b-interest').textContent = fmt(interest);
  document.getElementById('b-total').textContent = fmt(total);

  // Update chart stat strip if present
  const csp = document.getElementById('chart-stat-principal');
  const csi = document.getElementById('chart-stat-interest');
  const cse = document.getElementById('chart-stat-emi');
  if (csp) csp.textContent = fmt(P);
  if (csi) csi.textContent = fmt(interest);
  if (cse) cse.textContent = fmt(emi);

  renderEmiBarChart();
}

let emiBarChart = null;

function renderEmiBarChart() {
  const ctx = document.getElementById('emiBarChart');
  if (!ctx) return;
  const P = +document.getElementById('amt-slider').value;
  const r = +document.getElementById('rate-slider').value / 12 / 100;
  const n = +document.getElementById('tenure-slider').value;
  const emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = months.map(() => Math.round(emi));

  // Build gradient
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 420);
  gradient.addColorStop(0, 'rgba(108,71,255,0.92)');
  gradient.addColorStop(1, 'rgba(139,92,246,0.45)');

  if (emiBarChart) emiBarChart.destroy();
  emiBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        data,
        backgroundColor: gradient,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(108,71,255,1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#1A1433',
          bodyColor: '#6C47FF',
          borderColor: '#E4E0F5',
          borderWidth: 1,
          padding: 10,
          callbacks: { label: c => '  EMI: ' + fmt(c.raw) }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9B94B8', font: { size: 11, family: "'Plus Jakarta Sans'" } }
        },
        y: {
          grid: { color: 'rgba(228,224,245,0.6)' },
          ticks: {
            color: '#9B94B8',
            font: { size: 11 },
            callback: v => '₹' + (v / 1000).toFixed(0) + 'K'
          }
        }
      }
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  calcEMI();
});
