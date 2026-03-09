function togglePw(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markError('email');
    valid = false;
  }
  if (!password) {
    markError('password');
    valid = false;
  }
  if (!valid) return;

  // show success overlay
  document.getElementById('successOverlay').classList.add('show');

  // Simulate login
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', email);

  setTimeout(() => {
    window.location.href = '../dashboard/dashboard.html';
  }, 2000);
}

function markError(id) {
  const el = document.getElementById(id);
  el.classList.add('error');
  el.classList.remove('valid');
  el.closest('.field').classList.add('has-error');
}
