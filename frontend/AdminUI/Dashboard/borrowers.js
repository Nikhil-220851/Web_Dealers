/* ═══════════════════════════════════════
   LoanPro Admin — borrowers.js
═══════════════════════════════════════ */

async function fetchBorrowers() {
    try {
        const res = await fetch(`${API_BASE}/admin-get-borrowers.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            renderBorrowers(result.data);
        }
    } catch (err) {
        console.error('Failed to load borrowers:', err);
    }
}

function renderBorrowers(borrowers) {
    const tbody = document.getElementById('borrowersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (borrowers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No borrowers found</td></tr>`;
        return;
    }

    borrowers.forEach(b => {
        const avatarLetter = b.name.charAt(0).toUpperCase();

        const dateObj = new Date(b.created_at);
        const dateStr = isNaN(dateObj.valueOf()) ? b.created_at : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const kycClass = b.kyc_status.toLowerCase() === 'approved' ? 'spill-ok' : (b.kyc_status.toLowerCase() === 'rejected' ? 'spill-no' : 'spill-wait');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="borrower"><div class="ava ava-t">${avatarLetter}</div>${b.name}</div></td>
            <td>${b.email}</td>
            <td>${b.phone || '-'}</td>
            <td>${dateStr}</td>
            <td><span class="spill ${kycClass}">${capitalize(b.kyc_status)}</span></td>
            <td><strong>${b.total_loans}</strong></td>
            <td style="text-align:center;">
                <button class="btn btn-sm btn-outline-primary" style="font-size:12px; font-weight:600;" onclick="viewProfile('${b.id}')">
                    <span class="material-icons-round" style="font-size:14px; vertical-align:middle; margin-right:2px;">person_search</span> View
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Modal Logic ----

async function viewProfile(userId) {
    const modal = document.getElementById('profileModal');
    const body = document.getElementById('profileModalBody');
    if (!modal || !body) return;

    modal.classList.add('show');
    body.innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-icons-round" style="animation:spin 1s linear infinite; font-size:32px; color:#0f4c5c;">sync</span><p style="margin-top:10px;">Loading profile...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/admin-get-borrower-profile.php?user_id=${userId}`);
        const result = await res.json();

        if (result.status === 'success') {
            renderProfileModal(result.data);
        } else {
            body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error: ${result.message}</div>`;
        }
    } catch (err) {
        console.error('Error fetching profile:', err);
        body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Network error occurred while fetching profile.</div>`;
    }
}

function renderProfileModal(data) {
    const body = document.getElementById('profileModalBody');
    const p = data.personal;
    const k = data.kyc || {};
    const b = data.bank || {};
    const l = data.loans || [];

    let loansHtml = '';
    if (l.length === 0) {
        loansHtml = '<div style="color:#64748b; font-size:14px;">No loans applied yet.</div>';
    } else {
        loansHtml = `<table class="xtable" style="margin-top:10px; font-size:13px;">
                        <thead>
                            <tr>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${l.map(loan => `
                                <tr>
                                    <td>₹${loan.amount.toLocaleString('en-IN')}</td>
                                    <td><span style="font-weight:600; text-transform:capitalize; color: ${loan.status==='approved'?'green':(loan.status==='rejected'?'red':'orange')}">${loan.status}</span></td>
                                    <td>${loan.applied_date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
    }

    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        
        <!-- Left Col -->
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Personal Information</h4>
            <div style="margin-bottom:8px;"><strong>Name:</strong> ${p.name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Email:</strong> ${p.email || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Phone:</strong> ${p.phone || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Joined:</strong> ${p.joined || 'N/A'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">KYC Details</h4>
            <div style="margin-bottom:8px;"><strong>PAN:</strong> ${k.pan_number || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Aadhaar:</strong> ${k.aadhaar_number || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>DOB:</strong> ${k.dob || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Address:</strong> ${k.address || 'Not provided'}</div>
        </div>

        <!-- Right Col -->
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Bank Details</h4>
            <div style="margin-bottom:8px;"><strong>Account Name:</strong> ${b.account_holder_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Bank Name:</strong> ${b.bank_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>A/c Number:</strong> ${b.account_number || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>IFSC Code:</strong> ${b.ifsc_code || 'N/A'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Loan History (${l.length})</h4>
            ${loansHtml}
        </div>

      </div>
    `;
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBorrowers();
});
