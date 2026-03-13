/* ═══════════════════════════════════════════════
   PROFILE PAGE — Dynamic Data Loader
   Pulls real user data from localStorage (set at login)
   and fetches bank/KYC details from the backend API.
═══════════════════════════════════════════════ */

const API_BASE = '../../backend/api';

// ── Module-level data store (replaces hardcoded KYC_DATA) ──
let profileData = {
  userId:    '',
  firstname: '',
  lastname:  '',
  email:     '',
  phoneno:   '',
  createdAt: '',
};
let bankData = null;
let kycData  = null;

/* ── Utility: get a user-friendly "Member since" string ── */
function formatMemberSince(isoDate) {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch { return ''; }
}

/* ── Utility: derive avatar initial from name ── */
function getInitial(firstname, lastname) {
  const fn = (firstname || '').trim();
  const ln = (lastname  || '').trim();
  if (fn) return fn[0].toUpperCase();
  if (ln) return ln[0].toUpperCase();
  return '?';
}

/* ════════════════════════════════════════════════
   1. LOAD PROFILE — called on DOMContentLoaded
════════════════════════════════════════════════ */
async function loadProfilePage() {
  // Step 1: read identity from localStorage (set during login)
  const userId    = localStorage.getItem('userId')    || '';
  const firstname = localStorage.getItem('firstname') || '';
  const lastname  = localStorage.getItem('lastname')  || '';
  const email     = localStorage.getItem('userEmail') || '';
  const phoneno   = localStorage.getItem('phoneno')   || '';

  if (!userId) {
    window.location.href = '../auth/login.html';
    return;
  }

  // Save to module store
  profileData = { userId, firstname, lastname, email, phoneno, createdAt: '' };

  // Step 2: immediately populate basic fields from localStorage (no wait)
  populateBasicFields();

  // Step 3: fetch full profile (user + bank + KYC) from backend
  try {
    const res  = await fetch(`${API_BASE}/get-profile.php?userId=${encodeURIComponent(userId)}`);
    const json = await res.json();

    if (json.status === 'success') {
      // Update createdAt from server
      profileData.createdAt = json.user.createdAt || '';
      // Refresh any server-sourced fields
      if (json.user.firstname) profileData.firstname = json.user.firstname;
      if (json.user.lastname)  profileData.lastname  = json.user.lastname;
      if (json.user.email)     profileData.email     = json.user.email;
      if (json.user.phoneno)   profileData.phoneno   = json.user.phoneno;

      bankData = json.bankDetails || null;
      kycData  = json.kycDetails  || null;

      // Re-populate (now with createdAt + server values)
      populateBasicFields();
      populateBankKycView();
    }
  } catch (err) {
    console.warn('Could not fetch profile from server. Showing localStorage data.', err);
    populateBankKycView(); // show "not added" states
  }

  calcCompletion();
}

