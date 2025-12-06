# TDD Enforcement Guide

Test-Driven Development is **mandatory** for all new features and bug fixes.

## The TDD Cycle

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────┐     ┌─────────┐     ┌──────────┐        │
│   │   RED   │────▶│  GREEN  │────▶│ REFACTOR │        │
│   └─────────┘     └─────────┘     └──────────┘        │
│        │                                   │           │
│        └───────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1. RED - Write a Failing Test

**Before writing any implementation code**, write a test that:
- Describes the expected behavior
- Fails because the feature doesn't exist yet
- Is specific and focused (one behavior per test)

```
# Run the test - it MUST fail
# If it passes, your test is wrong or the feature already exists
```

### 2. GREEN - Make It Pass

Write the **minimum code** necessary to make the test pass:
- Don't over-engineer
- Don't add features the test doesn't require
- Don't worry about perfect code yet

```
# Run the test - it should pass now
# If it doesn't, fix the implementation (not the test)
```

### 3. REFACTOR - Clean Up

Now improve the code while keeping tests green:
- Remove duplication
- Improve naming
- Simplify logic
- Extract methods/classes if needed

```
# Run tests after each refactoring step
# Tests must stay green throughout
```

## Test Structure

Use the **Arrange-Act-Assert** pattern:

```
Arrange: Set up test conditions and inputs
Act:     Execute the code under test
Assert:  Verify the expected outcome
```

## What To Test

### DO Test:
- Business logic and rules
- Edge cases and boundary conditions
- Error handling paths
- Public interfaces and contracts

### DON'T Test:
- Framework code (it's already tested)
- Private methods directly (test through public interface)
- Trivial code (simple getters/setters)
- External services (mock them)

## Test Naming

Name tests to describe behavior, not implementation:

**Good:**
```
test_user_cannot_withdraw_more_than_balance
test_order_total_includes_tax_when_applicable
test_expired_token_returns_unauthorized
```

**Bad:**
```
test_withdraw_method
test_calculate_total
test_validate_token
```

## Bug Fix Protocol

When fixing a bug:

1. **Write a test that reproduces the bug** (RED)
   - The test should fail, proving the bug exists

2. **Fix the bug** (GREEN)
   - Make the minimal change to pass the test

3. **Verify no regression** (REFACTOR)
   - Run full test suite
   - Check related functionality

This ensures:
- The bug is documented
- It can't reappear silently
- You understand the root cause

## Test Quality Checklist

Before considering a test complete:

- [ ] Test fails without the implementation
- [ ] Test passes with the implementation
- [ ] Test name describes the behavior
- [ ] Test is independent (no shared state)
- [ ] Test is fast (< 100ms for unit tests)
- [ ] Test has clear arrange/act/assert sections
- [ ] Edge cases are covered

## Common Mistakes

### 1. Writing Implementation First
❌ "I'll write tests after the code works"
✅ Write the test FIRST, then make it pass

### 2. Testing Too Much at Once
❌ One test covering multiple behaviors
✅ One focused test per behavior

### 3. Testing Implementation Details
❌ Testing that a specific private method was called
✅ Testing the observable behavior/output

### 4. Ignoring Failing Tests
❌ Commenting out or skipping failing tests
✅ Fix the code or update the test (with good reason)

### 5. Not Running Tests Frequently
❌ Writing lots of code, then running tests
✅ Run tests after every small change

## When To Skip TDD

TDD may be skipped ONLY for:
- Exploratory/spike code (but add tests before merging)
- Pure UI layout (visual testing preferred)
- Generated code (test the generator instead)

Document in commit message why TDD was skipped.

## Integration with CI

All tests must pass before:
- Merging pull requests
- Deploying to any environment
- Considering a task "done"

## Further Reading

- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530) - Kent Beck
- [Growing Object-Oriented Software, Guided by Tests](http://www.growing-object-oriented-software.com/) - Freeman & Pryce
