# Hello Work — Domain Context (Ubiquitous Language)

> Questo file è il glossario del dominio. Solo terminologia — nessun dettaglio implementativo.
> Skill: engineering/domain-modeling

---

## Entità Principali

**User** — Un dipendente dell'organizzazione. Si autentica tramite Azure AD. Ha un profilo a 3 pilastri.

**Profile (Profilo)** — La rappresentazione di un User sulla piattaforma. Composto da 3 pilastri. Viene pre-popolato da Azure AD al primo accesso e completato manualmente dall'utente.

**Profile Score** — Un punteggio intero da 0 a 100 che indica la completezza del profilo. Aumenta al riempimento di ciascuna sezione.

---

## I 3 Pilastri del Profilo

**Professional Pillar (Pilastro Professionale)** — Competenze tecniche, certificazioni, ruolo, dipartimento. Pre-popolato da Azure AD. Peso nel match score: **35%**.

**Agentic Pillar (Pilastro Agentic)** — Strumenti AI utilizzati (Claude, Copilot, n8n…) e descrizione dell'approccio AI. Compilato manualmente. Peso nel match score: **40%**.

**Human Pillar (Pilastro Umano)** — Hobby e interessi personali. Opt-in esplicito. Peso nel match score: **25%**.

---

## WorkMatch

**WorkMatch** — Il modulo di scoperta a swipe. Presenta card di colleghi candidati ordinati per match score.

**Swipe** — L'azione di un User su una WorkMatch card: `like` (destra) o `pass` (sinistra).

**Mutual Match** — Si verifica quando User A ha effettuato `like` su B E User B ha effettuato `like` su A. Genera un record in `matches` e una notifica "Prenota un caffè ☕".

**Match Score** — Coefficiente Jaccard pesato tra i tag dei 3 pilastri di due User. Range: 0.0–1.0.

---

## Gruppi

**Group** — Una comunità di interesse interna all'organizzazione. Può essere creata dagli utenti o suggerita dal sistema.

**System-Suggested Group** — Un Group suggerito automaticamente sulla base dell'overlap tra i tag dell'utente e i tag del gruppo. Marcato come `isSystemSuggested: true`.

**Group Membership** — La relazione tra un User e un Group. Creata con join, distrutta con leave.

---

## Discovery

**Discovery Feed** — La homepage. Mostra suggerimenti di persone da conoscere basati su match score.

**Suggestion** — Un User proposto a un altro User come persona da conoscere, ordinato per match score e non ancora swipato.

---

## Autenticazione

**AAD OID** — L'Object ID di Azure Active Directory. Identificatore univoco di un User nell'identità aziendale. Chiave di upsert al primo accesso.

**SSO** — Single Sign-On tramite Azure AD / Entra ID. Unico meccanismo di autenticazione — nessuna registrazione email/password.

---

## Office Map

**Office Location** — La sede fisica di un User (es. Milano, Roma, Tirana). Viene da Azure AD `officeLocation`.

**Office Cluster** — Un raggruppamento di User per Office Location con coordinate geografiche, usato per visualizzare la distribuzione sulla mappa.
