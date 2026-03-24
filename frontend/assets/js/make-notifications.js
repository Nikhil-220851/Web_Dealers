const fs = require('fs');

// 1. CREATE notifications.html
const dashHtml = fs.readFileSync('dashboard.html', 'utf8');

const notifContent = `
      <div class="page-body active">
        <div class="card" style="max-width: 800px; margin: 0 auto; min-height: 60vh;">
          <div class="card-title" style="flex-direction:row; display:flex; justify-content:space-between; align-items:center;">
             <span style="font-size: 18px">Your Notifications</span>
             <button class="btn btn-outline btn-sm" id="clear-all-notif">Clear All</button>
          </div>
          <div id="notifications-list" class="notif-list">
             <!-- Notifications injected via JS -->
          </div>
        </div>
      </div>
`;

const blocks = dashHtml.split('<!-- DASHBOARD CONTENT -->');
if(blocks.length < 2) process.exit(1);

const headAndTop = blocks[0];
const rest1 = blocks[1];
const scriptsTail = rest1.split('</main>')[1];

let headerSection = headAndTop;
headerSection = headerSection.replace('<h1>Dashboard</h1>', '<h1>Notifications</h1>');
headerSection = headerSection.replace('<div class="topbar-sub">Welcome back, Arjun <i class="ph ph-hand-waving"></i></div>', '<div class="topbar-sub">Stay updated with your latest alerts</div>');
headerSection = headerSection.replace('<title>Dashboard — LoanPro</title>', '<title>Notifications — LoanPro</title>');

// If the user already replaced the title previously, just in case:
headerSection = headerSection.replace(/<title>.*?<\/title>/, '<title>Notifications — LoanPro</title>');

const finalHtml = headerSection + '\n' + notifContent + '\n    </main>\n' + scriptsTail;
fs.writeFileSync('notifications.html', finalHtml);


// 2. CREATE notifications.css
const cssContent = `
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.notif-card {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  align-items: flex-start;
  cursor: pointer;
}

.notif-card:hover {
  background: var(--surface2);
  transform: translateY(-1px);
}

.notif-card.unread {
  background: var(--primary-light);
  border-color: var(--primary);
}

.notif-card.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary);
}

.notif-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.notif-loan-approved { background: var(--green-bg); color: var(--green); }
.notif-emi-reminder { background: var(--yellow-bg); color: var(--yellow); }
.notif-profile-reminder { background: #EDE9FE; color: var(--primary); }
.notif-payment-success { background: var(--green-bg); color: var(--green); }
.notif-application-submitted { background: #DBEAFE; color: #1E40AF; }

.notif-body {
  flex: 1;
}

.notif-title {
  font-family: var(--font-d);
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 4px;
  color: var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-desc {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.4;
}

.notif-time {
  font-size: 11px;
  color: var(--text3);
  font-weight: 600;
  white-space: nowrap;
}

.notif-btn {
  margin-top: 10px;
}

.notif-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text3);
}
.notif-empty i {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}
`;
fs.writeFileSync('notifications.css', cssContent);


// 3. CREATE notifications.js
const jsContent = `
const DEFAULT_NOTIFICATIONS = [
  { id: 1, type: "loan-approved", title: "Loan Approved", message: "Your Home Loan application LN-2024-001 has been approved.", time: "2 hours ago", read: false },
  { id: 2, type: "payment-success", title: "Payment Successful", message: "Your EMI of ₹8,200 was successfully processed.", time: "1 day ago", read: true },
  { id: 3, type: "emi-reminder", title: "EMI Reminder", message: "Your upcoming EMI of ₹12,500 is due on May 5th.", time: "3 days ago", read: true },
  { id: 4, type: "profile-reminder", title: "Profile Completion", message: "Please complete your KYC details to get instant approvals.", time: "1 week ago", read: false },
  { id: 5, type: "application-submitted", title: "Application Submitted", message: "Your Personal Loan application has been received and is under review.", time: "2 weeks ago", read: true }
];

if (!localStorage.getItem('NOTIFICATIONS')) {
  localStorage.setItem('NOTIFICATIONS', JSON.stringify(DEFAULT_NOTIFICATIONS));
}

let NOTIFICATIONS = JSON.parse(localStorage.getItem('NOTIFICATIONS'));

function getIconClassHTML(type) {
   switch(type) {
      case 'loan-approved': return '<div class="notif-icon-wrap notif-loan-approved"><i class="ph ph-check-circle"></i></div>';
      case 'emi-reminder': return '<div class="notif-icon-wrap notif-emi-reminder"><i class="ph ph-clock"></i></div>';
      case 'profile-reminder': return '<div class="notif-icon-wrap notif-profile-reminder"><i class="ph ph-user"></i></div>';
      case 'payment-success': return '<div class="notif-icon-wrap notif-payment-success"><i class="ph ph-receipt"></i></div>';
      case 'application-submitted': return '<div class="notif-icon-wrap notif-application-submitted"><i class="ph ph-paper-plane-right"></i></div>';
      default: return '<div class="notif-icon-wrap notif-profile-reminder"><i class="ph ph-bell"></i></div>';
   }
}

function updateBellBadge() {
   const unread = NOTIFICATIONS.filter(n => !n.read).length;
   const dot = document.querySelector('.notif-dot');
   if(dot) {
      dot.style.display = unread > 0 ? 'block' : 'none';
   }
}

window.renderNotifications = function() {
   const container = document.getElementById('notifications-list');
   if(!container) return;
   
   if (NOTIFICATIONS.length === 0) {
      container.innerHTML = '<div class="notif-empty"><i class="ph ph-bell-slash"></i><p>You have no notifications right now.</p></div>';
      updateBellBadge();
      return;
   }
   
   container.innerHTML = NOTIFICATIONS.map(n => \`
      <div class="notif-card \${!n.read ? 'unread' : ''}" onclick="markAsRead(\${n.id})">
         \${getIconClassHTML(n.type)}
         <div class="notif-body">
            <div class="notif-title">
               <span>\${n.title}</span>
               <span class="notif-time">\${n.time}</span>
            </div>
            <div class="notif-desc">\${n.message}</div>
         </div>
      </div>
   \`).join('');
   
   updateBellBadge();
};

window.markAsRead = function(id) {
   const idx = NOTIFICATIONS.findIndex(n => n.id === id);
   if (idx !== -1 && !NOTIFICATIONS[idx].read) {
      NOTIFICATIONS[idx].read = true;
      localStorage.setItem('NOTIFICATIONS', JSON.stringify(NOTIFICATIONS));
      renderNotifications();
   }
};

window.clearAllNotifications = function() {
   NOTIFICATIONS = [];
   localStorage.setItem('NOTIFICATIONS', JSON.stringify(NOTIFICATIONS));
   renderNotifications();
};

document.addEventListener('DOMContentLoaded', () => {
   const clearBtn = document.getElementById('clear-all-notif');
   if (clearBtn) clearBtn.addEventListener('click', clearAllNotifications);
   if (document.getElementById('notifications-list')) renderNotifications();
   updateBellBadge();
});
`;
fs.writeFileSync('notifications.js', jsContent);
