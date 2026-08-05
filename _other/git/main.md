# Line of development — `main` (trunk)

Commits authored **directly on `main`** (its first-parent spine), excluding any
merged feature branches.

- **Role:** repository trunk / initial scaffold
- **Tip:** `e1e00ef` (2026-07-31) — branch `main`, active, in sync with `origin/main`
- **Direct (non-merge) commits in this line:** 7
- **Merges received into main:**
  - `92ffde1` — PR #2 `feat-test/deno-desktop1`
  - `3c1b10f` / `a94331b` / `e1e00ef` — PR #3 `cleanup/frontends26730` (reconciled)

## Commit summary

| Hash | Date | Subject |
| --- | --- | --- |
| `847485e` | 2026-07-30 | ✓✓ checkpoint |
| `144fbcb` | 2026-07-30 | 🌐🧩 add(skills): add ego-browser skill for agent web automation |
| `08d43da` | 2026-07-30 | 🌿🧩 add(skills): add git-flow skill for branch and PR workflows |
| `5e103be` | 2026-07-30 | 🧹⚙️ maintain(git): ignore Python bytecode and drop tracked cache |
| `70a57ec` | 2026-07-30 | 🔗🧩 add(skills): link skills into agent tool directories |
| `f3f6d19` | 2026-07-30 | ⭐🧩 add(scaffold): add editor configs, agent docs, and skill library |
| `cf4871e` | 2026-07-29 | 🌱📦 launch(vt6): initial project scaffold |

## Detailed log

> Newest first. Generated from `git log --no-merges --first-parent main --stat`.

----- COMMIT `847485e` -----

- **Hash:** `847485e4977bb0b38e65a702992721141ab2bbcc`
- **Date:** 2026-07-30 15:59:36 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** ✓✓ checkpoint



 _other/checkpoints/july-checkpoints.md | 11 +++++++++++
 _other/skills/common/git-flow/SKILL.md | 24 +++++++++++++++++-------
 2 files changed, 28 insertions(+), 7 deletions(-)

----- COMMIT `144fbcb` -----

- **Hash:** `144fbcbc3c92baa4d1223f5db6ecd79f44b37909`
- **Date:** 2026-07-30 12:40:23 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🌐🧩 add(skills): add ego-browser skill for agent web automation

███████╗ ██████╗  ██████╗
██╔════╝██╔════╝ ██╔═══██╗
█████╗  ██║  ███╗██║   ██║
██╔══╝  ██║   ██║██║   ██║
███████╗╚██████╔╝╚██████╔╝
╚══════╝ ╚═════╝  ╚═════╝
██╗    ██╗███████╗██████╗
██║    ██║██╔════╝██╔══██╗
██║ █╗ ██║█████╗  ██████╔╝
██║███╗██║██╔══╝  ██╔══██╗
╚███╔███╔╝███████╗██████╔╝
 ╚══╝╚══╝ ╚══════╝╚═════╝

| Area                               | What changed                                          |
| ----------------------------------- | ----------------------------------------------------- |
| 🌐 _other/skills/other/ego-browser | new skill: agent-friendly browser automation          |
| 📚 ego-browser/learnings/github    | tools + notes for repo stats, issues, repo search     |
| 📚 ego-browser/learnings/google    | tools + notes for autocomplete, search-extract        |
| 📚 ego-browser/learnings/x-com     | tools + notes for timeline, user search, post extract |
| ⚙️ link-skills/data/skills.yaml    | register ego-browser, linked to cursor                |
| 🔗 .cursor/skills/ego-browser      | symlink created for the new skill                     |

ego-browser gives agents their own isolated browsing space that still
reuses the user's login state, avoiding the resource contention of driving
the user's live browser session. Per-site learnings (GitHub, Google, X.com)
ship as reusable tool scripts + notes so common navigation and extraction
patterns don't need to be rediscovered each session.


 .cursor/skills/ego-browser                         |   1 +
 _other/scripts/link-skills/data/skills.yaml        |   3 +
 _other/skills/other/ego-browser/SKILL.md           | 208 +++++++++++++++++++++
 .../learnings/github/browser-tools/repo-stats.js   |  10 +
 .../ego-browser/learnings/github/manifest.json     |  61 ++++++
 .../ego-browser/learnings/github/notes/overview.md |  21 +++
 .../learnings/github/tools/open-issues.js          |  24 +++
 .../learnings/github/tools/search-repos.js         |  30 +++
 .../learnings/google/browser-tools/autocomplete.js |  11 ++
 .../ego-browser/learnings/google/manifest.json     |  40 ++++
 .../ego-browser/learnings/google/notes/overview.md |  20 ++
 .../learnings/google/tools/search-extract.js       |  25 +++
 .../learnings/x-com/browser-tools/extract-post.js  |   9 +
 .../ego-browser/learnings/x-com/manifest.json      |  51 +++++
 .../ego-browser/learnings/x-com/notes/overview.md  |  18 ++
 .../ego-browser/learnings/x-com/notes/timeline.md  |  16 ++
 .../learnings/x-com/tools/search-users.js          |  18 ++
 .../ego-browser/learnings/x-com/tools/timeline.js  |  21 +++
 18 files changed, 587 insertions(+)