/* ════════════════════════════════════════════════
   2. POPULATE BASIC FIELDS
════════════════════════════════════════════════ */
function populateBasicFields() {
  const { firstname, lastname, email, phoneno, createdAt } = profileData;
  const fullName = [firstname, lastname].filter(Boolean).join(' ') || 'User';
  const initial  = getInitial(firstname, lastname);

  // Sidebar chip
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar-letter');
  if (sidebarName)   sidebarName.textContent   = fullName;
  if (sidebarAvatar) sidebarAvatar.textContent  = initial;

  // Profile header row
  const profileName  = document.getElementById('profile-display-name');
  const profileEmail = document.getElementById('profile-display-email');
  const profileDate  = document.getElementById('profile-member-since');
  const profileBigAvatar = document.getElementById('profile-avatar-letter');

  if (profileName)      profileName.textContent  = fullName;
  if (profileEmail)     profileEmail.textContent = email;
  if (profileBigAvatar) profileBigAvatar.textContent = initial;
  if (profileDate && createdAt) {
    profileDate.textContent = 'Member since ' + formatMemberSince(createdAt);
  }

  // Form input fields
  setVal('prof-firstname', firstname);
  setVal('prof-lastname',  lastname);
  setVal('prof-phone',     phoneno);
  setVal('prof-email',     email);
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

/* ════════════════════════════════════════════════
   3. POPULATE BANK & KYC VIEW SECTION
════════════════════════════════════════════════ */
function populateBankKycView() {
  // ── Bank fields ──
  const noBankMsg = document.getElementById('no-bank-msg');
  const bankGrid  = document.getElementById('bank-view-grid');

  if (bankData) {
    if (noBankMsg) noBankMsg.style.display = 'none';
    if (bankGrid)  bankGrid.style.display  = '';
    setText('kyc-view-account',      bankData.accountNumber     || '—');
    setText('kyc-view-ifsc',         bankData.ifscCode          || '—');
    setText('kyc-view-bank',         bankData.bankName          || '—');
    setText('kyc-view-account-holder', bankData.accountHolderName || '—');
    setText('kyc-view-branch',       bankData.branchName        || '—');
  } else {
    if (noBankMsg) noBankMsg.style.display = '';
    if (bankGrid)  bankGrid.style.display  = 'none';
  }

  // ── KYC fields ──
  const noKycMsg = document.getElementById('no-kyc-msg');
  const kycGrid  = document.getElementById('kyc-view-grid');

  if (kycData) {
    if (noKycMsg) noKycMsg.style.display = 'none';
    if (kycGrid)  kycGrid.style.display  = '';
    setText('kyc-view-pan',     kycData.panNumber     || '—');
    setText('kyc-view-aadhaar', kycData.aadhaarNumber || '—');
    setText('kyc-view-dob',     kycData.dob           || '—');
    setText('kyc-view-address', kycData.address       || '—');
  } else {
    if (noKycMsg) noKycMsg.style.display = '';
    if (kycGrid)  kycGrid.style.display  = 'none';
  }

  // Keep other view cells that come from basic profile
  setText('kyc-view-fullname', [profileData.firstname, profileData.lastname].filter(Boolean).join(' ') || '—');
  setText('kyc-view-phone',    profileData.phoneno || '—');
  setText('kyc-view-email',    profileData.email   || '—');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ════════════════════════════════════════════════
   4. SAVE PROFILE SETTINGS
════════════════════════════════════════════════ */
async function saveProfileSettings(event) {
  updateKycFromProfile();

  // Update localStorage with latest values
  localStorage.setItem('firstname', document.getElementById('prof-firstname')?.value?.trim() || '');
  localStorage.setItem('lastname',  document.getElementById('prof-lastname')?.value?.trim()  || '');
  localStorage.setItem('phoneno',   document.getElementById('prof-phone')?.value?.trim()     || '');

  // Refresh display
  profileData.firstname = localStorage.getItem('firstname');
  profileData.lastname  = localStorage.getItem('lastname');
  profileData.phoneno   = localStorage.getItem('phoneno');
  
  // Refresh UI including sidebar/topbar
  populateBasicFields();
  if (typeof updateUserUI === 'function') updateUserUI();

  // Brief success flash
  const btn = event?.currentTarget;
  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '✓ Saved!';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  }
}

/* ════════════════════════════════════════════════
   5. KYC EDIT TOGGLE
════════════════════════════════════════════════ */
function toggleKycEdit() {
  const editMode = document.getElementById('kyc-edit-mode');
  const viewMode = document.getElementById('kyc-view-mode');
  const btn      = document.getElementById('kyc-edit-btn');

  // Prefill edit form from current data
  setVal('kyc-fullname',  [profileData.firstname, profileData.lastname].filter(Boolean).join(' '));
  setVal('kyc-dob',       kycData?.dob            || '');
  setVal('kyc-phone',     profileData.phoneno      || '');
  setVal('kyc-email',     profileData.email        || '');
  setVal('kyc-pan',       kycData?.panNumber       || '');
  setVal('kyc-aadhaar',   kycData?.aadhaarNumber   || '');
  setVal('kyc-account',   bankData?.accountNumber  || '');
  setVal('kyc-ifsc',      bankData?.ifscCode       || '');
  setVal('kyc-bankname',  bankData?.bankName       || '');
  setVal('kyc-account-holder', bankData?.accountHolderName || '');
  setVal('kyc-branch',    bankData?.branchName     || '');
  setVal('kyc-address',   kycData?.address         || '');

  editMode.style.display = 'block';
  viewMode.style.display = 'none';
  if (btn) btn.innerHTML = '';
}

function cancelKycEdit() {
  document.getElementById('kyc-edit-mode').style.display = 'none';
  document.getElementById('kyc-view-mode').style.display = 'block';
  const btn = document.getElementById('kyc-edit-btn');
  if (btn) btn.innerHTML = '<i class="ph ph-pencil-simple"></i> Edit';
}

/* ════════════════════════════════════════════════
   6. SAVE KYC + BANK DETAILS TO DATABASE
════════════════════════════════════════════════ */
async function saveKycDetails() {
  const userId = profileData.userId;
  if (!userId) {
    alert('Session expired. Please log in again.');
    window.location.href = '../auth/login.html';
    return;
  }

  const btn = document.querySelector('#kyc-edit-mode .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner"></i> Saving…'; }

  const saveBtn = btn;
  const restoreBtn = () => {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save KYC Details'; }
  };

  // ── Collect values ──
  const aadhaarVal    = document.getElementById('kyc-aadhaar')?.value.trim()       || '';
  const panVal        = document.getElementById('kyc-pan')?.value.trim().toUpperCase() || '';
  const dobVal        = document.getElementById('kyc-dob')?.value                  || '';
  const addressVal    = document.getElementById('kyc-address')?.value.trim()       || '';
  const accountNum    = document.getElementById('kyc-account')?.value.trim()       || '';
  const ifscVal       = document.getElementById('kyc-ifsc')?.value.trim().toUpperCase() || '';
  const bankNameVal   = document.getElementById('kyc-bankname')?.value.trim()      || '';
  const holderName    = document.getElementById('kyc-account-holder')?.value.trim() || '';
  const branchVal     = document.getElementById('kyc-branch')?.value.trim()        || '';

  let hasError = false;

  // ── Save KYC ──
  if (aadhaarVal || panVal || dobVal || addressVal) {
    try {
      const kycRes = await fetch(`${API_BASE}/save-kyc.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, aadhaarNumber: aadhaarVal, panNumber: panVal,
          dob: dobVal, address: addressVal,
        })
      });
      const kycJson = await kycRes.json();
      if (kycJson.status !== 'success') {
        alert('KYC error: ' + kycJson.message);
        hasError = true;
      } else {
        kycData = { aadhaarNumber: aadhaarVal, panNumber: panVal, dob: dobVal, address: addressVal };
      }
    } catch (e) {
      alert('Could not save KYC details. Check your connection.');
      hasError = true;
    }
  }

  // ── Save Bank Details ──
  if (!hasError && (accountNum || ifscVal || bankNameVal || holderName)) {
    try {
      const bankRes = await fetch(`${API_BASE}/save-bank-details.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, accountHolderName: holderName, accountNumber: accountNum,
          bankName: bankNameVal, ifscCode: ifscVal, branchName: branchVal,
        })
      });
      const bankJson = await bankRes.json();
      if (bankJson.status !== 'success') {
        alert('Bank error: ' + bankJson.message);
        hasError = true;
      } else {
        bankData = {
          accountHolderName: holderName, accountNumber: accountNum,
          bankName: bankNameVal, ifscCode: ifscVal, branchName: branchVal,
        };
      }
    } catch (e) {
      alert('Could not save bank details. Check your connection.');
      hasError = true;
    }
  }

  restoreBtn();

  if (!hasError) {
    populateBankKycView();
    cancelKycEdit();
    calcCompletion();

    // Flash success
    const successMsg = document.getElementById('kyc-save-success');
    if (successMsg) {
      successMsg.style.display = 'block';
      setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
    }
  }
}

