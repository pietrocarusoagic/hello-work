# Hello Work — Product Requirements Document

> **Versione**: 1.0  
> **Data**: 20 Giugno 2026  
> **Stato**: Draft — soggetto a validazione con stakeholder cliente  
> **Autori**: Team Hello Work  

---

## 1. Overview

### One-Liner

Hello Work è una piattaforma di corporate networking che abilita connessioni tra colleghi — professionali e personali — in organizzazioni distribuite e ibride.

### Problema che Risolve

Il lavoro remoto e ibrido ha eroso il capitale relazionale interno alle organizzazioni. I colleghi collaborano efficacemente sui processi formali, ma mancano di un canale strutturato per la scoperta reciproca al di fuori dei flussi operativi: chi conosce chi, chi lavora su cosa, chi condivide le stesse passioni o gli stessi strumenti.

Hello Work affronta questo problema specifico: la **mancanza di un canale dedicato alla scoperta e al contatto tra colleghi al di fuori dei processi lavorativi formali.**

> La piattaforma non sostituisce strumenti di comunicazione esistenti (Teams, email, intranet) né sistemi HR di record. È un canale complementare dedicato alla scoperta delle persone, all'attivazione di connessioni one-to-one e alla costruzione di comunità interne per interesse.

### Target Utenti

| Segmento | Descrizione | Bisogno principale |
|----------|-------------|-------------------|
| **Dipendente remoto** | Lavora full-remote, visibilità limitata sull'organizzazione | Accesso a una rete informale interna |
| **Neo-assunto** | Appena entrato, deve costruire la propria rete | Onboarding sociale strutturato |
| **Manager / Team Lead** | Coordina team distribuiti | Strumenti per favorire coesione |
| **Expat / Mobilità** | Trasferito in nuova sede | Accesso alla rete locale |
| **HR / People & Culture** | Responsabile engagement e retention | Visibilità sulle dinamiche di community |

### Tagline

> **Connect. Discover. Belong.**

---

## 2. Classificazione e Fase Attuale

| Fase | Perimetro | Obiettivo | Stato |
|------|-----------|-----------|-------|
| **POC** | Demo navigabile — concept core | Validare la fattibilità e il valore in contesto dimostrativo | **In corso** |
| **MVP Enterprise (v1.0)** | Primo cliente pilota, single tenant | Primo rilascio in produzione con governance GDPR, SSO live, change management | Mesi 1–3 |
| **Enterprise (v2.0+)** | Multi-tenant, AI, mobile, integrazioni avanzate | Prodotto scalabile per mercato enterprise | Mesi 4–9+ |

**Distinzione operativa:**

- **POC (oggi):** dimostrare la navigabilità del concept core. Nessun obbligo di completezza, scalabilità o conformità normativa. Ottimizzato per la demo, non rappresentativo di performance di produzione.
- **MVP Enterprise (mesi 1–3):** primo rilascio in produzione su cliente reale, single tenant, perimetro funzionale limitato ma governance completa. Richiede GDPR, integrazione Azure AD reale, e piano di change management.
- **Enterprise (mesi 4–9+):** multi-tenant, integrazioni avanzate (HRIS, Teams, mobile), AI reranking. Condizionato all'esito del pilota v1.0 e stimato separatamente.

---

## 3. Assunzioni e Vincoli

### Assunzioni Progettuali Chiave

| # | Assunzione | Impatto se non verificata |
|---|------------|--------------------------|
| A01 | **Single tenant iniziale.** Il primo rilascio è dedicato a un singolo cliente. Multi-tenant pianificato per v2.0. | Ri-architettura del data model e dello strato auth |
| A02 | **Azure Active Directory / Entra ID disponibile.** Il cliente dispone di un tenant AAD attivo e configurabile per SSO OAuth 2.0 + OIDC. Accesso all'ambiente di test garantito entro settimana 2. | Necessità di sistema auth alternativo (+15 GU stimati); profilo non pre-popolabile |
| A03 | **Utenti target indicativi: 500–2.000 MAU** per il pilota. Le stime infrastrutturali si basano su questo range. | Revisione architettura e costi in caso di scostamento rilevante |
| A04 | **Stakeholder decisionale e referente tecnico** disponibili lato cliente per tutta la durata del progetto. | Rischio di deriva dei requisiti e blocchi decisionali |
| A05 | **Governance privacy e dati definita lato cliente** prima del go-live (base giuridica, DPO se applicabile, informativa). | Blocco al go-live per mancata conformità normativa |
| A06 | **Nessuna integrazione HRIS** (SAP SuccessFactors, Workday) nel perimetro MVP. Il profilo si popola da AAD e compilazione manuale. | L'integrazione HRIS è stimata separatamente in v2.0 |
| A07 | **Dati di identità in Azure AD aggiornati** per almeno il 70% della popolazione target. | Profili parziali → riduzione del valore percepito della piattaforma al lancio |
| A08 | **Owner interno nominato** (HR / People & Culture) per attivazione utenti, moderazione e comunicazione di lancio. | Adozione dipendente esclusivamente da iniziativa spontanea degli utenti |

