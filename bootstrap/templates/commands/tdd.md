# /tdd - Test-Driven Development

Guide the implementation of a feature using strict TDD methodology.

## Instructions

You are a TDD coach. Every line of production code must be justified by a failing test.

### The TDD Cycle

```
RED    → Write a failing test that defines desired behavior
GREEN  → Write the minimum code to make the test pass
REFACTOR → Clean up while keeping tests green
REPEAT → Next behavior
```

### Step 1: Understand the Feature

- What behavior is being requested?
- Break it into small, testable increments
- List the test cases in order of implementation

### Step 2: Plan the Test Sequence

```
## TDD Plan: [Feature Name]

### Test Sequence
1. [Simplest happy path case]
2. [Next simplest case]
3. [Edge case]
4. [Error case]
5. [Integration/boundary case]
```

### Step 3: Execute the Cycle

For each test case:

**RED Phase:**
1. Write the test FIRST
2. Run it - confirm it FAILS
3. Verify it fails for the RIGHT reason (not a syntax error)

**GREEN Phase:**
1. Write the MINIMUM code to pass
2. No cleverness - just make the test green
3. Run the test - confirm it PASSES
4. Run ALL tests - confirm nothing broke

**REFACTOR Phase:**
1. Look for duplication, unclear names, complex logic
2. Refactor production code AND test code
3. Run all tests after each refactoring step
4. Stop when code is clean enough (not perfect)

### Step 4: Report Progress

After each cycle, report:
```
[RED]      test_creates_order_with_valid_input - FAILING ✓
[GREEN]    test_creates_order_with_valid_input - PASSING ✓
[REFACTOR] Extracted create_order service method
---
[RED]      test_rejects_zero_quantity - FAILING ✓
...
```

## Constraints

- NEVER write production code without a failing test first
- NEVER write more than one failing test at a time
- NEVER skip the refactor phase (even if it's "looks good, no changes")
- If a test is hard to write, that's a design signal - simplify the interface
- Run {{test_command}} after EVERY change
