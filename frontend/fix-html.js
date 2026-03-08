const fs = require('fs');

const pages = [
    'dashboard',
    'apply-loan',
    'my-loans',
    'payment-history',
    'emi-calculator',
    'profile',
    'help-center',
    'contact',
    'notifications'
];

const notifLink = '\n        <a href="notifications.html" class="nav-item">\n          <span class="nav-icon"><i class="ph ph-bell"></i></span> <span class="nav-label">Notifications</span>\n        </a>';

for (const page of pages) {
    const htmlFile = page + '.html';
    if (!fs.existsSync(htmlFile)) {
        console.log("Missing " + htmlFile);
        continue;
    }

    let content = fs.readFileSync(htmlFile, 'utf8');

    // Remove existing css links
    content = content.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
    
    // Remove existing scripts that are purely src
    content = content.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/gi, '');
    
    // Inject Notifications link above Help Center if not present
    if (!content.includes('href="notifications.html"')) {
        content = content.replace(
            /(<div class="nav-section"[^>]*>Support<\/div>)/,
            notifLink + '\n\n        $1'
        );
    }

    // Add correct HEAD tags just before </head>
    const headScripts = '\n  <script src="https://unpkg.com/@phosphor-icons/web"></script>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>\n  <link rel="stylesheet" href="base.css">\n  <link rel="stylesheet" href="' + page + '.css">\n';
    content = content.replace('</head>', headScripts + '</head>');

    // Add correct BODY scripts just before </body>
    const bodyScripts = '\n  <script src="base.js"></script>\n  <script src="' + page + '.js"></script>\n';
    content = content.replace('</body>', bodyScripts + '</body>');

    // Fix sidebar 'active' class (set all to normal)
    content = content.replace(/class="nav-item active"/g, 'class="nav-item"');
    
    // set active for current
    // We look for href="page.html" class="nav-item"
    const regex = new RegExp('href="' + htmlFile + '"\\s+class="nav-item"', 'g');
    content = content.replace(regex, 'href="' + htmlFile + '" class="nav-item active"');

    fs.writeFileSync(htmlFile, content);
    console.log("Updated " + htmlFile);
}
