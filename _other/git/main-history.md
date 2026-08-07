# Git history (index)

The full history is split into one file per **line of development**. Each commit
appears in exactly one line file; merge commits — which join lines together —
are listed here.

Regenerate this index and the line files whenever you want a readable, greppable
account of the repo that survives branch deletion. It is written by hand or by
an agent from `git log`; nothing reads it automatically.

<!-- template:sample -->

- **Generated:** 2026-07-31
- **Repo:** `repo-template` (`https://github.com/<you>/<repo>`)
- **HEAD:** `0000000` (branch `main`, in sync with `origin/main`)
- **Total commits:** 10 = 8 line commits + 2 merges

## Lines of development

| File                                                 | Line           | Commits | Base → Tip            | Status                  |
| ---------------------------------------------------- | -------------- | ------- | --------------------- | ----------------------- |
| [main.md](main.md)                                   | `main` (trunk) | 8       | `0000000` → `1111111` | active trunk            |
| [branches/feat-example.md](branches/feat-example.md) | `feat/example` | 2       | `1111111` → `2222222` | merged (PR #1), deleted |

## Merges

| Hash      | Merged         | Into   | PR  |
| --------- | -------------- | ------ | --- |
| `3333333` | `feat/example` | `main` | #1  |

> Sample content. Regenerate from your own `git log` — see `_other/AGENTS/GIT.md`.
