const MODULE_ONLY_FILTER = `path: { _nilike: "%piscine%" }`;
const MODULE_XP_FILTER = `_or: [{ ${MODULE_ONLY_FILTER} }, { amount: { _eq: 70000 }, object: { name: { _eq: "Piscine JS" } } }]`;

// fallback image used whenever a profile has no avatarUrl set - swap this
// path/URL for whatever default picture you want to show
const DEFAULT_AVATAR = "assets/default-avatar.png";


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

// the "user"/"transaction" tables are JWT-scoped - they only ever return
// YOUR OWN row, no matter what "where" you send. so looking up someone
// else's login through them silently comes back empty. the only tables
// that expose other students' data are "event_user" and its nested
// "publicUser" - but those need an eventId (your shared cohort/campus
// event) in the where clause. so: first resolve which event we're both
// members of, then look the target up through event_user.
async function resolveCohortEventId(selfId) {
  const eventsData = await graphqlQuery(
    `query ($uid: Int) {
      event(
        where: {
          usersRelation: { userId: { _eq: $uid } }
          object: { type: { _in: ["module"] } }
        }
      ) {
        id
        path
      }
    }`,
    { uid: selfId }
  );

  const memberships = eventsData.event || [];
  if (!memberships.length) return null;

  const nonPiscine = memberships.filter((m) => !/piscine/i.test(m.path || ""));
  const pool = nonPiscine.length ? nonPiscine : memberships;
  const cohort = [...pool].sort(
    (a, b) => (b.path || "").split("/").length - (a.path || "").split("/").length
  )[0];

  return cohort.id;
}

function sumXP(xpField) {
  if (!xpField) return 0;
  if (Array.isArray(xpField)) {
    return xpField.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }
  if (xpField.amount != null) return xpField.amount;
  if (xpField.aggregate) return xpField.aggregate.sum.amount || 0;
  return 0;
}

async function loadProfileDetail() {
  const overrideTarget = sessionStorage.getItem("blackwall_profile_target");

  const selfData = await graphqlQuery(`{ user { id login } }`);
  const self = selfData.user[0];
  if (!self) {
    document.getElementById("d-login").textContent = "NOT FOUND";
    document.getElementById("d-footer").textContent = "// could not verify your own session";
    return;
  }

  const isSelf =
    !overrideTarget ||
    overrideTarget.toLowerCase() === self.login.toLowerCase() ||
    (/^\d+$/.test(overrideTarget) && Number(overrideTarget) === self.id);

  let userId, login, ratio, rawXP;
  let xpGiven = null;
  let xpReceived = null;
  let firstDate = null;
  let pub = {};
  let cohortAuditRatio = null;

  if (isSelf) {
    const baseData = await graphqlQuery(
      `{ user(where: { id: { _eq: ${self.id} } }) { id login auditRatio totalUp totalDown } }`
    );
    const user = baseData.user[0];
    userId = user.id;
    login = user.login;
    xpGiven = user.totalUp || 0;
    xpReceived = user.totalDown || 0;
    ratio = user.auditRatio ?? (xpReceived > 0 ? xpGiven / xpReceived : 0);

    try {
      const txQuery = `
        {
          xpAgg: transaction_aggregate(
            where: { type: { _eq: "xp" }, userId: { _eq: ${userId} }, ${MODULE_XP_FILTER} }
          ) {
            aggregate { sum { amount } }
          }
          firstTx: transaction(
            where: { type: { _eq: "xp" }, userId: { _eq: ${userId} } }
            order_by: { createdAt: asc }
            limit: 1
          ) {
            createdAt
          }
        }
      `;
      const txData = await graphqlQuery(txQuery);
      rawXP = txData.xpAgg.aggregate.sum.amount || 0;
      firstDate = txData.firstTx[0] ? new Date(txData.firstTx[0].createdAt) : null;
    } catch (err) {
      console.warn(err.message);
      rawXP = 0;
    }
  } else {
    const cohortId = await resolveCohortEventId(self.id);
    if (!cohortId) {
      document.getElementById("d-login").textContent = "NOT FOUND";
      document.getElementById("d-footer").textContent = `// no shared cohort found to look up "${overrideTarget}"`;
      return;
    }

    const isNumeric = /^\d+$/.test(overrideTarget);
    const targetWhere = isNumeric
      ? `userId: { _eq: ${Number(overrideTarget)} }`
      : `userLogin: { _ilike: "${overrideTarget.replace(/"/g, "")}" }`;

    const rosterData = await graphqlQuery(
      `{
        event_user(where: { eventId: { _eq: ${cohortId} }, ${targetWhere} }) {
          userId
          userLogin
          userAuditRatio
          xp { amount }
          publicUser {
            firstName
            lastName
            campus
            avatarUrl
            discordId
            githubId
            canAccessPlatform
            canBeAuditor
          }
        }
      }`
    );

    const entry = (rosterData.event_user || [])[0];
    if (!entry) {
      document.getElementById("d-login").textContent = "NOT FOUND";
      document.getElementById("d-footer").textContent = `// no netrunner file matches "${overrideTarget}"`;
      return;
    }

    userId = entry.userId;
    login = entry.userLogin;
    ratio = entry.userAuditRatio ?? 0;
    cohortAuditRatio = entry.userAuditRatio;
    rawXP = sumXP(entry.xp);
    pub = entry.publicUser || {};
  }

  const rank = computeRank(rawXP);

  document.getElementById("d-login").textContent = login;
  document.getElementById("d-id").textContent = userId;
  document.getElementById("d-xp").textContent = formatXP(rawXP);
  document.getElementById("d-xp").closest(".detail-row").style.display = isSelf ? "flex" : "none";
  document.getElementById("d-audit").textContent = ratio.toFixed(1);
  document.getElementById("d-threat").textContent = threatFromRatio(ratio);

  if (xpGiven !== null) {
    document.getElementById("d-up").textContent = formatXP(xpGiven);
    document.getElementById("d-up").closest(".detail-row").style.display = "flex";
  } else {
    document.getElementById("d-up").closest(".detail-row").style.display = "none";
  }
  if (xpReceived !== null) {
    document.getElementById("d-down").textContent = formatXP(xpReceived);
    document.getElementById("d-down").closest(".detail-row").style.display = "flex";
  } else {
    document.getElementById("d-down").closest(".detail-row").style.display = "none";
  }

  document.getElementById("d-since").textContent = firstDate
    ? firstDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "unknown";
  document.getElementById("d-since").closest(".detail-row").style.display = isSelf ? "flex" : "none";

  const level = computeLevel(rawXP);
  document.getElementById("d-rank").textContent = `LVL ${level.level} · ${rank.current.title}`;
  document.getElementById("d-rank-desc").textContent = rank.current.desc;
  document.getElementById("d-rank-fill").style.width = Math.round(rank.progress * 100) + "%";
  document.getElementById("d-rank-progress").textContent = rank.next
    ? `${Math.round(rank.progress * 100)}% to next tier`
    : "max tier reached";
  document.getElementById("d-rank-next").textContent = rank.next ? rank.next.title : "-";

  document.getElementById("d-footer").textContent = !isSelf
    ? `// viewing netrunner file: ${login} · blackwall relay authenticated`
    : "// file integrity nominal · blackwall relay authenticated";

  if (isSelf) {
    const cohortId = await resolveCohortEventId(userId).catch(() => null);
    if (cohortId) {
      try {
        const rosterData = await graphqlQuery(
          `{
            event_user(where: { eventId: { _eq: ${cohortId} }, userId: { _eq: ${userId} } }) {
              userAuditRatio
              publicUser {
                firstName
                lastName
                campus
                avatarUrl
                discordId
                githubId
                canAccessPlatform
                canBeAuditor
              }
            }
          }`
        );
        const entry = (rosterData.event_user || [])[0];
        if (entry) {
          cohortAuditRatio = entry.userAuditRatio;
          pub = entry.publicUser || {};
        }
      } catch (err) {
        console.warn(err.message);
      }
    }
  }

  renderPublicDossier(login, pub, cohortAuditRatio, isSelf);
}

