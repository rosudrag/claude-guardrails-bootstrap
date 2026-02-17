# TypeScript / React / Next.js Patterns

Deep patterns for TypeScript-first web applications. Supplements the universal code quality guide with stack-specific idioms.

---

## Type System Mastery

### Discriminated Unions for State Machines

Model application states as discriminated unions so the compiler enforces exhaustive handling.

```typescript
// Bad: Boolean flags create impossible states
interface RequestState {
    isLoading: boolean;
    isError: boolean;
    data: User[] | null;
    error: Error | null;
}
// Can be { isLoading: true, isError: true } - nonsensical

// Good: Discriminated union makes impossible states unrepresentable
type RequestState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: User[] }
    | { status: 'error'; error: Error };

function renderUsers(state: RequestState) {
    switch (state.status) {
        case 'idle':
            return <EmptyState />;
        case 'loading':
            return <Spinner />;
        case 'success':
            return <UserList users={state.data} />;
        case 'error':
            return <ErrorBanner message={state.error.message} />;
        // Compiler error if a case is missed
    }
}
```

### Branded Types for Domain Safety

Prevent accidental mixing of structurally identical types that represent different domain concepts.

```typescript
// Bad: Both are strings - easy to swap by accident
function transferFunds(fromAccountId: string, toAccountId: string, amount: number) {}
transferFunds(toId, fromId, 100); // Silently backwards - no compiler error

// Good: Branded types catch misuse at compile time
type AccountId = string & { readonly __brand: 'AccountId' };
type TransactionId = string & { readonly __brand: 'TransactionId' };

function accountId(raw: string): AccountId {
    // Add runtime validation here if needed
    return raw as AccountId;
}

function transferFunds(from: AccountId, to: AccountId, amount: number) {}
transferFunds(txnId, accountId('123'), 100); // Compiler error: TransactionId !== AccountId
```

### Type Narrowing Over Assertions

Prefer narrowing that the compiler can verify over `as` casts that bypass the type system.

```typescript
// Bad: Type assertion - no runtime safety
function getArea(shape: unknown): number {
    const s = shape as Circle; // What if it's a Rectangle?
    return Math.PI * s.radius ** 2;
}

// Good: Type guard with runtime check
function isCircle(shape: Shape): shape is Circle {
    return shape.kind === 'circle';
}

function getArea(shape: Shape): number {
    if (isCircle(shape)) {
        return Math.PI * shape.radius ** 2; // Compiler knows shape is Circle
    }
    if (isRectangle(shape)) {
        return shape.width * shape.height;
    }
    const _exhaustive: never = shape; // Compile error if a shape case is unhandled
    throw new Error(`Unknown shape: ${_exhaustive}`);
}
```

---

## Utility Type Patterns

### Pick, Omit, and Partial for API Boundaries

Use utility types to derive API-specific shapes from your domain types instead of duplicating definitions.

```typescript
// Bad: Separate interfaces that drift out of sync
interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
}
interface CreateUserRequest {
    email: string;
    name: string;
}
interface UserResponse {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

// Good: Derive from single source of truth
interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
}

type CreateUserRequest = Pick<User, 'email' | 'name'>;
type UpdateUserRequest = Partial<Pick<User, 'email' | 'name'>>;
type UserResponse = Omit<User, 'passwordHash'>;
```

### Record for Typed Dictionaries

```typescript
// Bad: Untyped index signature
const statusLabels: { [key: string]: string } = {
    active: 'Active',
    suspended: 'Suspended',
    // Can add arbitrary keys with no safety
};

// Good: Record constrains keys and values
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    // Compiler error if you miss one or add an invalid key
};
```

### Generic Constraints for Reusable Utilities

```typescript
// Good: Generic that enforces shape requirements
function groupBy<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return items.reduce((acc, item) => {
        const key = keyFn(item);
        (acc[key] ??= []).push(item);
        return acc;
    }, {} as Record<K, T[]>);
}

const byDepartment = groupBy(users, u => u.department);
// Type: Record<string, User[]>
```

---

## React Component Patterns

### Composition Over Configuration

Design components that compose through children and slots, not giant prop objects.

