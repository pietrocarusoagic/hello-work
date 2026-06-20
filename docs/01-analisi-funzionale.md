# Documento di Analisi Funzionale — Hello Work

---

## 1. Executive Summary

### Il Problema

Il lavoro remoto e ibrido ha reso le organizzazioni più flessibili, ma ha distrutto un elemento insostituibile della vita aziendale: la **serendipità relazionale**. L'incontro casuale alla macchina del caffè, la conversazione spontanea in corridoio, la scoperta che il collega di un altro team ha già risolto il problema su cui stai lavorando da settimane — tutto questo è scomparso. Il risultato è un tessuto sociale aziendale frammentato, knowledge silos sempre più profondi e una sensazione diffusa di isolamento, in particolare tra i nuovi assunti.

### La Soluzione

**Hello Work** è una piattaforma di corporate networking progettata per la generazione ibrida. Ricostruisce la serendipità in modo ingegnerizzato: attraverso profili strutturati su tre pilastri (professionale, agentiche, umano/personale), un sistema di matching deterministico su tag, e meccaniche di discovery ispirate ai social consumer — reimmaginate per il contesto enterprise.

**Tagline**: *Connect. Discover. Belong.*

### Target Users

Dipendenti di aziende enterprise in modalità remota, ibrida o distribuita su più sedi. Priorità hackathon: organizzazione AGIC con uffici in Italia e Tirana.

### Business Value

| Dimensione | Impatto atteso |
|---|---|
| **Onboarding time-to-connection** | Riduzione del 40-60% del tempo necessario a un nuovo assunto per identificare i colleghi rilevanti |
| **Knowledge sharing agentiche** | Creazione di un repository vivo di AI workflow aziendali, oggi disperso e non strutturato |
| **Employee engagement** | Riduzione del senso di isolamento remoto; aumento dell'appartenenza percepita |
| **Talent retention** | Le relazioni interpersonali sono il principale driver di retention; Hello Work le costruisce sistematicamente |
| **Cross-team collaboration** | Discovery proattiva di competenze complementari attraverso sedi e team |

---

## 2. Contesto e Obiettivi

### 2.1 Contesto

L'adozione massiva di lavoro remoto e ibrido, accelerata dal 2020, ha prodotto tre patologie organizzative strutturali:

**Isolamento relazionale**: I dipendenti remoti, specialmente i nuovi assunti, faticano a costruire una rete di colleghi al di fuori del loro team diretto. L'onboarding informale — quello che avviene nei corridoi, nelle pause, nei pranzi — non esiste più in forma spontanea.

**Knowledge silos agentiche**: La diffusione di strumenti AI (Copilot, Claude, n8n, LangChain, ecc.) ha generato una proliferazione di setup, workflow e soluzioni individuali che non vengono mai condivise organizzativamente. Ogni professionista reinventa la ruota in isolamento.

**Frammentazione geografica**: Organizzazioni con più sedi (come AGIC con Italia + Tirana) hanno difficoltà a creare senso di comunità cross-office. Chi lavora a Tirana non sa chi ha competenze simili a Milano, e viceversa.

### 2.2 Obiettivi di Progetto

**Obiettivo primario**: Fornire un punto di accesso unico per la discovery di persone, competenze e interessi all'interno dell'organizzazione.

**Obiettivi secondari**:
- Rendere il profilo professionale più ricco e più utile del classico organigramma
- Creare un canale strutturato per la condivisione di knowledge agentiche
- Facilitare la formazione organica di community di interesse (gruppi)
- Dare visibilità geografica alla distribuzione dei talenti nelle sedi fisiche

**KPI di successo (POC)**:
- % di dipendenti con profilo compilato ≥ 80% entro 30 giorni dal lancio
- Numero di WorkMatch bilaterali completati nella prima settimana
- Numero di gruppi creati spontaneamente dagli utenti
- Numero di ricerche nel repository agentiche

---

## 3. Requisiti Funzionali per Modulo

---

### 3.1 Autenticazione & Onboarding

#### Autenticazione

