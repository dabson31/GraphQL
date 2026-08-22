import { logout } from "../auth.js";
import { runBootSequence } from "../boot.js";
import { initTerminalEasterEgg } from "../terminal.js";
import {
  clearProfileTarget,
} from "../profile.js";
import {
  loadUplinkLog,
  loadXPOverTimeChart,
  loadSourceXPStat,
  loadProjectProgress,
  loadDashboardModule,
} from "../charts.js";

const SOURCE_LABELS = {
  "module": "Module", "bh-piscine": "Piscine Go",
  "piscine-js": "Piscine JS", "piscine-rust": "Piscine Rust",
};

const LORE_LINES = [
  `"Wake the f*** up, samurai. We have a commit to push."`,
  `"A happy commit? For folks like us? Wrong repo, wrong users"`,
  `"It's not the strength of the pc, choom, it's how you use it."`,
  `"Windows over Linux? Nah --. It's giving Arasaka. "`,
  `"you'll get a blue screen of death, choomba."`,
  `"The net doesn't forget. Neither does git log."`,
];

export default function ProfileView() {
  const wrapper = document.createElement("div");
  wrapper.className = "view-profile";
  wrapper.innerHTML = `
    <div class="bw-sweep"></div>

    <!-- boot sequence overlay, plays once on load then dissolves — see js/boot.js -->
    <div id="bootOverlay" class="boot-overlay">
      <div id="bootLines" class="boot-lines"></div>
    </div>

    <div class="dashboard">

      <!-- top bar: identity box (top-left) + logout (top-right) -->
      <div class="topbar">
        <button id="identityBox" class="identity-box hud-frame" title="Open netrunner profile">
          <span class="identity-dot"></span>
          <span class="identity-text">
            <span class="label">Netrunner ID</span>
            <span class="name" id="topName">LOADING...</span>
            <span class="identity-rank" id="topRank">--</span>
          </span>
          <span class="identity-uptime" id="sessionUptime">UPLINK 00:00:00</span>
        </button>

        <button id="logoutBtn" class="logout-btn">Disconnect</button>
      </div>

      <div class="title-band">
        <h1 class="glitch" data-text="NEURAL DASHBOARD">NEURAL DASHBOARD</h1>
        <div class="sub">blackwall relay // dynamic feed // tracks selected data source</div>
        <div class="boot-line">uplink stable · relay handshake ok · rendering 11 endpoints</div>
      </div>

      <!-- 6-col grid: left chart stack, center hero column, right chart stack —
           all three columns are stretched to end at the same y level, see
           .grid-layout / .center-visuals / .hero-column in style.css -->
      <div class="grid-layout">

        <!-- left column: skill matrix, data-source toggle, then the uplink log
             sitting under the toggle so the feed it's reporting on is directly
             above it instead of clear across the grid in the center column,
             with best skill under the log so it lines up with module xp and
             the hero substrip on the same bottom level -->
        <div class="center-visuals">
          <div class="chart-card hud-frame interactive-panel matrix-match" data-magnify>
            <span class="chart-title">Skill Matrix</span>
            <svg id="skillsChart" viewBox="0 0 260 196"></svg>
          </div>

          <div class="chart-card hud-frame source-toggle-card">
            <span class="chart-title">Data Source</span>
            <div class="source-toggle-list">
              <button class="source-btn active" data-source="module">MODULE</button>
              <button class="source-btn" data-source="bh-piscine">PISCINE GO</button>
              <button class="source-btn" data-source="piscine-js">PISCINE JS</button>
              <button class="source-btn" data-source="piscine-rust">PISCINE RUST</button>
            </div>
            <p class="source-hint">swaps the trajectory feed on the main graph</p>
          </div>

          <div class="chart-card hud-frame uplink-card interactive-panel" data-magnify>
            <span class="chart-title">Uplink Log</span>
            <div id="uplinkLog" class="uplink-log"></div>
          </div>

          <div class="stat-card stat-card-wide hud-frame interactive-panel" data-magnify data-icon="★" style="--icon-color:#fcee0a;">
            <span class="stat-label">Best Skill</span>
            <span class="stat-value stat-value-lg" id="stat-best-skill">--</span>
            <span class="stat-outline" id="stat-best-skill-outline">--</span>
            <span class="stat-sub">highest logged amount</span>
          </div>
        </div>

        <!-- center column: hero graph on top, then passed/failed + given/received
             side by side underneath it -->
        <div class="hero-column">
          <div class="hero-graph hud-frame">
            <div class="scan-line"></div>
            <span class="chart-title" id="heroTitle">XP Trajectory — Module</span>
            <svg id="xpChart" width="100%" height="100%" style="position:relative;z-index:1;"></svg>
          </div>

          <div class="hero-substrip">
            <div class="stat-card stat-card-half hud-frame interactive-panel" data-magnify data-icon="✓" style="--icon-color:#39ff8f;">
              <span class="stat-label">Projects Passed / Failed</span>
              <div class="stat-split">
                <div class="stat-split-item">
                  <span class="stat-value" id="stat-passed">--</span>
                  <span class="stat-sub">clean runs</span>
                </div>
                <div class="stat-split-divider"></div>
                <div class="stat-split-item">
                  <span class="stat-value" id="stat-failed">--</span>
                  <span class="stat-sub">flatlined attempts</span>
                </div>
              </div>
            </div>

            <div class="stat-card stat-card-half hud-frame interactive-panel" data-magnify data-icon="⇅" style="--icon-color:#00f0ff;">
              <span class="stat-label">XP Given / Received</span>
              <div class="stat-split">
                <div class="stat-split-item">
                  <span class="stat-value" id="stat-up">--</span>
                  <span class="stat-sub">audits you ran</span>
                </div>
                <div class="stat-split-divider"></div>
                <div class="stat-split-item">
                  <span class="stat-value" id="stat-down">--</span>
                  <span class="stat-sub">audits run on you</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card hud-frame project-progress-card interactive-panel">
            <span class="chart-title">Project Progress</span>
            <div class="project-progress-wrap">
              <div class="pp-row pp-header">
                <div class="pp-col pp-col-path">Project Path</div>
                <div class="pp-col pp-col-status">Status</div>
                <div class="pp-col pp-col-captain">Captain</div>
                <div class="pp-col pp-col-xp">XP</div>
              </div>
              <div class="pp-body" id="projectProgress"></div>
            </div>
            <div class="project-progress-pagination" id="projectProgressPagination">
              <button type="button" class="pp-page-btn" id="ppPrevBtn" aria-label="Previous page">‹</button>
              <span class="pp-page-label" id="ppPageLabel">Page 1 / 1</span>
              <button type="button" class="pp-page-btn" id="ppNextBtn" aria-label="Next page">›</button>
            </div>
          </div>
        </div>

        <!-- right column: pass/fail, audit gauge, street cred (with a system
             diagnostics readout tacked on below it), module xp — best skill
             now lives at the bottom of the left column instead -->
        <div class="center-visuals right">
          <div class="chart-card hud-frame interactive-panel matrix-match" data-magnify>
            <span class="chart-title">Pass / Fail</span>
            <svg id="passFailChart" viewBox="0 0 220 220"></svg>
          </div>
          <div class="chart-card hud-frame interactive-panel" data-magnify>
            <span class="chart-title">Audit Ratio</span>
            <svg id="auditGauge" viewBox="0 0 200 200"></svg>
          </div>
          <div class="chart-card hud-frame cred-card interactive-panel" data-magnify>
            <span class="chart-title">Street Cred</span>
            <div id="streetCred" class="cred-body"></div>

            <!-- simple divider line separating rank info from system diagnostics -->
            <div class="cred-divider"></div>

            <div class="sys-usage" id="sysUsage">
              <div class="sys-row">
                <span class="sys-label">RAM</span>
                <div class="sys-bar-track"><div class="sys-bar-fill" id="sysRamFill"></div></div>
                <span class="sys-value sys-value-num" id="sysRamVal">--/--</span>
              </div>
              <div class="sys-row">
                <span class="sys-label">GPU</span>
                <div class="sys-bar-track"><div class="sys-bar-fill" id="sysGpuFill"></div></div>
                <span class="sys-value" id="sysGpuVal">--%</span>
              </div>
              <div class="sys-row">
                <span class="sys-label">CPU</span>
                <div class="sys-bar-track"><div class="sys-bar-fill" id="sysCpuFill"></div></div>
                <span class="sys-value" id="sysCpuVal">--%</span>
              </div>
            </div>
          </div>

          <div class="stat-card stat-card-wide hud-frame interactive-panel" data-magnify data-icon="◆" style="--icon-color:#ff003c;">
            <span class="stat-label" id="stat-xp-label">Module XP</span>
            <span class="stat-value stat-value-lg" id="stat-xp">--</span>
            <span class="stat-outline" id="stat-xp-remainder">--</span>
            <span class="stat-sub">raw data transferred // tracks the active source feed</span>
          </div>
        </div>

      </div>

      <!-- bottom-left: night city references corner, rotating lore lines -->
      <div class="lore-corner hud-frame">
        <div class="lore-title">// samurai.dat</div>
        <div class="lore-line">
          <span class="lore-flicker" id="loreQuote">"Wake the f*** up, samurai. We have a city to burn."</span>
        </div>
        <div class="lore-line">Relic status: <span>STABLE</span> · Blackwall integrity: <span id="loreIntegrity">98.2%</span></div>
        <div class="lore-line" id="loreStatus">Chippin' in — connection secured via Afterlife relay node.</div>
      </div>

    </div>
  `;

  
  
  
  
  
  
  
  const timers = [];

  wrapper.querySelector("#logoutBtn").addEventListener("click", logout);
  wrapper.querySelector("#identityBox").addEventListener("click", () => {
    window.navigateTo("/profile-detail");
  });

  wrapper.querySelectorAll(".source-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrapper.querySelectorAll(".source-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const source = btn.dataset.source;
      wrapper.querySelector("#heroTitle").textContent = `XP Trajectory — ${SOURCE_LABELS[source]}`;
      loadXPOverTimeChart(source);
      
      loadUplinkLog(source);
      loadSourceXPStat(source);
      loadProjectProgress(source);
    });
  });

  
  let loreIdx = 0;
  timers.push(setInterval(() => {
    loreIdx = (loreIdx + 1) % LORE_LINES.length;
    const el = wrapper.querySelector("#loreQuote");
    if (!el) return;
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = LORE_LINES[loreIdx]; el.style.opacity = 1; }, 350);
  }, 6000));

  
  const sessionStart = Date.now();
  timers.push(setInterval(() => {
    const s = Math.floor((Date.now() - sessionStart) / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    const el = wrapper.querySelector("#sessionUptime");
    if (el) el.textContent = `UPLINK ${hh}:${mm}:${ss}`;
  }, 1000));

  
  
  
  
  
  
  const sysMemAvailable = "deviceMemory" in navigator;
  const sysHeapAvailable = !!(performance && performance.memory);
  const totalRamGB = sysMemAvailable ? navigator.deviceMemory : null;

  function renderRam() {
    const el = wrapper.querySelector("#sysRamVal");
    const fill = wrapper.querySelector("#sysRamFill");
    if (!el || !fill) return;
    if (!sysMemAvailable) {
      el.textContent = "n/a";
      el.title = "navigator.deviceMemory isn't supported in this browser";
      return;
    }
    const usedGB = sysHeapAvailable ? performance.memory.usedJSHeapSize / 1073741824 : 0;
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
  let cpuStopped = false;
  function sampleCpu() {
    if (cpuStopped) return;
    const now = performance.now();
    const drift = Math.max(0, (now - cpuLastTick) - CPU_SAMPLE_MS);
    cpuLastTick = now;
    const instant = Math.max(0, Math.min(100, (drift / CPU_SAMPLE_MS) * 100));
    cpuSmoothed = cpuSmoothed * 0.7 + instant * 0.3; 
    const fill = wrapper.querySelector("#sysCpuFill");
    const val = wrapper.querySelector("#sysCpuVal");
    if (fill) fill.style.width = cpuSmoothed + "%";
    if (val) val.textContent = Math.round(cpuSmoothed) + "%";
    setTimeout(sampleCpu, CPU_SAMPLE_MS);
  }
  const coreCount = navigator.hardwareConcurrency;
  if (coreCount) {
    const cpuVal = wrapper.querySelector("#sysCpuVal");
    if (cpuVal) cpuVal.title = `${coreCount} logical cores reported`;
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
    const label = wrapper.querySelector("#sysGpuVal");
    const fill = wrapper.querySelector("#sysGpuFill");
    const name = detectGpuName();
    fill.style.width = "0%";
    fill.style.opacity = "0.25"; 
    label.textContent = name ? name.replace(/^ANGLE \(|\)$/g, "").split(",")[0] : "n/a";
    label.title = "Browsers don't expose GPU load to a webpage — this is the detected GPU/renderer instead";
  })();

  renderRam();
  timers.push(setInterval(renderRam, CPU_SAMPLE_MS));
  sampleCpu();

  window.registerViewCleanup(() => {
    timers.forEach(clearInterval);
    cpuStopped = true;
  });

  
  
  
  
  
  wrapper.mount = () => {
    runBootSequence();
    initTerminalEasterEgg();
    clearProfileTarget();
    
    
    loadDashboardModule();
  };

  return wrapper;
}
