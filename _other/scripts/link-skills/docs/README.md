# link-skills

Symlinks skill folders from `_other/skills/<category>/<skill>` into
`.agents/skills/`, `.claude/skills/` and `.cursor/skills/`, so one copy of a
skill serves every agent tool.

Requires [Vite+](https://viteplus.dev/) (`vp`) — a new Mac with Xcode and `vp`
is enough. From the repo root run `vp install` once, then:

```bash
vp run choose          # interactive task picker (all repo scripts)
vp run skills           # interactive: choose targets, then skills
vp run skills:config    # edit the toggles in $EDITOR
vp run skills:check     # preview — show what would change, write nothing
vp run skills:all       # apply the config exactly, no prompts
vp run skills:prune     # report stale links and config drift
vp run skills:links     # list every symlink in the repo
```

Built-in quality tools (no script needed): `vp fmt`, `vp lint`, `vp check`.

## Toggling skills

[`data/skills.yaml`](../data/skills.yaml) is the source of truth. `vp run skills:all`
makes the repo match it.

```yaml
targets:
  - id: agents
    path: .agents/skills
    enabled: true

skills:
  common:
    frontend-design: true # link into every enabled target
    git-commit-ascii: false # remove the symlink everywhere
  rare:
    migrate-app: [claude, cursor] # these targets only, remove from the rest
```

- Set a target's `enabled: false` to leave that tool alone entirely.
- Skills on disk but absent from the file are treated as `true`, and reported so
  you can pin them.
- Skills in the file but not on disk are reported too.

Turning a skill off **removes** its symlink. Only symlinks pointing into
`_other/skills` are ever removed — a real directory, or a symlink to somewhere
else, is skipped with a warning. Removals are always shown in the preview and,
in interactive mode, confirmed before anything is written.

## Statuses

| Status          | Meaning                                               |
| --------------- | ----------------------------------------------------- |
| `linked`        | Correct symlink already in place                      |
| `missing`       | No entry yet; will be created                         |
| `wrong target`  | Symlink exists but points elsewhere; will be replaced |
| `not a symlink` | A real file or directory is in the way; skipped       |
| `off`           | Disabled in `skills.yaml`, and correctly absent       |
| `off, linked`   | Disabled in `skills.yaml`; the link will be removed   |

## Layout

```text
_other/scripts/link-skills/
├── links.sh           # list symlinks (vp run skills:links)
├── link-skills.ts     # CLI and interactive UI (vp node)
├── lib/
│   ├── skills.ts      # discovery and symlink logic (no UI)
│   └── config.ts      # skills.yaml parsing and validation
├── data/skills.yaml   # the toggles
└── docs/README.md
```

`lib/` holds all filesystem and config logic and returns plain data;
`link-skills.ts` owns every bit of rendering. Keeping them apart is what makes
the linking behavior testable without a terminal.

## Renaming a category

Category folders under `_other/skills/` are discovered from disk, so renaming
one needs no code change — but the keys under `skills:` in `skills.yaml` must be
renamed to match, or every skill in it reads as "not on disk". Run `vp run skills:links`
afterwards to confirm nothing is left dangling.

## Terminal font

Status glyphs assume **MesloLGS Nerd Font**:

```bash
brew install --cask font-meslo-lg-nerd-font
```
