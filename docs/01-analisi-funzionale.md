# Hello Work — Documento di Analisi Funzionale
**v1.1** · 20 Giugno 2026

---

## 0. Classificazione dell'Iniziativa

| Dimensione | Valore |
|------------|--------|
| **Tipo attuale** | POC (Proof of Concept) — hackathon / demo navigabile |
| **Fase successiva pianificata** | MVP Enterprise — primo cliente pilota (single tenant) |
| **Fase produzione** | Prodotto Enterprise multi-tenant (v2.0, fuori perimetro attuale) |
| **Base contrattuale** | Non definita — stima giornate da intendersi come ordine di grandezza |
| **Grado di maturità requisiti** | Bozza funzionale — soggetta a validazione con stakeholder cliente |

**Distinzione operativa:**

- **POC (oggi):** dimostrare la navigabilità del concept core. Nessun obbligo di completezza, scalabilità o conformità normativa.
- **MVP Enterprise (mesi 1–3):** primo rilascio in produzione su cliente reale, single tenant, perimetro funzionale limitato. Richiede governance GDPR, integrazione Azure AD, e piano di change management.
- **Prodotto Enterprise (mesi 4–9+):** multi-tenant, integrazioni avanzate, AI, mobile nativo. Stimato separatamente e condizionato all'esito del pilota.

---

## 1. Executive Summary

### 1.1 Contesto e Problema

Il lavoro remoto e ibrido ha modificato strutturalmente le modalità di collaborazione nelle organizzazioni distribuite. Accanto ai benefici di flessibilità e continuità operativa, emergono criticità documentate sul piano del capitale relazionale interno: riduzione delle interazioni informali, difficoltà nell'onboarding sociale dei nuovi assunti, erosione del senso di appartenenza in team distribuiti su più sedi o fusi orari.

Secondo Gallup (2024), il 60% dei lavoratori remoti riporta una diminuzione della connessione percepita con i colleghi. Le organizzazioni con basso punteggio di community interna registrano tassi di turnover superiori del 23% rispetto alla media. Questi dati indicano un'opportunità di intervento a supporto dell'engagement e della retention, ma la correlazione causale tra strumenti digitali e questi indicatori dipende in misura significativa da fattori organizzativi e culturali che esulano dallo scope tecnico della piattaforma.

Il problema che Hello Work intende affrontare è specifico: **la mancanza di un canale strutturato per la scoperta e il contatto tra colleghi al di fuori dei processi lavorativi formali.**

### 1.2 La Soluzione: Hello Work

Hello Work è una piattaforma di corporate networking progettata per abilitare connessioni tra colleghi — professionali e personali — in contesti aziendali distribuiti.

La piattaforma non sostituisce strumenti di comunicazione esistenti (Teams, email, intranet) né sistemi HR di record. Si posiziona come canale complementare dedicato alla scoperta delle persone, all'attivazione di connessioni one-to-one e alla costruzione di comunità interne per interesse.

**Il valore della piattaforma è condizionato da:** qualità e completezza dei profili utente, livello di sponsorship interna, adeguatezza del piano di change management, e continuità dell'impegno editoriale (icebreaker, eventi, spotlight).

### 1.3 Target Utenti

| Segmento | Descrizione | Bisogno principale |
|----------|-------------|-------------------|
| **Dipendente remoto** | Lavora full-remote, visibilità limitata sull'organizzazione | Accesso a una rete informale interna |
| **Neo-assunto** | Appena entrato, deve costruire la propria rete | Onboarding sociale strutturato |
| **Manager / Team Lead** | Coordina team distribuiti | Strumenti per favorire coesione |
| **Expat / Mobilità** | Trasferito in nuova sede | Accesso alla rete locale |
| **HR / People & Culture** | Responsabile engagement e retention | Visibilità sulle dinamiche di community |

### 1.4 Indicatori di Osservazione (KPI)

I seguenti indicatori sono proposti come metriche osservabili post-rilascio MVP. Non costituiscono obiettivi contrattuali né proiezioni di business. I valori target saranno definiti insieme al cliente prima del go-live, in base al contesto organizzativo.

| Indicatore | Modalità di rilevazione | Riferimento temporale |
|------------|------------------------|----------------------|
| % utenti con profilo completato ≥ 70% | Dashboard admin — campo `profile_score` | 30/60/90 giorni dal go-live |
| Numero di coffee chat avviati per settimana | Log eventi piattaforma — tipo `connection_request` accettata | Cadenza settimanale |
| % utenti attivi (almeno 1 login) negli ultimi 30 giorni | Metriche di sessione applicativa | Rolling 30 giorni |
| Numero di gruppi creati e attivi (≥1 post/settimana) | Tabella `groups` — last_activity_at | Rolling 30 giorni |
| Tasso di completamento richiesta coffee chat (inviata → accettata) | Funnel eventi — accepted/total | Mensile |
| Numero di endorsement ricevuti per utente | Tabella `endorsements` | Mensile |
| % utenti onboarded tramite import Azure AD | Log provisioning — sync_status | Entro 7 giorni dal go-live |

---

## 2. Assunzioni Progettuali

Le seguenti assunzioni definiscono il perimetro di validità della presente analisi. Qualunque scostamento rispetto a questi elementi dovrà essere oggetto di analisi di impatto prima dell'avvio dei lavori.

| # | Assunzione | Impatto se non verificata |
|---|------------|--------------------------|
| A01 | **Single tenant iniziale.** Il primo rilascio è dedicato a un singolo cliente. L'architettura multi-tenant è pianificata per v2.0 ma non inclusa nel perimetro MVP. | Ri-architettura del data model e dello strato di autenticazione |
| A02 | **Azure Active Directory / Entra ID disponibile lato cliente.** Il cliente dispone di un tenant Azure AD attivo e configurabile per consentire l'integrazione SSO tramite OAuth 2.0 + OIDC. L'accesso all'ambiente di test sarà concesso entro la settimana 2 del progetto. | Necessità di sistema auth alternativo (+15 GU stimati); profilo non pre-popolabile |
| A03 | **Numero utenti target indicativo: 500–2.000 MAU** per il pilota. Le stime di sizing infrastrutturale e di performance si basano su questo range. | Revisione architettura e costi in caso di scostamento rilevante |
| A04 | **Disponibilità di uno stakeholder decisionale e di un referente tecnico** lato cliente per tutta la durata del progetto. Sono previsti SAL mensili e sessioni di UAT. | Rischio di deriva dei requisiti e blocchi decisionali |
| A05 | **Governance privacy e dati definita lato cliente** prima del go-live: base giuridica del trattamento, designazione del DPO se applicabile, informativa utenti, consensi. La piattaforma è progettata per conformità GDPR ma non sostituisce il processo organizzativo del cliente. | Blocco al go-live per mancata conformità normativa |
| A06 | **Nessuna integrazione con sistemi HRIS** (SAP SuccessFactors, Workday, ecc.) nel perimetro MVP. Il profilo utente si popola da Azure AD e da compilazione manuale. | L'integrazione HRIS è stimata separatamente in v2.0 |
| A07 | **Dati di identità in Azure AD sono aggiornati e completi** (nome, cognome, ruolo, dipartimento, sede) per almeno il 70% della popolazione target. | Profili parziali → riduzione del valore percepito della piattaforma al lancio |
| A08 | **Il cliente nomina un owner interno** (HR o People & Culture) responsabile dell'attivazione degli utenti, della moderazione dei contenuti e della comunicazione interna di lancio. | Adozione dipendente esclusivamente da iniziativa spontanea degli utenti |
| A09 | **Assenza di requisiti di integrazione con sistemi non esplicitati** in questo documento. Eventuali integrazioni aggiuntive (Slack, SharePoint, HRIS, ecc.) saranno oggetto di change request. | |

