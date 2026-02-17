# Marketplace API

Django REST Framework API for an online marketplace with order management, payment processing, and async task handling.

## Commands

| Task | Command |
|------|---------|
| Build | `python manage.py check --deploy` |
| Test | `pytest --cov=apps --cov-report=term-missing` |
| Lint | `ruff check .` |
| Format | `ruff format .` |
| Dev | `python manage.py runserver` |
| Migrations | `python manage.py makemigrations && python manage.py migrate` |
| Types | `mypy apps/` |

## Critical Rules (NEVER VIOLATE)

| Rule | Details |
|------|---------|
| **TDD Mandatory** | RED → GREEN → REFACTOR. Test first, always. |
| **Research First** | Never guess behavior - verify before coding. |
| **No Hardcoded Secrets** | Use `os.environ` / `django-environ`, never string literals. |
| **ORM Only** | No raw SQL unless wrapped in `.raw()` with parameterized queries. |
| **N+1 Prevention** | Always use `select_related()` / `prefetch_related()` for foreign keys. |

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
| Django settings | `config/settings/` |
| URL routing | `config/urls.py` |
| Accounts app | `apps/accounts/` |
| Orders app | `apps/orders/` |
| Products app | `apps/products/` |
| Shared exceptions | `core/exceptions.py` |
| Celery tasks | `apps/*/tasks.py` |
| Tests | `apps/*/tests/` |
| Docs | `ai-docs/` |

## Architecture

ViewSet → Service (business logic) → ORM (Django models) → PostgreSQL
Celery workers handle async tasks (emails, reports, webhooks)

## Key Patterns

### Service Layer

```python
# apps/orders/services.py
from django.db import transaction

def create_order(*, customer, product_id: uuid.UUID, quantity: int) -> Order:
    product = Product.objects.select_for_update().get(id=product_id)

    if product.stock < quantity:
        raise InsufficientStockError()

    with transaction.atomic():
        order = Order.objects.create(
            customer=customer,
            product=product,
            quantity=quantity,
            total=product.price * quantity,
        )
        product.stock -= quantity
        product.save(update_fields=["stock", "updated_at"])

    send_order_confirmation.delay(order.id)
    return order
```

### Thin Views

```python
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .select_related("product", "customer")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        order = create_order(
            customer=self.request.user,
            product_id=serializer.validated_data["product_id"],
            quantity=serializer.validated_data["quantity"],
        )
        serializer.instance = order
```

### Test Pattern (pytest + Factory Boy)

```python
@pytest.mark.django_db
class TestCreateOrder:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(self.user)

    def test_success(self):
        product = ProductFactory(price=29_99, stock=10)
        response = self.client.post("/api/orders/", {
            "product_id": str(product.id),
            "quantity": 2,
        })
        assert response.status_code == 201

    def test_insufficient_stock(self):
        product = ProductFactory(stock=0)
        response = self.client.post("/api/orders/", {
            "product_id": str(product.id),
            "quantity": 1,
        })
        assert response.status_code == 409
```

## Environment Variables

```bash
SECRET_KEY=
DEBUG=False
DATABASE_URL=postgres://user:pass@localhost:5432/marketplace
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=api.example.com
```

## Commits

50/72 rule. Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
