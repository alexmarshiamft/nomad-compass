# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Nomad Compass App

Global location optimizer for remote workers. Users enter profile → compare 46 cities on taxes, COL, QoL, visa, internet, and relocation difficulty.

### Artifacts
- `artifacts/nomad-compass` — React+Vite frontend (port 20740, preview path `/`)
- `artifacts/api-server` — Express API (port 8080, path `/api`)
- `artifacts/nomad-compass-hero` — Cinematic hero video (Framer Motion)

### Key Files
- `artifacts/api-server/src/lib/location-data.ts` — 46 city data (tax brackets, COL, QoL, visa, `RELOCATION_INFO`)
- `artifacts/api-server/src/routes/locations/index.ts` — API routes
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for contracts)
- `artifacts/nomad-compass/src/lib/user-context.tsx` — UserProfile context
- `artifacts/nomad-compass/src/pages/` — home, compare, tax-analysis, recommendations

### Codegen Note
After changing `openapi.yaml`, run `pnpm exec orval --config ./orval.config.ts` from `lib/api-spec/`, then manually fix `lib/api-zod/src/index.ts` to only `export * from "./generated/api"` (orval regenerates a broken barrel that also exports `./generated/api.schemas` which doesn't exist).

### Features
- Multi-step home form: income, employer country/state, work schedule, timezone, priorities, "Stay in USA" toggle
- Compare table: 46 cities (or 8 US cities in USA mode), sortable, with Move Ease badges
- Tax analysis page: detailed breakdown + AI Gemini analysis + Relocation Reality Check section
- AI Picks / Recommendations: Gemini-powered top-6 suggestions
- Relocation Reality Check: setup difficulty, visa-free days, one-time cost, banking notes, step-by-step guide for all 46 cities
