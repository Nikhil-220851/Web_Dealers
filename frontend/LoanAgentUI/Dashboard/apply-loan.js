/* ═══════════════════════════════════════
   LoanAgentUI — apply-loan.js (Upgraded)
═══════════════════════════════════════ */

let loanSchemesData = [];

/* ── Fetch loan schemes from API ── */
async function fetchLoanSchemes() {
    try {
        const res = await fetch(`${API_BASE}/get-loan-products.php`);
        const json = await res.json();
        if (json.status === 'success') {
            loanSchemesData = json.data;
            const select = document.getElementById('loanSchemeSelect');
            select.innerHTML = '<option value="">— Select a Loan Scheme —</option>';
            loanSchemesData.forEach(scheme => {
                const opt = document.createElement('option');
                opt.value = scheme.id;
                // Show interest rate in label if available
                const rate = scheme.interest_rate
                    ? ` — ${scheme.interest_rate}% p.a.`
                    : '';
                opt.textContent = `${scheme.loan_name}${rate}`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Failed to load schemes', e);
        const select = document.getElementById('loanSchemeSelect');
        select.innerHTML = '<option value="">Failed to load — refresh page</option>';
    }
}

/* ── On scheme selection ── */
function onSchemeSelect() {
    const selId = document.getElementById('loanSchemeSelect').value;
    const scheme = loanSchemesData.find(s => String(s.id) === String(selId));

    const amtInput    = document.getElementById('loanAmountInput');
    const tenureInput = document.getElementById('loanTenureInput');
    const purposeHid  = document.getElementById('loanPurposeHidden');
    const infoStrip   = document.getElementById('schemeInfoStrip');

    if (scheme) {
        amtInput.min   = scheme.min_amount;
        amtInput.max   = scheme.max_amount;
        amtInput.value = scheme.min_amount;
        amtInput.placeholder = `₹${Number(scheme.min_amount).toLocaleString('en-IN')} – ₹${Number(scheme.max_amount).toLocaleString('en-IN')}`;

        tenureInput.value = scheme.tenure;
        purposeHid.value  = scheme.loan_name;

        document.getElementById('amtFeedback').textContent =
            `Amount must be between ₹${Number(scheme.min_amount).toLocaleString('en-IN')} and ₹${Number(scheme.max_amount).toLocaleString('en-IN')}.`;

        // Update info strip
        document.getElementById('schemeRate').textContent   = scheme.interest_rate ?? 'N/A';
        document.getElementById('schemeRange').textContent  =
            `₹${Number(scheme.min_amount).toLocaleString('en-IN')} – ₹${Number(scheme.max_amount).toLocaleString('en-IN')}`;
        document.getElementById('schemeTenure').textContent = scheme.tenure;
        infoStrip.classList.add('visible');

        // Highlight step 4 as active
        updateStepIndicator(4);
    } else {
        amtInput.value    = '';
        amtInput.placeholder = 'Enter amount';
        tenureInput.value = '';
        purposeHid.value  = '';
        infoStrip.classList.remove('visible');
    }

    calculateEMI();
}

/* ── EMI calculation (reducing balance) ── */
function calculateEMI() {
    const P = parseFloat(document.getElementById('loanAmountInput').value);
    const n = parseInt(document.getElementById('loanTenureInput').value);

    // Find interest rate from selected scheme
    const selId  = document.getElementById('loanSchemeSelect').value;
    const scheme = loanSchemesData.find(s => String(s.id) === String(selId));
    const annualRate = scheme && scheme.interest_rate ? parseFloat(scheme.interest_rate) : 0;

    const el = document.getElementById('emiPreview');

    if (P > 0 && n > 0) {
        let emi;
        if (annualRate > 0) {
            // Reducing balance EMI formula: P × r(1+r)^n / ((1+r)^n − 1)
            const r = annualRate / 12 / 100;
            const factor = Math.pow(1 + r, n);
            emi = Math.round((P * r * factor) / (factor - 1));
        } else {
            // Fallback: simple division
            emi = Math.round(P / n);
        }
        el.textContent = `₹${emi.toLocaleString('en-IN')}/mo`;
    } else {
        el.textContent = '₹0';
    }
}

/* ── Step indicator helper ── */
function updateStepIndicator(activeStep) {
    const items     = document.querySelectorAll('.step-item');
    const dividers  = document.querySelectorAll('.step-divider');
    items.forEach((item, idx) => {
        const step = idx + 1;
        item.classList.remove('active', 'done');
        if (step < activeStep)  item.classList.add('done');
        if (step === activeStep) item.classList.add('active');
    });
    dividers.forEach((div, idx) => {
        div.classList.toggle('done', idx + 1 < activeStep);
    });
}

/* ── Toast notification ── */
let toastTimer = null;
function showToast(title, sub, isError = false) {
    const toast = document.getElementById('appToast');
    const icon  = toast.querySelector('i');

    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastSub').textContent   = sub;

    toast.classList.toggle('error-toast', isError);
    icon.className = isError ? 'fas fa-times-circle' : 'fas fa-check-circle';

    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ── Reset form ── */
function resetForm() {
    const form = document.getElementById('applyLoanForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('emiPreview').textContent = '₹0';
    document.getElementById('schemeInfoStrip').classList.remove('visible');
    updateStepIndicator(1);
}

/* ── Submit handler ── */
async function submitLoanForm(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = document.getElementById('submitLoanBtn');

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        // Scroll to first invalid field
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const formData = new FormData(form);
    const payload  = Object.fromEntries(formData.entries());

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

    try {
        const response = await fetch(`${API_BASE}/loanagent-apply-loan.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            showToast('Application Submitted!', data.message || 'Loan application sent for review.');
            form.reset();
            form.classList.remove('was-validated');
            document.getElementById('emiPreview').textContent = '₹0';
            document.getElementById('schemeInfoStrip').classList.remove('visible');
            updateStepIndicator(1);

            setTimeout(() => { window.location.href = 'dashboard.html'; }, 2500);
        } else {
            showToast('Submission Failed', data.message || 'Please check your inputs and retry.', true);
        }
    } catch (err) {
        showToast('Network Error', 'Could not reach the server. Check your connection.', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Loan Application';
    }
}

/* ── Step indicator driven by scroll / field focus ── */
document.addEventListener('DOMContentLoaded', () => {
    // Map card index → step number
    const cards = document.querySelectorAll('.form-card');
    const stepMap = [1, 2, 3, 4, 4]; // card 4 & 5 both belong to step 4 visually

    cards.forEach((card, idx) => {
        const inputs = card.querySelectorAll('input, select, textarea');
        inputs.forEach(inp => {
            inp.addEventListener('focus', () => {
                updateStepIndicator(stepMap[idx] || 1);
            });
        });
    });
});
