# Go Patterns

Deep patterns for idiomatic Go. Supplements the universal code quality guide with Go-specific conventions for error handling, concurrency, and interface design.

---

## Idiomatic Go Fundamentals

### Accept Interfaces, Return Structs

Functions should accept the narrowest interface they need and return concrete types. This maximizes flexibility for callers while keeping implementations explicit.

```go
// Bad: Accepting concrete types couples callers to implementation
func ProcessOrders(repo *PostgresOrderRepository) error {
    orders, err := repo.FindPending()
    // ...
}

// Bad: Returning interfaces hides what you actually provide
func NewOrderService() OrderProcessor {
    return &orderService{}
}

// Good: Accept interface, return struct
type OrderFinder interface {
    FindPending(ctx context.Context) ([]Order, error)
}

func ProcessOrders(ctx context.Context, finder OrderFinder) error {
    orders, err := finder.FindPending(ctx)
    if err != nil {
        return fmt.Errorf("finding pending orders: %w", err)
    }
    for _, order := range orders {
        if err := processOne(ctx, order); err != nil {
            return fmt.Errorf("processing order %s: %w", order.ID, err)
        }
    }
    return nil
}

// Good: Return concrete type - callers can see what they get
func NewOrderService(db *sql.DB, logger *slog.Logger) *OrderService {
    return &OrderService{db: db, logger: logger}
}
```

### Functional Options for Flexible Configuration

```go
// Bad: Config struct with unclear zero-value behavior
type ServerConfig struct {
    Port    int
    Timeout time.Duration
    TLS     bool
}

func NewServer(cfg ServerConfig) *Server { ... }
// What does Port=0 mean? Default? Random? Error?

// Good: Functional options with safe defaults
type Server struct {
    port    int
    timeout time.Duration
    tls     *tls.Config
}

type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithTLS(cfg *tls.Config) Option {
    return func(s *Server) { s.tls = cfg }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        port:    8080,          // Sensible default
        timeout: 30 * time.Second,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage: clear, self-documenting
srv := NewServer(
    WithPort(9090),
    WithTimeout(10 * time.Second),
)
```

---

## Error Handling

### Sentinel Errors for Expected Conditions

```go
// Good: Sentinel errors for conditions callers should check
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrConflict     = errors.New("conflict")
)

func (r *UserRepo) FindByID(ctx context.Context, id string) (User, error) {
    row := r.db.QueryRowContext(ctx, "SELECT ... WHERE id = $1", id)
    var u User
    if err := row.Scan(&u.ID, &u.Name, &u.Email); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return User{}, ErrNotFound
        }
        return User{}, fmt.Errorf("scanning user %s: %w", id, err)
    }
    return u, nil
}

// Caller checks with errors.Is
user, err := repo.FindByID(ctx, id)
if errors.Is(err, ErrNotFound) {
    http.Error(w, "User not found", http.StatusNotFound)
    return
}
if err != nil {
    http.Error(w, "Internal error", http.StatusInternalServerError)
    return
}
```

### Custom Error Types for Rich Context

```go
// Good: Custom error type when callers need structured information
type ValidationError struct {
    Field   string
    Message string
    Value   any
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s (got %v)", e.Field, e.Message, e.Value)
}

type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
    msgs := make([]string, len(ve))
    for i, e := range ve {
        msgs[i] = e.Error()
    }
    return strings.Join(msgs, "; ")
}

func ValidateOrder(o Order) error {
    var errs ValidationErrors
    if o.Quantity <= 0 {
        errs = append(errs, ValidationError{
            Field: "quantity", Message: "must be positive", Value: o.Quantity,
        })
    }
    if o.CustomerID == "" {
        errs = append(errs, ValidationError{
            Field: "customer_id", Message: "required", Value: o.CustomerID,
        })
    }
    if len(errs) > 0 {
        return errs
    }
    return nil
}

// Caller extracts structured errors
if err := ValidateOrder(order); err != nil {
    var ve ValidationErrors
    if errors.As(err, &ve) {
        for _, e := range ve {
            writeFieldError(w, e.Field, e.Message)
        }
        return
    }
    // Unexpected error
    http.Error(w, "Internal error", http.StatusInternalServerError)
}
```

### Error Wrapping Chain

Always add context when propagating errors. Use `%w` to enable `errors.Is` and `errors.As` up the call chain.

```go
// Bad: Losing context
func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderReq) error {
    user, err := s.users.FindByID(ctx, req.UserID)
    if err != nil {
        return err  // Caller gets "not found" with no idea what wasn't found
    }
    // ...
}

// Good: Add context at each layer
func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderReq) error {
    user, err := s.users.FindByID(ctx, req.UserID)
    if err != nil {
        return fmt.Errorf("creating order: finding user %s: %w", req.UserID, err)
    }

    order, err := s.repo.Save(ctx, newOrder(user, req))
    if err != nil {
        return fmt.Errorf("creating order: saving: %w", err)
    }

    if err := s.notify.OrderCreated(ctx, order); err != nil {
        // Non-critical: log but do not fail the order
        s.logger.Warn("failed to send order notification",
            "order_id", order.ID, "error", err)
    }

    return nil
}
```

