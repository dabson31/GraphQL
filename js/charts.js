import { graphqlQuery } from "./api.js";
import { formatXP, MODULE_ONLY_FILTER, MODULE_XP_FILTER } from "./profile.js";

const NS = "http://www.w3.org/2000/svg";
const RED = "#ff003c";
const ICE = "#f4f6f5";
const FLAG = "#fcee0a";
const CYAN = "#00f0ff";
const BLUE = "#0080ff";
const ORANGE = "#ff8c1a";
const FAIL_COL = "#4a4a52";
const GRID = "rgba(255,0,60,0.18)";


function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}


let tooltipEl = null;
function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.className = "chart-tooltip";
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}
function positionTooltip(el, evt) {
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const w = rect.width || el.offsetWidth || 240;
  const h = rect.height || el.offsetHeight || 60;

  let left = evt.clientX + pad;
  let top = evt.clientY + pad;

  if (left + w > vw - pad) left = evt.clientX - pad - w;
  if (left < pad) left = pad;
  if (left + w > vw - pad) left = Math.max(pad, vw - pad - w);

  if (top + h > vh - pad) top = evt.clientY - pad - h;
  if (top < pad) top = pad;
  if (top + h > vh - pad) top = Math.max(pad, vh - pad - h);

  el.style.left = left + "px";
  el.style.top = top + "px";
}
function showTooltip(evt, html) {
  const el = ensureTooltip();
  el.innerHTML = html;
  positionTooltip(el, evt);
  el.classList.add("is-visible");
}
function moveTooltip(evt) {
  if (!tooltipEl) return;
  positionTooltip(tooltipEl, evt);
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove("is-visible");
}




const SOURCE_PATTERNS = {
  "piscine-go":   ["piscine-go"],
  "piscine-js":   ["piscine_js"],
  "piscine-rust": ["piscine-rust"],
};

const SOURCE_COLORS = {
  "module":       RED,
  "piscine-go":   BLUE,
  "bh-piscine":   BLUE,
  "piscine-js":   FLAG,
  "piscine-rust": ORANGE,
};


function normalizeSource(source) {
  return source === "piscine" ? "piscine-go" : source;
}



const SOURCE_LABELS = {
  "module":       "Module",
  "piscine-go":   "Piscine",
  "bh-piscine":   "Piscine",
  "piscine-js":   "Piscine JS",
  "piscine-rust": "Piscine Rust",
};

function buildPathClause(source) {
  source = normalizeSource(source);
  if (source === "module") return MODULE_XP_FILTER;
  const patterns = SOURCE_PATTERNS[source] || [source];
  const or = patterns.map(p => `{ path: { _ilike: "%${p}%" } }`).join(", ");
  if (source === "piscine-js") {
    return `_or: [${or}], _not: { amount: { _eq: 70000 }, object: { name: { _eq: "Piscine JS" } } }`;
  }
  return `_or: [${or}]`;
}


export async function loadXPOverTimeChart(source) {
  source = normalizeSource(source || "module");

  const query = `
    {
      transaction(
        where: { type: { _eq: "xp" }, ${buildPathClause(source)} }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
        path
        object {
          name
          type
        }
      }
    }
  `;

  const data = await graphqlQuery(query);

  
  let running = 0;
  const points = data.transaction.map(t => {
    running += t.amount;
    const label = (t.object && t.object.name) ? t.object.name : (t.path || "unknown").split("/").pop();
    return { date: new Date(t.createdAt), rawTotal: running, amount: t.amount, label };
  });

  drawXPHero(points, SOURCE_COLORS[source] || RED);
}


let lastHeroPoints = null;
let lastHeroColor = null;