| ID | Requisito |
|----|-----------|
| AUTH-01 | Il sistema deve supportare autenticazione tramite **Azure AD SSO** (OAuth 2.0 / OIDC) |
| AUTH-02 | Al primo accesso, l'utente deve essere reindirizzato automaticamente al flusso di onboarding guidato |
| AUTH-03 | Il sistema deve pre-popolare automaticamente i campi del Pilastro Professionale con i dati disponibili da Azure AD (nome, cognome, ruolo, dipartimento, sede) |
| AUTH-04 | Nessuna password locale deve essere gestita dalla piattaforma — l'autenticazione è delegata interamente ad Azure AD |
| AUTH-05 | Le sessioni devono scadere secondo la policy Azure AD dell'organizzazione |

#### Onboarding Guidato ("Ti presenti")

| ID | Requisito |
|----|-----------|
| ONB-01 | Al primo accesso deve essere presentato un wizard a **3 step** denominato "Ti presenti" |
| ONB-02 | **Step 1 — Chi sei professionalmente**: conferma/integrazione dati da Azure AD, aggiunta skill e certificazioni |
| ONB-03 | **Step 2 — Il tuo setup agentiche**: selezione tag tool AI (lista predefinita + campo libero), descrizione testuale opzionale del proprio workflow |
| ONB-04 | **Step 3 — Chi sei come persona**: selezione hobby tag (lista predefinita + campo libero), interessi personali |
| ONB-05 | Ogni step deve mostrare una progress bar con indicatore visivo di completamento |
| ONB-06 | L'utente deve poter saltare uno step e completarlo successivamente dal profilo |
| ONB-07 | Al completamento dell'onboarding, l'utente deve essere reindirizzato alla Discovery Home |
| ONB-08 | Se l'onboarding non è completato al 100%, una notifica in-app deve ricordare all'utente di completarlo |

---

### 3.2 Gestione Profilo (3 Pilastri)

#### Struttura del Profilo

Il profilo è organizzato in tre pilastri distinti, accessibili e modificabili separatamente.

**Pilastro 1 — Professionale**

| ID | Requisito |
|----|-----------|
| PRF-01 | Il pilastro deve contenere: nome, cognome, foto profilo, ruolo/job title, dipartimento, sede, seniority level |
| PRF-02 | I campi principali sono pre-popolati da Azure AD e modificabili dall'utente (con flag visivo "dato sincronizzato") |
| PRF-03 | L'utente può aggiungere **skill tag** da una tassonomia predefinita (es. Project Management, Cloud Architecture, Data Analysis) con possibilità di aggiungere tag custom |
| PRF-04 | L'utente può aggiungere **certificazioni** con nome, ente erogatore e anno di conseguimento |
| PRF-05 | L'utente può aggiungere **esperienze pregresse** rilevanti (campo libero strutturato) |
| PRF-06 | È presente un indicatore di **completeness del profilo** (0-100%) che incentiva la compilazione |

**Pilastro 2 — Agentiche**

| ID | Requisito |
|----|-----------|
| PRF-07 | L'utente può selezionare **tool AI tag** da una lista predefinita (Claude, Copilot, ChatGPT, n8n, LangChain, Make, Zapier, Cursor, Perplexity, ecc.) con possibilità di aggiunta custom |
| PRF-08 | L'utente può inserire una **descrizione testuale libera** del proprio setup agentiche (max 2000 caratteri) |
| PRF-09 | L'utente può pubblicare **workflow/soluzioni** strutturate nel Repository Agentiche direttamente dal proprio profilo |
| PRF-10 | Il pilastro deve mostrare un collegamento al contributo dell'utente nel Repository Agentiche |

**Pilastro 3 — Umano/Personale**

| ID | Requisito |
|----|-----------|
| PRF-11 | L'utente può selezionare **hobby tag** da una lista predefinita (Running, Board Games, Photography, Cooking, Travel, Music, Cinema, Yoga, Climbing, ecc.) con possibilità di aggiunta custom |
| PRF-12 | L'utente può aggiungere una **bio personale** libera (max 500 caratteri) |
| PRF-13 | Il pilastro è **visibile solo agli utenti autenticati** della stessa organizzazione |
| PRF-14 | L'utente può scegliere di rendere il pilastro personale **visibile/nascosto** nelle ricerche pubbliche interne |

