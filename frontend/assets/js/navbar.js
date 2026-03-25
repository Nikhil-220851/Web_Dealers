/**
 * navbar.js
 * Unified Navbar & Sidebar functionality for LoanPro
 * Handles sidebar toggling and active state highlighting.
 */

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Active State Highlighting
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'index.html';
    
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === pageName) {
            link.classList.add('nav-active');
            // Support for different class names used in different UIs
            link.classList.add('active'); 
        } else {
            // Remove active if it's not the current page
            // (especially important for cloned templates)
            link.classList.remove('nav-active');
            link.classList.remove('active');
        }
    });

    // 2. Ensure Overlay and Sidebar IDs are handled if toggle exists
    const hamburger = document.querySelector('.hamburger');
    if (hamburger && !hamburger.getAttribute('onclick')) {
        hamburger.addEventListener('click', toggleSidebar);
    }

    const overlay = document.getElementById('overlay');
    if (overlay && !overlay.getAttribute('onclick')) {
        overlay.addEventListener('click', closeSidebar);
    }
});
