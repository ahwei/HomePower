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
- **Supabase** — Auth (email/password + WebAuthn passkey MFA)
- **Drizzle ORM** + **pg** — PostgreSQL database access (schema in `src/lib/db/schema.ts`)
- **react-hook-form** + **Zod v4** for form validation
- **sonner** for toast notifications

## Architecture

### Routing

- `src/app/(app)/` — Protected route group (app shell with sidebar)
- `src/app/login/` — Public login page
- `src/app/auth/callback/` — Supabase auth callback (email confirmation, etc.)

### Auth Flow

1. Login: email/password via `supabase.auth.signInWithPassword()`
2. If MFA required (AAL2): WebAuthn passkey verification via `supabase.auth.mfa.webauthn.authenticate()`
3. Passkey registration (post-login): `supabase.auth.mfa.webauthn.register()` in sidebar dropdown
4. No public registration — accounts created in Supabase Dashboard only

### Middleware (Proxy)

Next.js 16 uses `src/proxy.ts` (not `middleware.ts`). It handles:
- Session refresh on every request
- Redirect unauthenticated → `/login` (except `/login`, `/auth/*`)
- Redirect authenticated away from `/login` → `/`

### Supabase Clients

- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient` from `@supabase/ssr`)
- `src/lib/supabase/server.ts` — Server client with cookie management (`createServerClient`)

### Component Patterns

- **Server Components** by default; add `"use client"` only when needed
- **shadcn/ui** components in `src/components/ui/` — import from `@/components/ui/xxx`
- App shell: `SidebarProvider` + `AppSidebar` + `SidebarInset` wrapping pages
- Page header pattern: `SidebarTrigger` + `Separator` + title
- Forms: always use react-hook-form + Zod schema + `zodResolver`

### Import Alias

`@/*` → `./src/*`

## Key Files

- `src/proxy.ts` — Auth middleware (Next.js 16 proxy pattern)
- `src/app/(app)/layout.tsx` — Protected layout, fetches user server-side
- `src/components/app-sidebar.tsx` — Navigation + user dropdown + passkey registration
- `src/lib/db/schema.ts` — Drizzle ORM schema (devices, usage_logs, user_settings)
- `src/lib/db/index.ts` — Drizzle DB singleton instance
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
