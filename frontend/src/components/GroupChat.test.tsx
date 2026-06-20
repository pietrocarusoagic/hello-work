import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroupChat from './GroupChat'

// ── Mock the hook so we test the component UI, not SignalR internals ─────────
vi.mock('../hooks/useGroupChat')

// ── Mock api to prevent main.tsx bootstrap side-effects in jsdom ─────────────
vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { useGroupChat } from '../hooks/useGroupChat'
import type { MessageDto } from '../lib/api'

// ── jsdom does not implement scrollIntoView — stub it globally for this suite ──
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// ── Shared mock functions ─────────────────────────────────────────────────────
const mockSendMessage = vi.fn()
const mockAskBot = vi.fn()

const defaultHookReturn = {
  messages: [] as MessageDto[],
  sendMessage: mockSendMessage,
  askBot: mockAskBot,
  loading: false,
  connected: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useGroupChat).mockReturnValue(defaultHookReturn)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserMsg(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 1,
    groupId: 'g1',
    senderId: 'u1',
    senderDisplayName: 'Giulia Rossi',
    senderType: 'user',
    body: 'Ciao a tutti!',
    sourceUrls: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeBotMsg(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 2,
    groupId: 'g1',
    senderId: undefined,
    senderDisplayName: 'HelloWork Bot',
    senderType: 'bot',
    body: 'Posso aiutarti!',
    sourceUrls: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GroupChat', () => {
  // ── 1. Empty state ────────────────────────────────────────────────────────
  it('1. shows empty-state text when no messages', () => {
    render(<GroupChat groupId="g1" groupName="Test Group" />)

    expect(
      screen.getByText(/Nessun messaggio ancora\. Inizia la conversazione!/)
    ).toBeTruthy()
  })

  // ── 2. User message avatar ────────────────────────────────────────────────
  it('2. renders user message with initials avatar (primary / blue)', () => {
    vi.mocked(useGroupChat).mockReturnValue({
      ...defaultHookReturn,
      messages: [makeUserMsg()],
    })

    render(<GroupChat groupId="g1" groupName="Test Group" />)

    const avatar = screen.getByTitle('Giulia Rossi')
    // Initials of "Giulia Rossi" → "GR"
    expect(avatar.textContent).toBe('GR')
    // Colour class: agic-primary/80 (blue) for user messages
    expect(avatar.className).toMatch(/agic-primary/)
  })

  // ── 3. Bot message avatar ─────────────────────────────────────────────────
  it('3. renders bot message with 🤖 avatar (purple)', () => {
    vi.mocked(useGroupChat).mockReturnValue({
      ...defaultHookReturn,
      messages: [makeBotMsg()],
    })

    render(<GroupChat groupId="g1" groupName="Test Group" />)

    const avatar = screen.getByTitle('HelloWork Bot')
    expect(avatar.textContent).toBe('🤖')
    // Colour class: purple-600/80 for bot messages
    expect(avatar.className).toMatch(/purple/)
  })

  // ── 4. Invia con testo → chiama sendMessage ───────────────────────────────
  it('4. clicking "Invia" with non-empty text calls sendMessage once', () => {
    render(<GroupChat groupId="g1" groupName="Test Group" />)

    const textarea = screen.getByPlaceholderText(/Scrivi un messaggio/)
    fireEvent.change(textarea, { target: { value: 'Hello World!' } })

    const sendBtn = screen.getByRole('button', { name: 'Invia' })
    fireEvent.click(sendBtn)

    expect(mockSendMessage).toHaveBeenCalledOnce()
    expect(mockSendMessage).toHaveBeenCalledWith('Hello World!')
  })

  // ── 5. Invia con input vuoto → NON chiama sendMessage ────────────────────
  it('5. "Invia" button is disabled for empty input and sendMessage is not called', () => {
    render(<GroupChat groupId="g1" groupName="Test Group" />)

    const sendBtn = screen.getByRole('button', { name: 'Invia' })

    // Button must be disabled when input is empty
    expect(sendBtn).toHaveProperty('disabled', true)

    // Even if the click event fires, handleSend returns early (input.trim() === '')
    fireEvent.click(sendBtn)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  // ── 6. Click 🤖 → apre panel → click "Chiedi" → chiama askBot ────────────
  it('6. clicking 🤖 toggle then "Chiedi" calls askBot', () => {
    render(<GroupChat groupId="g1" groupName="Test Group" />)

    // Toggle bot-prompt panel open
    const botToggle = screen.getByTitle('Chiedi al Bot')
    fireEvent.click(botToggle)

    // "Chiedi" button must now be visible in the expanded panel
    const askBtn = screen.getByRole('button', { name: 'Chiedi' })
    fireEvent.click(askBtn)

    expect(mockAskBot).toHaveBeenCalledOnce()
  })
})
