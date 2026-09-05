const SIGNIN_URL = `https://learn.reboot01.com/api/auth/signin`;



/**
 * this is the sign-in request for the platform's auth endpoint
 * it sends a POST request to SIGNIN_URL (line 1) with basic HTTP
 * Basic AUth built from identifier:password (base64-encoded via bin to ascii (btoa)).
 * if the response is not OK, throws an error "Invalid username/email or pass". Otherwise
 * it parses the JSON response body (the raw JWT string) and stores it in localSotrage under
 * the key JWT
 * @param {string} identifier : username/email
 * @param {string} password  : acc password
 * @returns undefined (save token to localStorage). Throws on invalid credentials/network failure
 */
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

/**
 * clears session, returns user to login screen
 * removes the jwt key from localStorage, and calls the navigateTo("/login")
 * router function
 */
export function logout() {
  localStorage.removeItem("jwt");
  
  
  
  sessionStorage.removeItem("blackwall_booted");
  window.navigateTo("/login");
}

/**
 * get the token (simple accessor for the current jwt)
 * basically read and returns the jwt val from localstorage
 */
export function getToken() {
  return localStorage.getItem("jwt");
}

/**
 * client-side jwt payload decoder, used to read claims like the user id
 * it splits the token on . to isolate payload segment, base64-decodes it with
 * atob (ascii to bin) and JSON.parse the result
 * @param {string} token : jwt string 
 * @returns the decoded payload as a plain JavaScript object
 */
export function decodeJWT(token) {
  const payload = token.split(".")[1];
  const decoded = atob(payload);
  return JSON.parse(decoded);
}

// good practice to have a safety margin
export function isTokenExpiring(bufferSeconds = 30) {
  const token = getToken();
  if (!token) return true;
  const { exp } = decodeJWT(token);
  return Date.now() / 1000 > exp - bufferSeconds;
}
