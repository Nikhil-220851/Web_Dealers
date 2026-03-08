        /* ═══════════════════════════════════════════════
           MY LOANS TABLE
        ═══════════════════════════════════════════════ */
        function switchLoanTab(tab, btn) {
          loanTab = tab;
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderLoansTable(tab);
        }

        function renderLoansTable(tab) {
          const filtered = LOANS.filter(l => l.status === tab);
          const badgeMap = { accepted: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red' };
          const labelMap = { accepted: 'Accepted', pending: 'Pending', rejected: 'Rejected' };
          const wrap = document.getElementById('loans-table-wrap');
          if (!filtered.length) {
            wrap.innerHTML = '<div class="empty-state"><span class="empty-icon"><i class="ph ph-clipboard-text"></i></span><p>No ' + tab + ' loans yet</p></div>';
            return;
          }
          wrap.innerHTML = `<table class="data-table">
    <thead><tr><th>Loan ID</th><th>Bank</th><th>Loan Type</th><th>Amount</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      ${filtered.map(l => `<tr>
        <td><span class="loan-id">${l.id}</span></td>
        <td class="font-semi">${l.bank}</td>
        <td>${l.type}</td>
        <td class="font-bold">${l.amount}</td>
        <td class="text-muted">${l.date}</td>
        <td><span class="badge ${badgeMap[l.status]}">${labelMap[l.status]}</span></td>
        <td><div class="flex gap-8">
          <button class="btn btn-ghost btn-sm">View</button>
          ${l.status === 'accepted' ? '<button class="btn btn-outline btn-sm" onclick="openModal(\'pay-modal\')"><span>Pay EMI</span></button>' : ''}
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
        }