---

### 3.3 Discovery & Matching

#### Discovery Home

| ID | Requisito |
|----|-----------|
| DIS-01 | La Home deve presentare un **feed personalizzato** al rientro di ogni utente autenticato |
| DIS-02 | Il feed deve contenere: persone suggerite (matching), aggiornamenti dai gruppi/match attivi, nuovi contributi al Repository Agentiche |
| DIS-03 | I suggerimenti di persone devono essere ordinati per **punteggio di affinità** calcolato deterministicamente (vedi algoritmo sotto) |
| DIS-04 | L'utente deve poter **filtrare i suggerimenti** per pilastro (professionale / agentiche / personale) e per sede |
| DIS-05 | La Home deve essere **mobile-responsive** e ottimizzata per consultazione rapida |

#### Algoritmo di Matching Deterministico

| ID | Requisito |
|----|-----------|
| DIS-06 | Il punteggio di affinità deve essere calcolato come somma pesata di overlap sui tag dei 3 pilastri |
| DIS-07 | **Pesi predefiniti**: Professionale = 40%, Agentiche = 35%, Personale = 25% |
| DIS-08 | Per ogni pilastro, il punteggio parziale è: `(tag in comune / totale tag utente) * peso pilastro` |
| DIS-09 | Il sistema deve escludere dall'algoritmo i tag non compilati (nessuna penalità per profili incompleti) |
| DIS-10 | I pesi devono essere configurabili da admin senza deploy |
| DIS-11 | L'algoritmo non deve usare ML/AI nella fase POC — solo matching deterministico su tag |

#### Ricerca

| ID | Requisito |
|----|-----------|
| DIS-12 | Deve essere disponibile una **ricerca globale** per nome, skill, tool AI, hobby, sede |
| DIS-13 | La ricerca deve supportare **filtri combinati** (AND logico tra filtri attivi) |
| DIS-14 | I risultati devono essere ordinati per punteggio di affinità rispetto all'utente corrente |

---

### 3.4 WorkMatch (Swipe 1:1)

| ID | Requisito |
|----|-----------|
| WM-01 | La sezione WorkMatch deve presentare card di profili suggeriti in modalità **swipe** (ispirazione Tinder, tono professionale) |
| WM-02 | Ogni card deve mostrare: foto, nome, ruolo, sede, i 3 tag più rilevanti per il match |
| WM-03 | L'utente può esprimere **interesse** (swipe right / bottone "Connetti") o **passare** (swipe left / bottone "Passa") |
| WM-04 | Un **match bilaterale** si verifica quando entrambi gli utenti esprimono interesse reciproco |
| WM-05 | Al match bilaterale, il sistema deve suggerire una **coffee chat virtuale** con prompt per pianificare un incontro (testo suggerito personalizzato basato sui tag in comune) |
| WM-06 | I match attivi devono essere visibili in una sezione dedicata "Le mie connessioni" |
| WM-07 | Le card da mostrare devono essere selezionate dall'algoritmo di matching, con esclusione degli utenti già swipati |
| WM-08 | L'utente deve poter **annullare un match** in qualsiasi momento |
| WM-09 | I profili già swipati non devono ricomparire nelle card per almeno 30 giorni |

---

### 3.5 Gruppi

| ID | Requisito |
|----|-----------|
| GRP-01 | Il sistema deve **suggerire automaticamente gruppi** all'utente basandosi sull'overlap di tag (es. "Vediamo che 6 tuoi colleghi usano n8n — vuoi unirti al gruppo n8n Users?") |
| GRP-02 | L'utente può **creare un gruppo** specificando: nome, descrizione, tag tematici, visibilità (aperto / su invito) |
| GRP-03 | L'utente può **iscriversi a un gruppo** esistente |
| GRP-04 | Ogni gruppo deve avere: lista membri, bacheca aggiornamenti (post semplici), tag tematici |
| GRP-05 | I post nella bacheca del gruppo devono apparire nel feed Discovery Home degli iscritti |
| GRP-06 | Il creatore del gruppo è automaticamente **admin** e può invitare/rimuovere membri |
| GRP-07 | Il sistema deve prevedere **gruppi di sistema** creati dall'admin (es. "Team Milano", "Tirana Office", "AI Champions") pre-popolati da Azure AD |
| GRP-08 | Deve esistere un **catalogo gruppi** navigabile con ricerca per nome e tag |

