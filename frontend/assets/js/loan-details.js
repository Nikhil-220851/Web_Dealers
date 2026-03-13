/* =====================================================
   LOAN DETAILS PAGE — loan-details.js
   Reads loanId from URL params, fetches from DB,
   and populates all detail sections.
===================================================== */

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
  const maxFmt  = '₹' + formatAmount(loan.max_amount);
  const minFmt  = '₹' + formatAmount(loan.min_amount);
  const tenureFmt = loan.tenure ? formatTenure(loan.tenure) : '—';
  const salaryFmt = loan.min_salary ? '₹' + parseInt(loan.min_salary).toLocaleString('en-IN') + '/mo' : '—';
  const creditFmt = loan.credit_score ? loan.credit_score + '+' : '—';
  const empFmt    = loan.employment_type || '—';
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
          <img src="${logoSrc}" alt="${loan.bank_name}" class="bank-logo-large" onerror="this.style.display='none';this.parentElement.textContent='${initials}'">
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
  };
  const key = map[bankName] || bankName.split(' ')[0].toUpperCase();
  return `../assets/images/banks/${key}.png`;
}
