# Database Patterns

Databases are the foundation of most applications. Poor schema design, unoptimized queries, and unsafe migrations cause outages, data loss, and security breaches. These patterns prevent the most common and costly mistakes.

## 1. Schema Design

### Normalization vs Denormalization

**Default to normalization** (3NF). Denormalize only with measured evidence of a read performance bottleneck.

| Approach | When to Use | Trade-off |
|----------|-------------|-----------|
| Normalized (3NF) | Default for transactional data, strong consistency | Slower reads (joins), faster writes, easier updates |
| Denormalized | Read-heavy analytics, caching layers, materialized views | Faster reads, slower writes, data inconsistency risk |
| Hybrid | Most real applications — normalize core, denormalize hot paths | Balance of both, requires sync discipline |

**Decision rule:** If you update the same data in multiple places, you have a denormalization problem. If you join 6+ tables on every page load, you may need selective denormalization.

### Data Type Selection

Choose types that prevent bugs at the storage layer, not just the application layer.

| Data | Recommended Type | Avoid |
|------|-----------------|-------|
| Primary keys | `UUID` (distributed) or `BIGINT` (single DB) | `INT` (exhaustible), `VARCHAR` PKs (slow joins) |
| Timestamps | `TIMESTAMPTZ` (always with timezone) | `TIMESTAMP` without timezone, `VARCHAR` dates |
| Money/currency | `DECIMAL(19,4)` or `NUMERIC` | `FLOAT`, `DOUBLE` (rounding errors) |
| Boolean flags | `BOOLEAN` | `INT` (0/1), `CHAR(1)` (Y/N) |
| JSON data | `JSONB` (indexed, binary) | `JSON` (text, no indexing), `TEXT` storing JSON |
| Enumerations | `VARCHAR` with CHECK constraint | Magic numbers, unconstrained strings |

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    total_amount    DECIMAL(19,4) NOT NULL CHECK (total_amount >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    ordered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Foreign Keys and Constraints

**Always define foreign keys.** They prevent orphaned data and document relationships.

| Cascade Rule | Use When |
|-------------|----------|
| `ON DELETE CASCADE` | Child has no meaning without parent (order_items when order deleted) |
| `ON DELETE RESTRICT` | Child should prevent parent deletion (orders prevent customer deletion) |
| `ON DELETE SET NULL` | Relationship is optional (assigned_to user leaves company) |

### Index Strategy

**Every foreign key needs an index.** Beyond that, index based on actual query patterns.

| Index Type | Use Case | Example |
|-----------|----------|---------|
| B-tree (default) | Equality, range, sorting | `CREATE INDEX idx_orders_customer ON orders(customer_id)` |
| Partial | Filtering on a specific subset | `CREATE INDEX idx_orders_pending ON orders(status) WHERE status = 'pending'` |
| Covering | Answered from index alone | `CREATE INDEX idx_orders_cover ON orders(customer_id) INCLUDE (status, total_amount)` |
| Composite | Multi-column WHERE or ORDER BY | `CREATE INDEX idx_orders_cust_date ON orders(customer_id, ordered_at DESC)` |
| GIN | JSONB, full-text search, arrays | `CREATE INDEX idx_products_tags ON products USING GIN(tags)` |

**Composite index column order matters:** Put equality columns first, then range/sort columns. An index on `(customer_id, ordered_at)` supports queries on `customer_id` alone, but NOT `ordered_at` alone.

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `order_items`, `user_accounts` |
| Columns | `snake_case`, singular | `first_name`, `created_at` |
| Primary keys | `id` | `orders.id` |
| Foreign keys | `{singular_table}_id` | `order_items.order_id` |
| Indexes | `idx_{table}_{columns}` | `idx_orders_customer_id` |
| Constraints | `uq_` / `chk_` prefix | `uq_users_email`, `chk_orders_positive_total` |

---

## 2. Query Optimization

### N+1 Detection and Prevention

The N+1 problem is the **#1 database performance killer**. It occurs when code executes 1 query to get a list, then N additional queries to get related data for each item.

**ORM-specific eager loading patterns:**

```python
# SQLAlchemy — BAD: accessing order.customer triggers a query per order
orders = session.query(Order).all()
for order in orders:
    print(order.customer.name)  # N additional queries

# GOOD: joinedload (single JOIN query) or selectinload (two queries, better for collections)
from sqlalchemy.orm import joinedload, selectinload
orders = session.query(Order).options(joinedload(Order.customer)).all()
orders = session.query(Order).options(selectinload(Order.items)).all()
```

```csharp
// EF Core — BAD: lazy loading fires a query per order
var orders = await context.Orders.ToListAsync();
foreach (var order in orders)
    Console.WriteLine(order.Customer.Name); // N additional queries

// GOOD: Include/ThenInclude
var orders = await context.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items).ThenInclude(i => i.Product)
    .ToListAsync();
```

```python
# Django — select_related for FK/OneToOne (JOIN), prefetch_related for M2M/reverse FK (2 queries)
orders = Order.objects.select_related('customer').all()
orders = Order.objects.prefetch_related('items').all()
```

```java
// JPA — JOIN FETCH in JPQL or @EntityGraph annotation
List<Order> orders = em.createQuery(
    "SELECT o FROM Order o JOIN FETCH o.customer", Order.class).getResultList();

@EntityGraph(attributePaths = {"customer", "items"})
List<Order> findAll();
```

### Reading EXPLAIN ANALYZE

Run `EXPLAIN (ANALYZE, BUFFERS)` on slow queries. Key nodes to understand:

| Node Type | Meaning | Action If Slow |
|-----------|---------|----------------|
| Seq Scan | Full table scan | Add index on filtered column |
| Index Scan | Uses index to find rows | Good — consider covering index to avoid heap fetch |
| Index Only Scan | Answered entirely from index | Best case for reads |
| Hash Join | Hash table for join | Check join column types match, both indexed |
| Nested Loop | Loop join, good for small sets | Problematic if inner side is Seq Scan on large table |
| Sort | Sorting result set | Add index matching ORDER BY to eliminate sort |

**Watch for:** actual rows vs planned rows mismatch (run `ANALYZE table_name` to update statistics), high shared read buffer counts (data not cached), and sorts spilling to disk.

### Cursor-Based Pagination

**Never use OFFSET for paginating large tables.** OFFSET still scans and discards all skipped rows.

```sql
-- BAD: OFFSET — page 1000 scans and discards 999 pages of rows
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 19980;

-- GOOD: Cursor-based — seeks directly using an indexed column
SELECT * FROM orders WHERE id > '018d4f2a-last-seen-uuid' ORDER BY id LIMIT 20;
```

**Why OFFSET is harmful:** Performance degrades linearly with page number. Concurrent inserts/deletes cause rows to shift, skipping or duplicating results. Cursor pagination requires a unique, indexed, sequential column.

### Batch Operations

```sql
-- BAD: Individual inserts in a loop (thousands of round-trips)
INSERT INTO events (type, data) VALUES ('click', '{}');

-- GOOD: Bulk insert (single round-trip)
INSERT INTO events (type, data) VALUES ('click', '{}'), ('view', '{}'), ('scroll', '{}');

-- GOOD: Upsert (insert or update on conflict)
INSERT INTO products (sku, name, price) VALUES ('ABC-123', 'Widget', 9.99)
ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;
```

### Connection Pooling

**Always use connection pooling in production.** Database connections are expensive to establish.

| Setting | Guideline |
|---------|-----------|
| Pool size | `(2 * CPU cores) + number_of_disks` as starting point |
| Max connections | Never exceed DB `max_connections` across all app instances |
| Idle timeout | 5-10 minutes — release unused connections |
| Connection lifetime | 30-60 minutes — prevent stale connections after DB restarts |

Use external poolers like PgBouncer for high-connection-count deployments.

---

## 3. Migration Safety

### The Expand-Contract Pattern

For zero-downtime deployments, never make a breaking change in one step. **Expand** (add the new), **migrate data**, then **contract** (remove the old).

**Example: Renaming a column from `name` to `full_name`**

1. **EXPAND** — `ALTER TABLE customers ADD COLUMN full_name VARCHAR(255);`
2. **BACKFILL** — `UPDATE customers SET full_name = name WHERE full_name IS NULL;` (batch for large tables)
3. **SWITCH** — Deploy app code that writes to both columns, reads from new
4. **CONTRACT** — `ALTER TABLE customers DROP COLUMN name;`

### Safe Column Operations

| Operation | Safety | How to Do It Safely |
|-----------|--------|---------------------|
| Add nullable column | **Safe** | `ALTER TABLE t ADD COLUMN c TYPE` |
| Add column with default | **Safe (PG 11+)** | `ALTER TABLE t ADD COLUMN c TYPE DEFAULT val` |
| Add NOT NULL constraint | **Dangerous** | Add nullable, backfill, then `SET NOT NULL` |
| Drop column | **Dangerous** | Remove all code references first, then drop |
| Rename column | **Dangerous** | Use expand-contract pattern |
| Change column type | **Dangerous** | Add new column, migrate data, switch, drop old |
| Add index | **Blocking** | Use `CREATE INDEX CONCURRENTLY` (PostgreSQL) |

### Dangerous Operations Checklist

Before running any production migration:

- [ ] Does this acquire `ACCESS EXCLUSIVE` lock? (Blocks all reads/writes)
- [ ] How large is the table? (Millions of rows = minutes of lock time)
- [ ] Can this be done with `CONCURRENTLY` option?
- [ ] Is there a rollback migration?
- [ ] Has this been tested against a production-size dataset?

### Data vs Schema Migrations

**Keep them separate.** Schema changes and data migrations have different failure modes and rollback strategies. Schema migrations are fast and reversible. Data migrations are slow and should be batched.

### Reversibility

**Every migration must have a rollback.** If you cannot reverse it, document why and get explicit approval.

```python
# Django: forwards and backwards are explicit
class Migration(migrations.Migration):
    def forwards(self, schema_editor):
        schema_editor.add_field('orders', 'priority', models.IntegerField(default=0))
    def backwards(self, schema_editor):
        schema_editor.remove_field('orders', 'priority')
```

```csharp
// EF Core: migrations are reversible by default
// Generate: dotnet ef migrations add AddOrderPriority
// Rollback: dotnet ef database update PreviousMigrationName
```

---

## 4. Security

### Parameterized Queries ALWAYS

**Never concatenate user input into SQL strings.** This is non-negotiable.

```python
# VULNERABLE
query = f"SELECT * FROM users WHERE email = '{email}'"
# SAFE
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

```csharp
// VULNERABLE
var sql = $"SELECT * FROM Users WHERE Email = '{email}'";
// SAFE — EF Core parameterizes automatically
var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
// SAFE — FromSqlInterpolated parameterizes the interpolation
var user = await context.Users
    .FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {email}")
    .FirstOrDefaultAsync();
```

### Row-Level Security

When multiple tenants share a database, enforce isolation at the database level.

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
-- Application sets: SET app.current_tenant = 'tenant-uuid-here';
```

### Credential Management

Connection strings contain credentials. **Never hardcode them.** Always use environment variables or secret managers. See the [Security Guide](security.md) for details.

### Audit Logging

Track who changed what and when. Use trigger-based audit tables that capture `table_name`, `record_id`, `action` (INSERT/UPDATE/DELETE), `old_data` (JSONB), `new_data` (JSONB), `changed_by`, and `changed_at`. This provides a complete change history for compliance and debugging.

---

## 5. Anti-Patterns

These are the mistakes that cause production incidents. Recognize and prevent them.

| Anti-Pattern | Why It Is Harmful | Correct Pattern |
|-------------|-------------------|-----------------|
| N+1 queries | 1 + N round-trips instead of 1-2 | Eager loading (see Section 2) |
| OFFSET pagination | Scans all skipped rows, degrades with depth | Cursor-based pagination |
| Missing FK indexes | JOINs and CASCADE become full table scans | Index every foreign key column |
| Over-indexing | Every index slows INSERT/UPDATE/DELETE | Index only columns in WHERE, JOIN, ORDER BY |
| Money as FLOAT | `0.1 + 0.2 = 0.30000000000000004` | `DECIMAL(19,4)` or `NUMERIC` |
| Raw SQL concatenation | SQL injection — most exploited vulnerability | Parameterized queries, always |
| SELECT * in production | Transfers unnecessary data, breaks on schema change | Select only needed columns |
| No connection pooling | Connection storms during traffic spikes | Use pool (HikariCP, PgBouncer, ORM pool) |
| Soft deletes everywhere | Complicates every query with `WHERE deleted_at IS NULL` | Use only where legally required; prefer archival tables |
| UUID v4 as clustered PK | Random UUIDs cause index fragmentation | UUID v7 (time-ordered) or BIGINT sequences |

---

## Quick Reference Card

### Schema Design Checklist

- [ ] Primary keys: UUID v7 or BIGINT (never INT)
- [ ] Timestamps: always `TIMESTAMPTZ`
- [ ] Money: always `DECIMAL` or `NUMERIC` (never FLOAT)
- [ ] Foreign keys defined with appropriate cascade rules
- [ ] Every foreign key column is indexed
- [ ] CHECK constraints for enums and valid ranges
- [ ] Naming follows `snake_case` convention consistently

### Query Performance Checklist

- [ ] No N+1 queries — eager loading configured for all list views
- [ ] Pagination uses cursor-based approach (not OFFSET)
- [ ] Bulk operations used instead of single-row loops
- [ ] `EXPLAIN ANALYZE` run on queries touching large tables
- [ ] Connection pooling configured with appropriate limits

### Migration Safety Checklist

- [ ] Every migration has a rollback
- [ ] Schema and data migrations are separate
- [ ] No `ACCESS EXCLUSIVE` locks on large tables
- [ ] Index creation uses `CONCURRENTLY` where available
- [ ] Column additions are nullable first, constrained after backfill
- [ ] Renames and type changes use expand-contract pattern

### ORM Eager Loading Quick Reference

| ORM | One-to-One / FK | One-to-Many / Collections |
|-----|-----------------|---------------------------|
| SQLAlchemy | `joinedload()` | `selectinload()` |
| EF Core | `.Include()` | `.Include().ThenInclude()` |
| Django | `select_related()` | `prefetch_related()` |
| JPA/Hibernate | `JOIN FETCH` | `@EntityGraph` |
