---
name: github-operations
description: Use the GitHub CLI for pull requests, issues, releases, GitHub Actions, repository management, and other GitHub-specific operations.
---

# Github CLI

Use the `gh` CLI for tasks that interact with GitHub, such as:

- Creating, viewing, or merging pull requests
- Creating or listing issues
- Creating releases
- Running or inspecting GitHub Actions workflows
- Managing GitHub repositories through the GitHub API

Use `git` instead when the task only requires local version-control
operations, such as committing, branching, merging, rebasing, or pushing.

Assume `gh` is usually installed. If it is unavailable, ask the user to
install and authenticate it.

For posting PR reviews with inline comments, use `post-gh-review --pr <number> review.json`. It resolves lines against the diff (falls back to free-form comments for lines outside the diff) and uses the current repo by default (`gh` infers it from the git remote; pass `--repo owner/repo` to override). The input JSON tolerates trailing commas and `//` comments, so don't spend tokens on strict formatting - but do spend them on the review substance.
