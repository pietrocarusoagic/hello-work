import { msalInstance } from '../main'
import { loginRequest } from './msalConfig'
import { DEV_BYPASS, getDevUserType } from './devBypass'

const BASE_URL = '/api'

async function getToken(): Promise<string> {
  if (DEV_BYPASS) return 'dev-bypass-token'
  const account = msalInstance.getActiveAccount()
  if (!account) throw new Error('Not authenticated')
  const response = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
  return response.accessToken
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(DEV_BYPASS ? { 'X-Dev-User': getDevUserType() } : {}),
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
