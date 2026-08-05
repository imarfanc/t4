---
name: standardize-vt6-app
description: Standardize one existing app inside the vt6 repository without changing its behavior. Use when asked to organize an app under assembly/, bring its _app.yaml marker up to schema_version 5, fix a marker that renders wrong or not at all in the sidebar, split an app's files into frontends versions, data and docs folders, replace CDN scripts the Content Security Policy blocks, declare an app's API routes and storage accurately, or prepare an app for another frontend version.
---

# Standardize a vt6 App

Standardize **one** app per invocation. Preserve its behavior, routes, stored
data, and content. This skill reshapes structure and metadata; it does not add
features.

vt6 is not vt5. There is no `MAIN/apps` vs `MAIN/pages` split, no per-app
`justfile`, and no per-app server: `assembly/` is content served off disk by one
Deno backend, and an app is any directory holding an `_app.yaml`.

## Repository facts to hold in mind

- Rules live in `AGENTS.md` at the repository root. `CLAUDE.md` is a **symlink**
  to it — edit `AGENTS.md`; writing through the symlink fails.
- Marker reference: `_other/AGENTS/assembly-markers.md`. Sidebar headings:
  `_other/AGENTS/headings.md`. Field-by-field templates with inline comments
  live in `assembly/_templates/`.
- Two marker files, both `schema_version: 5`, one per directory:
  - `_app.yaml` — makes its directory an app.
  - `_section.yaml` — organizational, with `kind: root | section | group`.
    `root` starts a switchable tree and is never itself a folder; `section` is a
    top-level folder; `group` nests inside one.
- Anything other than `schema_version: 5` is skipped with a warning, not
  migrated. A v4 marker is invisible, which looks exactly like a missing app.
- `/assembly/*` serves straight off the filesystem. `children` in a marker is
  documentation, not an allowlist, and moving a file changes its URL.
- `deno fmt` and `deno lint` **exclude `assembly/`** (see `deno.json`), so
  nothing here is auto-formatted and lint rules like `no-window` do not apply.
- The sidebar is built by `backends/api/apps.ts` from these markers. When an app
  is missing from the sidebar, the marker is the suspect, not the shell.
- `_other/` is non-shipping material. Scratch work is never a deliverable.

Do not introduce vt5 vocabulary: `slug`, `group:`/`scope:` fields, `_page.yaml`,
`_apps_group.yaml`, `display.*`, `runs.*`, `timestamps.*`, or `app.*` nesting.
Finding one is a bug to fix, and it means the marker is not being read at all.

## Inspect first

1. Read `AGENTS.md`, `_other/AGENTS/assembly-markers.md`, and any app-local
   `README.md`.
2. Read the app's `_app.yaml`, entry file, scripts, styles, data files, and
   `git status` for the app.
3. Confirm where the app currently lands by running discovery and finding it,
   rather than reasoning about the tree (see **Validate**).
4. Search for every path that will move before editing anything, including
   relative `fetch()` calls, `import` specifiers, and `<link>`/`<script>` `src`
   attributes.
5. Note the enclosing root and its `headings` list — a `heading` id the root
   does not declare renders ungrouped rather than failing loudly.

Do not assume every HTML, CSS, or JS file is a frontend file. Classify from
imports and from what the entry file actually loads.

## Organize the app

Target shape, applied only to files that actually exist:

```text
assembly/<Root>/<section...>/<app>/
├── _app.yaml
├── index.html          # or versioned frontends, below
├── app.js
├── styles.css
├── data/               # checked-in yaml/json/csv the app only reads
└── docs/               # notes, TODOs, design records
```

Keep filenames unless asked to rename. After every move, update `_app.yaml`
(`entry`, `children`, `frontends`), every in-app reference, and any document
that names the path.

Walking down from the root marker, every navigational ancestor needs a
`_section.yaml` copied from `assembly/_templates/_section.yaml`, using
`kind: section` at top level and `kind: group` when nested. An app placed
directly under a root with no section between renders in v3 but **not** in v1,
whose `buildTree` drops apps with an empty organization chain, so give every app
at least one section.

For versioned frontends, put each version in its own directory and declare them;
`default` wins over `entry` when both exist:

```yaml
entry: index.html
frontends:
  versions: [v1/index.html, v2/index.html]
  default: v2/index.html
```

Keep the older version working rather than leaving a broken `v1/`. Assets shared
by several apps belong in `frontends/shared/`, never copied per app.

## Bring `_app.yaml` to schema 5

Copy anything missing from `assembly/_templates/_app.yaml`, which documents
every field inline. A complete marker:

```yaml
kind: app
schema_version: 5

id: main-1-hearth-week-blocks # stable, unique; the app is dropped without it
name: Hearth Week Blocks
description: A visual weekly hearth-block planning tool.
order: 3
state: stable # stable | beta | alpha | experimental | deprecated | retired
tags: [personal, family, schedule]

entry: index.html
children: [app.js, block-form.js, kv-store.js, data.yaml, styles.css]

runtime: static # static | deno | node | python | go
surface: both # both | desktop | mobile
locality: anywhere # anywhere | local-only

api:
  version: v1
  routes: ["/api/admin/kv"]

storage:
  - kind: deno-kv # localstorage | indexeddb | deno-kv | sql
    name: hearth-week-blocks/doc
    tables: ["hearth-week-blocks"]
    scoped_by_user: false

icon: "lucide:calendar-days"
color: "#3e8e7e"
hidden: false
aliases: []
created_at: "2026-07-19T00:00:00Z"
updated_at: "2026-08-03T00:00:00Z"
```

