import shutil
import os

src = r'c:\xampp\htdocs\LMS_Web\Web_Dealers\frontend\LoanAgentUI'
dst = r'c:\xampp\htdocs\LMS_Web\Web_Dealers\frontend\EmployeeUI'

print("Starting copy...")
if os.path.exists(dst):
    shutil.rmtree(dst)
shutil.copytree(src, dst)
print("Finished copy.")

# Now replace text
def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {filepath} due to read error: {e}")
        return

    orig_content = content
    content = content.replace('Loan Agent', 'Bank Employee')
    content = content.replace('LoanAgentUI', 'EmployeeUI')
    content = content.replace('Agent Dashboard', 'Employee Dashboard')
    content = content.replace('agent-common.js', 'emp-common.js')
    content = content.replace('--primary: #8B0000;', '--primary: #4C1D95;')
    content = content.replace('--primary-mid: #A52A2A;', '--primary-mid: #6D28D9;')
    content = content.replace('--primary-dark: #600000;', '--primary-dark: #3B0764;')

    if content != orig_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(dst):
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.php')):
            replace_in_file(os.path.join(root, file))

# Rename agent-common.js to emp-common.js
old_js = os.path.join(dst, 'Dashboard', 'agent-common.js')
new_js = os.path.join(dst, 'Dashboard', 'emp-common.js')
if os.path.exists(old_js):
    os.rename(old_js, new_js)
    print("Renamed agent-common.js to emp-common.js")

print("All done.")
