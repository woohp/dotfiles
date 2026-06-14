---
description: Autonomous model optimization loop
argument-hint: "<path-to-training-script> <run-minutes>"
---
Target: $1

Your goal is to improve the model through an autonomous experiment loop.

## Initial Setup

Before beginning:

1. Inspect the relevant code.
2. Briefly summarize your understanding of the task.
3. Ask any clarifying questions.
4. Do not begin experimentation until clarifications are resolved.

Create a branch:

```bash
git checkout -b autoresearch/<date>
```

Create:

* `results.tsv`
* `ideas.md`
* experiment log files

The first run must always be the unmodified baseline.

## Experiment Loop

Repeat indefinitely:

1. Select an idea from `ideas.md`, or create a new one.
2. Implement the change.
3. Train the model.
4. Evaluate the model.
5. Compare against the current best retained result.
6. Decide whether the change is worth keeping.
7. If kept:

   * commit the change
   * update `results.tsv`
   * update `ideas.md`
8. If rejected:

   * revert the change completely
   * update `results.tsv`
   * update `ideas.md`
9. Continue to the next experiment.

Never stop unless explicitly interrupted.

## Time Budget

Maximum training time per experiment: $2 minutes.

Before major changes, run a short training pass to estimate throughput and determine a suitable experiment budget.

If a run exceeds the time budget:

* terminate training
* evaluate the latest usable checkpoint if available
* record the result

Evaluation may exceed the training budget slightly but should remain a small fraction of training cost.

## Results Tracking

Maintain a `results.tsv` containing every experiment.

Example:

```tsv
commit metric status description
30990d4 0.024600 keep baseline timed out at 15m
ba2ec05 0.035800 keep drop per-epoch validation
98bded4 0.063300 keep train longer within budget
6dffc19 0.069300 keep reduce augmentation probability
```

Use the task's most relevant metric.

Valid statuses include:

* keep
* revert
* crash

Use concise descriptions.

Keep experiment logs so results remain reproducible and auditable.

## Evaluation Criteria

Do not optimize metrics blindly.

Consider:

* validation metric
* convergence speed
* wall-clock training speed
* inference speed
* VRAM usage
* parameter count
* implementation complexity
* maintainability

Prefer simple and robust solutions.

Examples:

* Small gain + large complexity increase → usually reject.
* Small gain + code simplification → usually keep.
* Same metric + simpler code → keep.
* Same metric + faster convergence → keep.
* Same metric + lower compute cost → keep.

Model size and VRAM are soft constraints. They may be increased when justified by meaningful improvements. However, training runs must still remain within the allotted time budget. A slower model means fewer training steps can be executed before the time limit is reached, which may reduce both model quality and experimental throughput. Consider these tradeoffs carefully when increasing model size or computational cost. All else being equal, prefer smaller and simpler solutions.

## Failure Handling

If an experiment fails due to an obvious implementation mistake:

* fix the issue
* rerun the experiment

If the underlying idea appears fundamentally flawed:

* record the failure
* mark it as `crash` or `revert`
* revert the change
* move on

## Allowed Changes

You may modify:

* model architecture
* layers
* losses
* optimizers
* schedulers
* initialization
* regularization
* augmentation policies
* training procedures
* other legitimate modeling components

You may not:

* alter evaluation semantics
* alter dataset semantics
* alter labels
* alter train/validation/test splits
* manipulate metrics
* make benchmark changes that invalidate comparisons

Performance-oriented refactors that preserve identical semantics are allowed.

Preserve the fundamental character of the original model family. Incremental or hybrid improvements are allowed. Wholesale replacement with a fundamentally different architecture is not.

## Idea Backlog

Maintain an `ideas.md` file.

For each idea record:

* description
* rationale
* estimated complexity
* status
* relevant references

Record ideas even if they are not immediately tested.

Avoid repeatedly testing failed ideas unless there is a specific reason to revisit them.

The backlog should become a record of both successful and unsuccessful research directions.

## Simplification and Cleanup

Do not assume that every retained change must remain permanently.

Periodically review previously accepted changes and ask whether they are still justified in the context of the current best model.

If a later improvement makes an earlier modification unnecessary, redundant, or disproportionately complex relative to its remaining benefit, remove the earlier change and reevaluate.

Prefer the simplest implementation that achieves the current level of performance.

A simplification that preserves performance is a successful result and may be retained even if the primary metric does not improve.

Avoid accumulating layers of historical complexity merely because each individual change was beneficial when it was originally introduced.

## Strategy Reviews

Perform a strategy review:

* at least every 10 experiments
* immediately if 5 consecutive experiments fail to improve the best retained result

Summarize:

* highest-impact changes
* recurring failures
* likely bottlenecks
* signs of tunnel vision

Use the review to:

* update `ideas.md`
* identify promising directions
* eliminate weak directions
* generate new ideas

Do not remain stuck on a saturated line of investigation.

## Autonomy

Once experimentation begins:

* do not ask whether to continue
* do not wait for approval
* do not stop after a fixed number of experiments

If progress stalls:

* reread the code
* revisit failed ideas
* inspect references and papers
* search for simplifications
* try alternative training strategies
* explore more ambitious but in-scope modifications

The objective is genuine, reproducible improvement to the model and training process, not artificially improved metrics.
