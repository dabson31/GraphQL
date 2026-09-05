import { getToken, logout } from "./auth.js";

const GRAPHQL_URL = `https://learn.reboot01.com/api/graphql-engine/v1/graphql`;

/**
 * this function is what's called everywhere on the app to access the GraphQL
 * backend (learn.reboot01.com/api/graphql-engine/v1/graphql). what it does is
 * take the stored JWT using getToken(). If there is no token it redirects users
 * to /login and throws an error. if there is one, it sends a POST request
 * to the GraphQL endpoint with the query and variables as JSON (who's json)
 * using said JWT (the token) as a bearer authorization header. If  the
 * response has GraphQL errors, it logs the errors, calls logout() if 
 * one of them contains jwt (in case its expired/invalid), and throws an
 * Error with the first error message
 * @param {string} query  : the raw GraphQL query string to send
 * @param {object {} } variables  : vars to inject to the query
 * @returns the data field of parsed JSON responses (which is an object that contains the request GraphQL fields). 
 */

export async function graphqlQuery(query, variables = {}) {

  // if(isTokenExpiring()) {

  // }

  const token = getToken();
  if (!token) {
    window.navigateTo("/login"); 
    throw new Error("No auth token");
  }

  
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    
    body: JSON.stringify({ query, variables })
  });

  
  const json = await res.json();

  if (json.errors) {
    
    console.error(json.errors);
    
    if (json.errors[0].message.toLowerCase().includes("jwt")) {
      logout();
    }
    throw new Error(json.errors[0].message);
  }
  
  return json.data;
}
