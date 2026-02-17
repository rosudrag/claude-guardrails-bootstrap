# C# / .NET Patterns

Deep patterns for modern C# and ASP.NET Core applications. Supplements the universal code quality guide with .NET-specific idioms for middleware, EF Core, and testing.

---

## Modern C# Features

### Nullable Reference Types

Enable nullable reference types project-wide and make nullability explicit in every signature. Treat compiler warnings as errors.

```csharp
// Bad: Ignoring nullability - runtime surprises
public class UserService
{
    public string GetDisplayName(int userId)
    {
        var user = _repo.Find(userId); // Returns User? but treated as User
        return user.FirstName + " " + user.LastName; // NullReferenceException
    }
}

// Good: Explicit null handling at boundaries
public class UserService
{
    public string GetDisplayName(int userId)
    {
        var user = _repo.Find(userId)
            ?? throw new UserNotFoundException(userId);

        return $"{user.FirstName} {user.LastName}";
    }

    public string? TryGetDisplayName(int userId)
    {
        var user = _repo.Find(userId);
        return user is not null
            ? $"{user.FirstName} {user.LastName}"
            : null;
    }
}
```

### Records for Immutable Data

Records provide value equality, immutability, and `with` expressions for concise domain modeling.

```csharp
// Good: Record for value objects
public record Money(decimal Amount, string Currency = "USD")
{
    public Money { // Positional record with validation
        if (Amount < 0) throw new ArgumentException("Amount cannot be negative", nameof(Amount));
        Currency = Currency.ToUpperInvariant();
    }

    public static Money Zero(string currency = "USD") => new(0, currency);

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot add {Currency} and {other.Currency}");
        return this with { Amount = Amount + other.Amount };
    }
}

// Good: Record for DTOs
public record CreateOrderRequest(
    [Required] string CustomerId,
    [MinLength(1)] List<OrderItemRequest> Items,
    string? Notes = null
);

public record OrderResponse(
    string Id,
    string CustomerId,
    OrderStatus Status,
    decimal Total,
    DateTimeOffset CreatedAt
)
{
    public static OrderResponse From(Order order) => new(
        order.Id,
        order.CustomerId,
        order.Status,
        order.Total,
        order.CreatedAt
    );
}
```

### Pattern Matching

```csharp
// Bad: Nested if/else chains
public decimal CalculateDiscount(Customer customer, Order order)
{
    if (customer.Tier == CustomerTier.Gold)
    {
        if (order.Total > 100)
            return 0.15m;
        else
            return 0.10m;
    }
    else if (customer.Tier == CustomerTier.Silver)
    {
        return 0.05m;
    }
    return 0m;
}

// Good: Switch expression with pattern matching
public decimal CalculateDiscount(Customer customer, Order order) => customer.Tier switch
{
    CustomerTier.Gold when order.Total > 100 => 0.15m,
    CustomerTier.Gold => 0.10m,
    CustomerTier.Silver => 0.05m,
    CustomerTier.Bronze => 0.02m,
    _ => 0m,
};

// Good: Property patterns for complex matching
public string DescribeOrder(Order order) => order switch
{
    { Status: OrderStatus.Cancelled } => "This order was cancelled",
    { Status: OrderStatus.Shipped, TrackingNumber: not null } track =>
        $"Shipped - tracking: {track.TrackingNumber}",
    { Status: OrderStatus.Shipped } => "Shipped - tracking pending",
    { Items.Count: 0 } => "Empty order",
    { Total: > 1000 } => "High-value order",
    _ => "Standard order",
};
```

### Primary Constructors (C# 12)

```csharp
// Good: Primary constructor for DI in services
public class OrderService(
    IOrderRepository orderRepo,
    IInventoryService inventoryService,
    ILogger<OrderService> logger)
{
    public async Task<Order> CreateOrderAsync(
        string userId, CreateOrderRequest request, CancellationToken ct)
    {
        logger.LogInformation("Creating order for user {UserId}", userId);

        await inventoryService.ReserveAsync(request.Items, ct);

        var order = Order.Create(userId, request.Items);
        await orderRepo.SaveAsync(order, ct);

        return order;
    }
}

// Good: Primary constructor for records with behavior
public record OrderSummary(string Id, decimal Total, int ItemCount)
{
    public string Display => $"Order {Id}: {ItemCount} items, {Total:C}";
}
```

---

## ASP.NET Core Patterns

### Middleware Pipeline

Middleware order matters. Place exception handling first, authentication early, and endpoint-specific concerns last.

