# `_other/git/` — history records

Git already stores the history; this folder stores the **readable account** of
it. Branches get deleted, PR descriptions live on a website, and `git log`
answers "what changed" far better than "why". These files are the durable
version — greppable, reviewable, and present in a fresh clone with no network.

Nothing reads them automatically. They exist for humans and for agents starting
a cold session.

## Layout

```text
_other/git/
├── main-history.md      # index: every line of development, plus merges
├── main.md              # commits made directly on the trunk
├── branches/
│   └── feat-example.md  # one file per branch, `/` flattened to `-`
└── checkpoints.md       # dated notes on repo state and decisions
```

Each commit appears in exactly **one** line file. Merge commits join lines
together and are listed only in the index.

## When to write

- **A branch is about to merge and be deleted.** Write
  `branches/<branch>.md` first — afterwards the commits are still in `git log`,
  but the shape of the work is gone.
- **You are about to switch context.** Add a `checkpoints.md` entry: what is in
  flight, what was decided, what to pick up next.
- **The index drifts.** Regenerate `main-history.md` and `main.md` from
  `git log`; both files carry a **Generated:** date so drift is visible.

## Generating

```bash
git log --no-merges --first-parent main --stat          # -> main.md
git log --no-merges --stat main..<branch>               # -> branches/<branch>.md
git log --merges --first-parent main --oneline          # -> merge table in the index
```

Ask an agent to do it — the format is mechanical and the sample files show the
target shape exactly.

## Commit style

Commits in this repo use the `git-commit-ascii` skill: two freely-chosen emojis,
a descriptive action word, and a body with an ASCII-art banner plus an
area/what-changed table. The history files reproduce that body, which is why
they read as prose rather than as a diff. See
`_other/skills/common/git-commit-ascii/SKILL.md`.

Branch and PR workflow — what branch you are on, what it tracks, what to do
next — is handled by the `git-flow` skill.

## Rules

- One commit, one line file. Never duplicate a commit across files.
- Explain **why**, not the diff. The diff is in git.
- Sample content in this template is placeholder (`0000000`, `feat/example`).
  Replace it with real history or delete the files; do not leave both.
