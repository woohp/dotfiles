---
name: jj
description: Use Jujutsu (jj) for version control in repos with a .jj directory, or when converting a git repo to jj. Covers non-interactive invocation, everyday workflow, parallel workspaces, and pushing PRs.
---

Use jj, not mutating git commands, when `jj root` succeeds. Colocated repos also have `.git`; read-only git commands are fine, but don't run `git commit/checkout/rebase/reset/stash` there. Written against jj 0.46 — CLI flags change between releases; confirm with `jj <cmd> --help` when unsure.

## Never block on an editor or pager

- Prefix commands with `JJ_EDITOR=false` so a forgotten message fails fast instead of hanging, and use `--no-pager` (or `JJ_PAGER=cat`).
- Always pass `-m` to `describe`, `commit`, `new`, `split`. `squash` prompts when both sides have descriptions: pass `-m` or `-u` (keep destination message).
- Never use `-i`/`--interactive`, `--tool`, `diffedit`, or `jj resolve` (all open TUIs). Select changes with path/fileset arguments instead.
- There is no `-q`; use `--quiet`.

## Model

- The working copy is a commit (`@`); its parent is `@-`. Every jj command snapshots the working tree into `@` first. No staging area.
- Consequence: any file you create in the repo gets committed, including outputs of builds/checks that aren't gitignored. Put scratch files outside the repo. Check `jj st` before describing/pushing; delete strays (or `jj restore <path>`). For generated files you must keep, add them to `.git/info/exclude` (local-only, colocated repos) then `jj file untrack <path>`.
- Prefer change IDs (`jj log` left column) over commit hashes; they survive rewrites. Descendants are rebased automatically after any rewrite.
- Immutable commits (trunk, tags, untracked remote bookmarks) can't be rewritten; don't reach for `--ignore-immutable` without asking.

## Everyday commands

- Inspect: `jj st`, `jj diff --git [-r REV]`, `jj log [-r REVSET]`, `jj show REV`, `jj evolog -p` (history of one change).
- Finish current work and start fresh: `jj commit -m "msg"` (= `describe` + `new`).
- Start on something: `jj new [REV] -m "msg"`. Amend an earlier change: `jj new REV`, edit, `jj squash` (prefer this over `jj edit REV`).
- Move changes: `jj squash PATHS` (into `@-`), `jj squash --from A --into B [PATHS]`, `jj split [-r REV] -m "first part" PATHS` (the remainder keeps the original message; `jj describe` it if needed), `jj absorb` (auto-distributes hunks into the stack).
- Rearrange: `jj rebase -r/-s/-b REV -o DEST` (destination flag is `-o/--onto`; also `-A`/`-B` to insert). `jj abandon REV`, `jj restore [--from REV] PATHS`.
- Keep the stack logical (best-effort): fold a fix into the commit it belongs to instead of adding a fixup commit — `jj absorb` for edits to lines the stack already touched, otherwise `jj squash --into REV PATHS`.
- Revset text matchers aren't substring by default: write `description(substring:foo)`.
- Conflicts don't stop operations; they're recorded in commits (`(conflict)` in log, `jj log -r 'conflicts()'`). Fix by `jj new CONFLICTED`, editing the markers in files, then `jj squash`.
- Undo: `jj undo` (repeatable), `jj redo`, or `jj op log` + `jj op restore OP`.

## Parallel work: workspaces

- Workspaces are jj's equivalent of git worktrees: extra working copies of the same repo, each with its own `@`. Every jj command snapshots the working copy it runs in, so anyone sharing a checkout (another session, an agent, or the user) also shares its `@`; separate workspaces keep that work apart.
- Use `jj workspace add ../REPO-NAME [-r REV] -m "msg"`, not `git worktree add` or worktree tools; jj doesn't see plain git worktrees. In colocated repos the workspace is also a git worktree (detached HEAD), so git/`gh` work there.
- Commits are shared across workspaces immediately (no push/fetch). Only rewrite your own stack: rewriting another workspace's `NAME@` or its ancestors makes it stale, and `jj workspace update-stale` there keeps its unsnapshotted edits in a divergent copy of the change that must be reconciled.
- Ignored files (`node_modules`, `.venv`, build caches) aren't copied. Copy what's needed with copy-on-write: `cp -a --reflink=auto` (Linux btrfs/XFS) or `cp -ac` (macOS APFS).
- Clean up with `jj workspace remove NAME` (deletes the directory and its git worktree).

## Converting a git repo (only after the user agrees)

- Run `jj git init` at the main checkout's root. Not inside a git worktree: that creates a separate jj repo; convert the main checkout and use `jj workspace add`.
- Beforehand, check what jj will bypass or flatten: git hooks (`.git/hooks`, `core.hooksPath`, `.pre-commit-config.yaml`, husky) don't run under jj, so run those checks manually; submodules and LFS (`.gitmodules`, `filter=lfs` in `.gitattributes`) are poorly supported; staged changes are merged into the working-copy commit, and untracked non-ignored files become tracked.
- Undo: `rm -rf .jj`, then `git reset` (jj stages files in git's index) and `git switch BRANCH` if HEAD is detached.

## Remotes and PRs

- `jj git fetch`, then rebase onto latest: `jj rebase -b @ -o 'trunk()'`. Clone/init: `jj git clone URL`, `jj git init` (colocates by default).
- Bookmarks are jj's branches and do not follow new commits. Move with `jj bookmark set NAME -r REV` or `jj bookmark advance`.
- Push a new PR branch: `jj git push --named NAME=REV` (or `-c REV` for an auto `push-<changeid>` name). Update it after rewriting: move the bookmark, then `jj git push -b NAME` (new bookmarks auto-track; `--allow-new` no longer exists). Push refuses empty descriptions and conflicts — fix rather than override. After pushing, `jj new` so later edits don't amend the pushed commit.
- Use `--dry-run` first when pushing anything unusual. Push is force-with-lease by default.
- `gh` in colocated repos: git HEAD is detached, so pass `gh pr create --head NAME`. Avoid `gh pr checkout` and `gh pr merge --delete-branch` (they run local git checkouts); use `jj new NAME@origin` and plain `gh pr merge --rebase` or `--squash`.
- After a PR is merged: `jj git fetch`. If the remote branch was deleted, fetch abandons the PR commits; otherwise run `jj abandon 'trunk()..NAME' && jj git push --deleted` (deleting only the bookmark leaves the commits visible). Then `jj new 'trunk()'`.
