document.addEventListener("DOMContentLoaded", function(){

const firstname = localStorage.getItem("firstname");
const lastname  = localStorage.getItem("lastname");
const email     = localStorage.getItem("userEmail");
const phone     = localStorage.getItem("phoneno");
const userid    = localStorage.getItem("userId");

document.getElementById("name").textContent = firstname + " " + lastname;
document.getElementById("email").textContent = email;
document.getElementById("phone").textContent = phone;
document.getElementById("userid").textContent = userid;


/* CREDIT SCORE METER */

const score = 726;

const ctx = document.getElementById('scoreChart').getContext('2d');

new Chart(ctx,{
type:'doughnut',
data:{
datasets:[{
data:[score-300,900-score],
backgroundColor:["#06b6d4","#e5e7eb"],
borderWidth:0
}]
},
options:{
circumference:180,
rotation:270,
cutout:'70%',
plugins:{
tooltip:{enabled:false},
legend:{display:false}
}
}
});

});


function goBack(){
window.location.href="dashboard.html";
}

