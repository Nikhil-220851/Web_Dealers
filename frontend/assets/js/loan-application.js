/* =====================================================
   LOAN APPLICATION FLOW - REBUILT
   Clean 4-step architecture with robust state management.
===================================================== */

const AppState = {
  loanId: null,
  loanData: null,
  userId: localStorage.getItem('userId'),
  applicantDetails: {}
};

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  AppState.loanId = params.get('loanId');

  if (!AppState.loanId || AppState.loanId === 'undefined') {
    document.getElementById('app-wrapper').innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <i class="ph ph-warning-circle" style="font-size:48px;color:var(--red);margin-bottom:16px;display:inline-block"></i>
        <h3 style="color:var(--text1);font-size:18px;margin-bottom:8px">Invalid Request</h3>
        <p style="color:var(--text2);margin-bottom:20px">No valid loan product was selected.</p>
        <a href="apply-loan.html" class="btn btn-primary">Back to Marketplace</a>
      </div>`;
    return;
  }

  if (!AppState.userId) {
    window.location.href = '../auth/login.html';
    return;
  }

  // Init UI
  goToStep(1);

  // Fetch contextual data simultaneously
  await Promise.all([
    fetchLoanProduct(),
    fetchUserProfile()
  ]);
});

/* ── UI Navigation ─────────────────────── */
function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));

  // Show target step
  const target = document.getElementById(`step-${step}`);
  if (target) target.classList.add('active');

  // Update Stepper UI
  for (let i = 1; i <= 4; i++) {
    const circ = document.getElementById(`ind-${i}`);
    const line = document.getElementById(`line-${i}`);

    if (circ) {
      circ.className = 'step-circ'; // reset
      if (i < step) {
        circ.classList.add('done');
        circ.innerHTML = '<i class="ph ph-check" style="font-weight:bold"></i>';
      } else if (i === step) {
        circ.classList.add('active');
        circ.textContent = i;
      } else {
        circ.textContent = i;
      }
    }

    if (line) {
      if (i < step) line.classList.add('done');
      else line.classList.remove('done');
    }
  }

  // Pre-rendering logic for specific steps
  if (step === 3) populateReview();
}

/* ── Data Fetching ─────────────────────── */
async function fetchLoanProduct() {
  try {
    const res = await fetch(`../../backend/api/get-loan-products.php`);
    const json = await res.json();
    if (json.status === 'success') {
      const match = json.data.find(l => l.id === AppState.loanId || l._id === AppState.loanId);
      if (match) {
        AppState.loanData = match;
        // Update contextual header
        const initials = match.bank_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        document.getElementById('ctx-type').textContent = match.loan_type;
        document.getElementById('ctx-bank').textContent = match.bank_name;
        document.getElementById('ctx-rate').textContent = (match.interest_rate || 0) + '%';
        document.getElementById('ctx-logo-wrap').innerHTML = `
          <img src="${getBankLogo(match.bank_name)}" alt="${match.bank_name}" class="bank-logo-img" style="width:100%;height:100%;object-fit:contain;display:block" onerror="this.src='../assets/images/banks/default.png'">
        `;

        // Auto-set max loan amount allowed (demo cap)
        const amtField = document.getElementById('f_loan_amount');
        if (amtField && match.max_amount) {
          amtField.max = match.max_amount;
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch loan details", e);
  }
}

async function fetchUserProfile() {
  try {
    const res = await fetch(`../../backend/api/get-profile.php?userId=${AppState.userId}`);
    const json = await res.json();

    if (json.status === 'success') {
      const u = json.user || {};
      const bank = json.bankDetails || {};
      const kyc = json.kycDetails || {};

      // const safeSet = (id, val) => {
      //   const el = document.getElementById(id);
      //   if (el && val) el.value = val;
      const safeSet = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) {
          el.value = val;
          // Lock the field if it represents personal info or KYC
          if (!['f_bankname', 'f_acc', 'f_ifsc', 'f_loan_amount', 'f_tenure', 'f_employment'].includes(id)) {
            el.setAttribute('readonly', 'true');
            el.style.backgroundColor = 'var(--bg)';
            el.style.cursor = 'not-allowed';
          }
        }
      };

      // };

      // Populate Form
      safeSet('f_name', (u.firstname || '') + ' ' + (u.lastname || ''));
      safeSet('f_email', u.email);
      safeSet('f_phone', u.phoneno);
      safeSet('f_dob', kyc.dob);
      safeSet('f_address', kyc.address);
      safeSet('f_pan', kyc.panNumber);
      safeSet('f_aadhaar', kyc.aadhaarNumber);
      safeSet('f_bankname', bank.bankName);
      safeSet('f_acc', bank.accountNumber);
      safeSet('f_ifsc', bank.ifscCode);
    }
  } catch (e) {
    console.error("Failed to fetch user profile", e);
  }
}

/* ── Validation & Step 2 Processing ─────────────────────── */
function validateStep2() {
  const errBox = document.getElementById('step-2-err');
  errBox.style.display = 'none';

  const fields = [
    'f_name', 'f_email', 'f_phone', 'f_dob', 'f_address',
    'f_pan', 'f_aadhaar', 'f_bankname', 'f_acc', 'f_ifsc',
    'f_income', 'f_loan_amount', 'f_tenure', 'f_employment'
  ];

  let isValid = true;
  AppState.applicantDetails = {};

  fields.forEach(f => {
    const el = document.getElementById(f);
    el.style.borderColor = 'var(--border)'; // reset

    if (!el.value.trim()) {
      el.style.borderColor = 'var(--red)';
      isValid = false;
    } else {
      AppState.applicantDetails[f] = el.value.trim();
    }
  });

  if (!isValid) {
    errBox.style.display = 'block';
    return;
  }

  goToStep(3);
}

/* ── Build Review (Step 3) ─────────────────────── */
function populateReview() {
  const reviewEl = document.getElementById('review-content');
  const details = AppState.applicantDetails;

  const amtFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(details.f_loan_amount);

  const rows = [
    { label: 'Bank & Loan', value: `${AppState.loanData?.bank_name || 'N/A'} - ${AppState.loanData?.loan_type || 'N/A'}` },
    { label: 'Requested Amount', value: `<span style="color:var(--primary);font-size:16px">${amtFormat}</span>` },
    { label: 'Tenure', value: `${details.f_tenure} Months` },
    { label: 'Applicant Name', value: details.f_name },
    { label: 'Email', value: details.f_email },
    { label: 'Phone', value: details.f_phone },
    { label: 'PAN', value: details.f_pan },
    { label: 'Aadhaar', value: details.f_aadhaar },
    { label: 'Disbursal Bank', value: details.f_bankname },
    { label: 'Account No', value: details.f_acc },
    { label: 'Employment', value: details.f_employment }
  ];

  reviewEl.innerHTML = rows.map((r, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;${i !== rows.length - 1 ? 'border-bottom:1px solid var(--border)' : ''}">
      <span style="color:var(--text2);font-size:13px">${r.label}</span>
      <span style="font-weight:600;color:var(--text1);font-size:14px;text-align:right">${r.value}</span>
    </div>
  `).join('');
}