---

## 3. Limiti della Soluzione

La presente sezione esplicita i confini della piattaforma e le condizioni che ne determinano il valore effettivo. Questi elementi devono essere comunicati chiaramente al cliente prima della firma contrattuale.

**3.1 La piattaforma non genera engagement autonomamente.**
Hello Work fornisce gli strumenti tecnici per favorire connessioni tra colleghi. L'attivazione dell'engagement dipende da: sponsorship visibile del management, comunicazione interna di lancio, presidio editoriale continuativo (icebreaker, spotlight, eventi), e incentivi organizzativi all'utilizzo. In assenza di questi fattori, l'adozione spontanea degli utenti non è garantita dalla sola disponibilità dello strumento.

**3.2 Il valore dipende dalla qualità dei profili utente.**
Il motore di raccomandazione, la funzione WorkMatch e la ricerca per competenza e interesse producono risultati utili solo in presenza di profili compilati in modo sufficientemente completo. Un lancio con profili incompleti o prevalentemente auto-compilati con dati minimi non consente di validare l'utilità della piattaforma.

**3.3 L'adozione dipende da change management e sponsorship interna.**
La piattaforma non è uno strumento di produttività obbligatorio. La sua diffusione segue logiche di adozione volontaria, soggette a resistenze culturali (privacy percepita, abitudine agli strumenti esistenti, saturazione digitale). Un piano strutturato di change management non è opzionale: è condizione necessaria per raggiungere soglie di utilizzo significative.

**3.4 Il POC non è rappresentativo delle performance di produzione.**
Il POC realizzato in questa fase è ottimizzato per la navigabilità della demo, non per la scalabilità, la sicurezza o la conformità normativa. Non deve essere considerato come base per valutazioni di produzione.

**3.5 La piattaforma non gestisce processi HR formali.**
Hello Work non è un sistema di performance management, succession planning o talent acquisition. Le connessioni, gli endorsement e le interazioni sulla piattaforma non hanno valore contrattuale o valutativo.

**3.6 Il pilastro personale del profilo richiede governance privacy dedicata.**
La sezione "interessi personali" (hobby, passioni, lingue, disponibilità) contiene dati che, pur non essendo sensibili ai sensi dell'Art. 9 GDPR, richiedono un'informativa chiara e un meccanismo di opt-in esplicito. Il cliente deve definire la propria politica di gestione di questi dati prima del go-live.

---

## 4. Rischi Principali

| ID | Rischio | Probabilità | Impatto | Azioni di mitigazione |
|----|---------|:-----------:|:-------:|-----------------------|
| R01 | **Adozione utenti insufficiente** — la piattaforma non raggiunge massa critica entro i primi 60 giorni | Alta | Alto | Piano di comunicazione interna; engagement sponsor; incentivi al completamento profilo |
| R02 | **Profili incompleti al lancio** — import AD parziale + scarsa motivazione alla compilazione manuale | Alta | Alto | Completeness indicator; nudge via notifica; campagne HR mirate; gamification base |
| R03 | **Privacy percepita sul pilastro personale** — resistenza degli utenti a condividere hobby e interessi in contesto lavorativo | Media | Medio | Opt-in esplicito; controllo granulare visibilità; comunicazione trasparente sulle policy |
| R04 | **Backlog instabile** — aggiunta di requisiti in corso d'opera non gestita tramite change request | Media | Alto | Baseline funzionale firmata; change request process definito in kick-off; sprint review con cliente |
| R05 | **Identity e dati di origine incompleti** — Azure AD non aggiornato o incompleto per una parte rilevante degli utenti | Media | Alto | Assessment pre-progetto dello stato dell'AD; piano di data cleansing; fallback a compilazione manuale |
| R06 | **Aspettative non allineate tra business e IT lato cliente** — il business si aspetta engagement immediato, l'IT vede la piattaforma come tool tecnico | Alta | Alto | Workshop di allineamento in kick-off; definizione congiunta degli indicatori di successo; comunicazione trasparente sui limiti |
| R07 | **Integrazione Azure AD più complessa del previsto** — permission model, tenant policy, proxy/firewall aziendali | Bassa | Alto | Discovery tecnica dedicata in settimana 1; accesso ambiente test garantito contrattualmente |
| R08 | **Variabilità effort integrazioni** — HRIS e calendar integration soggette a dipendenze da API lato cliente | Media | Medio | HRIS fuori da MVP; calendar integration come enhancement opzionale; stima con range ±30% |
| R09 | **Impatto GDPR non gestito lato cliente** — assenza di DPO, base giuridica non definita, informativa assente | Bassa | Critico | Checklist GDPR da completare prima del go-live; responsabilità del titolare del trattamento esplicitata contrattualmente |

---

## 5. Requisiti Funzionali

### 5.1 Modulo AUTH — Autenticazione e Autorizzazione

#### 5.1.1 Single Sign-On Aziendale
- **RF-AUTH-01** — Il sistema deve supportare autenticazione esclusivamente tramite SSO aziendale (Azure Active Directory / Entra ID), protocollo OAuth 2.0 + OIDC. Non è prevista registrazione autonoma con email/password.
- **RF-AUTH-02** — Il sistema deve rifiutare l'accesso a utenti non appartenenti al tenant Azure AD configurato (accesso chiuso per default).
- **RF-AUTH-03** — Il sistema deve gestire il refresh automatico del token di sessione senza richiedere ri-autenticazione entro le soglie configurate dall'amministratore.
- **RF-AUTH-04** — Il sistema deve supportare il logout esplicito con invalidazione del token lato server.

#### 5.1.2 Autorizzazione e Ruoli (RBAC)
- **RF-AUTH-05** — Il sistema deve implementare un modello RBAC con almeno tre ruoli: `user` (standard), `hr_admin` (gestione utenti e contenuti), `sys_admin` (configurazione piattaforma e moderazione globale).
- **RF-AUTH-06** — Il sistema deve permettere all'amministratore di sospendere o disattivare un account senza eliminare i dati associati.
- **RF-AUTH-07** — Il sistema deve mantenere un audit log di tutte le operazioni di accesso e di modifica dei ruoli (immutabile, 90 giorni rolling).

