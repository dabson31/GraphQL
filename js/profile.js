import { graphqlQuery } from "./api.js";
import { drawStreetCred, loadBestSkill } from "./charts.js";

export const MODULE_ONLY_FILTER = `path: { _nilike: "%piscine%" }`;
export const MODULE_XP_FILTER = `_or: [{ ${MODULE_ONLY_FILTER} }, { amount: { _eq: 70000 }, object: { name: { _eq: "Piscine JS" } } }]`;


export function clearProfileTarget() {
  sessionStorage.removeItem("blackwall_profile_target");
}


const RANKS = [
  { min: 0,        title: "Chrome Rookie",     desc: "fresh jack, still smells like the ripperdoc's chair" },
  { min: 10000,     title: "Edgerunner",        desc: "running gigs, building a rep on the street" },
  { min: 50000,    title: "Solo",              desc: "contracts get done, no questions asked" },
  { min: 150000,    title: "Fixer",             desc: "knows people who know people" },
  { min: 400000,    title: "Netwatch Ghost",    desc: "moves through the net like it isn't even there" },
  { min: 800000,   title: "Blackwall Breaker", desc: "the kind of legend corpo suits tell rookies about" },
];


export function computeRank(xp) {
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


export function computeLevel(xp) {
  xp = xp || 0;
  const level = Math.floor(Math.sqrt(xp / 1000)) + 1;
  const xpForLevel = (n) => (n - 1) ** 2 * 1000;
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const progress = Math.max(0, Math.min(1, (xp - currentFloor) / (nextFloor - currentFloor)));
  return { level, progress, xpToNext: Math.max(0, nextFloor - xp) };
}



export function formatXP(rawAmount) {
  rawAmount = rawAmount || 0;
  if (rawAmount >= 1_000_000) return (rawAmount / 1_000_000).toFixed(1) + " MB";
  if (rawAmount >= 1_000) return (rawAmount / 1_000).toFixed(1) + " kB";
  return rawAmount + " B";
}


export function remainderToNextMB(rawAmount) {
  rawAmount = rawAmount || 0;
  const nextMB = (Math.floor(rawAmount / 1_000_000) + 1) * 1_000_000;
  const remainder = nextMB - rawAmount;
  return formatXP(remainder) + " to next MB";
}

export async function loadProfile() {
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
        where: { type: { _eq: "xp" }, ${MODULE_XP_FILTER} }
      ) {
        aggregate { sum { amount } }
      }
    }
  `;
    const data = await graphqlQuery(query);
    renderProfile(data);
}


function renderProfile(data) {
    const user = data.user[0]
    const rawXP = data.xpAgg.aggregate.sum.amount || 0;

    
    const xpGiven = user.totalUp || 0;
    const xpReceived = user.totalDown || 0;

    document.getElementById("topName").textContent = user.login;
    document.getElementById("stat-xp").textContent = formatXP(rawXP);
    document.getElementById("stat-xp-remainder").textContent = remainderToNextMB(rawXP);
    document.getElementById("stat-up").textContent = formatXP(xpGiven);
    document.getElementById("stat-down").textContent = formatXP(xpReceived);

    
    
    const rank = computeRank(rawXP);
    const level = computeLevel(rawXP);
    const rankEl = document.getElementById("topRank");
    if (rankEl) rankEl.textContent = `LVL ${level.level} · ${rank.current.title}`;

    drawStreetCred(rank, level); 

    
    loadBestSkill();
}