/* ═══════════════════════════════════════
   LoanPro Bank Employee — verify-loans.js
═══════════════════════════════════════ */

let allLoans = [];
let verifyModal = null;

async function fetchLoans() {
    try {
        const res = await fetch(`${API_BASE}/emp-get-loans.php`);
        const result = await res.json();
        
        if (result.status === 'success') {
            allLoans = result.data;
            renderLoans(allLoans);
        } else {
            console.error('Failed to fetch loans:', result.message);
            document.getElementById('loansTableBody').innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load data.</td></tr>`;
        }
    } catch (err) {
        console.error('Network error:', err);
    }
}

function renderLoans(loans) {
    const tbody = document.getElementById('loansTableBody');
    const emptyState = document.getElementById('emptyState');

    if (!loans || loans.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = loans.map(loan => {
        let appStatusClass = loan.status === 'approved' ? 'approved' : 
                             (loan.status === 'rejected' ? 'rejected' : 'pending');
        
        let verStatusClass = loan.employee_verification === 'eligible' ? 'eligible' : 
                             (loan.employee_verification === 'not_eligible' ? 'not_eligible' : 'pending');
        
        let isPendingStr = loan.employee_verification === 'pending';
        let actionBtn = isPendingStr ? `<button class="view-btn" onclick="openVerifyModal('${loan._id}')">Review</button>` 
                                     : `<button class="view-btn" disabled>Reviewed</button>`;

        let applicantName = loan.borrower_name || 'N/A';
        
        return `
            <tr>
                <td><span style="font-family:monospace; color:#475569; font-weight:600;">${loan._id.substring(loan._id.length - 8)}</span></td>
                <td><strong style="color:#1e293b;">${escapeHtml(applicantName)}</strong></td>
                <td style="font-weight:700; color:#334155;">₹${Number(loan.loan_amount || 0).toLocaleString('en-IN')}</td>
                <td><span class="badge ${appStatusClass}">${escapeHtml(loan.status.toUpperCase())}</span></td>
                <td><span class="badge ${verStatusClass}">${escapeHtml((loan.employee_verification || 'pending').replace('_', ' ').toUpperCase())}</span></td>
                <td style="text-align: center;">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

function handleSearch() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const btnClear = document.getElementById('clearSearch');
    
    if (q) btnClear.style.display = 'flex';
    else btnClear.style.display = 'none';
    
    filterData();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    filterData();
}

function handleFilter() {
    filterData();
}

function filterData() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('verificationFilter').value;

    const filtered = allLoans.filter(loan => {
        let matchQuery = true;
        let applicant = (loan.borrower_name || loan.user_name || '').toLowerCase();
        let loanId = (loan._id || '').toLowerCase();
        
        if (q) {
            matchQuery = applicant.includes(q) || loanId.includes(q);
        }

        let matchStatus = true;
        if (status !== 'All') {
            matchStatus = loan.employee_verification === status;
        }

        return matchQuery && matchStatus;
    });

    renderLoans(filtered);
}

function openVerifyModal(loanId) {
    document.getElementById('verifyError').classList.add('d-none');
    document.getElementById('verifyForm').reset();
    document.getElementById('v_loan_id').value = loanId;
    
    if(!verifyModal) {
        verifyModal = new bootstrap.Modal(document.getElementById('verifyModal'));
    }
    verifyModal.show();
}

async function submitVerification() {
    const loanId = document.getElementById('v_loan_id').value;
    const decision = document.querySelector('input[name="decision"]:checked');
    const notes = document.getElementById('notes').value.trim();
    const errorEl = document.getElementById('verifyError');
    const btn = document.getElementById('btnSubmitVerify');

    if (!decision) {
        errorEl.textContent = 'Please select a decision.';
        errorEl.classList.remove('d-none');
        return;
    }
    if (!notes || notes.length < 10) {
        errorEl.textContent = 'Please provide detailed review notes (min 10 characters).';
        errorEl.classList.remove('d-none');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    errorEl.classList.add('d-none');

    try {
        const res = await fetch(`${API_BASE}/emp-verify-loan.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                loan_id: loanId,
                decision: decision.value,
                notes: notes
            })
        });

        const result = await res.json();
        
        if (result.status === 'success') {
            verifyModal.hide();
            await fetchLoans(); // Refresh tables completely
        } else {
            errorEl.textContent = result.message || 'Failed to submit verification.';
            errorEl.classList.remove('d-none');
        }
    } catch (err) {
        errorEl.textContent = 'Network error. Please try again later.';
        errorEl.classList.remove('d-none');
    }

    btn.disabled = false;
    btn.innerHTML = 'Submit Verification';
}

function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLoans();
});
