let currentStep = 1;
let selectedMethod = '';
let loanSummary = null; // data from get-emi-summary

function inr(amount) {
  const n = Number(amount || 0);
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function setError(step, msg) {
  const el = document.getElementById(`step${step}Error`);
  if (!el) return;
  el.style.display = msg ? 'block' : 'none';
  el.textContent = msg || '';
}

function setProgress(step) {
  const titles = {
    1: 'Loan EMI Summary',
    2: 'Select Payment Method',
    3: 'Review and Confirm Payment',
    4: 'Payment Success and Receipt'
  };

  document.getElementById('stepNumText').innerText = `Step ${step} of 4`;
  document.getElementById('stepTitleText').innerText = titles[step] || '';

  // Progress indicator
  for (let i = 1; i <= 4; i++) {
    const ps = document.getElementById(`ps${i}`);
    if (!ps) continue;
    ps.classList.toggle('active', i === step);
    ps.classList.toggle('done', i < step);
  }
  // Lines
  document.querySelectorAll('.ps-line').forEach((line, idx) => {
    // idx 0 is between 1-2; mark done if step > 1, etc.
    line.classList.toggle('done', step > (idx + 1));
  });
}

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.step-section').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`step${step}`);
  if (target) target.classList.add('active');
  setProgress(step);

  if (step === 3) {
    hydrateReview();
  }
}

function hydrateSummary() {
  if (!loanSummary) return;
  document.getElementById('s-loan-id').textContent = loanSummary.loan_id || '—';
  document.getElementById('s-loan-amount').textContent = inr(loanSummary.loan_amount);
  document.getElementById('s-emi-amount').textContent = inr(loanSummary.emi_amount);
  document.getElementById('s-remaining-emis').textContent = String(loanSummary.remaining_emis ?? '—');
  document.getElementById('s-remaining-balance').textContent = inr(loanSummary.remaining_balance);
  document.getElementById('s-next-emi').textContent =
    loanSummary.next_emi_month && loanSummary.next_emi_year
      ? `${loanSummary.next_emi_month} ${loanSummary.next_emi_year}`
      : '—';
}

function hydrateReview() {
  if (!loanSummary) return;
  document.getElementById('r-loan-id').textContent = loanSummary.loan_id || '—';
  document.getElementById('r-month').textContent =
    loanSummary.next_emi_month && loanSummary.next_emi_year
      ? `${loanSummary.next_emi_month} ${loanSummary.next_emi_year}`
      : '—';
  document.getElementById('r-amount').textContent = inr(loanSummary.emi_amount);
  document.getElementById('r-method').textContent = selectedMethod || '—';
}

function wireMethodSelection() {
  document.querySelectorAll('input[name="payment_method"]').forEach(inp => {
    inp.addEventListener('change', () => {
      selectedMethod = inp.value;
      setError(2, '');
      document.getElementById('btnNext2').disabled = !selectedMethod;
    });
  });
}

async function loadSummary() {
  const loanId = sessionStorage.getItem('payEmiLoanId') || '';
  const userId = localStorage.getItem('userId') || '';

  document.getElementById('s-loan-id').textContent = loanId || '—';

  if (!loanId) {
    setError(1, 'Missing loan. Please return to dashboard and click Pay EMI again.');
    document.getElementById('btnNext1').disabled = true;
    return;
  }
  if (!userId) {
    setError(1, 'Missing user session. Please login again.');
    document.getElementById('btnNext1').disabled = true;
    return;
  }

  try {
    const res = await fetch(`../../backend/api/get-emi-summary.php?loan_id=${encodeURIComponent(loanId)}&user_id=${encodeURIComponent(userId)}`);
    const json = await res.json();
    if (json.status !== 'success') {
      setError(1, json.message || 'Failed to load EMI summary.');
      document.getElementById('btnNext1').disabled = true;
      return;
    }

    loanSummary = json.data;
    
    // Safety Checks
    if (!loanSummary.remaining_balance || loanSummary.remaining_balance <= 0) {
      setError(1, "Invalid loan data: Remaining balance is zero or missing.");
      document.getElementById('btnNext1').disabled = true;
      return;
    }

    // Since we normalized, loan_status should be 'active' for approved loans
    if (loanSummary.loan_status && loanSummary.loan_status !== "active") {
        setError(1, "Loan not active: Status is " + loanSummary.loan_status);
        document.getElementById('btnNext1').disabled = true;
        return;
    }

    hydrateSummary();

    if (loanSummary.loan_completed || (loanSummary.remaining_emis ?? 0) <= 0) {
      setError(1, 'This loan is already completed. No EMI is due.');
      document.getElementById('btnNext1').disabled = true;
      return;
    }

    document.getElementById('btnNext1').disabled = false;
    setError(1, '');
  } catch (e) {
    console.error(e);
    setError(1, 'System error loading EMI summary.');
    document.getElementById('btnNext1').disabled = true;
  }
}

