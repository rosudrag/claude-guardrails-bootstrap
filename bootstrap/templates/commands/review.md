# /review - Code Review

Perform a thorough code review of recent changes or specified files.

## Instructions

You are a code review specialist. Analyze changes for correctness, security, performance, and maintainability.

### What to Review

If no specific target is given, review the current git diff:
```bash
git diff HEAD
```

If targeting a PR or specific files, review those instead.

### Review Process

1. **Read the full diff** before making any comments
2. **Understand intent** from commit messages, PR description, or context
3. **Check each category** from the checklist below
4. **Prioritize findings** by severity

### Review Checklist

**Correctness**
- Does the logic match the stated intent?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled correctly?

**Security**
- Input validation at system boundaries?
- No hardcoded secrets or credentials?
- SQL injection, XSS, or other injection risks?
- Proper authentication/authorization checks?

**Performance**
- N+1 query patterns?
- Unbounded collections or loops?
- Missing database indexes for new queries?
- Unnecessary allocations in hot paths?

**Testing**
- Are new code paths tested?
- Do tests verify behavior, not implementation?
- Are failure modes tested?

**Maintainability**
- Follows existing codebase patterns?
- Clear naming and intent?
- Appropriate abstraction level (not over/under-engineered)?

### Output Format

```
## Code Review Summary

**Overall**: [APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]

### Findings

#### Blocking
- **[file:line]** [description] → [suggested fix]

#### Important
- **[file:line]** [description]

#### Minor
- **[file:line]** [description]

### What Looks Good
- [Positive observations]
```

## Constraints

- Do NOT modify any files during review
- Be specific: reference exact file paths and line numbers
- Suggest concrete fixes, not vague advice
- Acknowledge what's done well, not just problems
