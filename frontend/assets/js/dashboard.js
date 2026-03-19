/* ═══════════════════════════════════════════════════════════════
   dashboard.js  —  LoanPro  |  Loan Payment Tenure Graph
   ─────────────────────────────────────────────────────────────
   HOW IT WORKS:
   1. Page loads → reads userEmail from localStorage
   2. Calls getdashboard.php → gets real loan data from MongoDB
   3. status:"no-loan"  → shows default flat area chart
   4. status:"success"  → builds full interactive loan chart:
        • Loan name + bank + pills in header
        • 4 stat cells: Amount, EMI, Rate, Total Payable
        • 3 view tabs: Yearly Payments | Balance Left | Total Paid
        • Tenure timeline bar: Start year → Midway → End year
        • Payment split bar: % loan vs % interest
   ─────────────────────────────────────────────────────────────
   COLOR — fixed single palette (purple #6C47FF)
   No color switching. Consistent with your website theme.
═══════════════════════════════════════════════════════════════ */

/* ─── Sidebar helpers ──────────────────────────────────────── */
function toggleSidebar(){
    document.querySelector('.shell')?.classList.toggle('sidebar-collapsed');
}
function toggleNotifications(){
    const d=document.getElementById('notif-drop');
    if(d) d.style.display=d.style.display==='none'?'block':'none';
}
document.addEventListener('click',e=>{
    const d=document.getElementById('notif-drop');
    if(d&&!d.contains(e.target)&&!e.target.closest('.icon-btn'))
        d.style.display='none';
});
function logout(){
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href='../auth/login.html';
}

/* ─── Fixed color theme (matches your website purple) ─────── */
const THEME = {
    p : '#6C47FF',   /* primary purple  */
    i : '#A78BFA',   /* soft violet     */
    pi: '108,71,255',
    ii: '167,139,250',
    bg: '#EEF2FF',
    tc: '#4338CA',
};

/* ─── Global state ─────────────────────────────────────────── */
let _chart    = null;
let _viewIdx  = 0;
let _data     = null;   /* API response stored here */

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('emiChart');
    if (!canvas) return;

    injectStyles();

    const email = localStorage.getItem('userEmail');
    if (!email) { showDefaultChart(canvas); return; }

    showShimmer(canvas);

    fetch('../../backend/dashboard/getdashboard.php?email=' + encodeURIComponent(email))
        .then(r => { if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(d => {
            removeShimmer();
            if (d.status === 'success') {
                _data = d;
                buildFullChart(canvas, d);
            } else {
                showDefaultChart(canvas);
            }
        })
        .catch(err => {
            console.error('[Dashboard]', err);
            removeShimmer();
            showDefaultChart(canvas);
        });
});

