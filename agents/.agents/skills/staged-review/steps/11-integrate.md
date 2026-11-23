# Step 11: Integrate

**Applies when:** always, after step 10.

Read the findings file from disk. It's the record of the lenses, so build the list from it, not
from memory. If a step's section is missing, run that step first.

## Look at the approach fresh

Go back to the PR's goal, its requirements and its stack. If you were starting this work today,
would you take the same high-level approach: the same data model, the same split between
services, the same flow?

Raise an alternative only if the current design misses a requirement or will cost materially
more over time. Different names, or a different library that works just as well, don't count.

Then be strategic. The goal is a better result, not busy work for the author.

- **Same end result, no request.** Don't ask for changes that end in the same place. A PR that
  would have been better as two isn't worth splitting after the fact.
- **Small gain, large change, no request.** If the alternative is comparable, or only slightly
  better, and switching means a large rewrite, leave it. Mention it in one line at most.
- **Weigh the cost of switching:** how much code moves, how far into the stack it reaches, what
  has already merged, and what depends on it.
- **Urgency matters.** Something that gets harder or more harmful the longer it waits ranks above
  something that can wait.
- **A follow-up PR is fine.** If the author can make the change in a later PR, say so instead of
  asking for it in this one.

That leaves three outcomes:

- **Worth switching now.** A request. Lead with the alternative, why it's better, and what it
  replaces. Also flag any finding that needs action whichever approach the author picks and
  can't wait for the next review. Keep the rest in the findings file, because it may not apply
  after the switch.
- **Worth doing, but later.** Something to consider. Describe the alternative as follow-up work
  and when it would be worth doing, then present the full list.
- **Not worth raising.** Present the full list as usual.

## The full list

Unless the approach replaces the review, present every finding from the lenses.

1. **Apply revisions and withdrawals** first.
2. **Merge duplicates.** A problem that several lenses found becomes one finding. Name the
   lenses. Fold each cross-lens note into the finding it belongs to.
3. **Resolve conflicts.** When two fixes pull in different directions, such as dropping an index
   versus keeping it for speed, choose one and say why in one line. Rejecting a fix doesn't drop
   the problem behind it. Never present two findings that contradict each other.
4. **Group findings under a shared fix.** If moving one table resolves five constraint findings,
   list the move first and the five beneath it.
5. **List what you omit.** A finding leaves the list only for a good reason: it was withdrawn,
   it didn't survive checking, or a conflict went the other way. List each one with its reason
   in one line, so the reader can overrule it. Merged duplicates count as reported, not omitted.
6. **Label each finding a request or something to consider.**
   - **Request:** should change in this PR. It holds the PR up until it's addressed.
   - **Consider:** for the author to think about, or follow-up work. It doesn't ask for a change
     in this PR and doesn't hold it up.

   Make something a request only when leaving it costs more than fixing it now: it's hard to
   change after merge, it's urgent, or the fix is cheap. Everything else is to consider.
7. **Tag each finding by consequence** and by what the fix will cost if it waits, not by file
   type:
   - **high:** a major risk, or rework that gets costly after merge
   - **medium:** a real but contained cost
   - **low:** a small, concrete cost
   - **nit:** polish

## Present

- A plain-language summary of what the PR does, for someone who hasn't read it: what changes
  for users, what is groundwork for later PRs, and what it leaves out on purpose.
- The approach, if you raised it.
- The full list, unless the approach replaced it: requests first, then things to consider, each
  sorted from high to nit. Each finding has its label, tag, location, problem and fix. A
  plausible finding also says what would confirm it.
- Omitted findings and their reasons.
- The steps you skipped, and why.
- What you checked and found fine, where a reader would otherwise wonder.

Don't post to GitHub or change code unless asked.
