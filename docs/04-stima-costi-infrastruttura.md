# Hello Work — Stima Ordine di Grandezza Costi di Esercizio

> **⚠️ Nota preliminare obbligatoria**
> I valori riportati sono **stime indicative** basate su ipotesi di utilizzo definite. Non costituiscono impegno contrattuale. La stima definitiva dovrà essere prodotta in fase di design architetturale dettagliato, una volta consolidati i requisiti non funzionali e le scelte tecnologiche finali.

---

**Documento:** Stima OdG Costi di Esercizio — Infrastruttura Azure  
**Progetto:** Hello Work  
**Area:** CAI — Cloud, App & Infrastructure  
**Referente tecnico:** Alessandro Rapiti  
**Versione:** 2.0 (revisione FinOps)  
**Data:** 20 giugno 2026  
**Stato:** Draft — in attesa di review architetturale

---

## Indice

1. [Ipotesi di utilizzo](#1-ipotesi-di-utilizzo)
2. [Costo di esercizio](#2-costo-di-esercizio)
   - 2.1 Scenario LOW — 1.000 utenti
   - 2.2 Scenario REALISTIC — 2.500 utenti
   - 2.3 Scenario HIGH — 5.000 utenti
   - 2.4 Riepilogo comparativo annuale
3. [Costo di progetto](#3-costo-di-progetto)
4. [Costo di evoluzione futura](#4-costo-di-evoluzione-futura)
5. [Optimization tips](#5-optimization-tips)
6. [Rischi di cost escalation](#6-rischi-di-cost-escalation)
7. [Governo dei costi (FinOps)](#7-governo-dei-costi-finops)

---

## 1. Ipotesi di utilizzo

Le stime di costo sono calcolate sulle seguenti **ipotesi esplicite**. Qualsiasi scostamento da queste assunzioni invalida le proiezioni economiche e richiede una revisione.

### 1.1 Scala utenti

| Parametro | LOW | REALISTIC | HIGH |
|---|---|---|---|
| **Utenti registrati (MAU)** | 1.000 | 2.500 | 5.000 |
| **Daily Active Users (DAU)** | ~300 (30% MAU) | ~750 (30% MAU) | ~1.500 (30% MAU) |
| **Sessioni medie/giorno** | ~450 | ~1.100 | ~2.200 |
| **Durata media sessione** | 8 min | 8 min | 10 min |

> La convenzione 30% DAU/MAU è applicata come stima conservativa per una piattaforma job-matching in fase di adozione iniziale. Mercati maturi possono raggiungere 40–50%.

### 1.2 Intensità traffico

| Parametro | LOW | REALISTIC | HIGH |
|---|---|---|---|
| **Richieste API medie per sessione** | ~40 | ~60 | ~80 |
| **Richieste API totali/giorno** | ~18.000 | ~66.000 | ~176.000 |
| **Peak hour factor** | 3× media | 3× media | 4× media |
| **Upload media (foto/CV/sessione)** | 0,2 file | 0,3 file | 0,5 file |
| **Download media contenuti/sessione** | ~2 MB | ~3 MB | ~5 MB |

### 1.3 Ambienti previsti

| Ambiente | Configurazione | Note |
|---|---|---|
| **Production** | Full scale, HA attiva | Always-on |
| **Staging** | 1 solo ambiente, ridotto | Auto-shutdown fuori orario (−60% costo effettivo) |

> ⚠️ Non è previsto un ambiente di test/QA dedicato nella stima attuale. Se richiesto in fase progettuale, aggiunge ~15% al costo annuale.

### 1.4 Dati e storage

| Dato | LOW | REALISTIC | HIGH |
|---|---|---|---|
| **Volume profili utente (DB)** | ~50 MB | ~150 MB | ~400 MB |
| **Foto profilo (Blob Storage)** | ~30 GB | ~150 GB | ~600 GB |
| **CV e documenti caricati** | ~15 GB | ~80 GB | ~350 GB |
| **Contenuti AKR (annunci, offerte)** | ~5 GB | ~20 GB | ~50 GB |
| **Log applicativi (Log Analytics)** | ~2 GB/giorno | ~8 GB/giorno | ~20 GB/giorno |
| **Backup database (retention 30gg)** | ~50 GB | ~250 GB | ~1 TB |

### 1.5 Retention e policy dati

| Policy | Valore assunto |
|---|---|
| **Retention log (Log Analytics)** | 30 giorni (default) — oltre tale soglia, esportazione su Storage a costo ridotto |
| **Backup database** | Retention 30 giorni, GRS (geo-redundant) |
| **Backup Blob Storage** | Soft delete 14 giorni + backup settimanale |
| **Archivio dati inattivi** | Dopo 90 giorni, migrazione ad Azure Blob Cold Tier (−60% costo storage) |
| **GDPR deletion** | Procedura di cancellazione entro 30gg da richiesta utente |

---

## 2. Costo di esercizio

Tutti i costi sono in **€/mese** (IVA esclusa), espressi in logica **pay-as-you-go** senza Reserved Instances (vedi sezione FinOps per quando applicarle). I costi di Staging includono lo spegnimento automatico fuori orario lavorativo (lunedì–venerdì, 08:00–19:00 CET), che riduce il costo effettivo al **~40%** del costo pieno equivalente.

---

### 2.1 Scenario LOW — 1.000 utenti

**Ipotesi chiave:** Avvio progetto, utenti early adopter, traffico predicibile, AI features in rodaggio.

#### Produzione

| Servizio Azure | SKU / Configurazione | €/mese |
|---|---|---:|
| Azure Container Apps | 2 repliche · 0,5 vCPU · 1 GB RAM · ingress incluso | €40 |
| Azure Static Web Apps | Tier Standard (web frontend) | €9 |
| Azure SQL Database | General Purpose · 2 vCore · 32 GB storage | €245 |
| Azure Blob Storage | ~50 GB · LRS · tier Hot | €8 |
| Azure CDN (Front Door Standard) | ~50 GB egress/mese | €4 |
| Azure Cache for Redis | C0 Basic · 250 MB | €15 |
| Azure Functions | Piano Consumption · ~3M invocazioni/mese | €3 |
| Azure AI Document Intelligence | S0 · ~200 pagine/mese (CV extraction) | €15 |
| Azure OpenAI Service | GPT-4o-mini · ~500k token/mese | €25 |
| Azure Maps | S0 · ~5.000 richieste/mese | €5 |
| Entra External ID (B2C) | < 50.000 MAU (tier gratuito) | €0 |
| Log Analytics Workspace | ~2 GB/giorno ingest · retention 30gg | €18 |
| Azure Key Vault | Standard · < 10.000 operazioni/mese | €2 |
| Azure Backup | ~50 GB · GRS | €5 |
| **Totale produzione mensile** | | **€394** |

#### Staging (auto-shutdown, costo effettivo ~40%)

| Componente | Costo pieno | Effettivo (−60%) |
|---|---:|---:|
| Container Apps (1 replica) | €20 | €8 |
| Azure SQL (provisioning ridotto, 1 vCore) | €122 | €49 |
| Blob + Redis + altri servizi | €30 | €12 |
| Log Analytics (ingest ridotto) | €5 | €2 |
| **Totale staging effettivo** | | **€71** |

| | Mensile | Annuale |
|---|---:|---:|
| Produzione | €394 | €4.728 |
| Staging | €71 | €852 |
| **Totale LOW** | **€465** | **~€5.580** |

---

### 2.2 Scenario REALISTIC — 2.500 utenti

**Ipotesi chiave:** Piattaforma in crescita, funzionalità AI attive, traffico bimodale (mattino/sera), SLA garantito.

#### Produzione

| Servizio Azure | SKU / Configurazione | €/mese |
|---|---|---:|
| Azure Container Apps | 4 repliche · 1 vCPU · 2 GB RAM · autoscaling | €150 |
| Azure Static Web Apps | Tier Standard | €9 |
| Azure SQL Database | General Purpose · 4 vCore · 100 GB storage | €490 |
| Azure Blob Storage | ~250 GB · LRS · tier Hot/Cool mix | €25 |
| Azure CDN (Front Door Standard) | ~250 GB egress/mese | €18 |
| Azure Cache for Redis | C1 Standard · 1 GB · replica attiva | €55 |
| Azure Functions | Piano Consumption · ~10M invocazioni/mese | €8 |
| Azure AI Document Intelligence | S0 · ~500 pagine/mese | €38 |
| Azure OpenAI Service | GPT-4o-mini · ~2M token/mese | €80 |
| Azure Maps | S1 · ~20.000 richieste/mese | €12 |
| Entra External ID (B2C) | < 50.000 MAU (tier gratuito) | €0 |
| Log Analytics Workspace | ~8 GB/giorno ingest · retention 30gg | €80 |
| Azure Key Vault | Standard | €3 |
| Azure Backup | ~250 GB · GRS | €18 |
| **Totale produzione mensile** | | **€986** |

#### Staging (auto-shutdown, costo effettivo ~40%)

| Componente | Costo pieno | Effettivo (−60%) |
|---|---:|---:|
| Container Apps (2 repliche) | €75 | €30 |
| Azure SQL (2 vCore) | €245 | €98 |
| Redis + CDN + altri | €50 | €20 |
| Log Analytics (ingest ridotto) | €20 | €8 |
| **Totale staging effettivo** | | **€156** |

| | Mensile | Annuale |
|---|---:|---:|
| Produzione | €986 | €11.832 |
| Staging | €156 | €1.872 |
| **Totale REALISTIC** | **€1.142** | **~€13.700** |

---

### 2.3 Scenario HIGH — 5.000 utenti

**Ipotesi chiave:** Piattaforma consolidata, AI reranking attivo, Event Radar in produzione, picchi di traffico gestiti con autoscaling aggressivo.

#### Produzione

| Servizio Azure | SKU / Configurazione | €/mese |
|---|---|---:|
| Azure Container Apps | 8 repliche + autoscaling · 2 vCPU · 4 GB RAM | €380 |
| Azure Static Web Apps | Tier Standard | €9 |
| Azure SQL Database | General Purpose · 8 vCore · 250 GB storage | €980 |
| Azure Blob Storage | ~1 TB · LRS · Hot/Cool/Archive tiering | €70 |
| Azure CDN (Front Door Standard) | ~1 TB egress/mese | €65 |
| Azure Cache for Redis | C2 Standard · 6 GB · replica | €130 |
| Azure Functions | Piano Premium EP1 (latenza garantita) | €55 |
| Azure AI Document Intelligence | S0 · ~1.000 pagine/mese | €75 |
| Azure OpenAI Service | GPT-4o · ~8M token/mese | €250 |
| Azure Maps | S1 · ~50.000 richieste/mese | €25 |
| Entra External ID (B2C) | fino a 50.000 MAU (tier gratuito) | €0 |
| Log Analytics Workspace | ~20 GB/giorno ingest · retention 30gg | €210 |
| Azure Key Vault | Standard | €5 |
| Azure Backup | ~1 TB · GRS | €55 |
| **Totale produzione mensile** | | **€2.309** |

#### Staging (auto-shutdown, costo effettivo ~40%)

| Componente | Costo pieno | Effettivo (−60%) |
|---|---:|---:|
| Container Apps (3 repliche) | €140 | €56 |
| Azure SQL (4 vCore) | €490 | €196 |
| Redis + CDN + altri | €100 | €40 |
| Log Analytics (ingest ridotto) | €50 | €20 |
| **Totale staging effettivo** | | **€312** |

| | Mensile | Annuale |
|---|---:|---:|
| Produzione | €2.309 | €27.708 |
| Staging | €312 | €3.744 |
| **Totale HIGH** | **€2.621** | **~€31.450** |

---

### 2.4 Riepilogo comparativo annuale

| Scenario | Utenti (MAU) | Prod/anno | Staging/anno | **Totale/anno** |
|---|---|---:|---:|---:|
| **LOW** | 1.000 | €4.728 | €852 | **~€5.580** |
| **REALISTIC** | 2.500 | €11.832 | €1.872 | **~€13.700** |
| **HIGH** | 5.000 | €27.708 | €3.744 | **~€31.450** |

> **Nota di lettura:** Il salto LOW→REALISTIC (+145%) è dominato dalla crescita del database (4 vCore vs 2 vCore). Il salto REALISTIC→HIGH (+130%) è dominato dalla combinazione Container Apps autoscaling + OpenAI usage + Log Analytics ingest. Entrambi i salti sono non lineari: la piattaforma ha costi fissi rilevanti che non scalano linearmente con gli utenti.

---

## 3. Costo di progetto

Il costo di progetto — comprensivo di analisi, design architetturale, sviluppo, test, collaudo, migrazione dati iniziale e project management — è documentato nell'**offerta commerciale (documento 06)**.

**Non viene duplicato in questa stima.** Fare riferimento esclusivo al documento 06 per:
- Effort stimato in giorni/persona per fase
- Costo giornaliero delle figure coinvolte
- Timeline e milestone di consegna
- Condizioni contrattuali e SLA di progetto

Questa stima copre **unicamente il costo ricorrente di esercizio** (operating expenditure / OpEx) post-go-live.

---

## 4. Costo di evoluzione futura

Le stime di esercizio nei tre scenari coprono la **piattaforma come definita nel perimetro attuale**. Le funzionalità enterprise previste nelle roadmap successive genereranno costi addizionali.

### 4.1 Stima indicativa per fase evolutiva

| Fase evolutiva | Funzionalità incluse | Incremento stimato sul costo di esercizio |
|---|---|---|
| **Fase 2 — AI Core** | CV extraction avanzata (multi-lingua), AI reranking dei match, scoring candidati | +20–30% |
| **Fase 3 — Event Radar** | Radar eventi di mercato, notifiche push intelligenti, sentiment analysis offerte | +15–25% |
| **Fase 4 — Enterprise** | Multi-tenant, SSO aziendale, analytics avanzate, SLA 99,9%, disaster recovery | +30–50% |
| **Scala 10.000+ utenti** | Upgrade infrastruttura: Business Critical SQL, AKS, WAF, CDN premium | +80–120% vs HIGH |

### 4.2 Proiezione 3 anni — scenario REALISTIC

| Anno | Funzionalità attive | Costo esercizio stimato/anno |
|---|---|---:|
| **Anno 1** | Platform base (perimetro attuale) | ~€13.700 |
| **Anno 2** | + Fase 2 AI Core | ~€16.400–18.000 |
| **Anno 3** | + Fase 3 Event Radar | ~€19.500–22.500 |

> Questi valori sono stime di ordine di grandezza. Richiedono una stima dettagliata al momento del design architetturale di ciascuna fase.

---

## 5. Optimization tips

Le seguenti ottimizzazioni sono **applicabili da subito** (senza cambi architetturali) e possono ridurre il costo di esercizio del 20–35% nel medio termine.

| Ottimizzazione | Applicabilità | Risparmio stimato | Quando applicare |
|---|---|---|---|
| **Reserved Instances SQL** | General Purpose 1–3 anni | −30–40% sul costo SQL | Dopo 3 mesi di dati reali (vedi FinOps) |
| **Blob Storage tiering** | Contenuti >90gg → Cool/Archive | −40–60% sul costo storage | Da subito, con lifecycle policy |
| **Log Analytics retention** | Export su Storage dopo 30gg | −50% sul costo log oltre soglia | Da subito |
| **Container Apps scale-to-zero** | Fuori orario o su endpoint non critici | −20–30% Container Apps | Solo ambienti non-prod |
| **Azure Hybrid Benefit** | Se licenze SQL/Windows disponibili | −25–30% su VM/SQL | Verificare licenze esistenti |
| **CDN caching aggressivo** | Asset statici, API response caching | −30% su egress CDN | Da subito, con policy CDN |
| **Redis eviction policy** | TTL aggressivo su cache non critica | Riduzione tier Redis | Dopo 60gg di dati hit-rate |
| **OpenAI prompt optimization** | Riduzione token per chiamata | −20–40% su OpenAI | Ongoing — ottimizzazione continua |

---

## 6. Rischi di cost escalation

Questa sezione identifica i principali vettori di crescita non governata dei costi. Ogni rischio include una misura di mitigazione raccomandata.

### 6.1 Crescita utenti non governata

**Rischio:** Il superamento delle soglie di tier (es. SQL 4→8 vCore, Redis C1→C2, Log Analytics > 10 GB/giorno) avviene in modo discontinuo e può produrre incrementi di costo del 50–100% in un singolo mese.

**Probabilità:** Media (dipende dal successo della piattaforma).

**Mitigazione:**
- Definire **trigger espliciti di upgrade** (es. CPU SQL > 70% per 7 giorni consecutivi → valutare upgrade)
- Non anticipare lo scale-up: start small, scale based on data
- Monitorare DAU/MAU settimanalmente con alert automatici

---

### 6.2 Architettura sovradimensionata in fase iniziale

**Rischio:** Provisioning "per il picco futuro" sin dal giorno 1 — tipicamente su SQL Database (tier troppo alto) e Redis (C2 invece di C0/C1).

**Probabilità:** Alta (pattern ricorrente in fase di setup).

**Mitigazione:**
- Partire **sempre dallo scenario LOW**, anche se il target è REALISTIC
- Pianificare upgrade a 90 giorni dal go-live, con dati reali
- Documentare la decisione di tier nel runbook infrastrutturale

---

### 6.3 Uso non governato di servizi AI e Maps

**Rischio:** Azure AI Document Intelligence, Azure OpenAI e Azure Maps sono a consumo. Un bug applicativo (loop di chiamate, retry non gestiti) o una feature mal progettata può produrre spike di costo in poche ore.

**Probabilità:** Alta (senza alert specifici).

**Servizi a rischio:**
- Azure OpenAI: token mal ottimizzati, chiamate duplicate
- Azure AI Document Intelligence: upload multipli dello stesso CV
- Azure Maps: geocoding su ogni richiesta anziché caching

**Mitigazione:**
- **Budget alert su ogni servizio AI** con soglia mensile e notifica a 80% della soglia
- Rate limiting applicativo su endpoint che invocano servizi AI
- Caching obbligatorio dei risultati Maps (TTL 24h minimo)
- Deduplicazione documenti prima dell'invio a Document Intelligence

---

### 6.4 Feature future non incluse nella stima

**Rischio:** Le seguenti funzionalità sono **escluse dalla stima attuale** e richiedono budget separato quando approvate:

| Feature | Servizi Azure addizionali | Costo addizionale stimato/mese |
|---|---|---:|
| Event Radar | Azure Event Grid, Service Bus, Functions premium | €80–150 |
| CV extraction avanzata (multi-lingua) | AI Document Intelligence custom models | €100–200 |
| AI reranking (modello custom) | Azure Machine Learning, GPU compute | €300–800 |
| Notifiche push | Azure Notification Hubs | €20–50 |
| Analytics avanzate | Azure Synapse o Power BI Embedded | €150–400 |

---

### 6.5 Costi di egress bandwidth

**Rischio:** Il traffico in uscita da Azure (egress) cresce con l'adozione e non è sempre evidente nel pricing. Con 5.000 utenti e foto/contenuti media-rich, i costi CDN ed egress possono superare le stime iniziali del 30–50%.

**Mitigazione:**
- Monitorare mensilmente il dato "Data transfer out" in Azure Cost Analysis
- Applicare compressione media (WebP, AVIF) per ridurre peso delle foto
- Implementare lazy loading e CDN caching aggressivo (max-age 7 giorni per asset statici)

---

### 6.6 Log Analytics ingest non monitorato

**Rischio:** Log Analytics a ingest elevato è uno dei costi più difficili da controllare. Un aumento del livello di logging (DEBUG in produzione, errori applicativi ripetuti) può triplicare il costo mensile senza alert.

**Probabilità:** Alta senza governance.

**Mitigazione:**
- Alert su ingest giornaliero > 120% della baseline
- Regola esplicita: livello di log in produzione = INFO (mai DEBUG)
- Configurare **Basic Log tier** per log diagnostici non critici (costo ~10× inferiore)
- Revisione mensile del top-10 contributor di ingest

---

## 7. Governo dei costi (FinOps)

Il governo proattivo dei costi è parte integrante dell'architettura operativa della piattaforma. Non è un'attività opzionale o postuma.

### 7.1 Azure Cost Management — Budget e Alert

Configurare i seguenti budget nel primo giorno operativo:

| Budget | Scope | Soglia alert | Azione al trigger |
|---|---|---|---|
| **Budget mensile totale** | Subscription / Resource Group | 80% del budget mensile previsto | Notifica email al responsabile infrastruttura + PM |
| **Budget servizi AI** | OpenAI + Document Intelligence + Maps | €X/mese (da definire per scenario) | Alert immediato — possibile bug applicativo |
| **Budget Log Analytics** | Workspace specifico | 120% del baseline ingest | Verifica immediata log level produzione |
| **Budget staging** | Resource Group staging | €50/mese (scenario LOW/REALISTIC) | Review utilizzo staging — possibile spreco |

> ⚠️ I budget in Azure Cost Management sono **notifiche, non blocchi**. Il sistema non stoppa i servizi al raggiungimento della soglia. Configurare anche **spending limits** dove tecnicamente possibile.

---

### 7.2 Revisione mensile dei costi

Istituire una **revisione mensile strutturata** (1 ora, primo lunedì del mese) con:

| Agenda | Input | Output |
|---|---|---|
| Costi effettivi vs previsti per servizio | Azure Cost Analysis export | Delta e spiegazione degli scostamenti |
| Top-5 servizi per crescita MoM | Cost Management trend | Azioni correttive o alert update |
| Verifica utilizzo staging | Azure Advisor + Cost | Decision: ridurre o eliminare risorse inutilizzate |
| Aggiornamento proiezione trimestrale | Trend attuale | Forecast aggiornato per prossimo trimestre |

---

### 7.3 Tagging obbligatorio delle risorse

**Ogni risorsa Azure deve avere i seguenti tag** prima del deploy in produzione:

| Tag | Valori ammessi | Scopo |
|---|---|---|
| `environment` | `production`, `staging`, `dev` | Separazione costi per ambiente |
| `project` | `hello-work` | Isolamento costi progetto |
| `owner` | email del responsabile tecnico | Accountability |
| `component` | `api`, `frontend`, `database`, `ai`, `monitoring` | Drill-down per componente |
| `cost-center` | codice centro di costo | Reportistica finanziaria |

> Implementare una **Azure Policy** che rifiuta il deploy di risorse senza i tag obbligatori (`environment`, `project`, `owner`). Costo: €0. Beneficio: reportistica affidabile dal giorno 1.

---

### 7.4 Reserved Instances — regola dei 3 mesi

**Non acquistare Reserved Instances prima di 3 mesi di dati reali in produzione.**

La motivazione:
- Il dimensionamento iniziale è quasi sempre sbagliato (sia over che under provisioning)
- Le Reserved Instances sono impegni 1–3 anni e non sono rimborsabili
- 3 mesi di dati reali permettono di scegliere il tier corretto con confidenza > 90%

**Timing raccomandato:**

| Azione | Timing |
|---|---|
| Go-live su Pay-As-You-Go | Mese 0 |
| Prima analisi utilizzo risorse | Fine mese 1 |
| Decisione di tier definitivo | Fine mese 3 |
| Acquisto Reserved Instances (se confermato) | Mese 4 |

**Risparmio atteso post-Reserved Instances (SQL Database, 1 anno):**

| Scenario | Costo SQL Pay-As-You-Go | Costo SQL Reserved 1Y | Risparmio/anno |
|---|---:|---:|---:|
| LOW (2 vCore) | €2.940 | ~€1.960 | **~€980** |
| REALISTIC (4 vCore) | €5.880 | ~€3.920 | **~€1.960** |
| HIGH (8 vCore) | €11.760 | ~€7.840 | **~€3.920** |

---

### 7.5 Staging environment — spegnimento automatico

L'ambiente di staging **non deve girare 24/7**. Configurare:

```yaml
# Azure Automation — Schedule per staging shutdown
Spegnimento automatico: lunedì–venerdì ore 19:00 CET
Riavvio automatico:     lunedì–venerdì ore 08:00 CET
Weekend:                OFF (sabato 19:00 → lunedì 08:00)

Risorse interessate:
  - Container Apps (scale-to-zero)
  - Azure SQL (pausa automatica se serverless, altrimenti stop VM)
  - Azure Cache for Redis (non supporta pause — valutare downgrade a C0 Basic in staging)
```

**Risparmio effettivo stimato:**
- Orario attivo staging: ~55 ore/settimana su 168 disponibili = **33% del tempo**
- Risparmio effettivo vs staging always-on: **−60% sul costo staging**
- Equivale a: LOW **−€71/mese**, REALISTIC **−€156/mese**, HIGH **−€312/mese**

---

### 7.6 Checklist FinOps — pre Go-Live

Prima del go-live in produzione, verificare che siano attivi:

- [ ] Budget mensile configurato in Azure Cost Management (80% alert)
- [ ] Budget per servizi AI configurato separatamente
- [ ] Tagging completato su tutte le risorse (validato via Azure Policy)
- [ ] Log Analytics: livello di log impostato a INFO in produzione
- [ ] Log Analytics: alert su ingest giornaliero configurato
- [ ] Staging: schedule auto-shutdown configurato e testato
- [ ] Blob Storage: lifecycle policy per Cold Tier dopo 90gg attiva
- [ ] CDN: caching rules configurate per asset statici
- [ ] Azure Advisor: review raccomandazioni post-deploy (primo run)
- [ ] Revisione mensile: prima sessione calendarizzata

---

*Documento redatto su brief di Alessandro Rapiti (area CAI — Cloud, App & Infrastructure)*  
*Revisione FinOps v2.0 — 20 giugno 2026*
```

---

**Nota sul footer:** ho rimosso il riferimento a "Dreaming workspace" che non ha senso nel repo `hello-work`. Il footer ora è neutro e professionale.

**Nome file suggerito per il repo:** `docs/infra/stima-costi-esercizio-azure.md` oppure `docs/stima-costi-esercizio-azure-v2.md` — scegli tu la collocazione più coerente con la struttura che avete già.
