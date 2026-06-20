# Runbook Operativo — Hello Work

> **Versione:** 1.0 (POC) — Giugno 2026  
> **Pubblico:** Team sviluppo e infrastruttura AGIC  
> **Repo:** [pietrocarusoagic/hello-work](https://github.com/pietrocarusoagic/hello-work)

---

## Indice

1. [Architettura di deployment](#1-architettura-di-deployment)
2. [Avvio locale](#2-avvio-locale)
3. [DEV_BYPASS mode](#3-dev_bypass-mode)
4. [Variabili d'ambiente](#4-variabili-dambiente)
5. [Database](#5-database)
6. [CI/CD — GitHub Actions](#6-cicd--github-actions)
7. [Deploy manuale](#7-deploy-manuale)
8. [Monitoring](#8-monitoring)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Architettura di deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        Azure (Prod)                         │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Azure Static Web    │    │  Azure Container Apps    │  │
│  │  Apps (Frontend)     │◄───│  (Backend API)           │  │
│  │  React 19 + Vite     │    │  ASP.NET Core 10         │  │
│  └──────────────────────┘    └────────────┬─────────────┘  │
│                                           │                 │
│                              ┌────────────▼─────────────┐  │
│                              │  Azure SQL Database       │  │
│                              │  (EF Core 9)              │  │
│                              └──────────────────────────┘  │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Azure AD / Entra ID │    │  Application Insights    │  │
│  │  (Autenticazione)    │    │  (Monitoring)            │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Componenti

| Componente | Servizio Azure | Note |
|---|---|---|
| Frontend SPA | Azure Static Web Apps | Build Vite, deploy automatico su push `main` |
| Backend API | Azure Container Apps | Container Docker, autoscaling |
| Database | Azure SQL Database | EF Core migrations |
| Auth | Azure AD / Entra ID | App registration `hello-work-poc` |
| Monitoring | Application Insights | Collegato al Container App |
| Infra-as-Code | Terraform | State su Azure Storage Account |

### Infrastruttura Terraform

I file Terraform si trovano in `/infra/`. Il provisioning completo si avvia con:

```bash
cd infra
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

> Il workflow `infra-deploy` gestisce automaticamente `terraform apply` su push al branch `main` (solo per i file in `/infra/`).

---

## 2. Avvio locale

### Prerequisiti

- Node.js 20+
- .NET 10 SDK
- Docker Desktop (opzionale, per testare il container)
- Azure CLI (opzionale, per operazioni su Azure)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Copia il template env
npm run dev                  # Avvia su http://localhost:5173
```

**Variabili `.env.local` minime per avvio locale:**

```env
VITE_DEV_BYPASS=true
VITE_API_BASE_URL=http://localhost:5228
```

Con `VITE_DEV_BYPASS=true` non è necessario configurare Azure AD — l'utente demo (Giulia Rossi) viene iniettato automaticamente.

### Backend

```bash
cd backend
dotnet restore
dotnet run --project HelloWork.Api
```

L'API si avvia su `http://localhost:5228` (configurabile in `launchSettings.json`).

**Connection string per sviluppo locale** (in `appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HelloWorkDev;Trusted_Connection=True;"
  },
  "DevBypass": {
    "Enabled": true
  }
}
```

> Per usare Azure SQL in locale, sostituisci la connection string con quella del database di dev e assicurati di avere le credenziali corrette (vedi sezione 4).

### Verifica che tutto funzioni

| Check | URL | Risultato atteso |
|---|---|---|
| Frontend | `http://localhost:5173` | Pagina Hello Work |
| API health | `http://localhost:5228/health` | `{"status":"Healthy"}` |
| Auth (bypass) | `http://localhost:5173` | Auto-login come Giulia Rossi |

---

## 3. DEV_BYPASS mode

### Cos'è

DEV_BYPASS è una modalità di sviluppo che **bypassa completamente Azure AD** e inietta un utente demo preconfigurato. Serve per sviluppare e testare senza dipendere dalla connessione ad Azure AD o da credenziali reali.

### Come attivarlo

**Frontend** — in `.env.local`:
```env
VITE_DEV_BYPASS=true
```

**Backend** — in `appsettings.Development.json`:
```json
{
  "DevBypass": { "Enabled": true }
}
```

> ⚠️ **Non abilitare mai DEV_BYPASS in produzione.** Le pipeline CI/CD non settano questa variabile negli ambienti Azure.

### Cosa fa esattamente

Con DEV_BYPASS attivo:

1. **Frontend:** MSAL.js non viene inizializzato. Al posto del login Azure AD viene iniettato automaticamente il profilo di `Giulia Rossi` (email: `demo@hellowork.local`).
2. **Backend:** Il middleware di autenticazione restituisce sempre l'utente `demo-user-1` invece di validare il token JWT.
3. **Seed data:** Il database viene pre-popolato con i profili demo (vedi sezione 5 — Seeding).

### Utente demo predefinito

```
Nome:     Giulia Rossi
Ruolo:    Cloud Architect
Sede:     Milano
Email:    demo@hellowork.local
Skills:   Azure, React, TypeScript
Cert:     AZ-900, AZ-204
AI Tools: GitHub Copilot, Azure OpenAI
Hobby:    Running, Fotografia
```

### Branch `feat/mock-api` — demo offline

Il branch `feat/mock-api` contiene una versione dell'app con **mock completo delle API** lato frontend (via Playwright intercept + MSW). Usala quando vuoi fare demo senza alcun backend attivo:

```bash
git checkout feat/mock-api
cd frontend && npm install && npm run dev
```

In questa modalità tutte le chiamate `/api/**` sono intercettate nel browser e restituite da fixture statiche.

---

## 4. Variabili d'ambiente

### Frontend (`.env.local` / Azure Static Web Apps settings)

| Variabile | Obbligatoria | Default dev | Descrizione |
|---|---|---|---|
| `VITE_DEV_BYPASS` | No | `true` (local) | Bypassa Azure AD, inietta utente demo |
| `VITE_API_BASE_URL` | Sì | `http://localhost:5228` | URL base del backend API |
| `VITE_AZURE_CLIENT_ID` | Solo prod | — | Client ID dell'App Registration Azure AD |
| `VITE_AZURE_TENANT_ID` | Solo prod | — | Tenant ID Azure AD AGIC |
| `VITE_AZURE_MAPS_KEY` | No | — | API key Azure Maps (per Mappa Uffici) |
| `VITE_APP_VERSION` | No | — | Versione app (visualizzata nel footer) |

### Backend (`appsettings.json` / Azure Container Apps env)

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Sì | Connection string Azure SQL Database |
| `AzureAd__TenantId` | Solo prod | Tenant ID Azure AD |
| `AzureAd__ClientId` | Solo prod | Client ID App Registration |
| `AzureAd__Audience` | Solo prod | Audience token JWT (es. `api://hello-work-poc`) |
| `DevBypass__Enabled` | No | Attiva DEV_BYPASS mode backend |
| `ApplicationInsights__ConnectionString` | Solo prod | Connection string Application Insights |
| `ASPNETCORE_ENVIRONMENT` | Sì | `Development` / `Production` |

> **Segreti in produzione:** Tutte le variabili sensibili (connection string, client secret, API key) sono salvate come **Secrets** in Azure Container Apps e referenziate come variabili d'ambiente — mai in chiaro nel codice.

---

## 5. Database

### Schema principale

```sql
-- Profili utente
CREATE TABLE UserProfiles (
    Id          NVARCHAR(128) PRIMARY KEY,  -- Azure AD Object ID
    DisplayName NVARCHAR(256),
    Email       NVARCHAR(256),
    Role        NVARCHAR(256),
    Department  NVARCHAR(256),
    Office      NVARCHAR(128),
    ProfileScore INT DEFAULT 0,
    CreatedAt   DATETIME2 DEFAULT GETDATE(),
    UpdatedAt   DATETIME2 DEFAULT GETDATE()
);

-- Skills, certificazioni, tool AI, hobby (relazioni 1-N)
CREATE TABLE UserSkills        (Id INT IDENTITY PK, UserId NVARCHAR(128) FK, Skill NVARCHAR(128));
CREATE TABLE UserCertifications(Id INT IDENTITY PK, UserId NVARCHAR(128) FK, Cert  NVARCHAR(128));
CREATE TABLE UserAiTools       (Id INT IDENTITY PK, UserId NVARCHAR(128) FK, Tool  NVARCHAR(128));
CREATE TABLE UserHobbies       (Id INT IDENTITY PK, UserId NVARCHAR(128) FK, Hobby NVARCHAR(128));
CREATE TABLE UserInterests     (Id INT IDENTITY PK, UserId NVARCHAR(128) FK, Interest NVARCHAR(128));

-- Match bilaterali
CREATE TABLE WorkMatches (
    Id          INT IDENTITY PRIMARY KEY,
    UserId1     NVARCHAR(128) FK,
    UserId2     NVARCHAR(128) FK,
    MatchedAt   DATETIME2 DEFAULT GETDATE()
);

-- Swipe history
CREATE TABLE Swipes (
    Id        INT IDENTITY PRIMARY KEY,
    SwiperId  NVARCHAR(128) FK,
    TargetId  NVARCHAR(128) FK,
    Direction NVARCHAR(10),  -- 'right' | 'left'
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Gruppi
CREATE TABLE Groups (
    Id          INT IDENTITY PRIMARY KEY,
    Name        NVARCHAR(256),
    Description NVARCHAR(1000),
    Tags        NVARCHAR(500)
);

CREATE TABLE GroupMemberships (
    GroupId INT FK,
    UserId  NVARCHAR(128) FK,
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (GroupId, UserId)
);
```

### Seeding (DEV_BYPASS)

Il seed viene eseguito automaticamente all'avvio dell'API in modalità Development se il database è vuoto. Popola:

- **3 utenti demo:** Giulia Rossi (Milano), Marco Bianchi (Roma), Sara Conti (Torino)
- **3 gruppi:** Azure Champions, AI Makers, Photo Walk Club
- Iscrizioni ai gruppi e alcuni swipe preconfigurati per mostrare il flusso di match

### Resettare il database in sviluppo

```bash
# Da Visual Studio o terminale
cd backend
dotnet run -- --reset-db   # Esegue EnsureDeleted + EnsureCreated + Seed
```

Oppure direttamente nel codice, nel `Program.cs` (solo per dev):

```csharp
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<HelloWorkDbContext>();
    db.Database.EnsureDeleted();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db);
}
```

> ⚠️ `EnsureDeleted` cancella tutti i dati. Non usare mai su un database condiviso o di produzione.

### Migrazioni future (v1.0)

Il POC usa `EnsureCreated` per semplicità. Passando a v1.0, si adotterà il flusso standard EF Core Migrations:

```bash
# Creare una migrazione
dotnet ef migrations add NomeMigrazione --project HelloWork.Api

# Applicare in dev
dotnet ef database update

# Generare script SQL per prod
dotnet ef migrations script --output migration.sql
```

---

## 6. CI/CD — GitHub Actions

Il repository ha **3 workflow** in `.github/workflows/`:

### `api-deploy.yml` — Deploy Backend

| Parametro | Valore |
|---|---|
| **Trigger** | Push su `main` con modifiche in `backend/**` |
| **Cosa fa** | Build Docker image → Push su Azure Container Registry → Deploy su Azure Container Apps |
| **Durata tipica** | 3–5 minuti |
| **Segreti richiesti** | `AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD` |

```yaml
# Passaggi chiave:
# 1. docker build -t hello-work-api:${{ github.sha }} ./backend
# 2. docker push $ACR_LOGIN_SERVER/hello-work-api:${{ github.sha }}
# 3. az containerapp update --image $ACR_LOGIN_SERVER/hello-work-api:${{ github.sha }}
```

### `spa-deploy.yml` — Deploy Frontend

| Parametro | Valore |
|---|---|
| **Trigger** | Push su `main` con modifiche in `frontend/**` |
| **Cosa fa** | `npm run build` → Deploy automatico su Azure Static Web Apps |
| **Durata tipica** | 2–3 minuti |
| **Segreti richiesti** | `AZURE_STATIC_WEB_APPS_API_TOKEN` |

```yaml
# Passaggi chiave:
# 1. npm ci && npm run build
# 2. Deploy via Azure/static-web-apps-deploy action
```

### `infra-deploy.yml` — Deploy Infrastruttura

| Parametro | Valore |
|---|---|
| **Trigger** | Push su `main` con modifiche in `infra/**` |
| **Cosa fa** | `terraform plan` + `terraform apply` |
| **Durata tipica** | 5–15 minuti |
| **Segreti richiesti** | `AZURE_CREDENTIALS`, `TF_BACKEND_CONFIG` |

> ⚠️ Questo workflow **modifica l'infrastruttura Azure**. Un merge accidentale su `main` con modifiche a `infra/` avvia automaticamente l'apply. Usare con cautela — si raccomanda una review obbligatoria prima del merge.

### Se un workflow fallisce

1. Apri la tab **Actions** su GitHub
2. Clicca sul run fallito → espandi il job con la ✗ rossa
3. Leggi i log per identificare l'errore
4. **Errori comuni:**
   - `authentication failed` → segreto Azure scaduto o errato
   - `quota exceeded` → limite risorse Azure raggiunto
   - `build failed` → errore di compilazione (vedi sezione 9)
5. Correggi e rifarai il push, oppure usa il pulsante **"Re-run jobs"**

---

## 7. Deploy manuale

Da usare solo in caso di emergenza o quando le Actions non sono disponibili.

### Deploy Backend manuale

```bash
# 1. Build immagine Docker
cd backend
docker build -t hello-work-api:manual .

# 2. Login su Azure Container Registry
az acr login --name <ACR_NAME>

# 3. Tag e push
docker tag hello-work-api:manual <ACR_NAME>.azurecr.io/hello-work-api:manual
docker push <ACR_NAME>.azurecr.io/hello-work-api:manual

# 4. Aggiorna Container App
az containerapp update \
  --name hello-work-api \
  --resource-group hello-work-rg \
  --image <ACR_NAME>.azurecr.io/hello-work-api:manual
```

### Deploy Frontend manuale

```bash
# 1. Build
cd frontend
npm ci
npm run build

# 2. Deploy tramite Azure CLI (Static Web Apps)
az staticwebapp environment set \
  --name hello-work-spa \
  --source ./dist
```

Oppure tramite la CLI SWA:

```bash
npm install -g @azure/static-web-apps-cli
swa deploy ./dist --deployment-token <TOKEN>
```

---

## 8. Monitoring

### Application Insights

Application Insights è collegato al Container App backend. Dalla [Azure Portal](https://portal.azure.com):

1. Naviga su **Application Insights → hello-work-insights**
2. Sezioni principali:
   - **Live Metrics** — traffico in tempo reale, richieste/sec, errori
   - **Failures** — eccezioni e dipendenze fallite
   - **Performance** — tempo di risposta per endpoint
   - **Logs** — query KQL sui log applicativi

### Query KQL utili

```kql
-- Richieste fallite nelle ultime 24h
requests
| where timestamp > ago(24h)
| where success == false
| summarize count() by resultCode, name
| order by count_ desc

-- Latenza media per endpoint
requests
| where timestamp > ago(1h)
| summarize avg(duration) by name
| order by avg_duration desc

-- Eccezioni recenti
exceptions
| where timestamp > ago(1h)
| project timestamp, type, outerMessage, method
| order by timestamp desc
```

### Alert configurati

| Alert | Soglia | Canale |
|---|---|---|
| Disponibilità API | < 99% per 5 min | Email team |
| Latenza P95 | > 2000ms | Email team |
| Errori 5xx | > 10/min | Email team |
| CPU Container App | > 80% per 10 min | Email team |

---

## 9. Troubleshooting

### CORS — `Access-Control-Allow-Origin` error

**Sintomo:** Il frontend riceve errori CORS nel browser console.

**Cause comuni:**
1. `VITE_API_BASE_URL` punta a un URL diverso da quello configurato nei CORS del backend
2. Il backend non ha l'origine del frontend nella lista CORS

**Soluzione:**

```csharp
// In Program.cs — assicurati che l'origine del frontend sia inclusa
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            "http://localhost:5173",           // dev locale
            "https://hello-work.azurestaticapps.net"  // produzione
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});
```

---

### Auth Azure AD — `AADSTS` errors

**Sintomo:** Errore durante il login con codice `AADSTS7000215`, `AADSTS50011`, ecc.

| Codice | Causa | Soluzione |
|---|---|---|
| `AADSTS50011` | Redirect URI non registrato | Aggiungi l'URI nell'App Registration Azure AD |
| `AADSTS7000215` | Client secret scaduto | Rinnova il secret in Azure AD → aggiorna il segreto GitHub |
| `AADSTS65001` | Consenso non dato | L'admin deve concedere il consenso per il tenant |
| `AADSTS700016` | App non trovata nel tenant | Verifica che `VITE_AZURE_CLIENT_ID` sia corretto |

---

### SQL Connection — `Cannot open server` / Timeout

**Sintomo:** L'API non riesce a connettersi al database Azure SQL.

**Checklist:**
1. Verifica che `ConnectionStrings__DefaultConnection` sia corretta (server, database, user, password)
2. Controlla che l'IP del Container App (o l'IP locale) sia nella **whitelist firewall** di Azure SQL
3. In sviluppo locale, aggiungi il tuo IP: `az sql server firewall-rule create --start-ip-address <TUO_IP> ...`
4. Verifica che il database esista: `az sql db show --name HelloWork --server <SERVER_NAME> ...`

---

### Vite Proxy — API non raggiunta in sviluppo

**Sintomo:** Le chiamate API in sviluppo locale restituiscono 404 o errori di rete.

**Verifica `vite.config.ts`:**

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5228',
        changeOrigin: true,
      }
    }
  }
})
```

Se il backend gira su una porta diversa, aggiorna `target` di conseguenza o setta `VITE_API_BASE_URL` nel `.env.local`.

---

### Build frontend fallisce (Actions)

**Sintomo:** Il job `spa-deploy` fallisce con errori TypeScript o di dipendenze.

**Checklist:**
1. Esegui `npm ci && npm run build` in locale — riproduce l'ambiente CI esattamente
2. Verifica che il `package-lock.json` sia committato (altrimenti `npm ci` fallisce)
3. Controlla che le variabili `VITE_*` richieste siano settate nei **GitHub Secrets** o come variabili di build nelle Static Web Apps settings

---

*Ultimo aggiornamento: Giugno 2026 — Team Innovation AGIC*
