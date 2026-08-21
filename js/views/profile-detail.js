import { safeLoadProfileDetail } from "../profile-detail.js";

export default function ProfileDetailView() {
  const wrapper = document.createElement("div");
  wrapper.className = "view-profile-detail";
  wrapper.innerHTML = `
    <div class="bw-sweep"></div>

    <div class="detail-wrap">
      <div class="detail-panel hud-frame">
        <div class="detail-head">
          <div>
            <h1 class="glitch" data-text="NETRUNNER FILE">NETRUNNER FILE</h1>
            <div class="sub">decrypted personnel record // read-only</div>
          </div>
        </div>

        <div class="detail-avatar-row" id="d-avatar-row" style="display:none;">
          <img class="detail-avatar" id="d-avatar" src="" alt="avatar" />
          <div class="detail-avatar-info">
            <div class="detail-avatar-name" id="d-name">--</div>
            <div class="detail-avatar-campus" id="d-campus">--</div>
          </div>
          <div class="detail-rank-badge" id="d-rank-badge">
            <span class="badge-title" id="d-rank">--</span>
            <span class="badge-desc" id="d-rank-desc">--</span>
          </div>
        </div>

        <div class="cred-bar-track detail-cred-bar">
          <div class="cred-bar-fill" id="d-rank-fill" style="width:0%"></div>
        </div>
        <div class="cred-next detail-cred-next">
          <span id="d-rank-progress">-- to next tier</span>
          <span id="d-rank-next">--</span>
        </div>

        <div class="detail-row" data-magnify><span class="k">Login</span><span class="v" id="d-login">--</span></div>
        <div class="detail-row" data-magnify><span class="k">User ID</span><span class="v" id="d-id">--</span></div>
        <div class="detail-row" data-magnify><span class="k">Module XP</span><span class="v" id="d-xp">--</span></div>
        <div class="detail-row" data-magnify><span class="k">Audit Ratio</span><span class="v" id="d-audit">--</span></div>
        <div class="detail-row" data-magnify><span class="k">XP Given</span><span class="v" id="d-up">--</span></div>
        <div class="detail-row" data-magnify><span class="k">XP Received</span><span class="v" id="d-down">--</span></div>
        <div class="detail-row" data-magnify><span class="k">First Uplink</span><span class="v" id="d-since">--</span></div>
        <div class="detail-row" data-magnify><span class="k">Threat Assessment</span><span class="v" id="d-threat">--</span></div>
        <div class="detail-row" data-magnify id="d-cohort-audit-row" style="display:none;"><span class="k">Cohort Audit Ratio</span><span class="v" id="d-cohort-audit">--</span></div>
        <div class="detail-row" data-magnify id="d-discord-row" style="display:none;"><span class="k">Discord</span><span class="v" id="d-discord">--</span></div>
        <div class="detail-row" data-magnify id="d-github-row" style="display:none;"><span class="k">GitHub</span><span class="v" id="d-github">--</span></div>
        <div class="detail-row" data-magnify id="d-access-row" style="display:none;"><span class="k">Platform Access</span><span class="v" id="d-access">--</span></div>
        <div class="detail-row" data-magnify id="d-auditor-row" style="display:none;"><span class="k">Auditor Clearance</span><span class="v" id="d-auditor">--</span></div>

        <div class="dossier-footer" id="d-footer">// file integrity nominal · blackwall relay authenticated</div>

        <a href="#/profile" data-link class="back-link">&larr; Return to Dashboard</a>
      </div>
    </div>
  `;

  wrapper.mount = () => {
    safeLoadProfileDetail();
  };

  return wrapper;
}
