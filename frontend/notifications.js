
const DEFAULT_NOTIFICATIONS = [
  { id: 1, type: "application-submitted", title: "Loan Application", message: "Loan Application Submitted", time: "1 hour ago", read: false },
  { id: 2, type: "loan-approved", title: "Loan Approved", message: "Your personal loan has been approved.", time: "2 hours ago", read: false },
  { id: 3, type: "payment-success", title: "EMI Payment Successful", message: "Your EMI payment of ₹5,400 was successful.", time: "1 day ago", read: true },
  { id: 4, type: "emi-reminder", title: "EMI Payment Reminder", message: "Your next EMI payment is due in 3 days.", time: "3 days ago", read: true },
  { id: 5, type: "profile-reminder", title: "Profile Completion", message: "Profile Completion Reminder", time: "1 week ago", read: false }
];

// Force populate demo notifications for this update
localStorage.setItem('NOTIFICATIONS', JSON.stringify(DEFAULT_NOTIFICATIONS));
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
   
   container.innerHTML = NOTIFICATIONS.map(n => `
      <div class="notif-card ${!n.read ? 'unread' : ''}" onclick="markAsRead(${n.id})">
         ${getIconClassHTML(n.type)}
         <div class="notif-body">
            <div class="notif-title">
               <span>${n.title}</span>
               <span class="notif-time">${n.time}</span>
            </div>
            <div class="notif-desc">${n.message}</div>
         </div>
      </div>
   `).join('');
   
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
