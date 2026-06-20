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
    expect(screen.getByText('Chi sei')).toBeTruthy()
    expect(screen.getByPlaceholderText('es. Software Engineer')).toBeTruthy()
    expect(screen.getByText('1 / 4')).toBeTruthy()
  })

  it('"Salta" advances to the next step', () => {
    renderWizard()
    const skipBtn = screen.getByText('Salta')
    fireEvent.click(skipBtn)
    expect(screen.getByText('Competenze')).toBeTruthy()
    expect(screen.getByText('2 / 4')).toBeTruthy()
  })

  it('"Salta" through all steps calls api.put on the last step', async () => {
    renderWizard()

    // Step 1 → 2 → 3 → 4
    fireEvent.click(screen.getByText('Salta'))
    fireEvent.click(screen.getByText('Salta'))
    fireEvent.click(screen.getByText('Salta'))

    // Now on step 4 — click Salta to complete
    fireEvent.click(screen.getByText('Salta'))

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
    const nextBtn = screen.getByText('Avanti →')
    fireEvent.click(nextBtn)
    expect(screen.getByText('Competenze')).toBeTruthy()
  })

  it('shows "Completa ✓" on the last step', () => {
    renderWizard()
    // Skip to last step
    fireEvent.click(screen.getByText('Salta'))
    fireEvent.click(screen.getByText('Salta'))
    fireEvent.click(screen.getByText('Salta'))
    expect(screen.getByText('Completa ✓')).toBeTruthy()
  })
})