```csharp
// Good: Middleware ordered correctly
var app = builder.Build();

app.UseExceptionHandler("/error");          // 1. Catch everything
app.UseHsts();                              // 2. Security headers

app.UseRouting();                           // 3. Route matching

app.UseAuthentication();                    // 4. Who are you?
app.UseAuthorization();                     // 5. Are you allowed?

app.UseRateLimiter();                       // 6. Throttling

app.MapControllers();                       // 7. Endpoint execution

// Good: Custom middleware
public class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            logger.LogInformation(
                "Request {Method} {Path} completed in {ElapsedMs}ms with status {StatusCode}",
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds,
                context.Response.StatusCode);
        }
    }
}
```

### Minimal APIs with Typed Results

```csharp
// Good: Minimal API with validation and typed results
app.MapPost("/api/orders", async (
    [FromBody] CreateOrderRequest request,
    IValidator<CreateOrderRequest> validator,
    OrderService orderService,
    ClaimsPrincipal user,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }

    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? return Results.Unauthorized();

    try
    {
        var order = await orderService.CreateOrderAsync(userId, request, ct);
        return Results.Created($"/api/orders/{order.Id}", OrderResponse.From(order));
    }
    catch (InsufficientInventoryException ex)
    {
        return Results.Conflict(new { message = ex.Message });
    }
});

// Good: Organize endpoints with extension methods
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/orders")
            .RequireAuthorization()
            .WithTags("Orders");

        group.MapGet("/", GetOrders);
        group.MapGet("/{id}", GetOrderById);
        group.MapPost("/", CreateOrder);
        group.MapPut("/{id}/cancel", CancelOrder);

        return routes;
    }

    private static async Task<IResult> GetOrders(...) { ... }
    private static async Task<IResult> CreateOrder(...) { ... }
}
```

### Dependency Injection Lifetimes

```csharp
// Good: Choose the correct lifetime for each service
builder.Services.AddSingleton<ISystemClock, SystemClock>();           // Stateless, thread-safe
builder.Services.AddScoped<IOrderRepository, OrderRepository>();      // Per-request, DB context
builder.Services.AddTransient<IValidator<CreateOrderRequest>,         // Lightweight, no state
    CreateOrderRequestValidator>();

// Good: Keyed services (C# 8 / .NET 8+)
builder.Services.AddKeyedSingleton<IStorageService, LocalStorageService>("local");
builder.Services.AddKeyedSingleton<IStorageService, S3StorageService>("s3");

public class DocumentService([FromKeyedServices("s3")] IStorageService storage)
{
    // Injects the S3 implementation specifically
}

// Bad: Captive dependency - scoped service in singleton
builder.Services.AddSingleton<OrderProcessor>();   // Singleton
builder.Services.AddScoped<IOrderRepository>();    // Scoped
// OrderProcessor will hold a stale repository across requests!

// Good: Use IServiceScopeFactory to resolve scoped from singleton
public class BackgroundOrderProcessor(IServiceScopeFactory scopeFactory)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
            await ProcessPendingOrders(repo, ct);
            await Task.Delay(TimeSpan.FromSeconds(30), ct);
        }
    }
}
```

---

## EF Core Patterns

### Query Optimization

```csharp
// Bad: Loading everything then filtering in memory
public async Task<List<OrderResponse>> GetRecentOrders(string userId)
{
    var allOrders = await _context.Orders.ToListAsync(); // Loads entire table
    return allOrders
        .Where(o => o.UserId == userId)
        .OrderByDescending(o => o.CreatedAt)
        .Take(10)
        .Select(o => OrderResponse.From(o))
        .ToList();
}

// Good: Let the database do the work
public async Task<List<OrderResponse>> GetRecentOrders(
    string userId, CancellationToken ct)
{
    return await _context.Orders
        .Where(o => o.UserId == userId)
        .OrderByDescending(o => o.CreatedAt)
        .Take(10)
        .Select(o => new OrderResponse(   // Projection in query - only fetches needed columns
            o.Id,
            o.UserId,
            o.Status,
            o.Total,
            o.CreatedAt))
        .AsNoTracking()                    // Read-only - skip change tracking overhead
        .ToListAsync(ct);
}

// Good: Explicit includes to prevent N+1
public async Task<Order?> GetOrderWithItems(string orderId, CancellationToken ct)
{
    return await _context.Orders
        .Include(o => o.Items)
            .ThenInclude(i => i.Product)
        .FirstOrDefaultAsync(o => o.Id == orderId, ct);
}

// Good: Split queries for multiple collections to avoid cartesian explosion
public async Task<Order?> GetOrderFull(string orderId, CancellationToken ct)
{
    return await _context.Orders
        .Include(o => o.Items)
        .Include(o => o.StatusHistory)
        .AsSplitQuery()                    // Separate SQL per collection
        .FirstOrDefaultAsync(o => o.Id == orderId, ct);
}
```

### Migrations Best Practices

