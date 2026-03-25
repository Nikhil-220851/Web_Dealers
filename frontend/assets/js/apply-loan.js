document.addEventListener('DOMContentLoaded', () => {
  // Wire amount slider display
  const amtSlider  = document.getElementById('filter-amount');
  const amtDisplay = document.getElementById('filter-amt-display');
  if (amtSlider && amtDisplay) {
    amtSlider.addEventListener('input', () => {
      amtDisplay.textContent = '₹' + parseInt(amtSlider.value).toLocaleString('en-IN');
    });
  }

  // Wire search button
  const searchBtn = document.getElementById('btn-search-loans');
  if (searchBtn) searchBtn.addEventListener('click', fetchLoans);

  // Load on page open
  fetchLoans();
});

async function fetchLoans() {
  const grid = document.getElementById('loanCardsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text2)">
      <i class="ph ph-spinner" style="font-size:28px;animation:spin 1s linear infinite"></i><br><br>
      Loading loan offers…
    </div>`;

  try {
    const loanType = document.getElementById('filter-loan-type')?.value || 'All Types';
    const bankName = document.getElementById('filter-bank')?.value    || 'All Banks';

    const params = new URLSearchParams({ loanType, bankName });
    const res    = await fetch('../../backend/api/get-loan-products.php?' + params);

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}. Response: ${text.substring(0, 200)}`);
    }

    const json = JSON.parse(text);

    if (json.status === 'success' || json.success) {
      renderLoanCards(json.data || []);
    } else {
      throw new Error(json.message || json.error || 'API failed to return data');
    }
  } catch (err) {
    console.error('API ERROR:', err);
    document.getElementById('loanCardsGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:red">
        <i class="ph ph-warning-circle" style="font-size:32px;display:block;margin-bottom:12px"></i>
        <strong>Failed to load loan schemes</strong><br>
        <p style="margin-top:10px;font-size:14px;color:#555">${err.message || 'An unexpected error occurred.'}</p>
      </div>`;
  }
}

function renderLoanCards(loans) {
  const grid = document.getElementById('loanCardsGrid');
  if (!loans || loans.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;border:1px dashed var(--border);border-radius:12px">
        <i class="ph ph-magnifying-glass" style="font-size:40px;color:var(--text3);display:block;margin-bottom:12px"></i>
        <h3 style="color:var(--text1);margin-bottom:8px">No loans found</h3>
        <p style="color:var(--text2);font-size:14px">Try changing the filters to see more results.</p>
      </div>`;
    return;
  }

  grid.innerHTML = loans.map(loan => {

    // ── Safely resolve the loan ID (handles both MySQL `id` and MongoDB `_id`) ──
    const loanId = loan._id || loan.id || loan.loan_id || '';
    console.log('Loan ID resolved:', loanId, '| Keys:', Object.keys(loan));

    if (!loanId) {
      console.warn('Loan has no ID, skipping card:', loan);
      return '';
    }

    const loanTitle = loan.loan_name || loan.loan_type || 'Loan Product';
    const maxLakhs  = ((loan.max_amount || 0) / 100000).toFixed(0);
    const tenureYrs = loan.tenure
      ? (loan.tenure >= 12 ? Math.round(loan.tenure / 12) + ' Yrs' : loan.tenure + ' Mo')
      : '—';

    let badge = '';
    if (loan.interest_rate <= 8.5)   badge = '<span class="loan-card-badge badge-low">Low Rate</span>';
    else if (loan.max_amount >= 5e6) badge = '<span class="loan-card-badge badge-high">High Value</span>';

    const logoSrc = getBankLogo(loan.bank_name);

    return `
    <div class="loan-card">
      <div class="loan-card-header">
        <div class="loan-card-bank-avatar" style="overflow:hidden">
          <img src="${logoSrc}" alt="${loan.bank_name}" class="bank-logo-img"
            style="width:100%;height:100%;object-fit:contain;display:block"
            onerror="this.src='../assets/images/banks/default.png'">
        </div>
        <div class="loan-card-info">
          <div class="loan-card-bank-name">${loan.bank_name}</div>
          <div class="loan-card-type">${loanTitle}</div>
        </div>
        ${badge}
      </div>

      <div class="loan-card-stats">
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Interest Rate</div>
          <div class="loan-card-stat-value text-primary">${loan.interest_rate}% p.a.</div>
        </div>
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Max Amount</div>
          <div class="loan-card-stat-value">₹${maxLakhs}L</div>
        </div>
        <div class="loan-card-stat">
          <div class="loan-card-stat-label">Tenure</div>
          <div class="loan-card-stat-value">${tenureYrs}</div>
        </div>
      </div>

      <button class="btn btn-primary w-full loan-card-btn"
        onclick="window.location.href='loan-details.html?loanId=${loanId}'">
        See More <i class="ph ph-arrow-right"></i>
      </button>
    </div>`;
  }).join('');
}

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

async function checkProfileBeforeLoan() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '../auth/login.html';
    return false;
  }
  const res  = await fetch(`../../backend/api/check-profile-complete.php?userId=${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!data.complete) {
    const missing = data.missing.join(', ');
    const go = confirm(
      `⚠️ Your profile is incomplete.\n\nMissing: ${missing}\n\n` +
      `You must complete your profile before applying for a loan.\n\nGo to Profile now?`
    );
    if (go) window.location.href = 'profile.html';
    return false;
  }
  return true;
}

window.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = '../auth/login.html';
    return;
  }
  const allowed = await checkProfileBeforeLoan();
  if (!allowed) {
    document.querySelector('.apply-form-container')?.style.setProperty('display', 'none');
  }
});