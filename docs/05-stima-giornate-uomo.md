# Hello Work — Stima Giornate Uomo
**v1.1 — Revisione Governance** · 20 Giugno 2026
*Revisione richiesta da: Alessandro Rapiti — Area CAI (CloudApp & Infrastructure)*

---

> ⚠️ **Nota obbligatoria — Natura della stima**
> I valori riportati sono **stime indicative di ordine di grandezza**, prodotte sulla base delle assunzioni descritte nella sezione seguente. Non costituiscono impegno contrattuale, preventivo definitivo né garanzia di costo finale. La stima definitiva dovrà essere prodotta al termine della fase di Discovery, sulla base del perimetro funzionale confermato e delle scelte architetturali validate.

---

## 1. Assunzioni alla Base della Stima

| Assunzione | Valore assunto |
|---|---|
| **Scope di riferimento** | v1.0 completa — superset del POC, baseline commerciale |
| **Approccio di delivery** | Agile / Scrum — sprint da 2 settimane, rilasci progressivi |
| **Giornata lavorativa** | 8 ore effettive |
| **Stack di riferimento** | Da validare in fase di design architetturale (vedi Arch. Enterprise). Ipotesi di lavoro: React/Next.js frontend, backend API su ecosistema Microsoft, PostgreSQL su Azure |
| **Tenant** | Single tenant — architettura multi-tenant non inclusa in questa stima |
| **Integrazioni** | Solo Azure AD SSO. Nessuna integrazione HRIS, calendario o sistemi esterni |
| **Ambienti** | Development + Staging + Production |
| **Disponibilità cliente** | Stakeholder disponibili per workshop, UAT e sign-off sprint |
| **Buffer incluso** | 15% già incorporato nei totali per risk management e imprevisti |

---

## 2. Rischi di Variazione della Stima

| Fattore di rischio | Impatto stimato | Mitigazione |
|---|---|---|
| Perimetro non consolidato | ±20–30% | Assessment funzionale in Fase 1 |
| Scelte architetturali non validate | ±15–25% | Architecture design sprint dedicato |
| Integrazioni aggiuntive (HRIS, Teams, calendar) | +20–40 gg/u per integrazione | Perimetrare esplicitamente in contratto |
| Qualità dati Azure AD incompleti | +5–10 gg/u | Verifica tenant AD in kick-off |
| Change request durante la delivery | Gestito tramite Change Request formale | Governance sprint-by-sprint |
| Profili complessi di sicurezza / compliance | +10–20 gg/u | Security assessment preventivo |

---

## 3. Tariffe di Riferimento

Le tariffe utilizzate sono coerenti con il documento Offerta Commerciale (doc 06).

| Ruolo | Tariffa giornaliera |
|---|---|
| Solution Architect | €900/gg |
| Senior Consultant | €700/gg |
| Consultant | €450/gg |
| Junior Consultant | €300/gg |
| Project Manager | €575/gg |

---

## 4. Breakdown per Fase e Ruolo

