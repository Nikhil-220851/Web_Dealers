/* ═══════════════════════════════════════
   LoanPro Agent — borrower-details.js
   Fetches and displays read-only customer info
═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const loanId = params.get('id');

    if (!loanId) {
        alert("No Loan ID provided.");
        window.location.href = 'borrowers.html';
        return;
    }

    fetchDetails(loanId);
});

async function fetchDetails(loanId) {
    const loadingState = document.getElementById('loadingState');
    const detailsContent = document.getElementById('detailsContent');

    try {
        const res = await fetch(`${API_BASE}/loanagent-get-customer-details.php?id=${loanId}`);
        const result = await res.json();

        if (result.status === 'success') {
            const data = result.data;
            populateUI(data);
            
            loadingState.style.display = 'none';
            detailsContent.style.display = 'block';
        } else {
            alert("Error: " + result.message);
            window.location.href = 'borrowers.html';
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Failed to load customer details. Please check your connection.");
        window.location.href = 'borrowers.html';
    }
}

function populateUI(data) {
    // 1. Heading
    document.getElementById('customerName').textContent = data.personal.name;

    // 2. Personal Info
    document.getElementById('valName').textContent    = data.personal.name;
    document.getElementById('valPhone').textContent   = data.personal.phone;
    document.getElementById('valEmail').textContent   = data.personal.email;
    document.getElementById('valAddress').textContent = data.personal.address;

    // 3. Loan Info
    document.getElementById('valAmount').textContent  = `₹${data.loan.amount.toLocaleString()}`;
    document.getElementById('valTenure').textContent  = `${data.loan.tenure} Months`;
    document.getElementById('valPurpose').textContent = data.loan.purpose;
    document.getElementById('valAppliedAt').textContent = data.loan.applied_at;

    // Status Badge
    const status = data.loan.status;
    const statusClass = `status-${status.toLowerCase()}`;
    const statusWrap = document.getElementById('valStatusWrap');
    statusWrap.innerHTML = `
        <span class="badge-status ${statusClass}" style="font-size: 13px; padding: 6px 16px;">
            ${status}
        </span>
    `;

    // 4. KYC Info
    document.getElementById('valAadhaar').textContent   = data.kyc.aadhaar;
    document.getElementById('valPan').textContent       = data.kyc.pan;
    document.getElementById('valKycStatus').textContent = data.kyc.status;

    // 5. Bank Info
    document.getElementById('valBankAcc').textContent  = data.bank.account;
    document.getElementById('valBankIfsc').textContent = data.bank.ifsc;
    document.getElementById('valBankName').textContent = data.bank.bank;
}
