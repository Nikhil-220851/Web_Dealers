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
    const res  = await fetch(`${API_BASE}/loanagent-auth-check.php`);
    const data = await res.json();

    if (!data.loggedIn) {
      // Clear stale localStorage and redirect to login
      localStorage.removeItem('agent');
      window.location.href = '../Login/index.html';
      return null;
    }

    // Sync localStorage with fresh session data
    localStorage.setItem('agent', JSON.stringify(data.agent));

    if (data.agent.role !== 'loan_agent') {
        window.location.href = '../Login/index.html';
        return null;
    }

    return data.agent;
  } catch (err) {
    // If server unreachable, fall back to localStorage check
    const stored = localStorage.getItem('agent');
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

  const displayName = agent.name || `${agent.firstname || ''} ${agent.lastname || ''}`.trim() || 'Loan Agent';
  const roleLabels  = {
    super:   'Super Agent',
    loan:    'Loan Manager',
    support: 'Support Agent',
    finance: 'Finance Agent',
    admin:   'Loan Agent'
  };
  const roleLabel = roleLabels[agent.role] || agent.role || 'Loan Agent';

  if (nameEl)    nameEl.textContent    = displayName;
  if (roleEl)    roleEl.textContent    = roleLabel;
  if (avatarEl)  avatarEl.textContent  = displayName.charAt(0).toUpperCase();
  if (headingEl) headingEl.textContent = displayName;
}

/* ─── Logout ─── */
async function logout() {
  try {
    await fetch(`${API_BASE}/loanagent-logout.php`);
  } catch (e) { /* ignore network errors on logout */ }
  localStorage.removeItem('agent');
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
  const agent = await checkAuth();
  if (agent) {
    populateAgentInfo(agent);
  }
});
