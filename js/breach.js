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
  let buffer = []; 
  let used = new Set(); 
  let constraintAxis = "row"; 
  let constraintValue = 0;
  let timeLeft = TIME_LIMIT;
  let timerHandle = null;
  let gameOver = false;
  let solved = new Set();

  let els = {};

  // randomize helper
  function rand(n) {
    return Math.floor(Math.random() * n);
  }

  /**
   * this turns the grid coordinates into a unique string key
   * it concats row and columns with a comma and returns them
   * @param {int} r 
   * @param {int} c 
   * @returns {string} "r,c" (like "2,3")
   */
  function keyOf(r, c) {
    return r + "," + c;
  }

  
  
  /**
   * this is the grid generation helper that plants daemon's required hex code sequence
   * into the grid, with a valid connecting zig-zag method path. it loops up to 60 times
   * to build a path starting on row 0, alternating between choosing a random row (when moving
   * in the column) and a random column (when moving in a row), matching the logic of
   * the game's minigame. if the path revists a cell or has conflict with hex codes already
   * placed by a previous daemon's sequence, it rejects them automatically. On success, it writes
   * the sequence's codes into the shared grid array along that path
   * @param {Array<string>} codes (hex codes like 55, 1C etc)
   * @returns {boolean} true if valid placements were found and written, false if it failed after 60 loops/attempts)
   */
  function embedSequence(codes) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const path = [];
      let r = 0;
      let c = rand(GRID_SIZE);
      let axis = "col"; 
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

  /**
   * this initializes the grid, it basically creates an empty grid, calls
   * embedSequence() for every daemon to check for validity and fills
   * every empty cell with a random code from code_pool randomly afterwards.
   * @returns undefined (just prepares the grid array)
   */
  function buildGrid() {
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    DAEMONS.forEach((d) => embedSequence(d.codes));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === null) grid[r][c] = CODE_POOL[rand(CODE_POOL.length)];
      }
    }
  }

  /**
   * this function computes which grid cells the player is allowed to choose
   * currently, based on the selection rule of the game. if nothing is selected, only
   * the first row cells (row 0 cells) are selectable, else, dependings on the
   * constraintAxis (row/col), only the cells in the current constrained row or column
   * that have not been used yet are selectable.
   * @returns {array [row, col]} (representing all selectable cells)
   */

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

  /**
   * DOM renderer for the grid, it rebuilds the els.grid's content and creates
   * one button per cell, applying the CSS classes based on if its used or not,
   * if its selectable or if its locked. Disabling non-selectable or used or
   * game-over cells and wires each button's click to "pickCell(r, c)"
   */
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

  /**
   * DOM renderer for the buffer (showing a row of selected codes so far)
   * it rebuilds the els.buffer with BUFFER_SIZE slots, filling the codes that
   * are already in the buffer, and enables/disables the stop button based on whether
   * the game has started or not (if anything has been picked)
   */
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

  /**
   * this checks whether the needle array appears as a "contiguous" run
   * inside the haysack (basically checks if the player's buffer contains
   * the daemon's full code sequence in order) it stores all the inputs,
   * uses a nested loop to check if any 2/3 consequetive numbers match
   * any of the breachs, and returns true for the respective one in that
   * case
   * @param {Array<string>} haystack 
   * @param {Array<string>} needle 
   * @returns true | false
   */
  function containsContiguous(haystack, needle) {
    for (let i = 0; i <= haystack.length - needle.length; i++) {
      let match = true;
      for (let j = 0; j < needle.length; j++) {
        // console.log(haystack[i + j] + "THIS IS HAYSTACK")
        // console.log(needle[j] + " THIS IS NEEDLE")
        if (haystack[i + j] !== needle[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  /**
   * DOM renderer and a solve-checker for the daemon objectives
   * for each daemon in daemons, it checks with containsCongtiguous() if
   * the code sequence now appears in the buffer and marks it solved if it
   * is (explained in containsContiguous), it then rebuilds the sequence list
   * UI, showing each daemon's codes, name, description and a checkmark indicating
   * its solved if it is 
   */
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

  /**
   * click handler for selecting a grid cell
   * it validates whether the cell is selectable or not, checking
   * if its used. It pushes it onto buffer, marks it as used and
   * updates the alternating constraints per the game rules, then
   * re-renders the grid, the buffer and the sequence. It ends the
   * game if the buffer is full, or no more cells are selectable
   * @param {int} r 
   * @param {int} c 
   * @returns undefined
   */
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

  /**
   * timer
   * it just decrements the timeLeft by .1s, updates the timer display and
   * ends the game if the time reaches 0.
   */
  function tick() {
    timeLeft = Math.max(0, timeLeft - 0.1);
    els.timer.textContent = timeLeft.toFixed(2);
    if (timeLeft <= 0) endGame();
  }

  /**
   * ends the game when called
   * it stops the timer, re-renders the grid to lock all cells and
   * determines a win or a loss, its considered a win if at least
   * one daemon is solved with some time remaining. it updates
   * the result panel text/classes accordingly and if the third
   * and hardest daemon was solved (ice_breaker), it dispatches
   * the breach:unlocked custom evvent and rewires the access button 
   * to link to a rickroll  
   */
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
          els.accessBtn.removeAttribute("data-link");
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

  /**
   * sets up the DOM references and game state, then starts the minigame
   * it basically finds #breachProtocol in the DOM, and caches references
   * to all the sub-elements (the grids, buffer, timer, result etc)
   * into the els object, then binds the retry and stop buttons, and
   * lastly calls resetGame() for a fresh start. exits if no breachProtocol
   * exists in the DOM
   * @returns undefined
   */

  function init() {
    const root = document.getElementById("breachProtocol");
    if (!root) return;
    els = {
      root,
      grid: root.querySelector("#breachGrid"), // grid
      buffer: root.querySelector("#breachBuffer"), // chosen daemons
      sequences: root.querySelector("#breachSequences"), // req sequences
      timer: root.querySelector("#breachTimer"), // timer
      result: root.querySelector("#breachResult"), // end result
      resultTitle: root.querySelector("#breachResultTitle"), // end title
      resultBody: root.querySelector("#breachResultBody"), // end body
      retry: root.querySelector("#breachRetry"), // end retry
      stop: root.querySelector("#breachStop"), // stop button
      accessBtn: document.getElementById("breachAccessBtn"), // win access
    };
    els.retry.addEventListener("click", resetGame);
    if (els.stop) els.stop.addEventListener("click", () => endGame());
    resetGame();
  }

  
  
  /**
   * this is the hacking minigame, not a requirement but i still
   * wanted to do it as an easter egg, this is the entry point
   * for the entre minigame, it initializes it using init()
   */
  export function startBreachProtocol() {
    init();
  }