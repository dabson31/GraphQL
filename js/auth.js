const SIGNIN_URL = `https://learn.reboot01.com/api/auth/signin`;

export async function login(identifier, password) {
  const res = await fetch(SIGNIN_URL, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${identifier}:${password}`)
    }
  });

  if (!res.ok) {
    throw new Error("Invalid username/email or password");
  }

  const token = await res.json(); 
  
  
  localStorage.setItem("jwt", token);
}


export function logout() {
  localStorage.removeItem("jwt");
  
  
  
  sessionStorage.removeItem("blackwall_booted");
  window.navigateTo("/login");
}

export function getToken() {
  return localStorage.getItem("jwt");
}


export function decodeJWT(token) {
  const payload = token.split(".")[1];
  const decoded = atob(payload);
  return JSON.parse(decoded);
}
