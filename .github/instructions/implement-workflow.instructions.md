---
applyTo: "**"
---

# Workflow: How to implement a feature

When you're asked to implement a feature or work on an issue, follow this flow:

## Step 1 — Pick your issue

```bash
gh issue list --label "poc" --assignee @me --state open
gh issue view <number>
```

Read the full issue body before writing a single line of code.

## Step 2 — Plan vertical slices

Break the work into **tracer bullet slices** — each one cuts through ALL layers (DB schema → API endpoint → UI component → test) and is demoable on its own.

Good slice: "User can log in and see their pre-populated profile"
Bad slice: "Write all controllers" or "Write all React components"

Ask yourself: *can I demo this slice alone?* If no, split it further.

## Step 3 — TDD loop (one slice at a time)

For each slice:

```
RED:   Write ONE test that describes the behavior → it fails
GREEN: Write the minimal code to make it pass
REFACTOR: Clean up, no new behavior
```

Rules:
- Test behavior through public interfaces (HTTP endpoints, React components), not internals
- One test at a time — don't write all tests upfront
- Tests must survive a refactor; if renaming a function breaks a test, the test is wrong

## Step 4 — Run tests before PR

```bash
# Backend
cd src/backend && dotnet test

# Frontend  
cd src/frontend && npm test
```

Both must pass. No exceptions.

## Step 5 — Commit and PR

```bash
git add .
git commit -m "feat(<scope>): <what it does, present tense>"
git push origin feature/<your-branch>
gh pr create --title "..." --body "Closes #<issue-number>"
```

Pit reviews all PRs before merge to main.

## When in doubt about requirements

Ask your agent to create a clarification issue:
```
gh issue create --title "QUESTION: <your question>" --label "needs-info" --body "..."
```
Then ping Pit.