Rules that bite:

- `id` must be unique across the repository and should read from its position
  (`main-2-link-viewer`). **Changing an id breaks saved links and stored sidebar
  state** — put the old id in `aliases` whenever you rename one.
- `storage` is a **list of records**, not a list of strings.
  `storage: [deno-kv]` parses into junk; `[]` is correct when the app stores
  nothing.
- `routes` lists the API paths this app actually calls. An app talking to
  `/api/admin/kv` with `routes: []` is a marker lying about its dependencies.
- Timestamps are RFC 3339 **UTC** (`2026-08-03T00:00:00Z`), not vt5's local
  `YYYY-MM-DDTHH:MM`. Update `updated_at` when you touch the app.
- `locality` may only narrow. Writing `anywhere` under a `local-only` ancestor
  changes nothing — the ancestor wins.
- `order` uses a numeric-aware compare with ties broken by `name`. Leave gaps.
- `state: retired` is not cosmetic: paths under a retired app answer 410 Gone.
  Use `hidden: true` when the app should keep serving but leave the sidebar.
- `icon` is an Iconify name and the set prefix matters: `mdi:layout-grid` does
  not exist (that icon is `lucide:layout-grid`), and a wrong name renders as
  nothing at all. Confirm the icon appears rather than trusting the string.

## Bring the app inside the Content Security Policy

`backends/auth/gate.ts` sets one CSP for every served page, apps under
`assembly/` included. Standardizing means making the app comply:

- **Scripts** may load from `'self'` and `https://esm.sh` only. A `<script>` on
  cdnjs, jsdelivr, or unpkg is blocked and the app silently loses that feature.
  Use the esm.sh module form, and remember an ES module does not set the UMD
  global the old bundle did:

  ```html
  <script type="module" src="https://esm.sh/@iconify/iconify@3.1.1"></script>
  ```

  When existing code probes a global, import the module and publish it once:
  `globalThis.Masonry = Masonry`.
- **Images** come from `'self'`, `data:`, and the hosts named in the policy.
  Prefer a same-origin or `data:` asset; adding a host is a backend change and
  needs a reason.
- **Inline `<script>` is blocked** — there is no `'unsafe-inline'` for scripts.
  Move it into a file. Inline `style` attributes are fine.
- After changing an app's scripts, open it and read the console. A CSP violation
  is a console error, never a visible failure.

## Split the code

An app whose single `app.js` has grown past a few hundred lines usually has a
seam worth cutting on, and the seams repeat across vt6 apps:

- **Persistence** — everything that talks to `/api/admin/kv`, in its own module
  exposing intent (`loadDoc`, `saveDoc`), so the rest of the app never touches
  fetch, versionstamps, or retry logic.
- **A dialog or panel** with its own fields and validation.
- **Config and constants** the app reads but does not compute.

Split by responsibility, not by line count, and update `children` afterwards.
Prefer a KV-backed store over `localStorage` when the data should survive a
different browser, and declare whichever you use in `storage`.

## Validate

`assembly/` has no formatter and no test of its own, so verification is by
discovery and by opening the app.

1. Run the real discovery against the tree and confirm the app's id, path, and
   organization chain. `@std/*` will not resolve from the sandbox, so use the
   shim described in `AGENTS.md`:

   ```sh
   # /tmp/shim/deno.json — { "imports": { "@std/yaml": "/tmp/shim/yaml.ts" } }
   # yaml.ts re-exports a real parser: npm install js-yaml
   deno run --config /tmp/shim/deno.json --no-lock -A discover.ts
   ```

   Assert on `id`, `path`, `routes`, `storage`, and the `organization` chain.
2. `./test.sh` — the suite entry point, not `deno task ci`. It mirrors output to
   `.test-output/last-run.log`; hand that file over after a failure instead of
   re-running. `--quick` skips the static checks.
3. `just browser`, then find the app in the sidebar under its root, open it, and
   watch the console for CSP violations, 404s on moved files, and module errors.
4. Exercise the app's storage: write something, reload, confirm it came back,
   and check the entry through the KV Explorer app when it uses KV.
5. Search for stale paths: `grep -rn "<old-path>" assembly/<app> _other`.
6. Confirm no id collides and every renamed id is carried in `aliases`:
   `grep -rn "^id:" assembly | sed 's/.*id: //' | sort | uniq -d`.
7. `git diff --check`, then inspect the focused diff without changing staging.

Report the new layout, marker changes, CSP or dependency changes, and the checks
you ran. Do not commit unless asked; when asked, make one commit for the one
app.

## Rules

- One app per invocation. Stop and ask rather than standardizing extras.
- Exactly one marker per directory.
- Do not change behavior, API routes, or stored data while standardizing.
- Never edit `CLAUDE.md` directly — it is a symlink to `AGENTS.md`.
- Renaming an id or a directory is a breaking change; carry `aliases`.
