  /* Cursor glow */
  const glow = document.getElementById('cursorGlow');
  document.addEventListener('mousemove', e => { glow.style.left = e.clientX+'px'; glow.style.top = e.clientY+'px'; });

 

  /* Navbar scroll */
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  });

  /* Scroll reveal + progress bars */
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const delay = parseFloat(e.target.style.transitionDelay||0)*1000;
      setTimeout(() => {
        e.target.classList.add('vis');
        e.target.querySelectorAll('.wp-fill').forEach(b => { b.style.width = b.dataset.width+'%'; });
      }, delay);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.sr').forEach(el => ro.observe(el));

  /* ── Hero particles ── */
  
  /* Keep bg hero particles */
const heroSection=document.querySelector('.hero');

if(heroSection){
 for(let i=0;i<8;i++){
   const p=document.createElement('div');
   p.className='particle';
   p.style.cssText=`left:${Math.random()*100}%;bottom:0%;width:${3+Math.random()*5}px;height:${3+Math.random()*5}px;animation-duration:${10+Math.random()*12}s;animation-delay:${Math.random()*10}s;`;
   heroSection.appendChild(p);
 }
}


 

  
  /* Animated counters */
  const co = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimal||0);
      const pre = el.dataset.prefix||'';
      const suf = el.dataset.suffix||'';
      const dur = 2000, t0 = performance.now();
      const tick = t => {
        const p = Math.min((t-t0)/dur,1);
        const ease = 1-Math.pow(1-p,3);
        const v = ease*target;
        el.textContent = pre+(dec?v.toFixed(dec):Math.floor(v).toLocaleString('en-IN'))+suf;
        if(p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      co.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => co.observe(el));

  /* EMI Calculator */
  function updateSlider(s){ const pct=((s.value-s.min)/(s.max-s.min))*100; s.style.setProperty('--pct',pct+'%'); }
  function calcEMI(){
    const P=+document.getElementById('amtSlider').value;
    const n=+document.getElementById('tenSlider').value*12;
    const r=+document.getElementById('rateSlider').value/12/100;
    ['amtSlider','tenSlider','rateSlider'].forEach(id=>updateSlider(document.getElementById(id)));
    const emi = r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    const total=emi*n, interest=total-P;
    const fmt=v=>'₹'+Math.round(v).toLocaleString('en-IN');
    document.getElementById('emiVal').textContent=fmt(emi);
    document.getElementById('calcPrin').textContent=fmt(P);
    document.getElementById('calcInt').textContent=fmt(interest);
    document.getElementById('calcTotal').textContent=fmt(total);
    document.getElementById('calcTen').textContent=document.getElementById('tenSlider').value+' years';
    document.getElementById('amtLabel').textContent=fmt(P);
    document.getElementById('tenLabel').textContent=document.getElementById('tenSlider').value+' years';
    document.getElementById('rateLabel').textContent=document.getElementById('rateSlider').value+'%';
  }
  ['amtSlider','tenSlider','rateSlider'].forEach(id=>document.getElementById(id).addEventListener('input',calcEMI));
  calcEMI();
