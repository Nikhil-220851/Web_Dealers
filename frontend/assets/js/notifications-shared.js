/**
 * Shared Notifications — fetches real data and populates dropdown on all borrower pages
 */
(function() {
  const API_BASE = '../../backend/api';

  async function fetchAndRender() {
    const userId = localStorage.getItem('userId');
    const notifDrop = document.getElementById('notif-drop');
    if (!userId || !notifDrop) return;

    try {
      const res = await fetch(`${API_BASE}/get-notifications.php?userId=${encodeURIComponent(userId)}`);
      const result = await res.json();
      if (result.status === 'success') {
        renderDropdown(result.data || [], result.unread_count || 0);
      }
    } catch (e) {
      console.warn('Notifications fetch failed:', e);
    }
  }

  function renderDropdown(notifications, unreadCount) {
    const notifDrop = document.getElementById('notif-drop');
    const notifDot = document.querySelector('.notif-dot');
    if (!notifDrop) return;

    if (notifDot) {
      notifDot.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    const listContainer = notifDrop.querySelector('div[style*="max-height"]');
    if (!listContainer) return;

    if (!notifications || notifications.length === 0) {
      listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;">No new notifications.</div>';
      return;
    }

    listContainer.innerHTML = notifications.slice(0, 5).map(function(n) {
      var icon = 'ph-bell', bg = 'var(--surface)', color = 'var(--text)';
      if (n.type === 'approval') { icon = 'ph-check-circle'; bg = 'rgba(34, 197, 94, 0.1)'; color = '#22C55E'; }
      else if (n.type === 'rejection') { icon = 'ph-x-circle'; bg = 'rgba(239, 68, 68, 0.1)'; color = '#EF4444'; }
      else if (n.type === 'loan_applied') { icon = 'ph-file-text'; bg = 'rgba(59, 130, 246, 0.1)'; color = '#3B82F6'; }
      else if ((n.type || '').indexOf('emi') >= 0) { icon = 'ph-calendar-blank'; bg = 'rgba(108, 71, 255, 0.1)'; color = '#6C47FF'; }
      return '<div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;gap:12px;cursor:pointer;" class="notif-item" data-id="' + (n.id || '') + '">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:' + bg + ';color:' + color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ' + icon + '"></i></div>' +
        '<div style="flex:1;"><div class="text-sm font-semi">' + (n.type || '').replace('_', ' ').toUpperCase() + '</div>' +
        '<div class="text-xs" style="margin-top:4px">' + (n.message || '') + '</div>' +
        '<div class="text-xs text-muted" style="margin-top:6px">' + (n.created_at || '') + '</div></div>' +
        (!n.is_read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:5px;flex-shrink:0;"></div>' : '') +
        '</div>';
    }).join('');

    listContainer.querySelectorAll('.notif-item[data-id]').forEach(function(el) {
      var id = el.getAttribute('data-id');
      if (id) el.addEventListener('click', function() { markRead(id); });
    });
  }

  async function markRead(notifId) {
    var userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      var res = await fetch(API_BASE + '/mark-notification-read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notifId, user_id: userId })
      });
      var r = await res.json();
      if (r.status === 'success') fetchAndRender();
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else {
    fetchAndRender();
  }

  window.refreshNotifications = fetchAndRender;
})();
