import { msalInstance } from '../main'
import { loginRequest } from './msalConfig'
import { DEV_BYPASS } from './devBypass'

const BASE_URL = '/api'

// ---------------------------------------------------------------------------
// MOCK DATA — matches backend seed data
// ---------------------------------------------------------------------------

const MOCK_GIULIA: UserProfile = {
  id: 'demo-user-1',
  displayName: 'Giulia Rossi',
  email: 'giulia.rossi@demo.local',
  officeLocation: 'Milano',
  role: 'Cloud Architect',
  department: 'Cloud',
  skills: ['Azure', 'Terraform', 'Kubernetes'],
  certifications: ['AZ-900', 'AZ-305'],
  aiTools: ['Claude', 'GitHub Copilot', 'Azure OpenAI'],
  aiDescription: 'Uso Claude per code review e Azure OpenAI per automazioni',
  hobbies: ['Running', 'Jazz'],
  interests: ['Remote Work', 'Open Source'],
  profileScore: 85,
}

const MOCK_MARCO: UserProfile = {
  id: 'demo-user-2',
  displayName: 'Marco Bianchi',
  email: 'marco.bianchi@demo.local',
  officeLocation: 'Roma',
  role: 'Data & AI Engineer',
  department: 'Data & AI',
  skills: ['Python', 'LangChain', 'FastAPI'],
  certifications: ['DP-900'],
  aiTools: ['Claude', 'LangChain'],
  aiDescription: 'Sfrutto LangChain per pipeline RAG',
  hobbies: ['Corsa', 'Jazz'],
  interests: ['Machine Learning', 'Open Source'],
  profileScore: 78,
}

const MOCK_SARA: UserProfile = {
  id: 'demo-user-3',
  displayName: 'Sara Conti',
  email: 'sara.conti@demo.local',
  officeLocation: 'Torino',
  role: 'Product Designer',
  department: 'Design',
  skills: ['Figma', 'User Research', 'Prototyping'],
  certifications: [],
  aiTools: ['Claude', 'Midjourney'],
  aiDescription: 'Claude per copywriting e ideazione UX',
  hobbies: ['Yoga', 'Fotografia'],
  interests: ['UX Design', 'Mindfulness'],
  profileScore: 72,
}

const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Azure Champions',
    description: 'Community interna per professionisti Azure',
    tags: ['Azure', 'Cloud', 'Microsoft'],
    memberCount: 12,
    isSystemSuggested: true,
    isMember: true,
  },
  {
    id: 'group-2',
    name: 'AI Makers',
    description: 'Sperimentatori di AI e LLM in azienda',
    tags: ['AI', 'LLM', 'Python'],
    memberCount: 8,
    isSystemSuggested: true,
    isMember: false,
  },
  {
    id: 'group-3',
    name: 'Photo Walk Club',
    description: 'Appassionati di fotografia e passeggiate urbane',
    tags: ['Fotografia', 'Outdoor'],
    memberCount: 5,
    isSystemSuggested: false,
    isMember: false,
  },
]

const MOCK_MATCHES: WorkMatchCard[] = [
  {
    id: 'demo-user-2',
    displayName: 'Marco Bianchi',
    role: 'Data & AI Engineer',
    department: 'Data & AI',
    matchScore: 0.82,
    sharedSkills: ['Azure'],
    sharedAiTools: ['Claude'],
    sharedInterests: ['Open Source'],
  },
  {
    id: 'demo-user-3',
    displayName: 'Sara Conti',
    role: 'Product Designer',
    department: 'Design',
    matchScore: 0.61,
    sharedSkills: [],
    sharedAiTools: ['Claude'],
    sharedInterests: [],
  },
]

const MOCK_MATCH_RESULT: MatchResult = {
  id: 'match-1',
  otherUser: MOCK_MARCO,
  matchScore: 0.82,
  status: 'coffee_scheduled',
  createdAt: new Date().toISOString(),
}

const MOCK_MAP_CLUSTERS = [
  { officeLocation: 'Milano', count: 5, lat: 45.4654, lng: 9.1859 },
  { officeLocation: 'Roma', count: 3, lat: 41.9028, lng: 12.4964 },
  { officeLocation: 'Torino', count: 2, lat: 45.0703, lng: 7.6869 },
]

