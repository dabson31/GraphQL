















function createLoginView() {
  return `
    <section id="view-login" class="view">

      <div id="preBootOverlay" class="pre-boot-overlay">
        <div id="preBootPrompt" class="pre-boot-prompt">
          click anything to continue
        </div>
      </div>

      <div class="bw-sweep"></div>

      <div class="login-wrap">
        <form id="loginForm" class="hud-frame">

          <h1 class="glitch" data-text="BLACKWALL">
            BLACKWALL
          </h1>

          <span class="login-tag">
            // netrunner access terminal
          </span>

          <input
            id="identifier"
            placeholder="USERNAME OR EMAIL"
            required
            autocomplete="username"
          >

          <input
            id="password"
            type="password"
            placeholder="PASSWORD"
            required
            autocomplete="current-password"
          >

          <button type="submit">
            Jack In
          </button>

          <p id="errorMsg" class="error"></p>

          <div id="txLog" class="tx-log"></div>

        </form>
      </div>

      <div id="txFlash" class="tx-flash">
        <span id="txFlashText"></span>
      </div>

      <a href="#/unauthorized" class="unauth-link">
        access unauthorized information
      </a>

    </section>
  `;
}


function createUnauthorizedView() {
  return `
    <section id="view-unauthorized" class="view">

      <div class="bw-sweep"></div>

      <div class="breach-wrap">

        <div
          class="breach-panel hud-frame"
          id="breachProtocol"
        >

          <div class="breach-head">

            <h1
              class="glitch"
              data-text="BREACH PROTOCOL"
            >
              BREACH PROTOCOL
            </h1>

            <div class="breach-timer-row">
              TIME REMAINING
              <span id="breachTimer">65.00</span>
            </div>

          </div>

          <a
            href="#/login"
            class="breach-login-btn breach-login-btn-top"
          >
            Return to Login Screen
          </a>

          <div
            class="breach-buffer"
            id="breachBuffer"
          ></div>

          <button
            type="button"
            id="breachStop"
            class="breach-stop-btn"
          >
            Stop / Upload Buffer
          </button>

          <div class="breach-body">

            <div>

              <p class="breach-section-label">
                Code Matrix
              </p>

              <div
                class="breach-grid"
                id="breachGrid"
              ></div>

            </div>

            <div>

              <p class="breach-section-label">
                Sequences Required
              </p>

              <div id="breachSequences"></div>

            </div>

          </div>

          <div
            class="breach-result is-hidden"
            id="breachResult"
          >

            <div class="breach-result-text">

              <h2 id="breachResultTitle"></h2>

              <p id="breachResultBody"></p>

            </div>

            <button
              type="button"
              id="breachRetry"
            >
              Retry
            </button>

          </div>

          <div
            class="breach-payload"
            id="breachPayload"
          >

            <span>
              // ICE_BREAKER uploaded — BLACKWALL subroutine disabled
            </span>

            <br>

            You weren't supposed to get past the corner-brackets.
            Nothing sensitive lives here, just this note:
            the actual restricted stuff is your own GraphQL data,
            gated properly behind the login upstream.
            This page was always just a decoy for the curious.

            <div class="breach-payload-actions">

              <a
                href="#/login"
                id="breachAccessBtn"
                class="breach-access-btn"
              >
                Access Authorized Data
              </a>

              <a
                href="#/login"
                class="breach-login-btn"
              >
                Return to Login Screen
              </a>

            </div>

          </div>

        </div>

      </div>

      <a
        href="#/login"
        class="unauth-link"
      >
        back to access
      </a>

    </section>
  `;
}


