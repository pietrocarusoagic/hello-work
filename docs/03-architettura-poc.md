# Hello Work — Architettura POC

> **Target**: Deployed & demo-ready by 16:50 today.

---

## 1. Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HELLO WORK — POC                             │
│                                                                     │
│  Browser / Laptop                                                   │
│  ┌─────────────────────────────────┐                                │
│  │  React 19 + TypeScript (Vite 6) │  ◄── Azure Static Web Apps    │
│  │  (SPA)                          │                                │
│  └──────────────┬──────────────────┘                                │
│                 │ HTTPS / REST                                       │
│                 ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Azure Container Apps                            │  │
│  │   ┌────────────────────────────────────────────────────┐    │  │
│  │   │  ASP.NET Core 10 C#  — API Gateway + BLL           │    │  │
│  │   │                                                     │    │  │
│  │   │  /auth     → MSAL token validation                 │    │  │
│  │   │  /profiles → CRUD profiles (3 pillars)             │    │  │
│  │   │  /matches  → tag-overlap matching engine           │    │  │
│  │   │  /workmatch→ swipe state machine                   │    │  │
│  │   │  /groups   → group CRUD + suggestions              │    │  │
│  │   │  /map      → office people-clusters endpoint       │    │  │
│  │   └──────────────────┬─────────────────────────────────┘    │  │
│  └─────────────────────┬┘                                        │  │
│                        │                                           │
│            ┌───────────┼───────────────┐                          │
│            │           │               │                          │
│            ▼           ▼               ▼                          │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐               │
│  │  Azure DB   │ │  Azure   │ │   Azure Blob      │               │
│  │ PostgreSQL  │ │   AD /   │ │   Storage         │               │
│  │ (Flexible   │ │  Entra   │ │  (avatars,        │               │
│  │  Server)    │ │   ID     │ │   assets)         │               │
│  └─────────────┘ └──────────┘ └──────────────────┘               │
│                                                                     │
│  ┌──────────────────────────────┐                                  │
│  │      Azure Maps              │                                  │
│  │  (Office Map tile layer +    │                                  │
│  │   pushpin clustering)        │                                  │
│  └──────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Azure Services — POC

| Servizio | SKU / Tier | Ruolo |
|---|---|---|
| **Azure Container Apps** | Consumption plan | Host ASP.NET Core 10 backend — scale to zero, zero infra management |
| **Azure Database for PostgreSQL Flexible Server** | Burstable B1ms | Datastore principale: profili, match, swipe, gruppi |
| **Azure Active Directory / Entra ID** | Existing tenant | SSO aziendale, pre-population profilo da AAD claims |
| **Azure Static Web Apps** | Free tier | Host React 19 SPA (build Vite 6) |
| **Azure Blob Storage** | LRS Hot | Avatar upload, assets statici |
| **Azure Maps** | Gen 2 S0 | Office Map — tile rendering + clustering pushpin API |
| **Azure Container Registry** | Basic | Registry immagini Docker per ASP.NET Core |
| **Azure Key Vault** | Standard | Secrets: DB connection string, Maps API key, MSAL client secret |

**Costo stimato POC**: < €15/mese (scale-to-zero + tier minimi)

---

## 3. Stack Tecnico

### Frontend — React 19 + TypeScript + Vite 6
```
src/
├── pages/
│   ├── Login.tsx              → MSAL redirect handler
│   ├── Home.tsx               → Discovery Feed
│   ├── Profile.tsx            → Profilo 3 pilastri + onboarding
│   ├── WorkMatch.tsx          → Swipe UI (Framer Motion cards)
│   ├── Groups.tsx             → Lista + suggerimenti gruppi
│   └── Map.tsx                → Azure Maps embed
├── components/
│   ├── SwipeCard.tsx          → WorkMatch card
│   ├── ProfilePillar.tsx      → Pillar editor (Prof/Agentic/Human)
│   └── OfficeMap.tsx          → Azure Maps React wrapper
├── lib/
│   ├── msalConfig.ts          → MSAL.js configuration
│   └── api.ts                 → Typed fetch client (fetch + generics)
└── vite.config.ts             → Vite 6 configuration
```

**Librerie chiave:**
- `@azure/msal-browser` — SSO con Azure AD
- `@azure/msal-react` — React hooks per auth state
- `react-tinder-card` — Swipe gesture per WorkMatch
- `azure-maps-control` — Office Map
- `tailwindcss` + `shadcn/ui` — UI components rapidi

### Backend — ASP.NET Core 10 C#
```csharp
// Struttura moduli
HelloWork.Api/
├── Controllers/
│   ├── AuthController.cs      // Token introspection, AAD graph call
│   ├── ProfilesController.cs  // CRUD profilo, 3 pilastri
│   ├── MatchesController.cs   // Tag-overlap scoring engine
│   ├── WorkMatchController.cs // Swipe state (liked/passed/matched)
│   ├── GroupsController.cs    // CRUD gruppi + suggestion
│   └── MapController.cs       // People cluster per ufficio
├── Models/                    // EF Core entities
├── DTOs/                      // Request/Response record types
├── Services/
│   ├── MatchingService.cs     // Jaccard similarity engine
│   └── AadGraphService.cs     // Microsoft Graph SDK
└── Infrastructure/
    ├── AppDbContext.cs         // EF Core + Npgsql
    └── JwtValidationMiddleware.cs  // MSAL JWT validation
```

