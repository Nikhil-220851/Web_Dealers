

// assets/js/firebase-config.js — safe version with timing fix

let firebaseReady = false;

async function initFirebase() {
  try {
    const response = await fetch('../../backend/api/firebase-config-public.php');
    const config   = await response.json();

    if (config.error) {
      console.error("Firebase config error:", config.error);
      return;
    }

    firebase.initializeApp(config);
    firebaseReady = true;
    console.log("Firebase initialized ✓");

  } catch (err) {
    console.error("Firebase config load failed:", err);
  }
}

initFirebase();