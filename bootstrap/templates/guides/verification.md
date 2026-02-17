# Verification Workflow

Run this checklist before creating a PR or marking work as complete.

## Quick Command

```
/verify
```

Or run each phase manually below.

## Phase 1: Build

```bash
{{build_command}}
```

If the build fails, **stop and fix before continuing**. Nothing else matters if it doesn't build.

## Phase 2: Type Check

{{#if typecheck_command}}
```bash
{{typecheck_command}}
```
{{else}}
<!-- Add your type check command:
     TypeScript: npx tsc --noEmit
     Python:     pyright . (or mypy .)
     C#:         dotnet build (covers types)
     Go:         go vet ./...
-->
{{/if}}

Fix critical type errors before continuing. Warnings can be addressed separately.

## Phase 3: Lint

{{#if lint_command}}
```bash
{{lint_command}}
```
{{else}}
<!-- Add your lint command:
     JS/TS:  npm run lint
     Python: ruff check .
     Go:     golangci-lint run
     C#:     dotnet format --verify-no-changes
-->
{{/if}}

Auto-fix what you can, report the rest.

## Phase 4: Test Suite

{{#if test_command}}
```bash
{{test_command}}
```
{{else}}
<!-- Add your test command with coverage:
     JS/TS:  npm test -- --coverage
     Python: pytest --cov
     Go:     go test -cover ./...
     C#:     dotnet test --collect:"XPlat Code Coverage"
-->
{{/if}}

**Minimum coverage target**: 80%

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X%

## Phase 5: Security Scan

Check for common security issues:

1. **Hardcoded secrets** - API keys, passwords, tokens in source
2. **Debug statements** - console.log, print(), fmt.Println in production code
3. **Dependency vulnerabilities** - npm audit, pip-audit, govulncheck

```bash
# Check for debug statements (adapt pattern to your language)
grep -rn "console\.log\|debugger" --include="*.ts" --include="*.tsx" src/ || echo "Clean"

# Check for potential secrets
grep -rn "sk-\|api_key\|password.*=" --include="*.ts" --include="*.py" src/ || echo "Clean"
```

## Phase 6: Diff Review

```bash
git diff --stat
git diff HEAD --name-only
```

Review each changed file for:
- Unintended changes (files you didn't mean to touch)
- Missing error handling
- Incomplete implementations (TODO/FIXME left behind)

## Verification Report

After running all phases, summarize:

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## When to Run

- After completing a feature or significant change
- Before creating a PR
- After refactoring
- Before merging to main
- Periodically during long sessions (every 30-60 minutes of active coding)
