











let dashboardListenersBound = false;

function setupDashboardListeners() {
  if (dashboardListenersBound) return;
  dashboardListenersBound = true;

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("identityBox").addEventListener("click", () => {
    window.navigateTo("/profile-detail");
  });

  
  const sourceLabels = {
    "module": "Module", "bh-piscine": "Piscine Go",
    "piscine-js": "Piscine JS", "piscine-rust": "Piscine Rust",
  };
  document.querySelectorAll(".source-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".source-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const source = btn.dataset.source;
      document.getElementById("heroTitle").textContent = `XP Trajectory — ${sourceLabels[source]}`;
      loadXPOverTimeChart(source);
      
      loadUplinkLog(source);
      loadSourceXPStat(source);
      loadProjectProgress(source);
    });
  });

  
  const loreLines = [
    `"Wake the f*** up, samurai. We have a commit to push."`,
    `"A happy commit? For folks like us? Wrong repo, wrong users"`,
    `"It's not the strength of the pc, choom, it's how you use it."`,
    `"Windows over Linux? Nah --. It's giving Arasaka. "`,
    `"you'll get a blue screen of death, choomba."`,
    `"The net doesn't forget. Neither does git log."`,
  ];
  let loreIdx = 0;
  setInterval(() => {
    loreIdx = (loreIdx + 1) % loreLines.length;
    const el = document.getElementById("loreQuote");
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = loreLines[loreIdx]; el.style.opacity = 1; }, 350);
  }, 6000);

  
  const sessionStart = Date.now();
  setInterval(() => {
    const s = Math.floor((Date.now() - sessionStart) / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    document.getElementById("sessionUptime").textContent = `UPLINK ${hh}:${mm}:${ss}`;
  }, 1000);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const sysMemAvailable = "deviceMemory" in navigator;
  const sysHeapAvailable = !!(performance && performance.memory);
  const totalRamGB = sysMemAvailable ? navigator.deviceMemory : null;

  function renderRam() {
    const el = document.getElementById("sysRamVal");
    const fill = document.getElementById("sysRamFill");
    if (!sysMemAvailable) {
      el.textContent = "n/a";
      el.title = "navigator.deviceMemory isn't supported in this browser";
      return;
    }
    let usedGB;
    if (sysHeapAvailable) {
      
      
      usedGB = performance.memory.usedJSHeapSize / 1073741824;
    } else {
      usedGB = 0;
    }
    const pct = Math.min(100, (usedGB / totalRamGB) * 100);
    fill.style.width = pct + "%";
    el.textContent = `${usedGB.toFixed(2)}/${totalRamGB} GB`;
    el.title = sysHeapAvailable
      ? "Used = this tab's JS heap (page-scope, not whole-system) · Total = navigator.deviceMemory"
      : "performance.memory isn't supported here, so 'used' can't be measured";
  }

  
  
  
  const CPU_SAMPLE_MS = 500;
  let cpuSmoothed = 0;
  let cpuLastTick = performance.now();
  function sampleCpu() {
    const now = performance.now();
    const drift = Math.max(0, (now - cpuLastTick) - CPU_SAMPLE_MS);
    cpuLastTick = now;
    const instant = Math.max(0, Math.min(100, (drift / CPU_SAMPLE_MS) * 100));
    cpuSmoothed = cpuSmoothed * 0.7 + instant * 0.3; 
    document.getElementById("sysCpuFill").style.width = cpuSmoothed + "%";
    document.getElementById("sysCpuVal").textContent = Math.round(cpuSmoothed) + "%";
    setTimeout(sampleCpu, CPU_SAMPLE_MS);
  }
  const coreCount = navigator.hardwareConcurrency;
  if (coreCount) {
    document.getElementById("sysCpuVal").title = `${coreCount} logical cores reported`;
  }

  
  
  function detectGpuName() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
      if (gl && ext) return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    } catch (e) {  }
    return null;
  }
  (function renderGpu() {
    const label = document.getElementById("sysGpuVal");
    const fill = document.getElementById("sysGpuFill");
    const name = detectGpuName();
    fill.style.width = "0%";
    fill.style.opacity = "0.25"; 
    label.textContent = name ? name.replace(/^ANGLE \(|\)$/g, "").split(",")[0] : "n/a";
    label.title = "Browsers don't expose GPU load to a webpage — this is the detected GPU/renderer instead";
  })();

  renderRam();
  setInterval(renderRam, CPU_SAMPLE_MS);
  sampleCpu();
}



function setupDashboard() {
  clearProfileTarget();
  loadProfile();
  loadPassFailChart(); 
  loadSkillsChart();
  loadAuditGauge();
  loadUplinkLog("module");
  loadXPOverTimeChart("module");
  loadProjectProgress();
}


document.addEventListener("breach:unlocked", () => {
  const payload = document.getElementById("breachPayload");
  if (payload) payload.classList.add("is-visible");
});
