const NS = "http://www.w3.org/2000/svg";
const RED = "#ff1937";
const ICE = "#f4f6f5";
const FLAG = "#f2d219";
const CYAN = "#00e8ff";
const FAIL_COL = "#4a4a52";
const GRID = "rgba(255,25,55,0.18)";

// svg elements need createElementNS instead of createElement or they wont render
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}



// i just tested the endpoint vals in graphiql and found the ones i needed here for the graph
const SOURCE_PATTERNS = {
  "piscine-go":   ["piscine-go"],
  "piscine-js":   ["piscine_js"],
  "piscine-rust": ["piscine-rust"],
};

const SOURCE_COLORS = {
  "module":       RED,
  "piscine-go":   CYAN,
  "piscine-js":   FLAG,
  "piscine-rust": "#ff7a1a",
};

//
function normalizeSource(source) {
  return source === "piscine" ? "piscine-go" : source;
}

// display labels per source, shared by the source-xp stat tile and the uplink
// log header so both read the same feed name the hero graph is showing
const SOURCE_LABELS = {
  "module":       "Module",
  "piscine-go":   "Piscine",
  "piscine-js":   "Piscine JS",
  "piscine-rust": "Piscine Rust",
};

function buildPathClause(source) {
  source = normalizeSource(source);
  if (source === "module") return MODULE_ONLY_FILTER;
  const patterns = SOURCE_PATTERNS[source] || [source];
  const or = patterns.map(p => `{ path: { _ilike: "%${p}%" } }`).join(", ");
  return `_or: [${or}]`;
}

// this is the main graph, xp over time, source picks which feed: module, piscine-go/js/rust
async function loadXPOverTimeChart(source) {
  source = normalizeSource(source || "module");

  const query = `
    {
      transaction(
        where: { type: { _eq: "xp" }, ${buildPathClause(source)} }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
      }
    }
  `;

  const data = await graphqlQuery(query);

  // running total per event, keep it raw, format later when drawing
  let running = 0;
  const points = data.transaction.map(t => {
    running += t.amount;
    return { date: new Date(t.createdAt), rawTotal: running };
  });

  drawXPHero(points, SOURCE_COLORS[source] || RED);
}

//
let lastHeroPoints = null;
let lastHeroColor = null;

function drawXPHero(points, color) {
  color = color || RED;
  const svg = document.getElementById("xpChart");
  svg.innerHTML = "";
  lastHeroPoints = points;
  lastHeroColor = color;

//
  const box = svg.getBoundingClientRect();
  const width = Math.round(box.width) || 780;
  const height = Math.round(box.height) || 340;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const padding = 46;

  if (points.length < 2) {
    // not enough data points to draw a line with, bail out, but say why
    // instead of a bare "no data yet", since an empty feed and a broken
    // filter look identical to the user otherwise
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

  // same scale mapping as before, value -> pixel
  function scaleX(date) {
    return padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - padding * 2);
  }
  function scaleY(value) {
    return height - padding - (value / maxY) * (height - padding * 2);
  }

  // grid lines with kb/mb labels on the left
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

  // filled area under the line
  svg.appendChild(svgEl("polygon", { points: areaPts, fill: `url(#${gradId})` }));

  // the line itself
  svg.appendChild(svgEl("polyline", {
    points: linePts, fill: "none", stroke: color, "stroke-width": "2.5",
    style: `filter: drop-shadow(0 0 4px ${color}cc);`
  }));

  // dot on the last point
  const last = points[points.length - 1];
  svg.appendChild(svgEl("circle", {
    cx: scaleX(last.date), cy: scaleY(last.rawTotal), r: 5,
    fill: color, style: `filter: drop-shadow(0 0 6px ${color});`
  }));

  // current total, top right corner of the chart
  const readout = svgEl("text", {
    x: width - padding, y: 28, "text-anchor": "end",
    "font-size": "20", fill: ICE, "font-family": "Rajdhani, sans-serif", "font-weight": "700"
  });
  readout.textContent = formatXP(last.rawTotal);
  svg.appendChild(readout);
}

