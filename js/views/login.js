import { login } from "../auth.js";
import { playBreach, playIntrusion } from "../login-transitions.js";

export default function LoginView() {
  const wrapper = document.createElement("div");
  wrapper.className = "view-login";
  wrapper.innerHTML = `
    <div class="bw-sweep"></div>

    <div class="login-wrap">
      <form id="loginForm" class="hud-frame">
        <h1 class="glitch" data-text="BLACKWALL">BLACKWALL</h1>
        <span class="login-tag">// netrunner access terminal</span>

        <input id="identifier" placeholder="USERNAME OR EMAIL" required autocomplete="username" />
        <input id="password" type="password" placeholder="PASSWORD" required autocomplete="current-password" />
        <button type="submit">Jack In</button>

        <p id="errorMsg" class="error"></p>

        <!-- scan/breach/intrusion log readout, overlays the form during a
             login attempt, see js/login-transitions.js -->
        <div id="txLog" class="tx-log"></div>
      </form>
    </div>

    <!-- full-screen hard-flash beat used by the success transition -->
    <div id="txFlash" class="tx-flash"><span id="txFlashText"></span></div>

    <a href="#/unauthorized" data-link class="unauth-link">access unauthorized information</a>
  `;

  const form = wrapper.querySelector("#loginForm");
  const errorMsg = wrapper.querySelector("#errorMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = wrapper.querySelector("#identifier").value;
    const password = wrapper.querySelector("#password").value;
    errorMsg.textContent = "";

    try {
      
      await login(identifier, password);
      
      playBreach(() => window.navigateTo("/profile"));
    } catch (err) {
      
      
      playIntrusion(err.message, () => {});
    }
  });

  return wrapper;
}