function createProfileView() {
  return `
    <section id="view-profile" class="view">

      <div class="bw-sweep"></div>

      <div
        id="bootOverlay"
        class="boot-overlay"
      >
        <div
          id="bootLines"
          class="boot-lines"
        ></div>
      </div>

      <div class="dashboard">

        <!-- ================= TOP BAR ================= -->

        <div class="topbar">

          <button
            id="identityBox"
            class="identity-box hud-frame"
            title="Open netrunner profile"
          >

            <span class="identity-dot"></span>

            <span class="identity-text">

              <span class="label">
                Netrunner ID
              </span>

              <span
                class="name"
                id="topName"
              >
                LOADING...
              </span>

              <span
                class="identity-rank"
                id="topRank"
              >
                --
              </span>

            </span>

            <span
              class="identity-uptime"
              id="sessionUptime"
            >
              UPLINK 00:00:00
            </span>

          </button>

          <button
            id="logoutBtn"
            class="logout-btn"
          >
            Disconnect
          </button>

        </div>


        <!-- ================= TITLE ================= -->

        <div class="title-band">

          <h1
            class="glitch"
            data-text="NEURAL DASHBOARD"
          >
            NEURAL DASHBOARD
          </h1>

          <div class="sub">
            blackwall relay // dynamic feed // tracks selected data source
          </div>

          <div class="boot-line">
            uplink stable · relay handshake ok · rendering 11 endpoints
          </div>

        </div>


        <!-- ================= MAIN GRID ================= -->

        <div class="grid-layout">


          <!-- ================= LEFT ================= -->

          <div class="center-visuals">

            <div
              class="chart-card hud-frame interactive-panel matrix-match"
              data-magnify
            >

              <span class="chart-title">
                Skill Matrix
              </span>

              <svg
                id="skillsChart"
                viewBox="0 0 260 196"
              ></svg>

            </div>


            <div
              class="chart-card hud-frame source-toggle-card"
            >

              <span class="chart-title">
                Data Source
              </span>

              <div class="source-toggle-list">

                <button
                  class="source-btn active"
                  data-source="module"
                >
                  MODULE
                </button>

                <button
                  class="source-btn"
                  data-source="bh-piscine"
                >
                  PISCINE GO
                </button>

                <button
                  class="source-btn"
                  data-source="piscine-js"
                >
                  PISCINE JS
                </button>

                <button
                  class="source-btn"
                  data-source="piscine-rust"
                >
                  PISCINE RUST
                </button>

              </div>

              <p class="source-hint">
                swaps the trajectory feed on the main graph
              </p>

            </div>


            <div
              class="chart-card hud-frame uplink-card interactive-panel"
              data-magnify
            >

              <span class="chart-title">
                Uplink Log
              </span>

              <div
                id="uplinkLog"
                class="uplink-log"
              ></div>

            </div>


            <div
              class="stat-card stat-card-wide hud-frame interactive-panel"
              data-magnify
              data-icon="★"
              style="--icon-color:#fcee0a;"
            >

              <span class="stat-label">
                Best Skill
              </span>

              <span
                class="stat-value stat-value-lg"
                id="stat-best-skill"
              >
                --
              </span>

              <span
                class="stat-outline"
                id="stat-best-skill-outline"
              >
                --
              </span>

              <span class="stat-sub">
                highest logged amount
              </span>

            </div>

          </div>


          <!-- ================= CENTER ================= -->

          <div class="hero-column">

            <div class="hero-graph hud-frame">

              <div class="scan-line"></div>

              <span
                class="chart-title"
                id="heroTitle"
              >
                XP Trajectory — Module
              </span>

              <svg
                id="xpChart"
                width="100%"
                height="100%"
                style="position:relative;z-index:1;"
              ></svg>

            </div>


            <div class="hero-substrip">


              <div
                class="stat-card stat-card-half hud-frame interactive-panel"
                data-magnify
                data-icon="✓"
                style="--icon-color:#39ff8f;"
              >

                <span class="stat-label">
                  Projects Passed / Failed
                </span>

                <div class="stat-split">

                  <div class="stat-split-item">

                    <span
                      class="stat-value"
                      id="stat-passed"
                    >
                      --
                    </span>

                    <span class="stat-sub">
                      clean runs
                    </span>

                  </div>

                  <div class="stat-split-divider"></div>

                  <div class="stat-split-item">

                    <span
                      class="stat-value"
                      id="stat-failed"
                    >
                      --
                    </span>

                    <span class="stat-sub">
                      flatlined attempts
                    </span>

                  </div>

                </div>

              </div>


              <div
                class="stat-card stat-card-half hud-frame interactive-panel"
                data-magnify
                data-icon="⇅"
                style="--icon-color:#00f0ff;"
              >

                <span class="stat-label">
                  XP Given / Received
                </span>

                <div class="stat-split">

                  <div class="stat-split-item">

                    <span
                      class="stat-value"
                      id="stat-up"
                    >
                      --
                    </span>

                    <span class="stat-sub">
                      audits you ran
                    </span>

                  </div>

                  <div class="stat-split-divider"></div>

                  <div class="stat-split-item">

                    <span
                      class="stat-value"
                      id="stat-down"
                    >
                      --
                    </span>

                    <span class="stat-sub">
                      audits run on you
                    </span>

                  </div>

                </div>

              </div>

            </div>


            <div
              class="chart-card hud-frame project-progress-card interactive-panel"
            >

              <span class="chart-title">
                Project Progress
              </span>

              <div class="project-progress-wrap">

                <div class="pp-row pp-header">

                  <div class="pp-col pp-col-path">
                    Project Path
                  </div>

                  <div class="pp-col pp-col-status">
                    Status
                  </div>

                  <div class="pp-col pp-col-captain">
                    Captain
                  </div>

                  <div class="pp-col pp-col-xp">
                    XP
                  </div>

                </div>

                <div
                  class="pp-body"
                  id="projectProgress"
                ></div>

              </div>

              <div
                class="project-progress-pagination"
                id="projectProgressPagination"
              >

                <button
                  type="button"
                  class="pp-page-btn"
                  id="ppPrevBtn"
                  aria-label="Previous page"
                >
                  ‹
                </button>

                <span
                  class="pp-page-label"
                  id="ppPageLabel"
                >
                  Page 1 / 1
                </span>

                <button
                  type="button"
                  class="pp-page-btn"
                  id="ppNextBtn"
                  aria-label="Next page"
                >
                  ›
                </button>

              </div>

            </div>

          </div>


          <!-- ================= RIGHT ================= -->

          <div class="center-visuals right">


            <div
              class="chart-card hud-frame interactive-panel matrix-match"
              data-magnify
            >

              <span class="chart-title">
                Pass / Fail
              </span>

              <svg
                id="passFailChart"
                viewBox="0 0 220 220"
              ></svg>

            </div>


            <div
              class="chart-card hud-frame interactive-panel"
              data-magnify
            >

              <span class="chart-title">
                Audit Ratio
              </span>

              <svg
                id="auditGauge"
                viewBox="0 0 200 200"
              ></svg>

            </div>


            <div
              class="chart-card hud-frame cred-card interactive-panel"
              data-magnify
            >

              <span class="chart-title">
                Street Cred
              </span>

              <div
                id="streetCred"
                class="cred-body"
              ></div>

              <div class="cred-divider"></div>

              <div
                class="sys-usage"
                id="sysUsage"
              >

                <div class="sys-row">

                  <span class="sys-label">
                    RAM
                  </span>

                  <div class="sys-bar-track">
                    <div
                      class="sys-bar-fill"
                      id="sysRamFill"
                    ></div>
                  </div>

                  <span
                    class="sys-value sys-value-num"
                    id="sysRamVal"
                  >
                    --/--
                  </span>

                </div>


                <div class="sys-row">

                  <span class="sys-label">
                    GPU
                  </span>

                  <div class="sys-bar-track">
                    <div
                      class="sys-bar-fill"
                      id="sysGpuFill"
                    ></div>
                  </div>

                  <span
                    class="sys-value"
                    id="sysGpuVal"
                  >
                    --%
                  </span>

                </div>


                <div class="sys-row">

                  <span class="sys-label">
                    CPU
                  </span>

                  <div class="sys-bar-track">
                    <div
                      class="sys-bar-fill"
                      id="sysCpuFill"
                    ></div>
                  </div>

                  <span
                    class="sys-value"
                    id="sysCpuVal"
                  >
                    --%
                  </span>

                </div>

              </div>

            </div>


            <div
              class="stat-card stat-card-wide hud-frame interactive-panel"
              data-magnify
              data-icon="◆"
              style="--icon-color:#ff003c;"
            >

              <span
                class="stat-label"
                id="stat-xp-label"
              >
                Module XP
              </span>

              <span
                class="stat-value stat-value-lg"
                id="stat-xp"
              >
                --
              </span>

              <span
                class="stat-outline"
                id="stat-xp-remainder"
              >
                --
              </span>

              <span class="stat-sub">
                raw data transferred // tracks the active source feed
              </span>

            </div>

          </div>

        </div>


        <!-- ================= LORE ================= -->

        <div class="lore-corner hud-frame">

          <div class="lore-title">
            // samurai.dat
          </div>

          <div class="lore-line">

            <span
              class="lore-flicker"
              id="loreQuote"
            >
              "Wake the f*** up, samurai. We have a city to burn."
            </span>

          </div>

          <div class="lore-line">
            Relic status:
            <span>STABLE</span>
            · Blackwall integrity:
            <span id="loreIntegrity">
              98.2%
            </span>
          </div>

          <div
            class="lore-line"
            id="loreStatus"
          >
            Chippin' in — connection secured via Afterlife relay node.
          </div>

        </div>

      </div>

    </section>
  `;
}


