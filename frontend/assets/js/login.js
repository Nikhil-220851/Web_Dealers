function togglePw(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

async function handleLogin() {
  const email    = document.getElementById('email').value.trim();
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

  try {
    const response = await fetch('../../backend/api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      // Store user session info in localStorage for frontend use
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail',  result.user.email);
      localStorage.setItem('firstname',  result.user.firstname);
      localStorage.setItem('lastname',   result.user.lastname);
      localStorage.setItem('userId',     result.user.id);

      // Show success overlay then redirect to dashboard
      document.getElementById('successOverlay').classList.add('show');
      setTimeout(() => {
        window.location.href = '../dashboard/dashboard.html';
      }, 2000);
    } else {
      alert('❌ ' + (result.message || 'Login failed. Please check your credentials.'));
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('❌ Could not connect to the server. Please check your connection and try again.');
  }
}

function markError(id) {
  const el = document.getElementById(id);
  el.classList.add('error');
  el.classList.remove('valid');
  el.closest('.field').classList.add('has-error');
}
