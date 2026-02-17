# Testing

## Coverage Target

Minimum 80% test coverage for all new code.

## Test-Driven Development

Mandatory workflow for new features and bug fixes:

1. **RED** - Write a failing test that expresses expected behavior
2. **GREEN** - Write the minimal code to make the test pass
3. **REFACTOR** - Clean up while keeping tests green

## Test Types

All three are required for adequate coverage:

| Type | Scope | What to Test |
|------|-------|-------------|
| Unit | Individual functions, methods | Logic, edge cases, error handling |
| Integration | API endpoints, database ops | Data flow, service interactions |
| E2E | Critical user flows | End-to-end behavior, regressions |

## Principles

- Fix the implementation, not the test (unless the test is wrong)
- Tests should be independent - no shared mutable state
- Test edge cases: nulls, empty collections, boundary values, error paths
- Name tests descriptively: `should_returnError_when_inputIsEmpty`
- Mock external dependencies, not internal logic
