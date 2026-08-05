---
name: git-commit-ascii
description:
  Commit changes to git using two freely-chosen emojis + a descriptive action
  word (for example `⭐🔧 add`, `🐛💥 repair`, `♻️✨ reshape`). Use this skill
  whenever the user wants to create a git commit, mentions committing, says
  "commit these changes", "git commit", "I just finished [task], commit it", or
  any variation where they want to save their work to git. Even if they don't
  explicitly say "commit" but clearly want to save their work or move to the
  next step of their workflow.
---

# git-commit-ascii

Create clean git commits with dual-emoji titles and a rich body format
(ASCII art + table + narrative).

## Workflow

1. **Check what's staged** — run `git status`. If nothing is staged, tell the
   user and stop; never stage files yourself. Ignore unstaged/untracked files
   entirely — the staging area is the user's explicit choice of what to commit.
2. **Show the changes** — run `git diff --staged` so the user can review
   before anything happens.
3. **Draft the message** (format below) and display it to the user.
4. **Commit** — run `git commit` with the drafted message and report the
   result. Let pre-commit hooks run normally (no `--no-verify`); if a hook
   fails, tell the user and let them decide. Stop at the local commit: no
   push, no `vt push` or other deploy step, even if repo rules mention one
   elsewhere.

### Ignored files

`**/.vt/state.json` (Val Town runtime state) is committed like anything else
but should not influence the commit message — it's machine-generated noise.
If it's the _only_ staged change, use a generic message like
`🔧⚙️ maintain: update val town state` and proceed.

## Message Format

**Title:** `emoji1 emoji2 action(scope): description`

- Pick the two emojis freely — no fixed mappings. First emoji = change _type_
  (fix, add, cleanup…), second = _domain_ (backend, UI, config, data…).
- Pick one action word from the table below (best single fit; if mixed, the
  dominant change wins).
- Description in imperative mood, lowercase: "add login support".
- Scope in parentheses when applicable: `⭐🔑 add(auth): add JWT support`.
- Breaking changes: `!` after action/scope
  (`💥🔌 add(api)!: remove deprecated endpoints`) plus a
  `BREAKING CHANGE:` footer if needed.

| Action                              | When                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `launch`                            | First landing of a new project or val (`VALS/<name>/`) |
| `add` / `introduce` / `expand`      | Net-new features or capability                         |
| `diff` / `patch`                    | Cross-cutting multi-file change sets                   |
| `repair` / `fix`                    | Bug fix or behavioral correction                       |
| `reshape` / `refactor` / `simplify` | Refactoring, no behavior change                        |
| `document` / `clarify`              | Documentation only                                     |
| `polish` / `style`                  | UI polish or code-style cleanup                        |
| `maintain` / `tune` / `configure`   | Chore, config, tooling, dependencies                   |
| `verify` / `cover`                  | Tests or validation                                    |
| `speed` / `optimize`                | Performance                                            |
| `package` / `build`                 | Build system or packaging                              |
| `automate` / `ci`                   | CI/CD or automation                                    |
| `revert` / `remove`                 | Reverts or intentional removals                        |

**Body** — always the full format, never a bare subject line. Three parts, in
order:

1. **ASCII art** — always word art, and always **two lines of words**: two
   short words (or word groups) stacked, each rendered in solid `██╗`-style
   block letters. Indent with a leading space. Don't invent hollow/outline
   letter shapes — they come out illegible. No box diagrams; word art only.
2. **Markdown table** — one row per changed area/file, emoji prefix on area
   names, columns `Area` | `What changed`, one short line each. **Generate it
   with `scripts/align_table.py`** (see below).
3. **Narrative paragraph** — 1–3 sentences on root cause, motivation, or
   context. Skip only for trivial commits (single-file typo fix, etc.).

The body should explain WHAT and WHY, not HOW.

## Table Alignment

Emoji render 2 columns wide in monospace; padding by character count breaks
every row containing one. **Never hand-align** — hand-counting has failed
every time it's been tried. Pipe the rough table through the bundled script
(it lives in this skill's own directory, _not_ the repo) and paste its output
**verbatim**:

```bash
python3 <skill-dir>/scripts/align_table.py <<'EOF'
| Area | What changed |
| --- | --- |
| 🔎 filter.ts | toLowerCase() applied to tag compare |
EOF
```

If you can't locate the bundled script, do not fall back to hand-aligning —
recreate it from this core and pad each cell to the column's max display
width:

```python
import unicodedata
def disp_width(s):
    w = 0
    for ch in s:
        cp = ord(ch)
        if cp in (0xFE0F, 0xFE0E, 0x200D) or unicodedata.combining(ch):
            continue
        w += 2 if (0x1F300 <= cp <= 0x1FAFF or 0x2600 <= cp <= 0x27BF) else 1
    return w
```

Never hand-edit the output afterward, even by one space — a single manual
tweak reintroduces misalignment (this has happened before). If the table
needs to change, edit the input and rerun.

Keep the word art's own lines even; it doesn't need to match the table width.

## Examples

**Mixed fix:**

```text
🔧🐛 fix(github-repos): cache-only load, trimRepo fix

 ██████╗ █████╗  ██████╗██╗  ██╗███████╗
██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝
██║     ███████║██║     ███████║█████╗
██║     ██╔══██║██║     ██╔══██║██╔══╝
╚██████╗██║  ██║╚██████╗██║  ██║███████╗
 ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
 ███████╗██╗██╗  ██╗
 ██╔════╝██║╚██╗██╔╝
 █████╗  ██║ ╚███╔╝
 ██╔══╝  ██║ ██╔██╗
 ██║     ██║██╔╝╚██╗
 ╚═╝     ╚═╝╚═╝  ╚═╝

| Area                     | What changed                                              |
| ------------------------ | --------------------------------------------------------- |
| 🐛 BACKEND/routes.api.ts | GET /api/repos → SQLite-only; trimRepo() strips ~1MB→81KB |
| 🖥️ FRONTEND/app.ts       | Empty-cache state, maskedToken display, save re-fetches   |
| 📄 FRONTEND/index.html   | #maskedToken span next to "Connected to GitHub"           |

Root cause: full GitHub API objects (~1MB for 200 repos) exceeded the
@libsql/hrana-client payload limit → silent SQLite upsert crash. trimRepo()
keeps only the 12 fields the frontend actually uses.
```

**Small bug fix:**

```text
🐛🔍 repair(search): fix case-sensitive tag matching

 ████████╗ █████╗  ██████╗
 ╚══██╔══╝██╔══██╗██╔════╝
    ██║   ███████║██║  ███╗
    ██║   ██╔══██║██║   ██║
    ╚██║  ██║  ██║╚██████╔╝
     ╚═╝  ╚═╝  ╚═╝ ╚═════╝
 ███████╗██╗██╗  ██╗
 ██╔════╝██║╚██╗██╔╝
 █████╗  ██║ ╚███╔╝
 ██╔══╝  ██║ ██╔██╗
 ██║     ██║██╔╝╚██╗
 ╚═╝     ╚═╝╚═╝  ╚═╝

| Area         | What changed                         |
| ------------ | ------------------------------------ |
| 🔎 filter.ts | toLowerCase() applied to tag compare |

Tags were compared with strict equality; lowercasing both sides fixes search
for users who type in any case.
```
