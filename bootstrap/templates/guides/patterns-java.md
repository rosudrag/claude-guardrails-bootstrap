# Java / Spring Boot Patterns

Deep patterns for modern Java and Spring Boot applications. Supplements the universal code quality guide with JVM-specific idioms, DI patterns, and JPA best practices.

---

## Modern Java Features

### Records for Immutable Data

Records replace verbose POJOs for value types. Use them for DTOs, events, and any object defined solely by its data.

```java
// Bad: 60 lines of boilerplate for a simple value class
public class CreateUserRequest {
    private final String email;
    private final String name;

    public CreateUserRequest(String email, String name) {
        this.email = email;
        this.name = name;
    }

    public String getEmail() { return email; }
    public String getName() { return name; }
    // equals, hashCode, toString...
}

// Good: Record does it all in one line
public record CreateUserRequest(
    @NotBlank String email,
    @NotBlank @Size(max = 100) String name
) {}

// Good: Record with validation in compact constructor
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative: " + amount);
        }
        Objects.requireNonNull(currency, "Currency required");
        currency = currency.toUpperCase();
    }
}

// Good: Records as return types from queries
public record OrderSummary(String orderId, String customerName, BigDecimal total) {}
```

### Sealed Classes for Domain Modeling

Sealed classes restrict which classes can extend them, enabling exhaustive `switch` expressions.

```java
// Good: Sealed hierarchy for payment methods
public sealed interface PaymentMethod
    permits CreditCard, BankTransfer, DigitalWallet {
}

public record CreditCard(String number, String expiry, String cvv) implements PaymentMethod {}
public record BankTransfer(String iban, String bic) implements PaymentMethod {}
public record DigitalWallet(String provider, String token) implements PaymentMethod {}

// Good: Exhaustive pattern matching (Java 21+)
public BigDecimal calculateFee(PaymentMethod method) {
    return switch (method) {
        case CreditCard cc -> cc.number().startsWith("4")
            ? new BigDecimal("0.029")  // Visa rate
            : new BigDecimal("0.032"); // Other cards
        case BankTransfer bt -> new BigDecimal("0.005");
        case DigitalWallet dw -> new BigDecimal("0.015");
        // Compiler error if a permitted type is missing
    };
}
```

### Pattern Matching for Cleaner Conditionals

```java
// Bad: instanceof chain with manual casting
public String describe(Object obj) {
    if (obj instanceof String) {
        String s = (String) obj;
        return "String of length " + s.length();
    } else if (obj instanceof List) {
        List<?> list = (List<?>) obj;
        return "List of size " + list.size();
    }
    return "Unknown: " + obj.getClass().getName();
}

// Good: Pattern matching with instanceof (Java 16+)
public String describe(Object obj) {
    if (obj instanceof String s) {
        return "String of length " + s.length();
    }
    if (obj instanceof List<?> list) {
        return "List of size " + list.size();
    }
    return "Unknown: " + obj.getClass().getName();
}

// Good: Switch expressions with pattern matching (Java 21+)
public String describe(Object obj) {
    return switch (obj) {
        case String s    -> "String of length " + s.length();
        case Integer i   -> "Integer: " + i;
        case List<?> l   -> "List of size " + l.size();
        case null        -> "null";
        default          -> "Unknown: " + obj.getClass().getName();
    };
}
```

### Virtual Threads for Scalable I/O

```java
// Good: Virtual threads for I/O-bound work (Java 21+)
public List<UserProfile> fetchAllProfiles(List<String> userIds) throws Exception {
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<UserProfile>> futures = userIds.stream()
            .map(id -> executor.submit(() -> fetchProfile(id)))
            .toList();

        List<UserProfile> profiles = new ArrayList<>();
        for (var future : futures) {
            profiles.add(future.get());
        }
        return profiles;
    }
}

// Good: Structured concurrency (Java 21+ preview)
public OrderWithDetails loadOrder(String orderId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var orderTask = scope.fork(() -> orderRepo.findById(orderId));
        var itemsTask = scope.fork(() -> itemRepo.findByOrderId(orderId));
        var customerTask = scope.fork(() -> customerRepo.findById(orderId));

        scope.join().throwIfFailed();

        return new OrderWithDetails(
            orderTask.get(), itemsTask.get(), customerTask.get()
        );
    }
}
```