---

### 3.6 Office Map

| ID | Requisito |
|----|-----------|
| MAP-01 | La mappa deve visualizzare le **sedi AGIC**: uffici italiani + Tirana |
| MAP-02 | Ogni sede deve mostrare un **cluster di persone** presenti/assegnate, con indicatore numerico |
| MAP-03 | L'utente deve poter **filtrare la mappa** per skill tag, tool AI, hobby tag |
| MAP-04 | Cliccando su un cluster, si apre una **lista di persone** filtrata per quella sede |
| MAP-05 | Cliccando su una persona dalla mappa, si apre il suo profilo completo |
| MAP-06 | La mappa deve supportare **zoom** per visualizzare sedi aggregate vs dettaglio |
| MAP-07 | I dati di presenza/sede devono essere sincronizzati da Azure AD (campo "office location") |
| MAP-08 | **Nota privacy**: la mappa mostra la sede di assegnazione, non la posizione real-time dell'utente |

---

### 3.7 Agentic Knowledge Repository

| ID | Requisito |
|----|-----------|
| AKR-01 | Il Repository è una **directory ricercabile** di setup AI, workflow e soluzioni contribuiti dai dipendenti |
| AKR-02 | Ogni contributo deve avere: titolo, descrizione (rich text, max 5000 car.), tag tool AI coinvolti, autore, data pubblicazione |
| AKR-03 | L'utente può **pubblicare un contributo** direttamente dal proprio profilo (pilastro Agentiche) o dalla sezione Repository |
| AKR-04 | Il Repository deve supportare **ricerca full-text** su titolo e descrizione |
| AKR-05 | I contributi devono essere **filtrabili per tool AI** (es. "mostra tutti i workflow che usano n8n") |
| AKR-06 | Ogni contributo deve mostrare il numero di **visualizzazioni** e permettere di aggiungere ai preferiti |
| AKR-07 | I contributi con più engagement devono apparire in evidenza nella Discovery Home |
| AKR-08 | Un **admin moderatore** deve poter approvare/rimuovere contributi (workflow di moderazione semplice) |

---

## 4. Requisiti Non Funzionali

### 4.1 Performance

| ID | Requisito |
|----|-----------|
| NF-PERF-01 | Il tempo di caricamento della Discovery Home deve essere **< 2 secondi** per p95 su connessione standard |
| NF-PERF-02 | Il calcolo del punteggio di matching deve essere **< 500ms** per un pool di 1.000 utenti |
| NF-PERF-03 | La ricerca deve restituire risultati in **< 1 secondo** |
| NF-PERF-04 | L'applicazione deve supportare fino a **500 utenti concorrenti** senza degradazione (target POC) e fino a **5.000** in versione Enterprise |

### 4.2 Sicurezza

| ID | Requisito |
|----|-----------|
| NF-SEC-01 | Tutta la comunicazione deve avvenire su **HTTPS/TLS 1.3** |
| NF-SEC-02 | I token di sessione devono essere gestiti tramite **Azure AD / MSAL** — nessun token custom |
| NF-SEC-03 | I dati utente devono essere accessibili **solo agli utenti autenticati** della stessa tenant Azure AD |
| NF-SEC-04 | Le API backend devono implementare **rate limiting** per prevenire abusi |
| NF-SEC-05 | I log applicativi non devono contenere dati personali in chiaro |
| NF-SEC-06 | Deve essere implementato un modello di **ruoli** (User, Admin, Moderator) con RBAC |

### 4.3 Privacy & GDPR

