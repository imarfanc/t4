# t4

A staring AGENTS.md

> `CLAUDE.md` is a **symlink to this file**. Edit `AGENTS.md` — writing through
> the symlink fails.

## Layout

| Path         | What it is                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `_other/`    | Non-shipping material — docs, skills, scripts, checkpoints                                       |

## Tasks

Repo scripts live in `package.json`. Run `vp run choose` for the grouped searchable
picker, or `vp run <name>` for one task. Built-in quality tools: `vp fmt`, `vp lint`,
`vp check`. Group layout: `_other/scripts/vp-run-chooser/tasks.yaml`. Skill symlinks:
`vp run skills` (see `_other/scripts/link-skills/docs/README.md`).

## Further reading

- example — `_other/AGENTS/example.md`
