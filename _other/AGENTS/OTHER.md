# `_other/` — the non-shipping folder

Everything in `_other/` is **material about the repo**, never material the repo
ships. Nothing in here is a deliverable, nothing here is imported by application
code, and deleting the whole folder must never break a build.

The point is a single, predictable home for the things that usually end up
scattered: notes, agent context, one-off scripts, history write-ups, skill
definitions. One folder means an agent can be told "scratch work goes in
`_other/`" once, and every session after that lands in the same place.

## Layout

This table is the one place the folder list is maintained. Everything else —
including [`../README.md`](../README.md) and the root `AGENTS.md` — links here
rather than repeating it.

| Path                       | What it holds                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `_other/AGENTS/`           | Deep-dive notes linked from the root `AGENTS.md` **Further reading** list                    |
| `_other/AGENTS/templates/` | Formats for those notes — templates, never content                                           |
| `_other/changelog/`        | Per-release changelogs and blog posts — see [CHANGELOG-INFO](../changelog/CHANGELOG-INFO.md) |
| `_other/ci/`               | Deploy and CI notes — setup logs, deploy logs, runbook fragments                             |
| `_other/custom/`           | Anything project-specific that fits nowhere else; rename it to suit                          |
| `_other/docs/`             | Human documentation, plus `Ai-Chats/` transcripts worth keeping                              |
| `_other/features/`         | Per-feature write-ups: intent, decisions, open questions                                     |
| `_other/git/`              | Git history records and commit-format conventions — see [GIT.md](GIT.md)                     |
| `_other/scripts/`          | Repo tooling that is not part of the product — see below                                     |
| `_other/skills/`           | The skill library, flat — see [SKILLS.md](SKILLS.md)                                         |

Folders that would otherwise be empty carry a `.gitkeep` so git tracks them and
the structure survives a fresh clone. It is deliberately an empty file rather
than a markdown one: nothing about it invites being read, updated, or mistaken
for content.

Sample content shipped by the template is registered in
`_other/scripts/template-reset/data/template.yaml` and marked in-file with
`<!-- template:sample -->`. Never leave a placeholder unregistered — see
[`../README.md`](../README.md).

## `_other/scripts/`

Each script is a folder, not a loose file, so its config, library code, and docs
travel with it:

```text
_other/scripts/<tool>/
├── <tool>.ts       # CLI entry — owns all rendering
├── lib/            # logic, returns plain data, no terminal output
├── data/           # configuration the tool reads
└── docs/README.md
```

Keeping `lib/` free of rendering is what makes the behavior testable without a
terminal. Five tools ship with the template:

- **`vp-run-chooser`** — `<runner> run choose` renders a grouped, searchable
  picker over `package.json` scripts. Groups and descriptions live in
  `vp-run-chooser/tasks.yaml`; a script missing from that file still appears,
  under `other`.
- **`link-skills`** — symlinks skills into the agent tool directories. See
  [SKILLS.md](SKILLS.md).
- **`template-reset`** — strips the sample content this template ships with.
  It is also the deterministic reset engine used by `template-init`. See
  [its README](../scripts/template-reset/docs/README.md).
- **`template-init`** — names a new project, applies the sample reset, cleans
  sample skill metadata, and reconciles the remaining links.
- **`template-check`** — runs application-neutral local health checks over the
  template lifecycle, task catalog, docs, configuration, and symlinks.

`<runner>` is the task runner, `vp` today — see [RUNNER.md](RUNNER.md). No
document here names a runner directly.

## Working here

- Adding a top-level folder under `_other/` is fine; add a row to the table
  above in the same commit.
- Nothing under `_other/` may be imported by shipping code. If something becomes
  load-bearing, move it out.
- Anything with secrets belongs in `.env`, which is gitignored — not here.
