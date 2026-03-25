function goToManual() {
  window.location.href = "user-manual.html";
}

function goBack() {
  window.history.back();
}

// Logic for document modal (original)
function openDocumentViewer(type) {
    const modal = document.getElementById('document-modal');
    const title = document.getElementById('document-title');
    const content = document.getElementById('document-content');
    
    if (type === 'manual') {
        goToManual(); // Redirect instead of opening modal
        return;
    }
    
    modal.classList.remove('hidden');
}

function closeDocumentViewer() {
    document.getElementById('document-modal').classList.add('hidden');
}
