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
      localStorage.setItem('phoneno',    result.user.phoneno || '');

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
}


function signinwithgoogle() {

   if (!firebaseReady) {
    alert("Please wait a moment and try again.");
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
  .then(async (result) => {
    const user = result.user;

    const userData = {
      name:  user.displayName,
      email: user.email,
      photo: user.photoURL
    };

    // Send to backend — now receives userId back
    const response = await fetch("../../backend/api/google-login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const json = await response.json();

    if (json.status === 'success') {
      // Save everything including userId — profile.js needs this
      localStorage.setItem("isLoggedIn",  "true");
      localStorage.setItem("userId",      json.userId);       // ← KEY FIX
      localStorage.setItem("userEmail",   json.email);
      localStorage.setItem("userName",    user.displayName);
      localStorage.setItem("firstname",   json.firstname);
      localStorage.setItem("lastname",    json.lastname);
      localStorage.setItem("userPhoto",   json.photo || user.photoURL);

      window.location.href = "../dashboard/dashboard.html";
    } else {
      alert("Login failed: " + (json.message || "Unknown error"));
    }
  })
  .catch((error) => {
    console.error("Google sign-in error:", error);
    alert("Google sign-in failed. Please try again.");
  });
}

  
