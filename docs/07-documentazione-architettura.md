# Hello Work — Infrastructure Design Document

**Version:** 0.3 (Draft)
**Date:** 2026-06-20
**Author:** Infrastructure Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Logical Architecture](#2-logical-architecture)
3. [Physical Architecture](#3-physical-architecture)
4. [Network and Security](#4-network-and-security)
5. [Resource Inventory](#5-resource-inventory)
6. [Deployment and Automation](#6-deployment-and-automation)
7. [Monitoring, Logging and Alerts](#7-monitoring-logging-and-alerts)
8. [Business Continuity and Disaster Recovery](#8-business-continuity-and-disaster-recovery)
9. [Cost Estimation](#9-cost-estimation)
10. [GDPR and Data Privacy](#10-gdpr-and-data-privacy)
11. [Enterprise Roadmap](#11-enterprise-roadmap)

---

## 1. Executive Summary

Hello Work is an internal single-page application that enables employees to discover colleagues from two complementary perspectives: **technical** (skills, technology stack, business area) and **human** (passions, hobbies, interests). The platform addresses a real organisational need — making it easier for Project Managers, team leads, and individual contributors to understand who knows what and who shares which interests, reducing friction in team formation and cross-functional collaboration.

The application targets approximately **1,000 internal users**. Authentication is handled exclusively through the company's existing Azure Active Directory / Entra ID tenant, meaning no separate credential management is required and onboarding is frictionless — employees log in with their company account.

Profile data is organised around **three pillars**: Professional (skills, role, certifications), Agentic (AI tools, workflows), and Human (hobbies, interests). An **affinity score** computed via deterministic Jaccard similarity ranks colleagues by relevance. Once a bilateral WorkMatch occurs, **Azure OpenAI GPT-4o** generates a personalised coffee chat suggestion for the matched pair.

A single **Azure Front Door Standard** instance with an attached **WAF policy** acts as the sole public ingress point for the entire platform, providing OWASP-level protection, DDoS mitigation, and TLS termination at the global edge. Both the SPA and the API are private origins behind Front Door — neither is directly reachable from the internet.

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | Azure PostgreSQL Flexible Server |
| AI / Suggestions | Azure OpenAI — GPT-4o (coffee chat suggestions only) |
| Auth | Azure AD / Entra ID + MSAL.js |
| Hosting | Azure Static Web Apps (SPA), Azure Container Apps (API) |
| Storage | Azure Blob Storage (avatars, assets) |
| Maps | Azure Maps Gen 2 S0 (Office Map) |
| Ingress / WAF | Azure Front Door Standard + WAF Policy |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Monitoring | Application Insights + Log Analytics Workspace |

---

## 2. Logical Architecture

### 2.1 Components

The system is composed of eight logical components with clearly defined responsibilities and interfaces.

**SPA (Frontend)**
The single-page application is the only user-facing interface. It is built on Next.js 14 and handles rendering of all views: Discovery Home, profile editing, WorkMatch swipe UI, Group pages, Office Map, and Agentic Knowledge Repository. It manages the Azure AD authentication flow via MSAL.js and communicates exclusively with the Backend API over HTTPS. No direct calls to the database, OpenAI, or Azure Maps are made from the browser. All traffic is routed through Front Door.

**Edge / WAF Layer**
Azure Front Door Standard sits in front of both the SPA and the API. It terminates TLS, enforces the WAF policy (Microsoft DefaultRuleSet 2.1 — OWASP 3.2 equivalent), applies rate limiting, and routes requests based on path prefix: `/*` to the Static Web App origin and `/api/*` to the Container App origin. It is the only component with a public IP.

**Backend API**
A FastAPI (Python 3.12) application that exposes a REST interface across five functional modules: Profiles, Matches, WorkMatch, Groups, Office Map, and the Agentic Knowledge Repository. It is the sole integration point between all backend services. Authentication is enforced at the platform level via JWT validation middleware (AAD JWKS). It reads user identity from Azure AD token claims, manages all database reads and writes via SQLAlchemy (async), and calls Azure OpenAI exclusively to generate post-match coffee chat suggestions. Its ingress is locked to accept traffic from Azure Front Door only.

**Matching Engine**
A logical component implemented as a dedicated endpoint (`GET /api/matches`) inside the Backend API. It computes a weighted Jaccard similarity score across the three profile pillars for every pair of users and returns a ranked list. The algorithm is fully deterministic — no ML, no external calls. Computed scores are cached in the `match_cache` table with a configurable TTL (default: 1 hour) to avoid repeated computation. See §2.3 for the algorithm detail.

**WorkMatch Module**
Implements the bilateral swipe state machine (`/api/workmatch`). It records swipe events in `workmatch_swipes` and triggers a bilateral match when both users have swiped right on each other. On match creation it inserts a row into `matches` and calls Azure OpenAI to generate a personalised coffee chat suggestion prompt based on shared tags.

**Data Layer**
Azure PostgreSQL Flexible Server, accessed exclusively by the Backend API via SQLAlchemy and the asyncpg driver. The schema spans six tables (see §2.2). The server is not reachable from the public internet.

**Storage Layer**
Azure Blob Storage holds user avatar images and any static assets uploaded through the application (e.g., AKR attachments). The Container App accesses the storage account via its system-assigned managed identity — no connection string or SAS token required. A private endpoint is used to keep traffic off the public internet.

**Office Map**
Azure Maps Gen 2 (S0) provides the tile layer and clustering API for the office map feature. The API key is stored in Key Vault and injected into the Container App at startup. The map renders AGIC office locations (Italy + Tirana) using a static GeoJSON file; people clusters are computed server-side and returned by `GET /api/map/clusters`.

**Identity Provider**
Azure AD / Entra ID is used both for authentication (issuing tokens) and as the authoritative source of professional data (`display_name`, `email`, `department`, `office_location`, `role`) injected into profiles at first login via token claims.

### 2.2 Data Model

All tables use snake\_case column names consistent with the canonical Python schema defined in `docs/03-architettura-poc.md`.

#### Table: `users`

One row per user. Holds all three profile pillars.

```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
aad_oid          TEXT UNIQUE NOT NULL          -- Azure AD Object ID (immutable key)
display_name     TEXT                          -- from AAD claim
email            TEXT                          -- from AAD claim
office_location  TEXT                          -- AGIC office (Milano, Roma, Tirana…)
avatar_url       TEXT NULL                     -- Blob Storage URL
-- Pillar 1: Professional (pre-populated from AAD + user-editable)
role             TEXT                          -- from AAD jobTitle claim
department       TEXT                          -- from AAD department claim
skills           TEXT[]                        -- e.g. ["Azure", "Terraform", "Python"]
certifications   TEXT[]                        -- e.g. ["AZ-900", "PMP"]
-- Pillar 2: Agentic
ai_tools         TEXT[]                        -- e.g. ["Claude", "Copilot", "n8n"]
ai_description   TEXT NULL                     -- free text (max 2000 chars)
-- Pillar 3: Human
hobbies          TEXT[]                        -- e.g. ["Photography", "Hiking"]
interests        TEXT[]                        -- e.g. ["AI Ethics", "Board Games"]
created_at       TIMESTAMPTZ DEFAULT now()
updated_at       TIMESTAMPTZ DEFAULT now()
```

#### Table: `workmatch_swipes`

Records every swipe action. Used to drive the bilateral match logic.

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
swiper_id   UUID REFERENCES users(id)
target_id   UUID REFERENCES users(id)
direction   TEXT CHECK (direction IN ('like', 'pass'))
created_at  TIMESTAMPTZ DEFAULT now()
UNIQUE (swiper_id, target_id)
```

#### Table: `matches`

Created when two users both swipe right on each other.

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_a        UUID REFERENCES users(id)
user_b        UUID REFERENCES users(id)
match_score   FLOAT                         -- composite Jaccard score at match time
status        TEXT DEFAULT 'pending'        -- pending / coffee_scheduled / connected
created_at    TIMESTAMPTZ DEFAULT now()
```

#### Table: `groups`

User-created or system-suggested interest communities.

```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                 TEXT NOT NULL
description          TEXT NULL
tags                 TEXT[]                -- used for suggestion engine
created_by           UUID REFERENCES users(id)
is_system_suggested  BOOLEAN DEFAULT false
member_count         INT DEFAULT 0
```

#### Table: `group_members`

```sql
group_id   UUID REFERENCES groups(id)
user_id    UUID REFERENCES users(id)
joined_at  TIMESTAMPTZ DEFAULT now()
PRIMARY KEY (group_id, user_id)
```

#### Table: `akr_entries` _(Agentic Knowledge Repository)_

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         TEXT NOT NULL
description   TEXT NULL                     -- rich text, max 5000 chars
ai_tools      TEXT[]                        -- tools featured in the entry
author_id     UUID REFERENCES users(id)
views         INT DEFAULT 0
is_approved   BOOLEAN DEFAULT false         -- moderator gate
published_at  TIMESTAMPTZ DEFAULT now()
```

#### Table: `match_cache`

Application-level cache for computed Jaccard scores. Avoids re-computing the full N×N matrix on every request.

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id)
results       JSONB                         -- [{userId, score, reasons: {professional, agentic, human}}, ...]
generated_at  TIMESTAMPTZ DEFAULT now()
expires_at    TIMESTAMPTZ                   -- TTL enforced at application level on read
```

**Notes:**
- `TEXT[]` native arrays are natively supported via asyncpg — SQLAlchemy maps them directly.
- `results` in `match_cache` is stored as JSONB because its shape includes per-pillar breakdown strings that do not require relational querying.
- SQLAlchemy Alembic migrations manage schema evolution — no manual DDL.
- AAD claims (`display_name`, `email`, `office_location`, `role`, `department`) are upserted on every login; the user only fills in `skills`, `certifications`, `ai_tools`, `ai_description`, `hobbies`, `interests`, and optionally `avatar_url`.

### 2.3 Matching Algorithm

The affinity score is a weighted Jaccard similarity computed deterministically across the three pillars. No ML or external API call is involved.

```python
def compute_match_score(user_a: User, user_b: User) -> float:
    """
    Weighted Jaccard similarity across all 3 pillars.
    Deterministic, fast, zero external dependencies, explainable.
    """
    weights = {"professional": 0.40, "agentic": 0.35, "human": 0.25}

    def jaccard(set_a: set, set_b: set) -> float:
        if not set_a and not set_b:
            return 0.0
        return len(set_a & set_b) / len(set_a | set_b)

    score = (
        weights["professional"] * jaccard(
            set(user_a.skills + user_a.certifications),
            set(user_b.skills + user_b.certifications)
        ) +
        weights["agentic"] * jaccard(
            set(user_a.ai_tools),
            set(user_b.ai_tools)
        ) +
        weights["human"] * jaccard(
            set(user_a.hobbies + user_a.interests),
            set(user_b.hobbies + user_b.interests)
        )
    )
    return round(score, 4)
```

**Weights are configurable** (`DIS-10`) via environment variable without a deployment. Pillar weights default to 40 / 35 / 25 but can be overridden at runtime.

**Azure OpenAI (GPT-4o) is used exclusively for post-match coffee chat suggestion generation** — a single call per bilateral match event, not per search request. This keeps OpenAI costs minimal and latency bounded.

### 2.4 Logical Data Flow

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────┐   ┌─────────────┐
│  Browser        │   │  Backend API    │   │ PostgreSQL  │   │ Azure OpenAI│
│  (Next.js 14)   │   │  (FastAPI)      │   │             │   │  GPT-4o     │
└────────┬────────┘   └────────┬────────┘   └──────┬──────┘   └──────┬──────┘
         │                     │                   │                  │
         │ 1. Login (MSAL)     │                   │                  │
         │────────────────────►│                   │                  │
         │                     │ 2. Validate JWT   │                  │
         │                     │   (AAD JWKS)      │                  │
         │                     │                   │                  │
         │ 3. GET /api/profiles/me                  │                  │
         │────────────────────►│                   │                  │
         │                     │ 4. Upsert user    │                  │
         │                     │   from AAD claims │                  │
         │                     │──────────────────►│                  │
         │ 5. Profile data     │                   │                  │
         │◄────────────────────│                   │                  │
         │                     │                   │                  │
         │ 6. GET /api/matches │                   │                  │
         │────────────────────►│                   │                  │
         │                     │ 7. Check cache    │                  │
         │                     │──────────────────►│                  │
         │                     │  (cache miss)     │                  │
         │                     │ 8. Fetch all users│                  │
         │                     │──────────────────►│                  │
         │                     │ 9. Compute Jaccard scores (in-process, no I/O)
         │                     │──────────────────►│                  │
         │                     │ 10. Cache results │                  │
         │                     │──────────────────►│                  │
         │ 11. Ranked matches  │                   │                  │
         │◄────────────────────│                   │                  │
         │                     │                   │                  │
         │ 12. POST /api/workmatch { targetId, direction: 'like' }    │
         │────────────────────►│                   │                  │
         │                     │ 13. Insert swipe  │                  │
         │                     │──────────────────►│                  │
         │                     │ 14. Check mutual  │                  │
         │                     │──────────────────►│                  │
         │                     │  (bilateral match)│                  │
         │                     │ 15. Insert match  │                  │
         │                     │──────────────────►│                  │
         │                     │ 16. Generate coffee chat suggestion  │
         │                     │──────────────────────────────────────►│
         │                     │ 17. Personalised prompt              │
         │                     │◄──────────────────────────────────────│
         │ 18. Match + suggestion            │                         │
         │◄────────────────────│                   │                  │
```

---

## 3. Physical Architecture

### 3.1 Azure Resource Topology

All resources are deployed into a single **Azure Resource Group** (`rg-hellowork`) in the **West Europe** region. Azure Front Door operates at the Azure global edge (region-independent). The Container Apps Environment, PostgreSQL server, and Blob Storage private endpoint are placed inside an **Azure Virtual Network** to ensure private communication.

```
Internet
    │
    ▼
┌──────────────────────────────────────────┐
│  Azure Front Door Standard               │  (Global edge — no region)
│  WAF Policy (OWASP 3.2)                  │
│  Route: /*       → Static Web App origin │
│  Route: /api/*   → Container App origin  │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
[stapp-hellowork]    [ca-hellowork-api]
 Static Web Apps       Container App
 (Next.js 14 SPA)      (FastAPI — ingress locked
                        to Front Door via X-Azure-FDID
                        + AzureFrontDoor.Backend
                        service tag)

Azure Subscription
└── rg-hellowork  (Resource Group — West Europe)
    │
    ├── afd-hellowork               (Front Door Standard profile)
    │   └── wafpol-hellowork        (WAF Policy)
    │
    ├── vnet-hellowork              (Virtual Network: 10.0.0.0/16)
    │   ├── snet-containerapp       (10.0.1.0/24)  ← Container Apps Env
    │   ├── snet-postgres           (10.0.2.0/24)  ← PostgreSQL delegated subnet
    │   └── snet-storage            (10.0.3.0/24)  ← Blob Storage private endpoint
    │
    ├── stapp-hellowork             (Static Web Apps — Free)
    │
    ├── cae-hellowork               (Container Apps Environment — Consumption)
    │   └── ca-hellowork-api        (Container App — FastAPI Python 3.12)
    │
    ├── acr-hellowork               (Container Registry — Basic)
    │
    ├── psql-hellowork              (PostgreSQL Flexible Server — B2ms)
    │
    ├── st-hellowork                (Storage Account — LRS Hot)
    │   └── [blob: avatars, assets] (private endpoint in snet-storage)
    │
    ├── maps-hellowork              (Azure Maps — Gen 2 S0)
    │
    ├── aoai-hellowork              (Azure OpenAI — Standard S0)*
    │   └── gpt-4o deployment
    │
    ├── kv-hellowork                (Key Vault — Standard)
    │
    ├── appi-hellowork              (Application Insights)
    └── law-hellowork               (Log Analytics Workspace)
```

> \*Azure OpenAI GPT-4o availability may require Sweden Central or East US depending on regional quota.

> The draw.io diagram illustrating this topology with Azure icons, VNet boundaries, and connection lines will be produced separately.

### 3.2 Component–Resource Mapping

| Logical Component | Azure Resource | Runtime |
|---|---|---|
| Edge / WAF | Azure Front Door Standard + WAF Policy | — |
| SPA | Azure Static Web Apps (`stapp-hellowork`) | Next.js 14 / TypeScript / Tailwind CSS |
| Backend API + All Modules | Azure Container App (`ca-hellowork-api`) | Python 3.12 / FastAPI |
| Data Layer | Azure PostgreSQL Flexible Server (`psql-hellowork`) | PostgreSQL 16 |
| File Storage | Azure Blob Storage (`st-hellowork`) | — |
| Office Map | Azure Maps (`maps-hellowork`) | Gen 2 S0 |
| Identity Provider | Azure AD / Entra ID | (existing tenant) |
| AI / Coffee Chat | Azure OpenAI (`aoai-hellowork`) — GPT-4o | — |
| Secret Store | Azure Key Vault (`kv-hellowork`) | — |
| Image Registry | Azure Container Registry (`acr-hellowork`) | — |
| Monitoring | Application Insights (`appi-hellowork`) + Log Analytics (`law-hellowork`) | — |

---

## 4. Network and Security

### 4.1 Network Topology

```
                         [ Internet ]
                               │
                    ┌──────────▼──────────┐
                    │  Azure Front Door   │  ← Public entry point
                    │  + WAF Policy       │     (global edge PoPs)
                    └──────┬──────────────┘
                           │
              ┌────────────┴─────────────┐
              │                          │
   ┌──────────▼──────────┐  ┌────────────▼────────────┐
   │  Static Web Apps    │  │  Container App ingress  │
   │  (Next.js SPA)      │  │  (restricted to AFD     │
   └─────────────────────┘  │   via X-Azure-FDID +    │
                             │   service tag filter)   │
                             └────────────┬────────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │  vnet-hellowork (10.0.0.0/16)  │
                          │                                │
                          │  snet-containerapp             │
                          │  (10.0.1.0/24)                 │
                          │  ┌──────────────────────┐     │
                          │  │ Container Apps Env   │     │
                          │  │  ca-hellowork-api    │     │
                          │  └──────────┬───────────┘     │
                          │             │                  │
                          │  snet-postgres                 │
                          │  (10.0.2.0/24 — delegated)    │
                          │  ┌──────────▼───────────┐     │
                          │  │  psql-hellowork       │     │
                          │  └──────────────────────┘     │
                          │                                │
                          │  snet-storage                  │
                          │  (10.0.3.0/24)                 │
                          │  ┌──────────────────────┐     │
                          │  │  st-hellowork         │     │
                          │  │  (private endpoint)   │     │
                          │  └──────────────────────┘     │
                          │                                │
                          │  Private endpoints             │
                          │  kv-hellowork  (Key Vault)     │
                          └────────────────────────────────┘
```

- **PostgreSQL** uses VNet integration via a delegated subnet — no public endpoint.
- **Blob Storage** is accessed via a private endpoint in `snet-storage` — avatars and assets are never served directly from the internet (served via SPA through the API or pre-signed URLs).
- **Key Vault** is accessed via a private endpoint inside `snet-containerapp`.
- **Azure OpenAI**, **Azure Maps**, and **Azure Container Registry** are reached over their public endpoints; access is restricted to the Container App's managed identity only (no anonymous access).
- The **Container App ingress** is locked using two complementary controls: the `X-Azure-FDID` header (validated on every inbound request by a FastAPI middleware) and an ingress IP restriction using the `AzureFrontDoor.Backend` service tag. Requests that bypass Front Door receive `403 Forbidden`.

### 4.2 Azure Front Door + WAF Configuration

| Setting | Value |
|---|---|
| Tier | Standard |
| WAF Policy mode | Prevention |
| WAF managed ruleset | Microsoft_DefaultRuleSet 2.1 (OWASP 3.2 equivalent) |
| Custom rules | Rate limit: max 100 req/min per IP |
| HTTPS enforcement | Redirect HTTP → HTTPS at edge |
| Minimum TLS version | 1.2 (TLS 1.3 negotiated where client supports it) |
| Origin group: SPA | `stapp-hellowork.azurestaticapps.net` |
| Origin group: API | Container App FQDN (internal) |
| Routing rule: SPA | Pattern `/*`, priority 200 |
| Routing rule: API | Pattern `/api/*`, priority 100 |

### 4.3 Authentication and Authorisation

| Layer | Mechanism |
|---|---|
| SPA → Azure AD | MSAL.js Authorization Code Flow with PKCE |
| SPA → Backend API | Bearer token in `Authorization` header |
| Backend API token validation | JWT validation middleware (AAD JWKS) — FastAPI dependency injection |
| API → PostgreSQL | Connection string from Key Vault via managed identity |
| API → Azure OpenAI | Managed identity — no API key |
| API → Blob Storage | System-assigned managed identity (`Storage Blob Data Contributor`) |
| API → Key Vault | System-assigned managed identity |
| API → ACR (image pull) | System-assigned managed identity |
| API → Azure Maps | API key from Key Vault (Maps does not support managed identity on Gen 2 S0) |

No secrets are stored in environment variables, application configuration files, or GitHub Actions secrets — except the Azure service principal credentials used for OIDC federation in the CI/CD pipeline.

### 4.4 Identity and Access Management (RBAC)

| Principal | Role | Scope |
|---|---|---|
| `ca-hellowork-api` managed identity | `Key Vault Secrets User` | `kv-hellowork` |
| `ca-hellowork-api` managed identity | `Cognitive Services OpenAI User` | `aoai-hellowork` |
| `ca-hellowork-api` managed identity | `Storage Blob Data Contributor` | `st-hellowork` |
| `ca-hellowork-api` managed identity | `AcrPull` | `acr-hellowork` |
| GitHub Actions service principal | `Contributor` | `rg-hellowork` |
| GitHub Actions service principal | `AcrPush` | `acr-hellowork` |

### 4.5 Transport Security

- All public traffic terminates at Azure Front Door with TLS 1.2 minimum. HTTP is redirected to HTTPS at the edge. TLS 1.3 is negotiated where supported by the client.
- Communication between the Container App and PostgreSQL travels over the private VNet.
- Communication between the Container App and Blob Storage travels over a private endpoint.
- Communication between the Container App and Key Vault travels over a private endpoint.
- End-to-end encryption is maintained between Front Door and origins using HTTPS re-encryption (not SSL offload only).
- Azure PostgreSQL Flexible Server enforces a minimum server-side TLS version of 1.2 — connections below TLS 1.2 are rejected.

---

## 5. Resource Inventory

| Resource Name | Type | SKU / Tier | Region | Purpose |
|---|---|---|---|---|
| `rg-hellowork` | Resource Group | — | West Europe | Logical container for all resources |
| `afd-hellowork` | Front Door | Standard | Global | Single public ingress, WAF, routing |
| `wafpol-hellowork` | WAF Policy | Standard | Global | OWASP ruleset, rate limiting |
| `vnet-hellowork` | Virtual Network | — | West Europe | Private networking (10.0.0.0/16) |
| `snet-containerapp` | Subnet | — | West Europe | Container Apps Environment (10.0.1.0/24) |
| `snet-postgres` | Subnet (delegated) | — | West Europe | PostgreSQL VNet integration (10.0.2.0/24) |
| `snet-storage` | Subnet | — | West Europe | Blob Storage private endpoint (10.0.3.0/24) |
| `stapp-hellowork` | Static Web Apps | Free | Global CDN | Next.js 14 SPA hosting |
| `cae-hellowork` | Container Apps Environment | Consumption | West Europe | Shared env for Container Apps |
| `ca-hellowork-api` | Container App | Consumption | West Europe | FastAPI Python 3.12 — all API modules |
| `acr-hellowork` | Container Registry | Basic | West Europe | Docker image storage for API |
| `psql-hellowork` | PostgreSQL Flexible Server | Burstable B2ms | West Europe | Application database (all tables) |
| `st-hellowork` | Storage Account | LRS Hot | West Europe | Avatar images, AKR attachments |
| `maps-hellowork` | Azure Maps | Gen 2 S0 | Global | Office Map tiles and people clustering |
| `aoai-hellowork` | Azure OpenAI | Standard S0 | Sweden Central* | GPT-4o for coffee chat suggestions |
| `kv-hellowork` | Key Vault | Standard | West Europe | Secrets (DB string, Maps key) |
| `appi-hellowork` | Application Insights | Pay-as-you-go | West Europe | Application telemetry and tracing |
| `law-hellowork` | Log Analytics Workspace | Pay-as-you-go | West Europe | Logs backend for App Insights and alerts |

\*Azure OpenAI GPT-4o availability may require Sweden Central or East US depending on regional quota.

---

## 6. Deployment and Automation

### 6.1 Terraform Structure

Infrastructure is fully codified in Terraform using the `azurerm` provider. Remote state is stored in an **Azure Storage Account** (pre-created manually, outside the main resource group) with blob lease-based state locking — no external locking backend required.

```
infra/
├── main.tf                        # Provider config, backend block, resource group
├── variables.tf                   # Input variable declarations
├── outputs.tf                     # Output values (FQDNs, ACR login server, etc.)
├── terraform.tfvars.example       # Documented example variable file (no secrets, checked in)
│
├── modules/
│   ├── networking/                # VNet, subnets, NSGs
│   ├── frontdoor/                 # Front Door profile, endpoint, origin groups,
│   │                              #   routing rules, WAF policy
│   ├── container_apps/            # Container Apps Environment + Container App
│   ├── container_registry/        # ACR + role assignments
│   ├── postgresql/                # Flexible Server, delegated subnet, DB
│   ├── blob_storage/              # Storage Account, containers, private endpoint
│   ├── maps/                      # Azure Maps resource
│   ├── openai/                    # Azure OpenAI resource + GPT-4o model deployment
│   ├── keyvault/                  # Key Vault, private endpoint, secrets
│   └── monitoring/                # Application Insights + Log Analytics Workspace
│
└── environments/
    ├── dev.tfvars                 # Development variable overrides
    └── prod.tfvars                # Production variable overrides
```

Terraform workspaces or separate `.tfvars` files (`dev.tfvars`, `prod.tfvars`) isolate variable values between environment configurations while sharing the same physical infrastructure.

### 6.2 GitHub Actions Pipelines

**Pipeline 1 — Infrastructure (`infra-deploy.yml`)**

Triggered on push to `main` for changes under `infra/**`.

```yaml
trigger: push to main (infra/**)

steps:
  1. Checkout repository
  2. Azure login via OIDC (Workload Identity Federation — no long-lived secrets)
  3. terraform init        (backend: Azure Storage Account with blob state locking)
  4. terraform validate
  5. terraform plan        (output saved as pipeline artifact for review)
  6. terraform apply -auto-approve   (main branch only)
```

**Pipeline 2 — Backend API (`api-deploy.yml`)**

Triggered on push to `main` for changes under `src/backend/**`.

```yaml
trigger: push to main (src/backend/**)

steps:
  1. Checkout repository
  2. Setup Python 3.12
  3. pip install -r requirements.txt
  4. pytest                          (unit + integration tests)
  5. docker build -t acr-hellowork.azurecr.io/hellowork-api:${{ github.sha }}
  6. Azure login via OIDC
  7. docker push → acr-hellowork
  8. az containerapp update --image acr-hellowork.azurecr.io/hellowork-api:${{ github.sha }}
```

**Pipeline 3 — Frontend (`spa-deploy.yml`)**

Triggered on push to `main` for changes under `src/frontend/**`.

```yaml
trigger: push to main (src/frontend/**)

steps:
  1. Checkout repository
  2. Setup Node.js 22
  3. npm ci
  4. npm run lint && npm run type-check
  5. npm run build          (Next.js outputs to .next/ — Static Web Apps handles SSG/SSR)
  6. Deploy to Azure Static Web Apps (azure/static-web-apps-deploy action)
```

All three pipelines authenticate to Azure using **OIDC federated credentials** (Workload Identity Federation). No client secrets or certificates are stored in GitHub Actions secrets.

### 6.3 Environment Management

A single set of Azure resources is deployed (`rg-hellowork`). Environment isolation (development, testing, production) is managed at the **application configuration level** rather than through separate infrastructure deployments. This keeps infrastructure costs minimal and eliminates environment drift.

| Mechanism | How It Works |
|---|---|
| `APP_ENV` env var | Set to `development` or `production` on the Container App; gates feature flags and log verbosity |
| Key Vault secret naming | Secrets are namespaced (`db-conn-dev`, `db-conn-prod`) and selected by the application at startup based on `APP_ENV` |
| Database schemas | Development and production data coexist in separate PostgreSQL schemas (`app_dev`, `app_prod`), switched via the SQLAlchemy connection URL |
| Branch-based CI/CD | Pushes to `develop` branch deploy with `APP_ENV=development`; pushes to `main` deploy with `APP_ENV=production` |

This approach provides environment isolation without the cost and operational overhead of duplicate infrastructure.

---

## 7. Monitoring, Logging and Alerts

### 7.1 Performance SLA Targets

These targets are derived from the functional requirements (`docs/01-analisi-funzionale.md`, §4.1) and used as alert thresholds.

| Metric | Target | Notes |
|---|---|---|
| Discovery Home load (p95) | < 2 seconds | End-to-end, including API call |
| Matching computation | < 500 ms | For a pool of 1,000 users |
| Search results | < 1 second | Full-text + filter query |
| Concurrent users (POC) | 500 | Container Apps scales horizontally |
| Concurrent users (v1.0) | 5,000 | Via KEDA autoscaling rules |

### 7.2 Application Insights Configuration

The Container App is instrumented with the **OpenCensus Azure Monitor exporter for Python** (compatible with FastAPI). The connection string is retrieved from Key Vault at startup via the managed identity. The following telemetry is collected automatically:

- HTTP request traces (method, URL, status code, duration)
- Dependency calls (PostgreSQL queries via SQLAlchemy, Azure OpenAI HTTP calls, Blob Storage calls)
- Exceptions and full tracebacks
- Custom events emitted by the application:

| Custom Event | When Fired |
|---|---|
| `MatchCacheHit` | Cached Jaccard scores returned without recomputation |
| `MatchCacheMiss` | No valid cache — full Jaccard computation triggered |
| `BilateralMatchCreated` | Both users have swiped right — `matches` row inserted |
| `CoffeeChatSuggestionGenerated` | OpenAI call succeeded post-match |
| `ProfileCreated` | New user row inserted on first login |
| `ProfileUpdated` | User saves changes to tags or pillars |
| `AKREntryPublished` | New Agentic Knowledge Repository entry created |
| `GroupCreated` | New group created (user or system) |

The Static Web App emits **browser telemetry** (page views, JS errors, SPA navigation timing) via the Application Insights JavaScript snippet included in the Next.js build.

### 7.3 Key Log Analytics Queries / Dashboards

| Dashboard | Query Purpose |
|---|---|
| API Availability | Requests with `resultCode >= 500` over time |
| Match endpoint latency | `GET /api/matches` duration at p50 / p95 / p99 |
| Jaccard computation time | Custom dependency duration for in-process scoring |
| OpenAI call duration | Dependency duration for `aoai-hellowork` (post-match only) |
| Cache hit rate | Ratio of `MatchCacheHit` to `MatchCacheHit + MatchCacheMiss` |
| Active users (7d) | Unique `user_Id` values in request telemetry over a rolling 7-day window |
| WorkMatch funnel | `BilateralMatchCreated` / total swipes — conversion rate |
| WAF blocked requests | Front Door diagnostic logs — requests blocked by WAF rules |

### 7.4 Alerts

All alerts route to an **Azure Action Group** (`ag-hellowork-oncall`) configured with email notification and an optional Microsoft Teams incoming webhook.

| Alert Name | Condition | Evaluation Window | Severity | Action |
|---|---|---|---|---|
| API Error Rate High | >5% of requests return HTTP 5xx | 5 min | Sev 2 | Email + Teams |
| Container App Unavailable | 0 running replicas for >2 min | 2 min | Sev 1 | Email + Teams |
| Discovery Home Latency | p95 response time >2 s | 5 min | Sev 2 | Email |
| PostgreSQL CPU Spike | CPU >80% sustained | 10 min | Sev 3 | Email |
| OpenAI Latency Degraded | p95 dependency duration >15 s | 10 min | Sev 3 | Email |
| Key Vault Access Denied | Any HTTP 403 from Key Vault | 1 min | Sev 2 | Email |
| WAF Block Rate Spike | >50 WAF-blocked requests in 5 min | 5 min | Sev 2 | Email + Teams |
| Blob Storage Errors | >10 HTTP 5xx from storage in 5 min | 5 min | Sev 3 | Email |

---

## 8. Business Continuity and Disaster Recovery

### 8.1 RTO / RPO Targets

| Metric | Target | Rationale |
|---|---|---|
| RTO (Recovery Time Objective) | < 30 minutes | Acceptable for an internal productivity tool |
| RPO (Recovery Point Objective) | < 24 hours | Daily automated backups sufficient given data criticality |

### 8.2 PostgreSQL Backup and Restore

Azure PostgreSQL Flexible Server provides automated backups with:

- **Frequency:** Full backup weekly, incremental daily, transaction log backup every 5 minutes
- **Retention:** 7 days (configurable up to 35 days)
- **Geo-redundant backup storage:** Disabled (single-region acceptable for v1)
- **Point-in-time restore:** Available for any point within the retention window
- **Restore procedure:** New Flexible Server instance from backup → update Key Vault connection string secret → Container App picks up new value on next revision restart

### 8.3 Blob Storage Recovery

Azure Blob Storage (LRS) does not replicate to a second region (acceptable for POC). Soft delete is enabled with a 7-day retention window for accidental deletion protection. In a total region failure, avatars would be regenerated by re-uploading; the impact is cosmetic only.

### 8.4 Container App Recovery

Container Apps runs on Azure's managed infrastructure with built-in replica restart on crash. In a full-region failure scenario:

1. The latest Docker image is already present in ACR from the last CI/CD run
  2. Re-run `terraform apply -var-file=prod.tfvars` targeting an alternative region
3. Update the Static Web App linked backend URL and the Front Door origin FQDN

Estimated time: 15–25 minutes, within the 30-minute RTO.

### 8.5 Static Web App and Front Door

**Azure Static Web Apps** is globally distributed and inherently resilient to single-region failures.

**Azure Front Door** operates across Azure's global edge PoPs with automatic failover between them.

### 8.6 Accepted Limitations (v1)

| Limitation | Mitigation |
|---|---|
| Single-region deployment (West Europe) | Acceptable for an internal tool; active-active multi-region is a v2 consideration |
| No geo-redundant PostgreSQL replica | Point-in-time restore covers the RPO target |
| Blob Storage is LRS (no geo-replication) | Data is non-critical (avatar images); acceptable for v1 |
| Match cache is not persisted across DB restores | Scores are recomputed on first request after restore — acceptable latency spike |
| No automated failover runbook | Manual steps documented in §8.4 |

---

## 9. Cost Estimation

All prices are approximate public list prices for the **West Europe** Azure region on a monthly basis, denominated in **EUR**. Actual costs depend on usage patterns. Container Apps scales to zero replicas when idle, so overnight and weekend costs are significantly lower.

Reference scenario: **~1,000 internal users**, matching the LOW scenario defined in `docs/04-stima-costi-infrastruttura.md`.

| Resource | SKU / Tier | Estimated Monthly Cost |
|---|---|---|
| Azure Front Door Standard — base fee | Standard | ~€38 |
| WAF Policy | Standard — per policy | ~€5 |
| Azure Static Web Apps | Free | €0 |
| Azure Container Apps | Consumption (~1 FastAPI app, 0.5 vCPU / 1 GB) | ~€45–60 |
| Azure Container Registry | Basic (10 GB included) | ~€5 |
| Azure PostgreSQL Flexible Server | Burstable B2ms (2 vCore, 4 GB RAM, 32 GB storage) | ~€48 |
| Azure Blob Storage | ~50 GB, LRS Hot | ~€6 |
| Azure Maps | Gen 2 S0 (~20k renders/month) | ~€12 |
| Azure OpenAI — GPT-4o | ~500 post-match suggestions/month × ~500 tokens | ~€5–10 |
| Azure Key Vault | Standard (~5k operations/month) | ~€5 |
| Application Insights + Log Analytics | ~2 GB/month (first 5 GB/month free) | ~€10–12 |
| Virtual Network | VNet + subnets (no VPN/ExpressRoute) | ~€2 |
| **Total** | | **~€181–203 / month** |
| **Annual projection** | | **~€2,172–2,436 / year** |

> For the hackathon demo period (1 day), total cost is negligible (< €5).

### Cost Optimisation

These optimisations are recommended once the usage pattern is stable (typically after 3 months of operation). Figures from `docs/04-stima-costi-infrastruttura.md`.

| Optimisation | Saving | Effort |
|---|---|---|
| Reserved Instances — PostgreSQL (1-year commitment) | –40% on DB (~€19/month) | Low |
| Azure Container Apps Consumption Plan already chosen | Best option for intermittent load | — |
| Blob Storage lifecycle management (move old assets to Cool tier) | –50% on aged assets | Low |
| Azure Dev/Test subscription for development workloads | –45% on dev compute | Medium |
| Azure Savings Plan (1-year compute commitment) | –15–17% on Container Apps | Medium |

**Maximum applicable saving (at scale, all optimisations):** up to –35% → ~€118–132/month → ~€1,416–1,584/year.

---

## 10. GDPR and Data Privacy

This section maps the GDPR requirements defined in `docs/01-analisi-funzionale.md` (§4.3, NF-GDPR-01 to NF-GDPR-06) to concrete infrastructure controls.

### 10.1 Data Residency

All Azure resources are deployed in the **West Europe** (Netherlands) region. Azure OpenAI is deployed in Sweden Central — both are within the EU. No personal data leaves the European Economic Area.

### 10.2 Data Classification

| Data Category | Where Stored | Classification |
|---|---|---|
| Identity data (name, email, job title) | `users` table, PostgreSQL | Personal — sourced from AAD |
| Professional tags (skills, certifications) | `users.skills`, `users.certifications` | Professional — user-provided |
| Agentic data (AI tools, workflow description) | `users.ai_tools`, `users.ai_description` | Professional — user-provided |
| Personal data (hobbies, interests) | `users.hobbies`, `users.interests` | Sensitive — user-provided, opt-in visibility |
| Avatar images | Azure Blob Storage | Personal — user-uploaded |
| Swipe and match history | `workmatch_swipes`, `matches` | Behavioral — implicit |
| Match computation cache | `match_cache` | Derived — not personal data per se |
| Application logs | Log Analytics Workspace | Must not contain PII in plain text |

### 10.3 GDPR Controls — Infrastructure Mapping

| GDPR Requirement | Requirement ID | Infrastructure Control |
|---|---|---|
| EU GDPR compliance | NF-GDPR-01 | All resources in EU regions; DPA with Microsoft via Azure Data Processing Addendum |
| Privacy consent at first login | NF-GDPR-02 | Consent flag stored in `users` table; onboarding wizard enforces acceptance before profile creation |
| Data export (portability) | NF-GDPR-03 | `GET /api/me/export` endpoint returns user data as JSON/CSV; Blob Storage pre-signed URL for avatar download |
| Right to erasure (right to be forgotten) | NF-GDPR-04 | `DELETE /api/me` hard-deletes the `users` row and cascades to all related tables; avatar blob deleted from storage; match cache purged |
| Personal pillar opt-in visibility | NF-GDPR-05 | `hobbies` and `interests` excluded from public search queries unless the user has set `personal_visible = true` (column added to `users`) |
| Data Processing Agreement with cloud vendor | NF-GDPR-06 | Azure DPA is automatically in place for all Azure services; no additional action required |

### 10.4 Additional Controls

- **Logs do not contain PII:** FastAPI logging middleware redacts `display_name`, `email`, and `aad_oid` from all log entries before shipping to Log Analytics.
- **Audit log:** All write operations on `users`, `matches`, and `akr_entries` are captured in Application Insights custom events with a timestamp and `aad_oid` (not full name or email) for audit purposes.
- **Data retention:** Log Analytics Workspace is configured with a 90-day hot retention and 2-year archive period. `match_cache` entries are purged after their `expires_at` timestamp.
- **Access control:** The Pillar 3 (Human/Personal) data is only returned in API responses when the requesting user is authenticated within the same Azure AD tenant (`NF-SEC-03`).

---

## 11. Enterprise Roadmap

This section captures the planned evolution of the Hello Work infrastructure beyond the POC, as defined in `docs/02-architettura-enterprise.md`.

### 11.1 Q3 2026 — Production Hardening

| Item | Infrastructure Change |
|---|---|
| Azure AD multi-tenant onboarding | Add Entra External ID; API Management layer for tenant routing |
| Calendar integration (Graph API) | Add Microsoft Graph API client in backend; no new Azure resource |
| Teams Tab / Viva Connections | No infrastructure change; frontend packaging only |
| Notification system | Add Azure Service Bus (Standard) for async event dispatch |

### 11.2 Q4 2026 — Intelligence Layer

| Item | Infrastructure Change |
|---|---|
| Semantic matching boost (embeddings) | Add `text-embedding-3-small` deployment to `aoai-hellowork`; add `pgvector` extension to PostgreSQL for vector storage |
| Icebreaker feed (GPT-4o prompts) | Increase OpenAI quota on existing `aoai-hellowork` resource |
| HR Analytics dashboard | Add Azure Data Lake Storage Gen2 + Power BI Embedded |
| Full-text + semantic search on profiles | Add Azure AI Search (Standard S1) with index over `users` and `akr_entries` |
| Match score Redis cache | Replace PostgreSQL `match_cache` table with Azure Cache for Redis (C1) for sub-millisecond cache reads at scale |

### 11.3 Q1 2027 — Scale and Multi-Tenancy

| Item | Infrastructure Change |
|---|---|
| Multi-region Active-Active | Replicate resource group to North Europe; add Front Door Premium with geo-routing; add PostgreSQL read replica |
| First external enterprise tenant | Add Azure API Management (Premium); PostgreSQL Row-Level Security on `tenant_id` |
| WebSocket real-time notifications | Container Apps now supports WebSocket natively — no additional resource |
| Azure Marketplace listing | Packaging and offer creation only; no infrastructure change |

### 11.4 Services Not in POC Scope

The following services are defined in the enterprise architecture but deliberately excluded from the POC to minimise cost and complexity:

| Service | Reason Deferred |
|---|---|
| Azure API Management | Not needed for single-tenant POC; added in Q3 |
| Azure Cache for Redis | PostgreSQL `match_cache` table is sufficient for 1,000 users |
| Azure Service Bus | Notification events handled synchronously in POC |
| Microsoft Defender for Cloud | Worth enabling as a P2 upgrade in production hardening |
| Azure Policy (governance) | Applicable at enterprise subscription level, not POC resource group |
| Azure DDoS Protection Standard | Front Door WAF provides adequate protection for POC scale |

---

*End of document — version 0.3 draft*
