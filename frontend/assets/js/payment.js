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

// Adding click handlers to upi apps for demo purposes
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.upi-app').forEach(app => {
    app.addEventListener('click', function() {
      document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('upiId').value = ''; // clear input if app clicked
      validateStep2();
    });
  });
});

// Step 3 Logic
function setupReview(method) {
  const iconMap = {
    'card': { icon: 'ph-credit-card', title: 'Credit / Debit Card' },
    'upi': { icon: 'ph-device-mobile', title: 'UPI' },
    'netbanking': { icon: 'ph-bank', title: 'Net Banking' },
    'wallet': { icon: 'ph-wallet', title: 'LoanPro Wallet' }
  };

  const reviewIcon = document.getElementById('reviewIcon');
  const reviewMethod = document.getElementById('reviewMethod');
  const reviewDetail = document.getElementById('reviewDetail');
  const receiptMethod = document.getElementById('receiptMethod');

  reviewIcon.innerHTML = `<i class="ph ${iconMap[method].icon}"></i>`;
  reviewMethod.innerText = iconMap[method].title;
  receiptMethod.innerText = iconMap[method].title;

  // Simple detail display based on inputs
  if (method === 'card') reviewDetail.innerText = 'Card ending in xxxx'; // simulated
  else if (method === 'upi') {
    const upiVal = document.getElementById('upiId').value;
    reviewDetail.innerText = upiVal || 'UPI App Payment';
  }
  else if (method === 'netbanking') reviewDetail.innerText = 'Direct Bank Transfer';
  else if (method === 'wallet') reviewDetail.innerText = 'Deducted from balance';
}

// Processing
function processPayment() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.remove('active');
    goToStep(4);
  }, 2500);
}
