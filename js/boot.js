
/**
 * exported entry point, called on page load to conditionally show the boot anim
 * exits if #bootOverlay or #bootLines are missing, then checks "prefers-reduced-motion"
 * and a sessionStorage flag "blackwall_just_logged_in" (set by login.transitions.js right
 * before redirecting). If motion is reduced or the flag isn't set meaning its not a fresh login,
 * it just removes the overlay and stops. No animation plays on normal page refreshes. Else if it
 * is a fresh login, uses the bootLines and displays them, then shows the crack line using the
 * crack_points coords as the  final piece of transition. 
 * @returns undefined (DOM animation only)
 */
export function runBootSequence() {
  const overlay = document.getElementById("bootOverlay");
  const linesEl = document.getElementById("bootLines");
  if (!overlay || !linesEl) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const justLoggedIn = sessionStorage.getItem("blackwall_just_logged_in");
  sessionStorage.removeItem("blackwall_just_logged_in");

  if (prefersReduced || !justLoggedIn) {
    overlay.remove();
    return;
  }

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


  // converst an array of x and y points to css (clip-path: polygon(...)), making each value into a percentage
  function polygonStr(points) {
    return points.map((p) => (p[0] * 100) + "% " + (p[1] * 100) + "%").join(", ");
  }


  // both left and right define the movement for the left/right turns of the crack
  function leftPolygon() {
    return polygonStr([[0, 0], ...CRACK_POINTS, [0, 1]]);
  }

  function rightPolygon() {
    return polygonStr([[1, 0], ...CRACK_POINTS, [1, 1]]);
  }

  


  /**
   * dynamically creates an SVG element sized to the viewport, draws a path throw the CRACK_POINTS (which is
   * scaled to pixel coords instead of percentages) and sets up stroke-dasharray/stroke-dashoffset so the crack
   * line is animated as if being drawn. 
   * @returns { svg, path }
   */
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

  
  /**
   * the closing animation. its the splitting screen right after the crack_points being drawn.
   * it builds two divs (split-left, split-right) clipped with left/right polygons to simulate
   * the screen splitting apart, removing the original overlay (blackscreen), and triggers the split-open
   * animation class then finally cleans up both the split wrapper and the crack SVG after the animation
   * (700ms)
   */
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

  // recuresively types out each line of bootLines char by char, then after all are shown it clears them and calls shatterOverlay
  function nextLine() {
    if (i >= bootLines.length) {
      setTimeout(() => {
        linesEl.innerHTML = "";
        setTimeout(shatterOverlay, 500);
      }, 600);
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

  nextLine();
}
