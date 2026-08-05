# `git2` — the light commit format

A second, deliberately smaller commit message format, sitting alongside the full
`git-commit-ascii` format documented in [`../AGENTS/GIT.md`](../AGENTS/GIT.md).

The full format — two emojis, an ASCII word-art banner, an aligned change table,
a narrative paragraph — earns its cost on commits someone will read again in six
months. Most commits are not that. Bumping a dependency, fixing a typo, renaming
a file: the banner is longer than the change. `git2` is the format for those,
so that routine work stays cheap to commit and the full format keeps meaning
"this one matters".

## The format

```text
emoji action(scope): description

optional one-line why
```

- **One emoji**, not two — the change *type*. Domain is already in the scope.
- **Action word** from the same table as the full format (`add`, `repair`,
  `reshape`, `maintain`, `document`, …), so the two formats stay greppable
  together.
- **Description** imperative, lowercase, under ~60 characters.
- **Body** is at most one line, and only when the *why* is not obvious. No
  banner, no table, no paragraph.

Everything else is unchanged: same action vocabulary, same `!` marker and
`BREAKING CHANGE:` footer for breaking changes, same rule that you never stage
files on the user's behalf.

## Examples

```text
🔧 maintain(deps): bump vite-plus to 0.2.6
```

```text
📄 document(readme): fix broken link to link-skills docs
```

```text
🐛 repair(filter): lowercase both sides of the tag compare

Strict equality made search case-sensitive.
```

```text
♻️ reshape(config): move skills.yaml parsing into lib/
```

## Which format to use

| Use the **full** format | Use **`git2`** |
| --- | --- |
| New feature or capability | Dependency bumps, lockfile churn |
| Bug fix with a non-obvious root cause | Typos, formatting, comment edits |
| Refactor that changes how something is understood | Mechanical renames and moves |
| Anything touching several areas at once | Single-file, single-purpose changes |
| Anything you would want a history record for in `_other/git/` | Anything you would not |

Two questions decide it: **would someone want the reasoning later?** and **does
the change span more than one area?** A yes to either means the full format.

When in doubt, use the full format. An over-documented commit costs a few
minutes; an under-documented one costs the next person an afternoon in
`git blame`.

## Interaction with history records

`git2` commits are still commits — they appear in `git log` and in the line
files under `_other/git/` like anything else. But because they carry no table
or narrative, their entry in a history record is just the summary row. Do not
invent a body for them retroactively; a one-line commit deserves a one-line
record.

If a `git2` commit turns out to have mattered, note the reasoning in
`_other/git/checkpoints.md` rather than rewriting the commit.

## Rules

- Never mix: one commit uses one format, whole.
- Never downgrade to `git2` to avoid writing a table. If the change warrants a
  table, it warrants the full format.
- The action vocabulary is shared. Do not invent `git2`-only action words.
