# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server on port 8088
pnpm build        # Production build (Turbopack)
pnpm lint         # ESLint
```

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (base-nova style, lucide icons)
- **Supabase** — Auth (email/password) + Storage (avatars, device-images) + PostgREST (database queries) + RPC (complex aggregations)
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
- Uses `createServiceClient()` (service role) for DB queries, manually filters by `user_id`
- Token CRUD via Server Actions in `src/actions/tokens.ts`
- Token management UI at `/settings/tokens`
- Shared fetch/parse logic in `src/lib/grid-status.ts` and `src/lib/weather.ts`

### Database Access (Supabase PostgREST + RPC)

Two client patterns:

- **Cookie-auth client** (`src/lib/supabase/server.ts`) — Used by Server Actions and Chat API. RLS enforced automatically via Supabase JWT in cookies.
- **Service role client** (`src/lib/supabase/service.ts`) — Used by MCP route and token validation. Bypasses RLS; **every query must manually filter by `user_id`**.

Query patterns:

- **Simple CRUD** — PostgREST: `supabase.from('table').select/insert/update/delete`
- **Complex aggregations** (GROUP BY, JOIN + pagination) — PostgreSQL RPC functions: `supabase.rpc('function_name', params)`
- **RPC functions** defined in `supabase/migrations/20260324_rpc_functions.sql`
- **Database types** in `src/lib/supabase/database.types.ts` (typed `SupabaseClient<Database>`)

### Shared Query Modules (`src/lib/queries/`)

MCP tools and Chat tools share the same query functions to avoid duplication:

- `src/lib/queries/devices.ts` — Device queries + tool helpers (summary, tips)
- `src/lib/queries/usage-logs.ts` — Usage log RPC wrappers
- `src/lib/queries/chat.ts` — Chat session/message CRUD
- `src/lib/queries/tokens.ts` — MCP token CRUD + validation
- `src/lib/queries/user-settings.ts` — User settings query

Each function takes `(supabase, userId, ...)` and handles snake_case → camelCase mapping.

### Supabase Clients

- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient` from `@supabase/ssr`)
- `src/lib/supabase/server.ts` — Server client with cookie management (`createServerClient`)
- `src/lib/supabase/service.ts` — Service role client for MCP/admin operations

### Supabase Storage

- **Buckets**: `avatars` (public), `device-images` (public) — write restricted by RLS to user's own folder
- **Paths**: `avatars/{userId}/avatar.webp`, `device-images/{userId}/{deviceId}.webp`
- **Avatar URL**: stored in `user.user_metadata.avatar_url` (Supabase Auth metadata)
- **Device image URL**: stored in `devices.image_url` column
- **Upload utility**: `src/lib/upload-image.ts` — client-side compression via `browser-image-compression` + upload to Storage
- **Migration**: `supabase/migrations/20260313_storage_buckets.sql`
- **Architecture doc**: `docs/storage-architecture.md`

### Project Structure

```
src/
├── actions/           # Server Actions (chat, devices, tokens, usage-logs)
├── app/               # Next.js App Router pages + API routes
├── components/
│   ├── ui/            # shadcn/ui base components
│   ├── dashboard/     # Dashboard feature components
│   └── billing/       # Billing feature components
├── constants/         # App constants (device presets, electricity plans)
├── hooks/             # Shared React hooks (use-store, use-grid-status, etc.)
├── store/             # Redux Toolkit store, slices, provider
└── lib/               # Utilities (cn, types, supabase clients, queries)
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
- `src/lib/supabase/database.types.ts` — Supabase Database type definitions
- `src/lib/supabase/service.ts` — Service role client (MCP, token validation)
- `src/lib/queries/devices.ts` — Shared device queries (used by actions, chat tools, MCP tools)
- `src/lib/queries/usage-logs.ts` — Usage log RPC wrappers
- `supabase/migrations/20260324_rpc_functions.sql` — PostgreSQL RPC functions for aggregations
- `src/actions/devices.ts` — Server Actions for device CRUD (includes storage cleanup on delete)
- `src/lib/upload-image.ts` — Image compression + Supabase Storage upload utilities
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components.json` — shadcn/ui configuration

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key (MCP + token validation)
CWA_API_KEY                   # 中央氣象署 Open API
OPENAI_API_KEY                # OpenAI API (chat + web search)
```

## Language

UI text is in **Traditional Chinese (zh-TW)**. Keep all user-facing strings in Chinese.
