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
├── checkpoints.md       # dated notes on repo state and decisions
└── custom-commits.md    # hand-written records of individual notable commits
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

There are two formats. Both share one action vocabulary (`add`, `repair`,
`reshape`, `maintain`, `document`, …), the same `!` marker and
`BREAKING CHANGE:` footer, and the same rule that you never stage files on the
user's behalf.

### Full format

The `git-commit-ascii` skill: two freely-chosen emojis, a descriptive action
word, and a body with an ASCII-art banner plus an area/what-changed table. The
history files reproduce that body, which is why they read as prose rather than
as a diff. See `_other/skills/git-commit-ascii/SKILL.md`.

### Light format

The full format earns its cost on commits someone will read again in six months.
Most commits are not that — bumping a dependency, fixing a typo, renaming a file
— and there the banner is longer than the change. The light format keeps routine
work cheap to commit, so that the full format keeps meaning *this one matters*.

```text
emoji action(scope): description

optional one-line why
```

- **One emoji**, not two — the change *type*. Domain is already in the scope.
- **Description** imperative, lowercase, under ~60 characters.
- **Body** at most one line, and only when the *why* is not obvious. No banner,
  no table, no paragraph.

```text
🔧 maintain(deps): bump the runner to 0.2.6
📄 document(readme): fix broken link to link-skills docs
♻️ reshape(config): move skills.yaml parsing into lib/
```

### Choosing between them

| Use the **full** format | Use the **light** format |
| --- | --- |
| New feature or capability | Dependency bumps, lockfile churn |
| Bug fix with a non-obvious root cause | Typos, formatting, comment edits |
| Refactor that changes how something is understood | Mechanical renames and moves |
| Anything touching several areas at once | Single-file, single-purpose changes |
| Anything you would want a history record for | Anything you would not |

Two questions decide it: **would someone want the reasoning later?** and **does
the change span more than one area?** A yes to either means the full format.
When in doubt use the full one — an over-documented commit costs a few minutes;
an under-documented one costs the next person an afternoon in `git blame`.

Never mix formats within a commit, and never downgrade to the light format to
avoid writing a table. If the change warrants a table, it warrants the full
format.

A light-format commit's entry in a history record is just its summary row — do
not invent a body for it retroactively. If one turns out to have mattered, note
the reasoning in `checkpoints.md` rather than rewriting the commit.

Branch and PR workflow — what branch you are on, what it tracks, what to do
next — is handled by the `git-flow` skill.

## Rules

- One commit, one line file. Never duplicate a commit across files.
- Explain **why**, not the diff. The diff is in git.
- Sample content in this template is placeholder (`0000000`, `feat/example`).
  Replace it with real history or delete the files; do not leave both.