---

## Spring Boot Patterns

### Layered Architecture

```
Controller  -> handles HTTP, validation, response mapping
Service     -> business logic, transaction boundaries
Repository  -> data access, queries
```

```java
// Good: Controller is thin - delegates to service
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserPrincipal user) {

        Order order = orderService.createOrder(user.getId(), request);
        return ResponseEntity
            .created(URI.create("/api/orders/" + order.getId()))
            .body(OrderResponse.from(order));
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal user) {

        Order order = orderService.getOrder(id, user.getId());
        return OrderResponse.from(order);
    }
}

// Good: Service contains business logic and transaction boundaries
@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepo;
    private final InventoryService inventoryService;
    private final EventPublisher eventPublisher;

    @Transactional
    public Order createOrder(String userId, CreateOrderRequest request) {
        inventoryService.reserve(request.items());

        Order order = Order.create(userId, request.items());
        order = orderRepo.save(order);

        eventPublisher.publish(new OrderCreatedEvent(order));
        return order;
    }

    public Order getOrder(String orderId, String userId) {
        return orderRepo.findById(orderId)
            .filter(o -> o.getUserId().equals(userId))
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }
}
```

### Constructor Injection (Always)

```java
// Bad: Field injection - untestable, hides dependencies
@Service
public class NotificationService {
    @Autowired
    private EmailClient emailClient;
    @Autowired
    private TemplateEngine templateEngine;
}

// Good: Constructor injection - explicit, testable
@Service
public class NotificationService {

    private final EmailClient emailClient;
    private final TemplateEngine templateEngine;

    public NotificationService(EmailClient emailClient, TemplateEngine templateEngine) {
        this.emailClient = emailClient;
        this.templateEngine = templateEngine;
    }
}

// Testing is straightforward
@Test
void shouldSendWelcomeEmail() {
    var emailClient = mock(EmailClient.class);
    var templateEngine = mock(TemplateEngine.class);
    var service = new NotificationService(emailClient, templateEngine);

    service.sendWelcome(testUser);

    verify(emailClient).send(argThat(email ->
        email.to().equals(testUser.email()) &&
        email.subject().contains("Welcome")
    ));
}
```

### Profiles and Configuration

```java
// Good: Type-safe configuration with validation
@Configuration
@ConfigurationProperties(prefix = "app.payment")
@Validated
public record PaymentConfig(
    @NotBlank String apiKey,
    @NotBlank String apiUrl,
    @Min(1) @Max(10) int maxRetries,
    @NotNull Duration timeout
) {}

// Good: Profile-specific beans
@Configuration
public class StorageConfig {

    @Bean
    @Profile("local")
    public StorageService localStorage() {
        return new FileSystemStorageService(Path.of("/tmp/uploads"));
    }

    @Bean
    @Profile("!local")
    public StorageService cloudStorage(CloudConfig config) {
        return new S3StorageService(config);
    }
}
```

---

## JPA / Hibernate Patterns

### N+1 Query Prevention

```java
// Bad: N+1 - one query per order's items
@Entity
public class Order {
    @OneToMany(mappedBy = "order")
    private List<OrderItem> items;  // Lazy by default - triggers query per access
}

// Somewhere in service code:
List<Order> orders = orderRepo.findAll();
for (Order order : orders) {
    order.getItems().size();  // N additional queries
}

// Good: Fetch join in repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.status = :status")
    List<Order> findByStatusWithItems(@Param("status") OrderStatus status);
}

// Good: Entity graph for flexible fetching
@Entity
@NamedEntityGraph(
    name = "Order.withItemsAndCustomer",
    attributeNodes = {
        @NamedAttributeNode("items"),
        @NamedAttributeNode("customer")
    }
)
public class Order { ... }

@EntityGraph("Order.withItemsAndCustomer")
List<Order> findByStatus(OrderStatus status);
```

### Projections for Read-Only Queries

