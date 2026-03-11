/* ═══════════════════════════════════════
   LoanPro Admin Sign Up — script.js
═══════════════════════════════════════ */

/**
 * Toggle password field visibility
 * @param {string} inputId  - ID of the password input
 * @param {string} iconId   - ID of the eye icon span
 */
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

/**
 * Live password strength checker
 * @param {string} val - Current password value
 */
function checkStrength(val) {
  const fill = document.getElementById('strFill');
  const lbl  = document.getElementById('strLbl');

  // Score 0–4
  let score = 0;
  if (val.length >= 8)             score++;
  if (/[A-Z]/.test(val))          score++;
  if (/[0-9]/.test(val))          score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  const levels = [
    { pct: '0%',   color: '#e8f8f6', label: '' },
    { pct: '25%',  color: '#ef4444', label: 'Weak' },
    { pct: '50%',  color: '#f97316', label: 'Fair' },
    { pct: '75%',  color: '#eab308', label: 'Good' },
    { pct: '100%', color: '#0d7c6e', label: 'Strong ✓' },
  ];

  const level = val.length === 0 ? levels[0] : (levels[score] || levels[1]);

  fill.style.width      = level.pct;
  fill.style.background = level.color;
  lbl.textContent       = level.label;
  lbl.style.color       = level.color;
}

/**
 * Handle sign-up form submission
 */
function handleSignUp() {
  const fname   = document.getElementById('fname').value.trim();
  const lname   = document.getElementById('lname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const role    = document.getElementById('role').value;
  const password= document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  const terms   = document.getElementById('terms').checked;

  // Clear previous errors
  clearErrors();

  if (!fname || !lname || !email || !phone || !role || !password || !confirm) {
    showError('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
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

  // On success → redirect to sign in
  window.location.href = '../admin-login/index.html';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Show inline error message
 */
function showError(message) {
  clearErrors();

  const err = document.createElement('p');
  err.className   = 'form-error';
  err.textContent = message;

  const btn = document.querySelector('.btn-submit');
  btn.parentNode.insertBefore(err, btn);

  setTimeout(() => err.remove(), 5000);
}

/**
 * Remove all error messages
 */
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.remove());
}