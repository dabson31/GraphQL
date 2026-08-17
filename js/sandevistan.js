(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

  const GHOST_MIN_VELOCITY = 0.55;   // px/ms below this, no trail spawns at all
  const GHOST_SPAWN_GAP_MS = 18;     // min time between spawned ghost pairs
  const GHOST_LIFETIME_MS = 260;
  const BURST_VELOCITY = 2.6;        // px/ms flick speed that triggers the full burst
  const BURST_COOLDOWN_MS = 900;

  const layer = document.createElement("div");
  layer.className = "sdv-layer";
  document.body.appendChild(layer);

  let lastX = null, lastY = null, lastT = performance.now();
  let lastSpawnT = 0;
  let lastBurstT = 0;

  function spawnGhost(x, y, angleDeg, speedNorm) {
    // two offset copies, red pushed one way, cyan the other, same split
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

  function spawnBurst(x, y, angleDeg) {
    document.body.classList.add("sdv-burst-active");
    setTimeout(() => document.body.classList.remove("sdv-burst-active"), 260);

    const lines = document.createElement("div");
    lines.className = "sdv-speedlines";
    lines.style.left = x + "px";
    lines.style.top = y + "px";
    lines.style.setProperty("--sdv-angle", angleDeg + "deg");
    layer.appendChild(lines);
    setTimeout(() => lines.remove(), 420);
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
    const velocity = dist / dt; // px per ms

    if (velocity >= GHOST_MIN_VELOCITY && now - lastSpawnT >= GHOST_SPAWN_GAP_MS) {
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const speedNorm = Math.min(1, velocity / 3.5);
      spawnGhost(x, y, angleDeg, speedNorm);
      lastSpawnT = now;
    }

    if (velocity >= BURST_VELOCITY && now - lastBurstT >= BURST_COOLDOWN_MS) {
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      spawnBurst(x, y, angleDeg);
      lastBurstT = now;
    }

    lastX = x; lastY = y; lastT = now;
  }, { passive: true });
})();
