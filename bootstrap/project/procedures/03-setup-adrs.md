# Procedure: Setup ADRs

Initialize Architecture Decision Records structure.

## What Are ADRs?

Architecture Decision Records document significant technical decisions:
- **What** was decided
- **Why** it was decided (context, constraints)
- **Consequences** (tradeoffs, implications)

They create a searchable history of architectural choices that helps AI understand project conventions.

## Steps

### 1. Check for Existing ADRs [AUTO]

Look for existing ADR structures:
- `docs/adrs/`
- `docs/adr/`
- `adr/`
- `ADR/`

If found:
- Add the ADR template to the existing structure (if template missing)
- Skip creating new directory structure
- Preserve all existing content

### 2. Create ADR Directory [AUTO if not exists]

```bash
mkdir -p docs/adrs
```

### 3. Create ADR README [AUTO if not exists]

Create `docs/adrs/README.md` (skip if already exists):

```markdown
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for {{project_name}}.

## What is an ADR?

An ADR documents a significant architectural decision:
- The context and problem
- The decision made
- The consequences and tradeoffs

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [000](000-template.md) | ADR Template | Template |

## Creating a New ADR

1. Copy `000-template.md` to `NNN-title.md` (next number)
2. Fill in all sections
3. Add to the index above
4. Commit with message: "docs: add ADR-NNN title"

## Status Values

- **Proposed** - Under discussion
- **Accepted** - Decision made, being implemented
- **Deprecated** - No longer applies
- **Superseded** - Replaced by another ADR
```

### 4. Create ADR Template [AUTO if not exists]

Create `docs/adrs/000-template.md` (skip if already exists):

```markdown
# ADR-NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX

**Date**: YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
-

### Negative
-

### Neutral
-

## Alternatives Considered

What other options were considered? Why were they rejected?

### Alternative 1: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

## References

- Links to relevant documentation, discussions, or external resources
```

### 5. Log Completion [AUTO]

Log what was created:

> "ADR structure set up at `docs/adrs/`:
> - `README.md` - Index and instructions {{created/skipped}}
> - `000-template.md` - Template for new ADRs {{created/skipped}}
>
> Use ADRs to document significant architectural decisions."

## Best Practices for ADRs

Include these tips in the README or mention to user:

1. **Write ADRs for decisions, not options** - Document what you decided, not what you might do
2. **Keep them immutable** - Don't edit old ADRs; supersede them with new ones
3. **Link from code** - Reference ADR numbers in code comments for context
4. **Review periodically** - Mark outdated ADRs as deprecated

## Error Handling

### Cannot Create Directory

If directory creation fails:
1. Log error with details
2. Record in manifest: `"adrs": { "skipped": true, "reason": "directory_creation_failed" }`
3. Continue with next procedure

### Cannot Write Files

If file writes fail:
1. Log which files succeeded and which failed
2. Record partial progress in manifest
3. Continue with next procedure

### Existing Structure Uses Different Convention

If existing ADRs use different naming (e.g., `ADR-001` vs `001-`):
1. Adapt template filename to match existing convention
2. Preserve existing structure
3. Log the detected convention

## Output

- Creates `docs/adrs/` directory (if not exists)
- Creates `README.md` with index (if not exists)
- Creates `000-template.md` (if not exists)

## Self-Verification Checklist

Before proceeding to the next step, verify:

- [ ] ADR directory exists (new or pre-existing)
- [ ] `README.md` exists in ADR directory
- [ ] Template file exists in ADR directory
- [ ] Manifest updated with ADR setup status

Proceed to next step regardless of which files were created vs skipped.