---

## Concurrency Patterns

### Goroutines with errgroup

```go
// Bad: Manual goroutine management with error collection
func fetchAll(ctx context.Context, urls []string) ([]Response, error) {
    var mu sync.Mutex
    var results []Response
    var firstErr error
    var wg sync.WaitGroup

    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            resp, err := fetch(ctx, u)
            mu.Lock()
            defer mu.Unlock()
            if err != nil && firstErr == nil {
                firstErr = err
            }
            results = append(results, resp)
        }(url)
    }
    wg.Wait()
    return results, firstErr
}

// Good: errgroup handles synchronization and cancellation
func fetchAll(ctx context.Context, urls []string) ([]Response, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([]Response, len(urls))

    for i, url := range urls {
        i, url := i, url  // capture loop vars
        g.Go(func() error {
            resp, err := fetch(ctx, url)
            if err != nil {
                return fmt.Errorf("fetching %s: %w", url, err)
            }
            results[i] = resp  // Safe: each goroutine writes to its own index
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

### Bounded Concurrency with Semaphore

```go
// Good: Limit concurrent work with a semaphore channel
func processItems(ctx context.Context, items []Item, maxConcurrency int) error {
    g, ctx := errgroup.WithContext(ctx)
    sem := make(chan struct{}, maxConcurrency)

    for _, item := range items {
        item := item
        g.Go(func() error {
            select {
            case sem <- struct{}{}:
                defer func() { <-sem }()
            case <-ctx.Done():
                return ctx.Err()
            }
            return processItem(ctx, item)
        })
    }

    return g.Wait()
}
```

### Channel Patterns

```go
// Good: Fan-out / fan-in pattern
func fanOutFanIn(ctx context.Context, input <-chan Job, workers int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    // Fan-out: start N workers
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range input {
                select {
                case results <- process(job):
                case <-ctx.Done():
                    return
                }
            }
        }()
    }

    // Fan-in: close results when all workers done
    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}
