import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OnboardingWizard from './OnboardingWizard'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    put: vi.fn().mockResolvedValue({}),
  },
}))

import { api } from '../lib/api'

function renderWizard() {
  return render(
    <MemoryRouter>
      <OnboardingWizard />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('OnboardingWizard', () => {
  it('renders step 1 (Chi sei) on mount', () => {
    renderWizard()
    // Use heading role to distinguish from progress-bar span labels
    expect(screen.getByRole('heading', { name: 'Chi sei' })).toBeTruthy()
    expect(screen.getByPlaceholderText('es. Software Engineer')).toBeTruthy()
    expect(screen.getByText('1 / 4')).toBeTruthy()
  })

  it('"Salta" advances to the next step', () => {
    renderWizard()
    const skipBtn = screen.getByRole('button', { name: 'Salta' })
    fireEvent.click(skipBtn)
    // step 1 has both <h2>Competenze</h2> and a ProfilePillar <h3>Competenze</h3>
    expect(screen.getByRole('heading', { name: 'Competenze', level: 2 })).toBeTruthy()
    expect(screen.getByText('2 / 4')).toBeTruthy()
  })

  it('"Salta" through all steps calls api.put on the last step', async () => {
    renderWizard()

    // Step 1 → 2 → 3 → 4
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))

    // Now on step 4 — click Salta to complete
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/profiles/me', expect.objectContaining({
        skills: [],
        aiTools: [],
        hobbies: [],
      }))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('"Avanti →" button also advances steps', () => {
    renderWizard()
    const nextBtn = screen.getByRole('button', { name: 'Avanti →' })
    fireEvent.click(nextBtn)
    expect(screen.getByRole('heading', { name: 'Competenze', level: 2 })).toBeTruthy()
  })

  it('shows "Completa ✓" on the last step', () => {
    renderWizard()
    // Skip to last step
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }))
    expect(screen.getByRole('button', { name: 'Completa ✓' })).toBeTruthy()
  })
})
