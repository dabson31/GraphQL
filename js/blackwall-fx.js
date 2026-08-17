// (function () {
//   // const TICK_MS = 1400;      // how often we roll the dice
//   // const FIRE_CHANCE = 0.4;   // odds a given tick actually opens a rift
//   // const RIFT_LIFE_MS = 550;  // must stay in step with the bw-rift-grow keyframes
//   const CHUNK_COUNT = 5;

//   // paired [core color, tear-layer color], pulled from the same palette
//   // the rest of the HUD already uses, so a rift never introduces a color
//   // that doesn't belong on this screen. the second color is what jitters
//   // sideways under the first to sell the "double image" torn-open look
//   const STRIKE_PAIRS = [
//     ["#ff1937", "#00e8ff"],
//     ["#00e8ff", "#ff1937"],
//     ["#f4f6f5", "#ff1937"],
//   ];

//   let targets = [];
//   let busy = false; // only one rift in flight at a time, keeps it readable

//   function collectTargets() {
//     targets = Array.from(document.querySelectorAll(".chart-card, .stat-card, .cred-card"));
//   }

//   function randomBetween(min, max) {
//     return min + Math.random() * (max - min);
//   }

//   function fireOn(el) {
//     busy = true;

//     const [color, color2] = STRIKE_PAIRS[Math.floor(Math.random() * STRIKE_PAIRS.length)];
//     const wrap = document.createElement("div");
//     wrap.className = "bw-strike";
//     wrap.style.setProperty("--strike-color", color);
//     wrap.style.setProperty("--strike-color-2", color2);

//     const rift = document.createElement("div");
//     rift.className = "rift";
//     const riftLeft = randomBetween(12, 85);
//     rift.style.left = riftLeft + "%";
//     wrap.appendChild(rift);

//     // debris chunks fan out from a random point along the rift's height,
//     // not always dead center, so the burst doesn't look copy-pasted
//     // square, hard-edged, and stepped so they read as pixels jumping loose
//     // rather than a spark trail arcing away
//     const originY = randomBetween(25, 75);
//     for (let i = 0; i < CHUNK_COUNT; i++) {
//       const chunk = document.createElement("div");
//       chunk.className = "chunk";
//       chunk.style.left = riftLeft + "%";
//       chunk.style.top = originY + "%";
//       const angle = randomBetween(0, Math.PI * 2);
//       const dist = randomBetween(12, 30);
//       // rounded to whole pixels so the jump lands on a crisp square grid,
//       // not a fractional/sub-pixel blur
//       chunk.style.setProperty("--sx", Math.round(Math.cos(angle) * dist) + "px");
//       chunk.style.setProperty("--sy", Math.round(Math.sin(angle) * dist) + "px");
//       chunk.style.animationDelay = randomBetween(0, 0.08) + "s";
//       wrap.appendChild(chunk);
//     }

//     el.appendChild(wrap);
//     setTimeout(() => {
//       wrap.remove();
//       busy = false;
//     }, RIFT_LIFE_MS + 80);
//   }

//   function tick() {
//     if (!busy && targets.length && Math.random() < FIRE_CHANCE) {
//       const el = targets[Math.floor(Math.random() * targets.length)];
//       fireOn(el);
//     }
//   }

//   // cards render their content async (svg charts fill in after their own
//   // graphql calls resolve), but the card containers themselves are already
//   // in the static dom by the time this script runs at the bottom of the
//   // page, same assumption js/magnify.js already relies on
//   collectTargets();
//   if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
//     setInterval(tick, TICK_MS);
//   }
// })();
