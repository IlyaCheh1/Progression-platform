---
name: quality-gate
description: Run the final engineering quality gate after implementation or before opening a pull request.
disable-model-invocation: true
---
# Quality gate

Inspect the repository scripts and run the applicable checks in this order:

1. Formatting/check-format.
2. Lint/static analysis.
3. Type checking or compilation.
4. Targeted unit/integration tests.
5. Broader test suite appropriate to the change.
6. Production build.
7. Database migration validation when applicable.
8. Browser/E2E checks for critical UI flows.
9. Review the final diff for secrets, debug code, accidental generated files, unrelated edits, and backward compatibility.

Never invent results. Report each command as passed, failed, or not run with a reason.
