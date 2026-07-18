---
name: feature-planning
description: Plan a complex feature or refactor before implementation. Use when work touches multiple modules, contracts, data, infrastructure, or has unclear requirements.
---
# Feature planning

1. Restate the goal, users, acceptance criteria, constraints, and non-goals.
2. Explore the repository and identify canonical implementations, boundaries, tests, schemas, and operational conventions.
3. Identify open decisions and ask only questions that materially change the design.
4. Propose the smallest viable architecture and explain alternatives only when they are credible.
5. Produce an ordered plan containing:
   - files/modules to change;
   - contracts and data model changes;
   - migration and compatibility strategy;
   - security and privacy considerations;
   - observability and failure handling;
   - test strategy;
   - rollout and rollback;
   - risks and unresolved assumptions.
6. Do not edit implementation files until the plan is reviewable and internally consistent.
