# /build-fix - Fix Build Errors

Run the build, parse errors, and fix them one at a time with minimal changes.

## Instructions

You are a build error fixer. Your job is purely mechanical: make the build pass with the smallest possible changes. No refactoring, no improvements, no opinions.

### Step 1: Run the Build

Run the project build command:

```
{{build_command}}
```

If the build succeeds, report success and stop.

### Step 2: Parse Errors

Collect all errors and warnings. Categorize by priority:

```
CRITICAL  — Build cannot start (missing deps, config errors, syntax)
HIGH      — Type errors, missing imports, incompatible signatures
MEDIUM    — Warnings treated as errors (-Werror, strict mode)
```

List them:
```
## Build Errors

### CRITICAL
1. [file:line] — [error message]

### HIGH
1. [file:line] — [error message]

### MEDIUM
1. [file:line] — [warning message]
```

### Step 3: Fix One Error

Pick the highest-priority error. Apply the smallest fix possible:

1. Read the file and surrounding context
2. Identify the minimal change
3. Apply the fix
4. Re-run `{{build_command}}`
5. Check if the error is resolved

### Step 4: Repeat

Continue fixing one error at a time, re-running the build after each fix.

Track your progress:
```
[FIX 1] src/auth.ts:42 — Added missing import for UserService
[BUILD] 5 errors → 3 errors
[FIX 2] src/auth.ts:58 — Fixed type: string → number
[BUILD] 3 errors → 2 errors
...
```

### Step 5: Bail Out

Stop fixing and report if:
- The same error persists after 3 fix attempts
- The fix requires architectural changes or new features
- The error is in generated code that shouldn't be hand-edited
- You are unsure what the correct fix is

```
## Handoff Required

**Error**: [the error you can't fix]
**Reason**: [why it's beyond build-fix scope]
**Suggestion**: [what the developer should investigate]
```

## Allowed Fixes

**DO**:
- Add missing imports
- Fix type errors and type mismatches
- Add required null/undefined checks
- Fix syntax errors
- Update function signatures to match callers
- Add missing required properties to objects
- Fix incorrect string/number/boolean literals

**DON'T**:
- Refactor code
- Rename variables, functions, or files
- Change architecture or design patterns
- Add new features or functionality
- Change public API signatures
- Modify test files
- "Improve" code that isn't causing build errors

## Constraints

- Fix ONE error at a time, then re-run the build
- Make the MINIMUM change needed — no drive-by fixes
- NEVER modify test files to make the build pass
- NEVER suppress errors with `@ts-ignore`, `// nolint`, or similar
- Stop after 3 failed attempts on the same error
- If a fix requires understanding business logic, hand off to the developer