function drawXPHero(points, color) {
  color = color || RED;
  const svg = document.getElementById("xpChart");
  if (!svg) return;
  svg.innerHTML = "";
  lastHeroPoints = points;
  lastHeroColor = color;


  const box = svg.getBoundingClientRect();
  const width = Math.round(box.width) || 780;
  const height = Math.round(box.height) || 340;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const padding = 46;

  if (points.length < 2) {
    
    
    
    const msg = svgEl("text", {
      x: width / 2, y: height / 2 - 8, "text-anchor": "middle", "font-size": "13", fill: ICE,
    });
    msg.textContent = "// NO SIGNAL ON THIS RELAY";
    svg.appendChild(msg);
    const sub = svgEl("text", {
      x: width / 2, y: height / 2 + 14, "text-anchor": "middle", "font-size": "10",
    });
    sub.textContent = "no xp transactions found for this feed yet";
    svg.appendChild(sub);
    return;
  }

  const maxY = Math.max(...points.map(p => p.rawTotal));
  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();

  
  function scaleX(date) {
    return padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - padding * 2);
  }
  function scaleY(value) {
    return height - padding - (value / maxY) * (height - padding * 2);
  }

  
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = (maxY / steps) * i;
    const y = scaleY(val);
    svg.appendChild(svgEl("line", { x1: padding, y1: y, x2: width - padding, y2: y, stroke: GRID, "stroke-width": "1" }));
    const label = svgEl("text", { x: 10, y: y + 4, "font-size": "10" });
    label.textContent = formatXP(val);
    svg.appendChild(label);
  }

  const linePts = points.map(p => `${scaleX(p.date)},${scaleY(p.rawTotal)}`).join(" ");
  const areaPts = `${padding},${height - padding} ${linePts} ${width - padding},${height - padding}`;

  const gradId = "heroFill-" + color.replace("#", "");
  const defs = svgEl("defs", {});
  const grad = svgEl("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1" });
  grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": color, "stop-opacity": "0.28" }));
  grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": color, "stop-opacity": "0" }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  
  svg.appendChild(svgEl("polygon", { points: areaPts, fill: `url(#${gradId})` }));

  
  svg.appendChild(svgEl("polyline", {
    points: linePts, fill: "none", stroke: color, "stroke-width": "2.5",
    style: `filter: drop-shadow(0 0 4px ${color}cc);`
  }));

  
  
  const dayGroups = [];
  const dayIndex = new Map();
  points.forEach((p, idx) => {
    const key = p.date.toDateString();
    let group = dayIndex.get(key);
    if (!group) {
      group = [];
      dayIndex.set(key, group);
      dayGroups.push(group);
    }
    group.push({ ...p, idx });
  });

  dayGroups.forEach((entries) => {
    const lastEntry = entries[entries.length - 1];
    const isLast = lastEntry.idx === points.length - 1;
    const x = scaleX(lastEntry.date), y = scaleY(lastEntry.rawTotal);
    const baseR = isLast ? 7 : 5;

    
    const halo = svgEl("circle", { cx: x, cy: y, r: baseR * 1.6, fill: color, class: "dot-halo" });
    svg.appendChild(halo);

    const dot = svgEl("circle", {
      cx: x, cy: y, r: baseR, fill: color, class: "hoverable-dot",
      opacity: isLast ? "1" : "0.55",
      style: isLast ? `filter: drop-shadow(0 0 4px ${color});` : "",
    });
    svg.appendChild(dot);

    const dayLabel = lastEntry.date.toLocaleDateString();
    const itemsHtml = entries.map(e =>
      `<div class="tt-sub">${escapeHtml(e.label)} · +${e.amount.toLocaleString()} XP</div>`
    ).join("");
    const headerHtml = entries.length > 1
      ? `<div class="tt-title">${dayLabel} · ${entries.length} entries</div>`
      : `<div class="tt-title">${escapeHtml(entries[0].label)}</div>`;
    const tooltipHtml = entries.length > 1
      ? headerHtml + itemsHtml
      : `${headerHtml}<div class="tt-sub">+${entries[0].amount.toLocaleString()} XP · ${dayLabel}</div>`;

    
    const hit = svgEl("circle", { cx: x, cy: y, r: 11, fill: "transparent", style: "cursor: pointer;" });
    hit.addEventListener("mouseenter", (e) => {
      dot.setAttribute("r", baseR + 2);
      dot.setAttribute("opacity", "1");
      showTooltip(e, tooltipHtml);
    });
    hit.addEventListener("mousemove", moveTooltip);
    hit.addEventListener("mouseleave", () => {
      dot.setAttribute("r", baseR);
      dot.setAttribute("opacity", isLast ? "1" : "0.55");
      hideTooltip();
    });
    svg.appendChild(hit);
  });

  
  const readout = svgEl("text", {
    x: width - padding, y: 28, "text-anchor": "end",
    "font-size": "20", fill: ICE, "font-family": "Rajdhani, sans-serif", "font-weight": "700"
  });
  readout.textContent = formatXP(points[points.length - 1].rawTotal);
  svg.appendChild(readout);
}

