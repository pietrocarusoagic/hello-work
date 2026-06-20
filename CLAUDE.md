# Hello Work — Agent Workflow Guidelines

> AGIC Hackathon 2026 | Stack: Next.js 14 · FastAPI · Azure PostgreSQL · Azure Container Apps

## Project Context

Hello Work is a corporate networking platform. Core entities: **User** (3-pillar profile), **Match** (bilateral WorkMatch), **Group** (hybrid suggested), **AKR Entry** (agentic knowledge).
See `CONTEXT.md` for full domain glossary and `docs/` for architecture, PRD, and ADRs.

## Compliance Rules for Agentic Work

1. **Read CONTEXT.md first** before any code generation — domain language is strict.
2. **Architecture is in `docs/03-architettura-poc.md`** — follow the defined stack, don't improvise.
3. **DB schema is the source of truth** — `src/backend/models/` owns the schema; never duplicate it in docs.
4. **Auth is always Azure AD / MSAL** — never implement custom auth flows.
5. **Matching algorithm is deterministic Jaccard** (see `docs/03-architettura-poc.md` §4) — no ML in POC.
6. **Secrets go in Azure Key Vault** — never hardcode connection strings, API keys, or client secrets.
7. **Tests before shipping** — run `pytest` (backend) and `npm test` (frontend) before any PR.

## Recommended Skill Flow for Common Tasks

| Task | Skills to invoke (in order) |
|------|----------------------------|
| New feature | `grill-with-docs` → `to-prd` → `implement` → `tdd` |
| Bug | `diagnosing-bugs` → fix → `tdd` |
| Architecture decision | `grill-with-docs` → `domain-modeling` → ADR in `docs/adr/` |
| Refactor | `codebase-design` → `improve-codebase-architecture` → `implement` |
| PR creation | `triage` → `to-issues` → `handoff` |
| Prototype a feature fast | `prototype` (skip TDD, flag as POC) |

## Key Skills Reference

Skills live in `.claude/skills/`. Most useful for this project:

- **`engineering/implement`** — structured feature implementation
- **`engineering/tdd`** — test-driven development cycle
- **`engineering/prototype`** — fast POC without full rigor
- **`engineering/grill-with-docs`** — requirements interview → CONTEXT.md
- **`engineering/diagnosing-bugs`** — systematic bug hunt
- **`engineering/domain-modeling`** — domain language and entity design
- **`engineering/to-prd`** — conversation → structured PRD
- **`productivity/handoff`** — clean task handoff between agents/sessions

---

## Skills Organization (from mattpocock/skills)
Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/`, `productivity/`, or `misc/` must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`. Skills in `personal/`, `in-progress/`, and `deprecated/` must not appear in either.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. Bucket `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true`, reachable only by the human) or model-invoked (model- or user-reachable). For the full definitions, description conventions, and why a user-invoked skill can invoke model-invoked skills but never another user-invoked one, see [docs/invocation.md](./docs/invocation.md).

