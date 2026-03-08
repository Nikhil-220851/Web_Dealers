        /* ═══════════════════════════════════════════════
           PROFILE INTERACTIONS
        ═══════════════════════════════════════════════ */
        function selectLang(el) {
          el.closest('.lang-grid').querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
          el.classList.add('active');
        }
        function selectTheme(el) {
          el.closest('.theme-grid').querySelectorAll('.theme-opt').forEach(c => c.classList.remove('active'));
          el.classList.add('active');
        }
