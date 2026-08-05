# Line of development — `feat-test/deno-desktop1`

The Deno desktop shell launch line: the initial desktop window + local auth
handoff. Branched off the `main` trunk at `144fbcb`.

- **Role:** feature branch → PR #2
- **Base:** `144fbcb` (on `main`)
- **Tip:** `c72cd3a` (2026-07-30)
- **Status:** **merged & deleted** — merged into `main` via `92ffde1` (PR #2).
  Before that, `feat-test/v2-frontend` was merged into this branch at `f35c4d7`.
- **Native commits in this line:** 3 (the `v2-frontend` sub-merge is filed separately)

## Commit summary

| Hash | Date | Subject |
| --- | --- | --- |
| `c72cd3a` | 2026-07-30 | 📓🗂️ document(docs): add vt6 build log and drop cursor export |
| `abd56a9` | 2026-07-30 | 🔑🖥️ add(auth): persist local sessions and hand them off to the desktop window |
| `539648c` | 2026-07-30 | 🚀🖥️ launch(desktop): launch Deno desktop shell with authentication |

## Detailed log

> Newest first. Generated from `git log 144fbcb..c72cd3a --stat`.

----- COMMIT `c72cd3a` -----

- **Hash:** `c72cd3a54893068e47293a9d94172e3f4d0e0d84`
- **Date:** 2026-07-30 14:36:26 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 📓🗂️ document(docs): add vt6 build log and drop cursor export

 ██████╗ ██╗   ██╗██╗██╗     ██████╗
 ██╔══██╗██║   ██║██║██║     ██╔══██╗
 ██████╔╝██║   ██║██║██║     ██║  ██║
 ██╔══██╗██║   ██║██║██║     ██║  ██║
 ██████╔╝╚██████╔╝██║███████╗██████╔╝
 ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
 ██╗      ██████╗  ██████╗
 ██║     ██╔═══██╗██╔════╝
 ██║     ██║   ██║██║  ██╗
 ██║     ██║   ██║██║   ██║
 ███████╗╚██████╔╝╚██████╔╝
 ╚══════╝ ╚═════╝  ╚═════╝
 ██████╗  ██████╗  ██████╗███████╗
 ██╔══██╗██╔═══██╗██╔════╝██╔════╝
 ██║  ██║██║   ██║██║     ███████╗
 ██║  ██║██║   ██║██║     ╚════██║
 ██████╔╝╚██████╔╝╚██████╗███████║
 ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
 ███╗   ███╗ ██████╗ ██╗   ██╗███████╗
 ████╗ ████║██╔═══██╗██║   ██║██╔════╝
 ██╔████╔██║██║   ██║██║   ██║█████╗
 ██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝
 ██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗
 ╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝

| Area                    | What changed                                              |
| ----------------------- | --------------------------------------------------------- |
| 📓 build-log.md         | add vt6 build log with design decisions and testing notes |
| 🗑️ cursor_symlink_setup | remove exported Cursor chat doc from docs root            |

Captures the deno-desktop foundation work — auth bypass, session persistence,
desktop handoff, and testing strategy — in one place under Ai-Chats/claude/.
Removes the one-off Cursor export that no longer belongs in docs/.

Co-authored-by: Cursor <cursoragent@cursor.com>


 _other/docs/Ai-Chats/claude/build-log.md          | 283 ++++++++++++++++++++++
 _other/docs/cursor_symlink_setup_for_agents_md.md | 103 --------
 2 files changed, 283 insertions(+), 103 deletions(-)

----- COMMIT `abd56a9` -----

- **Hash:** `abd56a9f6d324328f970d0f99018a556d7d428ad`
- **Date:** 2026-07-30 14:29:24 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🔑🖥️ add(auth): persist local sessions and hand them off to the desktop window

██████╗ ███████╗██████╗ ███████╗██╗███████╗████████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝██║██╔════╝╚══██╔══╝
██████╔╝█████╗  ██████╔╝███████╗██║███████╗   ██║
██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║╚════██║   ██║
██║     ███████╗██║  ██║███████║██║███████║   ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚══════╝   ╚═╝
███████╗███████╗███████╗███████╗██╗ ██████╗ ███╗   ██╗
██╔════╝██╔════╝██╔════╝██╔════╝██║██╔═══██╗████╗  ██║
███████╗█████╗  ███████╗███████╗██║██║   ██║██╔██╗ ██║
╚════██║██╔══╝  ╚════██║╚════██║██║██║   ██║██║╚██╗██║
███████║███████╗███████║███████║██║╚██████╔╝██║ ╚████║
╚══════╝╚══════╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

| Area                               | What changed                                                 |
| ----------------------------------- | ------------------------------------------------------------ |
| 🔑 backends/config.ts              | persisted local session secret, mode-based TTL/idle defaults |
| 🗄️ backends/db/kv.ts               | KV path reuses shared localDataDir() helper                  |
| 🎟️ backends/auth/handoff.ts        | new: single-use ticket resumes last desktop session          |
| 🚪 backends/auth/routes.ts,gate.ts | /auth/desktop ticket-exchange route wired into gate          |
| 🖼️ backends/desktop/window.ts      | opens window at handoff ticket URL when one exists           |
| ✅ _tests                          | handoff, secret, updated gate/session coverage               |
| 📄 README/.env.example             | document persisted secret, TTL defaults, desktop handoff     |
| 📋 _other/docs/testing             | manual QA checklist for session persistence/handoff          |

A random session secret on every boot silently invalidated every cookie,
so local mode now mints one secret once and keeps it beside the KV
database, with 30-day/7-day idle sessions instead of server-grade windows.
The desktop app's embedded browser doesn't reliably keep its own cookie
jar across launches, so the backend now remembers the last signed-in
session and hands the window a single-use, loopback-only ticket at
startup instead of forcing a fresh login every time.


 .env.example                            |  13 +-
 .gitignore                              |   1 +
 README.md                               |  40 ++++++
 _other/docs/testing/manual-checklist.md | 215 ++++++++++++++++++++++++++++++++
 _tests/gate_test.ts                     |  22 ++--
 _tests/handoff_test.ts                  | 211 +++++++++++++++++++++++++++++++
 _tests/secret_test.ts                   | 112 +++++++++++++++++
 _tests/session_test.ts                  |  22 +++-
 backends/auth/gate.ts                   |   1 +
 backends/auth/handoff.ts                | 135 ++++++++++++++++++++
 backends/auth/routes.ts                 |  68 ++++++++++
 backends/auth/session.ts                |   7 +-
 backends/config.ts                      | 116 ++++++++++++++---
 backends/db/keys.ts                     |   4 +
 backends/db/kv.ts                       |  17 +--
 backends/desktop/window.ts              |  23 +++-
 backends/main.ts                        |   6 +
 deno.json                               |   2 +-
 test.sh                                 |   3 +
 19 files changed, 964 insertions(+), 54 deletions(-)

----- COMMIT `539648c` -----

- **Hash:** `539648c5b5dc145c98e0bd7e30fe534b91353472`
- **Date:** 2026-07-30 13:10:39 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🚀🖥️ launch(desktop): launch Deno desktop shell with authentication

██╗    ██╗██╗███╗   ██╗██████╗  ██████╗ ██╗    ██╗
██║    ██║██║████╗  ██║██╔══██╗██╔═══██╗██║    ██║
██║ █╗ ██║██║██╔██╗ ██║██║  ██║██║   ██║██║ █╗ ██║
██║███╗██║██║██║╚██╗██║██║  ██║██║   ██║██║███╗██║
╚███╔███╔╝██║██║ ╚████║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝  ╚══╝╚══╝
 █████╗ ██╗   ██╗████████╗██╗  ██╗
██╔══██╗██║   ██║╚══██╔══╝██║  ██║
███████║██║   ██║   ██║   ███████║
██╔══██║██║   ██║   ██║   ██╔══██║
██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝

| Area                              | What changed                                                        |
| ---------------------------------- | ------------------------------------------------------------------- |
| 🖥️ backends/desktop               | frameless native window, app menu, sidebar/quit shortcuts           |
| 🔑 backends/auth                  | Shoo sign-in, HMAC session cookies, KV sessions, bypass, audit      |
| 🌐 backends/api,router,http       | health endpoint, single dispatch path, path-confined static serving |
| 🎨 frontends                      | login/callback pages, app shell, shared session/events helpers      |
| ✅ _tests                         | gate, session, cookie, bypass, jti, http, config, desktop suites    |
| 📄 README/.env.example/.gitignore | usage docs, env template, ignore local/data/dist dirs               |
| 🧩 skills                         | minor SKILL.md heading/fence tweaks                                 |

Combines the window from an earlier deno-desktop-v2 prototype with the
auth layer from deno-desktop-v3, leaving out apps, assemblies, and AI
providers for now. Every route goes through a single gate() so there is
exactly one place public-vs-authenticated access is decided, and an
explicit two-key bypass (AUTH_BYPASS + AUTH_BYPASS_CONFIRM_PUBLIC in
deploy mode) lets the app go public for demos without weakening the
default path.


 .env.example                                   |  37 ++++
 .gitignore                                     |   7 +
 README.md                                      |  93 +++++++++
 _other/skills/common/git-commit-ascii/SKILL.md |   2 +
 _other/skills/common/git-flow/SKILL.md         |   3 +-
 _tests/auth_routes_test.ts                     | 225 ++++++++++++++++++++++
 _tests/bypass_test.ts                          | 199 ++++++++++++++++++++
 _tests/config_test.ts                          |  19 ++
 _tests/cookie_test.ts                          |  75 ++++++++
 _tests/desktop_test.ts                         | 210 +++++++++++++++++++++
 _tests/events_test.ts                          |  14 ++
 _tests/gate_test.ts                            | 251 +++++++++++++++++++++++++
 _tests/helpers.ts                              |  84 +++++++++
 _tests/http_test.ts                            | 104 ++++++++++
 _tests/jti_test.ts                             |  29 +++
 _tests/session_test.ts                         | 125 ++++++++++++
 backends/api/mod.ts                            |  36 ++++
 backends/auth/audit.ts                         |  20 ++
 backends/auth/bypass.ts                        |  57 ++++++
 backends/auth/cookie.ts                        | 114 +++++++++++
 backends/auth/gate.ts                          | 204 ++++++++++++++++++++
 backends/auth/routes.ts                        | 247 ++++++++++++++++++++++++
 backends/auth/session.ts                       | 170 +++++++++++++++++
 backends/auth/verify.ts                        |  80 ++++++++
 backends/config.ts                             | 200 ++++++++++++++++++++
 backends/db/keys.ts                            |  11 ++
 backends/db/kv.ts                              |  39 ++++
 backends/db/repos/jti.ts                       |  27 +++
 backends/db/repos/sessions.ts                  |  83 ++++++++
 backends/desktop/menu.ts                       | 107 +++++++++++
 backends/desktop/window.ts                     | 117 ++++++++++++
 backends/http.ts                               | 106 +++++++++++
 backends/log.ts                                |  38 ++++
 backends/main.ts                               |  96 ++++++++++
 backends/router.ts                             |  15 ++
 backends/terminal.ts                           |  68 +++++++
 deno.json                                      |  47 +++++
 deno.lock                                      |  41 ++++
 frontends/auth/assets/auth.css                 |  42 +++++
 frontends/auth/auth.js                         |  57 ++++++
 frontends/auth/callback.html                   |  19 ++
 frontends/auth/login.html                      |  19 ++
 frontends/shared/events.js                     |   6 +
 frontends/shared/events.ts                     |   4 +
 frontends/shared/session.js                    |  41 ++++
 frontends/v1/app.css                           | 160 ++++++++++++++++
 frontends/v1/app.js                            |  37 ++++
 frontends/v1/index.html                        |  41 ++++
 justfile                                       |  53 ++++++
 test.sh                                        | 113 +++++++++++
 50 files changed, 3990 insertions(+), 2 deletions(-)
