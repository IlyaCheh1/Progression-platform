---
name: root-cause-debugging
description: Diagnose and fix bugs, incidents, flaky tests, performance regressions, and unexpected behavior using evidence-first root cause analysis.
---
# Root-cause debugging

1. Capture the exact symptom, expected behavior, environment, logs, stack trace, and reproduction steps.
2. Reproduce the problem or explain precisely why reproduction is blocked.
3. Trace the data/control flow from symptom to the earliest incorrect state.
4. Form ranked hypotheses and test them with the smallest targeted experiments.
5. Distinguish root cause from downstream symptoms.
6. Add a regression test that fails before the fix whenever practical.
7. Implement the minimal fix consistent with system invariants.
8. Re-run the regression test and broader relevant checks.
9. Report root cause, evidence, fix, verification, and any remaining uncertainty.
