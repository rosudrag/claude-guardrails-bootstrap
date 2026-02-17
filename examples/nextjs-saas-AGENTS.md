# Acme SaaS Platform

Multi-tenant SaaS application with subscription billing, team management, and an AI-powered analytics dashboard.

## Commands

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Dev | `npm run dev` |
| Type check | `npx tsc --noEmit` |

## Critical Rules (NEVER VIOLATE)

| Rule | Details |
|------|---------|
| **TDD Mandatory** | RED → GREEN → REFACTOR. Test first, always. |
| **Research First** | Never guess behavior - verify before coding. |
| **No Hardcoded Secrets** | Use env vars via `process.env`, never string literals. |
| **RLS Always On** | All Supabase queries go through RLS. Never bypass with service role in client code. |
| **Server Components Default** | No `'use client'` unless the component needs interactivity. |

## Doc Lookup

| Need to... | Read |
|------------|------|
| Write tests / TDD workflow | [tdd-enforcement.md](./ai-docs/tdd-enforcement.md) |
| Debug / iterate on problem | [iterative-problem-solving.md](./ai-docs/iterative-problem-solving.md) |
| Ensure code quality | [code-quality.md](./ai-docs/code-quality.md) |
| Secure sensitive data | [security.md](./ai-docs/security.md) |
| Verify before PR | [verification.md](./ai-docs/verification.md) |
| Check ADR decisions | [docs/adrs/](./docs/adrs/README.md) |

## Key Paths

| Component | Path |
|-----------|------|
| App router | `src/app/` |
| UI components | `src/components/ui/` |
| Feature components | `src/components/` |
| Custom hooks | `src/hooks/` |
| Supabase clients | `src/lib/supabase/` |
| Stripe helpers | `src/lib/stripe/` |
| Shared types | `src/types/` |
| Migrations | `supabase/migrations/` |
| Tests | `__tests__/` |
| Docs | `ai-docs/` |

## Architecture

Request → Middleware (auth refresh) → Server Component → Supabase (RLS) → Response

## Key Patterns

### Authentication

```typescript
// Server Component - use createServerClient
import { createServerClient } from '@/lib/supabase/server'

const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()

// Client Component - use createBrowserClient
import { createBrowserClient } from '@/lib/supabase/client'
```

### API Response Format

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

### Server Actions

```typescript
'use server'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1).max(100) })

export async function createProject(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name: parsed.data.name, user_id: user.id })
    .select('id, name, created_at')
    .single()

  if (error) return { success: false, error: 'Failed to create project' }
  return { success: true, data }
}
```

### Billing

- Stripe Checkout for payment flow (never trust client-side prices)
- Webhook handler at `src/app/api/webhooks/stripe/route.ts`
- Subscription status synced by webhook to `subscriptions` table
- Feature gating checked server-side via middleware

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-only

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Commits

50/72 rule. Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
