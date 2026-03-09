import os
import re

dashboard_dir = r'c:\Users\bobba\Documents\Web_Dealers\frontend\dashboard'
assets_css_path = '../assets/css/'
assets_js_path = '../assets/js/'

logout_html = """
        <div class="nav-section" style="margin-top:10px">Account</div>
        <a href="#" class="nav-item" onclick="logout()">
          <span class="nav-icon"><i class="ph ph-sign-out"></i></span> <span class="nav-label">Logout</span>
        </a>
      </nav>
"""

session_js = """
  <script>
    // Logout function
    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        alert('You have been logged out.');
        window.location.href = '../landing/index.html';
    }

    // Check session
    window.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            window.location.href = '../auth/login.html';
        }
    });
  </script>
</body>
"""

def fix_path_replacement(match):
    attr = match.group(1) # src or href
    path = match.group(2)
    # If it's already an absolute URL or already prefixed, leave it
    if path.startswith('http') or path.startswith('../assets/'):
        return f'{attr}="{path}"'
    
    # Determine which folder to prefix
    prefix = assets_css_path if path.endswith('.css') else assets_js_path
    return f'{attr}="{prefix}{path}"'

for filename in os.listdir(dashboard_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(dashboard_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Cleanup incorrect prefixes
        content = content.replace('../assets/js/https://', 'https://')
        content = content.replace('../assets/css/https://', 'https://')
        content = content.replace('../assets/css/../assets/css/', '../assets/css/')
        content = content.replace('../assets/js/../assets/js/', '../assets/js/')

        # Update CSS paths - only for files without http or prefix
        content = re.sub(r'(href)=["\'](?!http|../assets/)(.*?\.css)["\']', fix_path_replacement, content)
        
        # Update JS paths - only for files without http or prefix
        content = re.sub(r'(src)=["\'](?!http|../assets/)(.*?\.js)["\']', fix_path_replacement, content)

        # Fix sidebar navigation (ensure logout is added before </nav>)
        if 'Logout' not in content:
            content = content.replace('</nav>', logout_html)

        # Add session check and logout JS if not present
        if 'function logout()' not in content:
            content = content.replace('</body>', session_js)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Final batch update with double-prefix fixes complete.")
