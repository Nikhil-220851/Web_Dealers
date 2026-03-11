/* ═══════════════════════════════════════
   LoanPro Admin Sign In — script.js
═══════════════════════════════════════ */

/**
 * Toggle password visibility
 */
function togglePass() {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eyeIco');

  if (input.type === 'password') {
    input.type       = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type       = 'password';
    icon.textContent = 'visibility';
  }
}

/**
 * Handle sign-in form submission
 */
function handleSignIn() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showError('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  // On success → redirect to dashboard
  window.location.href = '../admin-dashboard/index.html';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Display a simple error message
 */
function showError(message) {
  // Remove any existing error
  const existing = document.querySelector('.form-error');
  if (existing) existing.remove();

  const err = document.createElement('p');
  err.className = 'form-error';
  err.style.cssText = 'color:#ef4444;font-size:13px;font-weight:700;margin-top:-10px;margin-bottom:16px;';
  err.textContent = message;

  const btn = document.querySelector('.btn-submit');
  btn.parentNode.insertBefore(err, btn);

  setTimeout(() => err.remove(), 4000);
}

/* Allow Enter key to submit */
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignIn();
  });
});