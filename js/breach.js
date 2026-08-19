

(function () {
  const GRID_SIZE = 5;
  const CODE_POOL = ["1C", "E9", "55", "BD", "A4", "7F"];
  const BUFFER_SIZE = 7;
  const TIME_LIMIT = 67;


  const REDIRECT_URL = "https://youtu.be/QDia3e12czc?si=8SgnXuTJK3PynwJ4";

  const DAEMONS = [
    {
      id: "d1",
      name: "DATAMINE_V1",
      desc: "Extract a small amount of eddies.",
      codes: ["55", "1C"],
    },
    {
      id: "d2",
      name: "DATAMINE_V2",
      desc: "Extract a moderate amount of eddies, plus components.",
      codes: ["1C", "1C", "E9"],
    },
    {
      id: "d3",
      name: "ICE_BREAKER",
      desc: "Disable the BLACKWALL subroutine and unlock restricted files.",
      codes: ["BD", "E9", "55"],
    },
  ];

  let grid = [];
  let buffer = []; // { r, c, code }
  let used = new Set(); // "r,c"
  let constraintAxis = "row"; // axis the NEXT pick is constrained to
  let constraintValue = 0;
  let timeLeft = TIME_LIMIT;
  let timerHandle = null;
  let gameOver = false;
  let solved = new Set();

  let els = {};

  function rand(n) {
    return Math.floor(Math.random() * n);
  }

  function keyOf(r, c) {
    return r + "," + c;
  }

  // Try to lay a daemon's codes along a legal alternating path so the
  // puzzle is always solvable. Falls back to overwriting on repeated
  // failure rather than leaving a daemon unplaceable.
  function embedSequence(codes) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const path = [];
      let r = 0;
      let c = rand(GRID_SIZE);
      let axis = "col"; // axis the *next* step is constrained to
      path.push([r, c]);

      let ok = true;
      for (let i = 1; i < codes.length; i++) {
        let nr = r;
        let nc = c;
        if (axis === "col") {
          nr = rand(GRID_SIZE);
          if (nr === r && GRID_SIZE > 1) nr = (nr + 1) % GRID_SIZE;
        } else {
          nc = rand(GRID_SIZE);
          if (nc === c && GRID_SIZE > 1) nc = (nc + 1) % GRID_SIZE;
        }
        if (path.some(([pr, pc]) => pr === nr && pc === nc)) {
          ok = false;
          break;
        }
        path.push([nr, nc]);
        r = nr;
        c = nc;
        axis = axis === "col" ? "row" : "col";
      }

      if (!ok) continue;

      // check for conflicts against already-placed codes
      let conflict = false;
      for (let i = 0; i < path.length; i++) {
        const [pr, pc] = path[i];
        const existing = grid[pr][pc];
        if (existing !== null && existing !== codes[i]) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;

      path.forEach(([pr, pc], i) => {
        grid[pr][pc] = codes[i];
      });
      return true;
    }
    return false;
  }

  function buildGrid() {
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    DAEMONS.forEach((d) => embedSequence(d.codes));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === null) grid[r][c] = CODE_POOL[rand(CODE_POOL.length)];
      }
    }
  }

  function selectableCells() {
    const cells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (used.has(keyOf(r, c))) continue;
        if (buffer.length === 0) {
          if (r === 0) cells.push([r, c]);
        } else if (constraintAxis === "row") {
          if (r === constraintValue) cells.push([r, c]);
        } else {
          if (c === constraintValue) cells.push([r, c]);
        }
      }
    }
    return cells;
  }

  function renderGrid() {
    const selectable = new Set(selectableCells().map(([r, c]) => keyOf(r, c)));
    els.grid.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "breach-cell";
        cell.textContent = grid[r][c];
        const k = keyOf(r, c);
        if (used.has(k)) cell.classList.add("is-used");
        else if (!gameOver && selectable.has(k)) cell.classList.add("is-selectable");
        else cell.classList.add("is-locked");
        cell.disabled = gameOver || used.has(k) || !selectable.has(k);
        cell.addEventListener("click", () => pickCell(r, c));
        els.grid.appendChild(cell);
      }
    }
  }

  function renderBuffer() {
    els.buffer.innerHTML = "";
    for (let i = 0; i < BUFFER_SIZE; i++) {
      const slot = document.createElement("span");
      slot.className = "breach-buffer-slot";
      if (buffer[i]) {
        slot.textContent = buffer[i].code;
        slot.classList.add("is-filled");
      }
      els.buffer.appendChild(slot);
    }
    if (els.stop) els.stop.disabled = gameOver || buffer.length === 0;
  }

  function bufferCodes() {
    return buffer.map((b) => b.code);
  }

  function containsContiguous(haystack, needle) {
    for (let i = 0; i <= haystack.length - needle.length; i++) {
      let match = true;
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  function renderSequences() {
    els.sequences.innerHTML = "";
    const codes = bufferCodes();
    DAEMONS.forEach((d) => {
      if (!solved.has(d.id) && containsContiguous(codes, d.codes)) solved.add(d.id);
      const row = document.createElement("div");
      row.className = "breach-daemon" + (solved.has(d.id) ? " is-solved" : "");
      row.innerHTML =
        `<div class="breach-daemon-codes">${d.codes
          .map((code) => `<span>${code}</span>`)
          .join("")}</div>` +
        `<div class="breach-daemon-info"><span class="breach-daemon-name">${d.name}${
          solved.has(d.id) ? " ✓" : ""
        }</span><span class="breach-daemon-desc">${d.desc}</span></div>`;
      els.sequences.appendChild(row);
    });
  }

  function pickCell(r, c) {
    if (gameOver) return;
    const k = keyOf(r, c);
    if (used.has(k)) return;

    const selectable = selectableCells();
    if (!selectable.some(([sr, sc]) => sr === r && sc === c)) return;

    buffer.push({ r, c, code: grid[r][c] });
    used.add(k);

    if (buffer.length === 1) {
      constraintAxis = "col";
      constraintValue = c;
    } else if (constraintAxis === "col") {
      constraintAxis = "row";
      constraintValue = r;
    } else {
      constraintAxis = "col";
      constraintValue = c;
    }

    renderGrid();
    renderBuffer();
    renderSequences();

    const stillSelectable = selectableCells().length > 0;
    if (buffer.length >= BUFFER_SIZE || !stillSelectable) {
      endGame();
    }
  }

  function tick() {
    timeLeft = Math.max(0, timeLeft - 0.1);
    els.timer.textContent = timeLeft.toFixed(2);
    if (timeLeft <= 0) endGame();
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    clearInterval(timerHandle);
    renderGrid();

    const won = solved.size > 0 && timeLeft > 0;
    els.result.classList.remove("is-hidden");
    if (won) {
      els.result.classList.add("is-success");
      els.result.classList.remove("is-failure");
      els.resultTitle.textContent = "BREACH SUCCESSFUL";
      els.resultBody.textContent =
        solved.size === DAEMONS.length
          ? "All daemons uploaded. BLACKWALL subroutine disabled."
          : `${solved.size}/${DAEMONS.length} daemon(s) uploaded.`;
      if (solved.has("d3")) {
        document.dispatchEvent(new CustomEvent("breach:unlocked"));
        if (REDIRECT_URL && els.accessBtn) {
          els.accessBtn.href = REDIRECT_URL;
          els.accessBtn.target = "_blank";
          els.accessBtn.rel = "noopener";
        }
      }
    } else {
      els.result.classList.add("is-failure");
      els.result.classList.remove("is-success");
      els.resultTitle.textContent = "CONNECTION SEVERED";
      els.resultBody.textContent = "Trace complete. No daemons uploaded.";
    }
  }

  function resetGame() {
    buffer = [];
    used = new Set();
    constraintAxis = "row";
    constraintValue = 0;
    timeLeft = TIME_LIMIT;
    gameOver = false;
    solved = new Set();
    buildGrid();
    els.result.classList.add("is-hidden");
    els.result.classList.remove("is-success", "is-failure");
    els.timer.textContent = timeLeft.toFixed(2);
    renderGrid();
    renderBuffer();
    renderSequences();
    clearInterval(timerHandle);
    timerHandle = setInterval(tick, 100);
  }

  function init() {
    const root = document.getElementById("breachProtocol");
    if (!root) return;
    els = {
      root,
      grid: root.querySelector("#breachGrid"),
      buffer: root.querySelector("#breachBuffer"),
      sequences: root.querySelector("#breachSequences"),
      timer: root.querySelector("#breachTimer"),
      result: root.querySelector("#breachResult"),
      resultTitle: root.querySelector("#breachResultTitle"),
      resultBody: root.querySelector("#breachResultBody"),
      retry: root.querySelector("#breachRetry"),
      stop: root.querySelector("#breachStop"),
      accessBtn: document.getElementById("breachAccessBtn"),
    };
    els.retry.addEventListener("click", resetGame);
    if (els.stop) els.stop.addEventListener("click", () => endGame());
    resetGame();
  }

  document.addEventListener("DOMContentLoaded", init);
})();