/**
 * Borrower Auth Guard
 * Include this script FIRST on protected dashboard pages.
 * Redirects to login if user is not authenticated.
 */
(function() {
  const path = window.location.pathname;
  const isProtected = /\/dashboard\//.test(path) || /\/borrower\//.test(path);
  if (!isProtected) return;

  const userId = localStorage.getItem('userId');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!userId || isLoggedIn !== 'true') {
    window.location.replace('../auth/login.html');
  }
})();