### Limiti della Soluzione

- **La piattaforma non genera engagement autonomamente.** Il valore dipende da sponsorship manageriale visibile, comunicazione interna di lancio e presidio editoriale continuativo. In assenza di questi fattori, l'adozione spontanea non è garantita.
- **Il valore dipende dalla qualità dei profili.** Il motore di raccomandazione e WorkMatch producono risultati utili solo con profili sufficientemente completi.
- **Il POC non è rappresentativo delle performance di produzione.** Nessuna valutazione di scalabilità, sicurezza o conformità normativa deve essere basata sul POC.
- **La piattaforma non gestisce processi HR formali.** Le connessioni e gli endorsement sulla piattaforma non hanno valore contrattuale o valutativo.

### Dipendenze Critiche

| Dipendenza | Fase | Impatto |
|------------|------|---------|
| Azure Active Directory / Entra ID (tenant cliente) | MVP | SSO, pre-population profilo, RBAC |
| Stack Microsoft-first (Azure, .NET, Graph API) | POC → Enterprise | Coerenza con ecosistema enterprise |
| Single tenant (v1.0) | MVP | Semplifica data model e auth; multi-tenant è requisito v2.0 |
| Piano di change management lato cliente | MVP | Condizione necessaria per raggiungere soglie di adozione significative |
| Accesso ambiente Azure AD test entro settimana 2 | MVP | Blocca integrazione SSO se non disponibile |

---

## 4. Profilo Utente — I 3 Pilastri

Il profilo Hello Work è strutturato in tre dimensioni complementari che alimentano il motore di matching.

### Pilastro 1 — Professionale *(pre-popolato da Azure AD)*

Dati importati automaticamente da Azure AD al primo accesso:
- Nome, ruolo, dipartimento, sede, foto profilo
- Competenze tecniche (tag strutturati), certificazioni, progetti
- Timeline professionale interna all'organizzazione

### Pilastro 2 — Agentiche *(tag AI + descrizione libera)*

Dati dichiarati dall'utente relativi al proprio setup di lavoro AI-assistito:
- Tool e framework utilizzati: tag strutturati (Claude, Copilot, Cursor, n8n, LangChain, ecc.) da tassonomia controllata
- Descrizione libera del flusso di lavoro agentico adottato
- Visibilità configurabile (pubblica / colleghi connessi / privata)

### Pilastro 3 — Umano/Personale *(opt-in esplicito)*

Dati personali condivisi volontariamente:
- Hobby e interessi tramite tag strutturati (sport, musica, cucina, viaggi, gaming, libri, ecc.)
- "Fun facts" — massimo 3 curiosità in formato libero
- Lingue parlate e livello di padronanza
- Città / area geografica (non indirizzo preciso)

> ⚠️ **Governance privacy:** Il pilastro personale richiede opt-in esplicito e informativa dedicata. Il cliente deve definire la propria policy di gestione di questi dati prima del go-live (GDPR Art. 6).

### Motore di Matching — Jaccard Deterministico

Il matching tra utenti è calcolato con **similarità di Jaccard pesata** sui tre pilastri, senza necessità di dati di training:

| Pilastro | Peso |
|----------|------|
| Professionale (skills overlap) | 35% |
| Agentiche (AI tools overlap) | 40% |
| Umano/Personale (hobby + interessi) | 25% |

Il punteggio è deterministico, calcolabile senza dati storici, e pienamente spiegabile agli utenti ("Avete 4 strumenti AI in comune"). In v2.0 il Jaccard è integrato con semantic embeddings e segnali comportamentali per un matching ibrido.

---

## 5. Funzionalità — POC (oggi)

*Obiettivo: dimostrare il concept core in forma navigabile. Non rappresentativo di performance o conformità di produzione.*

