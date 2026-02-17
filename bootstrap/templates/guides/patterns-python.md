# Python Patterns

Deep patterns for Pythonic code, async workflows, and web frameworks. Supplements the universal code quality guide with Python-specific idioms.

---

## Pythonic Idioms

### EAFP vs LBYL

Python favors "Easier to Ask Forgiveness than Permission" over "Look Before You Leap." Use try/except for expected conditions, not just errors.

```python
# LBYL (non-Pythonic in most cases)
if key in dictionary:
    value = dictionary[key]
else:
    value = default

if hasattr(obj, 'method'):
    obj.method()

# EAFP (Pythonic)
value = dictionary.get(key, default)

try:
    obj.method()
except AttributeError:
    handle_missing_method()
```

**When LBYL is better**: Use LBYL when the check is cheaper than the exception or when the operation has side effects you want to avoid.

```python
# LBYL is correct here - os.remove has side effects
if os.path.exists(filepath):
    os.remove(filepath)

# LBYL is correct here - checking permissions before expensive operation
if not user.has_permission('admin'):
    raise PermissionError("Admin access required")
start_expensive_migration()
```

### Unpacking and Starred Expressions

```python
# Bad: Index-based access
def get_first_and_rest(items):
    first = items[0]
    rest = items[1:]
    return first, rest

# Good: Unpacking
first, *rest = items
head, *_, tail = items  # First and last, ignore middle

# Good: Dictionary unpacking for merging
defaults = {'timeout': 30, 'retries': 3, 'verify': True}
user_config = {'timeout': 60, 'debug': True}
config = {**defaults, **user_config}  # user_config values win
```

### Walrus Operator for Reduce-and-Check

```python
# Bad: Compute and then check separately
match = pattern.search(text)
if match:
    process(match.group())

# Good: Walrus operator combines assignment and check
if match := pattern.search(text):
    process(match.group())

# Good: Walrus in while loops
while chunk := file.read(8192):
    process_chunk(chunk)

# Good: Walrus in comprehensions
valid_results = [
    cleaned
    for raw in raw_data
    if (cleaned := validate_and_clean(raw)) is not None
]
```

---

## Type Hints and Data Modeling

### Protocol Classes for Structural Typing

Protocols define interfaces without requiring inheritance. They let you type-check duck typing.

```python
from typing import Protocol, runtime_checkable

# Bad: Requiring inheritance for a simple interface
class AbstractRepository(ABC):
    @abstractmethod
    def find(self, id: str) -> Optional[User]: ...
    @abstractmethod
    def save(self, user: User) -> None: ...

class PostgresRepository(AbstractRepository):  # Forced coupling
    ...

# Good: Protocol defines the shape, not the lineage
@runtime_checkable
class Repository(Protocol):
    def find(self, id: str) -> Optional[User]: ...
    def save(self, user: User) -> None: ...

class PostgresRepository:  # No inheritance needed - just match the shape
    def find(self, id: str) -> Optional[User]:
        return self._session.get(User, id)

    def save(self, user: User) -> None:
        self._session.add(user)

def create_user(repo: Repository, data: UserCreate) -> User:
    # Works with any object that has find() and save()
    user = User(**data.dict())
    repo.save(user)
    return user
```

### Dataclasses vs Pydantic

```python
# Use dataclass for internal domain objects (no validation needed)
from dataclasses import dataclass, field
from datetime import datetime

@dataclass(frozen=True)  # Immutable by default
class Money:
    amount: Decimal
    currency: str = 'USD'

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError(f"Amount cannot be negative: {self.amount}")

@dataclass
class Order:
    id: str
    items: list[OrderItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def total(self) -> Money:
        return Money(sum(item.subtotal.amount for item in self.items))


# Use Pydantic for external data boundaries (API input, config, file parsing)
from pydantic import BaseModel, Field, field_validator

class CreateOrderRequest(BaseModel):
    """Validates and coerces external input."""
    customer_id: str = Field(min_length=1, max_length=50)
    items: list[OrderItemRequest] = Field(min_length=1)
    notes: str | None = None

    @field_validator('customer_id')
    @classmethod
    def validate_customer_exists(cls, v: str) -> str:
        # Pydantic v2 validator
        if not v.strip():
            raise ValueError('Customer ID cannot be blank')
        return v.strip()
```

---

## Generators and Context Managers

### Generators for Memory-Efficient Processing

