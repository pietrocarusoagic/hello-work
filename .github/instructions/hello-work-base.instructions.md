---
applyTo: "**"
---

# Hello Work — Agent Workflow (auto-loaded by Copilot CLI)

You are working on the **Hello Work POC** — a corporate networking platform built by Team Red.

## Before writing any code

1. Read `CONTEXT.md` — domain language is strict. Use its vocabulary in issue titles, variable names, test names.
2. Read `docs/03-architettura-poc.md` — authoritative POC stack and DB schema.
3. Check your assigned issues: `gh issue list --label "poc" --assignee @me`

## Stack (do not deviate)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind + shadcn/ui |
| Backend | ASP.NET Core 10 C# + EF Core |
| Database | Azure SQL Database (Serverless) |
| Auth | Azure AD / Entra ID + MSAL.js |
| Infra | Azure Container Apps + Bicep |

## Branch rules

- **Lorenzo**: work on `feature/frontend` and `feature/backend` only
- **Filippo**: work on `feature/infra` only
- Never commit to another person's branch without coordination
- One PR per feature slice → Pit reviews

## Guardrails

- Auth = always Azure AD / MSAL. Never implement custom auth.
- Matching = deterministic Jaccard only (no ML, no embeddings in POC).
- Secrets = Azure Key Vault only. Never hardcode connection strings or API keys.
- POC scope = if a feature is in `docs/PRD.md §11 Fuori Scope`, don't build it today.
- Run `dotnet test` (backend) and `npm test` (frontend) before every PR.
