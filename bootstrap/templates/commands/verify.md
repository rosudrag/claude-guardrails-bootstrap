# /verify - Pre-PR Verification

Run a comprehensive verification loop before creating a PR or committing.

## Instructions

Execute each verification phase in order. Stop at the first failure and fix it before continuing.

### Phase 1: Build

```bash
{{build_command}}
```

**If fails**: Fix build errors before proceeding. Do not skip.

### Phase 2: Type Check (if applicable)

```bash
{{typecheck_command}}
```

**If fails**: Fix type errors. Do not use `any`, `@ts-ignore`, or `# type: ignore` to suppress.

### Phase 3: Lint

```bash
{{lint_command}}
```

**If fails**: Fix lint violations. Auto-fix where possible, manual fix where needed.

### Phase 4: Test Suite

```bash
{{test_command}}
```

**If fails**: Fix failing tests. If a test is legitimately wrong (testing old behavior), update it with a comment explaining why.

### Phase 5: Security Scan

Check for common security issues in changed files:
- Hardcoded secrets (API keys, passwords, tokens)
- SQL injection vulnerabilities
- Unvalidated user input at system boundaries
- Exposed sensitive data in logs or error messages

### Phase 6: Diff Review

```bash
git diff --stat
git diff
```

Review the full diff for:
- [ ] Debug statements (console.log, print, debugger)
- [ ] Commented-out code
- [ ] TODO/FIXME without issue references
- [ ] Files that shouldn't be committed (.env, credentials, binaries)
- [ ] Unintended changes (formatting-only diffs, unrelated modifications)

### Output

```
## Verification Report

| Phase | Status | Details |
|-------|--------|---------|
| Build | PASS/FAIL | [details if failed] |
| Types | PASS/FAIL/SKIP | [details] |
| Lint | PASS/FAIL | [details] |
| Tests | PASS/FAIL | [X passed, Y failed] |
| Security | PASS/WARN | [findings] |
| Diff Review | PASS/WARN | [findings] |

**Result**: READY / NOT READY
```

## Constraints

- Run ALL phases, even if early ones pass
- Do not suppress warnings to make things pass
- Fix issues inline rather than creating follow-up tasks
- If a fix would be too large, flag it and explain why
