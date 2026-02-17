# API Design Guide

Guidelines for designing consistent, predictable, and maintainable HTTP APIs.

## 1. REST Resource Conventions

### Resource Naming

URLs identify **resources** (nouns), not actions (verbs). Use plural nouns in kebab-case.

| Pattern | Example |
|---------|---------|
| Collection | `GET /api/user-profiles` |
| Single resource | `GET /api/user-profiles/42` |
| Nested resource | `GET /api/user-profiles/42/addresses` |
| Sub-resource action | `POST /api/orders/42/cancellation` |

```
Bad:
  GET  /api/getUsers
  POST /api/createUser
  GET  /api/user_profiles
  GET  /api/UserProfile/42

Good:
  GET  /api/users
  POST /api/users
  GET  /api/user-profiles
  GET  /api/user-profiles/42
```

**Rules:**
- Plural nouns for collections: `/users`, not `/user`
- Kebab-case for multi-word resources: `/user-profiles`, not `/userProfiles`
- No trailing slashes: `/users`, not `/users/`
- Limit nesting to two levels: `/users/42/orders` is fine, `/users/42/orders/7/items/3/reviews` is not - flatten it

### HTTP Method Semantics

Each method has a defined semantic. Do not deviate.

| Method | Purpose | Idempotent | Cacheable | Request Body |
|--------|---------|------------|-----------|--------------|
| GET | Read a resource or collection | Yes | Yes | No |
| POST | Create a new resource | No | No | Yes |
| PUT | Full replacement of a resource | Yes | No | Yes |
| PATCH | Partial update of a resource | Not guaranteed | No | Yes |
| DELETE | Remove a resource | Yes | No | Optional |

**Idempotent** means calling it multiple times produces the same result as calling it once. `PUT /users/42` with the same body always results in the same state. `DELETE /users/42` called twice still results in the user being gone (second call returns 404 or 204, but the state is the same).

**POST is never idempotent.** Calling `POST /orders` twice creates two orders. Use idempotency keys (see below) when clients need safe retries.

### Status Code Usage

Return the most specific applicable status code.

**Success (2xx):**

| Code | When to Use | Example |
|------|-------------|---------|
| 200 OK | Successful GET, PUT, PATCH | `GET /users/42` returns the user |
| 201 Created | Successful POST that creates a resource | `POST /users` returns the new user + `Location` header |
| 204 No Content | Successful DELETE, or PUT/PATCH with no response body | `DELETE /users/42` with empty body |

**Client Error (4xx):**

| Code | When to Use | Example |
|------|-------------|---------|
| 400 Bad Request | Malformed syntax, invalid JSON | Unparseable request body |
| 401 Unauthorized | Missing or invalid authentication | No Bearer token provided |
| 403 Forbidden | Authenticated but insufficient permissions | Regular user accessing admin endpoint |
| 404 Not Found | Resource does not exist | `GET /users/999` for nonexistent user |
| 409 Conflict | State conflict prevents operation | Creating a user with a duplicate email |
| 422 Unprocessable Entity | Valid syntax but failed validation | Email field present but not a valid email |

**Server Error (5xx):**

| Code | When to Use | Example |
|------|-------------|---------|
| 500 Internal Server Error | Unhandled exception, unexpected failure | Database connection lost mid-request |

**Never return 200 for errors.** If something failed, use an appropriate 4xx or 5xx code. Clients rely on status codes for control flow.

### Idempotency Keys

For non-idempotent operations (POST), accept an idempotency key to allow safe retries:

```
POST /api/orders
Idempotency-Key: 8a3b92f1-c7d6-4e5a-b8f0-1a2b3c4d5e6f
Content-Type: application/json

{ "items": [...] }
```

**Implementation rules:**
- Store the key with the response for a defined window (e.g., 24 hours)
- If the same key arrives again, return the stored response without re-executing
- Return `409 Conflict` if the same key is sent with a different request body
- Keys should be client-generated UUIDs

---

## 2. Request and Response Design

### Error Envelope

Use a consistent error format across all endpoints. Clients should be able to parse every error the same way.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields failed validation.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address.",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "age",
        "message": "Must be at least 0.",
        "code": "OUT_OF_RANGE"
      }
    ]
  }
}
```

**Error envelope rules:**
- `error.code`: machine-readable string constant (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`)
- `error.message`: human-readable summary
- `error.details`: optional array of field-level or sub-errors
- Never include stack traces or internal implementation details in production error responses