```csharp
// Good: Named, purposeful migration
// dotnet ef migrations add AddOrderStatusIndex

public partial class AddOrderStatusIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_Orders_Status_CreatedAt",
            table: "Orders",
            columns: new[] { "Status", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Orders_Status_CreatedAt",
            table: "Orders");
    }
}

// Good: Seed data in migrations for reference data
migrationBuilder.InsertData(
    table: "OrderStatuses",
    columns: new[] { "Id", "Name" },
    values: new object[,]
    {
        { 1, "Pending" },
        { 2, "Confirmed" },
        { 3, "Shipped" },
        { 4, "Delivered" },
        { 5, "Cancelled" },
    });
```

### Change Tracking Awareness

```csharp
// Bad: Modifying untracked entity then expecting SaveChanges to work
public async Task UpdateUserEmail(string userId, string newEmail, CancellationToken ct)
{
    var user = await _context.Users.AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == userId, ct);
    user!.Email = newEmail;
    await _context.SaveChangesAsync(ct); // Nothing happens - entity is untracked
}

// Good: Track the entity or use ExecuteUpdate
public async Task UpdateUserEmail(string userId, string newEmail, CancellationToken ct)
{
    // Option 1: Tracked entity
    var user = await _context.Users.FindAsync(new object[] { userId }, ct)
        ?? throw new UserNotFoundException(userId);
    user.Email = newEmail;
    await _context.SaveChangesAsync(ct);

    // Option 2: Bulk update without loading entity (EF Core 7+)
    await _context.Users
        .Where(u => u.Id == userId)
        .ExecuteUpdateAsync(s => s.SetProperty(u => u.Email, newEmail), ct);
}
```

---

## Testing Patterns

### xUnit with FluentAssertions

```csharp
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _repoMock = new();
    private readonly Mock<IInventoryService> _inventoryMock = new();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(
            _repoMock.Object,
            _inventoryMock.Object,
            NullLogger<OrderService>.Instance);
    }

    [Fact]
    public async Task CreateOrder_WithValidItems_ReservesInventoryAndSaves()
    {
        // Arrange
        var request = new CreateOrderRequest("cust-1",
            [new OrderItemRequest("SKU-1", 2)]);

        _repoMock
            .Setup(r => r.SaveAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        // Act
        var result = await _sut.CreateOrderAsync("user-1", request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(OrderStatus.Pending);
        result.Items.Should().HaveCount(1);

        _inventoryMock.Verify(
            i => i.ReserveAsync(request.Items, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateOrder_WhenInventoryUnavailable_ThrowsAndDoesNotSave()
    {
        var request = new CreateOrderRequest("cust-1",
            [new OrderItemRequest("SKU-1", 999)]);

        _inventoryMock
            .Setup(i => i.ReserveAsync(It.IsAny<IReadOnlyList<OrderItemRequest>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InsufficientInventoryException("SKU-1"));

        // Act & Assert
        await _sut.Invoking(s => s.CreateOrderAsync("user-1", request, CancellationToken.None))
            .Should().ThrowAsync<InsufficientInventoryException>()
            .WithMessage("*SKU-1*");

        _repoMock.Verify(
            r => r.SaveAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
```

### WebApplicationFactory for Integration Tests

```csharp
public class OrderApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                // Replace real DB with in-memory for speed
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseInMemoryDatabase("TestDb"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task CreateOrder_Returns201WithLocation()
    {
        var request = new CreateOrderRequest("cust-1",
            [new("SKU-1", 2)]);

        var response = await _client.PostAsJsonAsync("/api/orders", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();
        order.Should().NotBeNull();
        order!.Status.Should().Be(OrderStatus.Pending);
    }

    [Fact]
    public async Task CreateOrder_WithEmptyItems_Returns400()
    {
        var request = new CreateOrderRequest("cust-1", []);

        var response = await _client.PostAsJsonAsync("/api/orders", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```

### Theory Tests for Data-Driven Scenarios

```csharp
[Theory]
[InlineData("", false)]
[InlineData("a", false)]
[InlineData("abc@", false)]
[InlineData("@domain.com", false)]
[InlineData("user@domain.com", true)]
[InlineData("user+tag@domain.com", true)]
public void ValidateEmail_ReturnsExpectedResult(string email, bool expected)
{
    var result = EmailValidator.IsValid(email);

    result.Should().Be(expected, because: $"'{email}' should be {(expected ? "valid" : "invalid")}");
}
```

---

## Anti-Patterns to Avoid

### Async Void

`async void` methods cannot be awaited and swallow exceptions. They should only be used for event handlers in UI frameworks.

```csharp
// Bad: async void - exception is lost, caller cannot await
public async void ProcessOrderAsync(Order order)
{
    await _repo.SaveAsync(order); // If this throws, the app may crash silently
}

// Good: async Task - caller can await and handle errors
public async Task ProcessOrderAsync(Order order, CancellationToken ct)
{
    await _repo.SaveAsync(order, ct);
}
```

