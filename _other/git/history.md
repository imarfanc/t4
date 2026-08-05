# vt6 — Git History (index)

The full history has been split into one file per **line of development**.
Each commit appears in exactly one line file; merge commits (which join lines
together) are listed below.

- **Generated:** 2026-07-31
- **Repo:** vt6 (`https://github.com/imarfanc/vt6`)
- **HEAD:** `e1e00ef` (branch `main`, in sync with `origin/main`)
- **Total commits:** 40 = 35 line commits + 5 merges (initial: `cf4871e` 2026-07-29)

## Lines of development

| File | Line | Commits | Base → Tip | Status |
| --- | --- | --- | --- | --- |
| [main.md](main.md) | `main` (trunk) | 7 | `cf4871e` → `847485e` | active trunk |
| [feat-test-deno-desktop1.md](267july/feat-test-deno-desktop1.md) | `feat-test/deno-desktop1` | 3 | `144fbcb` → `c72cd3a` | merged (PR #2), deleted |
| [feat-test-v2-frontend.md](267july/feat-test-v2-frontend.md) | `feat-test/v2-frontend` | 6 | `c72cd3a` → `212c84c` | merged via deno-desktop1; ref still exists, 0 unique |
| [cleanup-frontends26730.md](267july/cleanup-frontends26730.md) | `cleanup/frontends26730` | 19 | `847485e` → `83d8fb3` | merged (PR #3), deleted |

## How the lines join (merge commits)

```text
cf4871e … 144fbcb                 main trunk
          │
          └─ 539648c … c72cd3a     feat-test/deno-desktop1 (PR #2)
                │
                └─ 8f086d3 … 212c84c   feat-test/v2-frontend
                                     └─ merged back at f35c4d7
          │
92ffde1 ── Merge PR #2 (deno-desktop1 → main)
847485e ── ✓✓ checkpoint (on main)
          │
          └─ 3dc3ee7 … 83d8fb3     cleanup/frontends26730 (PR #3)
3c1b10f ── Merge PR #3 (cleanup → main)
a94331b ── Merge (reshape frontends; same two parents as 3c1b10f)
e1e00ef ── Merge branch 'main' of origin (sync)
```

| Hash | Date | Merge |
| --- | --- | --- |
| `f35c4d7` | 2026-07-30 | `feat-test/v2-frontend` → `feat-test/deno-desktop1` |
| `92ffde1` | 2026-07-30 | PR #2 `feat-test/deno-desktop1` → `main` |
| `3c1b10f` | 2026-07-31 | PR #3 `cleanup/frontends26730` → `main` |
| `a94331b` | 2026-07-31 | `cleanup/frontends26730` → `main` (reshape frontends; re-merge of `847485e` + `83d8fb3`) |
| `e1e00ef` | 2026-07-31 | sync merge of `origin/main` into `main` |
