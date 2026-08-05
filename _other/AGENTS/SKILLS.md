# `_other/skills/` — the skill library

A **skill** is a folder with a `SKILL.md` that teaches an agent how to do one
recurring task in this repo's terms. Claude Code, Cursor, and other agent tools
each look for skills in their own directory — so the source of truth lives once
in `_other/skills/`, and `link-skills` symlinks it into each tool.

One copy, many consumers. Editing a skill updates it everywhere at once.

## Layout

```text
_other/skills/
├── common/    # used most sessions          (frontend-design, git-commit-ascii, git-flow)
├── rare/      # occasional, often repo-specific (migrate-app, standardize-app, here-now)
└── other/     # everything else             (ego-browser)
```

Category folders are discovered from disk, so renaming or adding one needs no
code change — but the keys under `skills:` in
`_other/scripts/link-skills/data/skills.yaml` must match, or every skill in that
category reads as "not on disk".

```text
_other/skills/<category>/<skill>/
├── SKILL.md      # required: frontmatter (name, description) + instructions
├── scripts/      # optional: helpers the skill invokes
├── evals/        # optional: cases that check the skill triggers correctly
└── agents/       # optional: per-tool interface metadata
```

The frontmatter `description` is what an agent matches against a user's request,
so write it as trigger phrases — "use when the user says X, Y, or Z" — not as a
summary.

## Linking

`data/skills.yaml` is the source of truth; `vp run skills:all` makes the repo
match it.

```yaml
targets:
  - { id: agents, path: .agents/skills, enabled: true }
  - { id: claude, path: .claude/skills, enabled: true }
  - { id: cursor, path: .cursor/skills, enabled: true }

skills:
  common:
    frontend-design: [claude]      # these targets only
    git-commit-ascii: [claude]
    git-flow: [agents]
  rare:
    here-now: false                # remove the symlink everywhere
    migrate-app: [cursor]
```

`true` links into every enabled target, `false` removes it everywhere, and a
list restricts it. Turning a skill off **removes** its symlink — but only if the
entry is a symlink into `_other/skills`; a real directory is skipped with a
warning.

```bash
vp run skills          # interactive: pick targets, then skills
vp run skills:check    # preview, write nothing
vp run skills:all      # apply skills.yaml exactly
vp run skills:prune    # report stale links and config drift
vp run skills:links    # list every symlink in the repo
vp run skills:config   # edit skills.yaml in $EDITOR
```

Full reference, including the status glyphs: `_other/scripts/link-skills/docs/README.md`.

## Adding a skill

1. Create `_other/skills/<category>/<name>/SKILL.md` with `name` and
   `description` frontmatter.
2. Add it to `data/skills.yaml` under its category, choosing targets.
3. `vp run skills:check`, then `vp run skills:all`.
4. Commit the skill **and** the new symlinks together.

Skills on disk but absent from `skills.yaml` are treated as `true` and reported
so you can pin them; skills in the file but not on disk are reported too.

## Skills in this template

| Skill | Category | What it does |
| --- | --- | --- |
| `frontend-design` | common | Visual direction and typography for new UI |
| `git-commit-ascii` | common | Commit format: two emojis, action word, ASCII banner, change table |
| `git-flow` | common | Reads real branch/upstream state, offers named next steps |
| `ego-browser` | other | Isolated browsing space for agents, with per-site learnings |
| `here-now` | rare | Publishing helper (Python scripts) |
| `migrate-app` | rare | **Sample** — move an app in from another repo |
| `standardize-app` | rare | **Sample** — normalize one app's layout and manifest |

The two samples are deliberately generic worked examples of a repo-specific
skill. Rewrite them for your project or delete them.
