# Hello Work — Agent Workflow Guidelines

> Team Red Hackathon 2026 | Stack: React 19 + Vite 6 · ASP.NET Core 10 C# · Azure SQL Database · Azure Container Apps

## Project Context

Hello Work is a corporate networking platform. Core entities: **User** (3-pillar profile), **Match** (bilateral WorkMatch), **Group** (hybrid suggested), **AKR Entry** (agentic knowledge).
See `CONTEXT.md` for full domain glossary and `docs/` for architecture, PRD, and ADRs.

## Compliance Rules for Agentic Work

1. **Read CONTEXT.md first** before any code generation — domain language is strict.
2. **Architecture is in `docs/03-architettura-poc.md`** — follow the defined stack, don't improvise.
3. **DB schema is the source of truth** — `src/backend/` owns the EF Core schema; never duplicate it in docs.
4. **Auth is always Azure AD / MSAL** — never implement custom auth flows.
5. **Matching algorithm is deterministic Jaccard** (see `docs/03-architettura-poc.md` §4) — no ML in POC.
6. **Secrets go in Azure Key Vault** — never hardcode connection strings, API keys, or client secrets.
7. **Tests before shipping** — run `dotnet test` (backend) and `npm test` (frontend) before any PR.
8. **Branch ownership** — `feature/frontend` (Lorenzo), `feature/backend` (Lorenzo), `feature/infra` (Filippo), `feature/docs-demo` (PM). Never commit to another person's branch without coordination.
9. **POC scope** — see `docs/PRD.md §11 Fuori Scope` before adding any feature. When in doubt, it's out of scope for today.

## Recommended Skill Flow for Common Tasks

| Task | Skills to invoke (in order) |
|------|----------------------------|
| New feature | `grill-with-docs` → `to-prd` → `to-issues` → `implement` → `tdd` |
| Bug | `diagnosing-bugs` → fix → `tdd` |
| Architecture decision | `grill-with-docs` → `domain-modeling` → ADR in `docs/adr/` |
| Refactor | `codebase-design` → `improve-codebase-architecture` → `implement` |
| PR creation | `triage` → `to-issues` → `handoff` |
| Prototype a feature fast | `prototype` (skip TDD, flag as POC) |

> **⚡ Hackathon shortcut (today only):** skip `grill-with-docs` and go straight to `to-issues` on any `poc`-labelled issue — requirements are already in `docs/PRD.md`.

## Key Skills Reference

Skills live in `.claude/skills/`. Most useful for this project:

- **`engineering/implement`** — structured feature implementation
- **`engineering/tdd`** — test-driven development cycle
- **`engineering/prototype`** — fast POC without full rigor
- **`engineering/grill-with-docs`** — requirements interview → CONTEXT.md
- **`engineering/diagnosing-bugs`** — systematic bug hunt
- **`engineering/domain-modeling`** — domain language and entity design
- **`engineering/to-prd`** — conversation → structured PRD
- **`engineering/to-issues`** — PRD → vertical-slice issues
- **`productivity/handoff`** — clean task handoff between agents/sessions

---

## Agent skills

### Issue tracker

Issues live on GitHub (`pietrocarusoagic/hello-work`). Use `gh` CLI. PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Plus scope labels: `poc`, `future`, `backend`, `frontend`, `infra`, `enterprise-scope`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. Read `CONTEXT.md` + `docs/adr/` + `docs/03-architettura-poc.md` before any codebase work. See `docs/agents/domain.md`.

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