| ID | Requisito |
|----|-----------|
| NF-GDPR-01 | L'applicazione deve essere conforme al **Regolamento UE 2016/679 (GDPR)** |
| NF-GDPR-02 | Al primo accesso, l'utente deve accettare l'informativa privacy e il trattamento dati |
| NF-GDPR-03 | L'utente deve poter richiedere l'**export dei propri dati** in formato leggibile (JSON/CSV) |
| NF-GDPR-04 | L'utente deve poter richiedere la **cancellazione del proprio profilo** (diritto all'oblio) |
| NF-GDPR-05 | Il Pilastro Personale deve essere configurabile come **opt-in** — non visibile per default nei listing |
| NF-GDPR-06 | Deve essere documentato un **Data Processing Agreement** con i fornitori cloud (Azure) |

### 4.4 Accessibilità

| ID | Requisito |
|----|-----------|
| NF-ACC-01 | L'interfaccia deve rispettare le linee guida **WCAG 2.1 livello AA** |
| NF-ACC-02 | Tutte le immagini devono avere **alt text** descrittivo |
| NF-ACC-03 | La navigazione deve essere completamente fruibile via **tastiera** |
| NF-ACC-04 | Il contrasto cromatico deve rispettare i requisiti minimi WCAG (4.5:1 per testo normale) |

### 4.5 Compatibilità & Responsività

| ID | Requisito |
|----|-----------|
| NF-COMP-01 | L'applicazione deve essere **mobile-responsive** (layout adattivo da 320px) |
| NF-COMP-02 | Deve essere supportata l'ultima versione stabile dei principali browser: Chrome, Edge, Firefox, Safari |
| NF-COMP-03 | L'autenticazione Azure AD deve funzionare su dispositivi mobile via browser |

### 4.6 Integrazioni

| ID | Requisito |
|----|-----------|
| NF-INT-01 | Integrazione **Azure Active Directory** via OIDC per autenticazione e sincronizzazione attributi profilo |
| NF-INT-02 | L'integrazione AD deve sincronizzare almeno: displayName, jobTitle, department, officeLocation, mail, userPrincipalName |
| NF-INT-03 | La sincronizzazione AD deve avvenire **ad ogni login** (dati freschi garantiti) |

---

## 5. User Stories

### Autenticazione & Onboarding

> **US-01** — Come **nuovo dipendente**, voglio accedere a Hello Work con le mie credenziali aziendali Microsoft per non dover gestire un'ulteriore password.

> **US-02** — Come **nuovo utente**, voglio essere guidato in un onboarding a 3 step per presentarmi ai miei colleghi in modo completo e strutturato senza sentirmi sopraffatto.

> **US-03** — Come **utente che ha saltato l'onboarding**, voglio ricevere un promemoria persistente sul completamento del profilo per massimizzare la mia visibilità nelle ricerche.

### Profilo

> **US-04** — Come **consulente senior**, voglio aggiungere i miei tool AI preferiti al profilo agentiche per essere trovato da colleghi che lavorano con gli stessi strumenti e costruire community di pratica.

> **US-05** — Come **dipendente appassionato di board games**, voglio inserire i miei hobby nel profilo personale per scoprire colleghi con cui condividere interessi al di fuori del lavoro.

> **US-06** — Come **utente**, voglio vedere un indicatore di completamento del mio profilo per capire cosa manca e migliorare la mia visibilità nell'algoritmo di matching.

### Discovery & Matching

> **US-07** — Come **dipendente remoto**, voglio vedere una home con persone suggerite in base ai miei tag per scoprire ogni giorno colleghi rilevanti senza doverli cercare attivamente.

> **US-08** — Come **team lead**, voglio filtrare le ricerche per skill e sede per trovare rapidamente la persona giusta per un progetto senza dover interpellare HR o scorrere l'organigramma.

### WorkMatch

> **US-09** — Come **dipendente che vuole espandere la propria rete**, voglio sfogliare profili in modalità swipe per esprimere interesse in modo rapido e leggero, senza l'imbarazzo di una richiesta formale di connessione.

> **US-10** — Come **utente che ha ricevuto un match bilaterale**, voglio ricevere un suggerimento di coffee chat personalizzato per avere un'occasione concreta di rompere il ghiaccio con il mio nuovo match.

