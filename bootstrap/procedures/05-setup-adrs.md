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

If found, ask user how to proceed:

> "I found existing ADRs at `{{path}}`. Should I:
> 1. **Add template** - Add the ADR template to your existing structure
> 2. **Skip** - Leave your ADR structure unchanged"

### 2. Create ADR Directory [AUTO if not exists]

```bash
mkdir -p docs/adrs
```

### 3. Create ADR README [AUTO]

Create `docs/adrs/README.md`:

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

### 4. Create ADR Template [AUTO]

Create `docs/adrs/000-template.md`:

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

### 5. Create Initial ADRs [INTERACTIVE]

Ask user:

> "Would you like me to create any initial ADRs for your project? Common starting points:
> - [ ] ADR-001: Technology Stack (document current choices)
> - [ ] ADR-002: Project Structure (document directory organization)
> - [ ] ADR-003: Testing Strategy (document testing approach)
>
> You can also create these later using the template."

If user wants initial ADRs, create them with basic structure filled in based on project analysis.

### 6. Report to User [CONFIRM]

> "I've set up the ADR structure at `docs/adrs/`:
> - `README.md` - Index and instructions
> - `000-template.md` - Template for new ADRs
> {{#if initial_adrs}}
> - Initial ADRs: {{list}}
> {{/if}}
>
> Use ADRs to document significant architectural decisions. They help me understand your project's constraints and conventions."

## Best Practices for ADRs

Include these tips in the README or mention to user:

1. **Write ADRs for decisions, not options** - Document what you decided, not what you might do
2. **Keep them immutable** - Don't edit old ADRs; supersede them with new ones
3. **Link from code** - Reference ADR numbers in code comments for context
4. **Review periodically** - Mark outdated ADRs as deprecated

## Output

- Creates `docs/adrs/` directory
- Creates `README.md` with index
- Creates `000-template.md`
- Optionally creates initial ADRs
