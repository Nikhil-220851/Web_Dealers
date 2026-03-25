const API_BASE = "../../../backend/api";

document.getElementById('addBorrowerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };

    const confirmPassword = document.getElementById('confirm_password').value;

    // Basic Validation
    if (data.password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }

    if (data.password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/add-user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.status === 'success') {
            alert("Borrower registered successfully!");
            window.location.href = "dashboard.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Failed to add borrower:", err);
        alert("An error occurred. Please try again.");
    }
});