let heroResizeTimer = null;
window.addEventListener("resize", () => {
  if (!lastHeroPoints) return;
  clearTimeout(heroResizeTimer);
  heroResizeTimer = setTimeout(() => drawXPHero(lastHeroPoints, lastHeroColor), 150);
});

const PP_PAGE_SIZE = 5;
let ppGroups = [];
let ppPage = 0;
let ppSource = "module";

const PP_STATUS_MAP = {
  setup: { label: "Starting", cls: "status-setup" },
  working: { label: "In progress", cls: "status-working" },
  finished: { label: "Finished", cls: "status-finished" },
  audit: { label: "Auditing", cls: "status-audit" },
};

export async function loadProjectProgress(source) {
  const tbody = document.getElementById("projectProgress");
  if (!tbody) return;

  ppSource = normalizeSource(source || ppSource || "module");

  if (ppSource === "module") {
    await loadModuleProjects(tbody);
  } else {
    await loadPiscineCamps(tbody, ppSource);
  }
}

export async function loadModuleProjects(tbody) {
  const query = `
    {
      user {
        id
        login
      }
      group(order_by: { createdAt: desc }) {
        id
        path
        status
        captainId
        object {
          name
        }
        members {
          userId
          userLogin
        }
      }
    }
  `;

  let data;
  try {
    data = await graphqlQuery(query);
  } catch (e) {
    tbody.innerHTML = '<div class="project-progress-empty">// unable to reach group feed</div>';
    setPpPaginationVisible(false);
    return;
  }

  const me = (data.user || [])[0];
  const myId = me ? me.id : null;

  
  
  const piscineSources = Object.keys(SOURCE_LABELS).filter(s => s !== "module");
  const piscinePatterns = piscineSources.flatMap(s => SOURCE_PATTERNS[s] || [s]);
  ppGroups = (data.group || []).filter(g => {
    if (!(g.members || []).some(m => m.userId === myId)) return false;
    const path = g.path || "";
    return !piscinePatterns.some(p => path.includes(p));
  });
  ppGroups.forEach(g => { g.__myId = myId; g.__xp = 0; g.__type = "group"; });
  ppPage = 0;

  if (!ppGroups.length) {
    tbody.innerHTML = '<div class="project-progress-empty">// no project groups on record for this feed</div>';
    setPpPaginationVisible(false);
    return;
  }

  await attachProjectXP(ppGroups);

  bindPpPaginationControls();
  renderProjectProgressPage();
}




