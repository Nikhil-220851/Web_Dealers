/**
 * Unified Razorpay Checkout Helper
 * Handles order creation, modal management, and verification.
 */

async function initiateRazorpayPayment(loanId, amount, emiId) {
    console.log(`Initiating payment for Loan: ${loanId}, EMI: ${emiId}, Amount: ${amount}`);

    // 1. UI Loading State & Data Recovery
    const payBtn = document.querySelector(`[data-emi-pay-btn][data-loan-id="${loanId}"]`);
    
    // Fallback: If amount/emiId are missing, try to get from button attributes
    if (!amount && payBtn) amount = parseFloat(payBtn.getAttribute('data-amount')) || 0;
    if (!emiId && payBtn) emiId = payBtn.getAttribute('data-emi-id') || '';

    const originalText = payBtn ? payBtn.innerHTML : 'Pay EMI';
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Processing...';
    }

    try {
        // 2. Create Razorpay Order
        const amountPaise = Math.round(amount * 100);
        const orderRes = await fetch(`../../backend/razorpay/create_order.php?amount=${amountPaise}`);
        const orderData = await orderRes.json();

        if (!orderData.success) {
            throw new Error(orderData.error || 'Failed to create payment order');
        }

        // 3. Open Razorpay Checkout
        const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'LoanPro',
            description: `EMI Payment - Loan #${loanId}`,
            order_id: orderData.order_id,
            prefill: {
                name: localStorage.getItem('userName') || '',
                email: localStorage.getItem('userEmail') || '',
                contact: localStorage.getItem('userPhone') || ''
            },
            theme: { color: '#6C47FF' },
            handler: async function (response) {
                // 4. Success Handler: Verify and Process
                if (payBtn) payBtn.innerHTML = '<i class="ph ph-check-circle"></i> Verifying...';
                
                try {
                    const verifyRes = await fetch(`../../backend/api/verify-and-process.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            loan_id: loanId,
                            user_id: localStorage.getItem('userId'),
                            emi_id: emiId,
                            amount: amount
                        })
                    });

                    const json = await verifyRes.json();

                    if (json.status === 'success') {
                        // Success Feedback
                        if (payBtn) {
                            payBtn.innerHTML = '<i class="ph ph-check"></i> Success';
                            payBtn.classList.remove('btn-primary');
                            payBtn.classList.add('btn-success');
                        }
                        
                        showSuccessToast("Payment processed successfully!");
                        
                        // Reload data or page after delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        throw new Error(json.message || 'Verification failed');
                    }
                } catch (err) {
                    handlePaymentError(err.message, payBtn, originalText);
                }
            },
            modal: {
                ondismiss: function () {
                    console.log('Checkout dismissed');
                    if (payBtn) {
                        payBtn.disabled = false;
                        payBtn.innerHTML = originalText;
                    }
                }
            }
        };

        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
            handlePaymentError(response.error.description, payBtn, originalText);
        });

        rzp.open();

    } catch (e) {
        handlePaymentError(e.message, payBtn, originalText);
    }
}

function handlePaymentError(msg, btn, originalText) {
    console.error('Payment Error:', msg);
    alert('Payment Error: ' + msg);
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function showSuccessToast(msg) {
    // Simple alert for now, can be replaced by a custom toast
    console.log('SUCCESS:', msg);
}