| Feature | Descrizione | Priorità | Note implementative |
|---------|-------------|----------|---------------------|
| **Login AAD** | SSO aziendale tramite MSAL.js + Azure AD (redirect flow). Profilo utente pre-popolato da claims AAD al primo accesso. | Must | MSAL.js + `@azure/msal-browser`; JWT validation su ASP.NET Core 10 |
| **Onboarding wizard** | Flusso guidato (max 4 step) per completare i dati non importabili da AD: interessi, disponibilità, bio. Possibilità di skip con indicatore di completezza persistente. | Must | Frontend multi-step React; dati salvati progressivamente |
| **Profilo 3 pilastri** | Scheda profilo completa con i tre pilastri (Professionale / Agentiche / Umano). CRUD completo, indicatore completezza visibile. | Must | `ProfilesController` ASP.NET Core; tabella `users` Azure SQL |
| **Discovery home** | Ricerca testuale base su nome, ruolo, competenze, interessi. Lista colleghi con card sintetica (foto, nome, ruolo, top-3 skills, top-3 interessi). | Must | Full-text search su Azure SQL |
| **WorkMatch swipe** | Navigazione sequenziale dei profili colleghi (card browsing). Interesse reciproco → notifica connessione suggerita con proposta coffee chat. Configurabile e disattivabile dall'admin. | Must | `react-tinder-card`; `WorkMatchController` + `MatchingService` (Jaccard); tabelle `workmatch_swipes`, `matches` |
| **Gruppi** | Lista gruppi, iscrizione, feed base con post e reazioni. Suggerimenti gruppi in base al profilo. | Should | `GroupsController`; tabelle `groups`, `group_members` |
| **Office Map** | Mappa interattiva delle sedi aziendali con clustering colleghi per location. Accesso rapido al profilo dalla mappa. Nessuna geolocalizzazione in tempo reale. | Should | Azure Maps Gen 2 S0; GeoJSON statico per uffici; `MapController` |
| **AKR — Knowledge Repository** | Scheda tool agentico (tag strutturati + descrizione libera). Ricerca "chi usa [tool]?". Tag AKR inclusi nel matching. | Should | Stesso profilo `users` — campo `ai_tools` + `ai_description` |

---

## 6. Funzionalità — MVP Enterprise (v1.0, mesi 1–3)

*Tutto il POC, production-ready, più i seguenti moduli aggiuntivi. Perimetro da validare con stakeholder cliente prima dell'avvio.*

| Modulo | Funzionalità rispetto al POC |
|--------|-------------------------------|
| **Auth** | SSO Azure AD / Entra ID live (tenant cliente); RBAC completo (`user`, `hr_admin`, `sys_admin`); audit trail immutabile 90 giorni |
| **Onboarding** | Import AD automatico con sync periodica configurabile; flusso guidato completo; box benvenuto nel feed; suggerimento "persone da conoscere" al completamento |
| **Profilo** | Completeness indicator; endorsement competenze con tracciabilità; timeline professionale interna; controllo granulare visibilità per pilastro |
| **Discovery** | Filtri avanzati (team, sede, competenza, disponibilità, seniority); raccomandazioni smart settimanali; mappa sedi con filtri organizzativi |
| **Connessioni** | Coffee chat request con messaggio personalizzato; invito calendario auto-generato (Graph API); reminder; storico connessioni |
| **Gruppi avanzati** | Creazione completa (pubblico/privato/segreto); feed con post, link, immagini, sondaggi; reazioni emoji; eventi di gruppo con RSVP |
| **Feed principale** | Icebreaker settimanale; kudos; spotlight neo-assunti; notifiche in-app non intrusive |
| **GDPR self-service** | Consenso granulare per pilastro personale; export profilo JSON/CSV; cancellazione account entro 30 giorni; diritto all'oblio con anonimizzazione contenuti |
| **Admin panel** | Dashboard HR con metriche di engagement (profili completati, coffee chat avviati, gruppi attivi); moderazione contenuti; gestione utenti e ruoli |

---

## 7. Funzionalità — Enterprise (v2.0+, mesi 4–9)

*Condizionato all'esito del pilota v1.0. Perimetro e tempi da definire a seguito di retrospettiva con il cliente.*

