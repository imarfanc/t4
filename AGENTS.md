# repo-template

Starting `AGENTS.md`. This repository is a **template / sample repo** — clone or
copy it, then rename it and strip what you do not need. It ships no application
code; what it ships is a layout, a task runner, a skill library, and the agent
conventions that hold them together.

> `CLAUDE.md` is a **symlink to this file**. Edit `AGENTS.md` — writing through
> the symlink fails.

## Using this as a template

```sh
pnpm install                         # nothing works before this
<runner> run template:reset          # preview what is sample content
<runner> run template:reset:apply    # strip it
```

`template:reset` clears the placeholder git history, the worked branch record,
and the sample skills, keeping every file's structure. What counts as sample is
declared in `_other/scripts/template-reset/data/template.yaml`, not guessed.

What it deliberately leaves to you:

1. Rename: `package.json` `name`, this heading, `README.md`, and the brand
   strings in `_other/scripts/*/`.
2. Replace the placeholder scripts in `package.json` (`dev`, `start`, `browser`,
   `public`, `build:auth`) — they exit 1 on purpose — and describe them in
   `_other/scripts/vp-run-chooser/tasks.yaml`. Delete its `template` group once
   you are done, along with `_other/scripts/template-reset/`.
3. Prune skills you will not use in
   `_other/scripts/link-skills/data/skills.yaml` — each carries a one-line
   description — then run `<runner> run skills:all`.
4. Point `.vscode/sessions.json` at your own terminal setup.

The full procedure, including dropping `_other/` into a repo that already
exists, is [`_other/README.md`](_other/README.md).

## Layout

| Path         | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `_other/`    | Non-shipping material — docs, skills, scripts, git records, checkpoints    |
| `.agents/`   | Agent tool directory; `skills/` holds symlinks into `_other/skills`        |
| `.claude/`   | Claude Code settings and skill symlinks                                    |
| `.cursor/`   | Cursor settings, plans, MCP example, and skill symlinks                    |
| `.vscode/`   | Editor settings, recommended extensions, terminal sessions                 |

The folder-by-folder breakdown of `_other/` lives in `_other/AGENTS/OTHER.md`.

Nothing under `_other/` ships, is imported by application code, or is a
deliverable. Deleting it must never break a build.

## Tasks

Repo scripts live in `package.json`. Run `<runner> run choose` for the grouped
searchable picker, or `<runner> run <name>` for one task. Group layout:
`_other/scripts/vp-run-chooser/tasks.yaml`. Skill symlinks: `<runner> run skills`
(see `_other/scripts/link-skills/docs/README.md`).

**`<runner>` is `vp` (vite-plus) today.** Docs write `<runner>` rather than a
runner name so that swapping to bun or deno is a handful of known edits instead
of a repo-wide find-and-replace. `npm run <task>` is equivalent for everything
except `vp fmt`, `vp lint`, and `vp check`, which have no `package.json` entry.
See `_other/AGENTS/RUNNER.md` — it is the only file that names a runner.

## Conventions

- Commits use two formats: the full `git-commit-ascii` format — two emojis, an
  action word, a banner and change table — for anything someone will want the
  reasoning for later, and a one-line light format for routine work. Both are in
  `_other/AGENTS/GIT.md`. Branch and PR work goes through `git-flow`.
- Notable branches and checkpoints get written up in `_other/git/`.
- Every release gets two write-ups in `_other/changelog/` — a technical
  changelog and a blog post — indexed from the root `CHANGELOG.md`.
- Skills live flat in `_other/skills/` and are linked out; grouping is metadata
  in `skills.yaml`, not directories. Never edit a symlinked copy under
  `.claude/`, `.cursor/`, or `.agents/`.
- Empty folders are held open with `.gitkeep`. Sample content is marked in-file
  with `<!-- template:sample -->` and registered in `template.yaml` — never
  leave a placeholder unregistered.

## Further reading

- `_other/` purpose, and how to adapt it to a new repo — `_other/README.md`
- `_other/` folder table and script conventions — `_other/AGENTS/OTHER.md`
- Git history records and both commit formats — `_other/AGENTS/GIT.md`
- What `<runner>` is, and how to swap it — `_other/AGENTS/RUNNER.md`
- Release notes, twice per release — `_other/changelog/CHANGELOG-INFO.md`
- The skill library and how linking works — `_other/AGENTS/SKILLS.md`
- Shape of a further-reading note — `_other/AGENTS/templates/further-reading-note.md`
