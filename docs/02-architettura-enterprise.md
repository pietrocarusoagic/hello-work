# Hello Work — Architettura Enterprise

> **Data revisione**: 20 giugno 2026
> **Versione**: Enterprise Rev. 1.0
> **Stato**: Architettura target — soggetta ad Assessment Architetturale prima dell'adozione

---

## 0. Principi Architetturali

Questi principi guidano ogni scelta dell'architettura enterprise Hello Work. Ogni componente aggiunto o modificato deve essere valutato rispetto a questi criteri.

| Principio | Descrizione |
|---|---|
| **Semplicità prima della complessità** | Aggiungere componenti solo quando portano valore dimostrato. Un'architettura più semplice è più facile da gestire, debuggare e trasferire. Se un servizio managed copre il caso d'uso, non costruire custom. |
| **Coerenza con ecosistema Microsoft (Azure-first)** | Privilegiare servizi Azure nativi e stack Microsoft (.NET, Bicep, Graph API). Tecnologie non Microsoft devono essere esplicitamente valutate e approvate con nota "da validare in fase di design". |
| **Sicurezza by design** | La sicurezza è un requisito architetturale, non un'appendice. Ogni layer — networking, compute, data, AI — include controlli di sicurezza nativi fin dalla progettazione. |
| **Osservabilità come requisito** | Ogni servizio espone metriche, log e trace sin dal primo deploy. Azure Monitor è la piattaforma unica. Nessun componente va in produzione senza alert e dashboard associati. |
| **Sostenibilità operativa** | Preferire managed services (Container Apps, Azure SQL, AI Foundry) rispetto a infrastruttura custom (AKS self-managed, VM). L'obiettivo è minimizzare il carico operativo nel tempo. |

---

## 1. Layered Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HELLO WORK — ENTERPRISE ARCHITECTURE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 0 — CLIENT TIER                                                       │
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────────────────┐  │
│  │  Web App     │   │  Mobile PWA  │   │  Teams Tab / Viva Connections   │  │
│  │  React 19    │   │  (SW + WASM) │   │  (Microsoft 365 integration)    │  │
│  │  TypeScript  │   │              │   │                                 │  │
│  └──────┬───────┘   └──────┬───────┘   └───────────────┬─────────────────┘  │
└─────────┼─────────────────┼────────────────────────────┼────────────────────┘
          │ HTTPS           │                             │
