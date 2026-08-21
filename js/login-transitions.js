const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pushLog(container, text, danger) {
    const row = document.createElement("div");
    row.className = "tx-log-row" + (danger ? " tx-log-danger" : "");
    row.textContent = text;
    container.appendChild(row);
  }

  function clearLog(container) {
    container.innerHTML = "";
  }

  function setFormDisabled(form, disabled) {
    form.querySelectorAll("input").forEach((i) => { i.disabled = disabled; });
  }

  function silenceClone(clone) {
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    clone.querySelectorAll("input, button").forEach((el) => {
      el.disabled = true;
      el.tabIndex = -1;
    });
    return clone;
  }


  function spawnRgbSlices(form) {
    const bands = [
      { top: 0,  height: 16, dx: -14, tint: "red" },
      { top: 16, height: 15, dx: 12,  tint: "cyan" },
      { top: 31, height: 17, dx: -10, tint: "cyan" },
      { top: 48, height: 16, dx: 15,  tint: "red" },
      { top: 64, height: 17, dx: -12, tint: "cyan" },
      { top: 81, height: 19, dx: 10,  tint: "red" },
    ];
    return bands.map((b) => {
      const clone = silenceClone(form.cloneNode(true));
      clone.classList.add("tx-rgb-slice", b.tint === "red" ? "tx-slice-red" : "tx-slice-cyan");
      clone.style.clipPath = `inset(${b.top}% 0 ${100 - b.top - b.height}% 0)`;
      clone.style.setProperty("--dx", b.dx + "px");
      form.appendChild(clone);
      return clone;
    });
  }


  function spawnDupeBoxes(form) {
    const clones = [];
    for (let i = 0; i < 3; i++) {
      const clone = silenceClone(form.cloneNode(true));
      clone.classList.add("tx-dupe-box");
      clone.setAttribute("data-i", String(i));
      document.body.appendChild(clone);
      clones.push(clone);
    }
    return clones;
  }

  function removeDupeBoxes(clones) {
    return Promise.all(
      clones.map(
        (c, i) =>
          new Promise((resolve) => {
            setTimeout(() => {
              c.classList.add("tx-dupe-out");
              setTimeout(() => {
                c.remove();
                resolve();
              }, 200);
            }, i * 70);
          })
      )
    );
  }

  export async function playBreach(onDone) {
    const form = document.getElementById("loginForm");
    const button = form.querySelector("button[type=submit]");
    const log = document.getElementById("txLog");
    const flash = document.getElementById("txFlash");
    const originalLabel = button.textContent;

    if (reduced) {
      button.textContent = "CONNECTING...";
      await sleep(250);
      onDone();
      return;
    }

    button.disabled = true;
    setFormDisabled(form, true);
    button.textContent = "CONNECTING...";

    
    form.classList.add("tx-connecting");
    await sleep(160);
    form.classList.remove("tx-connecting");

    form.classList.add("tx-scanning");
    clearLog(log);
    log.classList.add("tx-log-active");
    const scanLines = [
      "> ESTABLISHING NEURAL LINK...",
      "> ROUTING THROUGH BLACKWALL RELAY...",
      "> ENCRYPTION: \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 100%",
      "> IDENTITY VERIFIED",
    ];
    for (const line of scanLines) {
      pushLog(log, line, false);
      await sleep(85);
    }
    await sleep(70);
    form.classList.remove("tx-scanning");

    form.classList.add("tx-breach");
    const slices = spawnRgbSlices(form);
    await sleep(260);
    slices.forEach((s) => s.remove());
    form.classList.remove("tx-breach");

    form.classList.add("tx-textfade");
    await sleep(1000);

    
    flash.classList.add("tx-black-cut");
    await sleep(350);

    sessionStorage.setItem("blackwall_skip_lines", "1");

    
    onDone();
  }

  export async function playIntrusion(message, onDone) {
    const form = document.getElementById("loginForm");
    const button = form.querySelector("button[type=submit]");
    const log = document.getElementById("txLog");
    const errorMsg = document.getElementById("errorMsg");
    const password = document.getElementById("password");
    const originalLabel = button.textContent;

    if (reduced) {
      errorMsg.textContent = message;
      onDone();
      return;
    }

    button.disabled = true;
    setFormDisabled(form, true);
    button.textContent = "AUTHENTICATING...";

    
    form.classList.add("tx-connecting");
    await sleep(150);
    form.classList.remove("tx-connecting");

    form.classList.add("tx-scanning");
    clearLog(log);
    log.classList.add("tx-log-active");
    const scanLines = ["> IDENTITY SCAN", "> NEURAL SIGNATURE", "> ACCESS VERIFICATION"];
    for (const line of scanLines) {
      pushLog(log, line, false);
      await sleep(85);
    }
    form.classList.remove("tx-scanning");

    
    form.classList.add("tx-freeze");
    await sleep(140);
    form.classList.remove("tx-freeze");

    
    form.classList.add("tx-intrusion-glitch");
    document.body.classList.add("tx-shake");
    clearLog(log);
    const danger = ["// ACCESS DENIED //", "INTRUSION DETECTED", "CONNECTION TERMINATED"];
    for (const line of danger) {
      pushLog(log, line, true);
      await sleep(150);
    }

    
    const originalType = password.type;
    password.type = "text";
    password.value = "\u2588".repeat(Math.max(password.value.length, 8));
    await sleep(160);
    password.value = "";
    password.type = originalType;

    
    clearLog(log);
    log.classList.remove("tx-log-active");

    
    const dupes = spawnDupeBoxes(form);

    document.body.classList.remove("tx-shake");
    form.classList.remove("tx-intrusion-glitch");


    errorMsg.textContent = message;
    button.textContent = "RETRY CONNECTION";

    await sleep(750);

    
    await removeDupeBoxes(dupes);

    await sleep(450);
    button.textContent = originalLabel;
    button.disabled = false;
    setFormDisabled(form, false);

    onDone();
  }


