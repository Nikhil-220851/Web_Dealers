/* ═══════════════════════════════════════
   LoanPro Agent — admin-common.js
   Shared functions for Sidebar, Auth, and Header
═══════════════════════════════════════ */

// Auto-detect API base: works for XAMPP (LMS_Web) and any deployment
const API_BASE = (() => {
  const p = window.location.pathname;
  const m = p.match(/^(.*?\/Web_Dealers)\//);
  return m ? `${m[1]}/backend/api` : '../../../backend/api';
})();

/* ─── Auth Guard ─── */
async function checkAuth() {
  try {
    const res  = await fetch(`${API_BASE}/emp-auth-check.php`);
    const data = await res.json();

    if (!data.loggedIn) {
      // Clear stale localStorage and redirect to login
      localStorage.removeItem('employee');
      window.location.href = '../Login/index.html';
      return null;
    }

    // Sync localStorage with fresh session data
    localStorage.setItem('employee', JSON.stringify(data.employee));

    if (data.employee.role !== 'bank_employee') {
        window.location.href = '../Login/index.html';
        return null;
    }

    return data.employee;
  } catch (err) {
    // If server unreachable, fall back to localStorage check
    const stored = localStorage.getItem('employee');
    if (!stored) {
      window.location.href = '../Login/index.html';
      return null;
    }
    return JSON.parse(stored);
  }
}

/* ─── Populate agent info in navbar ─── */
function populateAgentInfo(agent) {
  const nameEl    = document.getElementById('agentName');
  const roleEl    = document.getElementById('agentRole');
  const avatarEl  = document.getElementById('agentAvatar');
  const headingEl = document.getElementById('headingName'); // In pages with greeting

  if (!agent) return;

  const displayName = agent.name || `${agent.firstname || ''} ${agent.lastname || ''}`.trim() || 'Bank Employee';
  const roleLabels  = {
    super:   'Super Agent',
    loan:    'Loan Manager',
    support: 'Support Agent',
    finance: 'Finance Agent',
    admin:   'Bank Employee'
  };
  const roleLabel = roleLabels[agent.role] || agent.role || 'Bank Employee';

  if (nameEl)    nameEl.textContent    = displayName;
  if (roleEl)    roleEl.textContent    = roleLabel;
  if (avatarEl)  avatarEl.textContent  = displayName.charAt(0).toUpperCase();
  if (headingEl) headingEl.textContent = displayName;
}

/* ─── Logout ─── */
async function logout() {
  try {
    await fetch(`${API_BASE}/emp-logout.php`);
  } catch (e) { /* ignore network errors on logout */ }
  localStorage.removeItem('employee');
  window.location.href = '../Login/index.html';
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
  const agent = await checkAuth();
  if (agent) {
    populateAgentInfo(agent);
  }
  
  // Dynamic active sidebar link
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  const activeLink = document.querySelector(`.sidebar-nav a[href="${path}"]`);
  if (activeLink) activeLink.classList.add('nav-active');
});
