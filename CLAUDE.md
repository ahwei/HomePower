# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server on port 8088
pnpm build        # Production build (Turbopack)
pnpm lint         # ESLint
pnpm db:generate  # Generate Drizzle migration files
pnpm db:push      # Push schema directly to DB (dev)
pnpm db:studio    # Open Drizzle Studio (DB GUI)
```

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (base-nova style, lucide icons)
- **Supabase** — Auth (email/password)
- **Drizzle ORM** + **pg** — PostgreSQL database access (schema in `src/db/schema.ts`), RLS enforced via `authDb()`
- **react-hook-form** + **Zod v4** for form validation
- **sonner** for toast notifications

## Architecture

### Routing

- `src/app/(app)/` — Protected route group (app shell with sidebar)
- `src/app/login/` — Public login page
- `src/app/auth/callback/` — Supabase auth callback (email confirmation, etc.)

### Auth Flow

1. Login: email/password via `supabase.auth.signInWithPassword()`
2. No public registration — accounts created in Supabase Dashboard only

### Middleware (Proxy)

Next.js 16 uses `src/proxy.ts` (not `middleware.ts`). It handles:
- Session refresh on every request
- Redirect unauthenticated → `/login` (except `/login`, `/auth/*`, `/api/mcp`, `/.well-known`)
- Redirect authenticated away from `/login` → `/`

### MCP Server

`src/app/api/mcp/route.ts` — Streamable HTTP transport, stateless mode (no SSE):
- Bearer token auth via `src/lib/mcp-auth.ts` (SHA-256 hashed tokens in `mcp_tokens` table)
- 6 tools, 2 resources, 3 prompts — registered via `createMcpServer(userId)`
- Token CRUD via Server Actions in `src/app/actions/tokens.ts`
- Token management UI at `/settings/tokens`
- Shared fetch/parse logic in `src/lib/grid-status.ts` and `src/lib/weather.ts`

### Supabase Clients

- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient` from `@supabase/ssr`)
- `src/lib/supabase/server.ts` — Server client with cookie management (`createServerClient`)

### Project Structure

```
src/
├── app/               # Next.js App Router pages + API routes
├── components/
│   ├── ui/            # shadcn/ui base components
│   ├── dashboard/     # Dashboard feature components
│   └── billing/       # Billing feature components
├── constants/         # App constants (device presets, electricity plans)
├── db/                # Drizzle ORM schema + singleton instance
├── hooks/             # Shared React hooks (use-store, use-grid-status, etc.)
├── store/             # Redux Toolkit store, slices, provider
└── lib/               # Utilities (cn, types, supabase clients)
```

### Component Patterns

- **Server Components** by default; add `"use client"` only when needed
- **shadcn/ui** components in `src/components/ui/` — import from `@/components/ui/xxx`
- Feature components in `src/components/{feature}/` — e.g. `@/components/dashboard/xxx`
- App shell: `SidebarProvider` + `AppSidebar` + `SidebarInset` wrapping pages
- Page header pattern: `SidebarTrigger` + `Separator` + title
- Forms: always use react-hook-form + Zod schema + `zodResolver`

### Import Alias

`@/*` → `./src/*`

## Key Files

- `src/proxy.ts` — Auth middleware (Next.js 16 proxy pattern)
- `src/app/(app)/layout.tsx` — Protected layout, fetches user server-side
- `src/components/app-sidebar.tsx` — Navigation + user dropdown
- `src/db/schema.ts` — Drizzle ORM schema (devices, usage_logs, user_settings, mcp_tokens)
- `src/db/index.ts` — Drizzle DB singleton (`db`) + RLS-enforced wrapper (`authDb`). Use `authDb(userId, fn)` for user-scoped queries; `db` is reserved for admin-level operations (e.g. token validation in `mcp-auth.ts`)
- `src/app/actions/devices.ts` — Server Actions for device CRUD
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components.json` — shadcn/ui configuration
- `drizzle.config.ts` — Drizzle Kit configuration

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
DATABASE_URL                  # PostgreSQL connection string
CWA_API_KEY                   # 中央氣象署 Open API
OPENAI_API_KEY                # OpenAI API (chat + web search)
```

## Language

UI text is in **Traditional Chinese (zh-TW)**. Keep all user-facing strings in Chinese.
