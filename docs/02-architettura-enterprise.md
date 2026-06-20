# DELIVERABLE 2: Architettura Enterprise Finale — Hello Work

> **Target**: Production-grade, multi-tenant, enterprise-ready.

---

## 1. Layered Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HELLO WORK — ENTERPRISE ARCHITECTURE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│  LAYER 0 — CLIENT TIER                                                       │
│                                                                              │
│   ┌─────────────┐   ┌──────────────┐   ┌───────────────────┐                │
│   │  Web App    │   │  Mobile PWA  │   │  Teams Tab /      │                │
│   │  React 19 + TypeScript (Vite 6) │   │  (SW + WASM) │   │  Viva Connections │                │
│   └──────┬──────┘   └──────┬───────┘   └─────────┬─────────┘                │
└──────────┼─────────────────┼─────────────────────┼──────────────────────────┘
           │ HTTPS           │                      │
┌──────────┼─────────────────┼─────────────────────┼──────────────────────────┐
│  LAYER 1 — INGRESS & EDGE                         │                          │
│           │                │                      │                          │
│   ┌───────▼────────────────▼──────────────────────▼────────┐                │
│   │                 Azure Front Door Premium                │                │
│   │   WAF Policy (OWASP 3.2) · Global Load Balancing        │                │
│   │   CDN (static assets) · DDoS Protection · TLS 1.3       │                │
│   └────────────────────────┬────────────────────────────────┘                │
│                            │  Route rules per region                         │
│           ┌────────────────┴────────────────┐                                │
│           ▼                                 ▼                                │
│     Italy (West Europe)              East EU / Expansion                      │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 2 — API GATEWAY & IDENTITY                                             │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────┐                │
│   │            Azure API Management (Premium)               │                │
│   │  Rate limiting · JWT validation · Subscription keys      │                │
│   │  API versioning · OpenAPI portal · Analytics             │                │
│   └────────────────────────┬────────────────────────────────┘                │
│                            │                                                  │
│   ┌────────────────────────┴────────────────────────────────┐                │
│   │          Azure AD / Entra ID + Entra External ID        │                │
│   │  Internal SSO (corporate) · External tenants (B2B)      │                │
│   │  Conditional Access · MFA · PIM for privileged roles     │                │
│   └─────────────────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 3 — COMPUTE TIER (Azure Container Apps Environment)                   │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ Profile API  │  │ Matching     │  │ WorkMatch    │  │ Groups API   │   │
│   │ (ASP.NET Core 10 C#)    │  │ Engine       │  │ Service      │  │ (ASP.NET Core 10 C#)    │   │
│   │              │  │ (FastAPI +   │  │ (ASP.NET Core 10 C#)    │  │              │   │
│   │ CRUD 3-pillar│  │  Azure AI)   │  │ Swipe FSM   │  │ CRUD + recs  │   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│          │                 │                  │                  │           │
│   ┌──────┴─────────────────┴──────────────────┴──────────────────┴───────┐  │
│   │                  Azure Service Bus (Premium)                          │  │
│   │   match.created · swipe.mutual · group.suggested · notification.push  │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│   │ Notification │  │ Analytics    │  │ Calendar     │                      │
│   │ Worker       │  │ Worker       │  │ Integration  │                      │
│   │ (async)      │  │ (async)      │  │ (Graph API)  │                      │
│   └──────────────┘  └──────────────┘  └──────────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DATA TIER                                                          │
│                                                                              │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────┐  │
│   │  Azure Azure SQL   │   │   Azure Cache for   │   │  Azure AI Search │  │
│   │  Flexible Server HA │   │   Redis (P1)        │   │  (Cognitive      │  │
│   │                     │   │                     │   │   Search)        │  │
│   │  Zone Redundant     │   │  Session cache      │   │  Full-text on    │  │
│   │  PITR 35 days       │   │  Match score cache  │   │  ai_description  │  │
│   │  CMK encryption     │   │  Rate limit buckets │   │  + semantic      │  │
│   │  Read replica       │   └─────────────────────┘   │  vector index    │  │
│   └─────────────────────┘                             └──────────────────┘  │
│                                                                              │
│   ┌─────────────────────┐   ┌─────────────────────┐                          │
│   │  Azure Blob Storage │   │  Azure Data Lake    │                          │
│   │  (ZRS)              │   │  Storage Gen2       │                          │
│   │                     │   │                     │                          │
│   │  Avatars, assets    │   │  Analytics cold     │                          │
│   │  Private endpoint   │   │  storage (Parquet)  │                          │
│   └─────────────────────┘   └─────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 5 — AI & INTELLIGENCE                                                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Azure AI Foundry                                  │   │
│   │                                                                     │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │   │
│   │  │  GPT-4o mini    │  │  Embeddings      │  │  Content Safety  │   │   │
│   │  │  (icebreaker    │  │  text-3-small    │  │  (moderation     │   │   │
│   │  │   prompts,      │  │  (semantic       │  │   profiles &     │   │   │
│   │  │   coffee chat   │  │   match boost)   │  │   descriptions)  │   │   │
│   │  │   suggestions)  │  └─────────────────┘  └──────────────────┘   │   │
│   │  └─────────────────┘                                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 6 — SECURITY & GOVERNANCE                                              │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │  Azure       │  │  Azure       │  │  Microsoft   │  │  Azure       │   │
│   │  Key Vault   │  │  Private     │  │  Defender    │  │  Policy      │   │
│   │  (HSM-backed)│  │  Endpoints   │  │  for Cloud   │  │  + RBAC      │   │
│   │              │  │              │  │              │  │              │   │
│   │  All secrets │  │  No public   │  │  Threat      │  │  Compliance  │   │
│   │  CMK keys    │  │  DB/Redis    │  │  protection  │  │  ISO 27001   │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 7 — OBSERVABILITY                                                      │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │             Azure Monitor — Unified Observability Stack              │   │
│   │                                                                     │   │
│   │  Application Insights  →  Distributed tracing, dependency maps     │   │
│   │  Log Analytics         →  Centralized logs, KQL queries            │   │
│   │  Azure Dashboards      →  SLA/SLO dashboards, business KPIs        │   │
│   │  Alerts + Action Groups→  PagerDuty/Teams integration              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────────────────┐
│  LAYER 8 — CI/CD                                                              │
│                                                                              │
│   GitHub (mono-repo)                                                          │
│       │                                                                       │
│       ├── GitHub Actions                                                      │
│       │      ├── PR: lint + test + SAST (CodeQL) + container scan            │
│       │      ├── main: build → ACR push → staging deploy → smoke test        │
│       │      └── tag: production deploy (Blue/Green via Traffic Split)       │
│       │                                                                       │
│       └── Environments: dev → staging → prod (approval gates)                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Azure Services — Enterprise Complete

### Networking & Edge

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure Front Door Premium** | Premium | Global ingress, WAF, CDN, health probes multi-region |
| **Azure DDoS Protection** | Standard | Network-layer attack mitigation |
| **Azure Private DNS Zones** | — | Name resolution per private endpoints |

### Identity & Access

| Servizio | Tier | Ruolo |
|---|---|---|
| **Microsoft Entra ID** | P2 | Corporate SSO, Conditional Access, PIM |
| **Microsoft Entra External ID** | — | Multi-tenant B2B (aziende clienti) |
| **Azure API Management** | Premium | Gateway unificato, rate limit, API portal |

### Compute

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure Container Apps** | Dedicated (Workload Profiles) | Microservizi ASP.NET Core 10, autoscaling KEDA, ingress managed |
| **Azure Container Registry** | Premium | Registry privato con geo-replication e vulnerability scanning |
| **Azure Service Bus** | Premium | Messaging asincrono tra microservizi (eventi match/notification) |
| **Azure Functions** | Flex Consumption | Background jobs: analytics aggregation, scheduled matching refresh |

### Data

| Servizio | Tier | Ruolo |
|---|---|---|
| **Azure SQL Database Flexible Server** | General Purpose D4s_v3, Zone Redundant HA | OLTP primario, PITR 35gg, CMK encryption |
| **Azure Cache for Redis** | P1 (6GB) | Match score cache, sessioni, rate limiting |
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
| **Azure Alerts + Action Groups** | — | PagerDuty / Teams notification per incidenti |

### Microsoft 365 Integration

| Servizio | Ruolo |
|---|---|
| **Microsoft Graph API** | Sync profili da AAD, Calendar integration per coffee chat |
| **Teams Toolkit** | Hello Work come Teams Tab / Viva Connections widget |
| **Power BI** | HR Analytics dashboard embedded |

---

## 3. Matching Engine — Enterprise (Hybrid)

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
   │  tag overlap    │  │  cosine sim on   │  │  views, swipes,    │
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

---

## 4. Data Flow — WorkMatch Bilateral Match

```
User A swipes RIGHT on User B
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
        │     - "Prenota un caffè ☕ con [Name]!"
        │
        └──► Analytics Worker:
              - Increment match metrics
              - Update recommendation model features
```

---

## 5. Multi-Tenant Architecture

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
│              │   Azure SQL Row-Level       │              │
│              │   Security (tenant_id)       │              │
│              │   Schema isolation per       │              │
│              │   enterprise cliente         │              │
│              └─────────────────────────────┘              │
└────────────────────────────────────────────────────────────┘
```

**Isolamento dati**: Azure SQL Row-Level Security su `tenant_id` — un singolo cluster, zero data leakage tra tenant.

---

## 6. Scalabilità

| Dimensione | POC | Enterprise Target |
|---|---|---|
| **Utenti attivi** | 50 (demo) | 10,000 / tenant, 1M+ totali |
| **Concurrent users** | 10 | 5,000 |
| **API throughput** | 10 req/s | 10,000 req/s (APIM + CAps scaling) |
| **Match computation** | In-request | Pre-computed + Redis cache, batch refresh ogni 4h |
| **DB connections** | 5 | PgBouncer pooler (Container Apps sidecar) |
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
      messageCount: "50"   # scale worker if >50 pending events
```

---

## 7. Sicurezza & Compliance

| Area | Controllo |
|---|---|
| **Transport** | TLS 1.3 ovunque, HSTS, certificate pinning mobile |
| **Auth** | MSAL + JWT validation, token rotation 1h, refresh token 24h |
| **Data at rest** | CMK (Customer Managed Key) su Azure SQL + Storage via Key Vault |
| **Network** | Private Endpoints per DB/Redis/Storage — nessun ingresso pubblico al data tier |
| **Secrets** | Zero secrets in codice — 100% Key Vault con Managed Identity |
| **GDPR** | Right-to-erasure endpoint (`DELETE /me`), data residency EU, DPA contrattuale |
| **Logging** | Audit log immutabile in Log Analytics (90 days hot, 2 years archive) |
| **Vulnerability** | ACR vulnerability scanning, Defender for Containers, SAST CodeQL in CI |
| **Access** | Least-privilege RBAC, PIM per accessi privilegiati, Conditional Access MFA |

---

## 8. CI/CD Pipeline

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
  └── ✅ Gate: manual approval required for prod

PIPELINE: tag v*.*.* → PRODUCTION
  ├── Blue/Green deploy (Container Apps traffic split)
  ├── 10% canary → monitor App Insights 5 min
  ├── 100% rollover if P95 latency < 200ms
  └── Auto-rollback if error rate > 1%
```

---

## 9. Roadmap Post-Hackathon

```
Q3 2026 — Foundation
  ✓ POC → Production hardening
  ✓ Azure AD multi-tenant onboarding
  ✓ Calendar integration (Graph API coffee chat scheduling)
  ✓ Teams Tab (Viva Connections widget)

Q4 2026 — Intelligence
  ✓ Semantic matching (embeddings layer)
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

*Gilbert — Solution Architect, AGIC AI Team*
*Documento generato il 20 giugno 2026 per Hello Work Hackathon*