### Gruppi

> **US-11** — Come **esperto di automazione n8n**, voglio creare un gruppo tematico su n8n per raccogliere tutti i colleghi con lo stesso interesse e scambiare workflow e best practice.

> **US-12** — Come **nuovo assunto**, voglio ricevere suggerimenti automatici di gruppi da parte del sistema per integrarmi rapidamente nelle community aziendali rilevanti per il mio profilo.

### Office Map

> **US-13** — Come **dipendente in trasferta a Tirana**, voglio visualizzare sulla mappa chi è presente nell'ufficio di Tirana e ha skill simili alle mie per organizzare un incontro in presenza senza dover inviare email a tutta la sede.

### Agentic Knowledge Repository

> **US-14** — Come **AI practitioner**, voglio pubblicare la descrizione del mio workflow Claude + n8n nel Repository per condividerlo con i colleghi ed evitare che ognuno reinventi la stessa soluzione.

> **US-15** — Come **consulente che inizia un progetto di automazione**, voglio cercare nel Repository per tool AI per trovare soluzioni già adottate in azienda e partire da una base solida invece che da zero.

---

## 6. Scope: MVP vs Enterprise

### Legenda
| Simbolo | Significato |
|---|---|
| ✅ | Incluso |
| 🔶 | Parzialmente incluso / versione semplificata |
| ❌ | Non incluso |

### Tabella Scope

| Feature | POC (Hackathon) | v1.0 (3 mesi) | Enterprise (12 mesi) |
|---|---|---|---|
| **Autenticazione Azure AD SSO** | ✅ | ✅ | ✅ |
| **Onboarding guidato 3 step** | ✅ | ✅ | ✅ |
| **Profilo — Pilastro Professionale** | ✅ (pre-pop. AD) | ✅ | ✅ + validazione esterna (LinkedIn sync) |
| **Profilo — Pilastro Agentiche** | ✅ | ✅ | ✅ |
| **Profilo — Pilastro Personale** | ✅ | ✅ | ✅ |
| **Completeness indicator profilo** | 🔶 visuale semplice | ✅ gamification | ✅ gamification + badge |
| **Discovery Home — feed personalizzato** | ✅ | ✅ | ✅ + AI-powered reranking |
| **Algoritmo matching deterministico** | ✅ | ✅ | ✅ + ML hybrid scoring |
| **Ricerca con filtri combinati** | 🔶 filtri base | ✅ | ✅ + ricerca semantica |
| **WorkMatch — swipe UI** | ✅ | ✅ | ✅ |
| **WorkMatch — coffee chat suggestion** | 🔶 testo statico | ✅ testo personalizzato | ✅ + calendar integration |
| **Gruppi — creazione e join** | ✅ | ✅ | ✅ |
| **Gruppi — suggerimento automatico** | ✅ | ✅ | ✅ |
| **Gruppi — bacheca/post** | 🔶 post semplici | ✅ rich text + allegati | ✅ + thread + reactions |
| **Office Map — sedi AGIC** | ✅ | ✅ | ✅ multi-tenant, tutte le sedi |
| **Office Map — cluster + filtri** | ✅ | ✅ | ✅ |
| **Office Map — presenza real-time** | ❌ | 🔶 self-declared | ✅ calendar integration |
| **Agentic Knowledge Repository** | ✅ | ✅ | ✅ |
| **Repository — moderazione** | 🔶 manuale admin | ✅ workflow approvazione | ✅ + AI content tagging |
| **Notifiche in-app** | ❌ | ✅ | ✅ |
| **Notifiche email/Teams** | ❌ | ✅ | ✅ |
| **HR Analytics Dashboard** | ❌ | ❌ | ✅ |
| **Icebreaker feed automatico** | ❌ | 🔶 | ✅ |
| **Mobile PWA** | ❌ (responsive web) | 🔶 | ✅ |
| **Multi-tenant** | ❌ (single org) | ❌ | ✅ |
| **Calendar integration** | ❌ | ❌ | ✅ |
| **Admin panel** | 🔶 base | ✅ | ✅ completo |
| **GDPR — export/cancellazione** | 🔶 manuale | ✅ self-service | ✅ |
| **Accessibilità WCAG 2.1 AA** | 🔶 best effort | ✅ | ✅ certificata |
| **SLA / monitoring** | ❌ | 🔶 | ✅ 99.9% uptime SLA |

