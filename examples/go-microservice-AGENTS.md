# Payment Service

Go microservice handling payment processing, reconciliation, and webhook delivery.

## Commands

| Task | Command |
|------|---------|
| Build | `go build ./cmd/server` |
| Test | `go test ./... -count=1` |
| Test + coverage | `go test ./... -coverprofile=coverage.out -count=1` |
| Lint | `golangci-lint run` |
| Vet | `go vet ./...` |
| Run | `go run ./cmd/server` |
| Migrate | `migrate -path migrations -database "$DATABASE_URL" up` |

## Critical Rules (NEVER VIOLATE)

| Rule | Details |
|------|---------|
| **TDD Mandatory** | RED → GREEN → REFACTOR. Test first, always. |
| **Research First** | Never guess behavior - verify before coding. |
| **No Hardcoded Secrets** | Use env vars loaded in `config/`, never string literals. |
| **Context Propagation** | `ctx context.Context` is always the first parameter, propagated through all layers. |
| **No Global State** | No `init()` functions, no package-level mutable variables. Pass deps via constructors. |

## Doc Lookup

| Need to... | Read |
|------------|------|
| Write tests / TDD workflow | [tdd-enforcement.md](./ai-docs/tdd-enforcement.md) |
| Debug / iterate on problem | [iterative-problem-solving.md](./ai-docs/iterative-problem-solving.md) |
| Ensure code quality | [code-quality.md](./ai-docs/code-quality.md) |
| Secure sensitive data | [security.md](./ai-docs/security.md) |
| Verify before PR | [verification.md](./ai-docs/verification.md) |

## Key Paths

| Component | Path |
|-----------|------|
| Entrypoint | `cmd/server/main.go` |
| Domain types | `internal/domain/` |
| Business logic | `internal/service/` |
| Data access | `internal/repository/` |
| gRPC handlers | `internal/handler/grpc/` |
| REST handlers | `internal/handler/rest/` |
| Config | `internal/config/` |
| Protobuf defs | `proto/` |
| SQL queries | `queries/` |
| Migrations | `migrations/` |
| Docs | `ai-docs/` |

## Architecture

Handler (gRPC/REST) → Service → Repository → PostgreSQL (via sqlc)

Clean architecture layers:
- **domain/** - Entities, interfaces, sentinel errors (zero dependencies)
- **service/** - Business logic, orchestration
- **repository/** - Data access via sqlc-generated code
- **handler/** - Transport layer (gRPC + REST gateway)

## Key Patterns

### Error Handling

```go
// Sentinel errors in domain/errors.go
var (
    ErrPaymentNotFound = errors.New("payment not found")
    ErrInvalidAmount   = errors.New("invalid payment amount")
    ErrDuplicateKey    = errors.New("idempotency key already used")
)

// Wrap with context at every level
func (s *PaymentService) Process(ctx context.Context, req ProcessRequest) (*Payment, error) {
    existing, err := s.repo.FindByIdempotencyKey(ctx, req.IdempotencyKey)
    if err != nil && !errors.Is(err, domain.ErrPaymentNotFound) {
        return nil, fmt.Errorf("checking idempotency: %w", err)
    }
    if existing != nil {
        return existing, nil
    }
    // ...
}
```

### Dependency Injection

```go
type PaymentService struct {
    repo     domain.PaymentRepository
    gateway  domain.PaymentGateway
    logger   *slog.Logger
}

func NewPaymentService(
    repo domain.PaymentRepository,
    gateway domain.PaymentGateway,
    logger *slog.Logger,
) *PaymentService {
    return &PaymentService{repo: repo, gateway: gateway, logger: logger}
}
```

### Table-Driven Tests

```go
func TestPaymentService_Process(t *testing.T) {
    tests := []struct {
        name    string
        req     ProcessRequest
        setup   func(*MockRepo, *MockGateway)
        wantErr error
    }{
        {
            name: "valid payment",
            req:  ProcessRequest{Amount: 1000, Currency: "usd", IdempotencyKey: "key-1"},
            setup: func(r *MockRepo, g *MockGateway) {
                r.On("FindByIdempotencyKey", mock.Anything, "key-1").Return(nil, domain.ErrPaymentNotFound)
                g.On("Charge", mock.Anything, mock.Anything).Return(&ChargeResult{ID: "ch_123"}, nil)
                r.On("Create", mock.Anything, mock.Anything).Return(nil)
            },
        },
        {
            name: "duplicate idempotency key",
            req:  ProcessRequest{IdempotencyKey: "key-dup"},
            setup: func(r *MockRepo, g *MockGateway) {
                r.On("FindByIdempotencyKey", mock.Anything, "key-dup").Return(&domain.Payment{}, nil)
            },
        },
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            repo, gateway := new(MockRepo), new(MockGateway)
            tt.setup(repo, gateway)
            svc := NewPaymentService(repo, gateway, slog.Default())
            _, err := svc.Process(context.Background(), tt.req)
            if tt.wantErr != nil {
                assert.ErrorIs(t, err, tt.wantErr)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Environment Variables

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/payments?sslmode=disable
GRPC_PORT=50051
REST_PORT=8080
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
LOG_LEVEL=info
```

## Commits

50/72 rule. Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
