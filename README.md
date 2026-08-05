# repo-template

A sample repo to model new projects after: opinionated layout, an agent skill
library, and a task runner — no application code. Copy it, rename it, delete
what you do not need.

Tasks run through [Vite+](https://viteplus.dev/) (`vp`) — no `just`, no global
Deno, no Gum. On a new Mac with Xcode and `vp`:

```bash
vp install          # once
vp run choose       # grouped task picker (search + sections)
vp run skills       # symlink skills into agent directories
vp fmt              # format (built-in)
vp lint             # lint (built-in)
vp check            # fmt + lint + typecheck (built-in)
```

## What's here

| Path       | What it is                                                              |
| ---------- | ----------------------------------------------------------------------- |
| `_other/`  | Everything that does not ship — docs, skills, scripts, git records      |
| `.agents/` `.claude/` `.cursor/` | Agent tool dirs; `skills/` are symlinks into `_other/skills` |
| `.vscode/` | Editor settings, recommended extensions, terminal sessions              |
| `AGENTS.md` | Repo rules an agent reads first (`CLAUDE.md` symlinks to it)           |

## Docs

- [`_other/AGENTS/OTHER.md`](_other/AGENTS/OTHER.md) — the `_other/` folder and script conventions
- [`_other/AGENTS/GIT.md`](_other/AGENTS/GIT.md) — git history records and commit style
- [`_other/AGENTS/SKILLS.md`](_other/AGENTS/SKILLS.md) — the skill library and symlinking
- [`_other/scripts/link-skills/docs/README.md`](_other/scripts/link-skills/docs/README.md) — full `link-skills` reference

## Making it yours

Rename `package.json` `name` and the headings, replace the placeholder scripts
(`dev`, `start`, `browser`, `public`, `build:auth` all exit 1 on purpose), prune
`_other/scripts/link-skills/data/skills.yaml` and run `vp run skills:all`, then
clear the sample content in `_other/git/`.
