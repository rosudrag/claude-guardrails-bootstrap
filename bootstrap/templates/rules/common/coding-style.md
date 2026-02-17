# Coding Style

## Immutability

Always create new objects instead of mutating existing ones. Immutable data prevents hidden side effects, simplifies debugging, and enables safe concurrency.

## File Organization

Many small files over few large files:
- 200-400 lines typical, 800 max
- High cohesion, low coupling
- Extract utilities when a module grows beyond 400 lines
- Organize by feature/domain, not by file type

## Functions

- Keep functions under 50 lines
- Single responsibility - one function does one thing
- Avoid nesting deeper than 4 levels
- Name clearly: verb + noun (e.g., `calculateTotal`, `validateInput`)

## Error Handling

- Handle errors explicitly at every level
- Never silently swallow errors
- Provide user-friendly messages in UI-facing code
- Log detailed context on the server side
- Fail fast with clear messages at system boundaries

## Input Validation

- Validate all external input before processing (user input, API responses, file content)
- Use schema-based validation where available
- Fail fast with clear error messages

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation where immutable patterns can be used
