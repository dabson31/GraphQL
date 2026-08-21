















import { getToken } from "./auth.js";
import { initAudioFx } from "./audio-fx.js";
import { initSandevistan } from "./sandevistan.js";
import { initMagnify } from "./magnify.js";

const routes = {
  "/login": () => import("./views/login.js").then((m) => m.default()),
  "/profile": () => import("./views/profile.js").then((m) => m.default()),
  "/profile-detail": () => import("./views/profile-detail.js").then((m) => m.default()),
  "/unauthorized": () => import("./views/unauthorized.js").then((m) => m.default()),
};

const PROTECTED_ROUTES = ["/profile", "/profile-detail"];

const app = document.getElementById("app");

if (!app) {
  throw new Error("Missing #app container in index.html");
}

let cleanupCurrentView = null;
window.registerViewCleanup = (fn) => {
  cleanupCurrentView = typeof fn === "function" ? fn : null;
};


function currentPath() {
  const hash = window.location.hash;
  if (!hash || hash === "#") return "/login";
  const path = hash.slice(1); 
  return path.startsWith("/") ? path : "/" + path;
}

async function handleRoute() {
  if (cleanupCurrentView) {
    try {
      cleanupCurrentView();
    } catch (err) {
      console.error("view cleanup failed", err);
    }
    cleanupCurrentView = null;
  }

  let path = currentPath();
  if (path === "/" || path === "/index.html") path = "/login";

  
  
  if (PROTECTED_ROUTES.includes(path) && !getToken()) {
    navigateTo("/login");
    return;
  }
  
  
  if (path === "/login" && getToken()) {
    navigateTo("/profile");
    return;
  }

  const route = routes[path];

  let view;
  if (route) {
    view = await route();
  } else {
    view = await import("./views/notfound.js").then((m) => m.default());
  }

  app.replaceChildren(view);
  
  
  
  view.mount?.();
}

function navigateTo(url) {
  const path = url.startsWith("#") ? url.slice(1) : url;
  const target = "#" + (path.startsWith("/") ? path : "/" + path);
  if (window.location.hash === target) {
    
    
    handleRoute();
  } else {
    window.location.hash = target;
  }
}

window.navigateTo = navigateTo;

window.addEventListener("hashchange", handleRoute);

document.body.addEventListener("click", (event) => {
  const anchor = event.target.closest("a[data-link]");
  if (!anchor) {
    return;
  }
  event.preventDefault();
  navigateTo(anchor.getAttribute("href"));
});






initAudioFx();
initSandevistan();
initMagnify();

handleRoute();

