import { msalInstance } from '../main'
import { loginRequest } from './msalConfig'
import { DEV_BYPASS } from './devBypass'

const BASE_URL = '/api'

// ── DEV_BYPASS mock store ─────────────────────────────────────────────────
// Keyed by groupId. Messages accumulate per group during the session.
const _mockMessages: Record<string, MessageDto[]> = {}

function getMockMessages(groupId: string): MessageDto[] {
  if (!_mockMessages[groupId]) {
    _mockMessages[groupId] = [
      {
        id: 1,
        groupId,
        senderId: 'demo-user-1',
        senderDisplayName: 'Giulia Rossi',
        senderType: 'user',
        body: 'Ciao a tutti! Qualcuno ha provato le nuove funzionalità di Copilot?',
        sourceUrls: [],
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
      {
        id: 2,
        groupId,
        senderId: 'demo-user-2',
        senderDisplayName: 'Marco Bianchi',
        senderType: 'user',
        body: 'Sì! Sto esplorando l\'integrazione con Azure OpenAI. Molto promettente.',
        sourceUrls: [],
        createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      },
      {
        id: 3,
        groupId,
        senderId: undefined,
        senderDisplayName: 'HelloWork Bot',
        senderType: 'bot',
        body: 'Benvenuti! Sono il bot di questo gruppo. Posso aiutarvi a trovare contenuti rilevanti e stimolare la discussione. Chiedetemi pure! 🤖',
        sourceUrls: [],
        createdAt: new Date(Date.now() - 1 * 60_000).toISOString(),
      },
    ]
  }
  return _mockMessages[groupId]
}

async function getToken(): Promise<string> {
  if (DEV_BYPASS) return 'dev-bypass-token'
  const account = msalInstance.getActiveAccount()
  if (!account) throw new Error('Not authenticated')
  const response = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
  return response.accessToken
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // ── DEV_BYPASS: intercept chat endpoints ────────────────────────────────
  if (DEV_BYPASS) {
    const messagesMatch = path.match(/^\/groups\/([^/]+)\/messages$/)
    const botAskMatch = path.match(/^\/groups\/([^/]+)\/bot-ask$/)

    if (messagesMatch && (!options?.method || options.method === 'GET')) {
      return getMockMessages(messagesMatch[1]) as unknown as T
    }

    if (messagesMatch && options?.method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {}
      const msgs = getMockMessages(messagesMatch[1])
      const newMsg: MessageDto = {
        id: Date.now(),
        groupId: messagesMatch[1],
        senderId: 'demo-user-1',
        senderDisplayName: 'Giulia Rossi',
        senderType: 'user',
        body: body.body ?? '',
        sourceUrls: [],
        createdAt: new Date().toISOString(),
      }
      msgs.push(newMsg)
      return newMsg as unknown as T
    }

    if (botAskMatch) {
      const groupId = botAskMatch[1]
      const msgs = getMockMessages(groupId)
      const botMsg: MessageDto = {
        id: Date.now(),
        groupId,
        senderId: undefined,
        senderDisplayName: 'HelloWork Bot',
        senderType: 'bot',
        body: `Ottima domanda! In questo gruppo stiamo esplorando temi innovativi. Cosa ne pensate? 🤖`,
        sourceUrls: [],
        createdAt: new Date().toISOString(),
      }
      msgs.push(botMsg)
      return botMsg as unknown as T
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export interface UserProfile {
  id: string
  displayName: string
  email: string
  officeLocation: string
  avatarUrl?: string
  role?: string
  department?: string
  skills: string[]
  certifications: string[]
  aiTools: string[]
  aiDescription?: string
  hobbies: string[]
  interests: string[]
  profileScore: number
}

export interface WorkMatchCard {
  id: string
  displayName: string
  role?: string
  department?: string
  avatarUrl?: string
  matchScore: number
  sharedSkills: string[]
  sharedAiTools: string[]
  sharedInterests: string[]
}

export interface Group {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: number
  isSystemSuggested: boolean
  isMember: boolean
}

export interface MatchResult {
  id: string
  otherUser: UserProfile
  matchScore: number
  status: 'pending' | 'coffee_scheduled' | 'connected'
  createdAt: string
}

export interface MessageDto {
  id: number
  groupId: string
  senderId?: string
  senderDisplayName: string
  senderType: 'user' | 'bot'
  body: string
  sourceUrls: string[]
  createdAt: string
}
