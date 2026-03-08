<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Be Visionary</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet"/>
  <style>
    body {
      font-family: 'Nunito', sans-serif;
      background: #f4f7ff;
      margin: 0;
    }

   
    .navbar {
      background: #fff;
      box-shadow: 0 2px 12px rgba(26,79,214,0.08);
      padding: 0.8rem 2rem;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      font-weight: 900;
      color: #1a4fd6;
      text-decoration: none;
    }

    .three-lines {
      display: flex;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .three-lines span {
      display: block;
      width: 26px;
      height: 3px;
      background: #1a4fd6;
      border-radius: 4px;
    }

    
    .sidebar {
      position: fixed;
      top: 0; left: -280px;
      width: 260px;
      height: 100vh;
      background: #fff;
      box-shadow: 4px 0 24px rgba(26,79,214,0.12);
      z-index: 9999;
      transition: left 0.35s ease;
    }
    .sidebar.open { left: 0; }

    .sidebar-header {
      background: #1a4fd6;
      padding: 1.5rem 1.2rem;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .sidebar-header small {
      opacity: 0.7;
      font-size: 0.78rem;
      font-weight: 400;
      display: block;
    }

    .sidebar a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.75rem 1.4rem;
      color: #0a1a4a;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    }
    .sidebar a .material-icons-round {
      font-size: 1.1rem;
      color: #1a4fd6;
      opacity: 0.75;
    }
    .sidebar a:hover {
      color: #1a4fd6;
      background: #e8f0ff;
      border-left-color: #1a4fd6;
    }
    .sidebar a:hover .material-icons-round { opacity: 1; }

    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      z-index: 9998;
    }
    .overlay.show { display: block; }

  
    .btn-login {
  border: 2px solid #1a4fd6;
  color: #1a4fd6;
  background: transparent;
  border-radius: 50px;  
  padding: 0.38rem 1.4rem;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.92rem;
  transition: all 0.2s;
}

.btn-started {
  background: #1a4fd6;
  color: #fff;
  border: 2px solid #1a4fd6;
  border-radius: 50px;  
  padding: 0.38rem 1.5rem;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.92rem;
  transition: all 0.2s;
}

    .btn-login:hover { background: #1a4fd6; color: #fff; }

    
 
    .btn-started:hover { background: #0f2f8a; border-color: #0f2f8a; color: #fff; }

  
    .hero {
      min-height: calc(100vh - 70px);
      background: linear-gradient(135deg, #f4f7ff 55%, #dce8ff 100%);
      display: flex;
      align-items: center;
    }

    
    .hero h1 {
  font-family: Arial, sans-serif;
  font-size: 64px;
  font-weight: 800;
  color: #0a1a4a;
  line-height: 1.2;
}

.hero h1 span{
  color:#1a4fd6;
}


    .hero p {
      color: #3a5080;
      font-size: 1.05rem;
      max-width: 460px;
      line-height: 1.7;
      margin-top: 1rem;
    }

    .badge-pill {
      display: inline-block;
      background: #e8f0ff;
      color: #1a4fd6;
      border-radius: 50px;
      padding: 0.3rem 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
    }

   

    .brand-name{
  font-size:26px;
  font-weight:800;
  text-decoration:none;
}

.logo-blue{
  color:#1a4fd6;
}

.logo-dark{
  color:#0a1a4a;
}
.hero-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
      border-left: 5px solid #1a4fd6;
      margin-bottom: 1rem;
    }
    .hero-card .lbl { font-size: 0.75rem; color: #8aa3c0; font-weight: 700; text-transform: uppercase; }
    .hero-card .val {  font-family: Arial, sans-serif; font-size: 1.6rem; font-weight: 900; color: #1a4fd6; }
    .hero-card .sub { font-size: 0.85rem; color: #3a5080; margin-top: 0.2rem; }
.reveal{
  opacity:0;
  transform:translateY(80px);
  transition:all 0.8s ease;
}

.reveal.active{
  opacity:1;
  transform:translateY(0);
}
.hero-card:nth-child(2){
transition-delay:0.3s;
}
.popular-loans{
background:linear-gradient(135deg,#eef3ff,#dce8ff);
}

.popular-loans h2{
font-weight:800;
color:#0a1a4a;
 font-family: Arial, sans-serif;
}



.loan-card{
background:#ffffff;
padding:30px 20px;
border-radius:18px;
box-shadow:0 10px 25px rgba(26,79,214,0.15);
transition:0.35s;
height:100%;
border:none;
 font-family: Arial, sans-serif;
}

.loan-card:hover{
transform:translateY(-10px);
box-shadow:0 18px 40px rgba(26,79,214,0.25);
}



.loan-icon{
width:65px;
margin-bottom:15px;
background:#e8f0ff;
padding:12px;
border-radius:50%;
}

.loan-card h5{
font-weight:700;
color:#1a4fd6;
margin-top:10px;
}

.loan-card p{
font-size:0.9rem;
color:#5f6f92;
}

  </style>
</head>
<body>


<div class="overlay" id="overlay" onclick="closeSidebar()"></div>


<div class="sidebar" id="sidebar">
  <div class="sidebar-header">
 
    <div class="d-flex align-items-center gap-3 mb-2">
      <div style="width:52px;height:52px;background:rgba(255,255,255,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.5);">
        <span class="material-icons-round" style="font-size:1.8rem;color:#fff;">account_circle</span>
      </div>
      <div>
        <!-- <div style="font-size:1rem;font-weight:700;">Ravi Kumar</div>
        <div style="font-size:0.78rem;opacity:0.75;">ravi@email.com</div> -->
        <span style="background:rgba(255,255,255,0.2);font-size:0.72rem;padding:0.1rem 0.6rem;border-radius:20px;margin-top:3px;display:inline-block;">Member</span>
      </div>
    </div>
  
    
  </div>
  <a href="#"><span class="material-icons-round">dashboard</span> Dashboard</a>
  <a href="#"><span class="material-icons-round">credit_card</span> Apply For Loans</a>
  <a href="#"><span class="material-icons-round">description</span> MY Loans</a>
  <a href="#"><span class="material-icons-round">account_balance</span> Payment History</a>
  <a href="#"><span class="material-icons-round">manage_accounts</span> My Account</a>
  <a href="#"><span class="material-icons-round">savings</span> My Contribution</a>
  <a href="#"><span class="material-icons-round">photo_library</span> Gallery</a>
  <a href="#"><span class="material-icons-round">bar_chart</span> Monthly Statements</a>
  <a href="#"><span class="material-icons-round">card_giftcard</span> My Rewards</a>
  <a href="#"><span class="material-icons-round">calculate</span> EMI Calculator</a>
  <a href="#"><span class="material-icons-round">cancel</span> Logout</a>
  <a href="#"><span class="material-icons-round">person</span> My Profile</a>
</div>


<nav class="navbar d-flex align-items-center justify-content-between">

  
  <div class="d-flex align-items-center gap-3">
    <button class="three-lines" onclick="toggleSidebar()">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <a href="#" class="brand-name">
  <span class="logo-blue">Loan</span><span class="logo-dark">Pro</span>
</a>

  </div>

  <div class="d-flex gap-2">
    <a href="#" class="btn-login">Login</a>
    <a href="#" class="btn-started">Get Started</a>
  </div>

</nav>


<section class="hero">
  <div class="container py-5">
    <div class="row align-items-center g-5">

 
      <div class="col-lg-6">
        <div class="badge-pill"><span class="material-icons-round" style="font-size:0.9rem;vertical-align:middle;">bolt</span> Fast &amp; Trusted Loan Platform</div>
        <h1>
          Simple &amp; Fast<br>
          <span>Loan Apply</span><br>
          Anytime, Anywhere.
        </h1>
        <p>
          Apply for loans in minutes with zero paperwork. Track your EMIs, contributions, and statements — all in one place.
        </p>
        <div class="d-flex gap-3 mt-4">
          <a href="#" class="btn-started" style="font-size:1rem;padding:0.7rem 1.8rem;">Get Started</a>
        
        </div>
      </div>



      <div class="col-lg-6 text-center">
  <img src="image.jpeg"
       class="img-fluid"
       style="max-height:420px;">
</div>

      

    </div>
  </div>
</section>
<section class="py-5">

<div class="container-fluid">

<div class="row g-4">

<div class="col-md-4">
<div class="hero-card reveal text-center">
<div class="lbl">Fast Approval</div>
<div class="val" style="font-size:1.2rem;color:#0a1a4a;">Get Loan in Minutes</div>
<div class="sub">Apply online and receive approval quickly without long paperwork.</div>
</div>
</div>

<div class="col-md-4">
<div class="hero-card reveal text-center">
<div class="lbl">Secure Platform</div>
<div class="val" style="font-size:1.2rem;color:#0a1a4a;">100% Safe & Trusted</div>
<div class="sub">Your data and transactions are protected with secure technology.</div>
</div>
</div>

<div class="col-md-4">
<div class="hero-card reveal text-center">
<div class="lbl">Flexible Repayment</div>
<div class="val" style="font-size:1.2rem;color:#0a1a4a;">Easy EMI Options</div>
<div class="sub">Choose repayment plans that suit your financial needs.</div>
</div>
</div>

</div>

</div>

</section>

  <section class="popular-loans py-5">
<div class="container">

<h2 class="text-center mb-5">Popular Loan Options</h2>

<div class="row g-4">

<div class="col-md-3">
<div class="loan-card text-center">
<img src="personal.jfif" class="loan-icon">
<h5>Personal Loan</h5>
<p>Quick cash for your personal needs with easy approval.</p>
</div>
</div>

<div class="col-md-3">
<div class="loan-card text-center">
<img src="home_loan.jpg" class="loan-icon">
<h5>Home Loan</h5>
<p>Affordable loans to help you buy your dream home.</p>
</div>
</div>

<div class="col-md-3">
<div class="loan-card text-center">
<img src="car_loan.webp" class="loan-icon">
<h5>Car Loan</h5>
<p>Drive your dream car with flexible repayment options.</p>
</div>
</div>

<div class="col-md-3">
<div class="loan-card text-center">
<img src="business_loan.jpg" class="loan-icon">
<h5>Business Loan</h5>
<p>Grow your business with fast and secure funding.</p>
</div>
</div>

</div>
</div>
</section>





<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  }


function revealOnScroll() {

  var reveals = document.querySelectorAll(".reveal");

  for (var i = 0; i < reveals.length; i++) {

    var windowHeight = window.innerHeight;
    var elementTop = reveals[i].getBoundingClientRect().top;
    var elementVisible = 100;

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }

  }
}

window.addEventListener("scroll", revealOnScroll);




</script>
</body>
</html>