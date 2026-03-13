/* ═══════════════════════════════════════
   LoanPro Admin — loan-requests.js
═══════════════════════════════════════ */

async function fetchLoanRequests() {
    try {
        const res = await fetch(`${API_BASE}/admin-get-loan-requests.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            renderLoanRequests(result.data);
        }
    } catch (err) {
        console.error('Failed to load loan requests:', err);
    }
}

function renderLoanRequests(apps) {
    const tbody = document.getElementById('allLoanRequestsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No loan applications found</td></tr>`;
        return;
    }

    apps.forEach(app => {
        const avatarLetter = app.borrower_name.charAt(0).toUpperCase();

        const typeMap = {
            'Personal': 'ltype-p',
            'Business': 'ltype-bus', // example placeholder
            'Home': 'ltype-h',
            'Car': 'ltype-c'
        };
        const typeClass = typeMap[app.loan_type] || 'ltype-p';
        
        const statusMap = {
            'pending': 'spill-wait',
            'approved': 'spill-ok',
            'rejected': 'spill-no'
        };
        const statusClass = statusMap[app.status] || 'spill-wait';
        
        // Shorten ID for display
        const shortId = app.id.substring(app.id.length - 6).toUpperCase();
        
        // Format Date
        const dateObj = new Date(app.application_date);
        const dateStr = isNaN(dateObj.valueOf()) ? app.application_date : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        let actionHtml = '';
        if (app.status === 'pending') {
            actionHtml = `
            <div class="act-btns" style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn btn-sm btn-outline-primary" style="font-size:12px; font-weight:600;" onclick="viewApplication('${app.id}')"><span class="material-icons-round" style="font-size:14px; vertical-align:middle; margin-right:2px;">visibility</span></button>
              <button class="act-approve" onclick="updateLoanStatus('${app.id}', 'approved')"><span class="material-icons-round">check</span> Approve</button>
              <button class="act-reject"  onclick="updateLoanStatus('${app.id}', 'rejected')"><span class="material-icons-round">close</span> Reject</button>
            </div>`;
        } else {
            actionHtml = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color: #64748b; font-size: 0.9rem;">Processed</span>
                <button class="btn btn-sm btn-outline-primary" style="font-size:12px; font-weight:600;" onclick="viewApplication('${app.id}')"><span class="material-icons-round" style="font-size:14px; vertical-align:middle; margin-right:2px;">visibility</span></button>
            </div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="lid" title="${app.id}">${shortId}</span></td>
            <td><div class="borrower"><div class="ava ava-t">${avatarLetter}</div>${app.borrower_name}</div></td>
            <td><div style="font-weight:600; color:#1e293b;">${app.bank_name || 'N/A'}</div></td>
            <td><span class="ltype ${typeClass}">${app.loan_type}</span></td>
            <td class="money">₹${(app.amount || 0).toLocaleString('en-IN')}</td>
            <td>${app.tenure} Months</td>
            <td>${dateStr}</td>
            <td><span class="spill ${statusClass}">${capitalize(app.status)}</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateLoanStatus(loanId, newStatus) {
    if (!confirm(`Are you sure you want to mark this loan as ${newStatus}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin-update-loan-status.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loan_id: loanId, status: newStatus })
        });
        const data = await res.json();
        if (data.status === 'success') {
            fetchLoanRequests(); // refresh list
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Network error updating status');
    }
}

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Modal Logic ----

async function viewApplication(loanId) {
    const modal = document.getElementById('appModal');
    const body = document.getElementById('appModalBody');
    if (!modal || !body) return;

    modal.classList.add('show');
    body.innerHTML = '<div style="text-align:center; padding: 40px;"><span class="material-icons-round" style="animation:spin 1s linear infinite; font-size:32px; color:#0f4c5c;">sync</span><p style="margin-top:10px;">Loading application details...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/admin-get-loan-details.php?loan_id=${loanId}`);
        const result = await res.json();

        if (result.status === 'success') {
            renderAppModal(result.data);
        } else {
            body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Error: ${result.message}</div>`;
        }
    } catch (err) {
        console.error('Error fetching details:', err);
        body.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Network error occurred while fetching details.</div>`;
    }
}

function renderAppModal(data) {
    const body = document.getElementById('appModalBody');
    const b = data.borrower;
    const a = data.application;
    const p = data.loan_product;
    const k = data.kyc || {};
    const bk = data.bank || {};

    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        
        <!-- Left Col -->
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Applicant Info</h4>
            <div style="margin-bottom:8px;"><strong>Name:</strong> ${b.name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Email:</strong> ${b.email || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Phone:</strong> ${b.phone || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>DOB:</strong> ${k.dob || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Address:</strong> ${k.address || 'Not provided'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Loan Details</h4>
            <div style="margin-bottom:8px;"><strong>Amount:</strong> ₹${a.amount.toLocaleString('en-IN')}</div>
            <div style="margin-bottom:8px;"><strong>Tenure:</strong> ${a.tenure} Months</div>
            <div style="margin-bottom:8px;"><strong>Type:</strong> ${p.loan_type || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Bank:</strong> ${p.bank_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Applied On:</strong> ${a.applied_date}</div>
        </div>

        <!-- Right Col -->
        <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">KYC & Documents</h4>
            <div style="margin-bottom:8px;"><strong>PAN Card:</strong> ${k.pan_number || 'Not provided'}</div>
            <div style="margin-bottom:8px;"><strong>Aadhaar:</strong> ${k.aadhaar_number || 'Not provided'}</div>

            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Bank Details</h4>
            <div style="margin-bottom:8px;"><strong>Account Name:</strong> ${bk.account_holder_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>Bank Name:</strong> ${bk.bank_name || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>A/c Number:</strong> ${bk.account_number || 'N/A'}</div>
            <div style="margin-bottom:8px;"><strong>IFSC Code:</strong> ${bk.ifsc_code || 'N/A'}</div>
            
            <h4 style="font-size:16px; font-weight:700; margin-top:24px; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; color:#0f4c5c;">Status</h4>
            <div style="margin-bottom:8px; text-transform:uppercase; font-weight:bold; color: ${a.status === 'approved' ? 'green' : (a.status === 'rejected' ? 'red' : 'orange')}">
                ${a.status}
            </div>
        </div>

      </div>
    `;
}

function closeAppModal() {
    const modal = document.getElementById('appModal');
    if (modal) modal.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLoanRequests();
});