// In-memory mutable state for group membership (survives component re-renders)
const groupMembershipState: Record<string, boolean> = {
  'group-1': true,
  'group-2': false,
  'group-3': false,
}

// ---------------------------------------------------------------------------
// MOCK REQUEST HANDLER
// ---------------------------------------------------------------------------

function mockRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase()

  // Split path and query string
  const [basePath, queryString] = path.split('?')
  const params = new URLSearchParams(queryString ?? '')
  const q = params.get('q') ?? ''

  // POST /auth/me
  if (method === 'POST' && basePath === '/auth/me') {
    return Promise.resolve({} as T)
  }

  // GET /profiles/me
  if (method === 'GET' && basePath === '/profiles/me') {
    return Promise.resolve(MOCK_GIULIA as T)
  }

  // PUT /profiles/me
  if (method === 'PUT' && basePath === '/profiles/me') {
    return Promise.resolve(MOCK_GIULIA as T)
  }

  // GET /profiles (with optional ?q= filter)
  if (method === 'GET' && basePath === '/profiles') {
    let results: UserProfile[] = [MOCK_MARCO, MOCK_SARA]
    if (q) {
      const lower = q.toLowerCase()
      results = results.filter(
        (p) =>
          p.displayName.toLowerCase().includes(lower) ||
          (p.role ?? '').toLowerCase().includes(lower) ||
          p.skills.some((s) => s.toLowerCase().includes(lower)),
      )
    }
    return Promise.resolve(results as T)
  }

  // GET /matches/suggestions
  if (method === 'GET' && basePath === '/matches/suggestions') {
    return Promise.resolve(MOCK_MATCHES as T)
  }

  // POST /matches/swipe
  if (method === 'POST' && basePath === '/matches/swipe') {
    let body: Record<string, unknown> = {}
    try {
      body = JSON.parse((options?.body as string) ?? '{}')
    } catch {
      // ignore parse errors
    }
    const isRightOnMarco =
      body.direction === 'right' && body.targetUserId === 'demo-user-2'
    const result = isRightOnMarco
      ? { matched: true, matchId: 'match-1' }
      : { matched: false }
    return Promise.resolve(result as T)
  }

  // GET /matches
  if (method === 'GET' && basePath === '/matches') {
    return Promise.resolve([MOCK_MATCH_RESULT] as T)
  }

  // GET /groups
  if (method === 'GET' && basePath === '/groups') {
    const groups = MOCK_GROUPS.map((g) => ({
      ...g,
      isMember: groupMembershipState[g.id] ?? g.isMember,
    }))
    return Promise.resolve(groups as T)
  }

  // POST /groups/:id/join
  const joinMatch = basePath.match(/^\/groups\/([^/]+)\/join$/)
  if (method === 'POST' && joinMatch) {
    groupMembershipState[joinMatch[1]] = true
    return Promise.resolve({ success: true } as T)
  }

  // DELETE /groups/:id/leave
  const leaveMatch = basePath.match(/^\/groups\/([^/]+)\/leave$/)
  if (method === 'DELETE' && leaveMatch) {
    groupMembershipState[leaveMatch[1]] = false
    return Promise.resolve({ success: true } as T)
  }

  // GET /map/clusters
  if (method === 'GET' && basePath === '/map/clusters') {
    return Promise.resolve(MOCK_MAP_CLUSTERS as T)
  }

  // Fallback — should not happen in demo flow
  console.warn(`[mock] Unhandled ${method} ${path} — returning empty object`)
  return Promise.resolve({} as T)
}

// ---------------------------------------------------------------------------
// TOKEN + REAL REQUEST
// ---------------------------------------------------------------------------

async function getToken(): Promise<string> {
  if (DEV_BYPASS) return 'dev-bypass-token'
  const account = msalInstance.getActiveAccount()
  if (!account) throw new Error('Not authenticated')
  const response = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
  return response.accessToken
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (DEV_BYPASS) {
    return mockRequest<T>(path, options)
  }

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
