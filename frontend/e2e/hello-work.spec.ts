import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProfile = {
  id: 'demo-user-1',
  displayName: 'Giulia Rossi',
  email: 'demo@hellowork.local',
  officeLocation: 'Milano',
  role: 'Product Manager',
  department: 'Innovation',
  skills: ['React', 'TypeScript'],
  certifications: ['AZ-900'],
  aiTools: ['GitHub Copilot'],
  aiDescription: 'Uso Copilot per accelerare lo sviluppo.',
  hobbies: ['Running', 'Fotografia'],
  interests: ['AI', 'Design'],
  profileScore: 85,
}

const mockSuggestions = [
  {
    id: 'user-2',
    displayName: 'Marco Bianchi',
    role: 'Engineer',
    department: 'Platform',
    matchScore: 0.92,
    sharedSkills: ['React'],
    sharedAiTools: ['GitHub Copilot'],
    sharedInterests: ['AI'],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercepts ALL /api/** calls at the browser level so the backend
 * (or Vite proxy) is never reached.  Safe to call even when the dev
 * server is already serving.
 */
async function mockAPIs(page: Page) {
  // Block any external tile / atlas requests (azure-maps)
  await page.route('**/atlas.microsoft.com/**', (route) => route.abort())
  await page.route('**/login.microsoftonline.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )

  await page.route('/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfile),
      })
    }

    if (url.includes('/profiles/me')) {
      if (method === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProfile),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProfile),
      })
    }

    if (url.includes('/matches/suggestions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSuggestions),
      })
    }

    if (url.includes('/workmatch/cards')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }

    if (url.includes('/workmatch/swipe')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matched: false }),
      })
    }

    if (url.includes('/groups')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }

    if (url.includes('/map/clusters')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }

    // Fallback
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Hello Work E2E', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Homepage carica
  // ──────────────────────────────────────────────────────────────────────────
  test('1. Homepage — titolo "Hello Work" visibile, navbar presente', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/')

    // Page <title>
    await expect(page).toHaveTitle('Hello Work')

    // NavBar brand text (visible on desktop viewport ≥ 768 px)
    await expect(page.locator('nav span.text-gradient-agic')).toBeVisible()
    await expect(page.locator('nav span.text-gradient-agic')).toHaveText('Hello Work')

    // NavBar itself
    await expect(page.locator('nav')).toBeVisible()

    // Greeting (proves the home page actually loaded)
    await expect(page.locator('h1', { hasText: 'Ciao, Giulia' })).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Navigazione → /workmatch
  // ──────────────────────────────────────────────────────────────────────────
  test('2. Navigazione — click su WorkMatch porta a /workmatch', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/')

    // Wait for home page to fully render before clicking nav
    await expect(page.locator('h1', { hasText: 'Ciao, Giulia' })).toBeVisible()

    await page.locator('nav').locator('a', { hasText: 'WorkMatch' }).click()
    await expect(page).toHaveURL(/\/workmatch/)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Navigazione → /groups
  // ──────────────────────────────────────────────────────────────────────────
  test('3. Navigazione — click su Gruppi porta a /groups', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/')

    await expect(page.locator('h1', { hasText: 'Ciao, Giulia' })).toBeVisible()

    await page.locator('nav').locator('a', { hasText: 'Gruppi' }).click()
    await expect(page).toHaveURL(/\/groups/)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Navigazione → /map
  // ──────────────────────────────────────────────────────────────────────────
  test('4. Navigazione — click su Mappa porta a /map', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/')

    await expect(page.locator('h1', { hasText: 'Ciao, Giulia' })).toBeVisible()

    // "Mappa" link in nav — use exact span text to avoid matching "Mappa Uffici" card
    await page.locator('nav').locator('span', { hasText: 'Mappa' }).click()
    await expect(page).toHaveURL(/\/map/)
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. OnboardingWizard — step 1 "Chi sei"
  // ──────────────────────────────────────────────────────────────────────────
  test('5. OnboardingWizard — /onboarding mostra step 1 "Chi sei"', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/onboarding')

    // Wait for bootstrap to complete (bootstrapping overlay disappears)
    // then check the wizard's step 1 heading
    await expect(page.locator('h2', { hasText: 'Chi sei' })).toBeVisible()
    await expect(page.locator('text=1 / 4')).toBeVisible()
    await expect(page.locator('input[placeholder="es. Software Engineer"]')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. OnboardingWizard — "Salta" avanza al step 2
  // ──────────────────────────────────────────────────────────────────────────
  test('6. OnboardingWizard — click "Salta" avanza al step 2 "Competenze"', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/onboarding')

    await expect(page.locator('h2', { hasText: 'Chi sei' })).toBeVisible()

    await page.locator('button', { hasText: 'Salta' }).click()

    await expect(page.locator('h2', { hasText: 'Competenze' })).toBeVisible()
    await expect(page.locator('text=2 / 4')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. WorkMatch — mostra titolo
  // ──────────────────────────────────────────────────────────────────────────
  test('7. WorkMatch — /workmatch mostra titolo "WorkMatch"', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/workmatch')

    await expect(page.locator('h1')).toContainText('WorkMatch')
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Profile — sezione pilastri
  // ──────────────────────────────────────────────────────────────────────────
  test('8. Profile — /profile mostra i tre pilastri', async ({ page }) => {
    await mockAPIs(page)
    await page.goto('/profile')

    await expect(page.locator('h3', { hasText: 'Pilastro Professionale' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Pilastro Agentic' })).toBeVisible()
    await expect(page.locator('h3', { hasText: 'Pilastro Umano' })).toBeVisible()
  })
})
