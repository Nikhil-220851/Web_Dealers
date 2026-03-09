/* ── HELPERS ── */
function togglePw(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function goTo(page) {
  const map = { login: 'login.html', dashboard: '../dashboard/dashboard.html', documents: '#' };
  if (map[page]) window.location.href = map[page];
}

/* ── LIVE VALIDATION ── */
function liveValidate(input, type) {
  const field = input.closest('.field');
  let ok = false;
  if (type === 'name')    ok = input.value.trim().length > 0;
  if (type === 'email')   ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
  if (type === 'phone')   ok = /^\d{10}$/.test(input.value.trim());
  if (type === 'confirm') {
    ok = input.value === document.getElementById('password').value && input.value.length > 0;
    document.getElementById('confirmErr').textContent = ok ? '' : 'Passwords do not match.';
  }
  input.classList.toggle('valid', ok);
  input.classList.toggle('error', !ok && input.value.length > 0);
  field.classList.toggle('has-error', !ok && input.value.length > 0);
}

/* ── PASSWORD STRENGTH ── */
const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
const strengthTexts  = ['Weak', 'Fair', 'Good', 'Strong'];

function updateStrength(val) {
  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  for (let i = 1; i <= 4; i++) {
    const seg = document.getElementById('s' + i);
    seg.style.background = i <= score ? strengthColors[score - 1] : '#e5e7eb';
  }
  const lbl = document.getElementById('strengthLabel');
  lbl.textContent = val.length > 0 ? strengthTexts[score - 1] || '' : '';
  lbl.style.color  = val.length > 0 ? strengthColors[score - 1] : '';
}

/* ── SIGN UP ── */
async function handleSignUp() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const phone     = document.getElementById('phone').value.trim();
  const email     = document.getElementById('email').value.trim();
  const password  = document.getElementById('password').value;
  const confirm   = document.getElementById('confirmPassword').value;
  const terms     = document.getElementById('terms').checked;

  let valid = true;

  if (!firstName) {
    markError('firstName'); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markError('email'); valid = false;
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    markError('phone'); valid = false;
  }
  if (!password || password.length < 8) {
    markError('password'); valid = false;
  }
  if (password !== confirm) {
    markError('confirmPassword'); valid = false;
  }
  if (!terms) {
    alert('Please accept the Terms & Conditions to continue.'); return;
  }
  if (!valid) return;

  try {
    const response = await fetch('../../backend/api/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstname: firstName,
        lastname:  lastName,
        phoneno:   phone,
        email:     email,
        password:  password
      })
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      // Store basic info in localStorage for UI continuity
      localStorage.setItem('isLoggedIn', 'false'); // Not yet logged in — must log in next
      localStorage.setItem('userEmail',  email);
      localStorage.setItem('firstname',  firstName);

      // Mark step 1 complete, step 2 active
      document.getElementById('si-1').classList.remove('active');
      document.getElementById('si-1').classList.add('completed');
      document.getElementById('si-2').classList.add('active');

      // Show success overlay then redirect to login
      document.getElementById('successOverlay').classList.add('show');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      alert('❌ ' + (result.message || 'Registration failed. Please try again.'));
    }
  } catch (err) {
    console.error('Signup error:', err);
    alert('❌ Could not connect to the server. Please check your connection and try again.');
  }
}

function markError(id) {
  const el = document.getElementById(id);
  el.classList.add('error');
  el.classList.remove('valid');
  el.closest('.field').classList.add('has-error');
}
