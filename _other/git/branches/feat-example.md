# Line of development — `feat/example`

One file per branch, named after the branch with `/` flattened to `-`. Written
when a branch is about to be merged and deleted, so the work it contained stays
readable afterwards.

- **Role:** worked example of a feature branch record
- **Base:** `1111111` on `main` · **Tip:** `2222222`
- **Status:** merged via PR #1 (`3333333`), branch deleted
- **Commits in this line:** 2

## Commit summary

| Hash | Date | Subject |
| --- | --- | --- |
| `2222222` | 2026-07-31 | ✨🧩 add(example): second commit on the branch |
| `4444444` | 2026-07-31 | 🌿🔧 start(example): first commit on the branch |

## Detailed log

> Newest first. Generated from
> `git log --no-merges --stat main..feat/example`.

----- COMMIT `4444444` -----

- **Hash:** `4444444444444444444444444444444444444444`
- **Date:** 2026-07-31 09:00:00 -0500
- **Author:** you <you@example.com>
- **Subject:** 🌿🔧 start(example): first commit on the branch

| Area       | What changed              |
| ---------- | ------------------------- |
| 🔧 example | scaffold the example unit |

Why the branch exists, in a few sentences — the reasoning, not the diff.

 example.ts | 12 ++++++++++++
 1 file changed, 12 insertions(+)

> Sample content. Copy this file's shape for real branches.
