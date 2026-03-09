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
revealOnScroll(); // Initial check