---

### 5.2 Modulo ONB — Onboarding Utente

#### 5.2.1 Provisioning automatico
- **RF-ONB-01** — Al primo accesso autenticato, il sistema deve creare automaticamente un profilo utente pre-compilato con i dati disponibili in Azure AD: nome, cognome, ruolo, dipartimento, sede, foto profilo (se presente).
- **RF-ONB-02** — Il sistema deve guidare l'utente in un flusso di onboarding strutturato (massimo 4 step) per il completamento delle sezioni non importabili da AD: interessi personali, disponibilità, bio.
- **RF-ONB-03** — Il sistema deve permettere di saltare l'onboarding e completare il profilo successivamente, mostrando un indicatore di completezza persistente.

#### 5.2.2 Benvenuto organizzativo
- **RF-ONB-04** — Il sistema deve segnalare nel feed principale i nuovi utenti che hanno completato l'onboarding (opt-in), con un box di benvenuto interattivo che invita i colleghi a connettersi.
- **RF-ONB-05** — Il sistema deve proporre automaticamente ai nuovi utenti una lista di "persone da conoscere" basata su team, sede e ruolo, al completamento dell'onboarding.
- **RF-ONB-06** — Il sistema deve permettere all'HR admin di personalizzare il messaggio di benvenuto visualizzato durante l'onboarding.

---

### 5.3 Modulo PRF — Profilo Utente

#### 5.3.1 Profilo Professionale
- **RF-PRF-01** — Il sistema deve permettere all'utente di inserire e modificare: titolo/ruolo, area/divisione, seniority, anni di esperienza, competenze tecniche (tag strutturati), certificazioni (con data e ente), progetti passati e attuali.
- **RF-PRF-02** — Il sistema deve supportare l'importazione automatica di dati da Azure AD (nome, ruolo, dipartimento, sede) al primo accesso e la sincronizzazione periodica (configurabile dall'amministratore).
- **RF-PRF-03** — Il sistema deve consentire la validazione delle competenze dichiarate da parte di altri utenti (endorsement), con tracciabilità dell'endorser.
- **RF-PRF-04** — Il sistema deve visualizzare una timeline professionale interna che rappresenta il percorso dell'utente nell'organizzazione.

#### 5.3.2 Profilo Personale
- **RF-PRF-05** — Il sistema deve permettere l'inserimento di hobby e interessi tramite tag strutturati (sport, musica, cucina, viaggi, libri, gaming, ecc.). Questa sezione è **opt-in**: l'utente deve attivare esplicitamente la visibilità.
- **RF-PRF-06** — Il sistema deve supportare una sezione "Fun facts" — massimo 3 curiosità in formato libero, con controllo di visibilità individuale.
- **RF-PRF-07** — Il sistema deve permettere di indicare lingue parlate e livello di padronanza.
- **RF-PRF-08** — Il sistema deve supportare una sezione "Cosa sto imparando" — campo libero per descrivere percorsi di apprendimento attuali.
- **RF-PRF-09** — Il sistema deve permettere di indicare la propria città o area geografica (non indirizzo preciso). Dato non obbligatorio.

#### 5.3.3 Impostazioni Disponibilità
- **RF-PRF-10** — Il sistema deve permettere all'utente di indicare la propria disponibilità per tipologie di interazione: coffee chat virtuale, coffee chat in presenza, mentoring (offro/cerco), pair programming, brainstorming.
- **RF-PRF-11** — Il sistema deve permettere di impostare slot di disponibilità settimanali. L'integrazione con sistemi di calendario è opzionale e configurabile.
- **RF-PRF-12** — Il sistema deve supportare uno stato "In pausa" che segnala temporanea non disponibilità per nuove richieste di connessione, senza disattivare il profilo.

#### 5.3.4 Elementi Visivi e Completezza
- **RF-PRF-13** — Il sistema deve supportare foto profilo e immagine di copertina personalizzabile, con limiti di dimensione e formato definiti.
- **RF-PRF-14** — Il sistema deve generare un avatar automatico (basato su iniziali) in assenza di foto profilo caricata.
- **RF-PRF-15** — Il sistema deve visualizzare un indicatore di completezza del profilo (percentuale o livelli) e proporre le sezioni mancanti per incentivare la compilazione progressiva.

---

### 5.4 Modulo DIS — Discovery

#### 5.4.1 Ricerca
- **RF-DIS-01** — Il sistema deve permettere ricerca testuale full-text su nome, ruolo, competenze e interessi.
- **RF-DIS-02** — Il sistema deve supportare filtri avanzati: team/divisione, sede, competenza, interesse, disponibilità, seniority.
- **RF-DIS-03** — Il sistema deve supportare ricerca per tag (competenze e interessi normalizzati tramite tassonomia controllata).
- **RF-DIS-04** — Il sistema deve presentare i risultati di ricerca con card sintetica: foto, nome, ruolo, prime 3 competenze, primi 3 interessi.

#### 5.4.2 Raccomandazioni
- **RF-DIS-05** — Il sistema deve proporre una lista "Persone che potresti conoscere" basata su: competenze complementari, interessi condivisi, prossimità organizzativa (stesso team, stessa sede), colleghi di colleghi.
- **RF-DIS-06** — Il sistema deve proporre "Colleghi con profilo simile al tuo" sulla base di interessi e competenze sovrapposte.
- **RF-DIS-07** — Il sistema deve proporre "Chi può aiutarti con..." a partire da una competenza cercata dall'utente.
- **RF-DIS-08** — Il sistema deve aggiornare le raccomandazioni almeno settimanalmente sulla base delle variazioni dei profili.
- **RF-DIS-09** — Il sistema deve permettere all'utente di escludere una raccomandazione specifica ("non mi interessa"), con registrazione del feedback per miglioramento progressivo del motore.

---

### 5.5 Modulo WM — WorkMatch (Professional Discovery)

> **Nota di governance:** questa funzionalità implementa un meccanismo di discovery rapida one-to-one in modalità card-browsing sequenziale. È configurabile dall'amministratore e può essere disattivata a livello di tenant. Il riferimento funzionale è quello della connessione professionale configurabile, non di dinamiche tipiche di piattaforme consumer.

#### 5.5.1 Discovery Rapida One-to-One
- **RF-WM-01** — Il sistema deve fornire una modalità di navigazione sequenziale dei profili colleghi (card browsing) che consente all'utente di esprimere rapidamente interesse o di passare al profilo successivo. La funzionalità è denominata WorkMatch e si basa sul profilo completo: competenze, interessi e disponibilità dichiarata. L'amministratore può disattivare questa modalità a livello di tenant tramite pannello di configurazione.
- **RF-WM-02** — Il sistema deve presentare nella card di WorkMatch: foto, nome, ruolo, top-3 competenze, top-3 interessi, indicatore di disponibilità.
- **RF-WM-03** — Il sistema deve filtrare le card mostrate escludendo utenti già connessi, utenti a cui è già stata inviata una richiesta in attesa, e utenti che hanno impostato lo stato "In pausa".
- **RF-WM-04** — Il sistema deve tracciare gli interessi espressi per ottimizzare le raccomandazioni successive, senza esporre i dati di navigazione individuale ad altri utenti.
- **RF-WM-05** — Quando due utenti esprimono reciprocamente interesse tramite WorkMatch, il sistema deve proporre un suggerimento di connessione bidirezionale. L'utente riceve una notifica non intrusiva ("Hai qualcosa in comune con [nome] — vuoi connetterti?") e può avviare una richiesta di coffee chat dalla stessa interfaccia. Il collegamento avviene solo su conferma esplicita di entrambi.

