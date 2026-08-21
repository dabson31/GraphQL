(function () {
  const overlay = document.getElementById("preBootOverlay");
  const promptEl = document.getElementById("preBootPrompt");
  if (!overlay || !promptEl) return;

  function proceed() {
    overlay.classList.add("fading");
    setTimeout(() => overlay.remove(), 500);
  }

  promptEl.classList.add("show");
  document.addEventListener("click", proceed, { once: true });
  document.addEventListener("keydown", proceed, { once: true });
})();

