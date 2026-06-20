# Hello Work — Stima Giornate Uomo

> Documento 5 di 6 | Output richiesto mattina | Hackathon AGIC 2026

---

## 7. Stima Giornate Uomo

### Parametri di stima
- **Giornata lavorativa**: 8 ore
- **Approccio**: Agile, sprint da 2 settimane
- **Stack assunto**: React (frontend), Python FastAPI (backend), PostgreSQL + Azure infra
- **Scope**: v1.0 completa (superset del POC, baseline commerciale)

---

### Breakdown per Fase e Ruolo

| Fase | Attività | Solution Architect | Senior Consultant | Consultant | Junior | PM |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **1. Discovery & Analysis** | Workshops stakeholder, analisi requisiti, definizione scope | 2 | 2 | 1 | 0 | 3 |
| | Definizione tassonomia tag (skill, AI tools, hobby) | 0 | 2 | 2 | 0 | 1 |
| | Data model review Azure AD, GDPR assessment | 1 | 2 | 1 | 0 | 1 |
| | **Subtotale Fase 1** | **3** | **6** | **4** | **0** | **5** |
| **2. Architecture & Design** | System architecture design (frontend, backend, infra, auth) | 5 | 2 | 0 | 0 | 1 |
| | Database design (schema profilo, tag, matching, gruppi) | 2 | 3 | 1 | 0 | 0 |
| | API design (OpenAPI spec, contratti) | 2 | 3 | 2 | 0 | 0 |
| | Security architecture (Azure AD OIDC, RBAC, GDPR) | 3 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 2** | **12** | **10** | **4** | **0** | **1** |
| **3. UX / UI Design** | User flows, wireframe, prototipo Figma | 1 | 2 | 0 | 0 | 1 |
| | UI design system + componenti | 0 | 3 | 3 | 1 | 0 |
| | Revisione accessibilità WCAG | 0 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 3** | **1** | **7** | **4** | **1** | **1** |
| **4. Frontend Development** | Setup progetto React, routing, auth MSAL | 0 | 2 | 3 | 2 | 0 |
| | Onboarding wizard (3 step) | 0 | 1 | 3 | 3 | 0 |
| | Gestione profilo (3 pilastri + completeness) | 0 | 2 | 4 | 4 | 0 |
| | Discovery Home + feed | 0 | 2 | 3 | 3 | 0 |
| | WorkMatch swipe UI | 0 | 1 | 3 | 4 | 0 |
| | Gruppi (lista, catalogo, bacheca) | 0 | 1 | 3 | 4 | 0 |
| | Office Map (mappa interattiva + filtri) | 0 | 2 | 4 | 3 | 0 |
| | Agentic Repository (listing + ricerca + detail) | 0 | 1 | 3 | 3 | 0 |
| | Ricerca globale + filtri | 0 | 1 | 2 | 2 | 0 |
| | Admin panel base | 0 | 1 | 2 | 2 | 0 |
| | **Subtotale Fase 4** | **0** | **14** | **30** | **30** | **0** |
| **5. Backend Development** | Setup FastAPI, modelli dati, migrazioni DB | 0 | 2 | 3 | 2 | 0 |
| | Azure AD SSO integration (OIDC, token validation) | 1 | 3 | 2 | 1 | 0 |
| | API Profilo CRUD (3 pilastri, sync AD) | 0 | 2 | 4 | 3 | 0 |
| | Algoritmo matching deterministico | 1 | 3 | 3 | 1 | 0 |
| | API Discovery (feed personalizzato) | 0 | 2 | 3 | 2 | 0 |
| | API WorkMatch (swipe, match bilaterale) | 0 | 2 | 3 | 2 | 0 |
| | API Gruppi (CRUD, membri, post) | 0 | 2 | 3 | 3 | 0 |
| | API Office Map (cluster, filtri) | 0 | 1 | 3 | 2 | 0 |
| | API Repository (CRUD, ricerca full-text) | 0 | 2 | 3 | 2 | 0 |
| | GDPR: export dati, cancellazione profilo | 0 | 2 | 2 | 1 | 0 |
| | **Subtotale Fase 5** | **2** | **21** | **29** | **19** | **0** |
| **6. Infrastruttura & DevOps** | Azure provisioning (App Service, PostgreSQL, Key Vault) | 2 | 3 | 2 | 1 | 0 |
| | CI/CD pipeline (GitHub Actions) | 1 | 2 | 2 | 1 | 0 |
| | Configurazione ambienti (dev, staging, prod) | 1 | 1 | 2 | 1 | 0 |
| | Monitoring base (Application Insights) | 1 | 1 | 1 | 0 | 0 |
| | **Subtotale Fase 6** | **5** | **7** | **7** | **3** | **0** |
| **7. Testing & QA** | Test plan, definizione casi di test | 0 | 2 | 2 | 1 | 1 |
| | Unit test backend (copertura ≥ 80%) | 0 | 2 | 3 | 3 | 0 |
| | Integration test (API + DB) | 0 | 1 | 3 | 2 | 0 |
| | E2E test (Playwright/Cypress — flussi critici) | 0 | 1 | 2 | 3 | 0 |
| | Security testing (OWASP top 10 base) | 1 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 7** | **1** | **8** | **11** | **9** | **1** |
| **8. UAT & Go-Live** | UAT con utenti pilota (facilitazione) | 0 | 1 | 2 | 1 | 3 |
| | Bug fixing post-UAT | 0 | 2 | 3 | 3 | 0 |
| | Documentazione utente + materiali onboarding | 0 | 1 | 2 | 1 | 1 |
| | Go-live support (1 settimana) | 1 | 1 | 2 | 2 | 2 |
| | **Subtotale Fase 8** | **1** | **5** | **9** | **7** | **6** |
| **9. Project Management** | Coordinamento sprint, cerimonie Agile, reporting | 0 | 0 | 0 | 0 | 10 |
| | Stakeholder management, documentazione | 0 | 0 | 0 | 0 | 5 |
| | **Subtotale Fase 9** | **0** | **0** | **0** | **0** | **15** |

