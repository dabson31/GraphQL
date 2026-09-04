// (function () {
//   const overlay = document.getElementById("preBootOverlay");
//   const promptEl = document.getElementById("preBootPrompt");
//   if (!overlay || !promptEl) return;

//   if (sessionStorage.getItem("blackwall_preboot_seen")) {
//     overlay.remove();
//     return;
//   }

//   function proceed() {
//     sessionStorage.setItem("blackwall_preboot_seen", "1");
//     overlay.classList.add("fading");
//     setTimeout(() => overlay.remove(), 500);
//   }

//   promptEl.classList.add("show");
//   document.addEventListener("click", proceed, { once: true });
//   document.addEventListener("keydown", proceed, { once: true });
// })();