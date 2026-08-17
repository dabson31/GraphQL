(function () {
  const overlay = document.getElementById("bootOverlay");
  const linesEl = document.getElementById("bootLines");
  if (!overlay || !linesEl) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alreadyRan = sessionStorage.getItem("blackwall_booted");
//
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
    [0.50, 0],                 // start, top-center
    [0.50, 0.40],               // straight down to 40% of the screen
    [0.443, 0.457],              // 225° angle (down-left) for ~8%
    [0.52, 0.457],                // horizontal jog 2% right of center
    [0.52, 0.537],                // straight down ~8%
    [0.50, 0.537],               // horizontal jog 2% back left, to center
    [0.50, 1],                  // straight down to the bottom of the screen
    // i had to test around with the values to get the crack to look right
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

  // builds the crack sized to the real current viewport, and pre-computes
  // its exact stroke-dasharray/dashoffset via the SVG API so the draw is always a single continuous stroke
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

  // once the boot text is done, the neural dashboard is already sitting
  // there underneath, sealed behind the flat void overlay. it splits in two with the transition
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
    }, 1200 + 350); // show the cracked overlay (edgerunners s2 reference) for a beat after the 1.2s draw finishes, before it tears open
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
})();
