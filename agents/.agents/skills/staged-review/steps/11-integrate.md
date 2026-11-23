# Step 11: Integrate

**Applies when:** always, after the last lens.

Start by reading the whole findings file from disk. Build everything below from the file, not
from memory. Check that it has a section for each of steps 1 to 10. If one is missing, go back
and run that step before integrating.

## Look at the approach fresh

Step back from the diff. If you were starting this work today, knowing what the PR and its stack
are trying to do, would you take the same high-level approach: the same data model, the same
split between services, the same flow?

Hold a high bar. Different names, or a different library that works just as well, are not a
different approach. A different approach is one where the current one will cost much more over
time, or can't meet a requirement.

If you'd take a different approach, be strategic about how to raise it. The author can't always
do a large refactor.

- Weigh what switching costs now: how much code moves, how far into the stack it reaches, what
  has already merged, and what depends on it.
- **If switching is realistic now**, the approach is the review. Present only it: what you'd do
  instead, why, and what it would replace. Leave the other findings out of the output, because
  they don't matter if the approach changes, but keep them in the findings file in case the
  author keeps the approach.
- **If switching isn't realistic now**, present the approach as follow-up work, with when it
  would be worth doing, and present the full list below as usual, since this code is staying.

## The full list

Unless the approach replaces the review, present every finding from the lenses.

- **Merge duplicates.** A problem that several lenses found becomes one finding, framed the way
  that makes the strongest case. Note which lenses found it.
- **Resolve conflicts.** Lenses pull in different directions. Minimalism says drop an index and
  performance says keep it. Readability says split a function and minimalism says fewer lines.
  Existing tools says use a library and the dependency cost says don't. Decide which wins for
  this change and say why in one line. Never present two findings that contradict each other.
- **Group findings under the fix that resolves them.** If moving one table resolves five
  constraint findings, list the move first and the five beneath it.
- **Drop a finding only with a good reason**, such as it was withdrawn, it didn't survive
  checking, or a resolved conflict went the other way. List each dropped finding with its reason
  in one line, so the reader can overrule it.
- **Sort by impact**, highest first. Things that are hard to change after merge rank high:
  schema, migrations, public names, interfaces. Tag each finding high, medium, low or nit.

## Present

- A plain-language summary of what the PR does, for someone who hasn't read it: what changes
  for users, what is groundwork for later PRs, and what it leaves out on purpose.
- The approach, if you flagged it.
- The full list, unless the approach replaced it. Each finding has its tag, location, problem
  and fix.
- Dropped findings and their reasons.
- The steps you skipped, and why.
- What you checked and found fine, where a reader would otherwise wonder.

Don't post to GitHub or change code unless asked.