```

---

## Testing Patterns

### Table-Driven Tests

```go
func TestParseAmount(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int64
        wantErr bool
    }{
        {name: "whole dollars", input: "$100", want: 10000},
        {name: "with cents", input: "$99.99", want: 9999},
        {name: "zero", input: "$0.00", want: 0},
        {name: "no dollar sign", input: "100", wantErr: true},
        {name: "negative", input: "-$50", wantErr: true},
        {name: "empty string", input: "", wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAmount(tt.input)
            if tt.wantErr {
                if err == nil {
                    t.Errorf("ParseAmount(%q) expected error, got %d", tt.input, got)
                }
                return
            }
            if err != nil {
                t.Fatalf("ParseAmount(%q) unexpected error: %v", tt.input, err)
            }
            if got != tt.want {
                t.Errorf("ParseAmount(%q) = %d, want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

### Test Helpers and Fixtures

```go
// Good: Helper that accepts testing.TB for use in tests and benchmarks
func setupTestDB(tb testing.TB) *sql.DB {
    tb.Helper()

    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        tb.Fatalf("opening test db: %v", err)
    }

    if _, err := db.Exec(schema); err != nil {
        tb.Fatalf("applying schema: %v", err)
    }

    tb.Cleanup(func() {
        db.Close()
    })

    return db
}

func TestUserRepository(t *testing.T) {
    db := setupTestDB(t)
    repo := NewUserRepository(db)

    t.Run("create and find", func(t *testing.T) {
        user := User{Name: "Alice", Email: "alice@example.com"}
        err := repo.Create(context.Background(), &user)
        if err != nil {
            t.Fatalf("creating user: %v", err)
        }

        found, err := repo.FindByID(context.Background(), user.ID)
        if err != nil {
            t.Fatalf("finding user: %v", err)
        }
        if found.Email != user.Email {
            t.Errorf("email = %q, want %q", found.Email, user.Email)
        }
    })
}
```

### Benchmarks

```go
func BenchmarkProcessOrder(b *testing.B) {
    order := generateTestOrder(100) // 100 items

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        if err := ProcessOrder(order); err != nil {
            b.Fatal(err)
        }
    }
}

// Sub-benchmarks for comparing approaches
func BenchmarkSort(b *testing.B) {
    sizes := []int{10, 100, 1000, 10000}
    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := generateRandomInts(size)
            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                sorted := make([]int, len(data))
                copy(sorted, data)
                sort.Ints(sorted)
            }
        })
    }
}
```

---

## Interface Design

### Small, Focused Interfaces

Go interfaces should be small. The standard library's `io.Reader` (1 method) is the gold standard.

```go
// Bad: Large interface - forces implementors to write unused methods
type UserStore interface {
    Create(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id string) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter UserFilter) ([]*User, error)
    Count(ctx context.Context) (int, error)
}

// Good: Small interfaces composed by consumers
type UserCreator interface {
    Create(ctx context.Context, user *User) error
}

type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

// Functions accept only what they need
func RegisterUser(ctx context.Context, creator UserCreator, req RegistrationReq) error {
    // Only needs Create - testable with minimal mock
    user := &User{Name: req.Name, Email: req.Email}
    return creator.Create(ctx, user)
}

// Compose when you need more
type UserService interface {
    UserCreator
    UserFinder
}
```

### Interface Embedding

```go
// Good: Embed interfaces to compose behavior
type ReadCloser interface {
    io.Reader
    io.Closer
}

// Good: Embed in structs to selectively override
type CountingWriter struct {
    io.Writer
    count int64
}

func (cw *CountingWriter) Write(p []byte) (int, error) {
    n, err := cw.Writer.Write(p)
    cw.count += int64(n)
    return n, err
}
```

---

## Package Design

### Package Naming and Organization

```
// Bad: Generic, stuttering names
package utils        // What kind of utils?
package common       // Common to what?
utils.StringUtils    // Stutter: utils.StringUtils

// Good: Purpose-driven package names
package httputil     // HTTP utilities
package orderservice // Order domain logic
httputil.NewRetryClient  // Clear: httputil.NewRetryClient

// Good: Package layout for a service
myservice/
  cmd/
    myservice/          # main package - wiring only
      main.go
  internal/
    order/              # Domain logic
      order.go
      service.go
      repository.go
    http/               # HTTP transport layer
      handler.go
      middleware.go
    postgres/            # Database implementation
      order_repo.go
```

### Avoid `init()` for Side Effects

```go
// Bad: init() creates hidden dependencies and ordering issues
var db *sql.DB

func init() {
    var err error
    db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)  // Hard crash during import
    }
}

// Good: Explicit initialization in main
func main() {
    db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatalf("connecting to database: %v", err)
    }
    defer db.Close()

    svc := order.NewService(db)
    handler := http.NewHandler(svc)
    // ... explicit wiring
}
```

---

## Anti-Patterns to Avoid

### Interface Pollution

Defining interfaces before you have multiple implementations is premature abstraction.

```go
// Bad: Interface defined alongside its only implementation
type OrderRepository interface { ... }
type orderRepository struct { ... }
// There's only one implementation - the interface adds noise

// Good: Define the interface where it's consumed
// In package "order" (consumer):
type Repository interface {
    FindByID(ctx context.Context, id string) (Order, error)
    Save(ctx context.Context, order Order) error
}

// In package "postgres" (provider):
type OrderRepo struct { db *sql.DB }
// Implicitly satisfies order.Repository
```

### Channel Overuse

Not every concurrent problem needs channels. Use the simplest synchronization primitive that works.

```go
// Bad: Channel used as a mutex
ch := make(chan struct{}, 1)
ch <- struct{}{} // "Lock"
// critical section
<-ch // "Unlock"

// Good: Just use a mutex
var mu sync.Mutex
mu.Lock()
// critical section
mu.Unlock()

// Good: Use channels for communication, mutexes for state protection
// Channel: passing data between goroutines
// Mutex: protecting shared data structures
// sync.Once: one-time initialization
// atomic: simple counters and flags
```

### Naked Returns in Long Functions

```go
// Bad: Naked returns in functions longer than a few lines
func processOrder(ctx context.Context, id string) (order Order, err error) {
    // ... 30 lines of code ...
    return  // What is being returned? Must read the whole function
}

// Good: Explicit returns
func processOrder(ctx context.Context, id string) (Order, error) {
    // ... 30 lines of code ...
    return order, nil  // Clear what's returned
}
```

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|------------|-------------|
| Accept interfaces, return structs | Function signatures | Decoupling without over-abstraction |
| Functional options | Constructors with many optional params | Self-documenting, extensible config |
| Sentinel errors | Expected failure conditions | Callers can branch with `errors.Is` |
| `fmt.Errorf("...: %w", err)` | Every error propagation point | Context chain for debugging |
| `errgroup.WithContext` | Multiple concurrent operations | Coordinated cancellation and errors |
| Semaphore channel | Bounding concurrent work | Backpressure without leaking goroutines |
| Table-driven tests | Any function with multiple cases | Exhaustive, easy to extend |
| Small interfaces (1-3 methods) | Defining dependencies | Minimal mocking, maximum flexibility |
| `t.Helper()` + `t.Cleanup()` | Test setup functions | Clean stack traces and teardown |
| Explicit `main()` wiring | Application startup | No hidden `init()` side effects |

{{#if project_uses_grpc}}
> **gRPC Note**: When using gRPC, define service interfaces in `.proto` files and let the generated code provide the interface. Your implementations satisfy the generated interfaces without additional abstraction layers.
{{/if}}

{{#if project_uses_chi}}
> **Chi Router Note**: Chi's middleware pattern aligns with the functional options approach. Prefer `r.Use()` for cross-cutting middleware and `r.With()` for route-specific middleware chains.
{{/if}}