export async function loadPiscineCamps(tbody, source) {
  const query = `
    {
      transaction(where: { type: { _eq: "xp" }, ${buildPathClause(source)} }) {
        amount
        path
        createdAt
      }
    }
  `;

  let data;
  try {
    data = await graphqlQuery(query);
  } catch (e) {
    tbody.innerHTML = '<div class="project-progress-empty">// unable to reach xp feed</div>';
    setPpPaginationVisible(false);
    return;
  }

  const patterns = SOURCE_PATTERNS[source] || [source];
  const camps = {};
  (data.transaction || []).forEach(t => {
    const key = campKeyForPath(t.path || "", patterns);
    if (!camps[key]) {
      camps[key] = { path: key, xp: 0, firstAt: t.createdAt, lastAt: t.createdAt };
    }
    camps[key].xp += t.amount;
    if (t.createdAt < camps[key].firstAt) camps[key].firstAt = t.createdAt;
    if (t.createdAt > camps[key].lastAt) camps[key].lastAt = t.createdAt;
  });

  ppGroups = Object.values(camps)
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
    .map(c => ({
      __type: "camp",
      __xp: c.xp,
      path: c.path,
      name: c.path.split("/").pop(),
      status: "finished",
    }));
  ppPage = 0;

  if (!ppGroups.length) {
    tbody.innerHTML = '<div class="project-progress-empty">// no xp on record for this feed</div>';
    setPpPaginationVisible(false);
    return;
  }

  bindPpPaginationControls();
  renderProjectProgressPage();
}




function campKeyForPath(path, patterns) {
  return path;
}

async function attachProjectXP(groups) {
  const paths = groups.map(g => g.path).filter(Boolean);
  if (!paths.length) return;

  const xpQuery = `
    {
      transaction(where: { type: { _eq: "xp" }, path: { _in: ${JSON.stringify(paths)} } }) {
        amount
        path
      }
    }
  `;

  let xpData;
  try {
    xpData = await graphqlQuery(xpQuery);
  } catch (e) {
    return;
  }

  const xpByPath = {};
  (xpData.transaction || []).forEach(t => {
    xpByPath[t.path] = (xpByPath[t.path] || 0) + t.amount;
  });

  groups.forEach(g => { g.__xp = xpByPath[g.path] || 0; });
}

function setPpPaginationVisible(visible) {
  const pag = document.getElementById("projectProgressPagination");
  if (pag) pag.style.display = visible ? "" : "none";
}

let ppPrevBoundEl = null;
let ppNextBoundEl = null;
function bindPpPaginationControls() {
  const prevBtn = document.getElementById("ppPrevBtn");
  const nextBtn = document.getElementById("ppNextBtn");

  if (prevBtn && prevBtn !== ppPrevBoundEl) {
    ppPrevBoundEl = prevBtn;
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (ppPage > 0) { ppPage--; renderProjectProgressPage(); }
    });
  }
  if (nextBtn && nextBtn !== ppNextBoundEl) {
    ppNextBoundEl = nextBtn;
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const maxPage = Math.max(0, Math.ceil(ppGroups.length / PP_PAGE_SIZE) - 1);
      if (ppPage < maxPage) { ppPage++; renderProjectProgressPage(); }
    });
  }
}

function renderProjectProgressPage() {
  const tbody = document.getElementById("projectProgress");
  if (!tbody) return;

  const totalPages = Math.max(1, Math.ceil(ppGroups.length / PP_PAGE_SIZE));
  ppPage = Math.max(0, Math.min(ppPage, totalPages - 1));

  const start = ppPage * PP_PAGE_SIZE;
  const pageGroups = ppGroups.slice(start, start + PP_PAGE_SIZE);

  tbody.innerHTML = "";
  pageGroups.forEach(g => {
    tbody.appendChild(buildProjectProgressRow(g));
  });

  setPpPaginationVisible(ppGroups.length > PP_PAGE_SIZE);
  const label = document.getElementById("ppPageLabel");
  if (label) label.textContent = `Page ${ppPage + 1} / ${totalPages}`;
  const prevBtn = document.getElementById("ppPrevBtn");
  const nextBtn = document.getElementById("ppNextBtn");
  if (prevBtn) prevBtn.disabled = ppPage === 0;
  if (nextBtn) nextBtn.disabled = ppPage >= totalPages - 1;
}

