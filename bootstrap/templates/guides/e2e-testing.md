# E2E Testing Guide

End-to-end tests validate critical user journeys through the full application stack. They are the **most expensive tests to write and maintain**, so every E2E test must justify its existence.

> **Rule of thumb:** If you can test it at a lower level (unit, integration), do that instead. Reserve E2E for flows that only make sense when the full system is wired together.

---

## Page Object Model

Encapsulate page interactions in reusable classes. This separates **what** the test does from **how** it interacts with the UI.

### Why Page Objects Matter

Without page objects, selector changes break every test that touches that element. With page objects, you fix one file and all tests keep working.

```
WITHOUT PAGE OBJECTS:
  Test A: await page.click('[data-testid="login-btn"]')
  Test B: await page.click('[data-testid="login-btn"]')
  Test C: await page.click('[data-testid="login-btn"]')
  → Selector changes? Fix 3 tests (or 30, or 300).

WITH PAGE OBJECTS:
  LoginPage.clickLogin()
  → Selector changes? Fix 1 file. All tests pass.
```

### Structure

Each page object encapsulates:
1. **Selectors** - how to find elements
2. **Actions** - what a user can do on this page
3. **Assertions** - what can be verified on this page

### Example: Login Page

```typescript
// pages/login.page.ts
export class LoginPage {
    private readonly page: Page;

    // Selectors - centralized, easy to update
    private selectors = {
        emailInput: '[data-testid="login-email"]',
        passwordInput: '[data-testid="login-password"]',
        submitButton: '[data-testid="login-submit"]',
        errorMessage: '[data-testid="login-error"]',
    };

    constructor(page: Page) {
        this.page = page;
    }

    // Actions - what a user can do
    async navigate() {
        await this.page.goto('/login');
    }

    async login(email: string, password: string) {
        await this.page.fill(this.selectors.emailInput, email);
        await this.page.fill(this.selectors.passwordInput, password);
        await this.page.click(this.selectors.submitButton);
    }

    // Assertions - what can be verified
    async expectErrorMessage(text: string) {
        await expect(
            this.page.locator(this.selectors.errorMessage)
        ).toHaveText(text);
    }

    async expectRedirectToDashboard() {
        await expect(this.page).toHaveURL(/\/dashboard/);
    }
}
```

### Example: Dashboard Page

```typescript
// pages/dashboard.page.ts
export class DashboardPage {
    private readonly page: Page;

    private selectors = {
        welcomeMessage: '[data-testid="welcome-msg"]',
        orderList: '[data-testid="order-list"]',
        orderRow: '[data-testid="order-row"]',
        createOrderButton: '[data-testid="create-order"]',
        logoutButton: '[data-testid="logout"]',
    };

    constructor(page: Page) {
        this.page = page;
    }

    async expectWelcomeMessage(name: string) {
        await expect(
            this.page.locator(this.selectors.welcomeMessage)
        ).toContainText(name);
    }

    async getOrderCount(): Promise<number> {
        return this.page.locator(this.selectors.orderRow).count();
    }

    async clickCreateOrder() {
        await this.page.click(this.selectors.createOrderButton);
    }

    async logout() {
        await this.page.click(this.selectors.logoutButton);
    }
}
```

### Composing Page Objects for Complex Flows

```typescript
// tests/checkout-flow.spec.ts
test('user completes checkout', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const checkout = new CheckoutPage(page);

    await login.navigate();
    await login.login('user@example.com', 'password');
    await dashboard.clickCreateOrder();
    await checkout.addItem('Widget', 2);
    await checkout.submitOrder();
    await checkout.expectConfirmation('ORD-');
});
```

---

## Selector Strategy

Selectors determine how tests find elements. The wrong strategy makes tests fragile.

### Priority Order

| Priority | Strategy | Example | Why |
|----------|----------|---------|-----|
| 1 | `data-testid` | `[data-testid="submit-btn"]` | Stable, decoupled from styling and content |
| 2 | Role + label | `getByRole('button', { name: 'Submit' })` | Tests accessibility, resilient to layout changes |
| 3 | Text content | `getByText('Submit Order')` | Readable, but breaks with copy changes |
| 4 | CSS selector | `.btn-primary` | Breaks when styling changes |
| 5 | XPath | `//div[@class="form"]/button[2]` | Brittle, hard to read, avoid entirely |

### Best Practices

**Prefer `data-testid` for interactive elements:**
```html
<!-- Good: explicit test hook -->
<button data-testid="checkout-submit">Place Order</button>

<!-- Good: semantic selector for accessibility testing -->
<button role="button" aria-label="Place Order">Place Order</button>
```

**Use semantic selectors when testing accessibility:**
```typescript
// Tests accessibility AND functionality
await page.getByRole('button', { name: 'Place Order' }).click();
await page.getByLabel('Email address').fill('user@example.com');
```

**Never rely on CSS classes or DOM structure:**
```typescript
// Fragile - breaks when styling changes
await page.click('.btn.btn-primary.submit-form');

// Fragile - breaks when DOM structure changes
await page.click('div > form > div:nth-child(3) > button');
```

