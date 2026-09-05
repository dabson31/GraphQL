// let dashboardListenersBound = false;

// /**
//  * an initializer for all the dashboard elements. It guards itself
//  * with the module-level flag dashboardListenersBound that's set as
//  * false originally then changes to true, in order to run once only.
//  * After that, it binds the logout button and the identity box(prof details)
//  * then, it binds each .source-btn (which are the data sources) to their
//  * respective source accordingly so that clickong one updates: the active
//  * button, the hero title, the XP chart (Reloads), uplink log, XP stat, and
//  * the project progress for said clicked source.
//  * It then starts an interval that cycles the bottom  left lore quotes every
//  * 6 seconds. And starts a 1 second interval that renders a live session uptime click
//  * on the identity box. It then sets the "system monitor" that uses renderRam() (which
//  * reads the navigator.deviceMemory for the ram info), sampleCpu() (which estimates the cpu
//  * load from js event-loop timing drift) and detectGpuName (uses WebGL
//  * debug extention to read the renderer string) and the renderGpu() which is an iffe (immediately invoked function expression) 
//  * 
//  * @returns undefined (just DOM updates and event bindings)
//  */

// function setupDashboardListeners() {
//   if (dashboardListenersBound) return;
//   dashboardListenersBound = true;

//   document.getElementById("logoutBtn").addEventListener("click", logout);
//   document.getElementById("identityBox").addEventListener("click", () => {
//     window.navigateTo("/profile-detail");
//   });

  
//   const sourceLabels = {
//     "module": "Module", "bh-piscine": "Piscine Go",
//     "piscine-js": "Piscine JS", "piscine-rust": "Piscine Rust",
//   };
//   document.querySelectorAll(".source-btn").forEach(btn => {
//     btn.addEventListener("click", () => {
//       document.querySelectorAll(".source-btn").forEach(b => b.classList.remove("active"));
//       btn.classList.add("active");
//       const source = btn.dataset.source;
//       document.getElementById("heroTitle").textContent = `XP Trajectory — ${sourceLabels[source]}`;
//       loadXPOverTimeChart(source);
      
//       loadUplinkLog(source);
//       loadSourceXPStat(source);
//       loadProjectProgress(source);
//     });
//   });

  
//   const loreLines = [
//     `"Wake the f*** up, samurai. We have a commit to push."`,
//     `"A happy commit? For folks like us? Wrong repo, wrong users"`,
//     `"It's not the strength of the pc, choom, it's how you use it."`,
//     `"Windows over Linux? Nah --. It's giving Arasaka. "`,
//     `"you'll get a blue screen of death, choomba."`,
//     `"The net doesn't forget. Neither does git log."`,
//   ];
//   let loreIdx = 0;
//   setInterval(() => {
//     loreIdx = (loreIdx + 1) % loreLines.length;
//     const el = document.getElementById("loreQuote");
//     el.style.opacity = 0;
//     setTimeout(() => { el.textContent = loreLines[loreIdx]; el.style.opacity = 1; }, 350);
//   }, 6000);

  
//   const sessionStart = Date.now();
//   setInterval(() => {
//     const s = Math.floor((Date.now() - sessionStart) / 1000);
//     const hh = String(Math.floor(s / 3600)).padStart(2, "0");
//     const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
//     const ss = String(s % 60).padStart(2, "0");
//     document.getElementById("sessionUptime").textContent = `UPLINK ${hh}:${mm}:${ss}`;
//   }, 1000);
  
//   const sysMemAvailable = "deviceMemory" in navigator;
//   const sysHeapAvailable = !!(performance && performance.memory);
//   const totalRamGB = sysMemAvailable ? navigator.deviceMemory : null;