function buildProjectProgressRow(g) {
  const isCamp = g.__type === "camp";
  const myId = g.__myId;
  const name = isCamp
    ? (g.name || "unknown")
    : ((g.object && g.object.name) ? g.object.name : (g.path || "unknown").split("/").pop());
  const statusKey = (g.status || "").toLowerCase();
  const status = PP_STATUS_MAP[statusKey] || { label: g.status || "Unknown", cls: "status-unknown" };

  const captainMember = isCamp ? null : (g.members || []).find(m => m.userId === g.captainId);
  const isMeCaptain = !isCamp && g.captainId === myId;
  const captainLogin = captainMember ? captainMember.userLogin : "unknown";

  const row = document.createElement("div");
  row.className = "pp-row pp-item-row";

  const pathCol = document.createElement("div");
  pathCol.className = "pp-col pp-col-path";
  const nameEl = document.createElement("div");
  nameEl.className = "project-progress-name";
  nameEl.textContent = name;
  const pathEl = document.createElement("div");
  pathEl.className = "project-progress-path";
  pathEl.textContent = g.path || "";
  pathCol.appendChild(nameEl);
  pathCol.appendChild(pathEl);

  const statusCol = document.createElement("div");
  statusCol.className = "pp-col pp-col-status";
  const statusEl = document.createElement("span");
  statusEl.className = "project-progress-status " + status.cls;
  statusEl.textContent = status.label;
  statusCol.appendChild(statusEl);

  const captainCol = document.createElement("div");
  captainCol.className = "pp-col pp-col-captain project-progress-captain";
  captainCol.textContent = isCamp ? "Part" : (isMeCaptain ? "Me" : captainLogin);

  const xpCol = document.createElement("div");
  xpCol.className = "pp-col pp-col-xp project-progress-xp";
  const isFinished = statusKey === "finished";
  if (g.__xp) {
    const xpAmount = document.createElement("span");
    xpAmount.className = "pp-xp-amount";
    xpAmount.textContent = `${formatXP(g.__xp)} XP`;
    xpCol.appendChild(xpAmount);
  } else {
    const xpDash = document.createElement("span");
    xpDash.className = "pp-xp-amount";
    xpDash.textContent = "--";
    xpCol.appendChild(xpDash);
  }
  if (!isFinished) {
    const pending = document.createElement("span");
    pending.className = "pp-xp-pending";
    pending.textContent = "not received";
    xpCol.appendChild(pending);
  }

  row.appendChild(pathCol);
  row.appendChild(statusCol);
  row.appendChild(captainCol);
  row.appendChild(xpCol);
  return row;
}

export async function loadSkillsChart() {
  const query = `
    {
      transaction(where: { type: { _ilike: "skill_%" } }) {
        type
        amount
      }
    }
  `;

  const data = await graphqlQuery(query);
  const maxByType = {};
  data.transaction.forEach(t => {
    const name = t.type.replace("skill_", "");
    
    maxByType[name] = Math.max(maxByType[name] || 0, t.amount);
  });
  const skills = Object.entries(maxByType)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); 

  drawHexRadar(skills);
}