| Area | Funzionalità pianificate |
|------|--------------------------|
| **Calendario integrato** | Scheduling coffee chat direttamente da Hello Work via Microsoft Graph API (Outlook/Teams calendar) |
| **HR Analytics avanzata** | Dashboard engagement: heatmap connessioni, retention insights, network density per divisione; Power BI embedded |
| **Icebreaker feed AI** | Prompt icebreaker settimanali generati via Azure OpenAI (GPT-4o mini) personalizzati per divisione e periodo |
| **Mobile PWA** | Progressive Web App con service worker, notifiche push native, offline support parziale |
| **Multi-tenant** | Architettura multi-tenant (Azure SQL Row-Level Security su `tenant_id`); Entra External ID per tenant B2B; white label e branding per divisione |
| **AI reranking** | Matching ibrido: Jaccard (40%) + semantic embeddings text-3-small via Azure AI Foundry (40%) + segnali comportamentali (20%) |
| **Event Radar** | Creazione eventi aziendali; RSVP con lista d'attesa; integrazione calendario; filtri per sede e interesse |
| **CV dual source** | Profilo professionale arricchito con dati da HRIS (SAP SuccessFactors, Workday) in aggiunta ad Azure AD |
| **Teams Tab / Viva Connections** | Hello Work come widget integrato in Microsoft Teams e Viva Connections |
| **Internazionalizzazione** | Supporto multilingua: EN, FR, DE, ES |

---

## 8. Architettura POC (Sintesi)

### Stack

| Layer | Tecnologia | Ruolo |
|-------|-----------|-------|
| **Frontend** | React 19 + TypeScript + Vite 6 | SPA responsive, Azure Static Web Apps |
| **Backend** | ASP.NET Core 10 C# | API Gateway + Business Logic Layer, Azure Container Apps (Consumption) |
| **Database** | Azure SQL Database (Serverless) | Profili, match, swipe, gruppi |
| **Auth** | Azure AD / Entra ID + MSAL.js | SSO aziendale, pre-population profilo da claims |
| **Maps** | Azure Maps Gen 2 S0 | Office Map, tile rendering, clustering pushpin |
| **Storage** | Azure Blob Storage (LRS Hot) | Avatar upload, asset statici |
| **Secrets** | Azure Key Vault (Standard) | Connection string DB, Maps API key, MSAL client secret |
| **CI/CD** | GitHub Actions → ACR → Container Apps | Pipeline 3-step: build + test + Docker push |

**Costo stimato POC**: < €15/mese (scale-to-zero + tier minimi)

### Auth — Azure AD SSO Flow

```
Browser → MSAL redirect → Azure AD → id_token + access_token
React SPA → API call con Bearer token
ASP.NET Core → JWT validation (AAD JWKS) → estrazione OID, name, email → upsert user
→ Profilo pre-popolato da claims: displayName, mail, jobTitle, department, officeLocation
```

### Matching — Jaccard Deterministico

```
score = 0.35 × Jaccard(skills_A, skills_B)
      + 0.40 × Jaccard(ai_tools_A, ai_tools_B)
      + 0.25 × Jaccard(hobbies_A ∪ interests_A, hobbies_B ∪ interests_B)

WorkMatch bilateral: swipe(A→B) = like AND swipe(B→A) = like
  → INSERT matches + notifica in-app
```

### Diagramma Componenti

```
Browser (React 19 SPA)
    │ HTTPS/REST
    ▼
Azure Container Apps
  └── ASP.NET Core 10 C# API
        ├── /auth     → MSAL JWT validation
        ├── /profiles → CRUD 3-pillar profile
        ├── /matches  → Jaccard matching engine
        ├── /workmatch→ swipe state machine
        ├── /groups   → group CRUD + suggestions
        └── /map      → office people-cluster endpoint
              │
    ┌─────────┼──────────────┐
    ▼         ▼              ▼
Azure SQL   Azure AD     Azure Blob
Database    Entra ID     Storage
(Serverless)             (avatars)
              │
          Azure Maps
          (Office Map)
```

---

## 9. Requisiti Non Funzionali Chiave

### Performance

| Requisito | Target |
|-----------|--------|
| Caricamento pagina (LCP) | < 2 secondi su connessione aziendale standard |
| Risposta API | < 300 ms al 95° percentile (escluse chiamate a servizi esterni) |
| Latenza ricerca utenti | < 500 ms per query con indice full-text correttamente dimensionato |
| Disponibilità (SLA MVP) | 99,5% uptime mensile, escluse manutenzioni pianificate con preavviso |
| Capacità di carico MVP | 500–2.000 utenti attivi (baseline dimensionamento infrastrutturale) |

### Sicurezza

- Autenticazione esclusivamente via SSO aziendale (Azure AD / Entra ID) — nessuna credenziale locale
- RBAC a tre ruoli: `user`, `hr_admin`, `sys_admin`
- Tutti i dati in transito cifrati con TLS 1.3; dati a riposo con AES-256
- Audit trail immutabile di accessi e operazioni sensibili (90 giorni rolling)
- Penetration test obbligatorio prima del go-live in produzione