/* ─── Inject keyframes once ────────────────────────────────── */
function injectStyles(){
    if (document.getElementById('lp-styles')) return;
    const s = document.createElement('style');
    s.id = 'lp-styles';
    s.textContent = `
        @keyframes lp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes lp-fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .lp-live-dot{animation:lp-pulse 2s infinite;}
        .lp-fadein{animation:lp-fadeUp .45s ease both;}
    `;
    document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════════
   SHIMMER
═══════════════════════════════════════════════════════════════ */
function showShimmer(canvas){
    const wrap = canvas.closest('.chart-container') || canvas.parentElement;
    if (!wrap) return;
    wrap.style.position = 'relative';
    const el = document.createElement('div');
    el.id = 'lp-shimmer';
    el.style.cssText = `
        position:absolute;inset:0;border-radius:12px;z-index:5;
        background:linear-gradient(90deg,
            rgba(108,71,255,.04) 0%,rgba(108,71,255,.11) 50%,rgba(108,71,255,.04) 100%);
        background-size:200% 100%;
        animation:lp-shimmer 1.4s infinite ease-in-out;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;color:#9B94B8;font-family:'Plus Jakarta Sans',sans-serif;
    `;
    el.textContent = 'Loading your loan data…';
    wrap.appendChild(el);
}
function removeShimmer(){
    const el = document.getElementById('lp-shimmer');
    if (!el) return;
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
}

/* ═══════════════════════════════════════════════════════════════
   BUILD FULL CHART  — called with real API data
═══════════════════════════════════════════════════════════════ */
function buildFullChart(canvas, d){
    const card = canvas.closest('.card');
    if (!card) return;

    /* ── 1. Card header ── */
    buildHeader(card, d);

    /* ── 2. Stat strip ── */
    buildStatStrip(card, d);

    /* ── 3. View switcher + legend above chart ── */
    buildViewControls(card, canvas);

    /* ── 4. Tenure timeline ── */
    buildTenureTimeline(card, d);

    /* ── 5. Payment split bar ── */
    buildSplitBar(card, d);

    /* ── 6. Draw first chart view ── */
    _viewIdx = 0;
    drawChart(canvas, 0, d);
}

/* ─── Card header ──────────────────────────────────────────── */
function buildHeader(card, d){
    const titleEl = card.querySelector('.card-title');
    if (!titleEl) return;

    const yrs = d.loanTenure >= 12
        ? Math.round(d.loanTenure / 12) + ' Years'
        : d.loanTenure + ' Months';

    /* Sub-label above title */
    let sub = document.getElementById('lp-sub');
    if (!sub){
        sub = document.createElement('div');
        sub.id = 'lp-sub';
        sub.style.cssText = `
            display:flex;align-items:center;gap:6px;
            font-size:10px;font-weight:700;letter-spacing:.8px;
            text-transform:uppercase;color:#A89EC8;margin-bottom:5px;
        `;
        titleEl.insertAdjacentElement('beforebegin', sub);
    }
    sub.innerHTML = `
        <span class="lp-live-dot" style="
            width:7px;height:7px;border-radius:50%;
            background:${THEME.p};display:inline-block;flex-shrink:0;">
        </span>
        <span style="color:${THEME.tc};">${d.loanType} · ${d.bank || ''} · Active</span>
    `;

    /* Title */
    titleEl.innerHTML = `${d.loanType} — Payment Tenure Plan`;

    /* Pills */
    let pills = document.getElementById('lp-pills');
    if (!pills){
        pills = document.createElement('div');
        pills.id = 'lp-pills';
        pills.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;';
        titleEl.insertAdjacentElement('afterend', pills);
    }
    pills.innerHTML = `
        ${pill(yrs+' tenure',          THEME.bg, THEME.tc)}
        ${pill(d.interestRate+'% p.a.',THEME.bg, THEME.tc)}
        ${pill('&#10003; Active',       '#DCFCE7','#166534')}
    `;
}

function pill(text, bg, color){
    return `<span style="
        font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;
        background:${bg};color:${color};letter-spacing:.3px;">${text}</span>`;
}

/* ─── Stat strip ───────────────────────────────────────────── */
function buildStatStrip(card, d){
    if (document.getElementById('lp-stats')) return;
    const strip = document.createElement('div');
    strip.id = 'lp-stats';
    strip.className = 'lp-fadein';
    strip.style.cssText = `
        display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
        border-top:1px solid #F2F0FA;border-bottom:1px solid #F2F0FA;
        background:#FAFAFE;
    `;
    strip.innerHTML = [
        statCell('Loan Amount',   fmtINR(d.loanAmount),    'Principal borrowed'),
        statCell('Monthly EMI',   '₹'+d.emi.toLocaleString('en-IN'), 'Fixed every month'),
        statCell('Interest Rate', d.interestRate+'% p.a.', 'Per annum rate'),
        statCell('Total Payable', fmtINR(d.totalPayment),  'Principal + Interest'),
    ].join('');

    const chartContainer = card.querySelector('.chart-container');
    if (chartContainer) card.insertBefore(strip, chartContainer);
}

function statCell(label, value, sub){
    return `
        <div style="padding:12px 16px;border-right:1px solid #F2F0FA;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;
                letter-spacing:.7px;color:#B8B0D4;margin-bottom:3px;">${label}</div>
            <div style="font-size:14px;font-weight:800;letter-spacing:-.3px;
                color:#1A1145;">${value}</div>
            <div style="font-size:9px;color:#C8C0E0;margin-top:2px;">${sub}</div>
        </div>`;
}

/* ─── View switcher + legend ───────────────────────────────── */
function buildViewControls(card, canvas){
    if (document.getElementById('lp-viewrow')) return;

    const row = document.createElement('div');
    row.id = 'lp-viewrow';
    row.className = 'lp-fadein';
    row.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        flex-wrap:wrap;gap:10px;margin-bottom:14px;
    `;

    const tabs = ['Yearly Payments','Balance Left','Total Paid'];
    const tabHtml = tabs.map((t,i) => `
        <button id="lpvt${i}" onclick="lpSetView(${i})" style="
            padding:6px 14px;font-size:11px;font-weight:700;
            border:none;border-radius:7px;background:${i===0?'#fff':'transparent'};
            color:${i===0?THEME.p:'#A89EC8'};cursor:pointer;
            font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.2px;
            ${i===0?'box-shadow:0 1px 6px rgba(108,71,255,.12);':''}
        ">${t}</button>`).join('');

    row.innerHTML = `
        <div style="display:flex;gap:3px;padding:3px;
            background:#F2F0FA;border-radius:10px;">${tabHtml}</div>
        <div id="lp-legend" style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;"></div>
    `;

    const chartContainer = card.querySelector('.chart-container');
    if (chartContainer) chartContainer.insertAdjacentElement('beforebegin', row);
}

window.lpSetView = function(v){
    _viewIdx = v;
    [0,1,2].forEach(i => {
        const b = document.getElementById('lpvt'+i);
        if (!b) return;
        b.style.background   = i===v ? '#fff' : 'transparent';
        b.style.color        = i===v ? THEME.p : '#A89EC8';
        b.style.boxShadow    = i===v ? '0 1px 6px rgba(108,71,255,.12)' : 'none';
    });
    const canvas = document.getElementById('emiChart');
    if (canvas && _data) drawChart(canvas, v, _data);
};

/* ─── Tenure timeline bar ──────────────────────────────────── */
function buildTenureTimeline(card, d){
    if (document.getElementById('lp-timeline')) return;

    const totalYrs = Math.ceil(d.loanTenure / 12);
    const sy       = new Date().getFullYear();
    const endY     = sy + totalYrs - 1;
    const midY     = sy + Math.floor(totalYrs / 2);

    const el = document.createElement('div');
    el.id = 'lp-timeline';
    el.className = 'lp-fadein';
    el.style.cssText = `
        padding:14px 16px;background:#FAFAFE;
        border-radius:12px;border:1px solid #ECEAF6;
        margin:0 0 16px;
    `;
    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;
            align-items:center;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:700;color:#7B6FA0;
                text-transform:uppercase;letter-spacing:.6px;">
                Loan Tenure Timeline
            </span>
            <span style="font-size:11px;font-weight:800;color:${THEME.tc};">
                ${sy} → ${endY}
            </span>
        </div>
        <div style="position:relative;height:6px;border-radius:99px;
            background:#F2F0FA;margin-bottom:10px;overflow:hidden;">
            <div id="lp-tl-fill" style="
                height:100%;border-radius:99px;background:${THEME.p};
                width:0%;transition:width 1.5s cubic-bezier(.4,0,.2,1);">
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;">
            <span style="font-size:10px;font-weight:700;color:#C0B8D8;">
                Start<br><b style="color:${THEME.tc};">${sy}</b>
            </span>
            <span style="font-size:10px;font-weight:700;color:#C0B8D8;text-align:center;">
                Midway<br><b style="color:${THEME.tc};">${midY}</b>
            </span>
            <span style="font-size:10px;font-weight:700;color:#C0B8D8;text-align:right;">
                Done!<br><b style="color:${THEME.tc};">${endY}</b>
            </span>
        </div>
    `;

    const chartContainer = card.querySelector('.chart-container');
    if (chartContainer) chartContainer.insertAdjacentElement('afterend', el);

    setTimeout(() => {
        const fill = document.getElementById('lp-tl-fill');
        if (fill) fill.style.width = '100%';
    }, 400);
}

/* ─── Payment split bar ────────────────────────────────────── */
function buildSplitBar(card, d){
    if (document.getElementById('lp-split')) return;

    const pPct = Math.round(d.loanAmount / d.totalPayment * 100);
    const iPct = 100 - pPct;

    const el = document.createElement('div');
    el.id = 'lp-split';
    el.className = 'lp-fadein';
    el.style.cssText = 'margin-bottom:4px;';
    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;
            align-items:center;margin-bottom:7px;">
            <span style="font-size:11px;font-weight:700;color:#7B6FA0;">
                How your total payment is divided
            </span>
            <span style="font-size:11px;font-weight:800;color:${THEME.tc};">
                ${pPct}% loan · ${iPct}% interest
            </span>
        </div>
        <div style="height:10px;border-radius:99px;background:#F2F0FA;
            display:flex;overflow:hidden;gap:2px;">
            <div id="lp-sp-p" style="
                width:0%;background:${THEME.p};border-radius:99px;height:100%;
                transition:width 1.4s cubic-bezier(.4,0,.2,1);"></div>
            <div id="lp-sp-i" style="
                width:0%;background:${THEME.i};border-radius:99px;height:100%;
                transition:width 1.4s cubic-bezier(.4,0,.2,1);"></div>
        </div>
        <div style="display:flex;gap:18px;margin-top:8px;">
            <div style="display:flex;align-items:center;gap:5px;
                font-size:11px;font-weight:600;color:#7B6FA0;">
                <span style="width:9px;height:9px;border-radius:2px;
                    background:${THEME.p};display:inline-block;"></span>
                Goes to loan &nbsp;<b style="color:${THEME.tc};font-weight:800;">${pPct}%</b>
            </div>
            <div style="display:flex;align-items:center;gap:5px;
                font-size:11px;font-weight:600;color:#7B6FA0;">
                <span style="width:9px;height:9px;border-radius:2px;
                    background:${THEME.i};display:inline-block;"></span>
                Goes as interest &nbsp;<b style="color:${THEME.tc};font-weight:800;">${iPct}%</b>
            </div>
        </div>
    `;

    const timeline = document.getElementById('lp-timeline');
    if (timeline) timeline.insertAdjacentElement('afterend', el);

    setTimeout(() => {
        const sp = document.getElementById('lp-sp-p');
        const si = document.getElementById('lp-sp-i');
        if (sp) sp.style.width = pPct + '%';
        if (si) si.style.width = iPct + '%';
    }, 350);
}

/* ═══════════════════════════════════════════════════════════════
   DRAW CHART  — Chart.js render for each view
═══════════════════════════════════════════════════════════════ */
function drawChart(canvas, view, d){
    if (_chart) { _chart.destroy(); _chart = null; }

    const TH = THEME;
    const tt = {
        backgroundColor:'#0F0A2E',
        titleColor:'rgba(255,255,255,.95)',
        bodyColor:'rgba(210,200,255,.85)',
        borderColor:'rgba(108,71,255,.25)',
        borderWidth:1,padding:14,cornerRadius:10,
        titleFont:{size:12,weight:'bold',family:"'Plus Jakarta Sans'"},
        bodyFont: {size:11,family:"'Plus Jakarta Sans'"},
        displayColors:true,
    };
    const SC = {
        x:{ grid:{display:false}, border:{display:false},
            ticks:{color:'#C0B8D8',font:{size:10,family:"'Plus Jakarta Sans'"},
                autoSkip:true,maxTicksLimit:14,padding:6} },
        y:{ grid:{color:'rgba(108,71,255,.05)',lineWidth:1},
            border:{display:false,dash:[3,4]},
            ticks:{color:'#C0B8D8',font:{size:10,family:"'Plus Jakarta Sans'"},padding:8,
                callback:v=>v>=100000?'₹'+(v/100000).toFixed(1)+'L':'₹'+(v/1000).toFixed(0)+'K'} }
    };

    function areaDS(label,data,color,alpha,dashed){
        return{label,data,borderColor:color,borderWidth:2.5,
            borderDash:dashed?[6,4]:[],pointRadius:0,
            pointHoverRadius:7,pointHoverBackgroundColor:'#fff',
            pointHoverBorderColor:color,pointHoverBorderWidth:2.5,
            fill:true,tension:0.42,
            backgroundColor:c=>{
                const ch=c.chart;
                if(!ch.chartArea)return`rgba(${alpha},.08)`;
                const g=ch.ctx.createLinearGradient(0,ch.chartArea.top,0,ch.chartArea.bottom);
                g.addColorStop(0,`rgba(${alpha},.18)`);
                g.addColorStop(.6,`rgba(${alpha},.05)`);
                g.addColorStop(1,`rgba(${alpha},.00)`);
                return g;
            }};
    }
    function lineDS(label,data,color,dashed){
        return{label,data,borderColor:color,borderWidth:2.5,
            borderDash:dashed?[6,4]:[],pointRadius:0,
            pointHoverRadius:7,pointHoverBackgroundColor:'#fff',
            pointHoverBorderColor:color,pointHoverBorderWidth:2.5,
            fill:false,tension:0.42};
    }
    function setLegend(items){
        const row=document.getElementById('lp-legend');
        if(!row)return;
        row.innerHTML=items.map(it=>`
            <div style="display:flex;align-items:center;gap:7px;
                font-size:11px;font-weight:600;color:#7B6FA0;">
                <div style="width:22px;height:3px;border-radius:2px;
                    background:${it.c};position:relative;flex-shrink:0;">
                    <div style="position:absolute;top:50%;left:50%;
                        transform:translate(-50%,-50%);width:7px;height:7px;
                        border-radius:50%;background:#fff;border:2px solid ${it.c};"></div>
                </div>
                <span>${it.l}</span>
            </div>`).join('');
    }

    if (view === 0){
        setLegend([{c:TH.p,l:'Loan repaid / year'},{c:TH.i,l:'Interest paid / year'}]);
        tt.callbacks={
            title:i=>'Year  '+i[0].label,
            label:c=>'  '+(c.datasetIndex===0?'Loan repaid  ':'Interest paid')+
                '  ₹'+Math.round(c.raw).toLocaleString('en-IN')
        };
        _chart=new Chart(canvas,{type:'line',
            data:{labels:d.labels,datasets:[
                areaDS('Loan repaid/yr',d.principalData,TH.p,TH.pi,false),
                areaDS('Interest/yr',   d.interestData, TH.i,TH.ii,true)
            ]},
            options:{responsive:true,maintainAspectRatio:false,
                animation:{duration:900,easing:'easeInOutQuart'},
                interaction:{mode:'index',intersect:false},
                plugins:{legend:{display:false},tooltip:tt},scales:SC}
        });

    } else if (view === 1){
        setLegend([{c:TH.p,l:'Balance remaining to pay'}]);
        tt.callbacks={
            title:i=>'Year  '+i[0].label,
            label:c=>'  Balance left   ₹'+Math.round(c.raw).toLocaleString('en-IN')
        };
        _chart=new Chart(canvas,{type:'line',
            data:{labels:d.labels,datasets:[
                areaDS('Balance',d.balanceData,TH.p,TH.pi,false)
            ]},
            options:{responsive:true,maintainAspectRatio:false,
                animation:{duration:900,easing:'easeInOutQuart'},
                interaction:{mode:'index',intersect:false},
                plugins:{legend:{display:false},tooltip:tt},scales:SC}
        });

    } else {
        setLegend([{c:TH.p,l:'Total loan repaid'},{c:TH.i,l:'Total interest paid'}]);
        tt.callbacks={
            title:i=>'Year  '+i[0].label,
            label:c=>'  '+(c.datasetIndex===0?'Total repaid ':'Total interest')+
                '  ₹'+Math.round(c.raw).toLocaleString('en-IN')
        };
        _chart=new Chart(canvas,{type:'line',
            data:{labels:d.labels,datasets:[
                lineDS('Total repaid',   d.cumPrincipalData,TH.p,false),
                lineDS('Total interest', d.cumInterestData, TH.i,true)
            ]},
            options:{responsive:true,maintainAspectRatio:false,
                animation:{duration:900,easing:'easeInOutQuart'},
                interaction:{mode:'index',intersect:false},
                plugins:{legend:{display:false},tooltip:tt},scales:SC}
        });
    }
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT CHART  — no active loan found
═══════════════════════════════════════════════════════════════ */
function showDefaultChart(canvas){
    if (_chart) { _chart.destroy(); _chart = null; }
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const vals  =[8200,8200,8200,8200,8200,7900,7900,7900,7900,7600,7600,7600];
    _chart=new Chart(canvas,{
        type:'line',
        data:{labels:months,datasets:[{
            data:vals,borderColor:'#6C47FF',borderWidth:2.5,
            pointRadius:0,pointHoverRadius:6,
            pointHoverBackgroundColor:'#6C47FF',
            pointHoverBorderColor:'#fff',pointHoverBorderWidth:2,
            fill:true,tension:0.45,
            backgroundColor:c=>{
                const g=c.chart.ctx.createLinearGradient(0,0,0,200);
                g.addColorStop(0,'rgba(108,71,255,0.18)');
                g.addColorStop(.65,'rgba(108,71,255,0.05)');
                g.addColorStop(1,'rgba(108,71,255,0.00)');
                return g;
            }
        }]},
        options:{responsive:true,maintainAspectRatio:false,
            animation:{duration:1000,easing:'easeInOutQuart'},
            plugins:{legend:{display:false},tooltip:{
                backgroundColor:'#0F0A2E',titleColor:'#fff',
                bodyColor:'rgba(200,190,255,.88)',
                borderColor:'rgba(108,71,255,.3)',borderWidth:1,
                padding:12,cornerRadius:10,displayColors:false,
                callbacks:{label:c=>'  EMI  ₹'+Math.round(c.raw).toLocaleString('en-IN')}
            }},
            scales:{
                x:{grid:{display:false},border:{display:false},
                    ticks:{color:'#C0B8D8',font:{size:11,family:"'Plus Jakarta Sans'"}}},
                y:{grid:{color:'rgba(108,71,255,.06)',lineWidth:1},
                    border:{display:false,dash:[3,4]},
                    ticks:{color:'#C0B8D8',font:{size:11},
                        callback:v=>'₹'+(v/1000).toFixed(1)+'K'}}
            }}
    });
}

/* ─── Format INR ───────────────────────────────────────────── */
function fmtINR(n){
    n=Math.round(n);
    if(n>=10000000)return'₹'+(n/10000000).toFixed(2)+' Cr';
    if(n>=100000)  return'₹'+(n/100000).toFixed(1)+' L';
    return'₹'+n.toLocaleString('en-IN');
}

