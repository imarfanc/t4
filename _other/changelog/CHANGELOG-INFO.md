# `changelog` — release notes, twice

Every release is written up twice: once for whoever is working on the repo, and
once for whoever is using the shipped thing. They are different documents with
different readers, and collapsing them into one produces a file that serves
neither — either a marketing post nobody can debug from, or a diff summary
nobody outside the repo can read.

The root [`../../CHANGELOG.md`](../../CHANGELOG.md) is a third thing: a short
index in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) form that
links out to both. It is the file people expect to find at the top level, so it
exists, but the substance lives here.

## The three files

| File                 | Reader                | Answers                                    |
| -------------------- | --------------------- | ------------------------------------------ |
| `vX.Y-changelog.md`  | Someone in the repo   | What changed, where, and why               |
| `vX.Y-blog-post.md`  | Someone using the app | What's different, and why they'd care      |
| `../../CHANGELOG.md` | Someone scanning      | Which release, roughly what, where to read |

Both versioned files are written for the *same* release from the *same* commit
range. Neither is a summary of the other.

Templates for both live in [`templates/`](templates/) — copy, rename, fill in.

## `vX.Y-changelog.md`

The technical record. Structure, in order:

```text
# v0.3.0 — Title

**Date:** YYYY-MM-DD

One paragraph: what this release is, in plain terms.

---

## Highlights          bulleted, bolded lead-in per line
## <topic sections>    tables for anything enumerable
## Commits             hash + summary, oldest first
## Run it              the commands, including any new install step
```

What belongs here that does not belong in the post:

- **Root causes, not just fixes.** "Google Fonts subsets exclude `U+2500–257F`"
  is the useful sentence; "fixed alignment" is not.
- **File and symbol names.** `bySection()`, `.rail-scroll`, `readSourceFiles()`.
  The reader is about to go look at them.
- **Endpoint and option tables.** Anything with more than three enumerable
  members gets a table.
- **Tradeoffs taken knowingly**, in a blockquote. Shipping a full bundle instead
  of a tree-shaken core is a choice with a cost; say so, and say when to
  revisit it.
- **Errors worth remembering.** A reserved keyword that cost an hour once should
  cost nobody an hour again.

## `vX.Y-blog-post.md`

The release announcement. Structure, in order:

```text
# Title — vX.Y

_Month D, YYYY_

<the ASCII banner — copy it verbatim, it does not change>

Hook: the problem, in two or three sentences.

## What's new in vX.Y   emoji table, one row per user-visible change
## <narrative sections>  prose, second person, one idea each
## Try it                numbered steps against the live URL
## What's next           the open question, honestly stated
```

Rules that keep the posts readable:

- **Second person, present tense.** "Select any script and you'll find…"
- **No internal names.** No file paths, no function names, no CSS selectors. If
  a change can only be described in those terms, it is not a blog-post change.
- **Show the thing.** A rendering fix gets the rendering; a font change gets the
  sample. Fenced `text` blocks, not descriptions of blocks.
- **Name the caveat.** The person choosing between two options is the person who
  needs to know the limitation, so it goes in the post, not only the changelog.
- **Removals get a reason.** A dropped feature without an explanation reads as
  arbitrary churn.

The banner is a per-repo constant. Generate it once, keep it in
`templates/banner.txt`, and paste it verbatim into every post.

## Naming and versioning

- Filenames carry **minor** only: `v0.3-changelog.md`. Headings carry the full
  version: `# v0.3.0 — Source View`.
- A patch release usually needs neither file. If it needs one, it needs the
  changelog, not the post.
- The release title is a noun phrase naming the theme — *Script Runbook*,
  *Console Typography*, *Source View* — and is identical across both files and
  the root index.
- The blog post title is free to be a sentence — *Read Before You Run* — as long
  as the subtitle carries the version.

## Correcting a past release

Do not edit a shipped release's files to make them true again. They were true
when written, and the history is the point.

When a later release invalidates an earlier one, the correction is a **section
in the new release** — "here is why those were never going to work" — not a
quiet edit to the old one.

The exception is a factual error at the time of writing — a wrong hash, a
mistyped endpoint. Fix those in place.

## Building a release

1. Get the commit range: `git log --reverse --oneline <last-release>..HEAD`
2. Read the diff, not just the subjects. Commit messages describe intent;
   the diff describes what shipped.
3. Write the changelog first. It forces the details straight before the post
   has to summarize them.
4. Write the post from the changelog, then check it names nothing internal.
5. Add the entry to `../../CHANGELOG.md`, linking both files.

Step 3 before step 4 matters. Writing the post first produces a changelog that
is a padded version of the post, which is the failure mode this folder exists
to avoid.

## Rules

- Two files per release, always. A release too small for a post is too small
  for a version bump.
- The root `CHANGELOG.md` never carries reasoning the detail files don't.
  It is an index, not a third opinion.
- Never invent a commit hash or a date. Both come from `git log`.
- If `package.json` hasn't been bumped, say nothing about it here — note it to
  whoever is cutting the release instead.
