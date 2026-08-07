# The task runner

Every doc in this repo writes repo commands as `<runner> run <task>`. This file
says what `<runner>` currently is. That indirection exists for one reason: the
runner is expected to change, and when it does the change should be a handful of
known edits rather than a repo-wide find-and-replace through prose.

## Today

**`<runner>` is `vp`** — [vite-plus](https://www.npmjs.com/package/vite-plus),
pinned in `devDependencies`. So `<runner> run skills:check` means:

```bash
vp run skills:check
```

`vp run <task>` runs the `<task>` entry in `package.json` `scripts`. Anywhere
`vp` is not installed, `npm run <task>` (or `pnpm run <task>`) does the same
thing — the scripts themselves are plain `node`/`bash` invocations and depend on
nothing vite-plus provides.

`vp` also supplies `vp fmt`, `vp lint`, and `vp check`, which have **no**
`package.json` equivalent. Those three are the only runner-specific commands in
the repo; everything else routes through `scripts`.

## First run in a fresh clone

```bash
pnpm install          # devEngines pins pnpm 11.20.0; it self-downloads
vp run choose         # or: npm run choose
```

Nothing works before the install — the scripts import `@inquirer/prompts`,
`picocolors`, and `yaml`. An agent adapting this template should treat the
install as step zero and not conclude the tooling is broken.

## Swapping to bun or deno

The runner name appears in exactly four kinds of place. Change these and the
swap is done:

| Where | What to change |
| --- | --- |
| This file | The **Today** section — name the new runner and its equivalents |
| `package.json` `scripts` | The interpreter in each entry (`node X.ts` → `bun X.ts` / `deno run -A X.ts`) |
| `_other/scripts/*/[tool].ts` | The `RUNNER` constant near the top of each CLI, used only in help text |
| `package.json` `devEngines` / `devDependencies` | Drop `vite-plus`, declare the new toolchain |

Prose in `AGENTS.md`, `_other/README.md`, and the script `docs/README.md` files
says `<runner>` and needs no edit. That is the point of the placeholder — if you
find yourself editing a sentence to swap runners, the sentence was written
wrong.

Two runner-specific notes for whoever does the swap:

- **bun** and **deno** both execute TypeScript directly, so the `.ts` entry
  points need no build step — same as today. Deno needs explicit permissions
  (`-A`, or narrower: `--allow-read --allow-write --allow-env`).
- `vp fmt` / `vp lint` / `vp check` have direct counterparts (`deno fmt`,
  `deno lint`, `deno check`; `bun` defers to `prettier`/`eslint`/`tsc`). Update
  the verification step in [`../README.md`](../README.md) when they change.

## Rule

No document outside this file names a runner. If you are writing a doc and want
to type `vp`, type `<runner>` instead and let this file answer the question.
