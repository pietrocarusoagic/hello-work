/**
 * Dev bypass auth helpers.
 * When VITE_DEV_BYPASS=true, skips MSAL entirely.
 *
 * Due identità di test selezionabili via URL:
 *   /debug/existing-user  → Giulia Rossi, utente censito con match attivi
 *   /debug/new-user       → Luca Verdi, nuovo utente al primo accesso
 *
 * La scelta viene salvata in localStorage (chiave: hw_debug_user)
 * e propagata al backend tramite l'header X-Debug-User.
 */

export const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

export type DebugUser = 'existing-user' | 'new-user'

const DEBUG_USER_KEY = 'hw_debug_user'

export function hasSelectedDebugUser(): boolean {
  return localStorage.getItem(DEBUG_USER_KEY) !== null
}

export function getDebugUser(): DebugUser {
  return (localStorage.getItem(DEBUG_USER_KEY) as DebugUser) ?? 'existing-user'
}

export function setDebugUser(user: DebugUser): void {
  localStorage.setItem(DEBUG_USER_KEY, user)
}

const DEBUG_USER_META: Record<DebugUser, { name: string; username: string; backendOid: string }> = {
  'existing-user': {
    name: 'Giulia Rossi (Demo)',
    username: 'giulia.rossi@hellowork.local',
    backendOid: 'demo-user-1',
  },
  'new-user': {
    name: 'Luca Verdi (Demo)',
    username: 'luca.verdi@hellowork.local',
    backendOid: 'demo-user-new',
  },
}

export function getDebugUserMeta() {
  return DEBUG_USER_META[getDebugUser()]
}

/** @deprecated usa getDebugUserMeta() */
export const DEV_MOCK_ACCOUNT = {
  name: 'Giulia Rossi (Demo)',
  username: 'demo@hellowork.local',
}
