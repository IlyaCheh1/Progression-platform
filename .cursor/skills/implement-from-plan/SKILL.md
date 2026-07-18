---
name: implement-from-plan
description: Implement an approved technical plan in small verified steps while preserving repository conventions and compatibility.
---
# Implement from plan

1. Read the approved plan and verify it still matches the current repository state.
2. Create a short execution checklist ordered by dependency and risk.
3. Implement one coherent slice at a time.
4. After each slice, run the narrowest relevant formatter, typecheck, test, or build command.
5. Keep public contracts backward compatible unless the plan explicitly approves a break.
6. Add migrations, observability, documentation, and tests in the same change as the behavior they support.
7. Stop and report when evidence contradicts the plan; update the plan rather than improvising a different architecture silently.
8. At the end run the `quality-gate` skill and request independent verification.
