# Code Quality Principles

Guidelines for writing clean, maintainable code.

## Core Philosophy

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler

## Self-Documenting Code

### Names Tell the Story

Code should read like prose. If you need a comment to explain what code does, the code needs better names.

**Variables:**
```
❌ d = 7          # days until expiry
✅ daysUntilExpiry = 7

❌ tmp = users.filter(u => u.a)
✅ activeUsers = users.filter(user => user.isActive)
```

**Functions:**
```
❌ process(data)
✅ validateAndStoreUserSubmission(formData)

❌ calc(a, b)
✅ calculateOrderTotalWithTax(subtotal, taxRate)
```

**Classes:**
```
❌ Manager, Handler, Processor  (too vague)
✅ PaymentGateway, OrderValidator, EmailSender
```

### Functions Should Do One Thing

A function should:
- Fit on one screen (roughly 20-30 lines max)
- Have one reason to change
- Be testable in isolation

If you're using "and" to describe a function, split it.

### Comments: Why, Not What

**Bad comments** (explain what):
```
// Loop through users
for (user in users) {
    // Check if active
    if (user.isActive) {
        // Add to list
        result.add(user)
    }
}
```

**Good comments** (explain why):
```
// Active users are processed first per SLA requirements (ADR-012)
for (user in activeUsers) {
    processUser(user)
}

// Legacy systems expect null, not empty string (known issue #4521)
return value ?? null
```

## Complexity Management

### Avoid Deep Nesting

Maximum nesting depth: 3 levels

```
❌ Deep nesting:
if (user) {
    if (user.isActive) {
        if (user.hasPermission) {
            if (order.isValid) {
                // actual logic buried here
            }
        }
    }
}

✅ Early returns:
if (!user) return
if (!user.isActive) return
if (!user.hasPermission) return
if (!order.isValid) return

// actual logic at top level
```

### Guard Clauses

Handle edge cases first, then the main logic:

```
function processOrder(order) {
    // Guards first
    if (!order) throw new Error("Order required")
    if (order.items.isEmpty()) return EmptyResult
    if (order.isPaid) return AlreadyPaidResult

    // Main logic - no nesting needed
    const total = calculateTotal(order)
    const payment = processPayment(total)
    return createReceipt(order, payment)
}
```

### Extract Till You Drop

When code gets complex, extract smaller functions:

```
❌ One big function:
function processOrder(order) {
    // 50 lines of validation
    // 30 lines of calculation
    // 40 lines of payment processing
    // 20 lines of notification
}

✅ Composed functions:
function processOrder(order) {
    validateOrder(order)
    const total = calculateOrderTotal(order)
    const payment = processPayment(order, total)
    notifyCustomer(order, payment)
    return createOrderReceipt(order, payment)
}
```

## Code Organization

### File Structure

One concept per file. If a file has multiple unrelated things, split it.

### Import Organization

Group imports logically:
1. Standard library
2. Third-party packages
3. Internal modules
4. Relative imports

### Consistent Patterns

Within a codebase, similar things should look similar:
- If one controller uses async/await, all should
- If one service uses dependency injection, all should
- If one test uses describe/it, all should

## Error Handling

### Be Specific

```
❌ catch (e) { throw new Error("Failed") }
✅ catch (e) { throw new PaymentProcessingError(`Payment failed: ${e.message}`, e) }
```

### Fail Fast

Check preconditions early and fail immediately:

```
function transferFunds(from, to, amount) {
    if (amount <= 0) throw new InvalidAmountError(amount)
    if (!from.hasBalance(amount)) throw new InsufficientFundsError(from, amount)
    if (from.isFrozen) throw new AccountFrozenError(from)

    // Now proceed with confidence
    from.withdraw(amount)
    to.deposit(amount)
}
```

### Don't Swallow Errors

```
❌ catch (e) { /* ignore */ }
❌ catch (e) { console.log(e) }  // log and continue

✅ catch (e) {
    logger.error("Payment failed", { error: e, orderId: order.id })
    throw new PaymentError("Could not process payment", e)
}
```

## Magic Numbers and Strings

Extract constants with meaningful names:

```
❌ if (user.age >= 18)
❌ if (retries > 3)
❌ if (status === "ACTIVE")

✅ const LEGAL_ADULT_AGE = 18
✅ const MAX_RETRY_ATTEMPTS = 3
✅ const UserStatus = { ACTIVE: "ACTIVE", SUSPENDED: "SUSPENDED" }

✅ if (user.age >= LEGAL_ADULT_AGE)
✅ if (retries > MAX_RETRY_ATTEMPTS)
✅ if (status === UserStatus.ACTIVE)
```

## Dependencies

### Depend on Abstractions

```
❌ class OrderService {
    constructor() {
        this.db = new PostgresDatabase()  // Concrete dependency
    }
}

✅ class OrderService {
    constructor(repository: OrderRepository) {  // Abstract dependency
        this.repository = repository
    }
}
```

### Keep Dependencies Explicit

Don't hide dependencies:

```
❌ function sendEmail(to, subject) {
    const client = EmailService.getInstance()  // Hidden dependency
    client.send(to, subject)
}

✅ function sendEmail(emailClient, to, subject) {
    emailClient.send(to, subject)  // Explicit, testable
}
```

## Code Smells to Watch For

| Smell | Symptom | Fix |
|-------|---------|-----|
| Long Method | > 30 lines | Extract methods |
| Long Parameter List | > 4 parameters | Use parameter object |
| Duplicate Code | Same code in multiple places | Extract shared function |
| Feature Envy | Method uses other class's data more than its own | Move method |
| Data Clumps | Same fields always appear together | Create a class |
| Primitive Obsession | Using primitives instead of small objects | Create value objects |
| Shotgun Surgery | One change requires many file edits | Consolidate logic |

## Quality Checklist

Before considering code complete:

- [ ] Names are clear and descriptive
- [ ] Functions do one thing
- [ ] No deep nesting (max 3 levels)
- [ ] No magic numbers/strings
- [ ] Errors are handled explicitly
- [ ] Dependencies are explicit
- [ ] Tests are passing
- [ ] Code is formatted consistently