┌─────────┼─────────────────┼────────────────────────────┼────────────────────┐
│  LAYER 1 — INGRESS & EDGE                                                    │
│          │                │                             │                    │
│  ┌───────▼────────────────▼─────────────────────────────▼────────────────┐  │
│  │                 Azure Front Door Premium                               │  │
│  │   WAF Policy (OWASP 3.2) · Global Load Balancing                      │  │
│  │   CDN (static assets) · DDoS Protection · TLS 1.3                     │  │
│  └────────────────────────┬───────────────────────────────────────────────┘  │
│                           │  Route rules per region                          │
│          ┌────────────────┴────────────────┐                                 │
│          ▼                                 ▼                                 │
│    Italy (West Europe)              East EU / Expansion                       │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — API GATEWAY & IDENTITY                                             │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │            Azure API Management (Standard v2 / Premium)               │   │
│  │  Rate limiting · JWT validation · Subscription keys                   │   │
│  │  API versioning · OpenAPI portal · Analytics                          │   │
│  │  ⚠ Valore reale da v1.0 in poi — non nel POC                         │   │
│  └────────────────────────┬──────────────────────────────────────────────┘   │
│                           │                                                   │
│  ┌────────────────────────┴──────────────────────────────────────────────┐   │
│  │          Azure AD / Entra ID + Entra External ID                      │   │
│  │  Internal SSO (corporate) · External tenants (B2B)                    │   │
│  │  Conditional Access · MFA · PIM per ruoli privilegiati                │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — COMPUTE TIER (Azure Container Apps Environment)                   │
│                                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Profile API │  │ Matching     │  │ WorkMatch    │  │ Groups API   │      │
│  │ ASP.NET     │  │ Engine       │  │ Service      │  │ ASP.NET      │      │
│  │ Core 10 C#  │  │ ASP.NET Core │  │ ASP.NET      │  │ Core 10 C#   │      │
│  │             │  │ 10 C# +      │  │ Core 10 C#   │  │              │      │
│  │ CRUD        │  │ Azure AI     │  │ Swipe FSM    │  │ CRUD + recs  │      │
│  │ 3-pillar    │  │ Foundry      │  │              │  │              │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                │                 │                  │              │
│  ┌──────┴────────────────┴─────────────────┴──────────────────┴──────────┐  │
│  │               Azure Service Bus (Standard / Premium)                  │  │
│  │  match.created · swipe.mutual · group.suggested · notification.push   │  │
│  │  ⚠ Necessario per architettura event-driven enterprise — non nel POC  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                        │
│  │ Notification │  │ Analytics    │  │ Calendar     │                        │
│  │ Worker       │  │ Worker       │  │ Integration  │                        │
│  │ (async)      │  │ (async)      │  │ (Graph API)  │                        │
│  └──────────────┘  └──────────────┘  └──────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DATA TIER                                                          │
│                                                                              │
│  ┌────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐   │
│  │  Azure SQL         │   │   Azure Cache for    │   │  Azure AI Search │   │
│  │  Database          │   │   Redis (P1)          │   │  (Cognitive      │   │
│  │  Flexible Server   │   │                      │   │   Search)        │   │
│  │  Zone Redundant HA │   │  Session cache        │   │  Full-text su    │   │
│  │  PITR 35 giorni    │   │  Match score cache    │   │  ai_description  │   │
│  │  CMK encryption    │   │  Rate limit buckets   │   │  + semantic      │   │
│  │  Read replica      │   └──────────────────────┘   │  vector index    │   │
│  └────────────────────┘                              └──────────────────┘   │
│                                                                              │
│  ┌────────────────────┐   ┌──────────────────────┐                           │
│  │  Azure Blob        │   │  Azure Data Lake     │                           │
│  │  Storage (ZRS)     │   │  Storage Gen2        │                           │
│  │  Avatars, assets   │   │  Analytics cold      │                           │
│  │  Private endpoint  │   │  storage (Parquet)   │                           │
│  └────────────────────┘   └──────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — AI & INTELLIGENCE                                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    Azure AI Foundry                                  │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │    │
│  │  │  GPT-4o mini    │  │  Embeddings      │  │  Content Safety  │    │    │
│  │  │  (icebreaker    │  │  text-3-small    │  │  (moderation     │    │    │
│  │  │   prompts,      │  │  (semantic       │  │   profili &      │    │    │
│  │  │   coffee chat   │  │   match boost)   │  │   descrizioni)   │    │    │
│  │  │   suggestions)  │  └─────────────────┘  └──────────────────┘    │    │
│  │  └─────────────────┘                                                │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 6 — SECURITY & GOVERNANCE                                              │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Azure       │  │  Azure       │  │  Microsoft   │  │  Azure       │     │
│  │  Key Vault   │  │  Private     │  │  Defender    │  │  Policy      │     │
│  │  (HSM-backed)│  │  Endpoints   │  │  for Cloud   │  │  + RBAC      │     │
│  │              │  │              │  │              │  │              │     │
│  │  All secrets │  │  No public   │  │  Threat      │  │  Compliance  │     │
│  │  CMK keys    │  │  DB/Redis    │  │  protection  │  │  ISO 27001   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 7 — OBSERVABILITY                                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │             Azure Monitor — Unified Observability Stack              │    │
│  │                                                                      │    │
│  │  Application Insights  →  Distributed tracing, dependency maps      │    │
│  │  Log Analytics         →  Log centralizzati, query KQL              │    │
│  │  Azure Dashboards      →  SLA/SLO dashboard, business KPI           │    │
│  │  Alerts + Action Groups→  Integrazione PagerDuty/Teams              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────────┐
│  LAYER 8 — CI/CD                                                              │
│                                                                              │
│  GitHub (mono-repo)                                                           │
│      │                                                                        │
│      ├── GitHub Actions                                                       │
│      │      ├── PR: lint + test + SAST (CodeQL) + container scan             │
│      │      ├── main: build → ACR push → staging deploy → smoke test         │
│      │      └── tag: production deploy (Blue/Green via Traffic Split)        │
│      │                                                                        │
│      └── Environments: dev → staging → prod (approval gates)                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Scelte Architetturali e Impatto sui Costi