### GDPR

- Base giuridica del trattamento definita dal cliente prima del go-live
- Diritto all'oblio: cancellazione account entro 30 giorni dalla richiesta, con anonimizzazione contenuti pubblici
- Portabilità dei dati: export profilo in formato JSON/CSV su richiesta
- Privacy by design: geolocalizzazione limitata alla sede dichiarata (non posizione real-time); pilastro personale sempre opt-in; dati WorkMatch non esposti individualmente
- Data residency: tutti i dati in data center EU (North/West Europe Azure region)

### Accessibilità

- Conformità WCAG 2.1 livello AA
- Supporto screen reader (ARIA labels completi)
- Navigabilità completa da tastiera
- Contrasto colori minimo 4,5:1

---

## 10. Rischi Principali

| ID | Rischio | Probabilità | Impatto | Mitigazione |
|----|---------|:-----------:|:-------:|-------------|
| R01 | **Adozione utenti insufficiente** — massa critica non raggiunta entro 60 giorni dal go-live | Alta | Alto | Piano di comunicazione interna; sponsor manageriale visibile; incentivi al completamento profilo |
| R02 | **Profili incompleti al lancio** — import AD parziale e scarsa motivazione alla compilazione manuale | Alta | Alto | Completeness indicator; nudge via notifica; campagne HR mirate |
| R03 | **Privacy percepita sul pilastro personale** — resistenza a condividere hobby e interessi in contesto lavorativo | Media | Medio | Opt-in esplicito; controllo granulare sulla visibilità; comunicazione trasparente sulle policy |
| R04 | **Stack da validare in produzione** — architettura POC non sottoposta a load test né hardening di sicurezza | Alta | Alto | Assessment Architetturale dedicato obbligatorio prima del go-live in produzione |
| R05 | **Integrazione Azure AD più complessa del previsto** — policy tenant, proxy/firewall aziendali | Bassa | Alto | Discovery tecnica dedicata in settimana 1; accesso ambiente test garantito contrattualmente |
| R06 | **Aspettative non allineate** — il business si aspetta engagement immediato, l'IT vede la piattaforma come tool tecnico | Alta | Alto | Workshop di allineamento in kick-off; definizione congiunta degli indicatori di successo |
| R07 | **Dati Azure AD incompleti** — AD non aggiornato per una parte rilevante della popolazione target | Media | Alto | Assessment pre-progetto dello stato dell'AD; piano di data cleansing; fallback a compilazione manuale |

---

## 11. Fuori Scope — POC

Le seguenti aree sono esplicitamente **fuori perimetro** nella fase POC attuale e non devono essere valutate come parte del deliverable corrente:

- **Alta disponibilità e disaster recovery**: nessun failover automatico, nessun RTO/RPO definito, nessuna strategia di recovery testata
- **Hardening di sicurezza completo**: assenza di WAF, Private Endpoints, Managed Identity su tutti i servizi, network segmentation, penetration test
- **Conformità GDPR completa**: nessun GDPR self-service (right-to-erasure automatizzato), nessun audit log immutabile, nessuna DPA contrattuale con il provider cloud
- **Integrazioni enterprise estese**: sincronizzazione HRIS (SAP SuccessFactors, Workday), calendar integration via Graph API, Teams Tab / Viva Connections
- **Load test e validazione delle performance**: throughput, concorrenza e dimensionamento DB non sono stati oggetto di test sotto carico
- **Procedure operative e supporto**: nessun runbook, nessun processo L1/L2, nessuna gestione degli incidenti formalizzata
- **Multi-tenancy**: architettura single-tenant nel POC; il modello multi-tenant è pianificato per v2.0
- **App mobile nativa**: iOS/Android non inclusi; PWA pianificata come enhancement in v1.1
- **Notifiche push**: non implementate nel POC; incluse nell'MVP Enterprise
- **Coffee chat scheduling con calendario**: integrazione Graph API per inviti calendario non inclusa nel POC
- **AI reranking / semantic matching**: il POC usa esclusivamente Jaccard deterministico; embeddings e behavioral scoring pianificati per v2.0
- **Internazionalizzazione**: la piattaforma POC è in italiano; supporto multilingua pianificato per v2.0

---

*Hello Work — Product Requirements Document v1.0*  
*20 Giugno 2026*
