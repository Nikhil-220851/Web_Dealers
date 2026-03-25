/* ═══════════════════════════════════════
   LoanPro Agent — borrowers.js
   Manages "My Customers" table with search & filtering
   Base API provided by admin-common.js
═══════════════════════════════════════ */

let customersData = [];
let searchTimeout = null;

// 1. Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchCustomers();
});

// 2. Fetch Customers from API
async function fetchCustomers() {
    const search = document.getElementById('searchInput').value;
    const status = document.getElementById('statusFilter').value;

    const tbody = document.getElementById('customersTableBody');
    // Show spinner if not already there (only on initial or empty load)
    if (tbody.innerHTML === '' || tbody.innerText === 'No customers found.') {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">
            <div class="spinner-border text-danger" role="status"></div>
        </td></tr>`;
    }

    try {
        const url = `${API_BASE}/loanagent-get-customers.php?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`;
        const res = await fetch(url);
        const result = await res.json();

        if (result.status === 'success') {
            customersData = result.data;
            renderTable(customersData);
        } else {
            console.error("API Error:", result.message);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
                Error loading customers: ${result.message}
            </td></tr>`;
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
            Failed to connect to server.
        </td></tr>`;
    }
}

// 3. Render Table Rows
function renderTable(data) {
    const tbody = document.getElementById('customersTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    // Update Summary Cards
    updateSummary(data);

    if (!data || data.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Status Badge Logic
        const status = item.status.toUpperCase();
        const statusClass = status.toLowerCase(); // approved, pending, rejected
        const icon = getStatusIconFA(status);
        
        row.innerHTML = `
            <td style="font-weight: 700; color: #1e293b;">${item.customer_name}</td>
            <td style="color: #64748b; font-family: monospace;">${item.phone}</td>
            <td style="font-weight: 800; color: #8B0000;">₹${item.loan_amount.toLocaleString()}</td>
            <td>
                <span class="badge ${statusClass}">
                    <i class="${icon}"></i>
                    ${status}
                </span>
            </td>
            <td style="font-size: 13px; color: #94a3b8;">${item.date}</td>
            <td style="text-align: center;">
                <button class="view-btn" onclick="viewDetails('${item.loan_id}')">
                    View Details
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateSummary(data) {
    const total = data.length || 0;
    const approved = data.filter(i => i.status.toUpperCase() === 'APPROVED').length || 0;
    const pending = data.filter(i => i.status.toUpperCase() === 'PENDING').length || 0;

    document.getElementById('totalCustomers').innerText = total;
    document.getElementById('approvedLoans').innerText = approved;
    document.getElementById('pendingLoans').innerText = pending;
}

function getStatusIconFA(status) {
    switch(status) {
        case 'APPROVED': return 'fas fa-check-circle';
        case 'PENDING':  return 'fas fa-clock';
        case 'REJECTED': return 'fas fa-times-circle';
        default: return 'fas fa-question-circle';
    }
}

// 4. Search Handler (Debounced)
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    // Show/hide clear button
    if (searchInput.value.length > 0) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchCustomers();
    }, 400); // 400ms debounce
}

// 4.1 Clear Search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    document.getElementById('clearSearch').style.display = 'none';
    searchInput.focus();
    fetchCustomers();
}

// 5. Filter Handler
function handleFilter() {
    fetchCustomers();
}

// 6. Navigation to Details
function viewDetails(loanId) {
    window.location.href = `borrower-details.html?id=${loanId}`;
}
