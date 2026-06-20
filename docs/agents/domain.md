# Domain Docs

How the engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain glossary, core entities, invariants
- **`docs/adr/`** — architectural decisions that must not be silently contradicted
- **`docs/03-architettura-poc.md`** — authoritative POC stack and schema
- **`docs/PRD.md`** — product requirements, user stories, out-of-scope list

If any of these files don't exist, proceed silently.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/
│   ├── adr/
│   ├── agents/
│   ├── PRD.md
│   └── 01-06-*.md   ← architecture and estimates docs
└── src/
    ├── frontend/    ← React 19 + TypeScript + Vite 6
    └── backend/     ← ASP.NET Core 10 C#
```

## Use the glossary's vocabulary

When naming domain concepts in issues, refactors, or test names, use terms as defined in `CONTEXT.md`.
Core terms: **User**, **Profile** (3 pillars: Professional / Agentic / Human), **Match**, **WorkMatch**, **Swipe**, **Group**, **AKR Entry**, **Discovery Feed**, **Office Map**.

Do not drift to synonyms the glossary avoids (e.g. don't say "connection" when the glossary says "Match").

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly:
> _Contradicts ADR-XXXX — but worth reopening because…_