---

## 7. Stima Giornate Uomo

### Parametri di stima
- **Giornata lavorativa**: 8 ore
- **Approccio**: Agile, sprint da 2 settimane
- **Stack assunto**: React (frontend), Python FastAPI (backend), PostgreSQL + Azure infra
- **Scope**: v1.0 completa (superset del POC, baseline commerciale)

---

### Breakdown per Fase e Ruolo

| Fase | Attività | Solution Architect | Senior Consultant | Consultant | Junior | PM |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **1. Discovery & Analysis** | Workshops stakeholder, analisi requisiti, definizione scope | 2 | 2 | 1 | 0 | 3 |
| | Definizione tassonomia tag (skill, AI tools, hobby) | 0 | 2 | 2 | 0 | 1 |
| | Data model review Azure AD, GDPR assessment | 1 | 2 | 1 | 0 | 1 |
| | **Subtotale Fase 1** | **3** | **6** | **4** | **0** | **5** |
| **2. Architecture & Design** | System architecture design (frontend, backend, infra, auth) | 5 | 2 | 0 | 0 | 1 |
| | Database design (schema profilo, tag, matching, gruppi) | 2 | 3 | 1 | 0 | 0 |
| | API design (OpenAPI spec, contratti) | 2 | 3 | 2 | 0 | 0 |
| | Security architecture (Azure AD OIDC, RBAC, GDPR) | 3 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 2** | **12** | **10** | **4** | **0** | **1** |
| **3. UX / UI Design** | User flows, wireframe, prototipo Figma | 1 | 2 | 0 | 0 | 1 |
| | UI design system + componenti | 0 | 3 | 3 | 1 | 0 |
| | Revisione accessibilità WCAG | 0 | 2 | 1 | 0 | 0 |
| | **Subtotale Fase 3** | **1** | **7** | **4** | **1** | **1** |
| **4. Frontend Development** | Setup progetto React, routing, auth MSAL | 0 | 2 | 3 | 2 | 0 |
| | Onboarding wizard (3 step) | 0 | 1 | 3 | 3 | 0 |
| | Gestione profilo (3 pilastri + completeness) | 0 | 2 | 4 | 4 | 0 |
| | Discovery Home + feed | 0 | 2 | 3 | 3 | 0 |
| | WorkMatch swipe UI | 0 | 1 | 3 | 4 | 0 |
| | Gruppi (lista, catalogo, bacheca) | 0 | 1 | 3 | 4 | 0 |
| | Office Map (mappa interattiva + filtri) | 0 | 2 | 4 | 3 | 0 |
| | Agentic Repository (listing + ricerca + detail) | 0 | 1 | 3 | 3 | 0 |
| | Ricerca globale + filtri | 0 | 1 | 2 | 2 | 0 |
| | Admin panel base | 0 | 1 | 2 | 2 | 0 |
| | **Subtotale Fase 4** | **0** | **14** | **30** | **30** | **0** |
| **5. Backend Development** | Setup FastAPI, modelli dati, migrazioni DB | 0 | 2 | 3 | 2 | 0 |
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
| **6. Infrastruttura & DevOps** | Azure provisioning (App Service, PostgreSQL, Key Vault) | 2 | 3 | 2 | 1 | 0 |
| | CI/CD pipeline (GitHub Actions) | 1 | 2 | 2 | 1 | 0 |
| | Configurazione ambienti (dev, staging, prod) | 1 | 1 | 2 | 1 | 0 |
| | Monitoring base (Application Insights) | 1 | 1 | 1 | 0 | 0 |
| | **Subtotale Fase 6** | **5** | **7** | **7** | **3** | **0** |
| **7. Testing & QA** | Test plan, definizione casi di test | 0 | 2 | 2 | 1 | 1 |
| | Unit test backend (copertura ≥ 80%) | 0 | 2 | 3 | 3 | 0 |
| | Integration test (API + DB) | 0 | 1 | 3 | 2 | 0 |
| | E2E test (Playwright/Cypress — flussi critici) | 0 | 1 | 2 | 3 | 0 |
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

