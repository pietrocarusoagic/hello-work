# Contributing to Hello Work

> ⚠️ **4 persone + agenti lavorano su questo repo contemporaneamente.**  
> **Regola d'oro: sempre `git pull --rebase origin main` prima di qualsiasi modifica.**

---

## Branch Convention

```
<type>/<short-description>
```

| Tipo | Quando usarlo | Esempio |
|------|---------------|---------|
| `feature/` | Nuova funzionalità | `feature/workmatch-swipe-ui` |
| `fix/` | Bug fix | `fix/matching-score-edge-case` |
| `chore/` | Setup, config, deps | `chore/setup-bicep-infra` |
| `docs/` | Solo documentazione | `docs/update-architecture-diagram` |
| `refactor/` | Refactoring senza cambi funzionali | `refactor/profile-api-clean` |

**Mai committare direttamente su `main`** — è protetto e richiede PR + 1 review.

---

## Commit Convention (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body]

Co-authored-by: ...
```

| Tipo | Significato |
|------|-------------|
| `feat` | Nuova feature |
| `fix` | Bug fix |
| `chore` | Manutenzione, config |
| `docs` | Solo documentazione |
| `refactor` | Refactoring |
| `test` | Test aggiunti/modificati |
| `style` | Formattazione, nessuna logica |

**Esempi validi:**
```
feat(workmatch): add bilateral match detection logic
fix(auth): handle AAD token expiry on refresh
docs(api): add OpenAPI annotations to /profiles endpoint
chore(infra): add Bicep parameter file for staging
```

**Scope consigliati:** `auth`, `profile`, `matching`, `workmatch`, `groups`, `map`, `akr`, `infra`, `frontend`, `api`

---

## Workflow PR

```
git pull --rebase origin main   # SEMPRE prima di iniziare
git checkout -b feature/my-thing
# ... lavora ...
git add . && git commit -m "feat(scope): descrizione"
git push origin feature/my-thing
gh pr create --title "feat(scope): descrizione" --body "..."
```

- PRs vanno su `main`
- Richiede 1 review prima del merge
- Preferire **squash merge** per mantenere la history pulita
- Risolvere i conflitti **nel proprio branch**, non in main

---

## Gestione Conflitti (4 agenti in parallelo)

1. `git fetch origin && git rebase origin/main` — aggiorna il tuo branch
2. Risolvi i conflitti nel tuo branch
3. `git rebase --continue`
4. `git push --force-with-lease origin <your-branch>` *(mai `--force` senza `-with-lease`)*

---

## Aree di ownership (per minimizzare conflitti)

| Area | Directory | Owner suggerito |
|------|-----------|-----------------|
| Frontend UI | `src/frontend/` | Frontend agent |
| Backend API | `src/backend/` | Backend agent |
| Infrastructure | `infra/` | DevOps agent |
| Documentation | `docs/` | All (coordinate!) |
| Presentation | `presentation/` | All |


## Process

This project follows the Dream Team Delivery Process. Before implementing any 
non-atomic feature, verify that a spec/PRD exists in `docs/`. If not, open an issue
and request one. See `.github/copilot-instructions.md` for details.