| Fase | Attività | Sol. Arch | Senior | Consultant | Junior | PM |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **1. Discovery & Analysis** | Workshop stakeholder, analisi requisiti, definizione scope | 2 | 2 | 1 | 0 | 3 |
| | Definizione tassonomia tag (skill, AI tools, hobby) | 0 | 2 | 2 | 0 | 1 |
| | Data model review Azure AD, GDPR assessment | 1 | 2 | 1 | 0 | 1 |
| | **Subtotale Fase 1** | **3** | **6** | **4** | **0** | **5** |
| **2. Architecture & Design** | System architecture design (frontend, backend, infra, auth) | 5 | 2 | 0 | 0 | 1 |
| | Database design (schema profilo, tag, matching, gruppi) | 2 | 3 | 1 | 0 | 0 |
| | API design (OpenAPI spec, contratti) | 2 | 3 | 2 | 0 | 0 |
| | Security architecture (Azure AD OIDC, RBAC, GDPR) | 3 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 2** | **12** | **10** | **4** | **0** | **1** |
| **3. UX / UI Design** | User flows, wireframe, prototipo navigabile | 1 | 2 | 0 | 0 | 1 |
| | UI design system + componenti | 0 | 3 | 3 | 1 | 0 |
| | Revisione accessibilità WCAG 2.1 AA | 0 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 3** | **1** | **7** | **4** | **1** | **1** |
| **4. Frontend Development** | Setup progetto, routing, auth MSAL | 0 | 2 | 3 | 2 | 0 |
| | Onboarding wizard (3 step) | 0 | 1 | 3 | 3 | 0 |
| | Gestione profilo (3 pilastri + completeness) | 0 | 2 | 4 | 4 | 0 |
| | Discovery Home + feed | 0 | 2 | 3 | 3 | 0 |
| | Discovery rapido one-to-one (WorkMatch) | 0 | 1 | 3 | 4 | 0 |
| | Gruppi (lista, catalogo, bacheca) | 0 | 1 | 3 | 4 | 0 |
| | Office Map (mappa interattiva + filtri) | 0 | 2 | 4 | 3 | 0 |
| | Agentic Repository (listing + ricerca + detail) | 0 | 1 | 3 | 3 | 0 |
| | Ricerca globale + filtri | 0 | 1 | 2 | 2 | 0 |
| | Admin panel base | 0 | 1 | 2 | 2 | 0 |
| | **Subtotale Fase 4** | **0** | **14** | **30** | **30** | **0** |
| **5. Backend Development** | Setup API, modelli dati, migrazioni DB | 0 | 2 | 3 | 2 | 0 |
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
| **6. Infrastruttura & DevOps** | Azure provisioning (Container Apps, PostgreSQL, Key Vault) | 2 | 3 | 2 | 1 | 0 |
| | CI/CD pipeline (GitHub Actions) | 1 | 2 | 2 | 1 | 0 |
| | Configurazione ambienti (dev, staging, prod) | 1 | 1 | 2 | 1 | 0 |
| | Monitoring base (Application Insights) | 1 | 1 | 1 | 0 | 0 |
| | **Subtotale Fase 6** | **5** | **7** | **7** | **3** | **0** |
| **7. Testing & QA** | Test plan, definizione casi di test | 0 | 2 | 2 | 1 | 1 |
| | Unit test backend (copertura ≥ 80%) | 0 | 2 | 3 | 3 | 0 |
| | Integration test (API + DB) | 0 | 1 | 3 | 2 | 0 |
| | E2E test (flussi critici) | 0 | 1 | 2 | 3 | 0 |
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

## 5. Riepilogo per Ruolo

| Ruolo | Giorni Uomo | Tariffa (€/gg) | Costo indicativo |
|---|:---:|:---:|:---:|
| Solution Architect | **25** | €900 | **€ 22.500** |
| Senior Consultant | **78** | €700 | **€ 54.600** |
| Consultant | **98** | €450 | **€ 44.100** |
| Junior Consultant | **69** | €300 | **€ 20.700** |
| Project Manager | **29** | €575 | **€ 16.675** |
| **TOTALE** | **299 gg/u** | — | **€ 158.575** |

> Le tariffe sono coerenti con il documento Offerta Commerciale (doc 06). I valori sono indicativi e non includono IVA, licenze software o costi infrastrutturali Azure (stimati separatamente in doc 04).

---

## 6. Perimetro della Stima e Cosa Non Include

**Incluso:**
- Tutte le attività di analisi, progettazione, sviluppo, testing e go-live della v1.0
- Project management e cerimonie Agile
- Documentazione tecnica e utente
- Security testing base (OWASP top 10)
- 15% buffer per imprevisti

**Non incluso:**
- Costi infrastrutturali Azure (→ doc 04)
- Licenze software di terze parti
- Integrazioni non esplicitamente perimetrate (HRIS, Teams, calendar)
- Change management e comunicazione interna (stimabile separatamente)
- Versione Enterprise / multi-tenant (stima separata: fattore 2.5–3x)
- Supporto e manutenzione post go-live

---

## 7. Cronoprogramma Macro

```
Mese 1  [████████████] Discovery + Architecture + UX Design + Setup Infra
Mese 2  [████████████] Frontend + Backend (Auth, Profilo, Discovery, WorkMatch)
Mese 3  [████████████] Frontend + Backend (Gruppi, Map, Repository) + Testing + UAT + Go-Live
```

*I checkpoint decisionali al termine di ogni sprint garantiscono la possibilità di rivalutare priorità e scope in modo governato.*
