---
name: migrate-app
description: Migrate one app from an old repo into vt5's MAIN/apps/<section>/<app> structure. Use when the user says "migrate <app>", "move <app> to vt5", "bring over <app>", or wants to transfer an app, tool, or site into vt5.
---

# migrate-app

Migrate exactly **one** app per invocation into `MAIN/apps/<section...>/<app>/`.

## Inputs to confirm with the user (if not given)

1. Source: repo + path (e.g. `web-apps` → `WEB-APPS/repo-sync`)
2. Destination: section path (sections may nest, e.g. `developer/tools/cli`)
3. Runtime and deployment target if the app runs its own server

## Steps

1. **Inspect source.** Read the app's justfile / CLAUDE.md / config. Note the
   runtime (static, deno, node, python), port, and any absolute paths or
   references outside the app folder.
2. **Copy** the app folder to `MAIN/apps/<section...>/<app>/`.
   Exclude: `.git`, `node_modules`, `.DS_Store`, caches, gitignored files.
   Never delete the source — the old repo keeps it until verified.
3. **Markers.** Walking down from `MAIN/apps/`, ensure each navigational folder has
   `_section.yaml`, copied from `MAIN/tooling/templates/_section.yaml`.
   Copy `_app.yaml` into the app folder and fill all fields, especially
   `origin.repository`, `origin.path`, and the nested `app` block. Record
   whether it is static, where it is available, its runtime and entry file,
   and every storage system it uses.
4. **Justfile.** The app must have one, with a `# just-runner-doc:` comment on
   line 1 and at least a `serve` or `start` recipe. Create or fix it.
5. **De-hardcode.** Fix absolute paths (`/Users/...`), old repo paths, and
   port collisions. Fonts/CSS/JS shared with other apps → point at `shared/`.
6. **Verify.**
   - `just jf <app>` finds it from the repo root
   - the app starts (`just serve`/`start` inside the app folder) or its
     `index.html` loads via the root `just serve`
   - `just validate` passes
   - grep the copied app for remaining references to the old repo
7. **Update** the app's own CLAUDE.md/README paths if it has one.
8. **Commit** intentionally. One commit per migrated app.

## Rules

- One app at a time; stop and ask rather than migrating extras.
- Exactly one marker per folder: `_section.yaml` or `_app.yaml`.
- Do not modify the source repo.
