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
  const loanId = loanSummary.loan_id;
  const amountPaise = Math.round(loanSummary.emi_amount * 100);

  try {
    // 1. Create Razorpay Order
    const orderRes = await fetch(`../../backend/razorpay/create_order.php?amount=${amountPaise}`);
    const orderData = await orderRes.json();

    if (!orderData.success) {
      throw new Exception(orderData.error || 'Failed to create payment order');
    }

    // 2. Open Razorpay Checkout
    const options = {
      key: 'rzp_test_SV5ZCgjwvjwrzG', // Should ideally come from config via API, but following current pattern
      amount: amountPaise,
      currency: 'INR',
      name: 'LoanPro',
      description: `EMI Payment - ${loanId}`,
      order_id: orderData.order_id,
      prefill: {
        name: localStorage.getItem('userName') || 'User',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userContact') || ''
      },
      theme: { color: '#1a237e' },
      handler: async function (response) {
        // 3. Verify and Process on success
        try {
          const verifyRes = await fetch(`../../backend/api/verify-and-process.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              loan_id: loanId,
              user_id: userId
            })
          });
          const json = await verifyRes.json();

          if (json.status !== 'success') {
            throw new Error(json.message || 'Payment verification failed');
          }

          // 4. Update UI for Success
          document.getElementById('rc-txn').textContent = json.data.transaction_id || '—';
          document.getElementById('rc-loan').textContent = loanId;
          document.getElementById('rc-amount').textContent = inr(json.data.amount || loanSummary.emi_amount);
          document.getElementById('rc-date').textContent = json.data.payment_date || new Date().toLocaleDateString('en-IN');
          document.getElementById('rc-method').textContent = 'Razorpay';

          // Update local status for dashboard consistency
          let newScore = json.data.new_credit_score;
          localStorage.setItem('credit_score', newScore);

          sessionStorage.removeItem('payEmiLoanId');
          overlay.classList.remove('active');
          goToStep(4);

        } catch (err) {
          overlay.classList.remove('active');
          if (confirmBtn) {
            confirmBtn.classList.remove('loading');
            confirmBtn.disabled = false;
          }
          setError(3, err.message || 'Verification error. Contact support.');
        }
      },
      modal: {
        ondismiss: function () {
          overlay.classList.remove('active');
          if (confirmBtn) {
            confirmBtn.classList.remove('loading');
            confirmBtn.disabled = false;
          }
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (e) {
    console.error(e);
    overlay.classList.remove('active');
    if (confirmBtn) {
      confirmBtn.classList.remove('loading');
      confirmBtn.disabled = false;
    }
    setError(3, e.message || 'System error initiating payment.');
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


