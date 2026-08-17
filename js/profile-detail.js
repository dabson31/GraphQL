const MODULE_ONLY_FILTER = `path: { _nilike: "%piscine%" }`;


// street cred tiers (ranks), renamed to fit the theme
const RANKS = [
  { min: 0,        title: "Chrome Rookie",     desc: "fresh jack, still smells like the ripperdoc's chair" },
  { min: 10000,     title: "Edgerunner",        desc: "running gigs, building a rep on the street" },
  { min: 50000,    title: "Solo",              desc: "contracts get done, no questions asked" },
  { min: 150000,    title: "Fixer",             desc: "knows people who know people" },
  { min: 400000,    title: "Netwatch Ghost",    desc: "moves through the net like it isn't even there" },
  { min: 800000,   title: "Blackwall Breaker", desc: "the kind of legend corpo suits tell rookies about" },
];

// returns the current tier + how far into the next one you are, for progress bars
// same math as profile.js, kept here too since this page loads on its own
function computeRank(xp) {
  xp = xp || 0;
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  let progress = 1;
  if (next) progress = (xp - current.min) / (next.min - current.min);
  return { current, next, progress: Math.max(0, Math.min(1, progress)), xp };
}

// level is separate from rank, same xp-squared curve as profile.js, kept
// here too so this page loads standalone
function computeLevel(xp) {
  xp = xp || 0;
  const level = Math.floor(Math.sqrt(xp / 1000)) + 1;
  const xpForLevel = (n) => (n - 1) ** 2 * 1000;
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const progress = Math.max(0, Math.min(1, (xp - currentFloor) / (nextFloor - currentFloor)));
  return { level, progress, xpToNext: Math.max(0, nextFloor - xp) };
}

// converts raw xp amount into kb/mb, only call this right before putting it on the page
// same formatter as profile.js, kept here too since this page loads on its own
function formatXP(rawAmount) {
  rawAmount = rawAmount || 0;
  if (rawAmount >= 1_000_000) return (rawAmount / 1_000_000).toFixed(1) + " MB";
  if (rawAmount >= 1_000) return (rawAmount / 1_000).toFixed(1) + " kB";
  return rawAmount + " B";
}

// threat assessment is just flavor text derived from the real audit ratio
function threatFromRatio(ratio) {
  if (ratio >= 1.5) return "MINIMAL -- audits stacked in your favor";
  if (ratio >= 1.0) return "LOW -- balance sheet is clean";
  if (ratio >= 0.7) return "ELEVATED -- audit debt building up";
  return "HIGH -- go review some code, choom";
}

async function loadProfileDetail() {
  const query = `
    {
      user {
        id
        login
        auditRatio
        totalUp
        totalDown
      }
      xpAgg: transaction_aggregate(
        where: { type: { _eq: "xp" }, ${MODULE_ONLY_FILTER} }
      ) {
        aggregate { sum { amount } }
      }
      firstTx: transaction(
        where: { type: { _eq: "xp" } }
        order_by: { createdAt: asc }
        limit: 1
      ) {
        createdAt
      }
    }
  `;

  const data = await graphqlQuery(query);
  const user = data.user[0];
  const rawXP = data.xpAgg.aggregate.sum.amount || 0;


  const xpGiven = user.totalUp || 0;
  const xpReceived = user.totalDown || 0;

  const ratio = user.auditRatio ?? (xpReceived > 0 ? xpGiven / xpReceived : 0);
  const rank = computeRank(rawXP);

  document.getElementById("d-login").textContent = user.login;
  document.getElementById("d-id").textContent = user.id;
  document.getElementById("d-xp").textContent = formatXP(rawXP);
  document.getElementById("d-audit").textContent = ratio.toFixed(1);
  document.getElementById("d-up").textContent = formatXP(xpGiven);
  document.getElementById("d-down").textContent = formatXP(xpReceived);
  document.getElementById("d-threat").textContent = threatFromRatio(ratio);


  const firstDate = data.firstTx[0] ? new Date(data.firstTx[0].createdAt) : null;
  document.getElementById("d-since").textContent = firstDate
    ? firstDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "unknown";


  const level = computeLevel(rawXP);
  document.getElementById("d-rank").textContent = `LVL ${level.level} · ${rank.current.title}`;
  document.getElementById("d-rank-desc").textContent = rank.current.desc;
  document.getElementById("d-rank-fill").style.width = Math.round(rank.progress * 100) + "%";
  document.getElementById("d-rank-progress").textContent = rank.next
    ? `${Math.round(rank.progress * 100)}% to next tier`
    : "max tier reached";
  document.getElementById("d-rank-next").textContent = rank.next ? rank.next.title : "-";
}

loadProfileDetail(); // this page has no boot.js gate, just fires on load
