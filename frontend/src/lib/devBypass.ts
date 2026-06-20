/**
 * Dev bypass auth helpers.
 * When VITE_DEV_BYPASS=true, skips MSAL entirely and treats
 * the app as authenticated as the seed user (demo-user-1).
 */

export const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true'

export const DEV_MOCK_ACCOUNT = {
  name: 'Giulia Rossi (Demo)',
  username: 'demo@hellowork.local',
}
