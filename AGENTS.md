# repo-template

Starting `AGENTS.md`. This repository is a **template / sample repo** — clone or
copy it, then rename it and strip what you do not need. It ships no application
code; what it ships is a layout, a task runner, a skill library, and the agent
conventions that hold them together.

> `CLAUDE.md` is a **symlink to this file**. Edit `AGENTS.md` — writing through
> the symlink fails.

## Using this as a template

1. Rename: `package.json` `name`, this heading, `README.md`, and the brand
   strings in `_other/scripts/*/`.
2. Replace the placeholder scripts in `package.json` (`dev`, `start`, `browser`,
   `public`, `build:auth`) — they exit 1 on purpose — and describe them in
   `_other/scripts/vp-run-chooser/tasks.yaml`.
3. Prune skills you will not use in
   `_other/scripts/link-skills/data/skills.yaml`, then run `vp run skills:all`.
   The `rare/` skills are marked as samples.
4. Clear the sample content in `_other/git/` and `_other/AGENTS/example.md`.
5. Point `.vscode/sessions.json` at your own terminal setup.

## Layout

| Path         | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `_other/`    | Non-shipping material — docs, skills, scripts, git records, checkpoints    |
| `.agents/`   | Agent tool directory; `skills/` holds symlinks into `_other/skills`        |
| `.claude/`   | Claude Code settings and skill symlinks                                    |
| `.cursor/`   | Cursor settings, plans, MCP example, and skill symlinks                    |
| `.vscode/`   | Editor settings, recommended extensions, terminal sessions                 |

Nothing under `_other/` ships, is imported by application code, or is a
deliverable. Deleting it must never break a build.

## Tasks

Repo scripts live in `package.json`. Run `vp run choose` for the grouped
searchable picker, or `vp run <name>` for one task. Built-in quality tools:
`vp fmt`, `vp lint`, `vp check`. Group layout:
`_other/scripts/vp-run-chooser/tasks.yaml`. Skill symlinks: `vp run skills`
(see `_other/scripts/link-skills/docs/README.md`).

## Conventions

- Commits use the `git-commit-ascii` format — two emojis, an action word, and a
  body explaining *why*. Branch and PR work goes through `git-flow`.
- Notable branches and checkpoints get written up in `_other/git/`.
- Skills are edited once in `_other/skills/` and linked out; never edit a
  symlinked copy under `.claude/`, `.cursor/`, or `.agents/`.

## Further reading

- `_other/` folder purpose and script conventions — `_other/AGENTS/OTHER.md`
- Git history records and commit style — `_other/AGENTS/GIT.md`
- The skill library and how linking works — `_other/AGENTS/SKILLS.md`
- Shape of a further-reading note (sample) — `_other/AGENTS/example.md`
