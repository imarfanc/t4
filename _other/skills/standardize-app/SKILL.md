---
name: standardize-app
description: Standardize one existing app or package inside this repository without changing its behavior. Use when asked to normalize a package's folder layout, bring its manifest up to the current schema version, split its files into versioned frontend, data, and docs folders, or prepare it to match the conventions the rest of the repo follows.
---

# Standardize an App

> **Sample skill.** This is a worked example of a *repo-specific* skill — the
> kind that only makes sense inside one codebase. Rewrite the repository facts
> below for your project, or delete this skill entirely.

Standardize **one** app per invocation. Preserve its behavior, routes, stored
data, and content. This skill reshapes structure and metadata; it does not add
features.

## Repository facts to hold in mind

- Rules live in `AGENTS.md` at the repository root. `CLAUDE.md` is a **symlink**
  to it — edit `AGENTS.md`; writing through the symlink fails.
- `_other/` is non-shipping material. Scratch work is never a deliverable.
- Tasks run through `vp run <name>`; the catalog is `package.json` and the
  grouping is `_other/scripts/vp-run-chooser/tasks.yaml`.
- Each app directory carries one manifest file that declares what it is. A
  manifest at the wrong schema version is skipped with a warning, not migrated —
  which looks exactly like a missing app.

## Inspect first

1. Read `AGENTS.md` and any app-local `README.md`.
2. Read the app's manifest, entry file, scripts, styles, and data files, plus
   `git status` for the app.
3. Confirm where the app currently lands by running discovery and finding it,
   rather than reasoning about the tree.
4. Search for every path that will move before editing anything — relative
   `fetch()` calls, `import` specifiers, and `<link>`/`<script>` `src`
   attributes.

Do not assume every HTML, CSS, or JS file is a frontend file. Classify from
imports and from what the entry file actually loads.

## Organize the app

```text
<app>/
├── <manifest>          # declares the app
├── frontends/v1/       # versioned UI; never edit a shipped version in place
├── data/               # configuration and seed data
├── docs/               # documentation for this app only
└── README.md
```

- Move documentation into `docs/`, configuration into `data/`, and UI files into
  `frontends/v1/`. Adding `v2` later must not touch `v1`.
- Replace CDN scripts that the Content Security Policy blocks with vendored
  copies under the app.
- Fix absolute paths (`/Users/...`) and references to other repositories.

## Validate

- Discovery finds the app from the repo root.
- The app starts, or its entry file loads.
- `vp check` passes.
- Grep the app for references to its old paths.

## Rules

- One app at a time; stop and ask rather than standardizing extras.
- Behavior, URLs, and stored data are unchanged when you are done.
- Commit intentionally — one commit per standardized app.
