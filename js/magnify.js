let magnifyBound = false;

export function initMagnify() {
  if (magnifyBound) return;
  magnifyBound = true;

  const SCALE = 1.9;           
  const SCALE_ROW = 3.2;
  const VIEWPORT_MARGIN = 0.86; 
  const FLIGHT_MS = 420;       

  let backdrop = null;
  let clone = null;
  let sourceEl = null;

  function ensureBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement("div");
    backdrop.className = "magnify-backdrop";
    backdrop.addEventListener("click", dropBack);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function ensureCloseBtn(target) {
    let btn = target.querySelector(":scope > .magnify-close");
    if (btn) return btn;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "magnify-close";
    btn.setAttribute("aria-label", "Close");
    btn.textContent = "✕";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropBack();
    });
    target.appendChild(btn);
    return btn;
  }

  
  function targetRectFor(rect, scale) {
    const width = Math.min(rect.width * scale, window.innerWidth * VIEWPORT_MARGIN);
    const height = Math.min(rect.height * scale, window.innerHeight * VIEWPORT_MARGIN);
    return {
      width, height,
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
    };
  }

  function scaleFor(el) {
    return el.classList.contains("detail-row") ? SCALE_ROW : SCALE;
  }

  function applyRect(node, rect) {
    node.style.left = rect.left + "px";
    node.style.top = rect.top + "px";
    node.style.width = rect.width + "px";
    node.style.height = rect.height + "px";
  }

  function liftOff(el) {
    if (sourceEl === el && clone) return; 

    const bd = ensureBackdrop();
    const rect = el.getBoundingClientRect();
    const isRow = el.classList.contains("detail-row");

    if (clone && sourceEl) {
      sourceEl.classList.remove("magnify-source-active");
      clone.innerHTML = el.innerHTML;
      clone.className = el.className + " magnify-clone is-lifted";
      if (isRow) clone.classList.add("magnify-row-clone");
      clone.style.cssText = el.style.cssText;
      if (el.hasAttribute("data-icon")) clone.setAttribute("data-icon", el.getAttribute("data-icon"));
      else clone.removeAttribute("data-icon");
      ensureCloseBtn(clone);

      sourceEl = el;
      sourceEl.classList.add("magnify-source-active");
      applyRect(clone, targetRectFor(rect, scaleFor(el)));
      return;
    }

    clone = el.cloneNode(true);
    clone.className += " magnify-clone";
    if (isRow) clone.classList.add("magnify-row-clone");
    clone.removeAttribute("data-magnify");
    applyRect(clone, rect);
    clone.style.transition = "none";
    document.body.appendChild(clone);
    ensureCloseBtn(clone);

    sourceEl = el;
    sourceEl.classList.add("magnify-source-active");

    void clone.offsetWidth;

    requestAnimationFrame(() => {
      clone.style.transition = "";
      applyRect(clone, targetRectFor(rect, scaleFor(el)));
      bd.classList.add("is-visible");
      clone.classList.add("is-lifted");
    });
  }

  function dropBack() {
    if (!clone || !sourceEl) return;

    const rect = sourceEl.getBoundingClientRect();
    clone.classList.remove("is-lifted");
    if (backdrop) backdrop.classList.remove("is-visible");
    applyRect(clone, rect);

    sourceEl.classList.remove("magnify-source-active");
    const flightNode = clone;
    clone = null;
    sourceEl = null;

    setTimeout(() => flightNode.remove(), FLIGHT_MS);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropBack();
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-magnify]");
    if (el) liftOff(el);
  });
}
