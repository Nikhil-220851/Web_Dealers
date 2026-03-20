/* ═══════════════════════════════════════
   LoanPro Admin — loan-requests.js
   CORRECT VERSION:
   - Pending loans show View + Approve + Reject
   - Clicking Approve/Reject opens REVIEW MODAL first
   - Admin checks borrower details + eligibility
   - Then enters remarks and confirms
   - Already processed loans show eye icon only
═══════════════════════════════════════ */

let allLoans         = [];
let currentLoanId    = null;
let currentNewStatus = null;

/* ─────────────────────────────────────
   1. FETCH ALL LOAN REQUESTS
───────────────────────────────────── */
async function fetchLoanRequests() {
    const tbody = document.getElementById('allLoanRequestsBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;">
        <span class="material-icons-round" style="animation:spin 1s linear infinite;font-size:28px;color:var(--pr);">sync</span>
        <p style="margin-top:8px;color:#64748b;">Loading loan requests…</p>
    </td></tr>`;

    try {
        const res    = await fetch(`${API_BASE}/admin-get-loan-requests.php`);
        const result = await res.json();

        if (result.status === 'success') {
            allLoans = result.data;
            renderLoanRequests(allLoans);
        } else {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ef4444;padding:24px;">
                Error: ${result.message}
            </td></tr>`;
        }
    } catch (err) {
        console.error('fetchLoanRequests error:', err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ef4444;padding:24px;">
            Network error. Please refresh.
        </td></tr>`;
    }
}

/* ─────────────────────────────────────
   2. RENDER TABLE
   PENDING  → View 👁 + Approve ✅ + Reject ❌
   OTHERS   → View 👁 only (already processed)
───────────────────────────────────── */
function renderLoanRequests(loans) {
    const tbody = document.getElementById('allLoanRequestsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!loans || loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:32px;">
            No loan applications found.
        </td></tr>`;
        return;
    }

    loans.forEach(loan => {
        const shortId   = loan.id.substring(loan.id.length - 6).toUpperCase();
        const avatarLtr = (loan.borrower_name || 'U').charAt(0).toUpperCase();

        const typeMap   = { personal:'ltype-p', home:'ltype-h', car:'ltype-c', business:'ltype-bus' };
        const typeClass = typeMap[(loan.loan_type||'').toLowerCase()] || 'ltype-p';

        const statusMap   = { pending:'spill-wait', approved:'spill-ok', rejected:'spill-no' };
        const statusClass = statusMap[loan.status] || 'spill-wait';

        /* ── ACTION BUTTONS ──
           PENDING  = View + Approve + Reject (all 3)
           APPROVED = View only + "Processed" label
           REJECTED = View only + "Processed" label
        ── */
        let actionHtml = '';

        if (loan.status === 'pending') {
            // PENDING: show all 3 buttons
            actionHtml = `
            <div class="act-btns">
                <button class="btn btn-sm btn-outline-primary"
                    style="font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:3px;padding:5px 10px;"
                    onclick="openReviewModal('${loan.id}')"
                    title="View borrower details">
                    <span class="material-icons-round" style="font-size:14px;">visibility</span>
                </button>
                <button class="act-approve" onclick="openRemarksModal('${loan.id}','approved')">
                    <span class="material-icons-round">check</span> Approve
                </button>
                <button class="act-reject" onclick="openRemarksModal('${loan.id}','rejected')">
                    <span class="material-icons-round">close</span> Reject
                </button>
            </div>`;
        } else {
            // APPROVED or REJECTED: show eye + processed label
            const icon  = loan.status === 'approved' ? 'check_circle' : 'cancel';
            const color = loan.status === 'approved' ? '#16a34a'      : '#ef4444';
            actionHtml = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:${color};font-size:12px;font-weight:700;
                    display:flex;align-items:center;gap:4px;">
                    <span class="material-icons-round" style="font-size:15px;">${icon}</span>
                    Processed
                </span>
                <button class="btn btn-sm btn-outline-primary"
                    style="font-size:12px;font-weight:600;display:inline-flex;align-items:center;padding:5px 10px;"
                    onclick="openReviewModal('${loan.id}')"
                    title="View details">
                    <span class="material-icons-round" style="font-size:14px;">visibility</span>
                </button>
            </div>`;
        }

        const tr = document.createElement('tr');
        tr.id    = `row-${loan.id}`;
        tr.innerHTML = `
            <td><span class="lid" title="${loan.id}">${shortId}</span></td>
            <td>
                <div class="borrower">
                    <div class="ava ava-t">${avatarLtr}</div>
                    <div>
                        <div style="font-weight:700;">${loan.borrower_name || 'Unknown'}</div>
                        <div style="font-size:11px;color:#94a3b8;">${loan.borrower_id || ''}</div>
                    </div>
                </div>
            </td>
            <td style="font-weight:600;">${loan.bank_name || '—'}</td>
            <td><span class="ltype ${typeClass}">${capitalize(loan.loan_type||'N/A')}</span></td>
            <td class="money">₹${Number(loan.amount||0).toLocaleString('en-IN')}</td>
            <td>${loan.tenure ? loan.tenure+' mo' : '—'}</td>
            <td style="color:#64748b;font-size:13px;">${loan.application_date||'—'}</td>
            <td>
                <span class="spill ${statusClass}" id="status-${loan.id}">
                    ${capitalize(loan.status||'pending')}
                </span>
            </td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ─────────────────────────────────────
   3. SEARCH & FILTER
───────────────────────────────────── */
function filterLoans() {
    const q      = (document.getElementById('searchInput')?.value  || '').toLowerCase();
    const status = (document.getElementById('statusFilter')?.value || '').toLowerCase();

    const filtered = allLoans.filter(l => {
        const matchSearch = !q ||
            (l.borrower_name||'').toLowerCase().includes(q) ||
            (l.loan_type||'').toLowerCase().includes(q)     ||
            (l.bank_name||'').toLowerCase().includes(q)     ||
            l.id.toLowerCase().includes(q);
        const matchStatus = !status || (l.status||'pending').toLowerCase() === status;
        return matchSearch && matchStatus;
    });

    renderLoanRequests(filtered);
}

/* ─────────────────────────────────────
   4. OPEN REVIEW MODAL
   Shows full borrower details + eligibility
   checklist BEFORE admin makes decision
───────────────────────────────────── */
async function openReviewModal(loanId) {
    const loan = allLoans.find(l => l.id === loanId);
    if (!loan) return;

    document.getElementById('appModalTitle').textContent =
        `Application Details — #${loanId.slice(-6).toUpperCase()}`;

    const body = document.getElementById('appModalBody');
    body.innerHTML = `<div style="text-align:center;padding:48px;">
        <span class="material-icons-round"
            style="animation:spin 1s linear infinite;font-size:36px;color:var(--pr);">sync</span>
        <p style="margin-top:10px;color:#64748b;">Loading borrower details & eligibility…</p>
    </div>`;

    document.getElementById('appModal').classList.add('show');

    // Fetch borrower profile for eligibility check
    let profileData = null;
    try {
        const res    = await fetch(`${API_BASE}/admin-get-borrower-profile.php?user_id=${loan.borrower_id}`);
        const result = await res.json();
        if (result.status === 'success') profileData = result.data;
    } catch (e) {
        console.error('Profile fetch failed', e);
    }

    renderReviewModal(loan, profileData);
}

/* ─────────────────────────────────────
   5. RENDER REVIEW MODAL
   Shows: Loan summary, borrower info,
   KYC details, eligibility checklist,
   bank details, loan history
   + Approve/Reject buttons (pending only)
───────────────────────────────────── */
function renderReviewModal(loan, profile) {
    const body = document.getElementById('appModalBody');

    const p  = profile?.personal || {};
    const k  = profile?.kyc      || {};
    const bk = profile?.bank     || {};
    const lh = profile?.loans    || [];

    // Eligibility checks
    const hasKyc     = !!(k.pan_number && k.aadhaar_number);
    const hasBank    = !!(bk.account_number);
    const hasNoDeflt = !lh.some(l => l.status === 'defaulted');
    const eligible   = hasKyc && hasBank && hasNoDeflt;

    const check = (ok, label) => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 13px;
             background:${ok?'#f0fdf4':'#fff5f5'};border-radius:9px;
             border:1.5px solid ${ok?'#bbf7d0':'#fecaca'};margin-bottom:8px;">
            <span class="material-icons-round" style="color:${ok?'#16a34a':'#ef4444'};font-size:18px;">
                ${ok?'check_circle':'cancel'}
            </span>
            <span style="font-weight:600;font-size:13px;color:${ok?'#166534':'#991b1b'};">${label}</span>
        </div>`;

    // Loan history rows
    let historyHtml = `<div style="color:#64748b;font-size:13px;font-style:italic;">No previous loan history.</div>`;
    if (lh.length > 0) {
        const rows = lh.map(l => `
            <tr>
                <td>₹${Number(l.amount||0).toLocaleString('en-IN')}</td>
                <td><span style="font-weight:700;text-transform:capitalize;
                    color:${l.status==='approved'?'#16a34a':(l.status==='rejected'?'#ef4444':(l.status==='defaulted'?'#dc2626':'#d97706'))}">
                    ${l.status}</span></td>
                <td>${l.applied_date||'—'}</td>
            </tr>`).join('');
        historyHtml = `
            <div style="overflow-x:auto;border-radius:10px;border:1.5px solid var(--tint);">
                <table class="xtable" style="font-size:13px;">
                    <thead><tr><th>Amount</th><th>Status</th><th>Applied On</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }

    const statusColor = loan.status==='approved'?'#16a34a':(loan.status==='rejected'?'#ef4444':'#d97706');

    body.innerHTML = `

    <!-- Loan Summary -->
    <div style="background:var(--card-bg);border:1.5px solid var(--border);border-radius:14px;
         padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
             letter-spacing:1px;margin-bottom:12px;">Loan Summary</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
            <div>
                <div style="font-size:20px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;color:var(--pr-dk);">
                    ₹${Number(loan.amount||0).toLocaleString('en-IN')}
                </div>
                <div style="font-size:11px;color:#64748b;font-weight:600;">Amount</div>
            </div>
            <div>
                <div style="font-size:20px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;color:var(--navy);">
                    ${loan.tenure||'—'} mo
                </div>
                <div style="font-size:11px;color:#64748b;font-weight:600;">Tenure</div>
            </div>
            <div>
                <div style="font-size:20px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;color:#7c3aed;">
                    ${capitalize(loan.loan_type||'N/A')}
                </div>
                <div style="font-size:11px;color:#64748b;font-weight:600;">Type</div>
            </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--tint);
             font-size:13px;color:#64748b;display:flex;flex-wrap:wrap;gap:16px;">
            <span><strong>Bank:</strong> ${loan.bank_name||'—'}</span>
            <span><strong>Applied:</strong> ${loan.application_date||'—'}</span>
            <span><strong>Status:</strong>
                <span style="font-weight:800;color:${statusColor};text-transform:capitalize;">
                    ${loan.status||'pending'}
                </span>
            </span>
        </div>
    </div>

    <!-- Two Columns -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">

        <!-- Left: Personal + KYC -->
        <div>
            <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
                 letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid var(--tint);padding-bottom:6px;">
                Borrower Details
            </div>
            <div style="font-size:13.5px;line-height:2.1;">
                <div><strong>Name:</strong> ${p.name||loan.borrower_name||'—'}</div>
                <div><strong>Email:</strong> ${p.email||'—'}</div>
                <div><strong>Phone:</strong> ${p.phone||'—'}</div>
                <div><strong>Joined:</strong> ${p.joined||'—'}</div>
            </div>

            <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
                 letter-spacing:1px;margin:14px 0 10px;border-bottom:1px solid var(--tint);padding-bottom:6px;">
                KYC Details
            </div>
            <div style="font-size:13.5px;line-height:2.1;">
                <div><strong>PAN:</strong> ${k.pan_number     || '<span style="color:#ef4444">Not provided</span>'}</div>
                <div><strong>Aadhaar:</strong> ${k.aadhaar_number || '<span style="color:#ef4444">Not provided</span>'}</div>
                <div><strong>DOB:</strong> ${k.dob            || '—'}</div>
                <div><strong>Address:</strong> ${k.address    || '—'}</div>
            </div>
        </div>

        <!-- Right: Eligibility + Bank -->
        <div>
            <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
                 letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid var(--tint);padding-bottom:6px;">
                Eligibility Checklist
            </div>
            ${check(hasKyc,     'KYC Completed (PAN + Aadhaar)')}
            ${check(hasBank,    'Bank Details Provided')}
            ${check(hasNoDeflt, 'No Defaulted Loans')}

            <div style="margin-top:10px;padding:11px 14px;border-radius:10px;text-align:center;
                 background:${eligible?'#dcfce7':'#fee2e2'};
                 border:2px solid ${eligible?'#4ade80':'#fca5a5'};">
                <span class="material-icons-round"
                    style="color:${eligible?'#16a34a':'#ef4444'};font-size:20px;vertical-align:middle;">
                    ${eligible?'verified':'gpp_bad'}
                </span>
                <span style="font-weight:800;font-size:13.5px;
                    color:${eligible?'#166534':'#991b1b'};margin-left:6px;">
                    ${eligible?'Eligible for Approval':'Not Eligible — Issues Found'}
                </span>
            </div>

            <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
                 letter-spacing:1px;margin:14px 0 10px;border-bottom:1px solid var(--tint);padding-bottom:6px;">
                Bank Details
            </div>
            <div style="font-size:13.5px;line-height:2.1;">
                <div><strong>Account Name:</strong> ${bk.account_holder_name||'—'}</div>
                <div><strong>Bank:</strong> ${bk.bank_name       || '<span style="color:#ef4444">Not provided</span>'}</div>
                <div><strong>A/c No:</strong> ${bk.account_number || '<span style="color:#ef4444">Not provided</span>'}</div>
                <div><strong>IFSC:</strong> ${bk.ifsc_code        || '—'}</div>
            </div>
        </div>
    </div>

    <!-- Loan History -->
    <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
         letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid var(--tint);padding-bottom:6px;">
        Loan History (${lh.length})
    </div>
    <div style="margin-bottom:20px;">${historyHtml}</div>

    <!-- Decision Buttons — ONLY for pending loans -->
    ${loan.status === 'pending' ? `
    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:18px 20px;">
        <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;
             letter-spacing:1px;margin-bottom:12px;">Make Decision</div>
        <div style="display:flex;gap:12px;">
            <button class="act-approve" style="flex:1;justify-content:center;padding:12px;"
                onclick="closeAppModal(); openRemarksModal('${loan.id}','approved')">
                <span class="material-icons-round">check_circle</span> Approve Loan
            </button>
            <button class="act-reject" style="flex:1;justify-content:center;padding:12px;"
                onclick="closeAppModal(); openRemarksModal('${loan.id}','rejected')">
                <span class="material-icons-round">cancel</span> Reject Loan
            </button>
        </div>
        ${!eligible ? `
        <div style="margin-top:10px;padding:10px 14px;background:#fff7ed;
             border:1.5px solid #fed7aa;border-radius:8px;font-size:12.5px;
             color:#9a3412;display:flex;gap:8px;align-items:center;">
            <span class="material-icons-round" style="font-size:16px;">warning</span>
            Eligibility issues found. Backend will block approval if KYC/bank missing.
        </div>` : ''}
    </div>` : `
    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;
         padding:16px 20px;text-align:center;color:#64748b;font-size:13.5px;font-weight:600;">
        <span class="material-icons-round" style="vertical-align:middle;margin-right:6px;font-size:18px;">
            ${loan.status==='approved'?'check_circle':'cancel'}
        </span>
        This loan has already been ${loan.status}.
        ${loan.remarks ? `<div style="margin-top:8px;font-style:italic;font-weight:400;">"${loan.remarks}"</div>` : ''}
    </div>`}
    `;
}

/* ─────────────────────────────────────
   6. OPEN REMARKS MODAL
   Called when admin clicks Approve/Reject
   (either from table buttons or review modal)
───────────────────────────────────── */
function openRemarksModal(loanId, newStatus) {
    currentLoanId    = loanId;
    currentNewStatus = newStatus;

    const label = document.getElementById('decisionLabel');
    if (label) {
        label.textContent = newStatus === 'approved' ? '✅ Approving Loan' : '❌ Rejecting Loan';
        label.style.color = newStatus === 'approved' ? '#166534' : '#991b1b';
    }

    const ta = document.getElementById('remarksInput');
    if (ta) { ta.value = ''; ta.style.borderColor = '#e2e8f0'; }

    document.getElementById('remarksModal')?.classList.add('show');
}

function closeRemarksModal() {
    document.getElementById('remarksModal')?.classList.remove('show');
    const ta = document.getElementById('remarksInput');
    if (ta) ta.value = '';
    currentLoanId    = null;
    currentNewStatus = null;
}

/* ─────────────────────────────────────
   7. CONFIRM DECISION — calls backend
───────────────────────────────────── */
async function confirmDecision() {
    if (!currentLoanId || !currentNewStatus) return;

    const remarks = (document.getElementById('remarksInput')?.value || '').trim();
    if (!remarks) {
        const ta = document.getElementById('remarksInput');
        if (ta) { ta.style.borderColor = '#ef4444'; ta.focus(); }
        showToast('Please enter remarks before confirming.', 'error');
        return;
    }

    const btn = document.getElementById('confirmDecisionBtn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

    try {
        const res    = await fetch(`${API_BASE}/admin-update-loan-status.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                loan_id: currentLoanId,
                status:  currentNewStatus,
                remarks: remarks
            })
        });
        const data = await res.json();

        if (data.status === 'success') {
            updateRowInTable(currentLoanId, currentNewStatus);

            // Update local cache
            const idx = allLoans.findIndex(l => l.id === currentLoanId);
            if (idx !== -1) {
                allLoans[idx].status  = currentNewStatus;
                allLoans[idx].remarks = remarks;
            }

            closeRemarksModal();
            showToast(`Loan ${currentNewStatus} successfully!`, 'success');

        } else {
            showToast(data.message || 'Failed to update loan status.', 'error');
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        }

    } catch (err) {
        console.error('confirmDecision error:', err);
        showToast('Network error. Please try again.', 'error');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
}

/* ─────────────────────────────────────
   8. UPDATE ROW AFTER DECISION
   Changes status pill + replaces buttons
   with "Processed" label
───────────────────────────────────── */
function updateRowInTable(loanId, newStatus) {
    // Update status pill
    const statusEl = document.getElementById(`status-${loanId}`);
    if (statusEl) {
        statusEl.className   = `spill ${newStatus==='approved'?'spill-ok':'spill-no'}`;
        statusEl.textContent = capitalize(newStatus);
    }

    // Replace action buttons
    const row = document.getElementById(`row-${loanId}`);
    if (row) {
        const actionCell = row.querySelector('td:last-child');
        if (actionCell) {
            const icon  = newStatus === 'approved' ? 'check_circle' : 'cancel';
            const color = newStatus === 'approved' ? '#16a34a'      : '#ef4444';
            const loan  = allLoans.find(l => l.id === loanId);
            const bid   = loan?.borrower_id || '';

            actionCell.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:${color};font-size:12px;font-weight:700;
                    display:flex;align-items:center;gap:4px;">
                    <span class="material-icons-round" style="font-size:15px;">${icon}</span>
                    Processed
                </span>
                <button class="btn btn-sm btn-outline-primary"
                    style="font-size:12px;font-weight:600;display:inline-flex;
                           align-items:center;padding:5px 10px;"
                    onclick="openReviewModal('${loanId}')"
                    title="View details">
                    <span class="material-icons-round" style="font-size:14px;">visibility</span>
                </button>
            </div>`;
        }
        row.style.animation = 'rowFlash 1.2s ease forwards';
    }
}

/* ─────────────────────────────────────
   9. CLOSE MODALS
───────────────────────────────────── */
function closeAppModal() {
    document.getElementById('appModal')?.classList.remove('show');
}

/* ─────────────────────────────────────
   10. TOAST NOTIFICATION
───────────────────────────────────── */
function showToast(message, type = 'success') {
    document.getElementById('lrToast')?.remove();
    const isOk  = type === 'success';
    const toast = document.createElement('div');
    toast.id    = 'lrToast';
    toast.style.cssText = `
        position:fixed;bottom:28px;right:28px;z-index:9999;
        background:${isOk?'#dcfce7':'#fee2e2'};
        color:${isOk?'#166534':'#991b1b'};
        border:1.5px solid ${isOk?'#4ade80':'#fca5a5'};
        border-radius:12px;padding:14px 20px;
        font-family:'Plus Jakarta Sans',sans-serif;
        font-size:13.5px;font-weight:700;
        display:flex;align-items:center;gap:10px;
        box-shadow:0 8px 30px rgba(0,0,0,0.12);max-width:360px;`;
    toast.innerHTML = `
        <span class="material-icons-round" style="font-size:20px;">
            ${isOk?'check_circle':'error'}
        </span>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ─────────────────────────────────────
   11. UTILS
───────────────────────────────────── */
function capitalize(s) {
    if (typeof s !== 'string' || !s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─────────────────────────────────────
   12. INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    fetchLoanRequests();
    document.getElementById('searchInput') ?.addEventListener('input',  filterLoans);
    document.getElementById('statusFilter')?.addEventListener('change', filterLoans);
});