### Pagination

**Prefer cursor-based pagination** over offset-based.

Offset-based (`?page=5&per_page=20`) breaks when data is inserted or deleted between page requests. Rows shift, causing duplicates or skipped items. Performance also degrades on large tables because the database must scan and discard `offset` rows.

Cursor-based pagination uses an opaque token pointing to a specific position:

```json
GET /api/orders?limit=20&cursor=eyJpZCI6MTAwfQ

{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIwfQ",
    "has_more": true
  }
}
```

**Rules:**
- Default page size: 20-50 items (configurable per endpoint)
- Maximum page size: enforce a hard cap (e.g., 100)
- Always include `has_more` or equivalent so clients know when to stop
- Cursors should be opaque to clients (base64-encoded internal state is fine)
- For simple admin UIs where offset is acceptable, support `?offset=0&limit=20` as a secondary option

### Filtering

Use query parameters with clear, predictable names:

```
GET /api/orders?status=active&created_after=2024-01-01&customer_id=42
```

**Rules:**
- Use snake_case for parameter names
- Date filters: `created_after`, `created_before` (ISO 8601 format)
- Enum filters: exact match on known values (`status=active`)
- Multiple values: comma-separated (`status=active,pending`) or repeated params (`status=active&status=pending`)
- Return 400 if an unknown filter parameter is provided (don't silently ignore it)

### Sorting

Use a `sort` parameter with field and direction:

```
GET /api/orders?sort=created_at:desc
GET /api/orders?sort=status:asc,created_at:desc
```

**Rules:**
- Format: `field:direction` where direction is `asc` or `desc`
- Default sort should be documented
- Only allow sorting on indexed fields (return 400 for non-sortable fields)
- Multiple sort fields separated by commas

### Field Selection

Allow clients to request only the fields they need:

```
GET /api/users?fields=id,name,email
```

**When to implement:** Only add field selection if responses are large or bandwidth is a concern. For most APIs, returning the full resource is simpler and more cacheable.

### Versioning

**Recommended: URL path versioning.**

```
/api/v1/users
/api/v2/users
```

This is the most explicit and debuggable approach. You can see the version in logs, bookmarks, and curl commands.

**Alternative: Header-based versioning.**

```
GET /api/users
Accept-Version: v2
```

Cleaner URLs but harder to debug and test. Use this only if you have strong reasons against URL versioning.

**Version lifecycle rules:**
- Support at least two major versions concurrently
- Deprecation notice: add a `Sunset` header with the retirement date
- Never break an existing version - create a new one instead

---

## 3. Input Validation

### Validate at the API Boundary

**Never trust client input.** Every field in every request must be validated before it reaches business logic or the database.

```python
# Bad: Trusting client input
@app.post("/api/users")
def create_user(data: dict):
    db.execute("INSERT INTO users (name, email) VALUES (?, ?)",
               data["name"], data["email"])  # No validation at all

# Good: Schema validation at the boundary
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    age: int = Field(ge=0, le=150)

@app.post("/api/users")
def create_user(data: CreateUserRequest):
    # data is already validated and typed
    user = user_service.create(data.name, data.email, data.age)
    return user
```

```typescript
// Bad: No validation
app.post('/api/users', (req, res) => {
    const { name, email } = req.body;  // Could be anything
    db.createUser(name, email);
});

// Good: Schema validation with Zod
import { z } from 'zod';

const CreateUserSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
});

app.post('/api/users', (req, res) => {
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(422).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input.',
                details: result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            },
        });
    }
    const { name, email, age } = result.data;
    // Proceed with validated data
});
```

### Schema-Based Validation Libraries

| Language | Library | Notes |
|----------|---------|-------|
| TypeScript/JS | Zod, Joi, Yup | Zod preferred for TypeScript-first projects |
| Python | Pydantic, marshmallow | Pydantic preferred for FastAPI projects |
| C# / .NET | FluentValidation, Data Annotations | FluentValidation for complex rules |
| Java / Kotlin | Bean Validation (Hibernate Validator) | Standard JSR-380 annotations |
| Go | go-playground/validator | Struct tag-based validation |

### Validation Error Format

Return field-level errors so clients can display them next to the relevant form fields:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      { "field": "email", "message": "Must be a valid email address.", "code": "INVALID_FORMAT" },
      { "field": "name", "message": "Must not be empty.", "code": "REQUIRED" },
      { "field": "age", "message": "Must be between 0 and 150.", "code": "OUT_OF_RANGE" }
    ]
  }
}
```

### Sanitization vs Rejection

**Prefer rejection over sanitization.** Tell the client what is wrong and let them fix it. Silent sanitization (trimming, stripping characters) can produce unexpected results.

```
Bad:  Silently strip HTML tags from a "name" field
Good: Return 422 with "Name must not contain HTML."