/* ── Final Submission ─────────────────────── */
async function submitApplication() {
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';

  const payload = {
    userId: AppState.userId,
    loanProductId: AppState.loanId,
    loanAmount: parseFloat(AppState.applicantDetails.f_loan_amount) || 0,
    loanTenure: parseInt(AppState.applicantDetails.f_tenure) || 12,
    applicantDetails: AppState.applicantDetails // Store the frozen snapshot
  };

  try {
    const res = await fetch('../../backend/api/apply-loan.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (res.ok && json.status === 'success') {
      document.getElementById('succ-app-id').textContent = json.applicationId;
      goToStep(4);
    } else {
      throw new Error(json.message || 'Server rejected application');
    }
  } catch (err) {
    alert('Submission failed: ' + err.message);
    btn.disabled = false;
  }
}

function getBankLogo(bankName) {
  const map = {
    'HDFC Bank': 'HDFC',
    'State Bank of India': 'SBI',
    'ICICI Bank': 'ICICI',
    'Axis Bank': 'AXIS',
    'Kotak Mahindra Bank': 'KOTAK',
    'Canara Bank': 'CANARA',
    'IndusInd Bank': 'INDUSLAND',
    'Punjab National Bank': 'PUNJABNATIONALBANK',
    'Bank of Baroda': 'BANKOFBARODA',
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}
