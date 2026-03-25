/* =====================================================
   LOAN DETAILS PAGE — loan-details.js
   Reads loanId from URL params, fetches from DB,
   and populates all detail sections.
===================================================== */
/*
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = '../auth/login.html';
    return;
  }
  const params  = new URLSearchParams(window.location.search);
  const loanId  = params.get('loanId');
  if (!loanId) {
    showError('No loan ID provided. Please go back and select a loan.');
    return;
  }
  loadLoanDetails(loanId);
});

async function loadLoanDetails(loanId) {
  const content = document.getElementById('ld-content');
  if (content) content.innerHTML = `
    <div class="ld-loading">
      <i class="ph ph-spinner" style="font-size:36px;animation:spin 1s linear infinite;color:var(--primary)"></i>
      <div>Loading loan details…</div>
    </div>`;

  try {
    const res  = await fetch(`../../backend/api/get-loan-product.php?loanId=${loanId}`);
    const json = await res.json();

    if (json.status === 'success') {
      renderLoanDetails(json.data);
    } else {
      showError(json.message || 'Loan product not found.');
    }
  } catch (err) {
    console.error(err);
    showError('Failed to connect to server. Please ensure XAMPP is running.');
  }
}

function renderLoanDetails(loan) {
  const maxFmt   = '₹' + formatAmount(loan.max_amount);
  const minFmt   = '₹' + formatAmount(loan.min_amount);
  const tenureFmt = loan.tenure ? formatTenure(loan.tenure) : '—';
  const salaryFmt = loan.min_salary ? '₹' + parseInt(loan.min_salary).toLocaleString('en-IN') + '/mo' : 'Not specified';
  const creditFmt = loan.credit_score ? loan.credit_score + '+' : 'Not specified';
  const empFmt    = loan.employment_type ? loan.employment_type : 'Not specified';
  const feeFmt    = loan.processing_fee ? loan.processing_fee + '% of loan amount' : '—';
  const logoSrc   = getBankLogo(loan.bank_name);
  const initials  = loan.bank_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Documents list based on loan type
  const docs = getDocumentList(loan.loan_type);

  const content = document.getElementById('ld-content');
  if (!content) return;

  content.innerHTML = `
    <!-- Back link -->
    <a href="apply-loan.html" class="ld-back-link">
      <i class="ph ph-arrow-left"></i> Back to Loan Marketplace
    </a>

    <!-- Hero Section -->
    <div class="ld-hero">
      <div class="ld-hero-top">
        <div class="ld-bank-avatar">
          <img src="${logoSrc}" alt="${loan.bank_name}" class="bank-logo-img-lg" style="width:100%;height:100%;object-fit:contain;display:block" onerror="this.src='../assets/images/banks/default.png'">
        </div>
        <div class="ld-hero-text">
          <div class="ld-bank-name-hero">${loan.bank_name}</div>
          <div class="ld-loan-type-hero">${loan.loan_type}</div>
        </div>
        <div class="ld-rate-chip">
          <span>Interest Rate</span>
          ${loan.interest_rate}% p.a.
        </div>
      </div>
      <div class="ld-stats-row">
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Min Amount</div>
          <div class="ld-stat-val">${minFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Max Amount</div>
          <div class="ld-stat-val">${maxFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Tenure</div>
          <div class="ld-stat-val">${tenureFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Processing Fee</div>
          <div class="ld-stat-val">${loan.processing_fee}%</div>
        </div>
      </div>
    </div>

    <!-- 2-col grid: Loan Info + Eligibility -->
    <div class="ld-content-grid">

      <!-- Loan Information -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-info"></i>
          Loan Information
        </div>
        <div class="ld-info-grid">
          <div class="ld-info-item">
            <div class="ld-info-label">Bank Name</div>
            <div class="ld-info-val">${loan.bank_name}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Loan Type</div>
            <div class="ld-info-val">${loan.loan_type}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Interest Rate</div>
            <div class="ld-info-val" style="color:var(--primary)">${loan.interest_rate}% p.a.</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Processing Fee</div>
            <div class="ld-info-val">${feeFmt}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Minimum Amount</div>
            <div class="ld-info-val">${minFmt}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Maximum Amount</div>
            <div class="ld-info-val">${maxFmt}</div>
          </div>
          <div class="ld-info-item" style="grid-column:1/-1">
            <div class="ld-info-label">Loan Tenure</div>
            <div class="ld-info-val">${tenureFmt}</div>
          </div>
        </div>
      </div>

      <!-- Eligibility Criteria -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-check-circle"></i>
          Eligibility Criteria
        </div>
        <div class="ld-elig-row">
          <span class="ld-elig-label">Minimum Monthly Salary</span>
          <span class="ld-elig-val">${salaryFmt}</span>
        </div>
        <div class="ld-elig-row">
          <span class="ld-elig-label">Minimum Credit Score</span>
          <span class="ld-elig-val">${creditFmt}</span>
        </div>
        <div class="ld-elig-row">
          <span class="ld-elig-label">Employment Type</span>
          <span class="ld-elig-val">${empFmt}</span>
        </div>
        <div class="ld-elig-row">
          <span class="ld-elig-label">Age Requirement</span>
          <span class="ld-elig-val">21 – 60 years</span>
        </div>
        <div class="ld-elig-row">
          <span class="ld-elig-label">Indian Citizen</span>
          <span class="ld-elig-val">Required</span>
        </div>
      </div>
    </div>

    <!-- 2-col grid: Documents + Benefits -->
    <div class="ld-content-grid ld-section-full">

      <!-- Required Documents -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-file-text"></i>
          Required Documents
        </div>
        <ul class="ld-check-list">
          ${docs.map(d => `<li class="ld-check-item">${d}</li>`).join('')}
        </ul>
      </div>

      <!-- Loan Benefits -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-star"></i>
          Loan Benefits
        </div>
        <ul class="ld-check-list">
          <li class="ld-check-item">Quick approval within 24–48 hours</li>
          <li class="ld-check-item">Flexible repayment options — monthly or quarterly</li>
          <li class="ld-check-item">Competitive interest rates benchmarked to MCLR</li>
          <li class="ld-check-item">No prepayment penalty after 6 months</li>
          <li class="ld-check-item">Digital disbursement — funds transferred directly to your account</li>
          <li class="ld-check-item">Dedicated relationship manager for loan guidance</li>
        </ul>
      </div>
    </div>

    <!-- Apply Bar -->
    <div class="ld-apply-bar">
      <div class="ld-apply-text">
        <strong>Ready to apply for this loan?</strong>
        <span>Complete your application in a few simple steps.</span>
      </div>
      <button class="btn btn-primary ld-apply-btn" onclick="window.location.href='loan-application.html?loanId=${loan.id}'">
        Apply for Loan <i class="ph ph-arrow-right"></i>
      </button>
    </div>
  `;

  // Update page title
  document.title = `${loan.loan_type} – ${loan.bank_name} | LoanPro`;
}

function showError(msg) {
  const content = document.getElementById('ld-content');
  if (!content) return;
  content.innerHTML = `
    <div class="ld-loading" style="flex-direction:column;gap:16px">
      <i class="ph ph-warning-circle" style="font-size:44px;color:#DC2626"></i>
      <div style="font-weight:700;color:var(--text1);font-size:16px">Something went wrong</div>
      <div style="color:var(--text2);font-size:13px;text-align:center">${msg}</div>
      <a href="apply-loan.html" class="btn btn-primary" style="margin-top:8px">← Back to Loans</a>
    </div>`;
}

function formatAmount(amount) {
  if (!amount) return '—';
  if (amount >= 10000000) return (amount / 10000000).toFixed(1) + ' Cr';
  if (amount >= 100000)   return (amount / 100000).toFixed(0) + ' L';
  return parseInt(amount).toLocaleString('en-IN');
}

function formatTenure(months) {
  if (!months) return '—';
  if (months < 12)  return months + ' months';
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  return mo ? `${yrs} yr ${mo} mo` : `${yrs} years`;
}

function getDocumentList(loanType) {
  const common = [
    'Identity Proof — Aadhaar Card / Passport / Voter ID',
    'Address Proof — Utility Bill / Rental Agreement',
    'Income Proof — Last 3 months salary slips',
    'Bank Statements — Last 6 months',
  ];
  const extra = {
    'Home Loan':     ['Property Documents — Sale Deed / NOC', 'Approved Building Plan'],
    'Car Loan':      ['Vehicle Quotation from Dealer', 'Driving Licence'],
    'Education Loan':['Admission Letter from Institution', 'Fee Structure / Prospectus'],
    'Business Loan': ['Business Registration Certificate', 'GST Returns — Last 2 years'],
  };
  return [...common, ...(extra[loanType] || [])];
}
function getBankLogo(bankName) {
  const map = {
    'HDFC Bank':           'HDFC',
    'State Bank of India': 'SBI',
    'ICICI Bank':          'ICICI',
    'Axis Bank':           'AXIS',
    'Kotak Mahindra Bank': 'KOTAK',
    'Canara Bank':         'CANARA',
    'IndusInd Bank':       'INDUSLAND',
    'Punjab National Bank':'PUNJABNATIONALBANK',
    'Bank of Baroda':      'BANKOFBARODA',
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}*/

