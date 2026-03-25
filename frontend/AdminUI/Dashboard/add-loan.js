const API_BASE = "../../../backend/api";

document.getElementById('addLoanForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        loan_name: document.getElementById('loan_name').value,
        bank_name: document.getElementById('bank_name').value,
        loan_type: document.getElementById('loan_type').value,
        interest_rate: parseFloat(document.getElementById('interest_rate').value),
        tenure: parseInt(document.getElementById('tenure').value),
        min_amount: parseFloat(document.getElementById('min_amount').value),
        max_amount: parseFloat(document.getElementById('max_amount').value),
        processing_fee: parseFloat(document.getElementById('processing_fee').value),
        description: document.getElementById('description').value
    };

    // Frontend Validation
    if (data.min_amount >= data.max_amount) {
        alert("Min amount cannot be greater than or equal to max amount");
        return;
    }
    if (data.interest_rate <= 0 || data.tenure <= 0) {
        alert("Interest rate and tenure must be positive values");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/add-loan-product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.status === 'success') {
            alert("Loan scheme added successfully!");
            window.location.href = "dashboard.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Failed to add loan scheme:", err);
        alert("An error occurred. Please try again.");
    }
});
