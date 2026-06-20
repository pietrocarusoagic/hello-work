---
applyTo: "src/frontend/**"
---

# Frontend — React 19 + TypeScript + Vite 6 conventions

## Project structure

```
src/frontend/src/
├── pages/           ← route-level components (Login, Home, Profile, WorkMatch, Groups, Map)
├── components/      ← reusable UI (SwipeCard, ProfilePillar, OfficeMap)
└── lib/
    ├── msalConfig.ts  ← MSAL configuration (do not duplicate auth logic)
    └── api.ts         ← typed fetch client (all API calls go here)
```

## Key rules

- Auth state via `@azure/msal-react` hooks only (`useIsAuthenticated`, `useMsal`). Never roll custom auth.
- All API calls through `lib/api.ts` typed client — no direct `fetch` in components.
- Use `shadcn/ui` components before writing custom UI. Check if the component exists first.
- WorkMatch swipe uses `react-tinder-card` — do not re-implement gesture handling.
- Office Map uses `azure-maps-control` — do not use a different map library.

## Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | Login.tsx | public |
| `/` | Home.tsx (Discovery Feed) | auth required |
| `/profile/:id` | Profile.tsx | auth required |
| `/workmatch` | WorkMatch.tsx | auth required |
| `/groups` | Groups.tsx | auth required |
| `/map` | Map.tsx | auth required |

Auth guard: wrap protected routes with `MsalAuthenticationTemplate`.

## Testing

- `npm test` — Vitest + React Testing Library
- Mock MSAL with `@azure/msal-browser` mock provider
- Test user-visible behavior (renders, clicks, API calls) not internal state
