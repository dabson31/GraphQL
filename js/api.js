const GRAPHQL_URL = `https://learn.reboot01.com/api/graphql-engine/v1/graphql`;



// this is the reusable query func, all graphql calls goes through here
// the "query" is the actual graphql query and variables is the args if needed
async function graphqlQuery(query, variables = {}) {
  const token = getToken();
  if (!token) {
    window.location.href = "index.html"; // no token, kick back to login
    return;
  }

// POST method as its needed, graphql APIs only need one endpoint and thus only expose one endpoint, then they use the body to say what you want
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    // the query/variables get bundled together as a singular json object
    body: JSON.stringify({ query, variables })
  });


  // res is the raw http response, we still need to parse the json out of it vvv
  const json = await res.json();

  if (json.errors) {
    // so for some reason graphql doesnt use status code errors for query errors, it instead returns a 200 with an errors field instead 
    console.error(json.errors);
    // token could be expired/invalid - kick back to login rather than fail silently
    if (json.errors[0].message.toLowerCase().includes("jwt")) {
      logout();
    }
    throw new Error(json.errors[0].message);
  }
// on success the real data lives under json.data, and that's all we need to send back
  return json.data;
}

