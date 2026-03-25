/* ═══════════════════════════════════════
   LoanPro Agent Sign In — script.js
   Connected to backend loanagent-login.php
═══════════════════════════════════════ */

// Auto-detect API base from current path
const API_BASE = (() => {
  const p = window.location.pathname;
  const m = p.match(/^(.*?\/Web_Dealers)\//);
  return m ? `${m[1]}/backend/api` : '../../../backend/api';
})();

/* ─── Toggle password visibility ─── */
function togglePass() {
  const input = document.getElementById('password');
  const icon = document.getElementById('eyeIco');
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility';
  }
}

/* ─── Validate email format ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ─── Show error message ─── */
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

/* ─── Show success message ─── */
function showSuccess(message) {
  clearMessages();
  const msg = document.createElement('p');
  msg.className = 'form-success';
  msg.style.cssText = 'color:#10b981;font-size:13px;font-weight:600;margin-top:-8px;margin-bottom:14px;display:flex;align-items:center;gap:6px;';
  msg.innerHTML = `<span class="material-icons-round" style="font-size:16px">check_circle</span>${message}`;
  const btn = document.querySelector('.btn-submit');
  btn.parentNode.insertBefore(msg, btn);
}

/* ─── Clear all messages ─── */
function clearMessages() {
  document.querySelectorAll('.form-error, .form-success').forEach(el => el.remove());
}

/* ─── Set button loading state ─── */
function setLoading(loading) {
  const btn = document.querySelector('.btn-submit');
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-round" style="animation:spin 1s linear infinite">sync</span> Signing in…';
    btn.style.opacity = '0.75';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-round">login</span> Sign In';
    btn.style.opacity = '1';
  }
}

/* ─── Main sign-in handler ─── */
async function handleSignIn() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  clearMessages();

  if (!email || !password) {
    showError('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/emp-login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.status === 'success') {
      // Store employee info in localStorage for dashboard use
      localStorage.setItem('employee', JSON.stringify(result.admin));
      showSuccess('Login successful! Redirecting…');
      setTimeout(() => {
        window.location.href = '../Dashboard/dashboard.html';
      }, 800);
    } else {
      setLoading(false);
      showError(result.message || 'Invalid credentials. Please try again.');
    }
  } catch (err) {
    setLoading(false);
    showError('Unable to connect to the server. Please try again.');
    console.error('Login error:', err);
  }
}

/* ─── Spin animation for loading icon ─── */
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }';
document.head.appendChild(spinStyle);

/* ─── Enter key support ─── */
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignIn();
  });

  // If already logged in, redirect to dashboard
  const admin = localStorage.getItem('employee');
  if (admin) {
    // Verify session is still valid
    fetch(`${API_BASE}/emp-auth-check.php`)
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn) {
          window.location.href = '../Dashboard/dashboard.html';
        }
      })
      .catch(() => { });
  }
});