```java
// Bad: Loading full entity when you only need two fields
List<Order> orders = orderRepo.findAll();
orders.stream().map(o -> o.getId() + ": " + o.getTotal());
// Loads ALL columns, ALL lazy associations initialized on access

// Good: Interface projection
public interface OrderSummaryView {
    String getId();
    BigDecimal getTotal();
    String getCustomerName();
}

List<OrderSummaryView> findByStatus(OrderStatus status);

// Good: Record projection with JPQL
@Query("""
    SELECT new com.example.OrderSummary(o.id, c.name, o.total)
    FROM Order o JOIN o.customer c
    WHERE o.status = :status
    """)
List<OrderSummary> findSummariesByStatus(@Param("status") OrderStatus status);
```

### Batch Operations

```java
// Bad: Saving entities one at a time in a loop
for (OrderItem item : items) {
    orderItemRepo.save(item);  // One INSERT per item
}

// Good: Batch insert with proper configuration
// application.yml:
// spring.jpa.properties.hibernate.jdbc.batch_size: 50
// spring.jpa.properties.hibernate.order_inserts: true

@Transactional
public void createBulkItems(List<OrderItem> items) {
    for (int i = 0; i < items.size(); i++) {
        entityManager.persist(items.get(i));
        if (i % 50 == 0) {
            entityManager.flush();
            entityManager.clear();  // Prevent OutOfMemoryError on large batches
        }
    }
}

// Good: Use Spring Data's saveAll for moderate batches
orderItemRepo.saveAll(items);  // Batched if batch_size is configured
```

---

## Testing Patterns

### JUnit 5 Structure

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepo;

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private OrderService orderService;

    @Nested
    class CreateOrder {

        @Test
        void shouldCreateOrderAndReserveInventory() {
            var request = new CreateOrderRequest(List.of(
                new OrderItemRequest("SKU-1", 2)
            ));
            when(orderRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Order result = orderService.createOrder("user-1", request);

            assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
            verify(inventoryService).reserve(request.items());
        }

        @Test
        void shouldFailWhenInventoryUnavailable() {
            var request = new CreateOrderRequest(List.of(
                new OrderItemRequest("SKU-1", 999)
            ));
            doThrow(new InsufficientInventoryException("SKU-1"))
                .when(inventoryService).reserve(any());

            assertThatThrownBy(() -> orderService.createOrder("user-1", request))
                .isInstanceOf(InsufficientInventoryException.class)
                .hasMessageContaining("SKU-1");
        }
    }
}
```

### TestContainers for Integration Tests

```java
@SpringBootTest
@Testcontainers
class OrderRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepo;

    @Test
    void shouldPersistAndRetrieveOrder() {
        Order order = Order.create("user-1", List.of(
            new OrderItem("SKU-1", 2, new BigDecimal("29.99"))
        ));

        Order saved = orderRepo.save(order);
        Order found = orderRepo.findById(saved.getId()).orElseThrow();

        assertThat(found.getUserId()).isEqualTo("user-1");
        assertThat(found.getItems()).hasSize(1);
    }
}
```

### Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "100.00, 0.08, 108.00",
    "50.00, 0.10, 55.00",
    "0.00, 0.08, 0.00",
    "99.99, 0.0, 99.99",
})
void shouldCalculateTotalWithTax(
        BigDecimal subtotal, BigDecimal taxRate, BigDecimal expected) {

    BigDecimal result = calculator.calculateTotal(subtotal, taxRate);

    assertThat(result).isEqualByComparingTo(expected);
}

@ParameterizedTest
@MethodSource("invalidEmails")
void shouldRejectInvalidEmail(String email) {
    var request = new CreateUserRequest(email, "Test User");

    Set<ConstraintViolation<CreateUserRequest>> violations =
        validator.validate(request);

    assertThat(violations).isNotEmpty();
}

static Stream<String> invalidEmails() {
    return Stream.of("", "   ", "not-an-email", "@no-local.com", "no-domain@");
}
```

---

## Anti-Patterns to Avoid

### God Classes