Questa sezione documenta i principali trade-off architetturali, con motivazione esplicita delle scelte e indicazione dell'impatto economico e operativo. L'obiettivo è garantire che ogni componente dell'architettura porti valore reale e non complessità gratuita.

### Container Apps vs AKS (Kubernetes)

| | Azure Container Apps | Azure Kubernetes Service (AKS) |
|---|---|---|
| **Complessità operativa** | Bassa — managed runtime, no cluster management | Alta — upgrade, node pools, networking, security patching |
| **Costo di gestione** | Incluso nel servizio | Richiede competenze DevOps dedicate + ore di gestione |
| **Autoscaling** | KEDA integrato, scale-to-zero nativo | KEDA configurabile, ma richiede setup manuale |
| **Caso d'uso ideale** | Microservizi stateless, event-driven workers, API HTTP | Workload con requisiti di rete avanzati, stateful, o scheduling custom |
| **Raccomandazione** | ✅ **Container Apps è la scelta preferita** per Hello Work | ⚠ Valutare AKS solo se emergono requisiti specifici non soddisfacibili da Container Apps |

### PostgreSQL Flexible Server / Azure SQL vs Cosmos DB

| | Azure SQL Database (Flexible Server) | Azure Cosmos DB |
|---|---|---|
| **Modello dati** | Relazionale — ottimale per profili, match, swipe, gruppi | Document/Key-Value/Graph — ottimale per dati non strutturati o globalmente distribuiti |
| **Costo** | Prevedibile, tier serverless disponibile | Pay-per-RU, può diventare costoso con query relazionali |
| **Competenze richieste** | SQL standard — ampiamente disponibile | NoSQL + Cosmos SDK — specializzazione necessaria |
| **Raccomandazione** | ✅ **Azure SQL è la scelta corretta** per Hello Work | ⚠ Cosmos DB non è necessario in prima istanza — rivalutare solo per requisiti multi-region write o dati non relazionali |

### API Management: quando ha senso

Azure API Management porta valore reale in scenari enterprise maturi:
- **Multi-tenant con subscription key** per isolare i tenant
- **API versioning** quando il contratto API deve essere mantenuto stabile su versioni multiple
- **Rate limiting per tenant** con policy granulari
- **Developer portal** per onboarding clienti esterni

> ⚠️ **API Management non è necessario nel POC** e non è raccomandato prima di v1.0. Il costo (tier Standard v2: ~€140/mese, Premium: ~€3.000/mese) è giustificato solo quando i casi d'uso sopra sono attivi. Valutare l'introduzione nella roadmap Q3 2026.

### Azure Service Bus: quando ha senso

Azure Service Bus è il pattern corretto per architetture event-driven enterprise:
- **Disaccoppiamento** tra Matching Engine, Notification Worker e Analytics Worker
- **Affidabilità garantita** (at-least-once delivery, dead-letter queue)
- **Scalabilità** dei worker indipendente dai servizi upstream

> ⚠️ **Service Bus non è necessario nel POC**, dove la comunicazione sincrona in-process è sufficiente. Introdurlo nella roadmap Q3 2026 come parte del passaggio da POC a production.

### Pattern complessi: microservizi e architettura event-driven

> 📋 **Nota architetturale**: L'architettura enterprise descritta in questo documento adotta un approccio a microservizi con comunicazione asincrona via Service Bus. Questo pattern offre scalabilità e indipendenza dei servizi, ma introduce complessità operativa (distributed tracing, eventual consistency, gestione degli errori asincroni).
>
> **Tali pattern sono da valutare nella fase di design dettagliato, e non devono essere assunti come requisiti iniziali.** Il punto di partenza raccomandato è un'architettura modulare ma monolitica (modular monolith), da decomporre in microservizi solo su necessità dimostrata.

---

## 3. Azure Services — Enterprise Complete

### Networking & Edge

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure Front Door Premium** | Premium | Global ingress, WAF, CDN, health probes multi-region |
| **Azure DDoS Protection** | Standard | Mitigazione attacchi a livello network |
| **Azure Private DNS Zones** | — | Name resolution per private endpoints |

### Identity & Access