function createNotFoundView() {
  return `
    <section id="view-notfound" class="view">

      <div class="bw-sweep"></div>

      <div class="notfound-wrap">

        <div class="notfound-card hud-frame">

          <h1
            class="glitch notfound-code"
            data-text="404"
          >
            404
          </h1>

          <span class="notfound-title">
            Sector Unmapped
          </span>

          <div class="notfound-log">

            <div>
              &gt; tracing route
              <span class="notfound-cursor"></span>
            </div>

            <div>
              &gt; pinging endpoint...
              <span class="nf-flag">
                timeout
              </span>
            </div>

            <div>
              &gt; BLACKWALL
              <span>ICE</span>
              intercepted the request
            </div>

            <div>
              &gt; netrunner signature
              <span class="nf-ok">
                not flatlined
              </span>,
              just lost
            </div>

            <div>
              &gt; requested node does not exist on this grid
            </div>

          </div>

          <p class="notfound-blurb">
            You jacked into a path that isn't on the map.
            Could be a dead link, could be a ghost route
            BLACKWALL scrubbed a long time ago. Either way,
            there's nothing to breach here, netrunner.
          </p>

          <div class="notfound-actions">

            <a href="#/login">
              Return to Terminal
            </a>

          </div>

        </div>

      </div>

    </section>
  `;
}


