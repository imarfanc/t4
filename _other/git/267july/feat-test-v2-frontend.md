# Line of development — `feat-test/v2-frontend`

The v1/v2 shell split: app discovery, the v4 app schema + first admin tools, a
localhost auth fix, and the plain-CSS v1 shell that pushed daisyUI to v2.
Branched off `feat-test/deno-desktop1` at `c72cd3a`.

- **Role:** feature branch (sub-branch of `feat-test/deno-desktop1`)
- **Base:** `c72cd3a` (on `feat-test/deno-desktop1`)
- **Tip:** `212c84c` (2026-07-30)
- **Status:** **fully merged** — merged into `feat-test/deno-desktop1` at
  `f35c4d7`, then into `main` via `92ffde1` (PR #2). The branch ref still exists
  locally and on `origin`, but has **0 commits not on `main`**.
- **Commits in this line:** 6

## Commit summary

| Hash | Date | Subject |
| --- | --- | --- |
| `212c84c` | 2026-07-30 | 🪟🎨 add(shell): add a plain-CSS v1 shell, shift daisyUI shell to v2 |
| `220c6b6` | 2026-07-30 | refactor(sidebar): consolidate sidebar toggle functionality |
| `62222e0` | 2026-07-30 | add(app-discovery): implement sidebar app discovery and enhance UI |
| `9138b6e` | 2026-07-30 | 🔀🔑 repair(auth): fix sign-in failing on localhost vs 127.0.0.1 |
| `064ed72` | 2026-07-30 | 🧩📦 add(assembly): expand app schema to v4 and ship the first admin tools |
| `8f086d3` | 2026-07-30 | 🗂️🎨 add(shell): add app discovery and a new v1 shell to host them |

## Detailed log

> Newest first. Generated from `git log c72cd3a..212c84c --stat`.

----- COMMIT `212c84c` -----

- **Hash:** `212c84cf5f6271f8e2881e325c24e9891017d391`
- **Date:** 2026-07-30 15:47:56 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🪟🎨 add(shell): add a plain-CSS v1 shell, shift daisyUI shell to v2

███████╗██╗  ██╗██╗███████╗████████╗
██╔════╝██║  ██║██║██╔════╝╚══██╔══╝
███████║███████║██║█████╗     ██║
╚════██║██╔══██║██║██╔══╝     ██║
███████║██║  ██║██║███████╗   ██║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝   ╚═╝
███████╗██╗  ██╗██╗███████╗████████╗
██╔════╝██║  ██║██║██╔════╝╚══██╔══╝
███████║███████║██║█████╗     ██║
╚════██║██╔══██║██║██╔══╝     ██║
███████║██║  ██║██║███████╗   ██║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝   ╚═╝

| Area                | What changed                                               |
| -------------------- | ------------------------------------------------------------ |
| 🪟 frontends/v1     | new plain-CSS shell: glass sidebar over a preview frame    |
| 🌼 frontends/v2     | previous daisyUI/Tailwind shell, moved here with its build |
| 📦 frontends/v3     | previous plain shell, moved here unchanged                 |
| 🌐 backends/http.ts | serves /v3/ alongside /v1/ and /v2/                        |
| ⚙️ deno.json        | build/check/fmt/lint wired for three versioned shells      |
| 📄 README.md        | documents the three shells and assembly/assets layout      |

The daisyUI/Tailwind shell built for app discovery becomes v2, freeing v1
for a lighter plain-CSS take on the same sidebar-plus-preview-frame idea
without a Tailwind build step in the loop. The shell before that keeps its
place as v3, unchanged, so all three stay reachable for comparison while
one direction gets picked.


 README.md                        |    9 +-
 _tests/http_test.ts              |    8 +-
 backends/http.ts                 |    4 +-
 deno.json                        |   19 +-
 frontends/v1/app.css             |  639 ++++++
 frontends/v1/app.ts              |  705 +++---
 frontends/v1/index.html          |  314 +--
 frontends/v2/app.ts              |  511 +++++
 frontends/v2/dist/app.css        | 4566 ++++++++++++++++++++++++++++++++++++++
 frontends/v2/dist/app.js         | 2692 ++++++++++++++++++++++
 frontends/v2/index.html          |  262 ++-
 frontends/{v1 => v2}/src/app.css |    0
 frontends/{v2 => v3}/app.css     |    0
 frontends/{v2 => v3}/app.js      |    0
 frontends/v3/index.html          |   59 +
 15 files changed, 9160 insertions(+), 628 deletions(-)

----- COMMIT `220c6b6` -----

- **Hash:** `220c6b63b1c4a7af3976f614e2afb1f7f15b0be3`
- **Date:** 2026-07-30 15:34:16 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** refactor(sidebar): consolidate sidebar toggle functionality

- Removed the sidebar width button and integrated its functionality into the existing sidebar toggle button.
- Updated the tooltip and aria-label for the toggle button to reflect the new behavior.
- Cleaned up the HTML by removing the now redundant width button element.

This change simplifies the sidebar controls, enhancing user experience by reducing clutter.


 frontends/v1/app.ts     |  4 +---
 frontends/v1/index.html | 17 +++--------------
 2 files changed, 4 insertions(+), 17 deletions(-)

----- COMMIT `62222e0` -----

- **Hash:** `62222e0c0069b9ae49860402e22f8e7c423e06ba`
- **Date:** 2026-07-30 15:31:57 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** add(app-discovery): implement sidebar app discovery and enhance UI

- Introduced a new sidebar section for app discovery, allowing users to view and interact with applications.
- Enhanced CSS styles for the sidebar, including hover effects and layout adjustments for app buttons and folders.
- Updated JavaScript to fetch and display apps dynamically from the server, organizing them into a nested folder structure.
- Added functionality to open apps in an iframe and remember the last opened app using local storage.
- Improved user experience with hints and loading states while apps are being fetched.

This update lays the groundwork for a more interactive and user-friendly application management experience.


 frontends/v2/app.css    |  77 +++++++++++++++++++++++++++
 frontends/v2/app.js     | 135 +++++++++++++++++++++++++++++++++++++++++++++++-
 frontends/v2/index.html |  14 ++++-
 3 files changed, 224 insertions(+), 2 deletions(-)

----- COMMIT `9138b6e` -----

- **Hash:** `9138b6ed2bcb626349bc2c7d647b55f3d55639c6`
- **Date:** 2026-07-30 15:27:45 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🔀🔑 repair(auth): fix sign-in failing on localhost vs 127.0.0.1

██╗      ██████╗  ██████╗ ██████╗ ██████╗  █████╗  ██████╗██╗  ██╗
██║     ██╔═══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
██║     ██║   ██║██║   ██║██████╔╝██████╔╝███████║██║     █████╔╝
██║     ██║   ██║██║   ██║██╔═══╝ ██╔══██╗██╔══██║██║     ██╔═██╗
███████╗╚██████╔╝╚██████╔╝██║     ██████╔╝██║  ██║╚██████╗██║  ██╗
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
██╗ ██████╗ ███████╗
██║██╔════╝ ██╔════╝
██║██║  ███╗█████╗
██║██║   ██║██╔══╝
██║╚██████╔╝██║
╚═╝ ╚═════╝ ╚═╝

| Area                       | What changed                                                |
| --------------------------- | ------------------------------------------------------------- |
| 🔀 backends/auth/gate.ts   | canonicalRedirect(): bounces loopback aliases to app origin |
| 🔓 backends/auth/routes.ts | originMatches() accepts localhost/127.0.0.1 as one origin   |
| 🖼️ backends/http.ts        | new /assets/ static route, backed by assets/ dir            |
| 🎨 assets/icon.png         | app icon asset                                              |
| 🖌️ frontends/*.html        | reference the new icon/assets across auth and shell pages   |
| ⚙️ deno.json               | dev/start include assembly/ and assets/ dirs                |
| ✅ _tests/gate_test.ts     | coverage for the loopback canonical redirect                |

`localhost:5173` and `127.0.0.1:5173` are the same loopback server but two
different browser origins, and only one of them equals `APP_ORIGIN`.
Reaching the app by the other spelling made every sign-in fail with
`bad_origin`, since the browser always sends the origin it was actually
loaded from. `canonicalRedirect()` now bounces GET/HEAD requests on a
loopback alias to the canonical origin before the gate looks at anything
else, and `originMatches()` treats either spelling as the app's own origin
for the token exchange itself.


 .zed/empty.md                |   1 +
 _tests/gate_test.ts          |  31 +++++++++++++++++++++++++++++++
 assets/icon.png              | Bin 0 -> 1804193 bytes
 backends/auth/gate.ts        |  33 ++++++++++++++++++++++++++++++++-
 backends/auth/routes.ts      |  27 ++++++++++++++++++++++++++-
 backends/http.ts             |   5 +++++
 deno.json                    |   4 ++--
 frontends/auth/callback.html |   4 ++++
 frontends/auth/login.html    |   4 ++++
 frontends/v1/index.html      |   4 ++++
 frontends/v1/src/app.css     |   6 +++---
 frontends/v2/index.html      |   4 ++++
 12 files changed, 116 insertions(+), 7 deletions(-)

----- COMMIT `064ed72` -----

- **Hash:** `064ed724564cfca9f2912cee9c0fd1a9b68b2f5c`
- **Date:** 2026-07-30 15:23:28 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🧩📦 add(assembly): expand app schema to v4 and ship the first admin tools

███████╗ ██████╗██╗  ██╗███████╗███╗   ███╗ █████╗
██╔════╝██╔════╝██║  ██║██╔════╝████╗ ████║██╔══██╗
███████╗██║     ███████║█████╗  ██╔████╔██║███████║
╚════██║██║     ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══██║
███████║╚██████╗██║  ██║███████╗██║ ╚═╝ ██║██║  ██║
╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝
██╗   ██╗██╗  ██╗
██║   ██║██║  ██║
██║   ██║███████║
╚██╗ ██╔╝╚════██║
 ╚████╔╝      ██║
  ╚═══╝       ╚═╝

| Area                    | What changed                                                   |
| ------------------------ | ---------------------------------------------------------------- |
| 🧩 backends/api/apps.ts | schema_version 4 markers, id/state/tags/locality/routes fields |
| 🚫 backends/http.ts     | assembly/ replaces main/, retired apps 410 instead of 404      |
| 🎨 frontends/v1         | shell updated for the new app schema and organization tree     |
| 📦 assembly/            | first real apps: api-tester, dashboard, kv-explorer, settings  |
| 📐 assembly/_templates  | marker templates for root/group/section/app/access             |
| 🖼️ tmp/icon.jpeg        | app icon asset                                                 |
| ✅ _tests               | auth, bypass, desktop, handoff, http, secret suites updated    |

The v3 marker schema (main/, _apps_group.yaml) couldn't express whether an
app was retired, local-only, or which API routes/storage it needed — all
things the shell now has to know to render navigation and to gate access.
v4 markers carry that metadata explicitly, locality narrows monotonically
as you descend the tree, and a retired app now resolves to 410 instead of
a silent 404. assembly/ replaces main/ as the directory name to match the
new marker vocabulary, and four admin tools (api-tester, dashboard,
kv-explorer, settings) are the first real content built against it.


 _tests/auth_routes_test.ts                    |  10 +-
 _tests/bypass_test.ts                         |  10 +-
 _tests/desktop_test.ts                        |  18 +-
 _tests/handoff_test.ts                        |  14 +-
 _tests/http_test.ts                           |  19 +-
 _tests/secret_test.ts                         |   5 +-
 assembly/_root.yaml                           |  21 +
 assembly/_templates/_access.yaml              |   7 +
 assembly/_templates/_app.yaml                 |  25 +
 assembly/_templates/_group.yaml               |  14 +
 assembly/_templates/_groups.yaml              |   6 +
 assembly/_templates/_root.yaml                |  20 +
 assembly/_templates/_section.yaml             |  14 +
 assembly/admin/_section.yaml                  |  14 +
 assembly/admin/tools/_group.yaml              |  14 +
 assembly/admin/tools/api-tester/_app.yaml     |  25 +
 assembly/admin/tools/api-tester/app.js        |  98 ++++
 assembly/admin/tools/api-tester/highlight.js  |  34 ++
 assembly/admin/tools/api-tester/index.html    |  74 +++
 assembly/admin/tools/api-tester/styles.css    |  42 ++
 assembly/admin/tools/dashboard/_app.yaml      |  25 +
 assembly/admin/tools/dashboard/index.html     |  17 +
 assembly/admin/tools/kv-explorer/_app.yaml    |  29 +
 assembly/admin/tools/kv-explorer/app.css      |  93 ++++
 assembly/admin/tools/kv-explorer/app.js       | 733 ++++++++++++++++++++++++++
 assembly/admin/tools/kv-explorer/highlight.js |  34 ++
 assembly/admin/tools/kv-explorer/index.html   | 165 ++++++
 assembly/admin/tools/settings/_app.yaml       |  25 +
 assembly/admin/tools/settings/index.html      |  17 +
 backends/api/apps.ts                          | 212 ++++++--
 backends/api/mod.ts                           |   5 +-
 backends/auth/bypass.ts                       |   4 +-
 backends/auth/handoff.ts                      |   5 +-
 backends/auth/session.ts                      |  10 +-
 backends/config.ts                            |  11 +-
 backends/desktop/window.ts                    |   4 +-
 backends/http.ts                              |  18 +-
 backends/router.ts                            |   8 +-
 deno.lock                                     |   4 +
 frontends/v1/app.ts                           | 242 ++++++++-
 frontends/v1/index.html                       | 112 ++--
 frontends/v1/src/app.css                      |  25 +-
 frontends/v2/index.html                       |   3 +-
 tmp/icon.jpeg                                 | Bin 0 -> 379891 bytes
 44 files changed, 2112 insertions(+), 173 deletions(-)

----- COMMIT `8f086d3` -----

- **Hash:** `8f086d3a71082b3154e969bb37c8d51049d456bd`
- **Date:** 2026-07-30 14:53:05 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🗂️🎨 add(shell): add app discovery and a new v1 shell to host them

██████╗ ██╗███████╗ ██████╗ ██████╗ ██╗   ██╗███████╗██████╗
██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗
██║  ██║██║███████╗██║     ██║   ██║██║   ██║█████╗  ██████╔╝
██║  ██║██║╚════██║██║     ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗
██████╔╝██║███████║╚██████╗╚██████╔╝ ╚████╔╝ ███████╗██║  ██║
╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝
███████╗██╗  ██╗███████╗██╗     ██╗
██╔════╝██║  ██║██╔════╝██║     ██║
███████╗███████║█████╗  ██║     ██║
╚════██║██╔══██║██╔══╝  ██║     ██║
███████║██║  ██║███████╗███████╗███████╗
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝

| Area                     | What changed                                                  |
| ------------------------- | -------------------------------------------------------------- |
| 🗂️ backends/api/apps.ts  | new: discovers apps from _app.yaml markers under main/        |
| 🌐 backends/api/mod.ts   | new /api/v1/apps endpoint serving discovered apps             |
| 🔓 backends/auth/gate.ts | CSP relaxed for fonts/icons; same-origin iframe now allowed   |
| 📁 backends/http.ts      | serves /main/* app files and /v2/* alongside /v1/*            |
| 🎨 frontends/v1          | new shell built on Tailwind/daisyUI + Iconify, app.ts sidebar |
| 📦 frontends/v2          | old v1 app.js/app.css/index.html moved here unchanged         |
| ⚙️ deno.json/deno.lock   | Tailwind CLI + Iconify build steps, new deps                  |

The old v1 shell was a placeholder; it moves to v2 untouched so it stays
available while v1 becomes the real app shell. discoverApps() walks main/
for _app.yaml markers (with _apps_group.yaml/_section.yaml describing the
tree they hang from) and the new shell renders that tree as a sidebar,
loading each app in a same-origin iframe — which is why the CSP now
allows frame-ancestors 'self' and a same-origin frame-src instead of
denying framing outright.


 .gitignore                              |   1 +
 _other/docs/testing/manual-checklist.md |   2 +-
 _tests/gate_test.ts                     |   4 +-
 _tests/http_test.ts                     |  22 +-
 backends/api/apps.ts                    | 150 ++++++++++++
 backends/api/mod.ts                     |  12 +-
 backends/auth/gate.ts                   |  13 +-
 backends/http.ts                        |  26 +-
 deno.json                               |  20 +-
 deno.lock                               | 404 +++++++++++++++++++++++++++++++-
 frontends/v1/app.ts                     | 327 ++++++++++++++++++++++++++
 frontends/v1/index.html                 | 270 ++++++++++++++++++---
 frontends/v1/src/app.css                | 265 +++++++++++++++++++++
 frontends/{v1 => v2}/app.css            |   0
 frontends/{v1 => v2}/app.js             |   0
 frontends/v2/index.html                 |  41 ++++
 16 files changed, 1502 insertions(+), 55 deletions(-)
