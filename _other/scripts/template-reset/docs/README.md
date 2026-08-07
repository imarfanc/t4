# template-reset

Strips the sample content this template ships with, leaving the structure.

```bash
<runner> run template:reset         # preview, writes nothing
<runner> run template:reset:apply   # carry it out
```

`<runner>` is `vp` today — see [`../../../AGENTS/RUNNER.md`](../../../AGENTS/RUNNER.md).

## Why it exists

The template ships placeholder history, sample skills, and worked examples so
that a fresh clone shows the shape of each convention. Adapting the repo means
removing them — and until this tool existed that was a prose checklist in
`_other/README.md`, which meant every "is this a placeholder or real content?"
call was a judgement call made by whoever, or whatever, was reading.

The rules are deterministic, so they are code now. The prose describes the
outcome; `data/template.yaml` defines it.

## How sample content is marked

Two mechanisms, both declared in [`../data/template.yaml`](../data/template.yaml):

**`truncate`** — for files that are part structure, part sample. A
`<!-- template:sample -->` marker sits at the line where the sample begins.
Everything above is kept; the marker and everything below is replaced with the
rule's `placeholder`. So `_other/git/main.md` keeps its title and explanation
and loses its fake commits.

**`delete`** — for files and directories that are wholly sample, like a worked
branch record or a demo skill.

Anything not listed is kept. That is the default on purpose: the tool should
never surprise you by removing something you wrote.

## Drift detection

Every run scans the repo for markdown carrying `<!-- template:sample -->` that
no rule covers, and reports it. Sample content added later but never registered
is the one failure mode this design has, so it is checked on every invocation
rather than left to be noticed.

Deleting a sample skill breaks two things. The tool fixes one and reports the
other:

- **Its symlinks** in `.agents/`, `.claude/`, `.cursor/` are removed, because
  whoever breaks a link should mend it — otherwise every fresh adaptation opens
  with drift warnings the person did not cause. Only symlinks pointing into
  `_other/skills` are touched.
- **Its `skills.yaml` entry** is printed, not deleted. Rewriting someone's
  config mechanically is worse than naming the two lines. `link-skills` reports
  the same drift under `skills:check` until it is gone.

## Layout

```text
_other/scripts/template-reset/
├── template-reset.ts   # CLI — owns all rendering and prompting
├── lib/reset.ts        # config parsing, planning, applying; returns plain data
├── data/template.yaml  # what counts as sample content
└── docs/README.md
```

`planReset` computes the whole plan without touching disk, which is what makes
the dry run trustworthy — preview and apply run the same code path.

Table rendering and `findRepoRoot` are borrowed from `../link-skills/lib/`
rather than duplicated, so the two tools stay visually consistent.

## Adding a rule

1. Put `<!-- template:sample -->` in the file where the sample content starts
   (skip this for whole-file samples).
2. Add the path to `truncate` with a `placeholder`, or to `delete` with a `why`.
3. Run `<runner> run template:reset` and check the preview.

A file listed under `truncate` with no marker reports as `· clean` rather than
failing — harmless, but usually means the marker was lost in an edit.