/* ════════════════════════════════════════════════
   7. PROFILE COMPLETION CALCULATOR
════════════════════════════════════════════════ */
function calcCompletion() {
  const fields = [
    document.getElementById('prof-firstname')?.value?.trim(),
    document.getElementById('prof-lastname')?.value?.trim(),
    document.getElementById('prof-phone')?.value?.trim(),
    document.getElementById('prof-email')?.value?.trim(),
    document.getElementById('prof-address')?.value?.trim(),
    kycData?.dob,
    kycData?.panNumber,
    kycData?.aadhaarNumber,
    bankData?.accountNumber,
    bankData?.ifscCode,
  ];
  const filled = fields.filter(f => !!f && f.length > 0).length;
  const total  = fields.length;
  const pct    = Math.round((filled / total) * 100);

  const elFilled = document.getElementById('completion-filled');
  const elTotal  = document.getElementById('completion-total');
  const elPct    = document.getElementById('completion-pct');
  const elBar    = document.getElementById('completion-bar');

  if (elFilled) elFilled.textContent = filled;
  if (elTotal)  elTotal.textContent  = total;
  if (elPct)    elPct.textContent    = pct;
  if (elBar)    elBar.style.width    = pct + '%';

  const hintEl = document.querySelector('.completion-hint');
  if (hintEl) {
    hintEl.textContent = pct < 100
      ? `💡 ${total - filled} field${total - filled !== 1 ? 's' : ''} remaining to reach 100%`
      : '🎉 Your profile is 100% complete!';
  }
}

function updateKycFromProfile() {
  calcCompletion();
}

function syncKycCompletionLive() {
  calcCompletion();
}

/* ════════════════════════════════════════════════
   8. UI HELPERS
════════════════════════════════════════════════ */
function selectLang(el) {
  el.closest('.lang-grid').querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function selectTheme(el) {
  el.closest('.theme-grid').querySelectorAll('.theme-opt').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProfilePage);
} else {
  loadProfilePage();
}