// ─────────────────────────────────────────────
// 1. Force English on first load (fix auto Telugu)
// ─────────────────────────────────────────────
function setDefaultLanguage() {
  const savedLang = localStorage.getItem("selectedLang");

  // If user never selected → force English
  if (!savedLang) {
    document.cookie = "googtrans=/en/en;path=/";
  }
}
setDefaultLanguage();


// ─────────────────────────────────────────────
// 2. Google Translate Init
// ─────────────────────────────────────────────
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,te,hi,ta,kn,mr',
    autoDisplay: false
  }, 'google_translate_element');
}


// ─────────────────────────────────────────────
// 3. Change Language (Button Click)
// ─────────────────────────────────────────────
function changeLang(lang) {
  localStorage.setItem("selectedLang", lang);

  const interval = setInterval(() => {
    const select = document.querySelector(".goog-te-combo");

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      clearInterval(interval);
    }
  }, 500);
}


// ─────────────────────────────────────────────
// 4. Apply Saved Language on Page Load
// ─────────────────────────────────────────────
window.addEventListener("load", () => {
  const savedLang = localStorage.getItem("selectedLang");

  // If no saved language OR English → do nothing
  if (!savedLang || savedLang === "en") return;

  const interval = setInterval(() => {
    const select = document.querySelector(".goog-te-combo");

    if (select) {
      select.value = savedLang;
      select.dispatchEvent(new Event("change"));
      clearInterval(interval);
    }
  }, 500);
});


// ─────────────────────────────────────────────
// 5. Hide Google Translate UI (auto remove)
// ─────────────────────────────────────────────
setInterval(() => {
  const el = document.getElementById("google_translate_element");
  if (el) el.style.display = "none";

  const banner = document.querySelector(".goog-te-banner-frame");
  if (banner) banner.style.display = "none";

  document.body.style.top = "0px";
}, 500);