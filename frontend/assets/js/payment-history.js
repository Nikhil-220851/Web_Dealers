/* ═══════════════════════════════════════════════
   PAYMENT HISTORY LOGIC
═══════════════════════════════════════════════ */

function initPaymentRows() {
  // Add txn-row class for hover effects
  document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.classList.add('txn-row');
  });
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initPaymentRows();
});
