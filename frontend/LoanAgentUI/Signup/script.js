/* ═══════════════════════════════════════
   LoanPro Agent Sign Up — script.js
   Connected to backend loanagent-register.php
═══════════════════════════════════════ */

// Auto-detect API base from current path
const API_BASE = (() => {
  const p = window.location.pathname;
  const m = p.match(/^(.*?\/Web_Dealers)\//);
  return m ? `${m[1]}/backend/api` : '../../../backend/api';
})();

/* ─── Toggle password visibility ─── */
function togglePass(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type       = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type       = 'password';
    icon.textContent = 'visibility';
  }
}

/* ─── Live password strength checker ─── */
function checkStrength(val) {
  const fill = document.getElementById('strFill');
  const lbl  = document.getElementById('strLbl');
  let score = 0;
  if (val.length >= 8)            score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: '0%',   color: '#e8f8f6', label: '' },
    { pct: '25%',  color: '#ef4444', label: 'Weak' },
    { pct: '50%',  color: '#f97316', label: 'Fair' },
    { pct: '75%',  color: '#eab308', label: 'Good' },
    { pct: '100%', color: '#10b981', label: 'Strong ✓' },
  ];
  const level = val.length === 0 ? levels[0] : (levels[score] || levels[1]);
  fill.style.width      = level.pct;
  fill.style.background = level.color;
  lbl.textContent       = level.label;
  lbl.style.color       = level.color;
}

/* ─── Validate email ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ─── Show error ─── */
function showError(message) {
  clearMessages();
  const err = document.createElement('p');
  err.className = 'form-error';
  err.style.cssText = 'color:#ef4444;font-size:13px;font-weight:600;margin-top:-8px;margin-bottom:14px;display:flex;align-items:center;gap:6px;';
  err.innerHTML = `<span class="material-icons-round" style="font-size:16px">error_outline</span>${message}`;
  const btn = document.querySelector('.btn-submit');
  btn.parentNode.insertBefore(err, btn);
  setTimeout(() => err.remove(), 5000);
}

/* ─── Show success ─── */
function showSuccess(message) {
  clearMessages();
  const msg = document.createElement('p');
  msg.className = 'form-success';
  msg.style.cssText = 'color:#10b981;font-size:13px;font-weight:600;margin-top:-8px;margin-bottom:14px;display:flex;align-items:center;gap:6px;';
  msg.innerHTML = `<span class="material-icons-round" style="font-size:16px">check_circle</span>${message}`;
  const btn = document.querySelector('.btn-submit');
  btn.parentNode.insertBefore(msg, btn);
}

/* ─── Clear messages ─── */
function clearMessages() {
  document.querySelectorAll('.form-error, .form-success').forEach(el => el.remove());
}

/* ─── Set button loading state ─── */
function setLoading(loading) {
  const btn = document.querySelector('.btn-submit');
  if (loading) {
    btn.disabled      = true;
    btn.innerHTML     = '<span class="material-icons-round" style="animation:spin 1s linear infinite">sync</span> Creating account…';
    btn.style.opacity = '0.75';
  } else {
    btn.disabled      = false;
    btn.innerHTML     = '<span class="material-icons-round">how_to_reg</span> Create Account';
    btn.style.opacity = '1';
  }
}

/* ─── Main sign-up handler ─── */
async function handleSignUp() {
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const role     = document.getElementById('role').value;
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;
  const terms    = document.getElementById('terms').checked;

  clearMessages();

  // Client-side validations
  if (!fname || !lname || !email || !phone || !role || !password || !confirm) {
    showError('Please fill in all fields.');
    return;
  }
  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    showError('Phone number must be exactly 10 digits.');
    return;
  }
  if (password.length < 8) {
    showError('Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    showError('Passwords do not match.');
    return;
  }
  if (!terms) {
    showError('Please accept the Terms of Service to continue.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/loanagent-register.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        firstname: fname,
        lastname:  lname,
        email,
        phone,
        role,
        password
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      showSuccess('Account created! Redirecting to sign in…');
      setTimeout(() => {
        window.location.href = '../Login/index.html';
      }, 1500);
    } else {
      setLoading(false);
      showError(result.message || 'Registration failed. Please try again.');
    }
  } catch (err) {
    setLoading(false);
    showError('Unable to connect to the server. Please try again.');
    console.error('Signup error:', err);
  }
}

/* ─── Spin keyframe for loading ─── */
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }';
document.head.appendChild(spinStyle);