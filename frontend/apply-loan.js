        /* ═══════════════════════════════════════════════
           APPLY FOR LOANS (NEW FLOW)
        ═══════════════════════════════════════════════ */
        let selectedLoanType = '';
        let selectedBank = '';

        function navApplyView(viewId) {
          document.querySelectorAll('.apply-view').forEach(v => v.classList.remove('active'));
          document.getElementById(viewId).classList.add('active');
        }

        function selectLoanType(type) {
          selectedLoanType = type;
          document.getElementById('lbl-type-bank').textContent = type;
          // Mock logic to display banks
          const allBanks = [
            { name: 'SBI', color: '#1E40AF', bg: '#DBEAFE' },
            { name: 'HDFC', color: '#065F46', bg: '#D1FAE5' },
            { name: 'ICICI', color: '#92400E', bg: '#FEF3C7' },
            { name: 'Axis', color: '#6D28D9', bg: '#EDE9FE' },
            { name: 'Kotak', color: '#BE185D', bg: '#FCE7F3' },
            { name: 'PNB', color: '#1D4ED8', bg: '#DBEAFE' }
          ];
          document.getElementById('banks-grid').innerHTML = allBanks.map(b => `
    <div class="bank-card" onclick="selectBank('${b.name}', this)">
      <div class="bank-logo-lg" style="background:${b.bg};color:${b.color}">${b.name}</div>
      <div class="bank-name">${b.name}</div>
      <div class="check-icon"><i class="ph-bold ph-check"></i></div>
    </div>
  `).join('');
          navApplyView('view-banks');
        }

        function selectBank(bank, element) {
          document.querySelectorAll('.bank-card').forEach(c => c.classList.remove('selected'));
          if(element) element.classList.add('selected');
          
          selectedBank = bank;
          
          setTimeout(() => {
            // Filter products by bank (fallback to all if no exact match for demo)
            let filtered = PRODUCTS.filter(p => p.bank === bank);
            if (filtered.length === 0) filtered = PRODUCTS;
  
            document.getElementById('products-list').innerHTML = filtered.map(p => `
      <div class="prod-card-rect ${p.featured ? 'featured' : ''}" onclick="showLoanDetails(${p.id})">
        <div class="prod-rect-left">
          <div class="bank-logo-lg" style="margin:0; width:48px; height:48px; background:${p.bankBg}; color:${p.bankColor}">${p.bank}</div>
          <div>
            <div class="font-bold d-family" style="font-size:16px">${p.type}</div>
            ${p.featured ? '<span class="badge badge-purple" style="margin-top:6px;display:inline-flex"><i class="ph-fill ph-star"></i> Best Match</span>' : '<span class="text-xs text-muted" style="margin-top:6px;display:inline-block">Standard Scheme</span>'}
          </div>
        </div>
        <div class="prod-rect-mid">
          <div><div class="text-xs text-muted mb-8">Interest Rate</div><div class="prod-rate" style="font-size:16px">${p.rate}</div></div>
          <div><div class="text-xs text-muted mb-8">Max Amount</div><div class="font-semi text-primary" style="font-size:15px">${p.max}</div></div>
          <div><div class="text-xs text-muted mb-8">Max Tenure</div><div class="font-semi text-primary" style="font-size:15px">${p.tenure}</div></div>
        </div>
        <div class="prod-rect-right">
          <button class="btn btn-outline" onclick="event.stopPropagation();showLoanDetails(${p.id})">See Details</button>
        </div>
      </div>
    `).join('');
            navApplyView('view-products');
          }, 350);
        }

        function showLoanDetails(id) {
          const p = PRODUCTS.find(x => x.id === id);
          currentLoan = p;
          document.getElementById('loan-details-content').innerHTML = `
    <div class="loan-detail-hero">
      <div class="badge" style="background:rgba(255,255,255,.2); color:#fff; border:1px solid rgba(255,255,255,.3); margin-bottom:12px">${p.bank}</div>
      <div class="ld-title">${p.type}</div>
      <div class="ld-sub">Get flexible repayment options and quick processing.</div>
      <div class="ld-stats">
        <div><div class="ld-stat-lbl">Interest Rate</div><div class="ld-stat-val">${p.rate}</div></div>
        <div><div class="ld-stat-lbl">Max Amount</div><div class="ld-stat-val">${p.max}</div></div>
        <div><div class="ld-stat-lbl">Max Tenure</div><div class="ld-stat-val">${p.tenure}</div></div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3><i class="ph-fill ph-star"></i> Key Features</h3>
      <ul class="sc-list">
        <li class="sc-item">Zero prepayment charges after 6 months</li>
        <li class="sc-item">100% digital process with minimum documentation</li>
        <li class="sc-item">Instant approval for pre-qualified customers</li>
        <li class="sc-item">Flexible EMI options based on your income</li>
      </ul>
    </div>
    
    <div style="text-align:right">
      <button class="btn btn-primary" style="padding:12px 24px; font-size:15px" onclick="openApplyModal(${p.id})">Apply for Loan →</button>
    </div>
  `;
          navApplyView('view-details');
        }

        /* ═══════════════════════════════════════════════
           APPLY MODAL
        ═══════════════════════════════════════════════ */
        function openApplyModal(id) {
          currentLoan = PRODUCTS.find(p => p.id === id);
          applyCurrentStep = 0;
          document.getElementById('apply-loan-info').innerHTML = `
    <div>
      <div class="font-bold" style="font-size:14px">${currentLoan.bank} — ${currentLoan.type}</div>
      <div class="text-sm text-muted">Rate: ${currentLoan.rate} p.a.</div>
    </div>`;
          const newId = 'LN-2024-' + (Math.floor(Math.random() * 900) + 100);
          document.getElementById('app-id').textContent = newId;
          // Set submission date
          const today = new Date();
          const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const dateEl = document.getElementById('app-submit-date');
          if (dateEl) dateEl.textContent = dateStr;
          document.getElementById('app-loan-amt').value = '';
          // Prefill KYC data into form
          prefillApplyForm();
          renderApplyStep(0);
          openModal('apply-modal');
        }

        function applyStep(n) {
          if (n === 2) {
            const amt = document.getElementById('app-loan-amt').value || '0';
            const name = document.getElementById('app-fullname').value || KYC_DATA.fullName;
            const dob = document.getElementById('app-dob').value || KYC_DATA.dobRaw;
            const phone = document.getElementById('app-phone').value || KYC_DATA.phone;
            const email = document.getElementById('app-email').value || KYC_DATA.email;
            const address = document.getElementById('app-address').value || KYC_DATA.address;
            const pan = document.getElementById('app-pan').value || KYC_DATA.pan;
            const aadhaar = document.getElementById('app-aadhaar').value || KYC_DATA.aadhaar;
            const bankname = document.getElementById('app-bankname').value || KYC_DATA.bankName;
            const account = document.getElementById('app-account').value || KYC_DATA.account;
            const ifsc = document.getElementById('app-ifsc').value || KYC_DATA.ifsc;
            const income = document.getElementById('app-income').value || '';
            const employment = document.getElementById('app-employment').value || 'Salaried';
            const fmtAmt = amt.includes('₹') ? amt : '₹' + parseInt(amt || 0).toLocaleString('en-IN');
            const dobDisplay = dob ? new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : dob;
            const rows = [
              ['Bank', currentLoan.bank],
              ['Loan Type', currentLoan.type],
              ['Interest Rate', currentLoan.rate + ' p.a.'],
              ['Full Name', name],
              ['Date of Birth', dobDisplay],
              ['Phone', phone],
              ['Email', email],
              ['PAN Number', pan],
              ['Aadhaar Number', aadhaar],
              ['Bank Name', bankname],
              ['Account Number', account],
              ['IFSC Code', ifsc],
              ['Address', address],
              ['Requested Amount', fmtAmt],
              ['Annual Income', income],
              ['Employment Type', employment],
            ];
            document.getElementById('confirm-rows').innerHTML = rows.map(([l, v]) =>
              `<div class="confirm-row"><span class="conf-lbl">${l}</span><span class="conf-val">${v}</span></div>`
            ).join('');
          }
          renderApplyStep(n);
        }

        function renderApplyStep(n) {
          applyCurrentStep = n;
          const titles = ['Terms & Conditions', 'Application Details', 'Verify Details', 'Application Submitted'];
          document.getElementById('apply-modal-title').textContent = titles[n];
          [0, 1, 2, 3].forEach(i => {
            document.getElementById('step-' + i).style.display = i === n ? 'block' : 'none';
            const circ = document.getElementById('sc-' + i);
            circ.className = 'step-circ ' + (i < n ? 'done' : i === n ? 'active' : 'todo');
            circ.textContent = i < n ? '✓' : i + 1;
            if (i < 3) document.getElementById('sl-' + i).className = 'step-line ' + (i < n ? 'done' : '');
          });
          // Re-trigger tick animation each time step 4 is shown
          if (n === 3) {
            const circle = document.getElementById('success-circle-anim');
            if (circle) {
              const clone = circle.cloneNode(true);
              circle.parentNode.replaceChild(clone, circle);
            }
          }
        }

        function downloadLoanPdf() {
          const appId = document.getElementById('app-id')?.textContent || 'LN-XXXX';
          const appDate = document.getElementById('app-submit-date')?.textContent || new Date().toLocaleDateString('en-IN');
          // Gather form values (fall back to KYC_DATA)
          const name = document.getElementById('app-fullname')?.value || KYC_DATA.fullName;
          const dob = document.getElementById('app-dob')?.value || KYC_DATA.dobRaw;
          const phone = document.getElementById('app-phone')?.value || KYC_DATA.phone;
          const email = document.getElementById('app-email')?.value || KYC_DATA.email;
          const address = document.getElementById('app-address')?.value || KYC_DATA.address;
          const pan = document.getElementById('app-pan')?.value || KYC_DATA.pan;
          const aadhaar = document.getElementById('app-aadhaar')?.value || KYC_DATA.aadhaar;
          const bankname = document.getElementById('app-bankname')?.value || KYC_DATA.bankName;
          const account = document.getElementById('app-account')?.value || KYC_DATA.account;
          const ifsc = document.getElementById('app-ifsc')?.value || KYC_DATA.ifsc;
          const income = document.getElementById('app-income')?.value || '';
          const loanAmt = document.getElementById('app-loan-amt')?.value || '';
          const employment = document.getElementById('app-employment')?.value || 'Salaried';
          const dobDisplay = dob ? (() => { try { return new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return dob; } })() : '';
          const fmtLoanAmt = loanAmt ? (loanAmt.includes('₹') ? loanAmt : '₹' + parseInt(loanAmt || 0).toLocaleString('en-IN')) : 'Not specified';

          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'mm', format: 'a4' });
          const W = 210, margin = 18;

          // Header band
          doc.setFillColor(108, 71, 255);
          doc.rect(0, 0, W, 36, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(255, 255, 255);
          doc.text('LoanPro', margin, 16);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Loan Application Form', margin, 25);
          doc.text('App ID: ' + appId, W - margin, 16, { align: 'right' });
          doc.text('Date: ' + appDate, W - margin, 25, { align: 'right' });

          // Status pill
          doc.setFillColor(34, 197, 94);
          doc.roundedRect(W - margin - 38, 28, 40, 7, 2, 2, 'F');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('✓  Submitted', W - margin - 18, 33, { align: 'center' });

          let y = 48;
          doc.setTextColor(26, 20, 51);

          function sectionHeader(label) {
            doc.setFillColor(238, 233, 255);
            doc.rect(margin, y, W - margin * 2, 9, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(74, 47, 224);
            doc.text(label, margin + 4, y + 6.5);
            y += 14;
            doc.setTextColor(26, 20, 51);
          }

          function row(label, value, col2) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(107, 100, 138);
            doc.text(label, col2 ? W / 2 + 4 : margin, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(26, 20, 51);
            doc.text(value || '—', col2 ? W / 2 + 4 : margin, y + 5);
            if (!col2) y += 14;
          }

          function rowPair(l1, v1, l2, v2) {
            row(l1, v1, false);
            y -= 14; // rewind
            row(l2, v2, true);
            y += 0; // already advanced
          }

          // Loan Information
          sectionHeader('🏦  Loan Information');
          rowPair('Bank', currentLoan ? currentLoan.bank : '', 'Loan Type', currentLoan ? currentLoan.type : '');
          rowPair('Interest Rate', currentLoan ? currentLoan.rate + ' p.a.' : '', 'Requested Amount', fmtLoanAmt);
          row('Employment Type', employment);
          row('Annual Income', income);

          // Applicant Details
          sectionHeader('👤  Applicant Details');
          rowPair('Full Name', name, 'Date of Birth', dobDisplay);
          rowPair('Phone Number', phone, 'Email Address', email);
          row('Address', address);

          // KYC Details
          sectionHeader('🆔  KYC & Bank Details');
          rowPair('PAN Number', pan, 'Aadhaar Number', aadhaar);
          rowPair('Bank Name', bankname, 'IFSC Code', ifsc);
          row('Account Number', account);

          // Footer
          doc.setDrawColor(228, 224, 245);
          doc.line(margin, 272, W - margin, 272);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(155, 148, 184);
          doc.text('This is a computer-generated document. LoanPro · support@loanpro.com', W / 2, 278, { align: 'center' });
          doc.text(appId + ' · Generated on ' + appDate, W / 2, 283, { align: 'center' });

          doc.save('LoanApplication_' + appId + '.pdf');
        }
