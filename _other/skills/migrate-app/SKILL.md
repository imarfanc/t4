---
name: migrate-app
description: Migrate one app from another repository into this repo's app structure. Use when the user says "migrate <app>", "move <app> over", "bring over <app>", or wants to transfer an app, tool, or site into this repository.
---

# migrate-app

> **Sample skill.** A worked example of a _repo-specific_ skill. Adjust the
> destination layout and validation commands to your project, or delete it.

Migrate exactly **one** app per invocation into this repository's app tree.

## Inputs to confirm with the user (if not given)

1. Source: repo + path (e.g. `web-apps` → `WEB-APPS/repo-sync`)
2. Destination: section path (sections may nest, e.g. `developer/tools/cli`)
3. Runtime and deployment target if the app runs its own server

## Steps

1. **Inspect source.** Read the app's task runner config, `AGENTS.md`, and
   settings. Note the runtime (static, node, python), port, and any absolute
   paths or references outside the app folder.
2. **Copy** the app folder into the destination.
   Exclude: `.git`, `node_modules`, `.DS_Store`, caches, gitignored files.
   Never delete the source — the old repo keeps it until verified.
3. **Manifest.** Ensure every navigational folder on the way down carries the
   marker file this repo expects, and fill the app's own manifest completely —
   especially where it came from, its runtime and entry file, and every storage
   system it uses.
4. **Tasks.** Register the app's scripts in `package.json` and group them in
   `_other/scripts/vp-run-chooser/tasks.yaml`.
5. **De-hardcode.** Fix absolute paths (`/Users/...`), old repo paths, and port
   collisions. Shared fonts/CSS/JS → point at the shared location.
6. **Verify.** Discovery finds the app, it starts, `vp check` passes, and no
   references to the old repo remain.
7. **Update** the app's own `AGENTS.md`/`README.md` paths if it has one.
8. **Commit** intentionally. One commit per migrated app.

## Rules

- One app at a time; stop and ask rather than migrating extras.
- Exactly one marker per folder.
- Do not modify the source repo.