function drawHexRadar(skills) {
  const svg = document.getElementById("skillsChart");
  svg.innerHTML = "";

  if (skills.length < 3) {
    const msg = svgEl("text", { x: 130, y: 98, "text-anchor": "middle", "font-size": "11" });
    msg.textContent = "// insufficient skill telemetry";
    svg.appendChild(msg);
    return;
  }

  const cx = 130, cy = 98, maxR = 64;
  const n = skills.length;
  const maxVal = Math.max(...skills.map(s => s.value), 1);

  function pointAt(i, r) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  [0.25, 0.5, 0.75, 1].forEach(pct => {
    const pts = skills.map((_, i) => pointAt(i, maxR * pct).join(",")).join(" ");
    svg.appendChild(svgEl("polygon", { points: pts, fill: "none", stroke: GRID, "stroke-width": "1" }));
  });

  
  skills.forEach((s, i) => {
    const [x, y] = pointAt(i, maxR);
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: GRID, "stroke-width": "1" }));
    const [lx, ly] = pointAt(i, maxR + 16);
    const label = svgEl("text", { x: lx, y: ly, "text-anchor": "middle", "font-size": n > 7 ? "7.5" : "9" });
    label.textContent = s.label.toUpperCase();
    svg.appendChild(label);
  });

  
  const dataPts = skills.map((s, i) => pointAt(i, (s.value / maxVal) * maxR).join(",")).join(" ");
  svg.appendChild(svgEl("polygon", { points: dataPts, fill: "rgba(255,0,60,0.25)", stroke: RED, "stroke-width": "2" }));

  skills.forEach((s, i) => {
    const [x, y] = pointAt(i, (s.value / maxVal) * maxR);
    
    const halo = svgEl("circle", { cx: x, cy: y, r: 8, fill: RED, class: "dot-halo" });
    svg.appendChild(halo);
    const dot = svgEl("circle", { cx: x, cy: y, r: 5, fill: RED, class: "hoverable-dot", style: "filter: drop-shadow(0 0 3px rgba(255,0,60,0.85));" });
    svg.appendChild(dot);

    
    
    
    
    
    
    const hit = svgEl("circle", {
      cx: x, cy: y, r: 11, fill: "transparent", style: "cursor: pointer;",
      class: "skill-hit",
      "data-tt-title": escapeHtml(s.label),
      "data-tt-value": `${s.value}%`,
    });
    svg.appendChild(hit);
  });

  bindSkillHoverDelegation();
}



let skillHoverBound = false;
function bindSkillHoverDelegation() {
  if (skillHoverBound) return;
  skillHoverBound = true;

  document.addEventListener("mouseover", (e) => {
    const hit = e.target.closest && e.target.closest(".skill-hit");
    if (!hit) return;
    const dot = hit.previousElementSibling;
    if (dot) dot.setAttribute("r", 7);
    showTooltip(e, `<div class="tt-title">${hit.getAttribute("data-tt-title")}</div><div class="tt-sub">${hit.getAttribute("data-tt-value")}</div>`);
  });

  document.addEventListener("mousemove", (e) => {
    if (e.target.closest && e.target.closest(".skill-hit")) moveTooltip(e);
  });

  document.addEventListener("mouseout", (e) => {
    const hit = e.target.closest && e.target.closest(".skill-hit");
    if (!hit) return;
    const dot = hit.previousElementSibling;
    if (dot) dot.setAttribute("r", 5);
    hideTooltip();
  });
}


export async function loadPassFailChart() {
  const query = `
    {
      result(
        where: { ${MODULE_ONLY_FILTER}, object: { type: { _eq: "project" } } }
        order_by: { createdAt: desc }
      ) {
        objectId
        grade
      }
    }
  `;

  const data = await graphqlQuery(query);

  const latestByProject = new Map();
  data.result.forEach(r => {
    if (!latestByProject.has(r.objectId)) latestByProject.set(r.objectId, r.grade);
  });

  let pass = 0, fail = 0;
  latestByProject.forEach(grade => { if (grade > 0) pass++; else fail++; });

  document.getElementById("stat-passed").textContent = pass;
  document.getElementById("stat-failed").textContent = fail;

  drawStatusRing(pass, fail);
}