**Strip `data-testid` from production builds** if bundle size matters:
```javascript
// babel plugin or build step to remove test attributes
// Only do this if you have a compelling reason (performance, security)
```

---

## Test Design

### Test Critical User Journeys

Focus on the paths that generate revenue or break trust if they fail:

```
HIGH PRIORITY (always E2E):
  - User registration and login
  - Core purchase/checkout flow
  - Payment processing
  - Data export (if users depend on it)

MEDIUM PRIORITY (E2E for smoke, integration for full coverage):
  - Profile management
  - Search functionality
  - Notification preferences

LOW PRIORITY (test at lower levels):
  - Form validation (unit test the validators)
  - UI component rendering (component tests)
  - Sorting and filtering (integration tests)
```

### Independent Tests

Every test must run in isolation. No test should depend on another test's side effects.

```typescript
// Bad: tests depend on shared state
test('create user', async () => {
    await api.createUser({ name: 'John' }); // Creates state
});

test('edit user', async () => {
    await page.goto('/users/john'); // Assumes previous test ran
});
```

```typescript
// Good: each test manages its own data
test('edit user profile', async ({ page }) => {
    // Arrange: seed this test's data
    const user = await testApi.createUser({ name: 'John' });

    // Act
    const profile = new ProfilePage(page);
    await profile.navigate(user.id);
    await profile.updateName('Jane');

    // Assert
    await profile.expectName('Jane');

    // Cleanup (or use automatic cleanup hooks)
});
```

### Wait for Conditions, Not Time

```typescript
// Bad: arbitrary sleep
await page.click('[data-testid="submit"]');
await page.waitForTimeout(3000); // Hoping 3 seconds is enough
await expect(page.locator('.success')).toBeVisible();

// Good: wait for the actual condition
await page.click('[data-testid="submit"]');
await expect(page.locator('[data-testid="success-msg"]')).toBeVisible();

// Good: wait for network to settle
await page.click('[data-testid="submit"]');
await page.waitForResponse(resp =>
    resp.url().includes('/api/orders') && resp.status() === 201
);
```

### Seed and Clean Test Data

```typescript
// fixtures/test-data.ts
export async function seedCheckoutTest(api: TestApi) {
    const user = await api.createUser({
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
    });
    const product = await api.createProduct({
        name: 'Test Widget',
        price: 9.99,
        stock: 100,
    });
    return { user, product };
}

// In test setup
test.beforeEach(async () => {
    testData = await seedCheckoutTest(testApi);
});

test.afterEach(async () => {
    await testApi.cleanup(testData);
});
```

---

## Flaky Test Management

Flaky tests erode trust in the test suite. A test that sometimes passes and sometimes fails is **worse than no test** because it trains the team to ignore failures.

### Identify: Track Pass/Fail Rates

```
FLAKY TEST INDICATORS:
  - Passes locally, fails in CI (or vice versa)
  - Fails on retry but passes on the next run
  - Fails more often during high-load periods
  - Fails only on specific OS or browser
```

Track flakiness metrics. If a test fails more than 2% of runs without code changes, it is flaky.

### Quarantine: Isolate Flaky Tests

Move flaky tests to a separate suite so they stop blocking deployments:

```typescript
// Mark flaky tests explicitly
test.describe('QUARANTINE - checkout flow', () => {
    test.fixme('completes payment', async ({ page }) => {
        // Known flaky: race condition with payment gateway callback
        // Ticket: JIRA-1234
        // ...
    });
});
```

### Root Cause: Common Sources of Flakiness

| Cause | Symptom | Fix |
|-------|---------|-----|
| Race conditions | Passes 80% of the time | Add proper waits for conditions |
| Timing assumptions | Fails under load | Replace `sleep()` with `waitFor()` |
| Test data pollution | Fails when run after specific test | Isolate test data per test |
| Network dependency | Fails when external service is slow | Mock external APIs |
| Viewport/resolution | Fails on CI but not locally | Set explicit viewport in config |
| Animation timing | Element not clickable | Disable animations in test mode |

### Retry Strategy

Retries are a **bandage, not a cure.** Use them to reduce noise while you fix root causes.

```typescript
// playwright.config.ts
export default defineConfig({
    retries: process.env.CI ? 2 : 0, // Retry only in CI, max 2
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results.json' }],
    ],
});
```

Log every retry. If a test consistently needs retries, it needs fixing, not more retries.

### Fix or Delete

**No test stays quarantined permanently.** Set a deadline (2 weeks max):
- If the root cause is found and fixable, fix it.
- If the test is not worth the maintenance cost, delete it.
- If the feature is untestable at E2E level, test it differently (integration, contract).

---

## CI Integration

### Artifact Capture

Capture evidence on failure. Debugging a CI-only failure without artifacts is guesswork.

```typescript
// playwright.config.ts
export default defineConfig({
    use: {
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
});
```

```yaml
# GitHub Actions - upload artifacts on failure
- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: e2e-test-results
    path: |
      test-results/
      playwright-report/
    retention-days: 7
```

