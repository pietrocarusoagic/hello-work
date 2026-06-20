# Hello Work — Stima Costi Infrastruttura Azure

> Output richiesto mattina | Hackathon AGIC 2026

## Region: West Europe | Ambienti: Production + Staging | Utenti: 1.000–5.000

### Architettura di riferimento

```
Azure Front Door (CDN + WAF)
        │
   ┌────┴────┐
   │         │
Next.js   FastAPI
(Container  (Container
   App)       App)
   │         │
   └────┬────┘
        │
  PostgreSQL Flexible
        │
   Blob Storage ── Azure Maps
        │
  Key Vault + App Insights
```

---

### Scenario LOW — 1.000 utenti

| Servizio | Config | €/mese |
|----------|--------|--------|
| Azure Container Apps | 2 app prod (0.5 vCPU / 1 GB) + staging 40% | €85 |
| Azure PostgreSQL Flexible | Burstable B2ms, 32 GB | €48 |
| Azure Blob Storage | ~50 GB, LRS, Hot | €6 |
| Azure CDN | Microsoft CDN, ~100 GB transfer | €10 |
| Azure AD | Incluso in M365 E3 | €0 |
| Azure Key Vault | Standard, ~50k ops/mese | €5 |
| Application Insights + Log Analytics | ~2 GB/mese | €12 |
| Azure Container Registry | Basic tier | €5 |
| Azure Maps | Creator S1, ~20k renders/mese | €12 |
| Bandwidth egress | ~80 GB/mese | €8 |
| **TOTALE LOW** | | **€191/mese** |

---

### Scenario REALISTIC — 2.500 utenti

| Servizio | Config | €/mese |
|----------|--------|--------|
| Azure Container Apps | 2 app prod (1 vCPU / 2 GB, autoscale 1–5) + staging 50% | €200 |
| Azure PostgreSQL Flexible | General Purpose D2s_v3, 64 GB, backup 7gg | €148 |
| Azure Blob Storage | ~200 GB, LRS, lifecycle policy | €18 |
| Azure CDN | Microsoft CDN, ~300 GB transfer | €24 |
| Azure AD | Incluso M365 | €0 |
| Azure Key Vault | Standard, ~150k ops/mese | €10 |
| Application Insights + Log Analytics | ~5 GB/mese | €28 |
| Azure Container Registry | Standard tier | €18 |
| Azure Maps | Creator S1, ~80k renders/mese | €28 |
| Azure Front Door | Standard tier (WAF + global routing) | €42 |
| Bandwidth egress | ~250 GB/mese | €22 |
| **TOTALE REALISTIC** | | **€538/mese** |

---

### Scenario HIGH — 5.000 utenti

| Servizio | Config | €/mese |
|----------|--------|--------|
| Azure Container Apps | 2 app prod (2 vCPU / 4 GB, autoscale 2–10) + staging | €460 |
| Azure PostgreSQL Flexible | D4s_v3 HA Zone Redundant, 128 GB, backup 35gg | €310 |
| Azure Blob Storage | ~500 GB, ZRS, lifecycle | €48 |
| Azure CDN | Microsoft CDN, ~700 GB transfer | €55 |
| Azure AD | AAD P2 o B2C se utenti esterni | €0–€80 |
| Azure Key Vault | Premium (HSM), ~400k ops/mese | €22 |
| Application Insights + Log Analytics | ~15 GB/mese + alerting avanzato | €68 |
| Azure Container Registry | Standard + geo-replication | €35 |
| Azure Maps | Creator S1, ~200k renders/mese | €55 |
| Azure Front Door | Premium tier (WAF, Private Link) | €158 |
| Bandwidth egress | ~600 GB/mese | €52 |
| **TOTALE HIGH** | | **€1.263–€1.343/mese** |

---

### Riepilogo e Proiezione Annuale

| Scenario | Utenti | €/mese | €/anno |
|----------|--------|--------|--------|
| LOW | 1.000 | €191 | **€2.292** |
| REALISTIC | 2.500 | €538 | **€6.456** |
| HIGH | 5.000 | €1.300 | **€15.600** |

### Optimization Tips

| Ottimizzazione | Risparmio | Difficoltà |
|----------------|-----------|------------|
| Reserved Instances PostgreSQL (1 anno) | –40% sul DB | Bassa |
| Container Apps Consumption Plan | –30% su carichi intermittenti | Bassa |
| Blob lifecycle management (Cool/Archive) | –50% su asset vecchi | Bassa |
| Azure Dev/Test subscription per staging | –45% su staging | Media |
| Azure Savings Plan compute (1 anno) | –15–17% su compute | Media |

**Risparmio totale applicabile (scenario Realistic): fino a –35% → ~€350/mese → €4.200/anno**