----- COMMIT `08d43da` -----

- **Hash:** `08d43dae7a388a76692a9efab69ae4833ab21669`
- **Date:** 2026-07-30 12:37:33 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🌿🧩 add(skills): add git-flow skill for branch and PR workflows

██████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗██╗  ██╗
██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔════╝██║  ██║
██████╔╝██████╔╝███████║██╔██╗ ██║██║     ███████║
██╔══██╗██╔══██╗██╔══██║██║╚██╗██║██║     ██╔══██║
██████╔╝██║  ██║██║  ██║██║ ╚████║╚██████╗██║  ██║
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝
██╗
██║
██║
██║
██║
╚═╝

| Area                             | What changed                                    |
| --------------------------------- | ----------------------------------------------- |
| 🧩 _other/skills/common/git-flow | new skill: branch/PR/merge situational guidance |
| ⚙️ link-skills/data/skills.yaml  | register git-flow, linked to cursor only        |
| 🔗 .cursor/skills/git-flow       | symlink created for the new skill               |

Git prompts tend to be vague about branch/base names, forcing the user to
hold state in their head. git-flow reads the actual branch, upstream, and
dirty-file situation first, then offers named next steps (create, PR,
merge) using real branch names instead of generic templates.


 .cursor/skills/git-flow                     |   1 +
 _other/scripts/link-skills/data/skills.yaml |   1 +
 _other/skills/common/git-flow/SKILL.md      | 134 ++++++++++++++++++++++++++++
 3 files changed, 136 insertions(+)

----- COMMIT `5e103be` -----

- **Hash:** `5e103be096adc19e393295941b53b415345f43d8`
- **Date:** 2026-07-30 12:24:45 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🧹⚙️ maintain(git): ignore Python bytecode and drop tracked cache

 ██████╗██╗     ███████╗ █████╗ ███╗   ██╗
██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║
██║     ██║     █████╗  ███████║██╔██╗ ██║
██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║
╚██████╗███████╗███████╗██║  ██║██║ ╚████║
 ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
██╗   ██╗██████╗
██║   ██║██╔══██╗
██║   ██║██████╔╝
██║   ██║██╔═══╝
╚██████╔╝██║
 ╚═════╝ ╚═╝

| Area                | What changed                      |
| ------------------- | --------------------------------- |
| 🙈 .gitignore       | ignore __pycache__/ and *.py[cod] |
| 🗑️ here-now scripts | drop tracked .pyc bytecode        |

A stray __pycache__ .pyc had been committed under here-now scripts; this
removes it and adds standard Python ignore rules so it does not come back.

Co-authored-by: Cursor <cursoragent@cursor.com>


 .gitignore                                              |   4 ++++
 .../scripts/__pycache__/publish.cpython-311.pyc         | Bin 20011 -> 0 bytes
 2 files changed, 4 insertions(+)

----- COMMIT `70a57ec` -----

- **Hash:** `70a57ecb19af2ce4b347e1da51616ef1744bff3f`
- **Date:** 2026-07-30 12:22:44 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🔗🧩 add(skills): link skills into agent tool directories

██╗     ██╗███╗   ██╗██╗  ██╗
██║     ██║████╗  ██║██║ ██╔╝
██║     ██║██╔██╗ ██║█████╔╝
██║     ██║██║╚██╗██║██╔═██╗
███████╗██║██║ ╚████║██║  ██╗
╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ███████╗
╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
███████║██║  ██╗██║███████╗███████╗███████║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝

| Area                              | What changed                                  |
| --------------------------------- | --------------------------------------------- |
| 🔗 .agents/.claude/.cursor/skills | symlinks into _other/skills, driven by config |
| ⚙️ _other/scripts/link-skills     | new Deno tool: config, lib, justfile, docs    |

Skills previously lived only under _other/skills where no agent tool would
discover them. link-skills.ts reads data/skills.yaml as the source of truth
and creates/removes symlinks per tool, so each skill can be toggled on or
off per target without duplicating files.


 .agents/skills/standardize-vt5-app          |   1 +
 .claude/skills/frontend-design              |   1 +
 .claude/skills/git-commit-ascii             |   1 +
 .cursor/skills/migrate-app                  |   1 +
 _other/scripts/link-skills/data/skills.yaml |  40 +++
 _other/scripts/link-skills/deno.jsonc       |  22 ++
 _other/scripts/link-skills/deno.lock        |  90 +++++++
 _other/scripts/link-skills/docs/README.md   |  94 +++++++
 _other/scripts/link-skills/justfile         | 102 ++++++++
 _other/scripts/link-skills/lib/config.ts    | 204 +++++++++++++++
 _other/scripts/link-skills/lib/skills.ts    | 365 +++++++++++++++++++++++++++
 _other/scripts/link-skills/link-skills.ts   | 369 ++++++++++++++++++++++++++++
 12 files changed, 1290 insertions(+)

