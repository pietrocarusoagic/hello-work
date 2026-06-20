import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        if (level === LogLevel.Error) console.error(message)
      },
    },
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', `api://${import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id'}/access_as_user`],
}

export const graphRequest = {
  scopes: ['User.Read'],
}
