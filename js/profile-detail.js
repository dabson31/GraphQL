import { graphqlQuery } from "./api.js";
import { computeRank, computeLevel, formatXP, MODULE_XP_FILTER } from "./profile.js";

const DEFAULT_AVATAR = "assets/default-avatar.png";

function targetLogin() {
  return sessionStorage.getItem("blackwall_profile_target") || null;
}

function threatFromRatio(ratio) {
  if (ratio >= 1.5) return "MINIMAL -- audits stacked in your favor";
  if (ratio >= 1.0) return "LOW -- balance sheet is clean";
  if (ratio >= 0.7) return "ELEVATED -- audit debt building up";
  return "HIGH -- go review some code, choom";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setRowVisible(valueId, visible) {
  const row = document.getElementById(valueId).closest(".detail-row");
  if (row) row.style.display = visible ? "flex" : "none";
}

function sumXP(xpField) {
  if (!xpField) return 0;
  if (Array.isArray(xpField)) {
    const seen = new Set();
    return xpField.reduce((sum, tx) => {
      if (tx.id != null && seen.has(tx.id)) return sum; // skip duplicate
      if (tx.id != null) seen.add(tx.id);
      return sum + (tx.amount || 0);
    }, 0);
  }
  if (xpField.amount != null) return xpField.amount;
  if (xpField.aggregate) return xpField.aggregate.sum.amount || 0;
  return 0;
}

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

export async function safeLoadProfileDetail() {
  try {
    await loadProfileDetail();
  } catch (err) {
    console.error("profile-detail load failed", err);
    setText("d-login", "NOT FOUND");
    setText("d-footer", "// file corrupted · could not decrypt record");
  }
}

async function loadProfileDetail() {
  const overrideTarget = targetLogin();

  const selfData = await graphqlQuery(`{ user { id login } }`);
  const self = selfData.user[0];
  if (!self) {
    setText("d-login", "NOT FOUND");
    setText("d-footer", "// could not verify your own session");
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
      setText("d-login", "NOT FOUND");
      setText("d-footer", `// no shared cohort found to look up "${overrideTarget}"`);
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
          xp { id amount }
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
      setText("d-login", "NOT FOUND");
      setText("d-footer", `// no netrunner file matches "${overrideTarget}"`);
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

  setText("d-login", login);
  setText("d-id", userId);
  setText("d-xp", formatXP(rawXP));
  setRowVisible("d-xp", isSelf);
  setText("d-audit", ratio.toFixed(1));
  setText("d-threat", threatFromRatio(ratio));

  if (xpGiven !== null) {
    setText("d-up", formatXP(xpGiven));
    setRowVisible("d-up", true);
  } else {
    setRowVisible("d-up", false);
  }
  if (xpReceived !== null) {
    setText("d-down", formatXP(xpReceived));
    setRowVisible("d-down", true);
  } else {
    setRowVisible("d-down", false);
  }

  setText(
    "d-since",
    firstDate ? firstDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "unknown"
  );
  setRowVisible("d-since", isSelf);

  const level = computeLevel(rawXP);
  setText("d-rank", `LVL ${level.level} · ${rank.current.title}`);
  setText("d-rank-desc", rank.current.desc);
  const fill = document.getElementById("d-rank-fill");
  if (fill) fill.style.width = Math.round(rank.progress * 100) + "%";
  setText("d-rank-progress", rank.next ? `${Math.round(rank.progress * 100)}% to next tier` : "max tier reached");
  setText("d-rank-next", rank.next ? rank.next.title : "-");

  setText(
    "d-footer",
    !isSelf ? `// viewing netrunner file: ${login} · blackwall relay authenticated` : "// file integrity nominal · blackwall relay authenticated"
  );

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

  setText("d-name", fullName || login);
  setText("d-campus", pub.campus || "unknown campus");

  const avatarRow = document.getElementById("d-avatar-row");
  if (avatarRow) avatarRow.style.display = "flex";
  const avatarEl = document.getElementById("d-avatar");
  if (avatarEl) {
    avatarEl.src = pub.avatarUrl || DEFAULT_AVATAR;
    avatarEl.onerror = function () {
      this.onerror = null;
      this.src = DEFAULT_AVATAR;
    };
  }

  if (isSelf && typeof cohortAuditRatio === "number") {
    setText("d-cohort-audit", cohortAuditRatio.toFixed(2));
    document.getElementById("d-cohort-audit-row").style.display = "flex";
  } else {
    document.getElementById("d-cohort-audit-row").style.display = "none";
  }

  if (pub.discordId) {
    setText("d-discord", pub.discordId);
    document.getElementById("d-discord-row").style.display = "flex";
  } else {
    document.getElementById("d-discord-row").style.display = "none";
  }
  if (pub.githubId) {
    setText("d-github", pub.githubId);
    document.getElementById("d-github-row").style.display = "flex";
  } else {
    document.getElementById("d-github-row").style.display = "none";
  }
  if (typeof pub.canAccessPlatform === "boolean") {
    setText("d-access", pub.canAccessPlatform ? "GRANTED" : "REVOKED");
    document.getElementById("d-access-row").style.display = "flex";
  } else {
    document.getElementById("d-access-row").style.display = "none";
  }
  if (typeof pub.canBeAuditor === "boolean") {
    setText("d-auditor", pub.canBeAuditor ? "AUTHORIZED" : "UNAUTHORIZED");
    document.getElementById("d-auditor-row").style.display = "flex";
  } else {
    document.getElementById("d-auditor-row").style.display = "none";
  }
}