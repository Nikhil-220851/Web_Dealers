let otp = "";
let userEmail = "";
let time = 30;
let timerInterval;

function generateOTP() {
  let email = document.getElementById("email").value;

  userEmail = email;

  otp = Math.floor(100000 + Math.random() * 900000).toString();

  alert("Demo OTP: " + otp);

  document.getElementById("step1").style.display = "none";
  document.getElementById("step2").style.display = "block";

  document.getElementById("stepNum").innerText = "2";

  document.getElementById("bar2").classList.add("active");

  startTimer();
}

function startTimer() {
  time = 30;

  document.getElementById("resendBtn").disabled = true;

  timerInterval = setInterval(function () {
    time--;

    document.getElementById("timer").innerText = time;

    if (time <= 0) {
      clearInterval(timerInterval);

      document.getElementById("resendBtn").disabled = false;
    }
  }, 1000);
}

function regenerateOTP() {
  otp = Math.floor(100000 + Math.random() * 900000).toString();

  alert("New OTP: " + otp);

  for (let i = 1; i <= 6; i++) {
    document.getElementById("o" + i).value = "";
  }

  document.getElementById("o1").focus();

  startTimer();
}

function moveNext(current, nextId) {
  if (current.value.length == 1) {
    document.getElementById(nextId).focus();
  }
}

function verifyOTP() {
  let entered = "";

  for (let i = 1; i <= 6; i++) {
    entered += document.getElementById("o" + i).value;
  }

  if (entered !== otp) {
    alert("Invalid OTP. Please try again or resend OTP.");
    return;
  }

  document.getElementById("step2").style.display = "none";

  document.getElementById("step3").style.display = "block";

  document.getElementById("stepNum").innerText = "3";

  document.getElementById("bar3").classList.add("active");
}

function resetPassword() {
  let newPass = document.getElementById("newPassword").value;

  let confirm = document.getElementById("confirmPassword").value;

  if (newPass !== confirm) {
    alert("Passwords do not match");
    return;
  }

  let user = JSON.parse(localStorage.getItem(userEmail));

  if (user) {
    user.password = newPass;

    localStorage.setItem(userEmail, JSON.stringify(user));
  }

  alert("Password Reset Successful");

  window.location.href = "loginPage.html";
}