async function confirmPayment() {
  setError(3, '');
  if (!loanSummary || !loanSummary.loan_id) {
    setError(3, 'Missing loan summary. Please restart payment.');
    return;
  }
  if (!selectedMethod) {
    setError(3, 'Please select a payment method.');
    return;
  }

  const confirmBtn = document.getElementById('btnConfirm');
  if (confirmBtn) {
    confirmBtn.classList.add('loading');
    confirmBtn.disabled = true;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  const userId = localStorage.getItem('userId') || '';
  try {
    const res = await fetch(`../../backend/api/process-emi-payment.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loan_id: loanSummary.loan_id,
        user_id: userId,
        payment_method: selectedMethod
      })
    });
    const json = await res.json();

    if (json.status !== 'success') {
      overlay.classList.remove('active');
      if (confirmBtn) {
        confirmBtn.classList.remove('loading');
        confirmBtn.disabled = false;
      }
      setError(3, json.message || 'Payment failed.');
      return;
    }

    // Receipt
    document.getElementById('rc-txn').textContent = json.data.transaction_id || '—';
    document.getElementById('rc-loan').textContent = loanSummary.loan_id;
    document.getElementById('rc-amount').textContent = inr(json.data.amount || loanSummary.emi_amount);
    document.getElementById('rc-date').textContent = json.data.payment_date || new Date().toLocaleDateString('en-IN');
    document.getElementById('rc-method').textContent = json.data.payment_method || selectedMethod;

    // ----- CREDIT SCORE LOGIC INTEGRATION -----
    // 1. Fetch updated automatic score from backend if provided, otherwise boost fallback up to 900
    let newScore = json.data.new_credit_score;
    if (!newScore) {
      let currentScore = parseInt(localStorage.getItem('credit_score')) || 726;
      newScore = Math.min(900, currentScore + 15);
    }
    fetch(`../../backend/api/get-emi-summary.php?loan_id=${encodeURIComponent(loanSummary.loan_id)}&user_id=${encodeURIComponent(userId)}`);
    //localStorage.setItem('credit_score', newScore);

    // 2. Append to history for line chart
    let histJSON = localStorage.getItem('credit_score_history') || '[]';
    let cHistory = [];
    try { cHistory = JSON.parse(histJSON); } catch(e){}
    cHistory.push(newScore);
    if(cHistory.length > 12) cHistory.shift();
    localStorage.setItem('credit_score_history', JSON.stringify(cHistory));

    // 3. Append to payment status log
    let payLogJSON = localStorage.getItem('payment_history') || '[]';
    let payLog = [];
    try { payLog = JSON.parse(payLogJSON); } catch(e){}
    const paymentAmt = json.data.amount || loanSummary.emi_amount;
    payLog.unshift({
       date: new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}),
       status: 'Paid',
       amount: paymentAmt,
       loan_id: loanSummary.loan_id
    });
    if(payLog.length > 20) payLog.pop();
    localStorage.setItem('payment_history', JSON.stringify(payLog));
    // ------------------------------------------

    // Helpful for next pages
    sessionStorage.removeItem('payEmiLoanId');

    overlay.classList.remove('active');
    if (confirmBtn) {
      confirmBtn.classList.remove('loading');
      confirmBtn.disabled = false;
    }
    goToStep(4);
  } catch (e) {
    console.error(e);
    overlay.classList.remove('active');
    if (confirmBtn) {
      confirmBtn.classList.remove('loading');
      confirmBtn.disabled = false;
    }
    setError(3, 'System error processing payment.');
  }
}

// Expose for inline handlers
window.goToStep = goToStep;
window.confirmPayment = confirmPayment;

document.addEventListener('DOMContentLoaded', async () => {
  setProgress(1);
  wireMethodSelection();
  await loadSummary();

  // Step 2 button state
  document.getElementById('btnNext2').disabled = true;
});