### Database — PostgreSQL Schema (core tables)

```sql
-- Profilo unificato
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aad_oid TEXT UNIQUE NOT NULL,          -- Azure AD Object ID
  display_name TEXT,
  email TEXT,
  office_location TEXT,                  -- AGIC office (Milano, Roma, Tirana…)
  avatar_url TEXT,
  -- Pillar 1: Professional (pre-populated da AAD)
  role TEXT,
  department TEXT,
  skills TEXT[],                         -- tag array
  certifications TEXT[],
  -- Pillar 2: Agentic
  ai_tools TEXT[],                       -- ['Claude','Copilot','n8n',…]
  ai_description TEXT,
  -- Pillar 3: Human
  hobbies TEXT[],
  interests TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WorkMatch swipe state
CREATE TABLE workmatch_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID REFERENCES users(id),
  target_id UUID REFERENCES users(id),
  direction TEXT CHECK (direction IN ('like','pass')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(swiper_id, target_id)
);

-- Mutual match result
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES users(id),
  user_b UUID REFERENCES users(id),
  match_score FLOAT,                     -- tag overlap %
  status TEXT DEFAULT 'pending',         -- pending/coffee_scheduled/connected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gruppi
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  tags TEXT[],                           -- used for suggestion engine
  created_by UUID REFERENCES users(id),
  is_system_suggested BOOLEAN DEFAULT false,
  member_count INT DEFAULT 0
);

CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

---

## 4. Matching Engine (POC — Deterministic)

```csharp
public class MatchingService
{
    /// <summary>
    /// Jaccard similarity across all 3 pillars with weights.
    /// No ML needed — deterministic, fast, explainable.
    /// </summary>
    public double ComputeMatchScore(User userA, User userB)
    {
        const double weightProfessional = 0.35;
        const double weightAgentic      = 0.40;
        const double weightHuman        = 0.25;

        static double Jaccard(IEnumerable<string> a, IEnumerable<string> b)
        {
            var setA = a.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var setB = b.ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (setA.Count == 0 && setB.Count == 0) return 0.0;
            int intersection = setA.Count(x => setB.Contains(x));
            int union = setA.Union(setB).Count();
            return (double)intersection / union;
        }

        double score =
            weightProfessional * Jaccard(userA.Skills, userB.Skills) +
            weightAgentic      * Jaccard(userA.AiTools, userB.AiTools) +
            weightHuman        * Jaccard(
                userA.Hobbies.Concat(userA.Interests),
                userB.Hobbies.Concat(userB.Interests));

        return Math.Round(score, 4);
    }
}
```

**WorkMatch bilateral match trigger:**
```
IF swipe(A→B) = 'like' AND swipe(B→A) = 'like'
  → INSERT INTO matches (user_a, user_b, score)
  → Send in-app notification: "Nuova connessione! Prenota un caffè virtuale ☕"
```

---

## 5. Azure AD SSO Flow

```
Browser                 React SPA            Azure AD           ASP.NET Core
   │                       │                     │                 │
   │── Login click ────────►│                     │                 │
   │                       │── MSAL redirect ────►│                 │
   │                       │                     │── Consent/Auth ─┤
   │                       │◄── id_token + ───────│                 │
   │                       │    access_token      │                 │
   │                       │                     │                 │
   │                       │── API call + Bearer ──────────────────►│
   │                       │   token              │                 │
   │                       │                     │  validate JWT   │
   │                       │                     │  (AAD JWKS)     │
   │                       │                     │                 │
   │                       │                     │  extract OID,   │
   │                       │                     │  name, email    │
   │                       │                     │  → upsert user  │
   │◄── Profile loaded ─────│◄──────────────────────────────────────│
```

**Profilo pre-popolato da AAD claims**: `displayName`, `mail`, `jobTitle`, `department`, `officeLocation` — zero friction per l'utente al primo accesso.

---

## 6. Decisioni Tecniche Chiave (POC)

| Decisione | Scelta | Rationale |
|---|---|---|
| **Backend runtime** | Azure Container Apps (Consumption) | Deploy in 5 min da Docker, scale-to-zero per demo |
| **Backend framework** | ASP.NET Core 10 C# | Performance nativa, typed endpoints, minimal API overhead |
| **Frontend framework** | React 19 + TypeScript + Vite 6 | SPA veloce, HMR istantaneo con Vite, ecosystem maturo |
| **Auth flow** | MSAL.js + Azure AD (existing tenant) | SSO aziendale nativo, no custom auth da costruire |
| **Matching algorithm** | Jaccard deterministic (C#) | Zero training data needed, esplicabile ai giudici |
| **DB** | PostgreSQL Flexible Server + EF Core | Array columns per tags, full-text search su ai_description |
| **Office Map** | Azure Maps + static GeoJSON | Uffici AGIC hard-coded come GeoJSON → clustering nativo Maps |
| **Swipe UI** | react-tinder-card | 30 min di integrazione, effetto wow garantito |
| **CI/CD POC** | GitHub Actions → ACR → Container Apps | Pipeline 3-step: `dotnet build` + `dotnet test` + Docker push |

---