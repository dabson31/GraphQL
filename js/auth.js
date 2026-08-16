const GRAPHQL_URL = `https://learn.reboot01.com/api/graphql-engine/v1/graphql`;
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
  localStorage.setItem("jwt", token);
}

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "index.html";
}

function getToken() {
  return localStorage.getItem("jwt");
}

// wire up the form
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = "";

  try {
    await login(identifier, password);
    window.location.href = "profile.html"; // success -> go to profile page
  } catch (err) {
    errorMsg.textContent = err.message; // show the error, don't fail silently
  }
});

// if already logged in, skip straight to profile
if (getToken()) {
  window.location.href = "profile.html";
}