### Riepilogo per Ruolo

| Ruolo | Giorni Uomo | Tariffa indicativa (€/gg) | Costo stimato |
|---|:---:|:---:|:---:|
| Solution Architect | **25** | 800 | € 20.000 |
| Senior Consultant | **78** | 650 | € 50.700 |
| Consultant | **98** | 500 | € 49.000 |
| Junior Consultant | **69** | 350 | € 24.150 |
| Project Manager | **29** | 600 | € 17.400 |
| **TOTALE** | **299** | — | **€ 161.250** |

> ⚠️ **Note di stima**
> - La stima si riferisce a **v1.0 completa** (3 mesi, scope pieno)
> - Il **POC Hackathon** è stimato in ~**40-50 gg/u** (fasi 2, 4, 5, 6 ridotte al minimo)
> - Le tariffe sono indicative e non includono IVA né licenze software
> - La stima include un buffer del 15% per risk management e imprevisti (già incorporato)
> - Eventuali licenze Azure, tool di design o SaaS sono escluse e da quotare separatamente
> - Per la versione **Enterprise** (12 mesi, multi-tenant, ML, mobile PWA), la stima è da moltiplicare per un fattore 2.5-3x

---

### Cronoprogramma Macro

```
Mese 1   [████████████] Discovery + Architecture + UX Design + Setup Infra
Mese 2   [████████████] Frontend + Backend (core modules: Auth, Profilo, Discovery, WorkMatch)
Mese 3   [████████████] Frontend + Backend (Gruppi, Office Map, Repository) + Testing + UAT + Go-Live
```

---

*Documento prodotto per Hello Work — Hackathon Edition | Giugno 2026*
*AGIC — Connect. Discover. Belong.*

---

## Business Case

### Contesto e Problema

Il lavoro ibrido e da remoto ha trasformato profondamente il modo in cui le persone collaborano, si conoscono e si sentono parte di un'organizzazione. Il **62% dei lavoratori ibridi** dichiara di sentirsi meno connesso ai colleghi rispetto all'era pre-pandemia, e le organizzazioni con bassa coesione interna registrano tassi di turnover fino al **40% superiori** alla media.

| Problema | Impatto | Soluzione Hello Work |
|----------|---------|----------------------|
| Colleghi che non si conoscono tra sedi | Silos, duplicazione competenze | Discovery Feed + Tag-based Matching |
| Nessuna visibilità sui workflow AI | Knowledge loss, mancata adozione | Agentic Profile + Knowledge Repository |
| Difficoltà connessione cross-team | Bassa innovazione | WorkMatch — matching 1:1 |
| Uffici fisici sottoutilizzati | ROI immobiliare negativo | Office Map con people clustering |
| Isolamento remote workers | Engagement –28%, turnover +40% | Profilo Human/Personal + Groups |

### ROI — Riduzione Turnover

> Azienda 1.000 dipendenti, stipendio medio €45k, turnover 12% → 120 uscite/anno × €22.500 sostituzione = **€2.7M costo nascosto**. Ridurlo del 20% = **€540k/anno risparmiati** → break-even in < 4 mesi.

### ROI — Adozione AI

- Visibilità immediata su chi usa quali tool e come
- Riduzione tempo onboarding AI stimata –30%
- KPI: % dipendenti con ≥1 AI tool nel profilo entro 6 mesi

### ROI — Produttività

| Indicatore | Baseline | Target (12 mesi) |
|------------|----------|------------------|
| Connessioni cross-team/persona/mese | 0.5 | 3–5 |
| Time-to-find-expert interno | 2–4 giorni | < 4 ore |
| Employee Net Promoter Score | +15 | +35 |

---

*Documento prodotto per Hello Work — Hackathon Edition | Giugno 2026*
*AGIC — Connect. Discover. Belong.*
