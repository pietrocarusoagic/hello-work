import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroupChat } from './useGroupChat'

// ── Module mocks ──────────────────────────────────────────────────────────────
// Force DEV_BYPASS = true so SignalR is never instantiated in these tests
vi.mock('../lib/devBypass', () => ({ DEV_BYPASS: true }))

// Stub @microsoft/signalr — the module is imported at the top of useGroupChat
// even though the SignalR code is never reached when DEV_BYPASS = true.
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => ({
      on: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      invoke: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    })),
  })),
  LogLevel: { Warning: 1 },
}))

// Stub api — the history-load Effect always fires regardless of DEV_BYPASS.
// Returning [] keeps the initial messages state clean for assertions.
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
  },
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGroupChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 1. Initial state ──────────────────────────────────────────────────────
  it('1. messages array starts empty on mount', async () => {
    const { result } = renderHook(() => useGroupChat('group-1'))

    // Let the api.get() Promise (from the history-load Effect) resolve
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.messages).toEqual([])
  })

  // ── 2. DEV_BYPASS: sendMessage ────────────────────────────────────────────
  it('2. DEV_BYPASS: sendMessage appends a user message to state', async () => {
    const { result } = renderHook(() => useGroupChat('group-1', 'Test Group'))

    // Let initial history load settle
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.sendMessage('Ciao team!')
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].body).toBe('Ciao team!')
    expect(result.current.messages[0].senderType).toBe('user')
    expect(result.current.messages[0].groupId).toBe('group-1')
  })

  // ── 3. DEV_BYPASS: askBot ─────────────────────────────────────────────────
  it('3. DEV_BYPASS: askBot sets loading=true then appends a bot message after 800 ms', async () => {
    const { result } = renderHook(() => useGroupChat('group-1', 'Test Group'))

    // Let initial history settle
    await act(async () => {
      await Promise.resolve()
    })

    // Trigger askBot — fire-and-forget (the setTimeout is 800 ms)
    act(() => {
      result.current.askBot()
    })

    // Immediately after call: loading = true, no new message yet
    expect(result.current.loading).toBe(true)
    expect(result.current.messages).toHaveLength(0)

    // Advance the fake clock AND flush React updates in the same act block.
    // Using async act ensures pending state batches are committed.
    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    // After timeout fires: bot message is in state and loading is cleared
    expect(result.current.messages.some((m) => m.senderType === 'bot')).toBe(true)
    expect(result.current.loading).toBe(false)
  })
})
