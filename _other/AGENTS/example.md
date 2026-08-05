# example — a further-reading note

> **Sample.** This file exists to show the shape of an `_other/AGENTS/` note.
> Replace it with a real one, or delete it.

`AGENTS.md` at the repo root stays short on purpose: an agent reads it in full
at the start of every session, so it holds only what is true repo-wide. Anything
deeper — one subsystem's rules, one convention's edge cases, one migration's
history — lives here and is linked from **Further reading**.

## What makes a good note

Explain the **rule and its reasoning**, not the code. An agent can read the code;
what it cannot recover is why the code is shaped that way, or which of two
plausible approaches this repo already chose.

State where a convention is implemented, so the note can be checked against
reality:

> Implemented in `frontends/v1/app.ts` (`groupByHeading`). Remember to rebuild
> after changing it — the server serves `dist/app.js`.

Prefer one source of truth. If membership in a group lives in each folder rather
than in a central list, say so — and say what happens when a folder names a
group that does not exist (rendered ungrouped, never hidden). Failure modes are
the most valuable thing a note can carry, because they are what an agent will
otherwise rediscover by breaking something.

## Conventions for these files

- One topic per file, named after the topic.
- Link it from **Further reading** in `AGENTS.md`, with a one-line description.
- Keep it current. A stale note is worse than a missing one — an agent will
  trust it.