```java
// Bad: Service that does everything
@Service
public class OrderService {
    public Order createOrder(...) { ... }
    public void sendConfirmationEmail(...) { ... }    // Not order logic
    public void updateInventory(...) { ... }          // Not order logic
    public Report generateSalesReport(...) { ... }    // Not order logic
    public void processRefund(...) { ... }
    public void syncWithErp(...) { ... }              // Not order logic
}

// Good: Each class has one responsibility
@Service public class OrderService { ... }            // Order lifecycle
@Service public class NotificationService { ... }     // Sending notifications
@Service public class InventoryService { ... }        // Stock management
@Service public class ReportingService { ... }        // Report generation
```

### Service Locator

```java
// Bad: Pulling dependencies from a container at runtime
public class OrderProcessor {
    public void process(Order order) {
        var emailService = ApplicationContext.getBean(EmailService.class);
        var inventoryService = ApplicationContext.getBean(InventoryService.class);
        // Hidden dependencies, untestable
    }
}

// Good: Constructor injection makes dependencies explicit
public class OrderProcessor {
    private final EmailService emailService;
    private final InventoryService inventoryService;

    public OrderProcessor(EmailService emailService, InventoryService inventoryService) {
        this.emailService = emailService;
        this.inventoryService = inventoryService;
    }
}
```

### Anemic Domain Model

```java
// Bad: Entity is just a data bag, all logic in services
@Entity
public class Order {
    private OrderStatus status;
    private List<OrderItem> items;
    // Only getters and setters
}

@Service
public class OrderService {
    public void cancel(Order order) {
        if (order.getStatus() == OrderStatus.PENDING
                || order.getStatus() == OrderStatus.CONFIRMED) {
            order.setStatus(OrderStatus.CANCELLED);
            // Business rules scattered in service layer
        }
    }
}

// Good: Entity encapsulates its own business rules
@Entity
public class Order {
    private OrderStatus status;
    private List<OrderItem> items;

    public void cancel() {
        if (!canCancel()) {
            throw new InvalidOrderStateException(
                "Cannot cancel order in " + status + " state"
            );
        }
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }

    public boolean canCancel() {
        return status == OrderStatus.PENDING || status == OrderStatus.CONFIRMED;
    }

    public Money getTotal() {
        return items.stream()
            .map(OrderItem::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }
}
```

### Checked Exception Overuse

```java
// Bad: Checked exceptions for everything
public User findUser(String id) throws UserNotFoundException,
        DatabaseConnectionException, SerializationException {
    // Callers must handle 3 checked exceptions
}

// Good: Unchecked exceptions for programming errors and unrecoverable failures
public User findUser(String id) {
    return userRepo.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
    // DatabaseException is already unchecked via Spring
}

// Good: Use checked exceptions only when callers MUST handle the condition
public TransferResult transfer(Account from, Account to, Money amount)
        throws InsufficientFundsException {
    // Caller genuinely needs to handle this business case differently
}
```

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|------------|-------------|
| Records | DTOs, value objects, query projections | Eliminates boilerplate, immutable by default |
| Sealed classes | Fixed set of subtypes (payments, events) | Compiler-enforced exhaustive handling |
| Pattern matching switch | Multi-branch type dispatch | No manual casting, exhaustive checking |
| Virtual threads | I/O-bound concurrent operations | Scalability without thread pool tuning |
| Constructor injection | Always (never field injection) | Explicit dependencies, easy testing |
| `@Transactional(readOnly=true)` | Read-only service methods | Hibernate query optimization |
| Fetch joins / Entity graphs | Loading associations | Prevents N+1 queries |
| Interface projections | Read-only queries needing few columns | Reduced memory and query overhead |
| `@Nested` test classes | Grouping tests by scenario | Organized, readable test structure |
| TestContainers | Integration tests needing real DBs | Realistic tests without external setup |

{{#if project_uses_spring_webflux}}
> **WebFlux Note**: When using reactive Spring, replace `@Transactional` with `@Transactional` on reactive repositories, use `Mono`/`Flux` return types, and prefer `WebClient` over `RestTemplate`. Virtual threads are an alternative to reactive for I/O-bound workloads.
{{/if}}

{{#if project_uses_kotlin}}
> **Kotlin Note**: Prefer Kotlin data classes over Java records, use sealed classes natively, and leverage coroutines instead of virtual threads. Spring Boot fully supports Kotlin including constructor injection via primary constructors.
{{/if}}