```python
# Bad: Loading everything into memory
def process_log_file(path: Path) -> list[LogEntry]:
    with open(path) as f:
        lines = f.readlines()  # Entire file in memory
    return [parse_entry(line) for line in lines if is_error(line)]

# Good: Generator processes one line at a time
def read_error_entries(path: Path) -> Iterator[LogEntry]:
    with open(path) as f:
        for line in f:
            if is_error(line):
                yield parse_entry(line)

# Good: Generator pipeline for composable processing
def read_lines(path: Path) -> Iterator[str]:
    with open(path) as f:
        yield from f

def filter_errors(lines: Iterator[str]) -> Iterator[str]:
    return (line for line in lines if is_error(line))

def parse_entries(lines: Iterator[str]) -> Iterator[LogEntry]:
    return (parse_entry(line) for line in lines)

# Compose: nothing runs until you iterate
entries = parse_entries(filter_errors(read_lines(log_path)))
for entry in entries:
    handle(entry)  # Processes one line at a time, constant memory
```

### Custom Context Managers

```python
from contextlib import contextmanager, asynccontextmanager

# Good: contextmanager for simple resource patterns
@contextmanager
def database_transaction(session: Session) -> Generator[Session, None, None]:
    """Execute a block within a database transaction."""
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise

with database_transaction(session) as txn:
    txn.add(new_user)
    txn.add(audit_log)
# Auto-commits on success, auto-rolls-back on exception

# Good: Async context manager
@asynccontextmanager
async def rate_limited(semaphore: asyncio.Semaphore, name: str):
    """Acquire semaphore with logging."""
    logger.debug(f"Waiting for rate limit: {name}")
    async with semaphore:
        logger.debug(f"Acquired rate limit: {name}")
        yield
    logger.debug(f"Released rate limit: {name}")
```

---

## Async Patterns

### Structured Concurrency with asyncio

```python
# Bad: Fire-and-forget tasks (lost exceptions)
async def process_webhooks(events: list[Event]) -> None:
    for event in events:
        asyncio.create_task(handle_event(event))  # Exception silently lost

# Good: Gather with error handling
async def process_webhooks(events: list[Event]) -> list[Result]:
    tasks = [handle_event(event) for event in events]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = []
    for event, result in zip(events, results):
        if isinstance(result, Exception):
            logger.error(f"Failed to process {event.id}: {result}")
        else:
            successes.append(result)
    return successes

# Good: TaskGroup for strict structured concurrency (Python 3.11+)
async def process_webhooks(events: list[Event]) -> list[Result]:
    results = []
    async with asyncio.TaskGroup() as tg:
        for event in events:
            tg.create_task(handle_event(event))
    # All tasks complete or all cancelled if one fails
```

### Semaphores for Rate Limiting

```python
# Good: Limit concurrent API calls
async def fetch_all_users(user_ids: list[str]) -> list[User]:
    semaphore = asyncio.Semaphore(10)  # Max 10 concurrent requests

    async def fetch_one(user_id: str) -> User:
        async with semaphore:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"/api/users/{user_id}")
                response.raise_for_status()
                return User(**response.json())

    return await asyncio.gather(*[fetch_one(uid) for uid in user_ids])
```

---

## Django Patterns

