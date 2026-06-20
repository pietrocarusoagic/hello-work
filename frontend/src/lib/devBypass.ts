/**
 * Dev bypass auth helpers.
 * When VITE_DEV_BYPASS=true, skips MSAL entirely.
 *
 * Due identità di test selezionabili via /debug/login/<tipo>:
 *   "existing" → demo-user-1, Giulia Rossi  (utente censito con match attivi)
 *   "new"      → demo-new-1,  Luca Ferrari  (primo accesso, profilo vuoto)
 */

export const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

export type DevUserType = 'existing' | 'new'

const DEV_USER_KEY = 'hw_dev_user'

export function getDevUserType(): DevUserType {
  return (localStorage.getItem(DEV_USER_KEY) as DevUserType) ?? 'existing'
}

export function setDevUserType(type: DevUserType) {
  localStorage.setItem(DEV_USER_KEY, type)
}

const DEV_MOCK_ACCOUNTS: Record<DevUserType, { name: string; username: string }> = {
  existing: { name: 'Giulia Rossi (Demo)', username: 'giulia.rossi@example.com' },
  new: { name: 'Luca Ferrari (Nuovo)', username: 'luca.ferrari@hellowork.local' },
}

export function getDevMockAccount() {
  return DEV_MOCK_ACCOUNTS[getDevUserType()]
}

/** @deprecated usa getDevMockAccount() */
export const DEV_MOCK_ACCOUNT = DEV_MOCK_ACCOUNTS.existing