//   function renderRam() {
//     const el = document.getElementById("sysRamVal");
//     const fill = document.getElementById("sysRamFill");
//     if (!sysMemAvailable) {
//       el.textContent = "n/a";
//       el.title = "navigator.deviceMemory isn't supported in this browser";
//       return;
//     }
//     let usedGB;
//     if (sysHeapAvailable) {
      
      
//       usedGB = performance.memory.usedJSHeapSize / 1073741824;
//     } else {
//       usedGB = 0;
//     }
//     const pct = Math.min(100, (usedGB / totalRamGB) * 100);
//     fill.style.width = pct + "%";
//     el.textContent = `${usedGB.toFixed(2)}/${totalRamGB} GB`;
//     el.title = sysHeapAvailable
//       ? "Used = this tab's JS heap (page-scope, not whole-system) · Total = navigator.deviceMemory"
//       : "performance.memory isn't supported here, so 'used' can't be measured";
//   }
  
//   const CPU_SAMPLE_MS = 500;
//   let cpuSmoothed = 0;
//   let cpuLastTick = performance.now();


//   /**
//    * temp, change it
//    */

//   function sampleCpu() {
//     const now = performance.now();
//     const drift = Math.max(0, (now - cpuLastTick) - CPU_SAMPLE_MS);
//     cpuLastTick = now;
//     const instant = Math.max(0, Math.min(100, (drift / CPU_SAMPLE_MS) * 100));
//     cpuSmoothed = cpuSmoothed * 0.7 + instant * 0.3; 
//     document.getElementById("sysCpuFill").style.width = cpuSmoothed + "%";
//     document.getElementById("sysCpuVal").textContent = Math.round(cpuSmoothed) + "%";
//     setTimeout(sampleCpu, CPU_SAMPLE_MS);
//   }
//   const coreCount = navigator.hardwareConcurrency;
//   if (coreCount) {
//     document.getElementById("sysCpuVal").title = `${coreCount} logical cores reported`;
//   }

  
//   /**
//    * helper func that reads the gpu name from the browser.
//    * it creates an off-screen canvas, gets a WebGL context, then
//    * uses the "WEBGL_debug_renderer_info" extension to read
//    * the "UNMASKED_RENDERER_WEBGL". It is wrapped in try{}catch
//    * as it can throw or be unsupported
//    * @returns  renderer string (GPU name and some driver info)
//    */
//   function detectGpuName() {
//     try {
//       const canvas = document.createElement("canvas");
//       const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//       const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
//       if (gl && ext) return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
//     } catch (e) {  }
//     return null;
//   }
  
//   (function renderGpu() {
//     const label = document.getElementById("sysGpuVal");
//     const fill = document.getElementById("sysGpuFill");
//     const name = detectGpuName();
//     fill.style.width = "0%";
//     fill.style.opacity = "0.25"; 
//     label.textContent = name ? name.replace(/^ANGLE \(|\)$/g, "").split(",")[0] : "n/a";
//     label.title = "Browsers don't expose GPU load to a webpage — this is the detected GPU/renderer instead";
//   })();

//   renderRam();
//   setInterval(renderRam, CPU_SAMPLE_MS);
//   sampleCpu();
// }


// /**
//  * main dashboard data-loading entry point, its right after the login
//  * it calls the clearProfileTarget(), then loads the profile and all the
//  * dashboard charts/widgets/stats in the following order: loadProfile(),
//  * loadPassFailChart(), loadSkillsChart(), loadAuditGauge(), loadUplinkLog("module"),
//  * loadXpOverTimeChart("module"), and loadProjectProgress().
//  * 
//  * @returns undefined (the functions are async and this function does not await them, which
//  * means they run concurrently (all together no waiting))
//  */
// function setupDashboard() {
//   clearProfileTarget();
//   loadProfile();
//   loadPassFailChart(); 
//   loadSkillsChart();
//   loadAuditGauge();
//   loadUplinkLog("module");
//   loadXPOverTimeChart("module");
//   loadProjectProgress();
// }


// document.addEventListener("breach:unlocked", () => {
//   const payload = document.getElementById("breachPayload");
//   if (payload) payload.classList.add("is-visible");
// });