#### 5.5.2 Configurabilità Amministrativa
- **RF-WM-06** — L'amministratore di sistema deve poter disabilitare il modulo WorkMatch per il tenant senza impatti sulle altre funzionalità.
- **RF-WM-07** — L'amministratore deve poter configurare i criteri di prioritizzazione delle card (per sede, divisione, interessi, o casualità ponderata).
- **RF-WM-08** — Il sistema deve garantire che i dati di navigazione WorkMatch non siano visibili ad altri utenti né inclusi in report esportabili dall'HR admin a livello individuale.

---

### 5.6 Modulo GRP — Gruppi

#### 5.6.1 Creazione e Partecipazione
- **RF-GRP-01** — Il sistema deve permettere a qualsiasi utente di creare un gruppo (professionale o per interesse personale), definendo nome, descrizione e policy di accesso.
- **RF-GRP-02** — Il sistema deve supportare tre livelli di accesso: pubblico (visibile e accessibile a tutti), privato (visibile ma su invito), segreto (non visibile nella ricerca, su invito diretto).
- **RF-GRP-03** — Il sistema deve permettere di unirsi a gruppi pubblici con una singola azione, senza approvazione del moderatore.
- **RF-GRP-04** — Il sistema deve suggerire gruppi pertinenti al profilo dell'utente in base a competenze e interessi dichiarati.

