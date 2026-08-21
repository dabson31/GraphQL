


import { getToken, logout } from "./auth.js";

const GRAPHQL_URL = `https://learn.reboot01.com/api/graphql-engine/v1/graphql`;



export async function graphqlQuery(query, variables = {}) {
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
