/* ═══════════════════════════════════════
   LoanPro Admin — settings.js
═══════════════════════════════════════ */

async function fetchSettings() {
    try {
        const res = await fetch(`${API_BASE}/admin-settings.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            document.getElementById('settingsEmail').value = result.data.email || '';
            document.getElementById('settingsFirstName').value = result.data.firstname || '';
            document.getElementById('settingsLastName').value = result.data.lastname || '';
        }
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveParams');
    const msg = document.getElementById('settingsMsg');
    
    btn.disabled = true;
    btn.innerHTML = 'Saving...';
    
    const payload = {
        firstname: document.getElementById('settingsFirstName').value,
        lastname: document.getElementById('settingsLastName').value,
        password: document.getElementById('settingsPassword').value
    };

    try {
        const res = await fetch(`${API_BASE}/admin-settings.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        msg.style.display = 'block';
        if (data.status === 'success') {
            msg.style.color = '#10b981'; // Green
            msg.textContent = 'Settings updated successfully.';
            document.getElementById('settingsPassword').value = '';
            
            // Re-fetch admin info for navbar
            const updatedAdmin = await checkAuth();
            if (updatedAdmin) populateAdminInfo(updatedAdmin);

        } else {
            msg.style.color = '#ef4444'; // Red
            msg.textContent = data.message || 'Error updating settings.';
        }
    } catch (err) {
        msg.style.display = 'block';
        msg.style.color = '#ef4444';
        msg.textContent = 'Network error. Please try again.';
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-round" style="font-size: 1.1rem; vertical-align: middle; margin-right: 4px;">save</span> Save Changes';
});

document.addEventListener('DOMContentLoaded', () => {
    fetchSettings();
});
