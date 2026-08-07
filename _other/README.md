# `_other/` — purpose, and how to adapt it

Read this first when this template has just been copied into a new repo. It
explains what `_other/` is for and gives an agent a procedure for reshaping it
to fit the host project.

Deeper notes: [`AGENTS/OTHER.md`](AGENTS/OTHER.md) (conventions and the folder
table), [`AGENTS/SKILLS.md`](AGENTS/SKILLS.md) (skill library),
[`AGENTS/GIT.md`](AGENTS/GIT.md) (history records and commit formats),
[`AGENTS/RUNNER.md`](AGENTS/RUNNER.md) (what `<runner>` means).

## Purpose

`_other/` is the single home for everything that is **about** the repo but is
never **shipped by** it: agent context, design notes, release write-ups, git
history records, repo tooling, and the skill library.

Three rules define it:

1. Nothing under `_other/` is imported by application code.
2. Deleting the entire folder must never break a build.
3. Anything scratch, meta, or narrative goes here — so an agent can be told
   once where to put things and land in the same place every session.

Secrets never live here; they belong in `.env`, which is gitignored.

The folder-by-folder table lives in [`AGENTS/OTHER.md`](AGENTS/OTHER.md) and is
not repeated here — one table, one place to keep current.

## Adapting to a new repo

Most of steps 2 and 3 are automated. `<runner> run template:reset` previews
exactly what the template considers sample content and writes nothing; the
prose below explains the parts that need judgement.

### 0. Install first

```bash
pnpm install
```

Nothing works before this — the scripts import `@inquirer/prompts`,
`picocolors`, and `yaml`. A failure here is a missing install, not broken
tooling. `<runner>` is `vp` (vite-plus); `npm run <task>` works identically for
everything except `vp fmt` / `vp lint` / `vp check`. See
[`AGENTS/RUNNER.md`](AGENTS/RUNNER.md), which is also where you go to swap the
runner for bun or deno.

### 1. Survey before touching anything

```sh
find _other -maxdepth 2 -not -path '*/node_modules/*'
grep -rn "_other/" --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.json' . --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=_other
```

The second command is the rule-1 check: any *shipping* file that reaches into
`_other/` is a violation. Such a file must be moved out, not deleted in place.

### 2. Strip the sample content

```sh
<runner> run template:reset          # preview
<runner> run template:reset:apply    # do it
```

This clears the placeholder git history, the worked branch record, and the
sample skills, while keeping every file's structure and explanation. What counts
as sample is declared in `_other/scripts/template-reset/data/template.yaml` and
marked in-file with `<!-- template:sample -->`, so nothing is guessed. Symlinks
to deleted skills are cleaned up; their `skills.yaml` entries are named for you
to remove in step 3. The run ends by listing the follow-ups it deliberately will
not attempt.

Anything the tool reports as carrying a sample marker but not registered in
`template.yaml` should be fixed, not ignored — that is the one way this can
drift.

### 3. Prune skills

The library under `_other/skills/` is flat. Grouping is metadata, so edit
`_other/scripts/link-skills/data/skills.yaml` — it is the source of truth, not
the symlinks. Every entry carries a one-line `description`, which is there so
this decision can be made without opening seven `SKILL.md` files.

```sh
<runner> run skills:check   # preview
<runner> run skills:all     # apply
```

Set `targets: false` to unlink a skill everywhere, or list target ids to narrow
it. Only symlinks pointing into `_other/skills` are ever removed, so a real file
in the way is never clobbered. Never edit a skill through its symlink in
`.claude/`, `.cursor/`, or `.agents/` — edit the original and relink.

### 4. Reconcile with the host project

If the repo being copied into already has its own `docs/`, `scripts/`, or
similar:

- **Prefer the host's location for anything that ships or is load-bearing.**
  Build scripts stay where the build expects them.
- **Move narrative and meta material into `_other/`** — design docs, ADRs,
  agent notes, release write-ups.
- If a host folder is genuinely both, split it rather than symlinking.

### 5. Add or remove a top-level folder

To add one, in a single commit: create the folder with a real file (or
`.gitkeep`), add a row to the table in [`AGENTS/OTHER.md`](AGENTS/OTHER.md), and
mention it in the root `AGENTS.md` if an agent needs to know about it
unprompted.

To remove one: delete it, remove the row, and re-run the grep from step 1 to
catch dangling links.

New scripts follow the folder-per-tool shape — entry point owns all rendering,
`lib/` returns plain data, `data/` holds config, `docs/README.md` explains it:

```text
_other/scripts/<tool>/
├── <tool>.ts
├── lib/
├── data/
└── docs/README.md
```

### 6. Update the surfaces that point here

Which of these you *edit* versus *create* depends on how the template arrived:

**Copied wholesale** (this repo cloned and renamed) — the files exist; edit
them:

- Root `AGENTS.md` — layout table, further-reading list, template checklist.
  `CLAUDE.md` is a symlink to it; edit `AGENTS.md`, never the symlink.
- `README.md` and `package.json` `name` — rename off the template.
- `_other/scripts/vp-run-chooser/tasks.yaml` — describe the real scripts. The
  placeholders in `package.json` exit 1 on purpose until replaced. Delete the
  `template` group once the repo is adapted.
- `.vscode/sessions.json` — point at the new project's terminal setup.

**Dropped into an existing repo** (`_other/` copied in alone) — several of
these will not exist. Do not skip them; create them:

- No root `AGENTS.md`? Create one, with a layout table for *this* repo and a
  **Further reading** list linking into `_other/AGENTS/`. Use
  [`AGENTS/templates/further-reading-note.md`](AGENTS/templates/further-reading-note.md)
  for the notes themselves. Symlink `CLAUDE.md` to it.
- Host `package.json` already has `scripts`? Merge the `skills:*`, `choose`,
  and `template:*` entries in rather than replacing the block.
- Host has no `.agents/`, `.claude/`, or `.cursor/`? `link-skills` creates the
  target directories; drop the ones you do not want from `targets:` in
  `skills.yaml` instead of leaving them empty.
- No `.vscode/sessions.json`? Skip it — it is a convenience, not a convention.

### 7. Verify

```sh
<runner> run skills:check      # symlinks match skills.yaml, no drift reported
<runner> run template:reset    # should report nothing left to strip
```

Then the rule-2 check, which is the one that actually matters:

```sh
grep -rn "_other/" --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.json' . --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir=_other
```

Any hit outside `package.json` scripts means shipping code depends on `_other/`.
Fix it before moving on.

Toolchain checks are runner-specific and only apply once the host repo has wired
them:

```sh
vp fmt && vp lint && vp check    # today's runner; see AGENTS/RUNNER.md
```

### 8. Write the adaptation record

Finish by writing what you did to `_other/git/checkpoints.md` — one entry, dated,
covering: which folders were kept, removed, or renamed; which skills survived
and why; anything about the host repo that forced a departure from this
procedure.

This is not bookkeeping. The next agent to open this repo cold reads
`_other/git/checkpoints.md` and will otherwise re-derive every decision made
here, or quietly contradict one.
