# 👋 Hello Work — POC

> Piattaforma di corporate networking per connettere colleghi, competenze e persone.

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 + TailwindCSS |
| Backend | ASP.NET Core 10 C# |
| Auth | Azure AD / Entra ID (MSAL.js) |
| Database | Azure SQL (EF Core) |
| Map | Azure Maps |
| Hosting | Azure Container Apps + Azure Static Web Apps |

## Avvio Locale

### Prerequisiti
- Node.js 22+
- .NET 10 SDK
- SQL Server locale o Docker

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # configura le variabili Azure AD
npm run dev
```

### Backend
```bash
cd backend
dotnet restore
# configura appsettings.Development.json con le tue credenziali Azure
dotnet run --project HelloWork.Api
```

### Variabili d'ambiente (Frontend)
```
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_MAPS_KEY=your-maps-key
```

## Architettura

```
Browser → React SPA (Azure Static Web Apps)
            ↓ HTTPS + Bearer token
       ASP.NET Core 10 (Azure Container Apps)
            ↓
       Azure SQL Database (EF Core)
            ↓ 
       Azure AD / Entra ID (SSO)
```

## Funzionalità POC

- ✅ **Auth SSO** — Login con Microsoft (Azure AD)
- ✅ **Profilo 3 Pilastri** — Professionale, Agentic, Umano
- ✅ **WorkMatch** — Swipe cards con Jaccard similarity
- ✅ **Match bilaterale** — Notifica "Prenota un caffè ☕"
- ✅ **Gruppi** — CRUD + suggerimenti AI
- ✅ **Mappa Uffici** — Clustering per sede
- ✅ **Discovery Feed** — Suggerimenti personalizzati

## CI/CD

GitHub Actions → Azure Container Registry → Azure Container Apps

## Disclaimer

⚠️ Architettura POC — non pronta per produzione senza hardening di sicurezza, resilienza e compliance.

---
*AGIC Technology — Hello Work POC — Giugno 2026*