### Disposing Issues

```csharp
// Bad: Manual dispose that misses exception paths
public async Task<string> ReadConfigAsync(string path)
{
    var stream = File.OpenRead(path);
    var reader = new StreamReader(stream);
    var content = await reader.ReadToEndAsync();
    reader.Dispose(); // Skipped if ReadToEndAsync throws
    stream.Dispose();
    return content;
}

// Good: await using for async disposal
public async Task<string> ReadConfigAsync(string path, CancellationToken ct)
{
    await using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    return await reader.ReadToEndAsync(ct);
    // Both disposed even if an exception occurs
}

// Bad: Resolving IDisposable from DI and disposing it yourself
public class OrderService
{
    public void Process()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Dispose(); // DO NOT - the scope manages this lifetime
    }
}
```

### Over-Abstraction

```csharp
// Bad: Abstraction layers that add no value
public interface IOrderRepository { ... }
public class OrderRepository : IOrderRepository { ... }
public interface IOrderRepositoryFactory { ... }
public class OrderRepositoryFactory : IOrderRepositoryFactory { ... }
public interface IOrderService { ... }
public class OrderService : IOrderService { ... }
public interface IOrderServiceFacade { ... }
public class OrderServiceFacade : IOrderServiceFacade { ... }
// 8 types to accomplish what 2 could do

// Good: Interfaces only where you need substitutability
public interface IOrderRepository { ... }  // Needed: swapped in tests
public class OrderRepository : IOrderRepository { ... }
public class OrderService { ... }  // No interface needed if only one implementation
// Add interface later when a second implementation appears
```

### Blocking on Async Code

```csharp
// Bad: .Result and .Wait() cause deadlocks
public Order GetOrder(string id)
{
    return GetOrderAsync(id).Result; // Deadlock in ASP.NET and UI contexts
}

// Bad: GetAwaiter().GetResult() is marginally better but still dangerous
public Order GetOrder(string id)
{
    return GetOrderAsync(id).GetAwaiter().GetResult();
}

// Good: Async all the way
public async Task<Order> GetOrderAsync(string id, CancellationToken ct)
{
    return await _repo.FindByIdAsync(id, ct)
        ?? throw new OrderNotFoundException(id);
}

// If you truly must call async from sync (rare, document why):
public Order GetOrderBlocking(string id)
{
    // Only acceptable in console apps or background services with no SynchronizationContext
    return Task.Run(() => GetOrderAsync(id, CancellationToken.None)).GetAwaiter().GetResult();
}
```

### Missing CancellationToken Propagation

```csharp
// Bad: Ignoring cancellation - request completes even after client disconnects
public async Task<List<Order>> SearchOrdersAsync(string query)
{
    var orders = await _context.Orders
        .Where(o => o.Description.Contains(query))
        .ToListAsync(); // No cancellation token
    return orders;
}

// Good: Thread CancellationToken through the entire chain
public async Task<List<Order>> SearchOrdersAsync(
    string query, CancellationToken ct)
{
    return await _context.Orders
        .Where(o => o.Description.Contains(query))
        .ToListAsync(ct);
}

// Controller receives it automatically
[HttpGet("search")]
public async Task<IActionResult> Search(
    [FromQuery] string query, CancellationToken ct)
{
    var results = await _orderService.SearchOrdersAsync(query, ct);
    return Ok(results);
}
```

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|------------|-------------|
| Nullable reference types | Always (project-wide) | Compile-time null safety |
| Records | DTOs, value objects, API models | Immutability, value equality, `with` expressions |
| Pattern matching switch | Multi-branch conditionals | Exhaustive, readable, no casting |
| Primary constructors | DI in services and controllers | Reduced boilerplate |
| Minimal APIs with groups | Simple CRUD endpoints | Less ceremony than controllers |
| `AsNoTracking()` | Read-only EF Core queries | Reduced memory and CPU overhead |
| `ExecuteUpdateAsync` | Bulk updates without loading | Single SQL statement |
| `AsSplitQuery()` | Multiple collection includes | Avoids cartesian explosion |
| `WebApplicationFactory` | Integration tests | Real HTTP pipeline, swappable services |
| FluentAssertions | All test assertions | Readable, descriptive failure messages |

{{#if project_uses_blazor}}
> **Blazor Note**: In Blazor Server, be cautious with scoped services since the circuit lifetime differs from HTTP request lifetime. Use `OwningComponentBase` for components that need their own scope. In Blazor WASM, all services are effectively singletons.
{{/if}}

{{#if project_uses_mediatr}}
> **MediatR Note**: When using MediatR, the patterns here still apply within handlers. Keep handlers thin - they should coordinate domain objects, not contain business logic themselves. Use pipeline behaviors for cross-cutting concerns like validation and logging.
{{/if}}
