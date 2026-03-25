/* ═══════════════════════════════════════
   LoanPro Agent — settings.js
   Enhanced Profile Management (Simplified)
═══════════════════════════════════════ */

// ── Elements ──
const settingsForm    = document.getElementById('settingsForm');
const btnUpdate       = document.getElementById('btnUpdateProfile');

const profileFields = {
  firstname:   document.getElementById('firstName'),
  lastname:    document.getElementById('lastName'),
  email:       document.getElementById('profileEmail'),
  phone:       document.getElementById('phone'),
  currentPass: document.getElementById('currentPassword'),
  newPass:     document.getElementById('newPassword'),
  confirmPass: document.getElementById('confirmPassword')
};

// ── Toast System ──
function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-custom ${isError ? 'error' : ''}`;
  toast.innerHTML = `
    <span class="material-icons-round toast-icon">${isError ? 'error' : 'check_circle'}</span>
    <div class="toast-content">${message}</div>
  `;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Fetch Profile ──
async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/loanagent-profile.php`);
    const result = await res.json();

    if (result.status === 'success') {
      const d = result.data;
      
      // Inputs
      profileFields.firstname.value = d.firstname || '';
      profileFields.lastname.value  = d.lastname  || '';
      profileFields.email.value     = d.email     || '';
      profileFields.phone.value     = d.phone     || '';

    } else {
      showToast('Error loading profile: ' + result.message, true);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
    showToast('Failed to connect to server', true);
  }
}

// ── Submit Update ──
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const firstNameValue = profileFields.firstname.value.trim();
  const lastNameValue  = profileFields.lastname.value.trim();
  const currentPass    = profileFields.currentPass.value;
  const newPass        = profileFields.newPass.value;
  const confirmPass    = profileFields.confirmPass.value;

  // Validation
  if (newPass && newPass.length < 6) {
    return showToast('New password must be at least 6 characters', true);
  }
  if (newPass !== confirmPass) {
    return showToast('Passwords do not match', true);
  }
  if (newPass && !currentPass) {
    return showToast('Current password is required to change password', true);
  }

  // Prep Payload (JSON)
  const payload = {
    first_name: firstNameValue,
    last_name:  lastNameValue,
    phone:      profileFields.phone.value.trim(),
    current_password: currentPass,
    new_password:     newPass
  };

  try {
    btnUpdate.disabled = true;
    btnUpdate.textContent = 'Updating...';

    const res = await fetch(`${API_BASE}/loanagent-update-profile.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === 'success') {
      showToast('Profile updated successfully!');
      
      // Clear password fields
      profileFields.currentPass.value = '';
      profileFields.newPass.value     = '';
      profileFields.confirmPass.value = '';
      
      // Refresh navbar info from common.js
      const updatedAgent = await checkAuth();
      if (updatedAgent) populateAgentInfo(updatedAgent);

    } else {
      showToast(result.message || 'Update failed', true);
    }
  } catch (err) {
    showToast('Network error during update', true);
  } finally {
    btnUpdate.disabled = false;
    btnUpdate.textContent = 'Update Profile';
  }
});

// ── Init ──
document.addEventListener('DOMContentLoaded', loadProfile);
