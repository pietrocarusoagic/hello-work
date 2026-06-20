# Piano di Test — Hello Work

> **Versione:** 1.0 (POC) — Giugno 2026  
> **Pubblico:** Team sviluppo AGIC  
> **Repo:** [pietrocarusoagic/hello-work](https://github.com/pietrocarusoagic/hello-work)

---

## Indice

1. [Strategia di test](#1-strategia-di-test)
2. [Test unitari frontend (Vitest + RTL)](#2-test-unitari-frontend-vitest--rtl)
3. [Test E2E (Playwright)](#3-test-e2e-playwright)
4. [Test backend (.NET)](#4-test-backend-net)
5. [Test manuali — Checklist demo](#5-test-manuali--checklist-demo)
6. [Test di carico](#6-test-di-carico)
7. [Come contribuire](#7-come-contribuire)

---

## 1. Strategia di test

### La piramide di test

```
                    ▲
                   /|\
                  / | \
                 /  |  \
                / E2E \        ← 8 scenari Playwright
               /  Tests \      ← Lenti, alto valore, pochi
              /───────────\
             / Integration \   ← (pianificati per v1.0)
            /   Tests       \
           /─────────────────\
          /    Unit Tests     \ ← Vitest (FE) + xUnit (BE)
         /   Veloci, isolati   \ ← Molti, granulari, veloci
        /─────────────────────\
       /     Manual Tests      \ ← Checklist demo pre-release
      /─────────────────────────\
```

### Principi guida

| Principio | Dettaglio |
|---|---|
| **Test first per bug** | Ogni bug fixato deve avere un test di regressione associato |
| **CI bloccante** | Unit test e E2E girano su ogni PR e bloccano il merge se falliscono |
| **Ambienti isolati** | I test non devono toccare il database di produzione |
| **DEV_BYPASS nei test** | Tutti i test automatici usano DEV_BYPASS per evitare dipendenze da Azure AD |

### Coverage target (v1.0)

| Layer | Target coverage | Stato attuale (POC) |
|---|---|---|
| Frontend — componenti critici | 70% | ~30% |
| Backend — servizi di business | 80% | Da implementare |
| E2E — happy path | 100% dei flussi principali | 8/8 scenari coperti |

---

## 2. Test unitari frontend (Vitest + RTL)

### Setup

```bash
cd frontend
npm run test          # Esegue tutti i test unitari
npm run test:ui       # Apre Vitest UI nel browser (consigliato in sviluppo)
npm run test:coverage # Genera report di coverage HTML in coverage/
```

### Test esistenti — OnboardingWizard

I 5 test esistenti coprono il componente `OnboardingWizard` in `src/components/OnboardingWizard/`:

| # | Test | Cosa verifica |
|---|---|---|
| 1 | `renders step 1 on mount` | Il wizard mostra correttamente lo step "Chi sei" all'apertura |
| 2 | `"Salta" button advances to step 2` | Click su "Salta" porta allo step "Competenze" |
| 3 | `"Salta" on step 2 advances to step 3` | Navigazione step 2 → step 3 "Strumenti AI" |
| 4 | `"Salta" on step 3 advances to step 4` | Navigazione step 3 → step 4 "Persona" |
| 5 | `completes wizard on step 4 submit` | Submit all'ultimo step chiude il wizard e chiama `onComplete` |

**File:** `src/components/OnboardingWizard/__tests__/OnboardingWizard.test.tsx`

```tsx
// Struttura tipo di un test esistente
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingWizard } from '../OnboardingWizard'

describe('OnboardingWizard', () => {
  it('renders step 1 on mount', () => {
    render(<OnboardingWizard onComplete={jest.fn()} />)
    expect(screen.getByText('Chi sei')).toBeInTheDocument()
    expect(screen.getByText('Step 1 di 4')).toBeInTheDocument()
  })
})
```

### Come aggiungere nuovi test unitari

#### 1. Crea il file di test nella cartella del componente

```
src/
  components/
    WorkMatch/
      WorkMatch.tsx
      __tests__/
        WorkMatch.test.tsx    ← Crea qui
```

#### 2. Struttura base di un test

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkMatch } from '../WorkMatch'

// Mock delle dipendenze esterne
vi.mock('@/hooks/useWorkMatch', () => ({
  useWorkMatch: () => ({
    suggestions: [mockSuggestion],
    swipe: vi.fn(),
    isLoading: false,
  }),
}))

describe('WorkMatch', () => {
  it('shows suggestion card', () => {
    render(<WorkMatch />)
    expect(screen.getByText('Marco Bianchi')).toBeInTheDocument()
  })

  it('calls swipe right on button click', async () => {
    const user = userEvent.setup()
    const mockSwipe = vi.fn()
    // ...
    await user.click(screen.getByRole('button', { name: /conferma/i }))
    expect(mockSwipe).toHaveBeenCalledWith('right', 'user-2')
  })
})
```

#### 3. Priorità per nuovi test unitari

| Componente | Priorità | Motivo |
|---|---|---|
| `MatchingService` (calc score) | Alta | Logica business critica |
| `WorkMatch` swipe | Alta | Flusso principale |
| `ProfileCard` rendering | Media | Componente riusato ovunque |
| `SearchBar` debounce | Media | UX critica |
| `GroupSuggestions` algo | Media | Tag-based matching |
| `OfficeMap` cluster filter | Bassa | Dipendenza Leaflet complessa |

---

## 3. Test E2E (Playwright)

### Setup

```bash
cd frontend
npm run test:e2e           # Esegue tutti gli scenari E2E
npm run test:e2e:ui        # Apre Playwright UI (consigliato per debug)
npm run test:e2e:headed    # Esegue con browser visibile
npx playwright show-report # Apre l'ultimo report HTML
```

> **Prerequisito:** Il frontend deve essere in esecuzione su `http://localhost:5173` prima di avviare i test E2E. I test usano `mockAPIs()` per intercettare le chiamate — il backend non è necessario.

### Gli 8 scenari esistenti

**File:** `frontend/e2e/hello-work.spec.ts`

| # | Nome test | Cosa verifica |
|---|---|---|
| 1 | `Homepage — titolo "Hello Work" visibile, navbar presente` | Rendering base dell'app, presenza della navbar |
| 2 | `Navigazione — click su WorkMatch porta a /workmatch` | Routing da home a WorkMatch |
| 3 | `Navigazione — click su Gruppi porta a /groups` | Routing da home a Gruppi |
| 4 | `Navigazione — click su Mappa porta a /map` | Routing da home a Mappa Uffici |
| 5 | `OnboardingWizard — /onboarding mostra step 1 "Chi sei"` | Render del wizard al primo step |
| 6 | `OnboardingWizard — click "Salta" avanza al step 2 "Competenze"` | Navigazione wizard step 1→2 |
| 7 | `WorkMatch — /workmatch mostra titolo "WorkMatch"` | Render della pagina WorkMatch |
| 8 | `Profile — /profile mostra i tre pilastri` | Rendering dei 3 pilastri del profilo |

### Come funziona il mock API

I test E2E usano `mockAPIs()` — una funzione helper che intercetta a livello browser **tutte le chiamate `/api/**`** e risponde con fixture statiche:

```typescript
// Profilo demo iniettato nei test
const mockProfile = {
  id: 'demo-user-1',
  displayName: 'Giulia Rossi',
  email: 'demo@hellowork.local',
  officeLocation: 'Milano',
  role: 'Product Manager',
  profileScore: 85,
  skills: ['React', 'TypeScript'],
  // ...
}

// Suggerimenti WorkMatch
const mockSuggestions = [{
  id: 'user-2',
  displayName: 'Marco Bianchi',
  matchScore: 0.92,
  sharedSkills: ['React'],
}]
```

Le chiamate a `login.microsoftonline.com` (Azure AD) e `atlas.microsoft.com` (Azure Maps) vengono anche loro intercettate o bloccate per isolare il test.

### Aggiungere nuovi scenari E2E

```typescript
// Aggiungi in frontend/e2e/hello-work.spec.ts

test('9. WorkMatch — swipe destra mostra conferma match', async ({ page }) => {
  await mockAPIs(page)
  await page.goto('/workmatch')

  // Verifica che la card sia visibile
  await expect(page.getByText('Marco Bianchi')).toBeVisible()

  // Simula swipe destra (click sul pulsante ✓)
  await page.getByRole('button', { name: /conferma/i }).click()

  // Verifica feedback visivo
  await expect(page.getByText(/match/i)).toBeVisible()
})
```

### Configurazione Playwright

**File:** `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
```

---

## 4. Test backend (.NET)

### Setup

```bash
cd backend
dotnet test                           # Esegue tutti i test
dotnet test --logger "console;verbosity=detailed"  # Output verbose
dotnet test --collect:"XPlat Code Coverage"        # Con coverage
```

> Il progetto di test si trova in `backend/HelloWork.Tests/` (da creare per v1.0).

### Cosa testare — Priorità

#### `MatchingService` — Alta priorità

Il servizio che calcola il **Jaccard pesato** è il cuore dell'algoritmo di matching. Deve avere coverage completa.

```csharp
// HelloWork.Tests/Services/MatchingServiceTests.cs
public class MatchingServiceTests
{
    [Fact]
    public void CalculateScore_IdenticalProfiles_Returns1()
    {
        var profile1 = CreateProfile(skills: ["Azure", "React"], aiTools: ["Copilot"], hobbies: ["Running"]);
        var profile2 = CreateProfile(skills: ["Azure", "React"], aiTools: ["Copilot"], hobbies: ["Running"]);

        var score = _service.CalculateMatchScore(profile1, profile2);

        Assert.Equal(1.0, score, precision: 2);
    }

    [Fact]
    public void CalculateScore_NoOverlap_Returns0()
    {
        var profile1 = CreateProfile(skills: ["Azure"],   aiTools: ["Copilot"],  hobbies: ["Running"]);
        var profile2 = CreateProfile(skills: ["AWS"],     aiTools: ["ChatGPT"],  hobbies: ["Cucina"]);

        var score = _service.CalculateMatchScore(profile1, profile2);

        Assert.Equal(0.0, score, precision: 2);
    }

    [Theory]
    [InlineData(new[] {"Azure","React"}, new[] {"Azure"}, 0.35)] // solo skill condivisa
    public void CalculateScore_PartialOverlap_RespectsWeights(
        string[] skills1, string[] skills2, double expectedApprox) { ... }
}
```

**Casi da coprire:**
- Profili identici → score = 1.0
- Nessuna sovrapposizione → score = 0.0
- Sovrapposizione parziale con pesi corretti (35/40/25)
- Profilo con array vuoti → gestione graceful, no eccezioni
- Simmetria: `score(A,B) == score(B,A)`

#### `ProfilesController` — Media priorità

```csharp
// Test degli endpoint REST
[Fact]
public async Task GetProfile_ExistingUser_Returns200WithProfile()
{
    var response = await _client.GetAsync("/api/profiles/demo-user-1");
    response.EnsureSuccessStatusCode();
    var profile = await response.Content.ReadFromJsonAsync<UserProfileDto>();
    Assert.Equal("Giulia Rossi", profile.DisplayName);
}

[Fact]
public async Task GetProfile_NonExistingUser_Returns404()
{
    var response = await _client.GetAsync("/api/profiles/non-existent-id");
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

#### `AuthController` — Media priorità

```csharp
[Fact]
public async Task GetMe_WithDevBypass_ReturnsDevUser()
{
    // Configura client con DEV_BYPASS enabled
    var response = await _bypassClient.GetAsync("/api/auth/me");
    response.EnsureSuccessStatusCode();
    var user = await response.Content.ReadFromJsonAsync<UserProfileDto>();
    Assert.Equal("demo-user-1", user.Id);
}

[Fact]
public async Task GetMe_WithoutAuth_Returns401()
{
    var response = await _unauthClient.GetAsync("/api/auth/me");
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}
```

### Factory per test di integrazione

```csharp
// HelloWork.Tests/Helpers/HelloWorkWebApplicationFactory.cs
public class HelloWorkWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Sostituisci il DB con SQLite in-memory per i test
            var descriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<HelloWorkDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            services.AddDbContext<HelloWorkDbContext>(options =>
                options.UseSqlite("DataSource=:memory:"));

            // Attiva DEV_BYPASS
            services.Configure<DevBypassOptions>(o => o.Enabled = true);
        });
    }
}
```

---

## 5. Test manuali — Checklist demo

Da eseguire prima di ogni demo o release. Stimato: **20–30 minuti**.

### Prerequisiti
- [ ] App in esecuzione con `VITE_DEV_BYPASS=true`
- [ ] Backend avviato con seed data presente
- [ ] Browser in finestra normale (non incognito)

---

### 🔐 Login e Onboarding

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 1.1 | Apri l'app | Mostra pagina di login con pulsante "Accedi con Microsoft" | |
| 1.2 | Clicca "Accedi con Microsoft" | In DEV_BYPASS: login automatico come Giulia Rossi | |
| 1.3 | Primo accesso (profilo score < 30) | Wizard di onboarding mostrato automaticamente | |
| 1.4 | Clicca "Salta" su step 1 | Avanza allo step 2 "Competenze" | |
| 1.5 | Completa tutti e 4 gli step | Wizard si chiude, arrivi alla Discovery home | |

---

### 👤 Profilo

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 2.1 | Apri il menu → "Profilo" | Pagina profilo con i 3 pilastri visibili | |
| 2.2 | Verifica pilastro Professionale | Skills e certificazioni di Giulia Rossi visibili | |
| 2.3 | Verifica pilastro Agentic | GitHub Copilot e Azure OpenAI visibili | |
| 2.4 | Verifica pilastro Umano | Running e Fotografia tra gli hobby | |
| 2.5 | Clicca "Modifica" su Professionale | Form di editing aperto | |
| 2.6 | Aggiungi una skill, salva | Skill aggiunta visibile nel profilo | |
| 2.7 | Verifica punteggio profilo | Indicatore numerico presente e > 70 | |

---

### 🔍 Discovery

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 3.1 | Vai su Discovery (home) | Feed con almeno 2 card colleghi (Marco, Sara) | |
| 3.2 | Cerca "Marco" | Solo Marco Bianchi visibile | |
| 3.3 | Cerca "React" (skill) | Risultati filtrati per skill React | |
| 3.4 | Svuota la ricerca | Feed torna con tutti i risultati | |
| 3.5 | Clicca su una card | Profilo completo del collega aperto | |

---

### 💡 WorkMatch

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 4.1 | Vai su WorkMatch | Titolo "WorkMatch" visibile, card collega mostrata | |
| 4.2 | Leggi il punteggio di affinità | Percentuale/score visibile sulla card | |
| 4.3 | Swipe a destra (✓) | Card scorre, prossimo suggerimento appare | |
| 4.4 | Swipe a sinistra (✗) | Card scorre, prossimo suggerimento appare | |
| 4.5 | Match bilaterale (prepara seed) | Notifica "Nuovo match!" visibile | |
| 4.6 | Suggerimento caffè virtuale | Compare dopo il match bilaterale | |

---

### 👥 Gruppi

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 5.1 | Vai su Gruppi | Lista gruppi: Azure Champions, AI Makers, Photo Walk Club | |
| 5.2 | Clicca su "Azure Champions" | Pagina dettaglio gruppo con descrizione e membri | |
| 5.3 | Clicca "Iscriviti" | Iscrizione avvenuta, pulsante diventa "Lascia gruppo" | |
| 5.4 | Scorri in fondo | Sezione "Potrebbero interessarti" con suggerimenti | |
| 5.5 | Clicca "Lascia gruppo" | Disiscrizione avvenuta | |

---

### 🗺️ Mappa Uffici

| # | Azione | Risultato atteso | ✓/✗ |
|---|---|---|---|
| 6.1 | Vai su Mappa | Mappa OpenStreetMap caricata con cluster sedi | |
| 6.2 | Clicca su cluster Milano | Si espande, pin individuali visibili | |
| 6.3 | Clicca su un pin profilo | Popup con nome, ruolo, link al profilo | |
| 6.4 | Seleziona filtro "AI" | Solo colleghi con interesse AI visibili sulla mappa | |
| 6.5 | Rimuovi il filtro (×) | Tutti i colleghi tornano visibili | |

---

## 6. Test di carico

> ⚠️ Il POC non ha test di carico configurati. Questa sezione contiene **raccomandazioni per v1.0**.

### Raccomandazioni

Per la versione 1.0 si raccomanda di configurare test di carico prima del go-live con **k6** o **Azure Load Testing**.

#### Scenari prioritari

| Scenario | Utenti simultanei | Durata | Metrica target |
|---|---|---|---|
| Discovery feed | 100 | 5 min | P95 < 500ms |
| WorkMatch swipe | 50 | 2 min | P95 < 200ms |
| Login (cold start) | 20 | 1 min | P95 < 1000ms |
| Profile update | 30 | 3 min | P95 < 300ms |

#### Setup k6 (raccomandato)

```javascript
// load-tests/discovery.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  const res = http.get('https://api.hello-work.agic.it/api/profiles/suggestions', {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
  })
  check(res, { 'status is 200': (r) => r.status === 200 })
  sleep(1)
}
```

```bash
# Esecuzione
k6 run load-tests/discovery.js -e TEST_TOKEN=<token>
```

#### Azure Load Testing (alternativa integrata)

Azure Load Testing si integra nativamente con Azure e permette di eseguire test k6 direttamente dal portale Azure, con report automatici su Application Insights.

---

## 7. Come contribuire

### Convenzioni per nuovi test

#### Naming

| Tipo | Convenzione | Esempio |
|---|---|---|
| Test unitari | `describe` = componente, `it` = comportamento atteso | `it('shows error when skills are empty')` |
| Test E2E | `N. ComponentePagina — azione specifica` | `9. WorkMatch — swipe destra mostra conferma` |
| Test backend | `Metodo_Condizione_RisultatoAtteso` | `GetProfile_NonExistingUser_Returns404` |

#### Dove mettere i file

```
frontend/
  src/
    components/
      NomeComponente/
        __tests__/
          NomeComponente.test.tsx   ← Test unitari RTL
  e2e/
    hello-work.spec.ts              ← Tutti gli scenari E2E

