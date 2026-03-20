/* ═══════════════════════════════════════
   LoanPro Admin — admin-common.js
   Shared functions for Sidebar, Auth, and Header
═══════════════════════════════════════ */

// const API_BASE = '/LMS_Web/Web_Dealers/backend/api';
const API_BASE = '/loan/Loan_Management_System/backend/api';

/* ─── Auth Guard ─── */
async function checkAuth() {
  try {
    const res  = await fetch(`${API_BASE}/admin-auth-check.php`);
    const data = await res.json();

    if (!data.loggedIn) {
      // Clear stale localStorage and redirect to login
      localStorage.removeItem('admin');
      window.location.href = '../Login/index.html';
      return null;
    }

    // Sync localStorage with fresh session data
    localStorage.setItem('admin', JSON.stringify(data.admin));
    return data.admin;
  } catch (err) {
    // If server unreachable, fall back to localStorage check
    const stored = localStorage.getItem('admin');
    if (!stored) {
      window.location.href = '../Login/index.html';
      return null;
    }
    return JSON.parse(stored);
  }
}

/* ─── Populate admin info in navbar ─── */
function populateAdminInfo(admin) {
  const nameEl    = document.getElementById('adminName');
  const roleEl    = document.getElementById('adminRole');
  const avatarEl  = document.getElementById('adminAvatar');
  const headingEl = document.getElementById('headingName'); // In pages with greeting

  if (!admin) return;

  const displayName = admin.name || `${admin.firstname || ''} ${admin.lastname || ''}`.trim() || 'Admin';
  const roleLabels  = {
    super:   'Super Admin',
    loan:    'Loan Manager',
    support: 'Support Admin',
    finance: 'Finance Admin',
    admin:   'Admin'
  };
  const roleLabel = roleLabels[admin.role] || admin.role || 'Admin';

  if (nameEl)    nameEl.textContent    = displayName;
  if (roleEl)    roleEl.textContent    = roleLabel;
  if (avatarEl)  avatarEl.textContent  = displayName.charAt(0).toUpperCase();
  if (headingEl) headingEl.textContent = displayName;
}

/* ─── Logout ─── */
async function logout() {
  try {
    await fetch(`${API_BASE}/admin-logout.php`);
  } catch (e) { /* ignore network errors on logout */ }
  localStorage.removeItem('admin');
  window.location.href = '../Landing/index.html';
}

/* ─── Sidebar ─── */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

/* ─── Auto Init for Common Elements ─── */
document.addEventListener('DOMContentLoaded', async () => {
  const admin = await checkAuth();
  if (admin) {
    populateAdminInfo(admin);
  }
});
