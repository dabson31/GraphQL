async function loadProfile() {
const query = `
    {
      user {
        id
        login
        auditRatio
        totalUp
        totalDown
      }
      transaction_aggregate(where: { type: { _eq: "xp" } }) {
        aggregate {
          sum { amount }
        }
      }
    }
  `;
    const data = await graphqlQuery(query);
    renderProfile(data);
}


function renderProfile(data) {
    const user = data.user[0] // alep idk why im commenting here
    const totalXP = data.transaction_aggregate.aggregate.sum.amount; // .aggregate.aggregate.aggregate.aggregate crazy? i was crazy once

    document.getElementById("login").textContent = user.login;
    document.getElementById("xp").textContent = '${totalXP} XP';
    document.getElementById("auditRatio").textContent = user.auditRatio.toFixed(2);


    loadProfile();

}