/* =====================================================
   LOAN DETAILS PAGE — loan-details.js
   Reads loanId from URL params, fetches from DB,
   and populates all detail sections including
   eligibility: min_salary, credit_score, employment_type
===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = '../auth/login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const loanId = params.get('loanId');

  console.log('Loan Details Page — loanId from URL:', loanId);

  if (!loanId || loanId === 'undefined' || loanId === 'null') {
    showError('No loan ID provided. Please go back and select a loan.');
    return;
  }

  loadLoanDetails(loanId);
});

async function loadLoanDetails(loanId) {
  const content = document.getElementById('ld-content');
  if (content) content.innerHTML = `
    <div class="ld-loading">
      <i class="ph ph-spinner" style="font-size:36px;animation:spin 1s linear infinite;color:var(--primary)"></i>
      <div>Loading loan details…</div>
    </div>`;

  try {
    const res  = await fetch(`../../backend/api/get-loan-product.php?loanId=${encodeURIComponent(loanId)}`);
    const text = await res.text();

    console.log('RAW loan-detail response:', text);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
    }

    const json = JSON.parse(text);

    if (json.status === 'success' && json.data) {
      renderLoanDetails(json.data);
    } else {
      showError(json.message || json.error || 'Loan product not found.');
    }
  } catch (err) {
    console.error('loadLoanDetails error:', err);
    showError('Failed to connect to server. Please ensure the backend is running.<br><small>' + err.message + '</small>');
  }
}

function renderLoanDetails(loan) {
  console.log('renderLoanDetails — received data:', JSON.stringify(loan, null, 2));

  // ── Safely resolve loan ID (MySQL id or MongoDB _id) ──
  const loanId = loan._id || loan.id || loan.loan_id || '';

  // ── Format all fields with safe fallbacks ──
  const maxFmt    = loan.max_amount  ? '₹' + formatAmount(loan.max_amount)  : '—';
  const minFmt    = loan.min_amount  ? '₹' + formatAmount(loan.min_amount)  : '—';
  const tenureFmt = loan.tenure      ? formatTenure(loan.tenure)             : '—';
  const feeFmt    = loan.processing_fee
                      ? loan.processing_fee + '% of loan amount'
                      : '—';

  // ── Eligibility fields — pulled directly from DB ──
  const salaryFmt = loan.min_salary
                      ? '₹' + parseInt(loan.min_salary).toLocaleString('en-IN') + ' / month'
                      : 'Not specified';

  const creditFmt = loan.credit_score
                      ? loan.credit_score + '+'
                      : 'Not specified';

  const empFmt    = loan.employment_type
                      ? loan.employment_type
                      : 'Not specified';

  const logoSrc   = getBankLogo(loan.bank_name);

  // ── Documents list based on loan type ──
  const docs = getDocumentList(loan.loan_type);

  const content = document.getElementById('ld-content');
  if (!content) return;

  content.innerHTML = `
    <!-- Back link -->
    <a href="apply-loan.html" class="ld-back-link">
      <i class="ph ph-arrow-left"></i> Back to Loan Marketplace
    </a>

    <!-- Hero Section -->
    <div class="ld-hero">
      <div class="ld-hero-top">
        <div class="ld-bank-avatar">
          <img src="${logoSrc}" alt="${loan.bank_name}" class="bank-logo-img-lg"
            style="width:100%;height:100%;object-fit:contain;display:block"
            onerror="this.src='../assets/images/banks/default.png'">
        </div>
        <div class="ld-hero-text">
          <div class="ld-bank-name-hero">${loan.bank_name || '—'}</div>
          <div class="ld-loan-type-hero">${loan.loan_type || loan.loan_name || '—'}</div>
        </div>
        <div class="ld-rate-chip">
          <span>Interest Rate</span>
          ${loan.interest_rate ? loan.interest_rate + '% p.a.' : '—'}
        </div>
      </div>

      <div class="ld-stats-row">
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Min Amount</div>
          <div class="ld-stat-val">${minFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Max Amount</div>
          <div class="ld-stat-val">${maxFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Tenure</div>
          <div class="ld-stat-val">${tenureFmt}</div>
        </div>
        <div class="ld-stat-item">
          <div class="ld-stat-lbl">Processing Fee</div>
          <div class="ld-stat-val">${loan.processing_fee ? loan.processing_fee + '%' : '—'}</div>
        </div>
      </div>
    </div>

    <!-- 2-col grid: Loan Info + Eligibility -->
    <div class="ld-content-grid">

      <!-- Loan Information -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-info"></i>
          Loan Information
        </div>
        <div class="ld-info-grid">
          <div class="ld-info-item">
            <div class="ld-info-label">Bank Name</div>
            <div class="ld-info-val">${loan.bank_name || '—'}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Loan Type</div>
            <div class="ld-info-val">${loan.loan_type || loan.loan_name || '—'}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Interest Rate</div>
            <div class="ld-info-val" style="color:var(--primary)">
              ${loan.interest_rate ? loan.interest_rate + '% p.a.' : '—'}
            </div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Processing Fee</div>
            <div class="ld-info-val">${feeFmt}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Minimum Amount</div>
            <div class="ld-info-val">${minFmt}</div>
          </div>
          <div class="ld-info-item">
            <div class="ld-info-label">Maximum Amount</div>
            <div class="ld-info-val">${maxFmt}</div>
          </div>
          <div class="ld-info-item" style="grid-column:1/-1">
            <div class="ld-info-label">Loan Tenure</div>
            <div class="ld-info-val">${tenureFmt}</div>
          </div>
        </div>
      </div>

      <!-- Eligibility Criteria — auto-populated from DB -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-check-circle"></i>
          Eligibility Criteria
        </div>

        <div class="ld-elig-row">
          <span class="ld-elig-label">
            <i class="ph ph-money" style="color:var(--primary);margin-right:6px"></i>
            Minimum Monthly Salary
          </span>
          <span class="ld-elig-val ${loan.min_salary ? 'ld-elig-filled' : 'ld-elig-empty'}">
            ${salaryFmt}
          </span>
        </div>

        <div class="ld-elig-row">
          <span class="ld-elig-label">
            <i class="ph ph-chart-bar" style="color:var(--primary);margin-right:6px"></i>
            Minimum Credit Score
          </span>
          <span class="ld-elig-val ${loan.credit_score ? 'ld-elig-filled' : 'ld-elig-empty'}">
            ${creditFmt}
          </span>
        </div>

        <div class="ld-elig-row">
          <span class="ld-elig-label">
            <i class="ph ph-briefcase" style="color:var(--primary);margin-right:6px"></i>
            Employment Type
          </span>
          <span class="ld-elig-val ${loan.employment_type ? 'ld-elig-filled' : 'ld-elig-empty'}">
            ${empFmt}
          </span>
        </div>

        <div class="ld-elig-row">
          <span class="ld-elig-label">
            <i class="ph ph-calendar" style="color:var(--primary);margin-right:6px"></i>
            Age Requirement
          </span>
          <span class="ld-elig-val ld-elig-filled">21 – 60 years</span>
        </div>

        <div class="ld-elig-row">
          <span class="ld-elig-label">
            <i class="ph ph-flag" style="color:var(--primary);margin-right:6px"></i>
            Indian Citizen
          </span>
          <span class="ld-elig-val ld-elig-filled">Required</span>
        </div>
      </div>
    </div>

    <!-- 2-col grid: Documents + Benefits -->
    <div class="ld-content-grid ld-section-full">

      <!-- Required Documents -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-file-text"></i>
          Required Documents
        </div>
        <ul class="ld-check-list">
          ${docs.map(d => `<li class="ld-check-item">${d}</li>`).join('')}
        </ul>
      </div>

      <!-- Loan Benefits -->
      <div class="ld-section">
        <div class="ld-section-title">
          <i class="ph ph-star"></i>
          Loan Benefits
        </div>
        <ul class="ld-check-list">
          <li class="ld-check-item">Quick approval within 24–48 hours</li>
          <li class="ld-check-item">Flexible repayment options — monthly or quarterly</li>
          <li class="ld-check-item">Competitive interest rates benchmarked to MCLR</li>
          <li class="ld-check-item">No prepayment penalty after 6 months</li>
          <li class="ld-check-item">Digital disbursement — funds transferred directly to your account</li>
          <li class="ld-check-item">Dedicated relationship manager for loan guidance</li>
        </ul>
      </div>
    </div>

    <!-- Apply Bar -->
    <div class="ld-apply-bar">
      <div class="ld-apply-text">
        <strong>Ready to apply for this loan?</strong>
        <span>Complete your application in a few simple steps.</span>
      </div>
      <button class="btn btn-primary ld-apply-btn"
        onclick="window.location.href='loan-application.html?loanId=${loanId}'">
        Apply for Loan <i class="ph ph-arrow-right"></i>
      </button>
    </div>
  `;

  // Update page title
  document.title = `${loan.loan_type || loan.loan_name || 'Loan'} – ${loan.bank_name || 'Details'} | LoanPro`;
}

/* ── Helper: show error state ── */
function showError(msg) {
  const content = document.getElementById('ld-content');
  if (!content) return;
  content.innerHTML = `
    <div class="ld-loading" style="flex-direction:column;gap:16px">
      <i class="ph ph-warning-circle" style="font-size:44px;color:#DC2626"></i>
      <div style="font-weight:700;color:var(--text1);font-size:16px">Something went wrong</div>
      <div style="color:var(--text2);font-size:13px;text-align:center">${msg}</div>
      <a href="apply-loan.html" class="btn btn-primary" style="margin-top:8px">← Back to Loans</a>
    </div>`;
}