| Servizio | Tier | Ruolo |
|---|---|---|
| **Microsoft Entra ID** | P2 | SSO corporate, Conditional Access, PIM |
| **Microsoft Entra External ID** | — | Multi-tenant B2B (aziende clienti) |
| **Azure API Management** | Standard v2 / Premium | Gateway unificato, rate limit, API portal — da v1.0 |

### Compute

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure Container Apps** | Dedicated (Workload Profiles) | Microservizi ASP.NET Core 10, autoscaling KEDA, ingress managed |
| **Azure Container Registry** | Premium | Registry privato con geo-replication e vulnerability scanning |
| **Azure Service Bus** | Standard / Premium | Messaging asincrono tra microservizi — da v1.0 |
| **Azure Functions** | Flex Consumption | Background jobs: analytics aggregation, scheduled matching refresh |

### Data

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure SQL Database** | General Purpose D4s_v3, Zone Redundant HA | OLTP primario, PITR 35 giorni, CMK encryption |
| **Azure Cache for Redis** | P1 (6 GB) | Match score cache, sessioni, rate limiting |
| **Azure AI Search** | Standard S2 | Full-text + semantic search su profili e Knowledge Repository |
| **Azure Blob Storage** | ZRS Hot + Cool tiering | Avatar, assets statici, export dati |
| **Azure Data Lake Storage Gen2** | — | Data warehouse per analytics HR (Parquet, Delta Lake) |

### AI & Intelligence

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure AI Foundry** | Pay-per-token | Hub unificato per tutti i modelli AI |
| **Azure OpenAI** (via Foundry) | GPT-4o mini | Icebreaker prompts, coffee chat suggestions, bio enhancement |
| **Azure OpenAI Embeddings** (via Foundry) | text-embedding-3-small | Semantic matching boost oltre Jaccard |
| **Azure AI Content Safety** | Standard | Moderazione contenuti user-generated |

### Security

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure Key Vault** (HSM) | Premium | Secrets, CMK per DB/Storage, certificati TLS |
| **Azure Private Endpoints** | — | DB, Redis, Storage raggiungibili solo via rete privata |
| **Microsoft Defender for Cloud** | P2 | CSPM, threat detection, vulnerability assessment |
| **Azure Policy** | — | Governance automatica: no public IP, CMK obbligatorio, tag enforcement |

### Observability

| Servizio | Tier | Ruolo |
|---|---|---|
| **Application Insights** | Pay-per-GB | APM, distributed tracing, performance profiling |
| **Log Analytics Workspace** | Pay-per-GB | Log centralizzati da tutti i servizi |
| **Azure Monitor Workbooks** | — | Dashboard SLA/SLO, business KPI per HR |
| **Azure Alerts + Action Groups** | — | Notifiche PagerDuty/Teams per incidenti |

### Microsoft 365 Integration

| Servizio | Ruolo |
|---|---|
| **Microsoft Graph API** | Sync profili da AAD, Calendar integration per coffee chat scheduling |
| **Teams Toolkit** | Hello Work come Teams Tab / Viva Connections widget |
| **Power BI** | HR Analytics dashboard embedded |

---

## 4. Matching Engine — Enterprise (Hybrid)

```
                    ┌─────────────────────────────────┐
                    │      Matching Engine v2          │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                      │
              ▼                    ▼                      ▼
   ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐
   │  Jaccard Score  │  │  Semantic Score  │  │  Behavioral Score  │
   │  (deterministic)│  │  (embeddings)    │  │  (interaction data)│
   │                 │  │                  │  │                    │
   │  tag overlap    │  │  cosine sim su   │  │  views, swipes,    │
   │  across pillars │  │  ai_description  │  │  group co-member   │
   │  weight: 0.40   │  │  + bio vectors   │  │  weight: 0.20      │
   │                 │  │  weight: 0.40    │  │                    │
   └────────┬────────┘  └────────┬─────────┘  └────────┬───────────┘
            │                    │                      │
            └────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   Composite Score      │
                    │   + Redis cache 1h     │
                    │   + explainability     │
                    │   ("Avete 4 AI tools   │
                    │    in comune!")        │
                    └────────────────────────┘
```

