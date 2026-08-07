---
name: "git-flow"
description: 'Graceful branch management — show the current git situation (branch, upstream, dirty files, ahead/behind, recent branches) and then offer concrete named options for creating a branch, opening a PR with gh, or merging one branch into another. Always merge with merge commits; never squash. Use this whenever the user mentions branching, "new branch", "cut a branch", "merge this into main", "open a PR", "ship this", "start a feature", cleaning up merged branches, or generally asks what to do next with their git state — even if they don''t name a branch or say the word "git".'
---

# git-flow

The point of this skill is that git prompts are usually vague ("merge into the target branch?") when the user is standing in a specific, knowable situation. Read the situation first, then talk about it using the real names: `feat/login` into `main`, not "current branch" into "target branch". The user should never have to hold branch names in their head.

## 1. Read the situation

Run the snapshot script below from the repo root. It prints branch, upstream, ahead/behind, dirty files, recent local branches with last-commit dates, unpushed commits, stashes, and open PRs in one pass — much better than firing off six separate git commands.

```bash
#!/usr/bin/env bash
# One-pass snapshot of the repo's git situation. Usage: bash snapshot.sh [--fetch]
set -uo pipefail
git rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git repository"; exit 1; }
[ "${1:-}" = "--fetch" ] && git fetch origin --prune --quiet 2>/dev/null

BRANCH=$(git branch --show-current)
[ -z "$BRANCH" ] && BRANCH="(detached at $(git rev-parse --short HEAD))"
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "none")

echo "== branch =="
echo "current:  $BRANCH"
echo "upstream: $UPSTREAM"
if [ "$UPSTREAM" != "none" ]; then
  read -r AHEAD BEHIND <<<"$(git rev-list --left-right --count "$BRANCH...$UPSTREAM" 2>/dev/null | awk '{print $1, $2}')"
  echo "ahead:    ${AHEAD:-0}   behind: ${BEHIND:-0}"
fi

DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||')
[ -z "$DEFAULT" ] && for c in main master; do
  git show-ref --verify --quiet "refs/heads/$c" && DEFAULT=$c && break
done
echo "default:  ${DEFAULT:-unknown}"

echo; echo "== working tree =="
if [ -z "$(git status --porcelain)" ]; then echo "clean"; else git status --porcelain | sed 's/^/  /'; fi

echo; echo "== local branches (most recent first) =="
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='  %(refname:short)|%(committerdate:relative)|%(upstream:short)|%(upstream:track)' | head -15

if [ -n "${DEFAULT:-}" ] && [ "$BRANCH" != "$DEFAULT" ]; then
  echo; echo "== commits on $BRANCH not in $DEFAULT =="
  git log --oneline "$DEFAULT..$BRANCH" 2>/dev/null | head -20 | sed 's/^/  /'
fi

echo; echo "== stashes =="
git stash list | head -5 | sed 's/^/  /' || true

if command -v gh >/dev/null 2>&1; then
  echo; echo "== open PRs =="
  gh pr list --limit 10 2>/dev/null | sed 's/^/  /' || echo "  (gh not authenticated)"
fi
```

Then show a compact summary — a handful of lines, not a wall of output:

```text
On feat/login → origin/feat/login (2 ahead, 0 behind)
3 uncommitted files: src/auth.ts, src/login.tsx, package.json
Base: main (up to date with origin/main)
Recent branches: feat/login (today), fix/session-expiry (2d), main (5d)
```

If the working tree is clean and everything is pushed, say so in one line and move on. Detail should scale with how messy things actually are.

## 2. Offer named options

Use the AskUserQuestion tool if it's available — otherwise a short numbered list. Options must contain real names, so the user is picking a concrete action rather than filling in a template:

- "Create `feat/<suggested-name>` from `main`" — suggest a branch name derived from the uncommitted changes or the user's stated intent, following whatever naming convention the existing branches use (`feat/`, `fix/`, `arfan/`, bare kebab-case — copy what's there).
- "Open a PR from `feat/login` → `main`"
- "Merge `feat/login` into `main`"
- "Switch to `fix/session-expiry`"
- "Delete merged branches: `old/thing`, `fix/typo`"

Only offer what makes sense for the current state. Don't offer "open a PR" when there are no commits ahead of the base, or "merge into main" while already on main. If the user's request already named the action clearly ("merge this into main"), skip the menu and go straight to confirming that one action with its real names.

## 3. Handle uncommitted changes

Never silently stash or discard. When the tree is dirty and the requested action needs a clean-ish tree, list the files and offer:

- **Commit them** on the current branch (propose a message from the diff)
- **Carry them over** to the new branch — `git switch -c <new>` keeps unstaged work, which is usually what someone wants when they realize mid-edit they're on the wrong branch
- **Stash** with a descriptive message (`git stash push -m "wip: login form"`) and say clearly how to get it back

Untracked-only changes are usually harmless — mention them but don't block on them.

## 4. Creating a branch

Be explicit about the base, since that's the part people get wrong. Branching from a stale `main` is the most common quiet mistake here.

```bash
git fetch origin --prune
git switch -c feat/login origin/main   # base explicitly, not implicitly
```

If the user wants to branch from the current branch rather than the default base, confirm that intent out loud — stacked branches are legitimate but rarely accidental. If the base is behind its remote, say so and offer to update it first.

## 5. Opening a PR

Push and open in one flow with `gh`, then report the resulting URL. No extra confirmation needed for these steps — just keep it moving.

```bash
git push -u origin feat/login
gh pr create --base main --head feat/login --title "..." --body "..."
```

Write the title and body from the actual commits in the range (`git log main..feat/login --oneline`), not from generic filler. A short summary plus a bulleted list of what changed is enough. Use `--draft` if the work is clearly unfinished (WIP commits, failing tests the user mentioned). Check `gh pr view` first — if a PR already exists for the branch, show it instead of creating a duplicate.

## 6. Merging

**Always use merge commits. Never squash.** Individual commit history must be preserved — do not offer squash, do not use `git merge --squash`, and do not use `gh pr merge --squash`. When the user says "merge", that means a merge commit (`--no-ff` locally, `--merge` on GitHub).

Prefer merging through the PR when one exists, so the merge is recorded on GitHub and CI is respected:

```bash
gh pr merge <n> --merge --delete-branch
```

When merging locally:

```bash
git fetch origin --prune
git switch main && git merge --no-ff feat/login
git push origin main
```

If the user explicitly wants linear history, rebase the feature branch onto the target first, then fast-forward — but still never squash.

Before merging, fetch and make sure the target is current. After a successful merge, offer the natural next steps with names: push `main`, delete `feat/login` locally and on the remote.

## 7. When things conflict

If a merge or rebase stops on conflicts, don't improvise a resolution silently. Report which files conflict, and offer to walk through them, or to abort cleanly (`git merge --abort` / `git rebase --abort`) and put things back the way they were. Losing work here is far worse than being slow.

## Guardrails

These operations can destroy work that isn't recoverable from reflog, so confirm explicitly before any of them: force-push, `reset --hard`, `clean -fd`, deleting an unmerged branch, or rewriting history on a shared branch. For everything else, act and report.
