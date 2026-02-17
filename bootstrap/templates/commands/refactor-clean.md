# /refactor-clean - Dead Code Removal

Detect and safely remove dead code, unused dependencies, and duplicates.

## Instructions

You are a codebase cleaner. Remove dead weight methodically — one item at a time, tests after each removal.

### Step 1: Detect Dead Code

Run language-appropriate detection tools:

```
JavaScript/TypeScript: npx knip, npx depcheck, npx ts-prune
Python:               vulture, pip-extra-reqs, autoflake --check
Go:                   staticcheck, deadcode
Ruby:                 debride, unused
General:              grep for unused imports, unreferenced files
```

Collect all findings before removing anything.

### Step 2: Categorize by Safety Tier

Sort every finding into one of three tiers:

```
SAFE     — Unused private functions, unreferenced local variables,
           unused test helpers, dead branches behind constant flags

CAUTION  — Unused exports (may have dynamic importers),
           unused dependencies (may be peer/optional),
           unused CSS classes (may be referenced in JS)

DANGER   — Config files, entry points, public API exports,
           anything referenced in build scripts or CI
```

### Step 3: Remove SAFE Items

For each SAFE item:

1. Remove the dead code
2. Run {{test_command}}
3. If tests fail, revert immediately and recategorize as CAUTION
4. Record what was removed and lines saved

### Step 4: Review CAUTION Items

For each CAUTION item:

1. Search the entire codebase for dynamic references (string literals, reflection, config)
2. Check build scripts, CI configs, and documentation
3. If confirmed dead, remove and run {{test_command}}
4. If uncertain, skip and note for human review

### Step 5: Skip DANGER Items

List all DANGER items in the report for human decision. Do NOT remove them.

### Step 6: Consolidate Duplicates

After dead code is cleaned:

1. Search for near-duplicate functions (same logic, different names)
2. Propose consolidation — do NOT auto-merge without confirmation
3. If approved, consolidate one at a time, testing after each

### Step 7: Report

```
## Cleanup Report

### Removed (SAFE)
- [file:line] — [description] (X lines)

### Removed (CAUTION — verified)
- [file:line] — [description] (X lines)

### Skipped (uncertain CAUTION + all DANGER items)
- [file:line] — [description] — Reason: [why skipped]

### Duplicates Found
- [function A] ≈ [function B] — [suggested action]

### Summary
Lines removed: [N] | Files deleted: [N] | Dependencies removed: [N]
```

## Constraints

- NEVER run during active feature development — only on a clean branch
- NEVER remove DANGER items without explicit human approval
- ALWAYS run {{test_command}} after EVERY single removal
- Remove ONE item at a time — never batch deletions
- If tests fail after a removal, revert immediately before continuing
- Do not remove code that has TODO/FIXME/HACK comments — flag it instead
