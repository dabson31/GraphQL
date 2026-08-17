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
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeTerminal();
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

  function printLine(text, cls) {
    const line = document.createElement("div");
    line.className = "bw-terminal-line" + (cls ? " " + cls : "");
    line.textContent = text;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
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
    printLine("> " + raw, "bw-terminal-echo");

    if (!cmd) return;

    const parts = cmd.split(/\s+/).filter(Boolean);
    const base = parts[0];
    const flags = parts.slice(1);

    switch (base) {
      case "help":
        printBlock([
          "AVAILABLE COMMANDS",
          "  help                       list commands",
          "  whoami                     query your own identity flag",
          "  shownetrunners             list netrunners in your cohort as a bar chart",
          "  shownetrunners -t          plain table instead of the chart",
          "                             (--table also works)",
          "  shownetrunners --list      list every event you're on, with its id",
          "                             (-l also works)",
          "  shownetrunners --event <id-or-path>",
          "                             force a specific event instead of the",
          "                             auto-detected cohort (-e also works)",
          "  exit                       close this shell",
        ]);
        break;

      case "whoami":
        printBlock([
          "IDENTITY: UNKNOWN",
          "CLEARANCE: \u2588\u2588\u2588\u2588\u2588\u2588\u2588",
          "OBSERVATION STATUS: ACTIVE",
        ], "bw-terminal-cryptic");
        break;

      case "shownetrunners": {
        await runShowNetrunners(flags);
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

    members.forEach((m) => {
      const barLen = Math.max(1, Math.round((m.auditRatio / maxRatio) * CHART_BAR_MAX));
      const isYou = m.login === myLogin;

      const row = document.createElement("div");
      row.className = "bw-chart-row" + (isYou ? " bw-chart-row--you" : "");

      const label = document.createElement("span");
      label.className = "bw-chart-label";
      label.textContent = m.login.padEnd(loginWidth, " ") + " ";

      const bar = document.createElement("span");
      bar.className = "bw-chart-bar";
      bar.textContent = "\u2588".repeat(barLen);

      const value = document.createElement("span");
      value.className = "bw-chart-value";
      value.textContent = " " + m.auditRatio.toFixed(2) + (isYou ? " (you)" : "");

      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(value);
      wrapper.appendChild(row);
    });

    outputEl.appendChild(wrapper);
    outputEl.scrollTop = outputEl.scrollHeight;
  }
})();