{{#if project_uses_django}}

### QuerySet Optimization

```python
# Bad: N+1 query - one query per author
def get_books_with_authors():
    books = Book.objects.all()
    return [(book.title, book.author.name) for book in books]
    # 1 query for books + N queries for authors

# Good: select_related for ForeignKey (JOIN)
def get_books_with_authors():
    books = Book.objects.select_related('author').all()
    return [(book.title, book.author.name) for book in books]
    # 1 query with JOIN

# Good: prefetch_related for ManyToMany or reverse FK
def get_authors_with_books():
    authors = Author.objects.prefetch_related('books').all()
    return [(a.name, [b.title for b in a.books.all()]) for a in authors]
    # 2 queries: one for authors, one for all their books

# Good: Use .only() and .defer() for partial loading
def get_book_titles():
    return Book.objects.only('id', 'title').all()
    # SELECT id, title FROM books (not all columns)
```

### Model Design

```python
# Good: Encapsulate business logic in the model
class Order(models.Model):
    status = models.CharField(max_length=20, choices=OrderStatus.choices)
    items = models.ManyToManyField(Product, through='OrderItem')

    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

    def can_cancel(self) -> bool:
        return self.status in (OrderStatus.PENDING, OrderStatus.CONFIRMED)

    def cancel(self) -> None:
        if not self.can_cancel():
            raise InvalidTransitionError(
                f"Cannot cancel order in {self.status} state"
            )
        self.status = OrderStatus.CANCELLED
        self.save(update_fields=['status'])

    @classmethod
    def pending_older_than(cls, hours: int) -> QuerySet['Order']:
        cutoff = timezone.now() - timedelta(hours=hours)
        return cls.objects.filter(
            status=OrderStatus.PENDING,
            created_at__lt=cutoff,
        )
```

{{/if}}

---

## FastAPI Patterns

{{#if project_uses_fastapi}}

### Dependency Injection

```python
# Good: Dependencies as injectable, testable units
from fastapi import Depends

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    user = await db.get(User, payload.sub)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/orders")
async def list_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination: Pagination = Depends(),
) -> PaginatedResponse[OrderResponse]:
    query = select(Order).where(Order.user_id == user.id)
    return await paginate(db, query, pagination)
```

### Pydantic Models for Request/Response

```python
# Good: Separate models for input, output, and internal use
class OrderCreate(BaseModel):
    """What the client sends."""
    items: list[OrderItemCreate] = Field(min_length=1)
    shipping_address_id: str

class OrderResponse(BaseModel):
    """What the client receives."""
    id: str
    status: OrderStatus
    items: list[OrderItemResponse]
    total: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderInDB(BaseModel):
    """Internal representation with sensitive fields."""
    id: str
    user_id: str
    payment_intent_id: str  # Never expose to client
    # ...
```

{{/if}}

---

## Anti-Patterns to Avoid

### Mutable Default Arguments

```python
# Bad: Mutable default is shared across all calls
def add_item(item: str, items: list[str] = []) -> list[str]:
    items.append(item)
    return items

add_item("a")  # ['a']
add_item("b")  # ['a', 'b'] - not ['b']!

# Good: Use None and create inside the function
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    items.append(item)
    return items
```

### Bare Except and Exception Swallowing

```python
# Bad: Catches SystemExit, KeyboardInterrupt, GeneratorExit
try:
    process_data(data)
except:
    pass  # Silently swallows everything

# Bad: Catching too broadly
try:
    user = fetch_user(user_id)
    order = create_order(user, items)
    send_confirmation(order)
except Exception:
    logger.error("Something failed")  # Which step? What error?

# Good: Specific exceptions with context
try:
    user = fetch_user(user_id)
except UserNotFoundError:
    raise HTTPException(status_code=404, detail=f"User {user_id} not found")
except DatabaseConnectionError as e:
    logger.error(f"Database unreachable fetching user {user_id}: {e}")
    raise HTTPException(status_code=503, detail="Service temporarily unavailable")
```

### Global Mutable State

```python
# Bad: Module-level mutable state
_cache = {}  # Shared across all threads, no eviction, no thread safety

def get_user(user_id: str) -> User:
    if user_id not in _cache:
        _cache[user_id] = db.fetch_user(user_id)
    return _cache[user_id]

# Good: Encapsulated, thread-safe, bounded cache
from functools import lru_cache
from threading import Lock

@lru_cache(maxsize=1000)
def get_user(user_id: str) -> User:
    return db.fetch_user(user_id)

# Or for more control: explicit cache class
class UserCache:
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self._cache: dict[str, tuple[User, float]] = {}
        self._lock = Lock()
        self._max_size = max_size
        self._ttl = ttl_seconds

    def get(self, user_id: str) -> User | None:
        with self._lock:
            if user_id in self._cache:
                user, timestamp = self._cache[user_id]
                if time.time() - timestamp < self._ttl:
                    return user
                del self._cache[user_id]
        return None
```

### Misusing `isinstance` Chains

```python
# Bad: Type-checking chain instead of polymorphism
def calculate_area(shape) -> float:
    if isinstance(shape, Circle):
        return math.pi * shape.radius ** 2
    elif isinstance(shape, Rectangle):
        return shape.width * shape.height
    elif isinstance(shape, Triangle):
        return 0.5 * shape.base * shape.height
    else:
        raise ValueError(f"Unknown shape: {type(shape)}")

# Good: Protocol or ABC with method dispatch
class Shape(Protocol):
    def area(self) -> float: ...

@dataclass(frozen=True)
class Circle:
    radius: float
    def area(self) -> float:
        return math.pi * self.radius ** 2

@dataclass(frozen=True)
class Rectangle:
    width: float
    height: float
    def area(self) -> float:
        return self.width * self.height
```

---

## Quick Reference

| Pattern | When to Use | Key Benefit |
|---------|------------|-------------|
| EAFP (try/except) | Expected missing keys, attributes | Pythonic, often faster |
| Protocol classes | Define interfaces without inheritance | Structural typing, testability |
| Dataclasses (frozen) | Internal domain objects | Immutability, clear structure |
| Pydantic models | External data boundaries (APIs, config) | Validation and coercion |
| Generators | Large data processing | Constant memory usage |
| `@contextmanager` | Resource setup/teardown | Guaranteed cleanup |
| `asyncio.gather` | Multiple independent async calls | Concurrent execution |
| `asyncio.Semaphore` | Rate limiting concurrent work | Backpressure control |
| Walrus operator (`:=`) | Compute-and-check in one expression | Reduced redundancy |
| `select_related` (Django) | ForeignKey traversal in querysets | Eliminates N+1 queries |

{{#if project_uses_poetry}}
> **Poetry Note**: Use `poetry run mypy .` and `poetry run pytest` to ensure type checking and tests run within the correct virtual environment.
{{/if}}

{{#if project_uses_uv}}
> **uv Note**: Use `uv run mypy .` and `uv run pytest` to run tools within the uv-managed environment.
{{/if}}