----- COMMIT `f3f6d19` -----

- **Hash:** `f3f6d19cad24221e1ef31024cc98657b052a23f6`
- **Date:** 2026-07-30 12:22:16 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** ⭐🧩 add(scaffold): add editor configs, agent docs, and skill library

 █████╗ ██████╗ ██████╗
██╔══██╗██╔══██╗██╔══██╗
███████║██║  ██║██║  ██║
██╔══██║██║  ██║██║  ██║
██║  ██║██████╔╝██████╔╝
╚═╝  ╚═╝╚═════╝ ╚═════╝
███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ███████╗
╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
███████║██║  ██╗██║███████╗███████╗███████║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝

| Area                    | What changed                                              |
| ----------------------- | --------------------------------------------------------- |
| 🛠️ .vscode/.cursor      | editor settings, extensions, sessions, mcp example config |
| 📄 AGENTS.md/CLAUDE.md  | root agent instruction files added                        |
| 🧩 _other/skills/common | frontend-design, git-commit-ascii skills + evals/scripts  |
| 🧩 _other/skills/rare   | here-now, migrate-app, standardize-vt5-app skills         |
| 📚 _other/docs          | cursor symlink setup docs for agents.md                   |

Rounds out the initial scaffold with editor/IDE configuration and a
reusable skill library (common + rare) so future agent sessions in this
repo have consistent tooling and documented workflows from the start.


 .agents/empty.md                                   |   1 +
 .claude/settings.json                              |  15 +
 .cursor/mcp.json.example                           |  14 +
 .cursor/plans/empty.md                             |   1 +
 .gitignore                                         |   3 +
 .vscode/extensions-stable-vscode.md                |  51 +++
 .vscode/extensions.json                            |  42 ++
 .vscode/sessions.json                              | 143 +++++++
 .vscode/settings.json                              | 182 ++++++++
 AGENTS.md                                          |   1 +
 CLAUDE.md                                          |   1 +
 README.md                                          |   2 +-
 .../cursor/cursor_symlink_setup_for_agents_md.md   | 103 +++++
 _other/docs/cursor_symlink_setup_for_agents_md.md  | 103 +++++
 _other/skills/common/frontend-design/SKILL.md      |  55 +++
 _other/skills/common/git-commit-ascii/SKILL.md     | 175 ++++++++
 .../common/git-commit-ascii/evals/evals.json       | 104 +++++
 .../common/git-commit-ascii/scripts/align_table.py |  80 ++++
 _other/skills/rare/here-now/SKILL.md               | 250 +++++++++++
 .../scripts/__pycache__/publish.cpython-311.pyc    | Bin 0 -> 20011 bytes
 _other/skills/rare/here-now/scripts/_common.py     | 359 ++++++++++++++++
 _other/skills/rare/here-now/scripts/drive.py       | 436 ++++++++++++++++++++
 _other/skills/rare/here-now/scripts/publish.py     | 456 +++++++++++++++++++++
 _other/skills/rare/migrate-app/SKILL.md            |  47 +++
 _other/skills/rare/standardize-vt5-app/SKILL.md    | 308 ++++++++++++++
 .../rare/standardize-vt5-app/agents/openai.yaml    |   4 +
 26 files changed, 2935 insertions(+), 1 deletion(-)

----- COMMIT `cf4871e` -----

- **Hash:** `cf4871e7c2b4e3279b82ae348d7d4f6b2bc8cfe4`
- **Date:** 2026-07-29 14:50:49 -0500
- **Author:** imarfanc <142709234+imarfanc@users.noreply.github.com>
- **Subject:** 🌱📦 launch(vt6): initial project scaffold

██╗   ██╗████████╗ ██████╗
██║   ██║╚══██╔══╝██╔════╝
██║   ██║   ██║   ███████╗
╚██╗ ██╔╝   ██║   ██╔═══██║
 ╚████╔╝    ██║   ╚██████╔╝
  ╚═══╝     ╚═╝    ╚═════╝
 ███████╗██╗██╗  ██╗
 ██╔════╝██║╚██╗██╔╝
 █████╗  ██║ ╚███╔╝
 ██╔══╝  ██║ ██╔██╗
 ██║     ██║██╔╝╚██╗
 ╚═╝     ╚═╝╚═╝  ╚═╝

| Area          | What changed                               |
| ------------- | ------------------------------------------ |
| 🙈 .gitignore | ignore Deno cache dir and coverage reports |
| 📄 README.md  | add project title                          |

First commit for the vt6 repo: baseline .gitignore for Deno tooling and a
minimal README to seed the project.


 .gitignore | 11 +++++++++++
 README.md  |  1 +
 2 files changed, 12 insertions(+)
