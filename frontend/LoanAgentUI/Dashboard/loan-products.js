// API_BASE is globally defined in admin-common.js
let allSchemes = [];

async function fetchSchemes() {
    const tbody = document.getElementById('schemesTableBody');
    try {
        const res = await fetch(`${API_BASE}/get-loan-products.php`);
        const result = await res.json();

        if (result.status === 'success') {
            allSchemes = result.data;
            renderSchemes(allSchemes);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${result.message}</td></tr>`;
        }
    } catch (err) {
        console.error("Failed to fetch schemes:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Network error. Failed to load schemes.</td></tr>`;
    }
}

function renderSchemes(list) {
    const tbody = document.getElementById('schemesTableBody');
    if (!tbody) return;
    
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No loan schemes found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => `
        <tr>
            <td><div style="font-weight:600; color:#1e293b;">${s.loan_name}</div></td>
            <td><span class="badge bg-light text-dark border">${s.bank_name}</span></td>
            <td>${s.loan_type}</td>
            <td><span style="font-weight:700; color:#8B0000;">${s.interest_rate}%</span></td>
            <td>${s.tenure} Months</td>
            <td>₹${s.min_amount.toLocaleString('en-IN')} - ₹${s.max_amount.toLocaleString('en-IN')}</td>
            <td style="text-align: center;">
                <button class="btn-delete-scheme" onclick="deleteScheme('${s.id}', '${s.loan_name}')" title="Delete Scheme">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteScheme(id, name) {
    if (!confirm(`Are you sure you want to delete the "${name}" loan scheme? This action cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/delete-loan-product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        const result = await res.json();
        if (result.status === 'success') {
            alert("Loan scheme deleted successfully!");
            fetchSchemes(); // Refresh list
        } else {
            alert("Cannot delete scheme: " + result.message);
        }
    } catch (err) {
        console.error("Deletion failed:", err);
        alert("A technical error occurred while trying to delete the scheme.");
    }
}

// Search Functionality
document.getElementById('schemeSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSchemes.filter(s => 
        s.loan_name.toLowerCase().includes(term) || 
        s.bank_name.toLowerCase().includes(term) ||
        s.loan_type.toLowerCase().includes(term)
    );
    renderSchemes(filtered);
});

document.addEventListener('DOMContentLoaded', fetchSchemes);
