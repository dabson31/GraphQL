const SIGNIN_URL = `https://learn.reboot01.com/api/auth/signin`;


async function login(identifier, password) {
  const res = await fetch(SIGNIN_URL, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${identifier}:${password}`)
    }
  });

  if (!res.ok) {
    throw new Error("Invalid username/email or password");
  }

  const token = await res.json(); // usually returned as a raw JWT string
  // we dont save it as a plain global js variable because it disappears on refresh
  // even tho its SLIGHTLY more secure to put it as a variable 
  localStorage.setItem("jwt", token);
}

// we disconnect by deleting/cleaning the jwt from localstorage
function logout() {
  localStorage.removeItem("jwt");
  // also clear the "already played this tab" boot flag so
  // the neural-dashboard boot + crack-split reveal plays again next time
  // this tab logs in, instead of staying silently skipped forever
  sessionStorage.removeItem("blackwall_booted");
  window.location.href = "index.html";
}

function getToken() {
  return localStorage.getItem("jwt");
}

// decoding it gives me my id, and my ip for some reason(?)
function decodeJWT(token) {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
}

// wire up the form and add listeners for each, guarded, since auth.js is
// also loaded on profile.html where #loginForm doesn't exist (it used to
// throw there unguarded, silently killing the rest of this script on that
// page every load)
const loginFormEl = document.getElementById("loginForm");
if (loginFormEl) {
  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("identifier").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = "";

    try {
      // check the login credentials and see if the res is good
      await login(identifier, password);
      // success -> play the Blackwall Breach transition, then go to profile
      if (window.BlackwallTransition) {
        window.BlackwallTransition.playBreach(() => {
          window.location.href = "profile.html";
        });
      } else {
        window.location.href = "profile.html";
      }
    } catch (err) {
      // failure -> play the ICE Detected transition, which shows the error
      // message itself once the sequence finishes kicking the connection back
      if (window.BlackwallTransition) {
        window.BlackwallTransition.playIntrusion(err.message, () => {});
      } else {
        errorMsg.textContent = err.message; // fallback, don't fail silently
      }
    }
  });
}

if (loginFormEl && getToken()) {
  window.location.href = "profile.html";
}