```typescript
// Bad: Mega-component with too many responsibilities
<DataTable
    data={users}
    columns={columns}
    sortable
    filterable
    paginated
    pageSize={20}
    onSort={handleSort}
    onFilter={handleFilter}
    emptyMessage="No users found"
    loadingComponent={<Spinner />}
    errorComponent={<ErrorBanner />}
    rowActions={[edit, delete]}
/>

// Good: Composable parts
<DataTable data={users}>
    <DataTable.Toolbar>
        <DataTable.Search placeholder="Filter users..." />
        <DataTable.ColumnToggle />
    </DataTable.Toolbar>
    <DataTable.Header>
        <DataTable.SortableColumn field="name">Name</DataTable.SortableColumn>
        <DataTable.Column field="email">Email</DataTable.Column>
    </DataTable.Header>
    <DataTable.Body renderRow={(user) => (
        <DataTable.Row key={user.id}>
            <DataTable.Cell>{user.name}</DataTable.Cell>
            <DataTable.Cell>{user.email}</DataTable.Cell>
        </DataTable.Row>
    )} />
    <DataTable.Pagination pageSize={20} />
</DataTable>
```

### Custom Hooks for Shared Logic

Extract stateful logic into hooks that separate concerns cleanly.

```typescript
// Good: Hook encapsulates async data fetching with all states
function useAsync<T>(
    asyncFn: () => Promise<T>,
    deps: React.DependencyList
): RequestState<T> {
    const [state, setState] = useState<RequestState<T>>({ status: 'idle' });

    useEffect(() => {
        let cancelled = false;
        setState({ status: 'loading' });

        asyncFn()
            .then(data => {
                if (!cancelled) setState({ status: 'success', data });
            })
            .catch(error => {
                if (!cancelled) setState({ status: 'error', error });
            });

        return () => { cancelled = true; };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return state;
}

// Usage: clean component code
function UserProfile({ userId }: { userId: string }) {
    const state = useAsync(() => fetchUser(userId), [userId]);

    if (state.status === 'loading') return <Spinner />;
    if (state.status === 'error') return <ErrorMessage error={state.error} />;
    if (state.status === 'success') return <ProfileCard user={state.data} />;
    return null;
}
```

### Proper Component Typing

```typescript
// Bad: Using React.FC (adds implicit children, poor generic support)
const UserCard: React.FC<{ user: User }> = ({ user }) => { ... };

// Good: Direct function with explicit props
interface UserCardProps {
    user: User;
    onEdit?: (user: User) => void;
}

function UserCard({ user, onEdit }: UserCardProps) {
    return (
        <div>
            <h2>{user.name}</h2>
            {onEdit && <button onClick={() => onEdit(user)}>Edit</button>}
        </div>
    );
}

// Good: Generic component with forwardRef
interface ListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
    return <ul>{items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
    ))}</ul>;
}
```

---

## State Management Patterns

### Context for Cross-Cutting Concerns

Use context for low-frequency, cross-cutting state. Avoid it for high-frequency updates.

```typescript
// Good: Auth context - changes infrequently, needed everywhere
interface AuthContext {
    user: User | null;
    login: (credentials: Credentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

function useAuth(): AuthContext {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
```

### Reducer for Complex State Transitions

```typescript
// Good: Reducer for state with interrelated fields
type CartAction =
    | { type: 'ADD_ITEM'; item: Product; quantity: number }
    | { type: 'REMOVE_ITEM'; itemId: string }
    | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
    | { type: 'APPLY_COUPON'; code: string; discount: number }
    | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'ADD_ITEM':
            return {
                ...state,
                items: [...state.items, { ...action.item, quantity: action.quantity }],
                total: state.total + action.item.price * action.quantity,
            };
        case 'REMOVE_ITEM':
            const item = state.items.find(i => i.id === action.itemId);
            return {
                ...state,
                items: state.items.filter(i => i.id !== action.itemId),
                total: state.total - (item ? item.price * item.quantity : 0),
            };
        // ... other cases
    }
}
```

---

## Next.js App Router Patterns

### Server Components as Default

Server Components are the default in App Router. Only add `'use client'` when you need browser APIs.

```typescript
// Good: Server Component - no 'use client' directive
// Runs on the server, can directly access databases and secrets
async function ProductPage({ params }: { params: { id: string } }) {
    const product = await db.product.findUnique({ where: { id: params.id } });
    if (!product) notFound();

    return (
        <main>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <AddToCartButton productId={product.id} price={product.price} />
        </main>
    );
}

// Good: Client Component only for interactivity
'use client';

function AddToCartButton({ productId, price }: { productId: string; price: number }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            disabled={isPending}
            onClick={() => startTransition(() => addToCart(productId))}
        >
            {isPending ? 'Adding...' : `Add to Cart - $${price}`}
        </button>
    );
}
```