/* ── Helper: format amount in Indian notation ── */
function formatAmount(amount) {
  if (!amount) return '—';
  if (amount >= 10000000) return (amount / 10000000).toFixed(1) + ' Cr';
  if (amount >= 100000)   return (amount / 100000).toFixed(0) + ' L';
  return parseInt(amount).toLocaleString('en-IN');
}

/* ── Helper: format tenure in months → human readable ── */
function formatTenure(months) {
  if (!months) return '—';
  if (months < 12) return months + ' months';
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  return mo ? `${yrs} yr ${mo} mo` : `${yrs} years`;
}

/* ── Helper: documents list by loan type ── */
function getDocumentList(loanType) {
  const common = [
    'Identity Proof — Aadhaar Card / Passport / Voter ID',
    'Address Proof — Utility Bill / Rental Agreement',
    'Income Proof — Last 3 months salary slips',
    'Bank Statements — Last 6 months',
    'PAN Card — Mandatory for all applicants',
    'Passport size photographs — 2 copies',
  ];
  const extra = {
    'Home Loan':      ['Property Documents — Sale Deed / NOC', 'Approved Building Plan', 'Encumbrance Certificate'],
    'Car Loan':       ['Vehicle Quotation from Dealer', 'Driving Licence', 'Insurance Details'],
    'Education Loan': ['Admission Letter from Institution', 'Fee Structure / Prospectus', 'Academic Certificates'],
    'Business Loan':  ['Business Registration Certificate', 'GST Returns — Last 2 years', 'Profit & Loss Statement'],
    'Personal Loan':  ['Latest Form 16 / ITR', 'Employment ID Card'],
  };
  return [...common, ...(extra[loanType] || [])];
}

/* ── Helper: bank logo path ── */
function getBankLogo(bankName) {
  if (!bankName) return '../assets/images/banks/default.png';
  const map = {
    'HDFC Bank':            'HDFC',
    'State Bank of India':  'SBI',
    'ICICI Bank':           'ICICI',
    'Axis Bank':            'AXIS',
    'Kotak Mahindra Bank':  'KOTAK',
    'Canara Bank':          'CANARA',
    'IndusInd Bank':        'INDUSLAND',
    'Punjab National Bank': 'PUNJABNATIONALBANK',
    'Bank of Baroda':       'BANKOFBARODA',
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}