Bad:  Silently truncate a string to 200 characters
Good: Return 422 with "Name must not exceed 200 characters."
```

**Exceptions:** Trimming leading/trailing whitespace is generally acceptable and expected.

### Enforce Limits on All Inputs

- String fields: enforce max length
- Arrays: enforce max item count
- Numeric fields: enforce min/max range
- File uploads: enforce max size
- Request body: enforce max size at the middleware level
- Query parameters: enforce max result limits for pagination

---

## 4. Authentication and Authorization

### Bearer Token Pattern

```
GET /api/users/me
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**Rules:**
- Tokens go in the `Authorization` header, never in query params (URLs get logged)
- Validate the token on every request (signature, expiration, issuer)
- Return 401 if the token is missing, expired, or invalid
- Return 403 if the token is valid but the user lacks permission

### API Key Pattern

For server-to-server or third-party integrations:

```
GET /api/data
X-API-Key: sk_live_abc123def456
```

**Rules:**
- Use a custom header (`X-API-Key`) - never put API keys in URLs
- Prefix keys to indicate environment: `sk_live_`, `sk_test_`
- Hash keys before storing them (treat like passwords)
- Support key rotation: allow multiple active keys per client
- Log key usage but never log the key value itself

### Rate Limiting

Include standard rate limit headers in every response:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 994
X-RateLimit-Reset: 1704067200
```

| Header | Meaning |
|--------|---------|
| `X-RateLimit-Limit` | Max requests in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

When rate limited, return:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

**Implementation rules:**
- Rate limit by API key or authenticated user, not just IP
- Use different limits for different endpoint tiers (read vs write)
- Return `429 Too Many Requests` with a `Retry-After` header
- Document rate limits in your API documentation

### CORS Configuration

```
Bad:  Access-Control-Allow-Origin: *  (on authenticated endpoints)
Good: Access-Control-Allow-Origin: https://app.example.com
```

**Rules:**
- Never use wildcard `*` on endpoints that accept credentials
- Explicitly list allowed origins
- Restrict allowed methods to what the endpoint actually supports
- Set `Access-Control-Max-Age` to avoid preflight on every request
- Keep the allowed headers list minimal

---

## 5. Documentation

### OpenAPI / Swagger

Every API should have a machine-readable specification. OpenAPI (formerly Swagger) is the standard.

**Minimum requirements per endpoint:**
- Summary and description
- Request parameters with types and constraints
- Request body schema with examples
- All possible response codes with schemas
- Authentication requirements

```yaml
paths:
  /api/users:
    post:
      summary: Create a new user
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              name: "Jane Doe"
              email: "jane@example.com"
              age: 30
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '409':
          description: Email already in use
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '422':
          description: Validation failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

### Documentation Rules

- **Every endpoint must have at least one example** request and response
- **Document authentication** requirements clearly (which endpoints need auth, which are public)
- **Keep docs in sync with code** - use code-generation tools (e.g., Swashbuckle for .NET, FastAPI auto-docs, springdoc for Java) where possible
- **Document error codes** - provide a reference table of all machine-readable error codes
- **Include a getting started section** with a working curl example

---

## 6. Anti-Patterns

### Verbs in URLs

```
Bad:  GET  /api/getUsers
      POST /api/createOrder
      POST /api/deleteUser/42

Good: GET    /api/users
      POST   /api/orders
      DELETE /api/users/42
```

The HTTP method already expresses the verb. The URL identifies the resource.

### Inconsistent Naming

```
Bad:  GET /api/user-profiles     (kebab-case)
      GET /api/orderItems         (camelCase)
      GET /api/product_categories (snake_case)

Good: GET /api/user-profiles
      GET /api/order-items
      GET /api/product-categories
```