> 📝 **Nota — Runtime del Matching Engine**
>
> Il Matching Engine enterprise utilizza **ASP.NET Core 10 C#** integrato con **Azure AI Foundry** per la componente semantica. Se in fase di design dettagliato si valutasse l'adozione di **FastAPI (Python)** come runtime alternativo (ad es. per librerie ML native Python), tale scelta è **da validare per garantire supportabilità nel contesto Microsoft-first**.
>
> **Alternative raccomandate senza uscire dall'ecosistema**: Azure Functions (Flex Consumption) con SDK Python per la sola parte AI, oppure **.NET Minimal API** con chiamate dirette ad Azure AI Foundry via REST.

---

## 5. Data Flow — WorkMatch Bilateral Match

```
User A swipes RIGHT su User B
        │
        ▼
  ASP.NET Core 10 WorkMatch Service
  INSERT swipe(A→B, 'like')
        │
        ▼
  SELECT swipe(B→A) WHERE direction = 'like'?
        │
   YES  ▼
  INSERT matches(A, B, score)
  PUBLISH → Service Bus: "match.created"
        │
        ├──► Notification Worker:
        │     - Push notification (A + B)
        │     - Teams message via Graph API
        │     - "Prenota un caffè ☕ con [Nome]!"
        │
        └──► Analytics Worker:
              - Incrementa match metrics
              - Aggiorna recommendation model features
```

---

## 6. Architettura Multi-Tenant

```
┌────────────────────────────────────────────────────────────┐
│               Hello Work — Multi-Tenant Model              │
│                                                            │
│  Tenant AGIC          Tenant ClienteCorp     Tenant BankXY │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐ │
│  │ AAD Tenant A │     │ AAD Tenant B │     │ AAD Ext ID │ │
│  │ (existing)   │     │ (federated)  │     │ (B2B guest)│ │
│  └──────┬───────┘     └──────┬───────┘     └─────┬──────┘ │
│         │                   │                    │        │
│         └───────────────────┼────────────────────┘        │
│                             │                              │
│                    Entra External ID                       │
│                    (tenant routing)                        │
│                             │                              │
│              ┌──────────────▼──────────────┐              │
│              │   API Management             │              │
│              │   x-tenant-id header         │              │
│              │   per-tenant rate limits     │              │
│              └──────────────┬──────────────┘              │
│                             │                              │
│              ┌──────────────▼──────────────┐              │
│              │   Azure SQL Row-Level        │              │
│              │   Security (tenant_id)        │              │
│              │   Schema isolation per        │              │
│              │   enterprise cliente          │              │
│              └──────────────────────────────┘              │
└────────────────────────────────────────────────────────────┘
```

**Isolamento dati**: Azure SQL Row-Level Security su `tenant_id` — un singolo cluster, zero data leakage tra tenant.

> 📋 **Nota**: Il modello multi-tenant descritto (shared infrastructure, RLS isolation) è adeguato per la maggior parte dei casi enterprise. Per clienti con requisiti di isolamento più stringenti (es. compliance settoriale, data sovereignty) è necessario valutare un modello **schema-per-tenant** o **database-per-tenant** — da definire nell'Assessment Architetturale dedicato.

---

## 7. Scalabilità

| Dimensione | POC | Enterprise Target |
|---|---|---|
| **Utenti attivi** | 50 (demo) | 10.000 / tenant, 1M+ totali |
| **Concurrent users** | 10 | 5.000 |
| **API throughput** | 10 req/s | 10.000 req/s (APIM + Container Apps scaling) |
| **Match computation** | In-request | Pre-computed + Redis cache, batch refresh ogni 4h |
| **DB connections** | 5 | Connection pooling (Container Apps sidecar) |
| **Region availability** | Single (West Europe) | Active-Active West + North Europe + failover |

**Autoscaling rules** (KEDA su Container Apps):
```yaml
# Scale on HTTP requests + Service Bus queue depth
triggers:
  - type: http
    metadata:
      targetPendingRequests: "100"
  - type: azure-servicebus
    metadata:
      queueName: match-events
      messageCount: "50"   # scale worker se >50 eventi in coda
```

---

## 8. Sicurezza & Compliance

