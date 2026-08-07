# repo-template

A sample repo to model new projects after: opinionated layout, an agent skill
library, and a task runner — no application code. Copy it, rename it, delete
what you do not need.

```bash
pnpm install                  # once — nothing runs before this
vp run choose                 # grouped task picker (search + sections)
vp run skills                 # symlink skills into agent directories
vp run template:reset         # preview stripping the sample content
vp fmt / vp lint / vp check   # format, lint, typecheck
```

Tasks run through [Vite+](https://viteplus.dev/) (`vp`) today. Every doc in the
repo writes `<runner> run <task>` rather than naming a runner, so swapping to
bun or deno later is a handful of known edits — see
[`_other/AGENTS/RUNNER.md`](_other/AGENTS/RUNNER.md). `npm run <task>` works
identically for everything except `vp fmt` / `vp lint` / `vp check`.

## What's here

| Path       | What it is                                                              |
| ---------- | ----------------------------------------------------------------------- |
| `_other/`  | Everything that does not ship — docs, skills, scripts, git records      |
| `.agents/` `.claude/` `.cursor/` | Agent tool dirs; `skills/` are symlinks into `_other/skills` |
| `.vscode/` | Editor settings, recommended extensions, terminal sessions              |
| `AGENTS.md` | Repo rules an agent reads first (`CLAUDE.md` symlinks to it)           |

## Docs

- [`_other/README.md`](_other/README.md) — what `_other/` is, and the full procedure for adapting it
- [`_other/AGENTS/OTHER.md`](_other/AGENTS/OTHER.md) — the `_other/` folder table and script conventions
- [`_other/AGENTS/GIT.md`](_other/AGENTS/GIT.md) — git history records and both commit formats
- [`_other/AGENTS/SKILLS.md`](_other/AGENTS/SKILLS.md) — the skill library and symlinking
- [`_other/AGENTS/RUNNER.md`](_other/AGENTS/RUNNER.md) — what `<runner>` is, and how to swap it
- [`_other/scripts/link-skills/docs/README.md`](_other/scripts/link-skills/docs/README.md) — full `link-skills` reference
- [`_other/scripts/template-reset/docs/README.md`](_other/scripts/template-reset/docs/README.md) — full `template-reset` reference

## Making it yours

```bash
pnpm install
vp run template:reset:apply   # strips the sample git history and sample skills
```

Then the parts that need judgement: rename `package.json` `name` and the
headings, replace the placeholder scripts (`dev`, `start`, `browser`, `public`,
`build:auth` all exit 1 on purpose), and prune
`_other/scripts/link-skills/data/skills.yaml` before running `vp run skills:all`.

The full procedure — including dropping `_other/` into a repo that already
exists — is in [`_other/README.md`](_other/README.md).