let heroResizeTimer = null;
window.addEventListener("resize", () => {
  if (!lastHeroPoints) return;
  clearTimeout(heroResizeTimer);
  heroResizeTimer = setTimeout(() => drawXPHero(lastHeroPoints, lastHeroColor), 150);
});

async function loadSkillsChart() {
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
    // keep the highest amount seen per skill, not a sum
    maxByType[name] = Math.max(maxByType[name] || 0, t.amount);
  });
  const skills = Object.entries(maxByType)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5 skills only, see comment above

  drawHexRadar(skills);
}

function drawHexRadar(skills) {
  const svg = document.getElementById("skillsChart");
  svg.innerHTML = "";

  if (skills.length < 3) {
    const msg = svgEl("text", { x: 130, y: 115, "text-anchor": "middle", "font-size": "11" });
    msg.textContent = "// insufficient skill telemetry";
    svg.appendChild(msg);
    return;
  }

  const cx = 130, cy = 122, maxR = 82;
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

  // spokes and labels
  skills.forEach((s, i) => {
    const [x, y] = pointAt(i, maxR);
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: GRID, "stroke-width": "1" }));
    const [lx, ly] = pointAt(i, maxR + 16);
    const label = svgEl("text", { x: lx, y: ly, "text-anchor": "middle", "font-size": n > 7 ? "7.5" : "9" });
    label.textContent = s.label.toUpperCase();
    svg.appendChild(label);
  });

  // the actual data shape
  const dataPts = skills.map((s, i) => pointAt(i, (s.value / maxVal) * maxR).join(",")).join(" ");
  svg.appendChild(svgEl("polygon", { points: dataPts, fill: "rgba(255,25,55,0.25)", stroke: RED, "stroke-width": "2" }));

  skills.forEach((s, i) => {
    const [x, y] = pointAt(i, (s.value / maxVal) * maxR);
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 3, fill: RED, style: "filter: drop-shadow(0 0 4px rgba(255,25,55,0.9));" }));
  });
}


async function loadPassFailChart() {
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
    // 100% pass, draw one full solid ring, no dasharray, no seam
    svg.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: RED, "stroke-width": "10",
      style: "filter: drop-shadow(0 0 6px rgba(255,25,55,0.7));",
    }));
  } else if (pass === 0) {
    // 100% fail, full solid ring in the fail color (how would you even have this 💔💔💔)
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
      style: "filter: drop-shadow(0 0 6px rgba(255,25,55,0.6));",
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

async function loadAuditGauge() {
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

  // background track
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
  num.textContent = ratio.toFixed(1);
  svg.appendChild(num);

  const sub = svgEl("text", { x: cx, y: cy + 22, "text-anchor": "middle", "font-size": "8" });
  sub.textContent = "GIVEN / RECEIVED";
  svg.appendChild(sub);
}


//
async function loadSourceXPStat(source) {
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

//
async function loadBestSkill() {
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
    // skill amounts are capped at 100 on the platform, so this reads as a
    // straightforward score-out-of-100 rather than a raw number
    const outlineEl = document.getElementById("stat-best-skill-outline");
    if (outlineEl) outlineEl.textContent = `${t.amount}/100`;
  }
}
//
async function loadUplinkLog(source) {
  source = source || "module";

  const gen = ++uplinkGen;

  const query = `
    {
      transaction(
        where: { type: { _eq: "xp" }, ${buildPathClause(source)} }
        order_by: { createdAt: desc }
        limit: 9
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
  if (gen !== uplinkGen) return; // a newer source was picked while this was in flight
  renderUplinkLog(data.transaction, gen);
}

//
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
    const label = (t.object && t.object.name) ? t.object.name : (t.path || "unknown").split("/").pop();
    return `[${time}] +${t.amount.toLocaleString()} XP :: ${label}`;
  });

  // typewriter the lines in one at a time so it actually reads like a live feed
  let i = 0;
  function next() {
    if (gen !== uplinkGen) return; // superseded by a newer source click, stop here
    if (i >= lines.length) return;
    const line = document.createElement("div");
    line.className = "log-line";
    el.appendChild(line);
    typeLine(line, lines[i], () => {
      i++;
      setTimeout(next, 140); // shorter gap now that there are more lines to get through
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

//
function drawStreetCred(rank, level) {
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
