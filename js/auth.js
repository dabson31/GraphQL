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

// wire up the form and add listeners for each
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = "";

  try {
    // check the login credentials and see if the res is good
    await login(identifier, password);
    window.location.href = "profile.html"; // success -> go to profile page
  } catch (err) {
    errorMsg.textContent = err.message; // show the error, don't fail silently
  }
});

// if already logged in (token exists), skip straight to profile
if (getToken()) {
  window.location.href = "profile.html";
}