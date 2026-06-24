# ADR-0001: Group Chat — SignalR vs Web PubSub e GPT-4o vs Alternatives

| Campo | Valore |
|-------|--------|
| **ID** | ADR-0001 |
| **Titolo** | Real-time transport: SignalR in-process. LLM: Azure OpenAI GPT-4o / GPT-4o-mini |
| **Feature** | Group Chat + AI Engagement Bot (Issue #97) |
| **Stato** | Accettato |
| **Data** | 2026-06-20 |
| **Autore** | Gilbert (Solution Architect) + Lucien (Tech Check) |
| **Revisori** | Pit Carusos (Product Owner) |

---

## Contesto

Hello Work è un'applicazione interna AGIC con stack ASP.NET Core 10 + React 19, deployata su Azure Container Apps (singola istanza per POC). Si vuole aggiungere una chat di gruppo real-time con un bot AI che posta contenuti proattivi e risponde on-demand.

Le decisioni chiave sono due:
1. **Quale tecnologia per il real-time?**
2. **Quale LLM per il bot?**

---

## Decisione 1: SignalR in-process vs Azure SignalR Service vs Web PubSub

### Opzioni valutate

#### Opzione A — SignalR in-process (ASP.NET Core) ✅ SCELTA

**Come funziona**: SignalR è incluso in ASP.NET Core senza dipendenze esterne. I WebSocket/Long Polling sono gestiti direttamente dal processo dell'app. L'hub risiede in-process con il backend.

**Vantaggi**:
- Zero infrastruttura aggiuntiva (nessuna risorsa Azure aggiuntiva)
- Zero costi aggiuntivi
- Configurazione minimale: `AddSignalR()` + `MapHub<ChatHub>()`
- Ideale per singola istanza ACA (POC)
- Debugging diretto nel processo
- Timeout e autenticazione gestiti dalla pipeline ASP.NET già configurata

**Svantaggi**:
- **Non scalabile orizzontalmente**: se ACA scala a ≥2 repliche, le connessioni SignalR non sono condivise tra pod — un messaggio broadcast raggiunge solo i client connessi alla stessa istanza
- Memoria in-process: connessioni occupano RAM dell'app server
- Nessuna retention/replay nativa dei messaggi

**Condizioni di accettabilità**:
- ACA configurato a 1 replica per POC (verificato nel `compute.tf`)
- Il pattern di migrazione a Azure SignalR Service è un backplane drop-in (`AddSignalR().AddAzureSignalR(connectionString)`) — migrazione a 1 riga di codice

---

#### Opzione B — Azure SignalR Service (managed)

**Come funziona**: Servizio Azure managed che funge da relay/backplane. ASP.NET Core usa il client SDK per instradare messaggi attraverso il servizio.

**Vantaggi**:
- Scalabilità orizzontale nativa (più istanze ACA sincronizzate)
- Fino a 1 milione di connessioni concorrenti
- Monitoring e diagnostics integrati nel portale Azure

**Svantaggi**:
- Costo: ~€50-100/mese per piano Standard (1 unit)
- Latenza aggiuntiva per il hop extra verso il servizio
- Configurazione aggiuntiva: connection string, firewall rules
- Overkill per un POC interno con decine di utenti

**Valutazione**: Appropriato in produzione quando ACA scala. Non giustificabile per POC.

---

#### Opzione C — Azure Web PubSub

**Come funziona**: Servizio Azure per messaggistica pub/sub basato su WebSocket. Diverso da SignalR: protocol layer WebSocket puro, senza il layer di astrazione SignalR (no RPC, no groups managed server-side nello stesso modo).

**Vantaggi**:
- Bassa latenza WebSocket nativo
- Supporto multi-lingua più ampio
- Piano free: 20.000 messaggi/giorno

**Svantaggi**:
- **Non compatibile con il client `@microsoft/signalr`** — richiede il proprio SDK `@azure/web-pubsub-client`
- Nessun supporto per groups managed server-side nativo (richiede logica custom lato app)
- Il modello di autenticazione/autorizzazione richiede più lavoro di integrazione con il JWT bearer esistente
- Più complesso da debuggare localmente (dipendenza dal servizio Azure)
- Meno documentazione e esempi in C# per casi d'uso chat

**Valutazione**: Tecnologia interessante per architetture event-driven, ma inadatta per questo caso d'uso (chat con groups, RPC, auth integrata) senza riscrivere il layer client.

---

### Decisione

**Scelta: Opzione A (SignalR in-process)** per POC.
**Path di migrazione**: Opzione B (Azure SignalR Service) in produzione, attivato quando ACA scala a >1 replica.

---

## Decisione 2: LLM — GPT-4o vs GPT-4o-mini vs Alternative

### Contesto

Il bot ha due modalità d'uso con requisiti diversi:
1. **On-demand**: risposta a una domanda specifica di un utente — qualità critica, latenza percepita
2. **Proattivo schedulato**: post giornaliero di aggiornamento notizie — qualità media, latenza non critica, costo importante (viene chiamato per ogni gruppo ogni giorno)

### Opzioni valutate

#### Opzione A — GPT-4o per on-demand + GPT-4o-mini per schedulato ✅ SCELTA

**GPT-4o on-demand**:
- Qualità di reasoning superiore per rispondere a domande tecniche specifiche
- Contesto long (128K token) — gestisce history chat complessa
- Deployment `gpt-4o` già presente in Sweden Central nel Terraform di Hello Work
- Costo: ~$5/1M input token, ~$15/1M output token (on-demand, bassa frequenza)

**GPT-4o-mini schedulato**:
- Qualità sufficiente per sintesi notizie e post proattivi
- Costo: ~$0.15/1M input token, ~$0.60/1M output token (≈95% più economico di GPT-4o)
- Latenza inferiore per i post schedulati (non bloccante per UX)
- Deployment `gpt-4o-mini` da aggiungere al Terraform (stesso resource group, stesso deployment Sweden Central)

---

#### Opzione B — GPT-4o per entrambi i casi

**Vantaggi**: Semplicità (un solo deployment), coerenza qualità.

**Svantaggi**:
- Costo schedulato ≈7x superiore al necessario (10 gruppi × 1 post/giorno × 30 giorni = 300 call/mese — con GPT-4o-mini il costo mensile è trascurabile, con GPT-4o inizia a essere rilevante)
- Nessun beneficio di qualità per la sintesi notizie dove GPT-4o-mini è ampiamente sufficiente

---

#### Opzione C — Azure OpenAI Phi-4 (small model on Azure)

**Vantaggi**: Costo ultra-basso, disponibile on-demand su Azure AI Foundry.

**Svantaggi**:
- Qualità ragionamento significativamente inferiore per domande tecniche (on-demand)
- Non disponibile come deployment `gpt-4o` nello stesso resource group attuale — richiederebbe nuova risorsa AI Foundry
- Italiano: supporto meno robusto rispetto a GPT-4o per contesti tecnici

**Valutazione**: Candidato interessante per riduzione costi in produzione (sostituto di GPT-4o-mini per schedulato), ma non giustifica la complessità di una seconda risorsa OpenAI per POC.

---

#### Opzione D — LLM esterno (Anthropic Claude, Google Gemini)

**Svantaggi**:
- Dati escono dall'ambiente Azure (compliance AGIC richiede Azure-boundary per dati interni)
- Costi di integrazione (SDK diverso, no riuso del client Azure OpenAI)
- Non aderente alla strategia AI di AGIC (Azure-first)

**Valutazione**: Escluso per policy compliance.

---

### Decisione

**Scelta: Opzione A** — GPT-4o per on-demand, GPT-4o-mini per schedulato.

**Nota Terraform**: Aggiungere il deployment `gpt-4o-mini` in `infra/ai.tf`:
```hcl
resource "azurerm_cognitive_deployment" "gpt4o_mini" {
  name                 = "gpt-4o-mini"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format  = "OpenAI"
    name    = "gpt-4o-mini"
    version = "2024-07-18"
  }
  sku {
    name     = "Standard"
    capacity = 10
  }
}
```

---

## Conseguenze

### Positive
- Nessuna infrastruttura aggiuntiva per il POC (SignalR in-process)
- Costi LLM minimali: GPT-4o-mini per i post schedulati riduce il costo di ≈95% rispetto all'uso esclusivo di GPT-4o
- Path di migrazione chiaro e documentato per entrambe le decisioni
- Stack rimanente 100% Azure — conformità policy AGIC

### Negative / Risk
- **SignalR scale-out**: se il team decide di scalare ACA prima della migrazione a Azure SignalR Service, i broadcast non funzioneranno correttamente su più repliche. **Mitigazione**: documentare il constraint in `CONTEXT.md` del repo, e mantenere ACA a 1 replica fino alla migrazione.
- **Google News RSS**: il feed Google News può cambiare formato o essere bloccato senza preavviso. **Mitigazione**: il `GoogleNewsRssService` ha try/catch e ritorna lista vuota in caso di errore — il bot invierà un post generico senza notizie anziché crashare.
- **Deployment gpt-4o-mini**: da aggiungere al Terraform — blocco se non deployato prima dell'avvio del BackgroundService. **Mitigazione**: il `BotService` ha un fallback al deployment configurabile via `appsettings` — in dev, mappare entrambi su `gpt-4o`.

---

## Riferimenti

- [Microsoft SignalR Docs — Scale-out](https://learn.microsoft.com/en-us/aspnet/core/signalr/scale)
- [Azure SignalR Service Pricing](https://azure.microsoft.com/pricing/details/signalr-service/)
- [Azure Web PubSub vs SignalR Service](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/resource-faq)
- [Azure OpenAI Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)
- [Design Document](../architecture/group-chat-bot-design.md)
- [Tech Check Lucien — Issue #97] (dreaming.db, tasks table)
