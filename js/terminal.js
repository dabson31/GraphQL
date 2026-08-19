(function () {
  const CLICK_DECAY_MS = 2200;
  const titleEl = document.querySelector(".title-band .glitch");
  if (!titleEl) return;

  let clicks = 0;
  let decayTimer = null;
  let restrictedLabel = null;

  function resetProgress() {
    clicks = 0;
    titleEl.classList.remove("bw-title-glitch", "bw-title-flicker");
    if (restrictedLabel) {
      restrictedLabel.classList.remove("show");
    }
  }

  function armDecay() {
    clearTimeout(decayTimer);
    decayTimer = setTimeout(resetProgress, CLICK_DECAY_MS);
  }

  function ensureRestrictedLabel() {
    if (restrictedLabel) return restrictedLabel;
    const el = document.createElement("div");
    el.className = "bw-restricted-label";
    el.textContent = "BLACKWALL // RESTRICTED";
    titleEl.insertAdjacentElement("afterend", el);
    restrictedLabel = el;
    return el;
  }

  titleEl.addEventListener("click", () => {
    clicks++;
    armDecay();

    if (clicks === 3) {
      titleEl.classList.remove("bw-title-glitch");
      void titleEl.offsetWidth;
      titleEl.classList.add("bw-title-glitch");
    }

    if (clicks === 5) {
      titleEl.classList.add("bw-title-flicker");
    }

    if (clicks === 7) {
      ensureRestrictedLabel().classList.add("show");
    }

    if (clicks >= 8) {
      resetProgress();
      openTerminal();
    }
  });

  // ---------------- terminal ----------------

  let termEl = null;
  let inputEl = null;
  let outputEl = null;

  function buildTerminal() {
    const overlay = document.createElement("div");
    overlay.className = "bw-terminal-overlay";
    overlay.innerHTML = `
      <div class="bw-terminal" role="dialog" aria-label="Blackwall terminal">
        <div class="bw-terminal-bar">
          <span>BLACKWALL // RESTRICTED SHELL</span>
          <button type="button" class="bw-terminal-close" aria-label="Close terminal">×</button>
        </div>
        <div class="bw-terminal-body">
          <div class="bw-terminal-output"></div>
          <div class="bw-terminal-inputline">
            <span class="bw-terminal-prompt">&gt;</span>
            <input class="bw-terminal-input" type="text" autocomplete="off" spellcheck="false" />
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector(".bw-terminal-close").addEventListener("click", closeTerminal);
    let outsideClicks = 0;
    let outsideDecayTimer = null;
    overlay.addEventListener("click", (e) => {
      if (e.target !== overlay) return;
      outsideClicks++;
      clearTimeout(outsideDecayTimer);
      outsideDecayTimer = setTimeout(() => {
        outsideClicks = 0;
      }, 1500);
      if (outsideClicks >= 4) {
        outsideClicks = 0;
        closeTerminal();
      }
    });

    termEl = overlay;
    outputEl = overlay.querySelector(".bw-terminal-output");
    inputEl = overlay.querySelector(".bw-terminal-input");

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const raw = inputEl.value;
        inputEl.value = "";
        handleCommand(raw);
      }
    });

    document.addEventListener("keydown", escListener);

    return overlay;
  }

  function escListener(e) {
    if (e.key === "Escape" && termEl && termEl.classList.contains("open")) {
      closeTerminal();
    }
  }

  const REDUCE_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GLITCH_CHARS = "!<>-_\\/[]{}=+*^?#$%&01\u2588\u2591\u2592";

  function typeInto(el, text, speed) {
    return new Promise((resolve) => {
      if (REDUCE_MOTION || !text) {
        el.textContent = text;
        resolve();
        return;
      }
      let i = 0;
      const step = () => {
        if (i >= text.length) {
          el.textContent = text;
          resolve();
          return;
        }
        const showGlitch = Math.random() < 0.3;
        el.textContent =
          text.slice(0, i) +
          (showGlitch ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : text[i]);
        if (!showGlitch) i++;
        outputEl.scrollTop = outputEl.scrollHeight;
        setTimeout(step, speed + Math.random() * (showGlitch ? 10 : 14));
      };
      step();
    });
  }

  function printLineInstant(text, cls) {
    const line = document.createElement("div");
    line.className = "bw-terminal-line" + (cls ? " " + cls : "");
    line.textContent = text;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
    return line;
  }

  function printLine(text, cls, speed) {
    const line = document.createElement("div");
    line.className = "bw-terminal-line" + (cls ? " " + cls : "");
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
    return typeInto(line, text, speed || 10);
  }

  function printBlock(lines, cls) {
    lines.forEach((l) => printLine(l, cls));
  }

  function openTerminal() {
    if (!termEl) buildTerminal();
    termEl.classList.add("open");
    outputEl.innerHTML = "";
    printLine("BLACKWALL // RESTRICTED SHELL -- connection established.");
    printLine("type `help` for a list of commands.");
    printLine("");
    inputEl.value = "";
    setTimeout(() => inputEl.focus(), 30);
  }

  function closeTerminal() {
    if (termEl) termEl.classList.remove("open");
  }

  async function handleCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    printLineInstant("> " + raw, "bw-terminal-echo");

    if (!cmd) return;

    const parts = cmd.split(/\s+/).filter(Boolean);
    const base = parts[0];
    const flags = parts.slice(1);

    switch (base) {
      case "help":
        printBlock([
          "AVAILABLE COMMANDS",
          "  help                       list commands",
          "  whoami                     deep-scan this rig + your identity",
          "  sysinfo                    alias for whoami",
          "  scan                       run a fake threat/intrusion sweep",
          "  ping <host>                real HTTPS round-trip timing to a host",
          "  matrix                     toggle a full-screen code-rain overlay",
          "  profile                    open your netrunner file",
          "  profile <login-or-id>      open someone else's netrunner file",
          "  date                       print local date/time + timezone",
          "  shownetrunners             list netrunners in your cohort as a bar chart",
          "  shownetrunners -t          plain table instead of the chart",
          "                             (--table also works)",
          "  shownetrunners --list      list every event you're on, with its id",
          "                             (-l also works)",
          "  shownetrunners --event <id-or-path>",
          "                             force a specific event instead of the",
          "                             auto-detected cohort (-e also works)",
          "  shownetrunners --all [maxId]",
          "                             brute-force every eventId from 1..maxId",
          "                             (default 1500) and list EVERY netrunner's",
          "                             audit ratio, deduped by user id. slow --",
          "                             see warning printed before it runs",
          "                             (-a also works)",
          "  clear                      wipe the shell output",
          "  exit                       close this shell",
        ]);
        break;

      case "whoami":
      case "sysinfo":
        await runWhoami();
        break;

      case "scan":
        runScan();
        break;

      case "ping":
        await runPing(flags[0]);
        break;

      case "matrix":
        toggleMatrix();
        break;

      case "profile":
        goToProfile(flags[0]);
        break;

      case "date":
        printLine(new Date().toString(), "bw-terminal-cryptic");
        break;

      case "shownetrunners": {
        if (flags.includes("--all") || flags.includes("-a")) {
          await runShowAllAuditRatios(flags);
        } else {
          await runShowNetrunners(flags);
        }
        break;
      }

      case "exit":
        printLine("closing shell...");
        setTimeout(closeTerminal, 220);
        break;

      case "clear":
        outputEl.innerHTML = "";
        break;

      default:
        printLine(`unrecognized command: "${cmd}" -- type \`help\``, "bw-terminal-error");
    }
  }

  // pulls the authenticated user's cohort event(s) via the usersRelation on
  // `event`, then lists every netrunner tied to the chosen event straight
  // off event_user's own userLogin/userAuditRatio columns, sorted
  // server-side.
  //
  //   query ($uid: Int) {
  //     event(
  //       where: {
  //         usersRelation: { userId: { _eq: $uid } }
  //         object: { type: { _in: ["module"] } }
  //       }
  //     ) {
  //       id
  //       path
  //     }
  //   }
  //
  //   query ($eid: Int) {
  //     event_user(where: { eventId: { _eq: $eid } }, order_by: { userAuditRatio: desc }) {
  //       userLogin
  //       userAuditRatio
  //     }
  //   }
  //
  //
  //   shownetrunners                         -> bar chart (default now)
  //   shownetrunners -t / --table            -> plain table instead of the chart
  //   shownetrunners --list                  -> print every event you're on
  //   shownetrunners --event <id>            -> force that eventId
  //   shownetrunners --event <path fragment> -> force whichever membership's
  //                                              path contains that fragment
  async function runShowNetrunners(flags) {
    printLine("tracing cohort uplink...");
    try {
      const me = await graphqlQuery(`{ user { id login } }`);
      const myId = me.user[0].id;
      const myLogin = me.user[0].login;

      const myEvents = await graphqlQuery(
        `query ($uid: Int) {
          event(
            where: {
              usersRelation: { userId: { _eq: $uid } }
              object: { type: { _in: ["module"] } }
            }
          ) {
            id
            path
          }
        }`,
        { uid: myId }
      );

      const memberships = myEvents.event || [];
      if (!memberships.length) {
        printLine("no cohort event on record for this identity.", "bw-terminal-error");
        return;
      }

      if (flags.includes("--list") || flags.includes("-l")) {
        printLine(`${memberships.length} event membership(s) on record:`);
        printLine("");
        memberships.forEach((m) => {
          printLine(`  [${m.id}] ${m.path || "(no path)"}`);
        });
        printLine("");
        printLine("run: shownetrunners --event <id-or-path-fragment> [-t]");
        return;
      }

      const eventFlagIdx = flags.findIndex((f) => f === "--event" || f === "-e");
      const explicitEvent = eventFlagIdx !== -1 ? flags[eventFlagIdx + 1] : null;

      let cohort;
      let candidates = null;

      if (explicitEvent) {
        if (/^\d+$/.test(explicitEvent)) {
          cohort =
            memberships.find((m) => String(m.id) === explicitEvent) ||
            { id: Number(explicitEvent), path: null };
        } else {
          cohort = memberships.find((m) =>
            (m.path || "").toLowerCase().includes(explicitEvent)
          );
        }
        if (!cohort) {
          printLine(`no membership matching "${explicitEvent}".`, "bw-terminal-error");
          printLine("run `shownetrunners --list` to see valid ids/paths.", "bw-terminal-error");
          return;
        }
      } else {
        const nonPiscine = memberships.filter((m) => !/piscine/i.test(m.path || ""));
        const pool = nonPiscine.length ? nonPiscine : memberships;

        const sorted = [...pool].sort(
          (a, b) =>
            (b.path || "").split("/").length - (a.path || "").split("/").length
        );
        cohort = sorted[0];
        if (sorted.length > 1) candidates = sorted;
      }

      const roster = await graphqlQuery(
        `query ($eid: Int) {
          event_user(
            where: { eventId: { _eq: $eid } }
            order_by: { userAuditRatio: desc }
          ) {
            userLogin
            userAuditRatio
          }
        }`,
        { eid: cohort.id }
      );

      const members = (roster.event_user || [])
        .filter((r) => r.userLogin)
        .map((r) => ({ login: r.userLogin, auditRatio: r.userAuditRatio || 0 }));

      if (!members.length) {
        printLine("cohort roster came back empty.", "bw-terminal-error");
        return;
      }

      printLine(
        `COHORT: ${cohort.path || "eventId " + cohort.id} -- ${members.length} netrunners`
      );

      if (candidates) {
        printLine(
          `(auto-picked deepest path out of ${candidates.length} candidates -- ` +
            `\`shownetrunners --list\` to see the rest, --event to override)`,
          "bw-terminal-cryptic"
        );
      }
      printLine("");

      const tableMode = flags.includes("-t") || flags.includes("--table");
      if (tableMode) {
        const loginWidth = Math.max(...members.map((m) => m.login.length), 5) + 2;
        members.forEach((m) => {
          const flag = m.login === myLogin ? " (you)" : "";
          printLine(m.login.padEnd(loginWidth, " ") + "audit " + m.auditRatio.toFixed(2) + flag);
        });
      } else {
        printChart(members, myLogin);
      }
    } catch (err) {
      printLine("uplink failed: " + err.message, "bw-terminal-error");
    }
  }

  // brute-force sweep: hits event_user for every eventId in [1, maxId] and
  // pools every (userId, userLogin, userAuditRatio) row it gets back,
  // de-duping on userId (first hit wins) since the same person can turn up
  // under more than one event. server-side row-level security means most
  // ids will just come back empty rather than erroring, but there's no way
  // to know the real ceiling up front, so this is inherently a guess-and-
  // sweep operation, not a targeted query.
  //
  //   for (id = 1; id <= maxId; id++):
  //     event_user(where: { eventId: { _eq: id } }, order_by: { userAuditRatio: desc }) {
  //       userId
  //       userLogin
  //       userAuditRatio
  //     }
  //
  //   shownetrunners --all            -> sweep ids 1..1500 (default cap)
  //   shownetrunners --all 4000       -> sweep ids 1..4000 instead
  const SWEEP_DEFAULT_MAX = 1500;
  const SWEEP_BATCH_SIZE = 20;      // concurrent requests per batch
  const SWEEP_BATCH_DELAY_MS = 120; // pause between batches so it doesn't hammer the api

  async function runShowAllAuditRatios(flags) {
    const flagIdx = flags.findIndex((f) => f === "--all" || f === "-a");
    const argAfter = flags[flagIdx + 1];
    const maxId = /^\d+$/.test(argAfter) ? Number(argAfter) : SWEEP_DEFAULT_MAX;

    const batches = Math.ceil(maxId / SWEEP_BATCH_SIZE);
    const estSeconds = Math.round((batches * SWEEP_BATCH_DELAY_MS) / 1000 + batches * 0.3);

    printLine(`sweeping eventId 1..${maxId} (${batches} batches of ${SWEEP_BATCH_SIZE} parallel requests).`, "bw-terminal-cryptic");
    printLine(`this is a brute-force scan, not a real query -- expect roughly ${estSeconds}s, more if the relay is slow.`, "bw-terminal-cryptic");
    printLine(`most ids will come back empty (no access / no such event) -- that's expected.`, "bw-terminal-cryptic");
    printLine("");

    const seen = new Map(); // userId -> { login, auditRatio }
    let hitEvents = 0;
    let emptyOk = 0;
    let deniedCount = 0;
    let firstDeniedMsg = null;

    for (let start = 1; start <= maxId; start += SWEEP_BATCH_SIZE) {
      const ids = [];
      for (let id = start; id < start + SWEEP_BATCH_SIZE && id <= maxId; id++) ids.push(id);

      const results = await Promise.all(
        ids.map((id) =>
          graphqlQuery(
            `query ($eid: Int) {
              event_user(where: { eventId: { _eq: $eid } }, order_by: { userAuditRatio: desc }) {
                userId
                userLogin
                userAuditRatio
              }
            }`,
            { eid: id }
          )
            .then((r) => ({ ok: true, data: r }))
            // a dead/forbidden id shouldn't kill the whole sweep, but tag it
            // as denied instead of silently treating it the same as "empty"
            .catch((err) => ({ ok: false, error: err.message }))
        )
      );

      results.forEach((r) => {
        if (!r.ok) {
          deniedCount++;
          if (!firstDeniedMsg) firstDeniedMsg = r.error;
          return;
        }
        const rows = r.data.event_user || [];
        if (rows.length) {
          hitEvents++;
        } else {
          emptyOk++;
        }
        rows.forEach((row) => {
          if (!row.userId || seen.has(row.userId)) return; // dedupe on uid
          seen.set(row.userId, { login: row.userLogin, auditRatio: row.userAuditRatio || 0 });
        });
      });

      if (start % (SWEEP_BATCH_SIZE * 10) === 1) {
        printLine(`  ...${Math.min(start + SWEEP_BATCH_SIZE - 1, maxId)}/${maxId} ids swept, ${seen.size} unique netrunners so far`, "bw-terminal-cryptic");
      }

      if (start + SWEEP_BATCH_SIZE <= maxId) {
        await new Promise((resolve) => setTimeout(resolve, SWEEP_BATCH_DELAY_MS));
      }
    }

    const members = [...seen.values()].sort((a, b) => b.auditRatio - a.auditRatio);

    printLine("");
    printLine(`sweep complete -- ${hitEvents} id(s) with data, ${emptyOk} empty-but-readable, ${deniedCount} denied/errored, ${members.length} unique netrunners.`);
    if (deniedCount > 0) {
      printLine(
        `${deniedCount} id(s) were rejected by the relay rather than just empty -- ` +
          `most likely the api's row-level permissions only let your token read event_user ` +
          `rows for events you're actually a member of. that's enforced server-side and can't ` +
          `be worked around from here, no matter how the query loop is written.`,
        "bw-terminal-cryptic"
      );
      if (firstDeniedMsg) {
        printLine(`  sample error: ${firstDeniedMsg}`, "bw-terminal-cryptic");
      }
    }
    printLine("");

    if (!members.length) {
      printLine("nothing came back. either the range was wrong or access is locked down per-event.", "bw-terminal-error");
      return;
    }

    const loginWidth = Math.max(...members.map((m) => (m.login || "?").length), 5) + 2;
    members.forEach((m) => {
      printLine((m.login || "?").padEnd(loginWidth, " ") + "audit " + m.auditRatio.toFixed(2));
    });
  }

  // renders `members` ([{login, auditRatio}]) as a monospace horizontal bar
  // chart, one row per netrunner. the chart sits in its own no-wrap,
  // horizontally-scrollable strip (see .bw-terminal-chart in style.css) so
  // long rosters / long logins scroll instead of collapsing the bars.
  const CHART_BAR_MAX = 36;

  function printChart(members, myLogin) {
    const maxRatio = Math.max(...members.map((m) => m.auditRatio), 0.01);
    const loginWidth = Math.max(...members.map((m) => m.login.length), 5);

    const wrapper = document.createElement("div");
    wrapper.className = "bw-terminal-chart";
    outputEl.appendChild(wrapper);
    outputEl.scrollTop = outputEl.scrollHeight;

    members.forEach((m, idx) => {
      setTimeout(() => {
        const barLen = Math.max(1, Math.round((m.auditRatio / maxRatio) * CHART_BAR_MAX));
        const isYou = m.login === myLogin;

        const row = document.createElement("div");
        row.className = "bw-chart-row" + (isYou ? " bw-chart-row--you" : "");

        const label = document.createElement("span");
        label.className = "bw-chart-label";
        const bar = document.createElement("span");
        bar.className = "bw-chart-bar";
        const value = document.createElement("span");
        value.className = "bw-chart-value";

        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(value);
        wrapper.appendChild(row);
        outputEl.scrollTop = outputEl.scrollHeight;

        typeInto(label, m.login.padEnd(loginWidth, " ") + " ", 7)
          .then(() => typeInto(bar, "\u2588".repeat(barLen), 5))
          .then(() => typeInto(value, " " + m.auditRatio.toFixed(2) + (isYou ? " (you)" : ""), 9));
      }, idx * 90);
    });
  }

  const CRYPTIC_TAILS = [
    "no anomalies flagged this cycle.",
    "background trace running -- low priority.",
    "netwatch flag: none on file.",
    "last handshake nominal.",
    "signal integrity within tolerance.",
    "no known relichunter activity nearby.",
  ];

  function fakeIP(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const oct = (n) => 10 + (n % 240);
    return `${oct(h)}.${oct(h >> 8)}.${oct(h >> 16)}.${oct(h >> 24)}`;
  }

  function goToProfile(target) {
    if (target) {
      sessionStorage.setItem("blackwall_profile_target", target);
      printLine(`redirecting to netrunner file: ${target}...`, "bw-terminal-cryptic");
    } else {
      sessionStorage.removeItem("blackwall_profile_target");
      printLine("redirecting to your netrunner file...", "bw-terminal-cryptic");
    }
    setTimeout(() => {
      window.location.href = "profile-detail.html";
    }, 260);
  }

  async function runWhoami() {
    printLine("running deep scan...");
    try {
      const me = await graphqlQuery(`{ user { id login } }`);
      const login = me.user[0].login;
      const id = me.user[0].id;

      const nav = navigator;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
      const cores = nav.hardwareConcurrency ? nav.hardwareConcurrency + " threads" : "unknown";
      const mem = nav.deviceMemory ? nav.deviceMemory + " GB (approx, browser-reported)" : "undisclosed";
      const res = `${screen.width}x${screen.height} @${window.devicePixelRatio || 1}x`;
      const lang = nav.language || "unknown";
      const platform = nav.platform || "unknown";
      const online = nav.onLine ? "CONNECTED" : "OFFLINE";
      const tail = CRYPTIC_TAILS[Math.floor(Math.random() * CRYPTIC_TAILS.length)];

      printBlock([
        `IDENTITY: ${login} (uid ${id})`,
        `NET STATUS: ${online} -- spoofed uplink ${fakeIP(login)}`,
      ], "bw-terminal-cryptic");
      printLine("");
      printBlock([
        "-- LOCAL RIG --",
        `  OS/PLATFORM   ${platform}`,
        `  CORES         ${cores}`,
        `  MEMORY        ${mem}`,
        `  DISPLAY       ${res}`,
        `  LOCALE        ${lang}`,
        `  TIMEZONE      ${tz}`,
        `  USER AGENT    ${nav.userAgent}`,
      ]);
      printLine("");
      printLine(tail, "bw-terminal-cryptic");
    } catch (err) {
      printLine("scan failed: " + err.message, "bw-terminal-error");
    }
  }

  const SCAN_TARGETS = [
    "local subnet", "nearest relay node", "cached DNS table",
    "open ports on this rig", "known netrunner beacons", "session cookies",
  ];

  const BAR_LEN = 24;

  function runScan() {
    printLine("initiating sweep...");

    const barLine = printLineInstant("[" + "-".repeat(BAR_LEN) + "] 0%", "bw-terminal-cryptic");
    let pct = 0;

    const barTimer = setInterval(() => {
      pct = Math.min(100, pct + 8 + Math.random() * 10);
      const filled = Math.round((pct / 100) * BAR_LEN);
      barLine.textContent =
        "[" + "\u2588".repeat(filled) + "-".repeat(BAR_LEN - filled) + "] " + Math.floor(pct) + "%";
      outputEl.scrollTop = outputEl.scrollHeight;

      if (pct >= 100) {
        clearInterval(barTimer);
        setTimeout(() => {
          printLine("SWEEP COMPLETE", "bw-terminal-cryptic");
          const n = 2 + Math.floor(Math.random() * 3);
          const pool = [...SCAN_TARGETS].sort(() => Math.random() - 0.5).slice(0, n);
          pool.forEach((t, idx) => {
            const flagged = Math.random() < 0.15;
            const cls = flagged ? "bw-terminal-warn" : "bw-terminal-ok";
            const mark = flagged ? "!" : "\u2713";
            setTimeout(() => {
              printLine(`  [${mark}] ${t} -- ${flagged ? "flagged, monitoring" : "clean"}`, cls);
            }, idx * 140);
          });
          setTimeout(() => {
            printLine("no active intrusions detected.", "bw-terminal-cryptic");
          }, pool.length * 140 + 120);
        }, 200);
      }
    }, 140);
  }

  async function runPing(hostArg) {
    let host = (hostArg || "www.google.com").replace(/^https?:\/\//, "").split("/")[0];
    const PING_BAR_LEN = 16;
    const MAX_MS = 400;

    printLine(`PING ${host} (real HTTPS round-trip, 4 requests)`);

    let sent = 0;
    let received = 0;

    for (let i = 0; i < 4; i++) {
      sent++;
      const url = `https://${host}/favicon.ico?_=${Date.now()}`;
      const start = performance.now();
      try {
        await fetch(url, { mode: "no-cors", cache: "no-store" });
        const ms = performance.now() - start;
        received++;
        const cls = ms < 80 ? "bw-terminal-ok" : ms < 200 ? "bw-terminal-warn" : "bw-terminal-error";
        const filled = Math.max(1, Math.round((Math.min(ms, MAX_MS) / MAX_MS) * PING_BAR_LEN));
        const bar = "\u2588".repeat(filled) + "\u00b7".repeat(PING_BAR_LEN - filled);
        await printLine(`  seq=${i + 1} [${bar}] time=${ms.toFixed(1)}ms`, cls);
      } catch (err) {
        await printLine(`  seq=${i + 1} request failed -- unreachable or blocked`, "bw-terminal-error");
      }
      if (i < 3) await new Promise((r) => setTimeout(r, 150));
    }

    const lossPct = Math.round(((sent - received) / sent) * 100);
    printLine(`${host} -- ${sent} sent, ${received} received, ${lossPct}% loss`, "bw-terminal-cryptic");
  }

  let matrixCanvas = null;
  let matrixCtx = null;
  let matrixRAF = null;
  let matrixCols = [];
  let matrixResizeHandler = null;

  const MATRIX_CHARS = "\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd0123456789";
  const MATRIX_FONT_SIZE = 17;
  const MATRIX_FRAME_MS = 90;
  const MATRIX_COL_DENSITY = 0.55;

  function toggleMatrix() {
    if (matrixCanvas) {
      stopMatrix();
      printLine("matrix overlay: OFF", "bw-terminal-cryptic");
    } else {
      startMatrix();
      printLine("matrix overlay: ON", "bw-terminal-cryptic");
    }
  }

  function startMatrix() {
    matrixCanvas = document.createElement("canvas");
    matrixCanvas.className = "bw-matrix-canvas";
    document.body.appendChild(matrixCanvas);
    matrixCtx = matrixCanvas.getContext("2d");

    const resize = () => {
      matrixCanvas.width = window.innerWidth;
      matrixCanvas.height = window.innerHeight;
      const cols = Math.ceil(matrixCanvas.width / MATRIX_FONT_SIZE);
      matrixCols = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -60));
    };
    resize();
    matrixResizeHandler = resize;
    window.addEventListener("resize", matrixResizeHandler);

    let lastTick = 0;
    const draw = (ts) => {
      matrixRAF = requestAnimationFrame(draw);
      if (ts - lastTick < MATRIX_FRAME_MS) return;
      lastTick = ts;

      matrixCtx.fillStyle = "rgba(3, 3, 4, 0.16)";
      matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      matrixCtx.font = MATRIX_FONT_SIZE + "px monospace";

      for (let i = 0; i < matrixCols.length; i++) {
        if (Math.random() > MATRIX_COL_DENSITY) continue;

        const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const isGlint = Math.random() < 0.05;
        matrixCtx.fillStyle = isGlint ? "#ff003c" : "#5c0316";
        matrixCtx.fillText(ch, i * MATRIX_FONT_SIZE, matrixCols[i] * MATRIX_FONT_SIZE);

        if (matrixCols[i] * MATRIX_FONT_SIZE > matrixCanvas.height && Math.random() > 0.985) {
          matrixCols[i] = Math.floor(Math.random() * -30);
        }
        matrixCols[i]++;
      }
    };
    matrixRAF = requestAnimationFrame(draw);
  }

  function stopMatrix() {
    if (matrixRAF) cancelAnimationFrame(matrixRAF);
    if (matrixResizeHandler) window.removeEventListener("resize", matrixResizeHandler);
    if (matrixCanvas) matrixCanvas.remove();
    matrixCanvas = null;
    matrixCtx = null;
    matrixRAF = null;
    matrixResizeHandler = null;
  }
})();