### Server Actions for Mutations

```typescript
// Good: Server action with validation and error handling
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreatePostSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
});

export async function createPost(formData: FormData) {
    const parsed = CreatePostSchema.safeParse({
        title: formData.get('title'),
        content: formData.get('content'),
    });

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    const session = await getSession();
    if (!session?.user) {
        return { error: { _form: ['Not authenticated'] } };
    }

    await db.post.create({
        data: { ...parsed.data, authorId: session.user.id },
    });

    revalidatePath('/posts');
}
```

### Error Boundaries and Suspense

```typescript
// Good: error.tsx for route-level error handling
'use client';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        reportError(error);
    }, [error]);

    return (
        <div role="alert">
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Try again</button>
        </div>
    );
}

// Good: loading.tsx for route-level loading state
export default function Loading() {
    return <ProductListSkeleton />;
}

// Good: Granular Suspense for partial loading
async function DashboardPage() {
    return (
        <div>
            <h1>Dashboard</h1>
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats />
            </Suspense>
            <Suspense fallback={<ActivitySkeleton />}>
                <RecentActivity />
            </Suspense>
        </div>
    );
}
```

---

## Anti-Patterns to Avoid

### `any` Abuse

`any` disables type checking entirely. It propagates through your codebase and defeats the purpose of TypeScript.

```typescript
// Bad: any as a lazy escape hatch
function processResponse(data: any) {
    return data.results.map((r: any) => r.name); // No safety at all
}

// Good: Use unknown for truly unknown data, then narrow
function processResponse(data: unknown): string[] {
    if (!isApiResponse(data)) {
        throw new ValidationError('Unexpected API response shape');
    }
    return data.results.map(r => r.name);
}
```

### Type Assertion Overuse

```typescript
// Bad: Asserting to silence the compiler
const config = JSON.parse(rawConfig) as AppConfig; // No validation

// Good: Validate at runtime, let the compiler infer
const config = AppConfigSchema.parse(JSON.parse(rawConfig)); // Zod validates and infers
```

### Barrel File Performance

Barrel files (`index.ts` that re-export everything) can cause bundle bloat because tree-shaking often fails across re-exports.

```typescript
// Bad: Giant barrel file
// utils/index.ts
export * from './string-utils';   // 50 functions
export * from './date-utils';     // 30 functions
export * from './math-utils';     // 40 functions
// Importing one function may pull in all 120

// Good: Import directly from the module
import { formatDate } from '@/utils/date-utils';
```

### Unnecessary useEffect

```typescript
// Bad: Deriving state in useEffect
function ProductList({ products }: { products: Product[] }) {
    const [filtered, setFiltered] = useState(products);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setFiltered(products.filter(p => p.name.includes(search)));
    }, [products, search]); // Unnecessary render cycle

    return <List items={filtered} />;
}

// Good: Derive during render - no effect needed
function ProductList({ products }: { products: Product[] }) {
    const [search, setSearch] = useState('');
    const filtered = useMemo(
        () => products.filter(p => p.name.includes(search)),
        [products, search]
    );

    return <List items={filtered} />;
}
```

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|------------|-------------|
| Discriminated unions | State machines, API responses | Compiler-enforced exhaustive handling |
| Branded types | IDs, currencies, domain primitives | Prevents accidental type mixing |
| `Pick` / `Omit` / `Partial` | API request/response types | Single source of truth |
| `Record<K, V>` | Typed lookup maps | Exhaustive key coverage |
| Custom hooks | Shared stateful logic | Separation of concerns |
| Composition pattern | Complex UI components | Flexibility without prop explosion |
| Server Components | Data fetching, static rendering | Zero client JS, direct DB access |
| Server Actions | Form submissions, mutations | Type-safe mutations with validation |
| `unknown` over `any` | External data boundaries | Forces runtime validation |
| Direct imports over barrels | Performance-sensitive bundles | Better tree-shaking |

{{#if project_uses_trpc}}
> **tRPC Note**: When using tRPC, the discriminated union and utility type patterns apply at the router level. Let tRPC infer types from your router definition rather than manually defining request/response types.
{{/if}}

{{#if project_uses_tanstack_query}}
> **TanStack Query Note**: Prefer TanStack Query's built-in state discriminated union (`isLoading`, `isError`, `data`, `error`) over custom `useAsync` hooks. The patterns here still apply for non-query async operations.
{{/if}}
