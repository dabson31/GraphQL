# GraphQL

This is a simple cyberpunk-themed dashboard built as a vanilla JavaScript single pagg app (SPA), utilizing a single GraphQL endpoint (learn.reboot01.com). The app authenticates a user, renders their profile, stats, charts and project history. The router loads different views such as login, profile, profile-detail, and 404 unauthorized pages without full page reloads.

## Functional Flow

* User logs in using his school credentials, which the platform uses to exchange for a JWT used on every request
* Once logged in, the dashboard loads the user's XP totals, level, rank, audit ratio, skills and pass/fail history in a GraphQL query.
* The rank gauge (renamed to street cred) and best-skill stat are computed from the same fetched data instead of using repeated seperate calls
* The project progress table shows all projects the user has joined. It also contain a status badge (Starting, In progress, Finished, Auditing) driven by the group's status field
* An uplink log displays the most recent XP transactions, and charts visualize xp over time and skill distribution (pie/donut chart)
* Other users' profiles can be viewed using profile-detail, which is accessed by an easter egg terminal-style view in the menu


## Technical connection

* `js/api.js` this centralizes every request to the backend using a singular `graphqlQuery()` func that posts to the GraphQL endpoint with a Bearer JWT.
* `js/auth.js` hadnles login, jwt storage and logout
* `js/router.js` and `js/views.js` drive the SPA navigation between login, profile, profile-detail and unauthorized error views
* `js/profile.js` loads the logged in user's core profile fields and hands off to the chart/stat renderers.
* `js/charts.js` contains data loaders and renderers for xp history, skills, audit ratio, best skill, uplink log and the project progress table
* `js/profile-detail.js` and `js/terminal.js` follow the same query pattern for viewing other users and running custom queries (easteregg)

## Deployment (Vercel)

* The project was deployed on Vercel by importing it directly from its GitHub repository, rather than uploading files manually.
* Steps:
  1. Pushed the project to a GitHub repository.
  2. On vercel.com, chose "Add New Project" and selected "Import Git Repository," then picked the GitHub repo from the list.
  3. Since this is a static site with no build step, the framework preset was left as "Other," with no build command and no output directory override needed (root of the repo is served as-is).
  4. Vercel automatically deployed on import and now redeploys on every push to the connected branch.
* No env variables or anything were required as the app talks directly to the public learn.reboot01.com GraphQL API from the browser.

## Contributers

* Hasan Ali (hasanali4)