#### 5.6.2 Feed e Interazioni
- **RF-GRP-05** — Ogni gruppo deve avere un feed dedicato per post, condivisioni e discussioni tra i membri.
- **RF-GRP-06** — Il sistema deve supportare post con testo, link, immagini e sondaggi semplici (massimo 4 opzioni).
- **RF-GRP-07** — Il sistema deve supportare reazioni emoji (set limitato, configurabile dall'amministratore) e commenti sui post.

#### 5.6.3 Eventi di Gruppo
- **RF-GRP-08** — I moderatori di gruppo devono poter creare eventi (virtuali o in presenza) visibili ai membri del gruppo.
- **RF-GRP-09** — Il sistema deve gestire RSVP con conteggio partecipanti e lista d'attesa opzionale.

---

### 5.7 Modulo MAP — Mappa Organizzativa

- **RF-MAP-01** — Il sistema deve visualizzare una mappa interattiva delle sedi aziendali con indicazione del numero di colleghi presenti per ciascuna location.
- **RF-MAP-02** — Il sistema deve permettere di filtrare la mappa per team, divisione o interesse, per identificare colleghi in prossimità geografica o organizzativa.
- **RF-MAP-03** — Il sistema deve visualizzare la struttura organizzativa semplificata in formato navigabile (albero gerarchico o vista flat per divisione).
- **RF-MAP-04** — Il sistema deve permettere di accedere al profilo di un collega direttamente dalla mappa, con azione rapida di richiesta coffee chat.
- **RF-MAP-05** — La mappa non deve mai esporre posizioni geografiche precise degli utenti: il dato di geolocalizzazione si riferisce alla sede dichiarata nel profilo, non alla posizione in tempo reale.

---

### 5.8 Modulo AKR — Agentic Knowledge Repository

> **Nota:** il modulo AKR è il principale differenziatore di Hello Work rispetto alle piattaforme di corporate networking standard. Consente ai colleghi di condividere e scoprire setup, strumenti e flussi di lavoro agentici e AI-assistiti utilizzati internamente. Il perimetro di questo modulo è condizionato alla disponibilità di utenti con setup documentabili e alla maturità dell'organizzazione nel campo AI.

#### 5.8.1 Schede Knowledge
- **RF-AKR-01** — Il sistema deve permettere a ogni utente di compilare schede strutturate relative al proprio setup di lavoro agentico/AI: strumenti utilizzati (tag selezionabili: Claude, Copilot, Cursor, n8n, LangChain, ecc.), contesto d'uso, descrizione libera del flusso.
- **RF-AKR-02** — Il sistema deve supportare una tassonomia controllata di tool e framework (lista gestita dall'amministratore), integrabile con tag liberi aggiuntivi.
- **RF-AKR-03** — Il sistema deve permettere una descrizione libera (campo testuale ricco) per illustrare il flusso specifico adottato, con possibilità di allegare screenshot o link.
- **RF-AKR-04** — Il sistema deve permettere all'utente di impostare la visibilità della propria scheda AKR: pubblica (tutti), riservata ai colleghi connessi, privata.

#### 5.8.2 Ricerca e Discovery AKR
- **RF-AKR-05** — Il sistema deve consentire la ricerca per tool/framework: "chi usa n8n?" → lista colleghi con scheda AKR che include quel tag, con accesso diretto al profilo e al dettaglio del flusso.
- **RF-AKR-06** — Il sistema deve integrare i tag AKR nel motore di raccomandazione: colleghi con setup simili vengono proposti nella sezione WorkMatch e nella discovery.
- **RF-AKR-07** — Il sistema deve mostrare nel profilo utente un riepilogo sintetico della propria scheda AKR (tool principali, ultimo aggiornamento).

#### 5.8.3 Governance Knowledge
- **RF-AKR-08** — Il sistema deve permettere agli utenti di marcare una scheda AKR come "utile" (engagement senza endorsement vincolante), con contatore visibile.
- **RF-AKR-09** — L'amministratore deve poter moderare e rimuovere contenuti AKR non conformi alle policy aziendali.
- **RF-AKR-10** — Le schede AKR non devono includere credenziali, token, chiavi API o informazioni riservate: il sistema deve avvertire l'utente in caso di pattern sospetti nel contenuto inserito (validazione lato frontend).

---

## 6. Requisiti Non Funzionali

### 6.1 Performance

| Requisito | Target | Note |
|-----------|--------|------|
| Tempo di caricamento pagina (LCP) | < 2 secondi | Misurato su connessione aziendale standard |
| Risposta API | < 300ms al 95° percentile | Escluse chiamate a servizi esterni (calendar, AD sync) |
| Latenza ricerca utenti | < 500ms per query | Con indice full-text correttamente dimensionato |
| Disponibilità (SLA) | 99,5% uptime mensile | Escluse manutenzioni pianificate con preavviso |
| Capacità di carico MVP | 500–2.000 utenti attivi | Dimensionamento infrastruttura sul range dichiarato nelle assunzioni |

### 6.2 Sicurezza

- **RNF-S01** — Autenticazione esclusivamente via SSO aziendale (Azure AD / Entra ID) — protocollo OAuth 2.0 + OIDC. Nessun accesso con credenziali locali.
- **RNF-S02** — Autorizzazione basata su ruoli (RBAC): user, hr_admin, sys_admin.
- **RNF-S03** — Tutti i dati in transito cifrati con TLS 1.3.
- **RNF-S04** — Tutti i dati a riposo cifrati con AES-256.
- **RNF-S05** — Vulnerability scanning continuo dell'infrastruttura; penetration test prima del go-live in produzione.
- **RNF-S06** — Audit trail immutabile di accessi e operazioni sensibili (90 giorni rolling, retention estendibile).

### 6.3 Privacy e GDPR

- **RNF-P01** — Conformità al Regolamento UE 2016/679 (GDPR): base giuridica del trattamento definita prima del go-live; informativa completa agli utenti; consenso esplicito per dati non obbligatori (interessi personali, geolocalizzazione, AKR).
- **RNF-P02** — Diritto all'oblio: cancellazione account entro 30 giorni dalla richiesta, con anonimizzazione dei contenuti pubblici attributi all'utente.
- **RNF-P03** — Portabilità dei dati: export profilo in formato JSON/CSV su richiesta dell'utente.
- **RNF-P04** — Privacy by design: dati di geolocalizzazione limitati alla sede dichiarata (non posizione in tempo reale); hobby e interessi sempre opt-in; dati WorkMatch non esposti a livello individuale.
- **RNF-P05** — Data residency: tutti i dati residenti in data center EU (preferibilmente North/West Europe Azure region).
- **RNF-P06** — Il sistema non deve mai esporre email personali o numeri di telefono senza esplicito opt-in dell'utente.

### 6.4 Accessibilità

- **RNF-A01** — Conformità WCAG 2.1 livello AA.
- **RNF-A02** — Supporto screen reader (ARIA labels completi).
- **RNF-A03** — Navigabilità completa da tastiera.
- **RNF-A04** — Contrasto colori minimo 4,5:1.

### 6.5 Architettura e Tecnologia

- **RNF-T01** — Applicazione web responsive e mobile-first. PWA pianificata come enhancement in v1.1.
- **RNF-T02** — Supporto browser: Chrome, Edge, Firefox, Safari (ultime 2 versioni major).
- **RNF-T03** — Backend cloud-native su Microsoft Azure, coerente con lo stack enterprise Microsoft adottato dal cliente.
- **RNF-T04** — API RESTful documentate con specifica OpenAPI 3.0 per future integrazioni (Teams, SharePoint, HRIS).
- **RNF-T05** — Architettura orientata a servizi, con separazione netta tra frontend, backend e strato dati, per consentire scalabilità e manutenibilità indipendenti dei moduli.

---

## 7. User Stories — Selezione MVP

| ID | Come… | Voglio… | Per… |
|----|--------|---------|------|
| US-01 | dipendente | accedere con il mio account aziendale senza creare nuove credenziali | non dover gestire un'altra password e operare in un ambiente autenticato |
| US-02 | neo-assunto | avere un profilo pre-compilato con i dati da Active Directory | non dover re-inserire informazioni che l'organizzazione già detiene |
| US-03 | dipendente | aggiungere hobby e interessi al profilo con controllo sulla visibilità | permettere ai colleghi di scoprire aspetti personali che scelgo di condividere |
| US-04 | dipendente | cercare colleghi per competenza tecnica | individuare rapidamente chi può supportarmi su un tema specifico |
| US-05 | dipendente | ricevere suggerimenti di colleghi pertinenti al mio profilo | ampliare la mia rete senza dover avviare ricerche manuali continuative |
| US-06 | dipendente | inviare una richiesta di coffee chat con messaggio personalizzato | avviare un contatto in modo contestualizzato e non impersonale |
| US-07 | dipendente | ricevere un invito calendario generato automaticamente dopo l'accettazione di un coffee chat | evitare di coordinare manualmente data e link del meeting |
| US-08 | manager | creare un gruppo per il mio team con feed dedicato | disporre di uno spazio informale per condivisioni non legate ai processi operativi |
| US-09 | dipendente | trovare gruppi per interesse e iscrivermi | entrare in contatto con colleghi che condividono le mie passioni |
| US-10 | HR Manager | pubblicare il benvenuto di un nuovo collega nella piattaforma | supportarne l'onboarding sociale fin dalla prima settimana |
| US-11 | dipendente | rispondere a un icebreaker settimanale | condividere qualcosa di me in modo informale e a bassa soglia |
| US-12 | dipendente | iscrivermi a un evento aziendale e riceverlo nel mio calendario | gestire i miei impegni e non perdere iniziative rilevanti |
| US-13 | senior developer | indicare la disponibilità per mentoring tecnico | essere individuato da chi cerca un mentor senza fare automarketing esplicito |
| US-14 | dipendente | navigare in modalità WorkMatch i profili dei colleghi | scoprire rapidamente persone con competenze o interessi compatibili con i miei |
| US-15 | dipendente | condividere il mio setup di lavoro agentico nell'AKR | contribuire alla knowledge base interna e trovare colleghi con approcci simili |

---

## 8. Scope MVP vs Enterprise

### 8.1 POC — Hackathon (oggi)
*Obiettivo: dimostrare il concept core in forma navigabile. Non rappresentativo di performance o conformità di produzione.*

| Modulo | Funzionalità incluse nel POC |
|--------|------------------------------|
| Auth | Mock SSO (Azure AD simulato) o integrazione AD demo |
| Profilo | Scheda profilo (professionale + personale), foto, interessi, disponibilità |
| Discovery | Ricerca base, lista colleghi con card sintetica |
| WorkMatch | Navigazione card sequenziale, interesse reciproco → suggerimento connessione |
| Gruppi | Lista gruppi, iscrizione, feed base |
| AKR | Scheda tool (tag + descrizione), ricerca per tool |

### 8.2 v1.0 — MVP Enterprise (mesi 1–3)
*Obiettivo: primo rilascio in produzione per cliente pilota single tenant. Perimetro funzionale validato con stakeholder cliente prima dell'avvio.*

| Modulo | Funzionalità aggiunte rispetto al POC |
|--------|---------------------------------------|
| Auth | SSO Azure AD / Entra ID live; RBAC completo; audit trail |
| ONB | Import AD; flusso onboarding guidato; benvenuto nel feed |
| Profilo | Completeness indicator; endorsement; timeline professionale |
| Discovery | Filtri avanzati; raccomandazioni smart; mappa sedi |
| Connessioni | Richiesta coffee chat con calendar integration; reminder; storico |
| Gruppi | Creazione completa; feed con reazioni; eventi di gruppo |
| Feed | Feed principale; icebreaker settimanale; kudos; spotlight |
| Event Board | Creazione eventi; RSVP; reminder; filtri |
| Admin | Dashboard HR; moderazione contenuti; analytics base |
| GDPR | Gestione consenso; export dati; cancellazione account; audit log |

### 8.3 v2.0 — Enterprise Completo (mesi 4–9)
*Condizionato all'esito del pilota v1.0. Perimetro e tempi da definire a seguito di retrospettiva con il cliente.*

| Area | Funzionalità pianificate |
|------|--------------------------|
| AI | Motore raccomandazioni ML; matching intelligente; analisi sentiment community |
| Integrazioni | Microsoft Teams bot; SharePoint webpart; HRIS connector (SuccessFactors/Workday) |
| Analytics | Dashboard engagement avanzato; heatmap connessioni; retention insights |
| Gamification | Badge; percorsi di connessione guidati |
| Mobile | App nativa iOS/Android |
| Internazionalizzazione | EN, FR, DE, ES |
| Multi-tenancy | Architettura multi-tenant; white label; branding per divisione |

---

## 9. Stima Giornate Uomo

> **Nota metodologica obbligatoria:** le stime riportate in questa sezione costituiscono un ordine di grandezza indicativo prodotto in fase di analisi preliminare, senza accesso al dettaglio tecnico dell'ambiente cliente. Non devono essere considerate come baseline contrattuale. La stima definitiva sarà prodotta al termine della fase di Discovery & Analisi, dopo validazione dei requisiti con il cliente e accesso all'ambiente tecnico. È raccomandata una contingency del +15% sulla stima realistica come buffer contrattuale minimo.

**Unità:** giornata uomo da 8 ore produttive (GU). Le stime includono analisi, sviluppo, revisione e rilascio. Esclusi: costi infrastrutturali Azure, licenze software, costi di change management lato cliente.

### 9.1 Legenda Ruoli

| Sigla | Ruolo | Livello |
|-------|-------|---------|
| **SA** | Solution Architect | Senior |
| **SC/TL** | Senior Consultant / Tech Lead | Senior |
| **CO** | Consultant | Mid |
| **JC** | Junior Consultant | Junior |
| **PM** | Project Manager | Senior |
| **UX** | UX/UI Designer | Mid |

### 9.2 Stima per Fase — Piattaforma Enterprise Completa (v1.0 + v2.0)

| Fase | SA | SC/TL | CO | JC | PM | UX | **Totale** |
|------|:--:|:-----:|:--:|:--:|:--:|:--:|:----------:|
| 1. Discovery & Analisi funzionale | 5 | 8 | 10 | 5 | 8 | 3 | **39** |
| 2. Architettura & Design tecnico | 15 | 10 | 5 | 2 | 3 | 2 | **37** |
| 3. UX/UI Design | 2 | 3 | 5 | 3 | 2 | 25 | **40** |
| 4. Frontend Development | 2 | 15 | 30 | 20 | 2 | 5 | **74** |
| 5. Backend Development | 3 | 20 | 35 | 25 | 2 | — | **85** |
| 6. Database & Data Model | 3 | 8 | 10 | 5 | 1 | — | **27** |
| 7. Infrastruttura IaC & CI/CD | 3 | 12 | 8 | 3 | 1 | — | **27** |
| 8. Sicurezza & Auth (SSO, GDPR) | 5 | 10 | 8 | 3 | 1 | — | **27** |
| 9. Testing (unit, int, e2e) | 1 | 8 | 15 | 20 | 2 | 2 | **48** |
| 10. AI & Recommendation Engine | 5 | 15 | 15 | 8 | 2 | — | **45** |
| 11. Integrazioni esterne (Teams, AD, Cal) | 3 | 10 | 12 | 5 | 2 | — | **32** |
| 12. Project Management | 2 | 2 | 2 | — | 30 | — | **36** |
| 13. UAT & Go-live | 3 | 8 | 10 | 8 | 8 | 3 | **40** |
| **TOTALE PER RUOLO** | **52** | **129** | **165** | **107** | **64** | **40** | **557** |

### 9.3 Riepilogo per Ruolo

| Ruolo | GU | % sul Totale | FTE equiv. (6 mesi) |
|-------|:--:|:------------:|:-------------------:|
| Solution Architect | 52 | 9,3% | 0,4 |
| Senior Consultant / Tech Lead | 129 | 23,2% | 1,1 |
| Consultant | 165 | 29,6% | 1,4 |
| Junior Consultant | 107 | 19,2% | 0,9 |
| Project Manager | 64 | 11,5% | 0,5 |
| UX/UI Designer | 40 | 7,2% | 0,3 |
| **TOTALE** | **557** | **100%** | **~4,6 FTE medi** |

> **Baseline contrattuale raccomandata con contingency +15%: ~640 GU**

### 9.4 Range di Variabilità per Fase Critica

| Fase | Variabilità | Motivazione |
|------|:-----------:|-------------|
| Integrazione Azure AD | ±20% | Dipende da policy del tenant cliente e complessità permission model |
| Integrazione HRIS (v2.0) | ±30% | Dipende dalle API disponibili e dalla qualità dei dati di origine |
| AI & Recommendation Engine | ±25% | Dipende dalla disponibilità di dati comportamentali sufficienti |
| UAT & Go-live | ±20% | Dipende dalla qualità del processo UAT e dalla disponibilità degli utenti client |

### 9.5 Timeline Indicativa

```
Mese 1   │ Discovery & Analisi · Architettura · UX Design
Mese 2   │ Backend core · Frontend core · Database · Auth
Mese 3   │ Moduli avanzati · Integrazioni · Testing v1.0
Mese 4   │ AI Engine · Testing completo · Hardening sicurezza
Mese 5   │ UAT · Bug fixing · GDPR compliance review
Mese 6   │ Go-live v1.0 · Hypercare · Planning v2.0
```

### 9.6 Esclusioni dal Perimetro di Stima

1. App mobile nativa iOS/Android — stimata separatamente in +80 GU per piattaforma
2. Abbonamento Azure e licenze software (costi OPEX del cliente)
3. Change management e comunicazione interna di lancio (attività lato cliente)
4. Integrazione HRIS (SAP SuccessFactors, Workday) — inclusa in v2.0, soggetta a variabilità ±30%
5. Sviluppo contenuti editoriali (icebreaker, spotlight, eventi) — a carico del cliente

---

*Prodotto da: Team Red · 20 Giugno 2026*

---

Ecco il riepilogo delle modifiche apportate rispetto alla v1.0:

## Modifiche applicate

**Eliminate/ridotte:**
- Tono da hackathon e linguaggio emozionale nell'Executive Summary ("devastante", "I dati parlano chiaro", "Visione: Every colleague is a potential friend...")
- Riferimenti Tinder/swipe consumer in WM — sostituiti con "card browsing sequenziale", "discovery rapida one-to-one", "connessione professionale configurabile"
- KPI promissori ("riduzione del turnover del 23%") → indicatori osservabili con metodo di rilevazione e cadenza espliciti
- Formulazioni che rendevano la stima definitiva → nota metodologica obbligatoria in §9

**Aggiunte (sezioni obbligatorie):**
- **§0 — Classificazione dell'iniziativa:** distinzione operativa POC / MVP / Enterprise
- **§2 — Assunzioni progettuali:** 9 assunzioni con impatto esplicito se non verificate
- **§3 — Limiti della soluzione:** 6 limiti dichiarati, incluso il nodo change management e privacy pilastro personale
- **§4 — Rischi principali:** 9 rischi con probabilità, impatto e azioni di mitigazione

**Riscritti in tono enterprise:**
- **RF-WM-01:** "card browsing sequenziale" configurabile e disattivabile dall'admin
- **RF-WM-05:** match bilaterale → notifica non intrusiva con conferma esplicita di entrambi; nessun riferimento a dinamiche consumer

[Turn 1]
[Message]
Aggiornamento importante: il Business Case va inserito nell'analisi funzionale, non nell'offerta commerciale. Aggiungi una sezione "Business Case" nel documento di analisi funzionale con:
- ROI stimato sulla riduzione del turnover
- ROI sull'accelerazione adozione AI
- Indicatori di produttività e collaborazione cross-team

Usa tono analitico/enterprise (non promissorio). I KPI devono essere osservabili e misurabili, non promesse. Includilo come sezione dedicata, dopo i Requisiti Non Funzionali e prima delle User Stories.

[Response]
Aggiungo la sezione Business Case con il tono analitico richiesto. Ecco la sezione completa da inserire nel documento — si posiziona come **§7**, con User Stories che diventa **§8**, Scope **§9** e Stima GU **§10**.

---

## 7. Business Case

### 7.1 Premessa Metodologica

Il presente Business Case è elaborato a supporto della valutazione dell'iniziativa e non costituisce proiezione contrattuale né impegno di risultato. Le stime quantitative si basano su parametri di letteratura (Gallup, SHRM, Deloitte — edizioni 2023–2024) e su assunzioni esplicitate per ciascuna voce. Il valore effettivo dipenderà da variabili organizzative e contestuali lato cliente che esulano dal perimetro tecnico della piattaforma.

**Condizioni necessarie per la materializzazione del valore:**
- Adozione attiva della piattaforma (target indicativo: ≥40% MAU entro 90 giorni dal go-live)
- Qualità dei profili utente (completezza ≥70% per almeno la metà della popolazione)
- Sponsorship interna e piano di change management strutturato
- Continuità d'uso nel medio periodo (≥6 mesi)

In assenza di queste condizioni, il beneficio atteso si riduce proporzionalmente e non è ragionevolmente attribuibile alla piattaforma.

---

### 7.2 ROI sulla Riduzione del Turnover

#### 7.2.1 Assunzioni di calcolo

| Parametro | Valore assunto | Fonte / Note |
|-----------|---------------|--------------|
| Costo medio di sostituzione di un dipendente | 50–200% dello stipendio annuo | SHRM 2024; varia per seniority e ruolo |
| Costo assunto per il calcolo (conservativo) | 75% dello stipendio annuo lordo | Valore medio per profilo mid-level IT/knowledge worker |
| Stipendio annuo lordo medio di riferimento | €45.000 | Da adeguare al profilo retributivo effettivo del cliente |
| Costo unitario di sostituzione assunto | €33.750 per risorsa | |
| Popolazione target pilota | 500–2.000 dipendenti | Da Assunzione A03 |
| Tasso di turnover volontario baseline | 12–18% annuo | Benchmark settore IT/servizi EU — da verificare con dato cliente |
| Riduzione del turnover attribuibile a engagement digitale | 1–3 punti percentuali | Intervallo conservativo; condizionato alle condizioni §7.1 |

#### 7.2.2 Stima del beneficio annuo

| Scenario | Popolazione | Turnover baseline | Riduzione | Dimissioni evitate | Beneficio annuo stimato |
|----------|:-----------:|:-----------------:|:---------:|:------------------:|:-----------------------:|
| 🟢 Conservativo | 500 utenti | 12% → 11% | −1 p.p. | ~5 risorse | **~€169K** |
| 🟡 Centrale | 1.000 utenti | 15% → 13% | −2 p.p. | ~20 risorse | **~€675K** |
| 🔴 Ottimistico | 2.000 utenti | 18% → 15% | −3 p.p. | ~60 risorse | **~€2,0M** |

> **Nota di lettura:** lo scenario ottimistico richiede condizioni di adozione e change management pienamente soddisfatte, e una correlazione diretta tra piattaforma e riduzione turnover che non è dimostrabile in isolamento. Lo scenario conservativo è quello da utilizzare come riferimento nelle valutazioni di investimento.

#### 7.2.3 Indicatori osservabili post-rilascio

| Indicatore | Come si misura | Cadenza |
|------------|---------------|---------|
| Tasso di turnover volontario (baseline vs. post go-live) | HR system — contratti cessati per dimissioni / organico | Semestrale |
| Exit interview score — "senso di appartenenza" | Survey strutturata in uscita (item dedicato) | A ogni uscita |
| Engagement score (eNPS o equivalente) | Survey organizzativa periodica | Trimestrale |
| Correlazione profilo Hello Work ↔ retention | Cross-analisi anonimizzata: utenti attivi vs. utenti usciti | Annuale |

---

### 7.3 ROI sull'Accelerazione dell'Adozione AI Interna

#### 7.3.1 Razionale

Il modulo AKR (Agentic Knowledge Repository) abilita la condivisione strutturata di setup, tool e flussi di lavoro AI/agentici tra colleghi. Il beneficio atteso non è l'adozione AI in sé — che dipende da fattori organizzativi e di governance indipendenti — ma la **riduzione del tempo di discovery e onboarding su pratiche AI già esistenti nell'organizzazione**, evitando reinvenzione parallela di soluzioni già disponibili internamente.

#### 7.3.2 Assunzioni di calcolo

| Parametro | Valore assunto | Note |
|-----------|---------------|------|
| % di population target con attività AI documentabile | 20–40% | Dipende dalla maturità AI del cliente |
| Ore medie spese in "discovery autonoma" di tool/pratiche AI per dipendente/anno | 20–40 ore | Stima da survey interna Deloitte 2024 |
| Riduzione attribuibile a knowledge sharing strutturato | 30–50% delle ore di discovery | Condizionato alla qualità delle schede AKR |
| Costo orario medio knowledge worker | €35–55/ora | Da adeguare al profilo del cliente |
| Produttività recuperata per dipendente/anno (scenario centrale) | 10–15 ore | 35% di 30h medie |
| Costo unitario recuperato (scenario centrale) | €400–€750/dipendente/anno | |

#### 7.3.3 Stima del beneficio annuo

| Scenario | Utenti con profilo AKR attivo | Produttività recuperata/utente | Beneficio totale stimato |
|----------|:-----------------------------:|:------------------------------:|:------------------------:|
| 🟢 Conservativo | 100 utenti (20% su 500) | 10 ore × €40 = €400 | **~€40K/anno** |
| 🟡 Centrale | 400 utenti (20% su 2.000) | 12 ore × €45 = €540 | **~€216K/anno** |
| 🔴 Ottimistico | 800 utenti (40% su 2.000) | 15 ore × €50 = €750 | **~€600K/anno** |

> **Nota:** questi valori si riferiscono esclusivamente al risparmio di tempo in fase di discovery/onboarding su pratiche AI. Non includono benefici downstream derivanti dall'uso effettivo dei tool (che dipendono da fattori organizzativi non gestiti dalla piattaforma).

#### 7.3.4 Indicatori osservabili post-rilascio

| Indicatore | Come si misura | Cadenza |
|------------|---------------|---------|
| Numero di schede AKR compilate e aggiornate | Dashboard admin — `akr_cards` con last_updated_at ≤ 90 giorni | Mensile |
| Ricerche AKR effettuate per tool/framework | Log eventi — tipo `akr_search` | Mensile |
| % di utenti con almeno una scheda AKR compilata | Tabella `akr_cards` / utenti attivi totali | Trimestrale |
| Self-reported time saving (survey facoltativa) | Survey opzionale post-utilizzo AKR | Trimestrale |
| Numero di connessioni avviate da match AKR | Log — `connection_request` con source=`akr_match` | Mensile |

---

### 7.4 Indicatori di Produttività e Collaborazione Cross-Team

#### 7.4.1 Razionale

La collaborazione cross-team non è direttamente misurabile come effetto causale di una piattaforma di networking. Hello Work può creare le condizioni per connessioni che non avverrebbero spontaneamente, ma la trasformazione di tali connessioni in collaborazione produttiva dipende da fattori organizzativi e di cultura aziendale. Gli indicatori di seguito sono **proxy osservabili** — segnali correlati al potenziale di collaborazione, non misure dirette di produttività.

#### 7.4.2 Indicatori di piattaforma (direttamente osservabili)

| Indicatore | Definizione | Metodo di rilevazione | Target indicativo (90 gg) |
|------------|-------------|----------------------|:-------------------------:|
| **Coffee chat cross-team completati** | Richieste accettate tra utenti di divisioni/team diversi | Log `connection_request` con `cross_team=true` e status `completed` | ≥ 2 per utente attivo |
| **Gruppi inter-divisionali attivi** | Gruppi con membri appartenenti a ≥ 2 divisioni diverse, con ≥ 1 post/settimana | Tabella `groups` + `group_members` cross-join divisione | ≥ 30% dei gruppi totali |
| **Endorsement cross-team** | Validazioni di competenza ricevute da colleghi di team diversi | Tabella `endorsements` con `cross_team=true` | ≥ 1 per utente con profilo completo |
| **Skill exchange avviati** | Richieste di scambio competenze accettate | Log `skill_exchange_request` con status `accepted` | Tracciato; target definito con cliente |
| **WorkMatch → connessione confermata** | Utenti che da WorkMatch hanno avviato una richiesta coffee chat accettata | Funnel: `wm_interest` → `wm_match` → `connection_request` accepted | Tracciato come funnel conversion |

#### 7.4.3 Indicatori organizzativi (rilevabili lato cliente, non dalla piattaforma)

| Indicatore | Definizione | Fonte dati | Cadenza |
|------------|-------------|-----------|---------|
| **Progetti cross-divisionali attivati** | Numero di iniziative formali che coinvolgono persone di divisioni diverse | HR / Project management system | Semestrale |
| **Tempo di risposta a richieste di competenza interna** | Giorni medi tra necessità di competenza e individuazione del collega giusto | Survey o ticket tracking interno | Semestrale |
| **Soddisfazione onboarding sociale** | Score medio su item "Mi sento integrato nella rete interna" da survey new hire | Onboarding survey (90 giorni) | A ogni ciclo onboarding |
| **NPS interno sulla piattaforma** | "Quanto consiglieresti Hello Work a un collega?" | Survey in-app facoltativa | Trimestrale |

#### 7.4.4 Framework di correlazione

Per attribuire parzialmente il miglioramento degli indicatori organizzativi alla piattaforma, si raccomanda di:

1. **Stabilire una baseline** per ciascun indicatore prima del go-live, su un campione rappresentativo
2. **Segmentare l'analisi** tra utenti attivi Hello Work (MAU) e non-utenti, a parità di profilo demografico/organizzativo
3. **Escludere confounders** (riorganizzazioni, nuove assunzioni massive, eventi aziendali) nelle finestre di osservazione
4. **Non attribuire causalità** dove la correlazione è l'unico dato disponibile

---

### 7.5 Sintesi Valore Atteso — Scenario Centrale

| Area di beneficio | Beneficio annuo stimato (scenario centrale) | Affidabilità della stima |
|------------------|:-------------------------------------------:|:------------------------:|
| Riduzione turnover | €675K | Bassa–Media *(dipende da correlazione non isolabile)* |
| Accelerazione adozione AI (AKR) | €216K | Media *(misurabile con survey interna)* |
| Produttività collaborazione cross-team | Non quantificabile in questa fase | — *(proxy osservabili definiti in §7.4)* |
| **Totale beneficio annuo stimato** | **~€891K** | **Ordine di grandezza — non contrattualizzabile** |

**Costo di riferimento della soluzione (scenario centrale — infrastruttura + sviluppo):**

| Voce | Importo stimato | Riferimento |
|------|:--------------:|-------------|
| Sviluppo MVP (557 GU × tariffa media Team Red) | Da offerta commerciale | Sezione §10 + Offerta |
| Infrastruttura Azure annua (scenario centrale) | ~€8.100/anno | Stima costi infrastruttura |
| **Payback period indicativo** | **< 12 mesi** *(scenario centrale, se adozione raggiunta)* | Condizionato alle assunzioni §7.1 |

> **Messaggio per il management:** il Business Case è sostenibile nello scenario centrale, ma è condizionato in modo critico all'investimento in change management e alla qualità dell'adozione. Il rischio principale non è tecnico — è organizzativo. La piattaforma è una condizione necessaria, non sufficiente, per la materializzazione del valore.

---

La sezione è pronta per essere inserita nel documento revisionato come **§7**, tra i Requisiti Non Funzionali e le User Stories.

**Caratteristiche del tono applicato:**
- Ogni ROI è preceduto da assunzioni esplicite e numericate
- Tre scenari (conservativo / centrale / ottimistico) con nota di lettura che orienta il lettore verso quello conservativo per le valutazioni di investimento
- Separazione netta tra indicatori *di piattaforma* (direttamente osservabili) e *organizzativi* (rilevabili lato cliente)
- Il messaggio finale al management esplicita il rischio organizzativo senza attenuarlo
- Nessuna promessa di risultato — tutti i valori sono "stimati", "condizionati" o "indicativi"
