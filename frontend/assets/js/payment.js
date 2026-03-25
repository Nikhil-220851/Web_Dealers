let currentStep = 1;
let selectedMethod = '';

// Step 1: Selection Logic
function enableStep1() {
  const methodInputs = document.querySelectorAll('input[name="payment_method"]');
  methodInputs.forEach(input => {
    if (input.checked) {
      selectedMethod = input.value;
    }
  });

  const btnNext1 = document.getElementById('btnNext1');
  if (selectedMethod) {
    btnNext1.removeAttribute('disabled');
  }
}

// Transition Logic
function goToStep(step) {
  // Save step
  currentStep = step;

  // Hide all steps
  document.querySelectorAll('.step-section').forEach(el => el.classList.remove('active'));
  
  // Show target step
  document.getElementById(`step${step}`).classList.add('active');

  // Update Progress Bar
  const progressFill = document.getElementById('progressFill');
  progressFill.style.width = `${step * 25}%`;

  // Update Indicator Text
  document.getElementById('stepNumText').innerText = `Step ${step} of 4`;
  
  const titles = {
    1: 'Select Payment Method',
    2: 'Enter Payment Details',
    3: 'Confirm & Pay',
    4: 'Payment Successful'
  };
  document.getElementById('stepTitleText').innerText = titles[step];

  // Specific Step Handlers
  if (step === 2) {
    showMethodForm(selectedMethod);
    validateStep2(); // Initial check
  }

  if (step === 3) {
    setupReview(selectedMethod);
  }
}

// Step 2 Logic
function showMethodForm(method) {
  // hide all dynamic forms
  document.querySelectorAll('.payment-form').forEach(f => f.classList.remove('active'));

  // show selected form
  const targetForm = document.getElementById(`form-${method}`);
  if (targetForm) {
    targetForm.classList.add('active');
  }
}

function validateStep2() {
  const btnNext2 = document.getElementById('btnNext2');
  let valid = false;

  if (selectedMethod === 'card') {
    // simplified validation
    const inputs = document.querySelectorAll('#form-card input');
    let filled = 0;
    inputs.forEach(i => { if (i.value.trim().length > 2) filled++; });
    valid = filled === 4;
  } else if (selectedMethod === 'upi') {
    // simplified validation (app clicked or upi id typed)
    const upiId = document.getElementById('upiId').value;
    const isAppSelected = document.querySelectorAll('.upi-app.selected').length > 0;
    valid = upiId.includes('@') || isAppSelected;
  } else if (selectedMethod === 'netbanking') {
    const bankChecked = document.querySelector('input[name="bank"]:checked');
    const bankSelect = document.querySelector('#form-netbanking select').value;
    valid = bankChecked || bankSelect;
  } else if (selectedMethod === 'wallet') {
    valid = true; // wallet balance assumed sufficient in UI
  }

  if (valid) {
    btnNext2.removeAttribute('disabled');
  } else {
    btnNext2.setAttribute('disabled', 'true');
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const loanId = sessionStorage.getItem('payEmiLoanId');
  const emiAmount = sessionStorage.getItem('payEmiAmount');

  if (loanId && emiAmount) {
    // Update summary UI if elements exist
    const elements = document.querySelectorAll('.font-semi.text-text');
    if (elements.length >= 2) {
      elements[0].innerText = loanId;
      elements[1].innerText = `₹${Math.round(emiAmount).toLocaleString('en-IN')}`;
    }
    
    const payBtn = document.getElementById('btnPay');
    if (payBtn) {
      payBtn.innerHTML = `<i class="ph-fill ph-lock-key"></i> Pay ₹${Math.round(emiAmount).toLocaleString('en-IN')} Securely`;
    }

    const totalDisplays = document.querySelectorAll('.d-family.text-blue');
    totalDisplays.forEach(el => {
      el.innerText = `₹${Math.round(emiAmount).toLocaleString('en-IN')}`;
    });
  }

  // Adding click handlers to upi apps for demo purposes
  document.querySelectorAll('.upi-app').forEach(app => {
    app.addEventListener('click', function() {
      document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('upiId').value = ''; // clear input if app clicked
      validateStep2();
    });
  });
});

// Processing
async function processPayment() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  const userId = localStorage.getItem('userId');
  const loanId = sessionStorage.getItem('payEmiLoanId');
  const emiAmount = sessionStorage.getItem('payEmiAmount');
  
  if (!userId || !loanId) {
    alert("Missing user or loan information. Please return to the dashboard.");
    overlay.classList.remove('active');
    return;
  }

  try {
    const response = await fetch('../../backend/api/process-emi-payment.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        loan_id: loanId,
        payment_method: document.getElementById('reviewMethod').innerText
      })
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      overlay.classList.remove('active');
      
      // Update receipt UI
      const rcRows = document.querySelectorAll('.rc-row span:last-child');
      if (rcRows.length >= 2) {
        rcRows[0].innerText = `₹${Math.round(result.data.amount || emiAmount).toLocaleString('en-IN')}`;
        rcRows[1].innerText = result.data.transaction_id;
      }
      
      goToStep(4);
    } else {
      overlay.classList.remove('active');
      alert(`Payment failed: ${result.message}`);
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    overlay.classList.remove('active');
    alert("An error occurred during payment processing. Please try again.");
  }
}
