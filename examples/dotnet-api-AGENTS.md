# Contoso API

ASP.NET Core Web API for managing customer orders, inventory, and reporting.

## Commands

| Task | Command |
|------|---------|
| Build | `dotnet build` |
| Test | `dotnet test` |
| Run | `dotnet run --project src/Contoso.Api` |
| Migrations | `dotnet ef migrations add <Name> --project src/Contoso.Infrastructure` |
| Format | `dotnet format --verify-no-changes` |

## Critical Rules (NEVER VIOLATE)

| Rule | Details |
|------|---------|
| **TDD Mandatory** | RED → GREEN → REFACTOR. Test first, always. |
| **Research First** | Never guess behavior - verify before coding. |
| **No Hardcoded Secrets** | Use `IConfiguration` / `IOptions<T>`, never string literals. |
| **EF Migrations Only** | Never modify the database directly. Use `dotnet ef` for all schema changes. |
| **Repository Pattern** | All data access goes through repositories. No `DbContext` in controllers or services. |

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
| API controllers | `src/Contoso.Api/Controllers/` |
| Application services | `src/Contoso.Application/Services/` |
| Domain entities | `src/Contoso.Domain/Entities/` |
| Repositories | `src/Contoso.Infrastructure/Repositories/` |
| EF DbContext | `src/Contoso.Infrastructure/Data/AppDbContext.cs` |
| Migrations | `src/Contoso.Infrastructure/Migrations/` |
| Unit tests | `tests/Contoso.Application.Tests/` |
| Integration tests | `tests/Contoso.Api.Tests/` |
| Docs | `ai-docs/` |

## Architecture

Controller → Service (Application) → Repository (Infrastructure) → EF Core → PostgreSQL

Clean Architecture with four projects:
- **Contoso.Domain** - Entities, value objects, interfaces (no dependencies)
- **Contoso.Application** - Business logic, DTOs, service interfaces
- **Contoso.Infrastructure** - EF Core, repositories, external services
- **Contoso.Api** - Controllers, middleware, DI configuration

## Key Patterns

### Service Layer

```csharp
public class OrderService : IOrderService
{
    private readonly IOrderRepository _orders;
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;

    public OrderService(
        IOrderRepository orders,
        IProductRepository products,
        IUnitOfWork unitOfWork)
    {
        _orders = orders;
        _products = products;
        _unitOfWork = unitOfWork;
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request)
    {
        var product = await _products.GetByIdAsync(request.ProductId)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);

        if (product.Stock < request.Quantity)
            throw new InsufficientStockException(product.Id, request.Quantity);

        var order = Order.Create(request.CustomerId, product, request.Quantity);
        product.ReserveStock(request.Quantity);

        _orders.Add(order);
        await _unitOfWork.SaveChangesAsync();

        return OrderDto.From(order);
    }
}
```

### Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
        => _orderService = orderService;

    [HttpPost]
    [ProducesResponseType<OrderDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(CreateOrderRequest request)
    {
        var order = await _orderService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }
}
```

### Test Pattern

```csharp
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _orderRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(
            _orderRepo.Object, _productRepo.Object, _unitOfWork.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidRequest_ReturnsOrder()
    {
        var product = new Product("Widget", 9.99m, stock: 10);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id))
            .ReturnsAsync(product);

        var result = await _sut.CreateAsync(new CreateOrderRequest
        {
            CustomerId = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = 2
        });

        Assert.Equal(19.98m, result.Total);
        _unitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithInsufficientStock_Throws()
    {
        var product = new Product("Widget", 9.99m, stock: 0);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id))
            .ReturnsAsync(product);

        await Assert.ThrowsAsync<InsufficientStockException>(() =>
            _sut.CreateAsync(new CreateOrderRequest
            {
                ProductId = product.Id,
                Quantity = 1
            }));
    }
}
```

## Environment Variables

```bash
# Database
ConnectionStrings__DefaultConnection=Host=localhost;Database=contoso;Username=postgres;Password=

# JWT
Jwt__Secret=
Jwt__Issuer=contoso-api
Jwt__ExpiryMinutes=60

# App
ASPNETCORE_ENVIRONMENT=Development
```

## Commits

50/72 rule. Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
