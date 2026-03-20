/* ═══════════════════════════════════════════════
   EMI CALCULATOR
═══════════════════════════════════════════════ */
function fmt(n) { 
  return '₹' + Math.round(n).toLocaleString('en-IN'); 
}

function updateSliderFill(sliderId) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--value', value + '%');
}

const animationStates = new Map();
function animateValue(elId, endValue, formatter) {
  const el = document.getElementById(elId);
  if (!el) return;
  
  let currentState = animationStates.get(elId);
  let startValue;
  if (currentState) {
    startValue = currentState.value;
  } else {
    const textContent = el.textContent || "0";
    const parsed = parseFloat(textContent.replace(/[^0-9.-]+/g, ""));
    startValue = isNaN(parsed) ? endValue : parsed;
    currentState = { value: startValue };
  }
  
  if (Math.abs(startValue - endValue) < 1) {
    el.textContent = formatter(endValue);
    currentState.value = endValue;
    animationStates.set(elId, currentState);
    return;
  }
  
  const duration = 250; 
  const startTime = performance.now();
  
  if (currentState.rafId) cancelAnimationFrame(currentState.rafId);
  
  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuad = 1 - (1 - progress) * (1 - progress);
    const currentVal = startValue + (endValue - startValue) * easeOutQuad;
    
    el.textContent = formatter(currentVal);
    
    if (progress < 1) {
      currentState.rafId = requestAnimationFrame(step);
    } else {
      currentState.value = endValue;
      el.textContent = formatter(endValue);
    }
  };
  
  currentState.rafId = requestAnimationFrame(step);
  animationStates.set(elId, currentState);
}

function calcEMI() {
  const amtSlider = document.getElementById('amt-slider');
  const rateSlider = document.getElementById('rate-slider');
  const tenureSlider = document.getElementById('tenure-slider');

  updateSliderFill('amt-slider');
  updateSliderFill('rate-slider');
  updateSliderFill('tenure-slider');

  const P = +amtSlider.value;
  const ratesliderVal = +rateSlider.value;
  const r = ratesliderVal / 12 / 100;
  const n = +tenureSlider.value;

  const emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;

  document.getElementById('amt-display').textContent = fmt(P);
  document.getElementById('rate-display').textContent = ratesliderVal.toFixed(1) + '% p.a.';
  
  // Tenure display: X Years (primary)
  const years = Math.floor(n / 12);
  const remainingMonths = n % 12;
  let tenureText = years + ' Years';
  if (remainingMonths > 0) tenureText += ' ' + remainingMonths + ' Mos';
  document.getElementById('tenure-display').textContent = tenureText;
  
  animateValue('emi-display', emi, fmt);
  animateValue('b-principal', P, fmt);
  animateValue('b-interest', interest, fmt);
  animateValue('b-total', total, fmt);

  animateValue('chart-stat-principal', P, fmt);
  animateValue('chart-stat-interest', interest, fmt);
  animateValue('chart-stat-emi', emi, fmt);

  renderEmiChart();
}

let emiChart = null;

function renderEmiChart() {
  const ctx = document.getElementById('emiBarChart');
  if (!ctx) return;
  
  const P = +document.getElementById('amt-slider').value;
  const rateValue = +document.getElementById('rate-slider').value;
  const r = rateValue / 12 / 100;
  const currentN = +document.getElementById('tenure-slider').value;
  
  const labels = [];
  const data = [];
  const pointRadii = [];
  const pointBgColors = [];
  const pointBorderColors = [];
  
  // More granular labels: only show years
  for (let m = 12; m <= 360; m += 12) {
    let yrs = m / 12;
    labels.push(yrs + ' Yrs');
    
    let calcEmi = r === 0 ? P / m : P * r * Math.pow(1 + r, m) / (Math.pow(1 + r, m) - 1);
    data.push(Math.round(calcEmi));
    
    if (m === currentN) {
      pointRadii.push(6);
      pointBgColors.push('#ffffff');
      pointBorderColors.push('#4f46e5');
    } else {
      pointRadii.push(0);
      pointBgColors.push('rgba(79, 70, 229, 1)');
      pointBorderColors.push('transparent');
    }
  }

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  if (emiChart) {
    emiChart.data.labels = labels;
    emiChart.data.datasets[0].data = data;
    emiChart.data.datasets[0].pointRadius = pointRadii;
    emiChart.data.datasets[0].pointBackgroundColor = pointBgColors;
    emiChart.data.datasets[0].pointBorderColor = pointBorderColors;
    emiChart.update('none'); 
  } else {
    emiChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'EMI Amount',
          data: data,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#4f46e5',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: pointRadii,
          pointBackgroundColor: pointBgColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#4f46e5',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1A1433',
            bodyColor: '#4f46e5',
            borderColor: '#E4E0F5',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (ctx) => 'Tenure: ' + ctx[0].label,
              label: c => 'EMI: ' + fmt(c.raw)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              color: '#9B94B8', 
              font: { size: 11, family: "'Inter', sans-serif" },
              maxTicksLimit: 10,
              maxRotation: 0
            }
          },
          y: {
            grid: { color: 'rgba(228,224,245,0.6)' },
            border: { display: false },
            ticks: {
              color: '#9B94B8',
              font: { size: 11, family: "'Inter', sans-serif" },
              callback: v => '₹' + Math.round(v).toLocaleString('en-IN')
            }
          }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  calcEMI();
});
