---
name: implement
description: Implement a feature or fix a bug. Use when the user wants to build something specific and has a clear spec.
---

# Implement

Implement features or fixes following the project's existing patterns and conventions.

## Process

1. Read `CONTEXT.md` (if present) to use the correct domain vocabulary
2. Understand the existing code in the area before writing new code
3. Write the minimal code that satisfies the requirement
4. Use the TDD skill if behavior is complex or risk of regression is high
5. Run existing tests to verify nothing broke
6. Refactor only after tests are green
