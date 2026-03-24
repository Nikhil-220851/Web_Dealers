/* =========================
   GLOBAL CHART VARIABLES
========================= */
let gaugeChart = null;
let historyLineChart = null;

/* =========================
   1. GET SCORE DATA
========================= */
function getScoreData() {
    let score = localStorage.getItem('credit_score');
    score = score ? parseInt(score, 10) : 726;

    const minScore = 300;
    const maxScore = 900;

    const clampedScore = Math.max(minScore, Math.min(maxScore, score));

    let label = 'Poor';
    let color = '#EF4444';

    if (clampedScore >= 750) {
        label = 'Excellent';
        color = '#22C55E';
    } else if (clampedScore >= 650) {
        label = 'Good';
        color = '#3B82F6';
    } else if (clampedScore >= 550) {
        label = 'Average';
        color = '#F97316';
    }

    return { score: clampedScore, label, color, min: minScore, max: maxScore };
}

/* =========================
   2. SCORE GAUGE
========================= */
function renderScoreWidget() {
    const data = getScoreData();

    const statusEl = document.getElementById("scoreStatus");
    if (statusEl) {
        statusEl.textContent = data.label + " Score";
        statusEl.style.color = data.color;
        statusEl.style.backgroundColor = data.color + "1A";
    }

    // Animate number
    animateValue("displayScore", 300, data.score, 1500);

    const canvas = document.getElementById('scoreGauge');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const filled = data.score - data.min;
    const remaining = data.max - data.score;

    if (gaugeChart) gaugeChart.destroy();

    gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [filled, remaining],
                backgroundColor: [data.color, '#e5e7eb'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: 270,
            circumference: 180,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        }
    });
}

/* =========================
   3. HISTORY GRAPH
========================= */
function renderHistoryChart() {
    const data = getScoreData();

    let history = JSON.parse(localStorage.getItem('credit_score_history') || '[]');

    if (history.length === 0) {
        history = [
            data.score - 40,
            data.score - 30,
            data.score - 20,
            data.score - 10,
            data.score - 5,
            data.score
        ].map(s => Math.max(300, s));

        localStorage.setItem('credit_score_history', JSON.stringify(history));
    }

    history[history.length - 1] = data.score;

    const points = history.slice(-6);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    let labels = [];
    let d = new Date();

    for (let i = 5; i >= 0; i--) {
        let past = new Date(d.getFullYear(), d.getMonth() - i, 1);
        labels.push(monthNames[past.getMonth()]);
    }

    const canvas = document.getElementById('historyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (historyLineChart) historyLineChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, data.color + "33");
    gradient.addColorStop(1, data.color + "00");

    historyLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: points,
                borderColor: data.color,
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: data.color,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    min: 300,
                    max: 900,
                    grid: {
                        borderDash: [4, 4]
                    }
                }
            }
        }
    });
}

/* =========================
   4. FETCH EMI DATA
========================= */
async function fetchAndRenderPaymentHistory() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const res = await fetch(`../../backend/api/get-emi-payments.php?userId=${userId}`);
        const json = await res.json();

        let payLog = [];

        if (json.status === 'success') {
            payLog = json.data || [];
        }

        generateRealSuggestions(payLog);

    } catch (err) {
        console.error("Fetch error:", err);

        const sList = document.getElementById('suggestionsList');
        if (sList) {
            sList.innerHTML = `<div style="color:red;">Failed to load data</div>`;
        }
    }
}

/* =========================
   5. SUGGESTIONS
========================= */
function generateRealSuggestions(payLog) {
    const data = getScoreData();

    let hasMissed = payLog.some(p => p.status?.toLowerCase() === 'missed');

    let html = '';

    if (hasMissed) {
        html += `<div class="suggestion-item">⚠️ Missed EMI. Pay on time to improve score.</div>`;
    } else if (payLog.length > 0) {
        html += `<div class="suggestion-item">⭐ All EMIs paid on time. Keep it up!</div>`;
    } else {
        html += `<div class="suggestion-item">📅 No history. Start paying EMIs.</div>`;
    }

    if (data.score < 650) {
        html += `<div class="suggestion-item">📉 Avoid new loans now.</div>`;
    } else {
        html += `<div class="suggestion-item">💳 Maintain low credit usage.</div>`;
    }

    const sList = document.getElementById('suggestionsList');
    if (sList) sList.innerHTML = html;
}

/* =========================
   6. ANIMATION
========================= */
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);

        obj.innerText = value;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            obj.innerText = end;
        }
    }

    requestAnimationFrame(step);
}

/* =========================
   7. BACK BUTTON
========================= */
function goBack() {
    window.location.href = "dashboard.html";
}

/* =========================
   8. INITIAL LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
    renderScoreWidget();
    renderHistoryChart();
    fetchAndRenderPaymentHistory();
});