function drawStatusRing(pass, fail) {
  const svg = document.getElementById("passFailChart");
  svg.innerHTML = "";

  const cx = 110, cy = 96, r = 72;
  const circumference = 2 * Math.PI * r;
  const total = pass + fail;
  const passPct = total ? pass / total : 0;

  svg.appendChild(svgEl("circle", {
    cx, cy, r, fill: "none", stroke: "rgba(244,246,245,0.12)", "stroke-width": "10",
  }));

  if (total === 0) {
  } else if (fail === 0) {
    
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: RED, "stroke-width": "10",
      style: "filter: drop-shadow(0 0 6px rgba(255,0,60,0.7));",
    }));
  } else if (pass === 0) {
    
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: FAIL_COL, "stroke-width": "10",
    }));
  } else {
    const passLen = circumference * passPct;
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: RED, "stroke-width": "10",
      "stroke-linecap": "butt",
      "stroke-dasharray": `${passLen} ${circumference - passLen}`,
      transform: `rotate(-90 ${cx} ${cy})`,
      style: "filter: drop-shadow(0 0 6px rgba(255,0,60,0.6));",
    }));
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: FAIL_COL, "stroke-width": "10",
      "stroke-linecap": "butt",
      "stroke-dasharray": `${circumference - passLen} ${passLen}`,
      "stroke-dashoffset": `${-passLen}`,
      transform: `rotate(-90 ${cx} ${cy})`,
    }));
  }

  const pct = total ? Math.round(passPct * 100) : 0;
  const label = svgEl("text", {
    x: cx, y: cy - 2, "text-anchor": "middle", "font-size": "22",
    fill: ICE, "font-family": "Rajdhani, sans-serif", "font-weight": "700"
  });
  label.textContent = `${pct}%`;
  svg.appendChild(label);

  const sub = svgEl("text", { x: cx, y: cy + 16, "text-anchor": "middle", "font-size": "9" });
  sub.textContent = "PASS RATE";
  svg.appendChild(sub);

  const legend = [{ label: "Pass", value: pass, color: RED }, { label: "Fail", value: fail, color: FAIL_COL }];
  legend.forEach((s, i) => {
    const ly = 186 + i * 15;
    svg.appendChild(svgEl("rect", { x: 30, y: ly - 8, width: 9, height: 9, fill: s.color }));
    const t = svgEl("text", { x: 44, y: ly, "font-size": "9" });
    t.textContent = `${s.label} — ${s.value}`;
    svg.appendChild(t);
  });
}

export async function loadAuditGauge() {
  const query = `{ user { auditRatio totalUp totalDown } }`;

  const data = await graphqlQuery(query);
  const u = data.user[0];
  const ratio = u.auditRatio ?? (u.totalDown ? u.totalUp / u.totalDown : 0);

  drawAuditGauge(ratio);
}

function drawAuditGauge(ratio) {
  const svg = document.getElementById("auditGauge");
  svg.innerHTML = "";

  const cx = 100, cy = 96, r = 78;
  const circumference = 2 * Math.PI * r;
  const fillPct = Math.min(ratio / 1, 1);
  const color = ratio >= 1 ? RED : FLAG;

  
  svg.appendChild(svgEl("circle", { cx, cy, r, fill: "none", stroke: "rgba(244,246,245,0.1)", "stroke-width": "9" }));

  if (fillPct >= 1) {
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: color, "stroke-width": "9",
      style: `filter: drop-shadow(0 0 6px ${color}aa);`,
    }));
  } else if (fillPct > 0) {
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: color, "stroke-width": "9",
      "stroke-linecap": "round",
      "stroke-dasharray": `${circumference}`,
      "stroke-dashoffset": `${circumference * (1 - fillPct)}`,
      transform: `rotate(-90 ${cx} ${cy})`,
    }));
  }

  const num = svgEl("text", {
    x: cx, y: cy + 5, "text-anchor": "middle", "font-size": "26",
    fill: ICE, "font-family": "Rajdhani, sans-serif", "font-weight": "700"
  });
  num.textContent = ratio.toFixed(2);
  svg.appendChild(num);

  const sub = svgEl("text", { x: cx, y: cy + 22, "text-anchor": "middle", "font-size": "8" });
  sub.textContent = "GIVEN / RECEIVED";
  svg.appendChild(sub);
}