backend/
  HelloWork.Tests/
    Services/
      MatchingServiceTests.cs       ← Test servizi
    Controllers/
      ProfilesControllerTests.cs    ← Test controller
    Helpers/
      HelloWorkWebApplicationFactory.cs
```

#### Regole

1. **Ogni PR che aggiunge funzionalità deve includere test** — unit o E2E, in base alla natura della feature
2. **Ogni bug fix deve includere un test di regressione** che riproduce il bug prima del fix
3. **I test non devono dipendere dall'ordine di esecuzione** — ogni test deve essere autonomo e ripulire il proprio stato
4. **Mock tutto ciò che è esterno** — Azure AD, Azure Maps, database in produzione
5. **Usa `data-testid` con parsimonia** — preferisci query per ruolo (`getByRole`) o testo (`getByText`) — sono più resilienti ai refactoring

### CI e branch protection

I seguenti check devono passare per fare merge su `main`:

```
✓ Unit Tests (frontend)         → npm run test
✓ E2E Tests (Playwright)        → npm run test:e2e
✓ TypeScript check              → npm run type-check
✓ Lint                          → npm run lint
✓ Build                         → npm run build
```

Per il backend (da aggiungere in v1.0):
```
✓ .NET Tests                    → dotnet test
✓ .NET Build                    → dotnet build
```

---

*Ultimo aggiornamento: Giugno 2026 — Team Innovation AGIC*