---

### Riepilogo per Ruolo

| Ruolo | Giorni Uomo | Tariffa indicativa (€/gg) | Costo stimato |
|---|:---:|:---:|:---:|
| Solution Architect | **25** | 800 | € 20.000 |
| Senior Consultant | **78** | 650 | € 50.700 |
| Consultant | **98** | 500 | € 49.000 |
| Junior Consultant | **69** | 350 | € 24.150 |
| Project Manager | **29** | 600 | € 17.400 |
| **TOTALE** | **299** | — | **€ 161.250** |

> ⚠️ **Note di stima**
> - La stima si riferisce a **v1.0 completa** (3 mesi, scope pieno)
> - Il **POC Hackathon** è stimato in ~**40-50 gg/u** (fasi 2, 4, 5, 6 ridotte al minimo)
> - Le tariffe sono indicative e non includono IVA né licenze software
> - La stima include un buffer del 15% per risk management e imprevisti (già incorporato)
> - Eventuali licenze Azure, tool di design o SaaS sono escluse e da quotare separatamente
> - Per la versione **Enterprise** (12 mesi, multi-tenant, ML, mobile PWA), la stima è da moltiplicare per un fattore 2.5-3x

---

### Cronoprogramma Macro

```
Mese 1   [████████████] Discovery + Architecture + UX Design + Setup Infra
Mese 2   [████████████] Frontend + Backend (core modules: Auth, Profilo, Discovery, WorkMatch)
Mese 3   [████████████] Frontend + Backend (Gruppi, Office Map, Repository) + Testing + UAT + Go-Live
```

---

*Documento prodotto per Hello Work — Hackathon Edition | Giugno 2026*
*AGIC — Connect. Discover. Belong.*
