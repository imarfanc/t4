# `_other/skills/` — the skill library

A **skill** is a folder with a `SKILL.md` that teaches an agent how to do one
recurring task in this repo's terms. Claude Code, Cursor, and other agent tools
each look for skills in their own directory — so the source of truth lives once
in `_other/skills/`, and `link-skills` symlinks it into each tool.

One copy, many consumers. Editing a skill updates it everywhere at once.

## Layout

The library is **flat**. One directory per skill, no category folders:

```text
_other/skills/
├── frontend-design/
├── git-commit-ascii/
├── git-flow/
└── ego-browser/
```

Grouping is metadata — the `group:` field in
`_other/scripts/link-skills/data/skills.yaml` — not directories. That is a
deliberate choice: a directory-based grouping has to be _right_, because
re-grouping means moving directories and relinking every symlink. Metadata
grouping can be wrong cheaply, so it gets fixed instead of tolerated. Groups are
free-form; invent one when none fits.

The earlier `common` / `rare` / `other` scheme graded skills by how often they
were used, which stops meaning anything the moment the template is copied into a
real project.

```text
_other/skills/<skill>/
├── SKILL.md      # required: frontmatter (name, description) + instructions
├── scripts/      # optional: helpers the skill invokes
├── evals/        # optional: cases that check the skill triggers correctly
└── agents/       # optional: per-tool interface metadata
```

A directory without a `SKILL.md` is ignored, so notes can sit alongside skills
without confusing the linker.

The frontmatter `description` is what an agent matches against a user's request,
so write it as trigger phrases — "use when the user says X, Y, or Z" — not as a
summary.

## Linking

`data/skills.yaml` is the source of truth; `<runner> run skills:all` makes the
repo match it.

```yaml
targets:
  - { id: agents, path: .agents/skills, enabled: true }
  - { id: claude, path: .claude/skills, enabled: true }
  - { id: cursor, path: .cursor/skills, enabled: true }

skills:
  git-flow:
    group: git
    description: Branch, PR and merge workflow, current state shown first
    targets: [agents] # these targets only

  here-now:
    group: sample
    description: Sample — publishes a location note
    targets: false # remove the symlink everywhere
```

`targets` takes `true` (every enabled target), `false` (nowhere), or a list.
Turning a skill off **removes** its symlink — but only if the entry is a symlink
into `_other/skills`; a real directory is skipped with a warning.

The `description` exists so that pruning the library is possible from this file
alone, without opening every `SKILL.md`. It defaults to the skill's own
frontmatter description when omitted. The shorthand `git-flow: [agents]` is
still accepted when group and description do not matter yet.

```bash
<runner> run skills          # interactive: pick targets, then skills
<runner> run skills:check    # preview, write nothing
<runner> run skills:all      # apply skills.yaml exactly
<runner> run skills:prune    # report stale links and config drift
<runner> run skills:links    # list every symlink in the repo
<runner> run skills:config   # edit skills.yaml in $EDITOR
```

Full reference, including the status glyphs: `_other/scripts/link-skills/docs/README.md`.

## Adding a skill

1. Create `_other/skills/<name>/SKILL.md` with `name` and `description`
   frontmatter.
2. Add it to `data/skills.yaml` with a `group`, a `description`, and `targets`.
3. `<runner> run skills:check`, then `<runner> run skills:all`.
4. Commit the skill **and** the new symlinks together.

Skills on disk but absent from `skills.yaml` are linked everywhere and reported
so you can pin them; skills in the file but not on disk are reported too.

## Skills in this template

| Skill              | Group   | What it does                                                      |
| ------------------ | ------- | ----------------------------------------------------------------- |
| `frontend-design`  | ui      | Visual direction and typography for new UI                        |
| `git-commit-ascii` | git     | Full commit format: two emojis, action word, banner, change table |
| `git-flow`         | git     | Reads real branch/upstream state, offers named next steps         |
| `ego-browser`      | browser | Isolated browsing space for agents, with per-site learnings       |
| `here-now`         | sample  | Publishing helper (Python scripts)                                |
| `migrate-app`      | sample  | Move an app in from another repo                                  |
| `standardize-app`  | sample  | Normalize one app's layout and manifest                           |

The `sample` group is deliberately generic worked examples of repo-specific
skills. `<runner> run template:reset` deletes all three; rewrite them for your
project instead if they are close to something you need.