Pick one convention (kebab-case for URLs, snake_case or camelCase for JSON fields) and enforce it everywhere.

### Exposing Internal Structure

```
Bad:  GET /api/users/42
      { "id": 42, "_table": "usr_accounts", "_pk_column": "usr_id" }

Good: GET /api/users/42
      { "id": "usr_2a8b9c", "name": "Jane Doe", "email": "jane@example.com" }
```

- Never expose database column names, table names, or auto-increment IDs
- Use UUIDs or prefixed opaque IDs instead of sequential integers
- Do not leak internal service names or infrastructure details in error messages

### Missing Pagination on List Endpoints

```
Bad:  GET /api/orders  -> returns all 500,000 orders

Good: GET /api/orders?limit=20  -> returns 20 orders with pagination metadata
```

Every list endpoint must be paginated. No exceptions. Even if the collection is small today, it will grow.

### Returning 200 for Errors

```
Bad:  HTTP/1.1 200 OK
      { "success": false, "error": "User not found" }

Good: HTTP/1.1 404 Not Found
      { "error": { "code": "NOT_FOUND", "message": "User not found." } }
```

HTTP status codes exist for a reason. Clients, proxies, and monitoring tools all rely on them.

### Accepting Unbounded Input

```
Bad:  POST /api/import
      { "items": [... 10 million items ...] }

Good: POST /api/import
      - Enforce max body size (e.g., 10 MB)
      - Enforce max array length (e.g., 1000 items)
      - For bulk operations, use async job pattern with progress tracking
```

Always set limits. Unbounded inputs cause memory exhaustion, slow responses, and denial-of-service vulnerabilities.

### Ignoring Concurrency

```
Bad:  PUT /api/users/42
      # Two clients read version 3, both send updates, last write wins silently

Good: PUT /api/users/42
      If-Match: "etag-abc123"
      # Returns 412 Precondition Failed if resource changed since read
```

For resources where concurrent modification is possible, use ETags or version fields to detect conflicts.

---

## Quick Reference

### URL Design Cheatsheet

| Action | Method | URL | Status |
|--------|--------|-----|--------|
| List resources | GET | `/api/users` | 200 |
| Get one resource | GET | `/api/users/42` | 200 or 404 |
| Create resource | POST | `/api/users` | 201 |
| Full replace | PUT | `/api/users/42` | 200 or 204 |
| Partial update | PATCH | `/api/users/42` | 200 or 204 |
| Delete resource | DELETE | `/api/users/42` | 204 or 404 |
| Search (complex) | POST | `/api/users/search` | 200 |

### Response Checklist

Before shipping any endpoint, verify:

- [ ] Correct HTTP status codes for success and all error cases
- [ ] Consistent error envelope format with machine-readable codes
- [ ] Pagination on all list endpoints with enforced max page size
- [ ] Input validation with field-level error messages
- [ ] Rate limit headers included
- [ ] Authentication and authorization checked
- [ ] No internal details leaked in responses
- [ ] Request size limits enforced
- [ ] CORS configured for browser clients
- [ ] OpenAPI spec updated

### HTTP Status Code Decision Tree

```
Is the request malformed (bad JSON, missing required headers)?
  -> 400 Bad Request

Is the client not authenticated?
  -> 401 Unauthorized

Is the client authenticated but not authorized?
  -> 403 Forbidden

Does the requested resource not exist?
  -> 404 Not Found

Does the request conflict with current state (duplicate, version mismatch)?
  -> 409 Conflict

Is the request well-formed but semantically invalid (validation failure)?
  -> 422 Unprocessable Entity

Is the client sending too many requests?
  -> 429 Too Many Requests

Did something unexpected break on the server?
  -> 500 Internal Server Error
```

### Naming Conventions Summary

| Context | Convention | Example |
|---------|-----------|---------|
| URL paths | kebab-case, plural nouns | `/api/user-profiles` |
| Query parameters | snake_case | `?created_after=2024-01-01` |
| JSON fields (JS/TS) | camelCase | `{ "firstName": "Jane" }` |
| JSON fields (Python) | snake_case | `{ "first_name": "Jane" }` |
| HTTP headers | Title-Case | `Content-Type`, `X-API-Key` |
| Error codes | UPPER_SNAKE_CASE | `VALIDATION_ERROR` |