| Area | Controllo |
|---|---|
| **Transport** | TLS 1.3 ovunque, HSTS, certificate pinning mobile |
| **Auth** | MSAL + JWT validation, token rotation 1h, refresh token 24h |
| **Data at rest** | CMK (Customer Managed Key) su Azure SQL + Storage via Key Vault |
| **Network** | Private Endpoints per DB/Redis/Storage — nessun ingresso pubblico al data tier |
| **Secrets** | Zero secrets in codice — 100% Key Vault con Managed Identity |
| **GDPR** | Right-to-erasure endpoint (`DELETE /me`), data residency EU, DPA contrattuale |
| **Logging** | Audit log immutabile in Log Analytics (90 giorni hot, 2 anni archive) |
| **Vulnerability** | ACR vulnerability scanning, Defender for Containers, SAST CodeQL in CI |
| **Access** | Least-privilege RBAC, PIM per accessi privilegiati, Conditional Access MFA |

---

## 9. CI/CD Pipeline

```
GitHub Mono-repo
├── apps/
│   ├── frontend/        # React 19 + TypeScript (Vite 6)
│   └── backend/         # ASP.NET Core 10 C# (microservizi)
└── infra/               # Bicep (IaC)

PIPELINE: Pull Request
  ├── [frontend]   npm test + ESLint + type-check
  ├── [backend]    dotnet build + dotnet test
  ├── [security]   CodeQL SAST + Trivy container scan
  └── [infra]      bicep lint + what-if preview

PIPELINE: merge → main
  ├── Build Docker images → push to ACR
  ├── Deploy to STAGING (Container Apps staging slot)
  ├── Run smoke tests + Playwright E2E
  └── ✅ Gate: approvazione manuale richiesta per prod

PIPELINE: tag v*.*.* → PRODUCTION
  ├── Blue/Green deploy (Container Apps traffic split)
  ├── 10% canary → monitor App Insights 5 min
  ├── 100% rollover se P95 latency < 200ms
  └── Auto-rollback se error rate > 1%
```

---

## 10. Roadmap Post-Hackathon

```
Q3 2026 — Foundation
  ✓ POC → Production hardening (sicurezza, resilienza, operatività)
  ✓ Azure AD multi-tenant onboarding
  ✓ Calendar integration (Graph API coffee chat scheduling)
  ✓ Teams Tab (Viva Connections widget)
  ✓ Introduzione Azure Service Bus (event-driven architecture)
  ✓ API Management (gateway unificato)

Q4 2026 — Intelligence
  ✓ Semantic matching (embeddings layer via Azure AI Foundry)
  ✓ Icebreaker feed (GPT-4o mini prompts)
  ✓ HR Analytics dashboard (Power BI embedded)
  ✓ Mobile PWA

Q1 2027 — Scale
  ✓ Multi-region Active-Active
  ✓ First external enterprise tenant
  ✓ Real-time collaboration (WebSocket via Container Apps)
  ✓ Azure Marketplace listing
```

---

## 11. Nota Finale — Architettura come Visione Target

> **L'architettura enterprise descritta in questo documento rappresenta la visione target del sistema Hello Work nella sua forma matura.**
>
> La roadmap effettiva di adozione dei singoli componenti dovrà essere definita in un **Assessment Architetturale dedicato**, in funzione dei vincoli tecnici, organizzativi ed economici del cliente. In particolare:
>
> - Non tutti i layer descritti sono necessari fin dalla prima release di produzione
> - L'introduzione di API Management, Service Bus e componenti AI va scaglionata in base al volume effettivo di utilizzo
> - Ogni scelta che devia dall'ecosistema Microsoft-first (es. runtime non .NET, DB non-Azure) richiede una nota di validazione esplicita prima dell'adozione
> - Il modello multi-tenant e le opzioni di isolamento dei dati devono essere definiti in funzione dei requisiti reali di compliance del cliente finale

---

*Hello Work — Enterprise Architecture*
*AGIC — Giugno 2026*
*Gilbert — Solution Architect, AGIC AI Team*
```

---

Entrambi pronti. Nota pratica: i file si trovano già nel tuo workspace locale in `hello-work/docs/` — se il tuo repo `hello-work` è clonato lì, è sufficiente un `git add + commit + push` da quella directory. Se invece il repo è altrove, il contenuto sopra è tutto ciò che serve per creare i file nel posto giusto.
