export function initSandevistan() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

  const GHOST_MIN_VELOCITY = 0.55;   
  const GHOST_SPAWN_GAP_MS = 18;     
  const GHOST_LIFETIME_MS = 260;

  const layer = document.createElement("div");
  layer.className = "sdv-layer";
  document.body.appendChild(layer);

  let lastX = null, lastY = null, lastT = performance.now();
  let lastSpawnT = 0;

  function spawnGhost(x, y, angleDeg, speedNorm) {
    
    const offset = 3 + speedNorm * 5;
    const rad = (angleDeg * Math.PI) / 180;
    const ox = Math.cos(rad + Math.PI / 2) * offset;
    const oy = Math.sin(rad + Math.PI / 2) * offset;

    [
      { dx: ox, dy: oy, cls: "sdv-ghost-red" },
      { dx: -ox, dy: -oy, cls: "sdv-ghost-cyan" },
    ].forEach(({ dx, dy, cls }) => {
      const g = document.createElement("span");
      g.className = "sdv-ghost " + cls;
      g.style.left = x + dx + "px";
      g.style.top = y + dy + "px";
      g.style.setProperty("--sdv-scale", (0.6 + speedNorm * 0.9).toFixed(2));
      layer.appendChild(g);
      setTimeout(() => g.remove(), GHOST_LIFETIME_MS);
    });
  }

  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    const x = e.clientX, y = e.clientY;

    if (lastX === null) {
      lastX = x; lastY = y; lastT = now;
      return;
    }

    const dt = Math.max(1, now - lastT);
    const dx = x - lastX, dy = y - lastY;
    const dist = Math.hypot(dx, dy);
    const velocity = dist / dt; 

    if (velocity >= GHOST_MIN_VELOCITY && now - lastSpawnT >= GHOST_SPAWN_GAP_MS) {
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const speedNorm = Math.min(1, velocity / 3.5);
      spawnGhost(x, y, angleDeg, speedNorm);
      lastSpawnT = now;
    }

    lastX = x; lastY = y; lastT = now;
  }, { passive: true });
}