const fs = require('fs');

const dashHtml = fs.readFileSync('dashboard.html', 'utf8');

const notifContent = `
      <div class="page-body active">
        <div class="card" style="max-width: 800px; margin: 0 auto; min-height: 60vh;">
          <div class="card-title" style="flex-direction:row; display:flex; justify-content:space-between; align-items:center;">
             <span style="font-size: 18px">Your Notifications</span>
             <button class="btn btn-outline btn-sm" id="clear-all-notif">Clear All</button>
          </div>
          <div id="notifications-list" class="notif-list">
             <!-- Notifications injected via JS -->
          </div>
        </div>
      </div>
`;

const blocks = dashHtml.split('<!-- DASHBOARD CONTENT -->');
if(blocks.length < 2) process.exit(1);

const headAndTop = blocks[0];
const rest1 = blocks[1];
const scriptsTail = rest1.split('</main>')[1];

let headerSection = headAndTop;
headerSection = headerSection.replace('<h1>Dashboard</h1>', '<h1>Notifications</h1>');
headerSection = headerSection.replace('<div class="topbar-sub">Welcome back, Arjun <i class="ph ph-hand-waving"></i></div>', '<div class="topbar-sub">Stay updated with your latest alerts</div>');
headerSection = headerSection.replace('<title>Dashboard — LoanPro</title>', '<title>Notifications — LoanPro</title>');
// In case of alternate titles
headerSection = headerSection.replace(/<title>.*?<\/title>/, '<title>Notifications — LoanPro</title>');

const finalHtml = headerSection + '\n' + notifContent + '\n    </main>\n' + scriptsTail;
fs.writeFileSync('notifications.html', finalHtml);
console.log('Created notifications.html');
