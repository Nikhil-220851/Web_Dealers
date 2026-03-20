document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const sendBtn = document.querySelector('.btn-send-message');
    const originalBtnText = sendBtn ? sendBtn.innerHTML : 'Send Message';

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            clearErrors();

            // Collect values
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
            };

            // Validation
            let isValid = true;
            
            if (!formData.name) {
                showError('name', 'Name is required');
                isValid = false;
            }
            
            if (!formData.email) {
                showError('email', 'Email is required');
                isValid = false;
            } else if (!isValidEmail(formData.email)) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            }
            
            if (!formData.subject) {
                showError('subject', 'Subject is required');
                isValid = false;
            }
            
            if (!formData.message) {
                showError('message', 'Message is required');
                isValid = false;
            } else if (formData.message.length < 10) {
                showError('message', 'Message must be at least 10 characters');
                isValid = false;
            }

            if (!isValid) return;

            // Loading state
            setLoading(true);

            // Send request
            fetch('../../backend/api/contact/send_message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                setLoading(false);
                if (data.success) {
                    showToast('Your message has been sent to LoanPro support.', 'success');
                    contactForm.reset();
                } else {
                    showToast(data.message || 'Something went wrong. Please try again.', 'error');
                }
            })
            .catch(error => {
                setLoading(false);
                console.error('Error:', error);
                showToast('Something went wrong. Please try again.', 'error');
            });
        });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = 'var(--red)';
            const wrap = field.closest('.input-wrap');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-msg';
            errorDiv.style.color = 'var(--red)';
            errorDiv.style.fontSize = '11px';
            errorDiv.style.marginTop = '4px';
            errorDiv.textContent = message;
            wrap.appendChild(errorDiv);
        }
    }

    function clearErrors() {
        document.querySelectorAll('.error-msg').forEach(el => el.remove());
        document.querySelectorAll('.input-field').forEach(el => el.style.borderColor = '');
    }

    function setLoading(isLoading) {
        if (sendBtn) {
            if (isLoading) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<i class="ph ph-circle-notch spinning"></i> Sending...';
                sendBtn.style.opacity = '0.7';
            } else {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalBtnText;
                sendBtn.style.opacity = '1';
            }
        }
    }

    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Basic toast styling if not present in CSS
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            background: type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: type === 'success' ? '#15803D' : '#B91C1C',
            border: `1px solid ${type === 'success' ? '#86EFAC' : '#FECACA'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            opacity: '0',
            transform: 'translateY(-20px)'
        });

        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});

// Add rotation animation for spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spinning {
        animation: spin 1s linear infinite;
        display: inline-block;
    }
`;
document.head.appendChild(style);
