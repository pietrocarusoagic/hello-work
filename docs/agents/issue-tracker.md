# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues on `pietrocarusoagic/hello-work`.
Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Scope labels (always add alongside triage label)

| Label | Meaning |
|-------|---------|
| `poc` | Required for today's POC demo |
| `future` | Post-POC (v1.0 MVP or v2.0 Enterprise) |
| `enterprise-scope` | Enterprise-only features |
| `backend` | Backend work (ASP.NET Core, API, DB) |
| `frontend` | Frontend work (React SPA) |
| `infra` | Infrastructure & DevOps (Bicep, GitHub Actions) |

## When a skill says "publish to the issue tracker"

Create a GitHub issue with the appropriate triage label AND scope label(s).

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