function renderPublicDossier(login, pub, cohortAuditRatio, isSelf) {
  const fullName = [pub.firstName, pub.lastName].filter(Boolean).join(" ");

  document.getElementById("d-name").textContent = fullName || login;
  document.getElementById("d-campus").textContent = pub.campus || "unknown campus";
  document.getElementById("d-avatar-row").style.display = "flex";
  document.getElementById("d-avatar").src = pub.avatarUrl || DEFAULT_AVATAR;
  document.getElementById("d-avatar").onerror = function () {
    this.onerror = null;
    this.src = DEFAULT_AVATAR;
  };

  if (isSelf && typeof cohortAuditRatio === "number") {
    document.getElementById("d-cohort-audit").textContent = cohortAuditRatio.toFixed(2);
    document.getElementById("d-cohort-audit-row").style.display = "flex";
  } else {
    document.getElementById("d-cohort-audit-row").style.display = "none";
  }

  if (pub.discordId) {
    document.getElementById("d-discord").textContent = pub.discordId;
    document.getElementById("d-discord-row").style.display = "flex";
  } else {
    document.getElementById("d-discord-row").style.display = "none";
  }
  if (pub.githubId) {
    document.getElementById("d-github").textContent = pub.githubId;
    document.getElementById("d-github-row").style.display = "flex";
  } else {
    document.getElementById("d-github-row").style.display = "none";
  }
  if (typeof pub.canAccessPlatform === "boolean") {
    document.getElementById("d-access").textContent = pub.canAccessPlatform ? "GRANTED" : "REVOKED";
    document.getElementById("d-access-row").style.display = "flex";
  } else {
    document.getElementById("d-access-row").style.display = "none";
  }
  if (typeof pub.canBeAuditor === "boolean") {
    document.getElementById("d-auditor").textContent = pub.canBeAuditor ? "AUTHORIZED" : "UNAUTHORIZED";
    document.getElementById("d-auditor-row").style.display = "flex";
  } else {
    document.getElementById("d-auditor-row").style.display = "none";
  }
}

const backLink = document.querySelector(".back-link");
if (backLink) {
  backLink.addEventListener("click", () => {
    sessionStorage.removeItem("blackwall_profile_target");
  });
}

loadProfileDetail();