function createProfileDetailView() {
  return `
    <section id="view-profile-detail" class="view">

      <div class="bw-sweep"></div>

      <div class="detail-wrap">

        <div class="detail-panel hud-frame">

          <div class="detail-head">

            <div>

              <h1
                class="glitch"
                data-text="NETRUNNER FILE"
              >
                NETRUNNER FILE
              </h1>

              <div class="sub">
                decrypted personnel record // read-only
              </div>

            </div>

          </div>


          <div
            class="detail-avatar-row"
            id="d-avatar-row"
            style="display:none;"
          >

            <img
              class="detail-avatar"
              id="d-avatar"
              src=""
              alt="avatar"
            >

            <div class="detail-avatar-info">

              <div
                class="detail-avatar-name"
                id="d-name"
              >
                --
              </div>

              <div
                class="detail-avatar-campus"
                id="d-campus"
              >
                --
              </div>

            </div>

            <div
              class="detail-rank-badge"
              id="d-rank-badge"
            >

              <span
                class="badge-title"
                id="d-rank"
              >
                --
              </span>

              <span
                class="badge-desc"
                id="d-rank-desc"
              >
                --
              </span>

            </div>

          </div>


          <div class="cred-bar-track detail-cred-bar">

            <div
              class="cred-bar-fill"
              id="d-rank-fill"
              style="width:0%"
            ></div>

          </div>


          <div class="cred-next detail-cred-next">

            <span id="d-rank-progress">
              -- to next tier
            </span>

            <span id="d-rank-next">
              --
            </span>

          </div>


          ${detailRow("Login", "d-login")}

          ${detailRow("User ID", "d-id")}

          ${detailRow("Module XP", "d-xp")}

          ${detailRow("Audit Ratio", "d-audit")}

          ${detailRow("XP Given", "d-up")}

          ${detailRow("XP Received", "d-down")}

          ${detailRow("First Uplink", "d-since")}

          ${detailRow("Threat Assessment", "d-threat")}


          <div
            class="detail-row"
            data-magnify
            id="d-cohort-audit-row"
            style="display:none;"
          >
            <span class="k">
              Cohort Audit Ratio
            </span>

            <span
              class="v"
              id="d-cohort-audit"
            >
              --
            </span>
          </div>


          <div
            class="detail-row"
            data-magnify
            id="d-discord-row"
            style="display:none;"
          >
            <span class="k">
              Discord
            </span>

            <span
              class="v"
              id="d-discord"
            >
              --
            </span>
          </div>


          <div
            class="detail-row"
            data-magnify
            id="d-github-row"
            style="display:none;"
          >
            <span class="k">
              GitHub
            </span>

            <span
              class="v"
              id="d-github"
            >
              --
            </span>
          </div>


          <div
            class="detail-row"
            data-magnify
            id="d-access-row"
            style="display:none;"
          >
            <span class="k">
              Platform Access
            </span>

            <span
              class="v"
              id="d-access"
            >
              --
            </span>
          </div>


          <div
            class="detail-row"
            data-magnify
            id="d-auditor-row"
            style="display:none;"
          >
            <span class="k">
              Auditor Clearance
            </span>

            <span
              class="v"
              id="d-auditor"
            >
              --
            </span>
          </div>


          <div
            class="dossier-footer"
            id="d-footer"
          >
            // file integrity nominal · blackwall relay authenticated
          </div>


          <a
            href="#/profile"
            class="back-link"
          >
            &larr; Return to Dashboard
          </a>

        </div>

      </div>

    </section>
  `;
}


function detailRow(label, id) {
  return `
    <div
      class="detail-row"
      data-magnify
    >
      <span class="k">
        ${label}
      </span>

      <span
        class="v"
        id="${id}"
      >
        --
      </span>
    </div>
  `;
}






function createViews() {
  const app = document.getElementById("app");

  if (!app) {
    console.error("BLACKWALL: #app not found");
    return;
  }

  app.innerHTML = `
    ${createLoginView()}
    ${createUnauthorizedView()}
    ${createProfileView()}
    ${createNotFoundView()}
    ${createProfileDetailView()}
  `;
}