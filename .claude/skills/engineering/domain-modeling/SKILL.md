---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology, record an architectural decision, or when another skill needs to maintain the domain model.
---

# Domain Modeling

Actively build and sharpen the project's domain model. Challenge terms, stress-test with scenarios, and write the glossary and decisions down the moment they crystallise.

## File structure

```
/
├── CONTEXT.md          ← ubiquitous language glossary
└── docs/adr/           ← architectural decisions
    ├── 0001-...md
    └── 0002-...md
```

## During sessions

- **Challenge against the glossary** — when the user uses a term conflicting with CONTEXT.md, call it out
- **Sharpen fuzzy language** — when the user uses vague terms, propose a precise canonical term
- **Update CONTEXT.md inline** — when a term is resolved, update immediately
- **Offer ADRs sparingly** — only when: hard to reverse + surprising without context + result of real trade-off

`CONTEXT.md` is a **glossary only** — no implementation details, no specs, no scratch pad.