export async function loadSourceXPStat(source) {
  source = normalizeSource(source || "module");
  const query = `
    {
      xpAgg: transaction_aggregate(
        where: { type: { _eq: "xp" }, ${buildPathClause(source)} }
      ) {
        aggregate { sum { amount } }
      }
    }
  `;
  const data = await graphqlQuery(query);
  const rawXP = data.xpAgg.aggregate.sum.amount || 0;

  const labelEl = document.getElementById("stat-xp-label");
  if (labelEl) labelEl.textContent = `${SOURCE_LABELS[source] || "Module"} XP`;
  document.getElementById("stat-xp").textContent = formatXP(rawXP);
}


export async function loadBestSkill() {
  const query = `
    {
      transaction(
        where: { type: { _ilike: "skill_%" } }
        order_by: { amount: desc }
        limit: 1
      ) {
        type
        amount
      }
    }
  `;
  const data = await graphqlQuery(query);
  if (data.transaction[0]) {
    const t = data.transaction[0];
    document.getElementById("stat-best-skill").textContent = t.type.replace("skill_", "");
    
    
    const outlineEl = document.getElementById("stat-best-skill-outline");
    if (outlineEl) outlineEl.textContent = `${t.amount}/100`;
  }
}

export async function loadUplinkLog(source) {
  source = source || "module";

  const gen = ++uplinkGen;

  const query = `
    {
      transaction(
        where: { type: { _eq: "xp" }, ${buildPathClause(source)} }
        order_by: { createdAt: desc }
        limit: 19
      ) {
        amount
        createdAt
        path
        object {
          name
          type
        }
      }
    }
  `;
  const data = await graphqlQuery(query);
  if (gen !== uplinkGen) return; 
  renderUplinkLog(data.transaction, gen);
}


let uplinkGen = 0;

function renderUplinkLog(entries, gen) {
  const el = document.getElementById("uplinkLog");
  if (!el) return;
  el.innerHTML = "";

  if (!entries.length) {
    el.textContent = "// no uplink traffic logged";
    return;
  }

  const lines = entries.map(t => {
    const time = new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    let label = (t.object && t.object.name) ? t.object.name : (t.path || "unknown").split("/").pop();
    if (label.length > 17) label = label.slice(0, 17) + "...";
    return `[${time}] +${t.amount.toLocaleString()} XP :: ${label}`;
  });

  
  let i = 0;
  function next() {
    if (gen !== uplinkGen) return; 
    if (i >= lines.length) return;
    const line = document.createElement("div");
    line.className = "log-line";
    el.appendChild(line);
    typeLine(line, lines[i], () => {
      i++;
      setTimeout(next, 140); 
    });
    el.scrollTop = el.scrollHeight;
  }
  next();
}

function typeLine(el, text, done) {
  let i = 0;
  const speed = 12;
  (function step() {
    el.textContent = text.slice(0, i) + (i < text.length ? "▌" : "");
    i++;
    if (i <= text.length) {
      setTimeout(step, speed);
    } else {
      el.textContent = text;
      done && done();
    }
  })();
}


export function drawStreetCred(rank, level) {
  const wrap = document.getElementById("streetCred");
  if (!wrap) return;

  const nextLabel = rank.next ? rank.next.title : "MAX TIER";
  const pctText = rank.next ? Math.round(rank.progress * 100) + "%" : "CAPPED";
  wrap.innerHTML = `
    <div class="cred-level">LVL ${level.level}</div>
    <div class="cred-title">${rank.current.title}</div>
    <div class="cred-desc">${rank.current.desc}</div>
    <div class="cred-bar-track">
      <div class="cred-bar-fill" style="width:${Math.round(rank.progress * 100)}%"></div>
    </div>
    <div class="cred-next">
      <span>${pctText} to next tier</span>
      <span>${nextLabel}</span>
    </div>
  `;
}