### Parallel Execution

Shard tests across workers to reduce total run time:

```typescript
// playwright.config.ts
export default defineConfig({
    workers: process.env.CI ? 4 : undefined,
    fullyParallel: true,
});
```

```yaml
# GitHub Actions - matrix sharding
strategy:
  matrix:
    shard: [1/4, 2/4, 3/4, 4/4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}
```

### Smoke vs Full Suite

```yaml
# On every PR: smoke tests only (fast, critical paths)
on:
  pull_request:
    branches: [main]
jobs:
  e2e-smoke:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep @smoke

# Nightly: full E2E suite (comprehensive, slower)
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  e2e-full:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test
```

Tag tests accordingly:

```typescript
test('user can log in @smoke', async ({ page }) => { /* ... */ });
test('user can reset password', async ({ page }) => { /* ... */ });
```

### Separate Pipelines

Keep E2E tests in their own pipeline. They are slower and have different failure modes than unit tests.

```
UNIT TESTS:  Fast (seconds), run on every push
INTEGRATION: Medium (minutes), run on every PR
E2E SMOKE:   Slower (5-10 min), run on every PR
E2E FULL:    Slowest (30+ min), run nightly or on release branches
```

---

## Framework-Specific Patterns

### Playwright

```typescript
// Auto-waiting: Playwright waits for elements automatically
await page.click('[data-testid="submit"]'); // Waits until clickable

// Trace viewer: debug failures visually
// Run: npx playwright show-trace trace.zip

// Codegen: generate tests from browser interactions
// Run: npx playwright codegen https://your-app.com

// API mocking
await page.route('**/api/users', route =>
    route.fulfill({
        status: 200,
        body: JSON.stringify([{ id: 1, name: 'Test User' }]),
    })
);

// Network assertion
const responsePromise = page.waitForResponse('**/api/orders');
await page.click('[data-testid="submit"]');
const response = await responsePromise;
expect(response.status()).toBe(201);
```

### Cypress

```javascript
// API mocking with cy.intercept
cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
cy.visit('/dashboard');
cy.wait('@getUsers');

// Custom commands for reusable actions
Cypress.Commands.add('login', (email, password) => {
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type(email);
    cy.get('[data-testid="login-password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');
});

// Usage in tests
cy.login('user@example.com', 'password');
```

### Selenium

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

# Explicit waits - never use implicit waits or sleep
wait = WebDriverWait(driver, timeout=10)
element = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="submit"]'))
)
element.click()

# Wait for specific condition
wait.until(EC.url_contains('/dashboard'))
wait.until(EC.text_to_be_present_in_element(
    (By.CSS_SELECTOR, '[data-testid="status"]'), 'Complete'
))
```

---

## Anti-Patterns

### What to Avoid

| Anti-Pattern | Why It Hurts | What to Do Instead |
|---|---|---|
| `sleep(5000)` / `waitForTimeout` | Wastes time or fails intermittently | Wait for specific conditions |
| Shared mutable test state | Tests pass/fail depending on run order | Isolate data per test |
| Testing implementation details | Tests break on every refactor | Test user-visible behavior |
| Giant test files (500+ lines) | Hard to maintain and debug | Split by feature or journey |
| Missing cleanup/teardown | Pollutes database, causes cascading failures | Always clean up test data |
| Asserting on exact timestamps | Clocks differ between test and server | Assert on ranges or patterns |
| Testing through UI what APIs can cover | Slow, fragile | Use API tests for business logic |
| Hardcoded test data in tests | Duplicated, hard to maintain | Use fixtures or factories |
| Ignoring test failures | Normalizes broken builds | Fix, quarantine, or delete |
| Screenshot comparison for layout | Flaky across environments | Use visual regression tools with tolerance thresholds |

---

## Quick Reference

```
E2E TESTING CHECKLIST
=====================

BEFORE WRITING:
  [ ] Is E2E the right level? (Can this be tested lower?)
  [ ] Which user journey does this cover?
  [ ] What test data is needed?

PAGE OBJECTS:
  [ ] Selectors centralized in page object
  [ ] Actions return page objects for chaining
  [ ] No selectors in test files

SELECTORS:
  [ ] data-testid for interactive elements
  [ ] Role/label for accessibility-critical elements
  [ ] No CSS class selectors
  [ ] No XPath

TEST DESIGN:
  [ ] Tests are independent (no shared state)
  [ ] Data seeded in setup, cleaned in teardown
  [ ] Waits are condition-based, not time-based
  [ ] Clear error messages on failure

CI:
  [ ] Screenshots/videos captured on failure
  [ ] Smoke suite runs on every PR
  [ ] Full suite runs nightly
  [ ] Flaky tests tracked and addressed

SELECTOR PRIORITY:
  data-testid > role/label > text > CSS > XPath (never)
```

---

## Related Guides

- [TDD Enforcement](tdd-enforcement.md) - Write failing tests first, including E2E tests for new user journeys
- [Verification Workflow](verification.md) - Pre-PR checklist that includes running the E2E suite
