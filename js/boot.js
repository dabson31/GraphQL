




export function runBootSequence() {
  const overlay = document.getElementById("bootOverlay");
  const linesEl = document.getElementById("bootLines");
  if (!overlay || !linesEl) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alreadyRan = sessionStorage.getItem("blackwall_booted");

  const skipLines = sessionStorage.getItem("blackwall_skip_lines");

  if (prefersReduced || alreadyRan) {
    overlay.remove();
    return;
  }
  sessionStorage.setItem("blackwall_booted", "1");
  sessionStorage.removeItem("blackwall_skip_lines");

  const bootLines = [
    "BLACKWALL RELAY // COLD BOOT",
    "establishing uplink to learn.reboot01.com ...",
    "handshake ok -- negotiating jwt bearer session",
    "bypassing ICE... clean pass, no trace flags",
    "mounting graphql-engine/v1/graphql",
    "decrypting personnel record",
    "rendering neural dashboard",
    "Welcome back, choom. Never settle.",
  ];

  const CRACK_POINTS = [
    [0.50, 0],                 
    [0.50, 0.40],               
    [0.443, 0.457],              
    [0.52, 0.457],                
    [0.52, 0.537],                
    [0.50, 0.537],               
    [0.50, 1],                  
    
  ];

  const SVG_NS = "http://www.w3.org/2000/svg";

  function polygonStr(points) {
    return points.map((p) => (p[0] * 100) + "% " + (p[1] * 100) + "%").join(", ");
  }

  function leftPolygon() {
    return polygonStr([[0, 0], ...CRACK_POINTS, [0, 1]]);
  }

  function rightPolygon() {
    return polygonStr([[1, 0], ...CRACK_POINTS, [1, 1]]);
  }

  
  
  function buildCrackSvg() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.classList.add("split-crack");

    const d = CRACK_POINTS
      .map((p, i) => (i === 0 ? "M" : "L") + (p[0] * w) + " " + (p[1] * h))
      .join(" ");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    return { svg, path };
  }

  
  
  function shatterOverlay() {
    const { svg: crack, path: crackPath } = buildCrackSvg();
    document.body.appendChild(crack);
    crack.classList.add("split-crack-visible");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        crackPath.style.strokeDashoffset = "0";
      });
    });

    setTimeout(() => {
      const wrap = document.createElement("div");
      wrap.className = "neural-split";

      const left = document.createElement("div");
      left.className = "split-half split-left";
      left.style.clipPath = `polygon(${leftPolygon()})`;

      const right = document.createElement("div");
      right.className = "split-half split-right";
      right.style.clipPath = `polygon(${rightPolygon()})`;

      wrap.appendChild(left);
      wrap.appendChild(right);
      document.body.appendChild(wrap);
      overlay.remove();

      requestAnimationFrame(() => {
        wrap.classList.add("split-open");
        crack.classList.add("split-crack-fade");
      });

      const totalMs = 700;
      setTimeout(() => {
        wrap.remove();
        crack.remove();
      }, totalMs);
    }, 1200 + 350); 
  }

  let i = 0;
  function nextLine() {
    if (i >= bootLines.length) {
      setTimeout(shatterOverlay, 400);
      return;
    }
    const row = document.createElement("div");
    row.className = "boot-row";
    linesEl.appendChild(row);
    const text = bootLines[i];
    let c = 0;
    (function type() {
      row.textContent = text.slice(0, c);
      c++;
      if (c <= text.length) {
        setTimeout(type, 14);
      } else {
        i++;
        setTimeout(nextLine, 160);
      }
    })();
  }

  if (skipLines) {
    setTimeout(shatterOverlay, 150);
  } else {
    nextLine();
  }
}
