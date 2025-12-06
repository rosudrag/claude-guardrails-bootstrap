# Guardrail Principles

The philosophy behind AI-assisted development guardrails.

## Why Guardrails?

AI coding assistants are powerful but need guidance to be effective. Without guardrails:

- AI may make assumptions that don't fit your project
- Code quality can be inconsistent
- Technical debt accumulates silently
- Knowledge isn't captured systematically

Guardrails provide:

- **Context** - AI understands your project's specifics
- **Constraints** - AI follows your team's standards
- **Consistency** - Similar problems get similar solutions
- **Continuity** - Knowledge persists across sessions

## The Guardrail Stack

```
┌─────────────────────────────────────────┐
│             CLAUDE.md                    │ ← Entry point, overview
├─────────────────────────────────────────┤
│           claude-docs/                   │ ← Detailed guides
├─────────────────────────────────────────┤
│              ADRs                        │ ← Decision history
├─────────────────────────────────────────┤
│         Serena Memories                  │ ← Discovered knowledge
├─────────────────────────────────────────┤
│        Specialized Agents                │ ← Domain expertise
└─────────────────────────────────────────┘
```

Each layer adds depth:
1. **CLAUDE.md** - Quick reference, links to details
2. **claude-docs/** - Full guides for complex topics
3. **ADRs** - Why things are done certain ways
4. **Memories** - Project-specific discoveries
5. **Agents** - Specialized expertise on demand

## Core Principles

### 1. Progressive Disclosure

Don't dump everything in one file. Layer information:

- **Level 1 (CLAUDE.md)**: What you need 80% of the time
- **Level 2 (claude-docs/)**: Detailed procedures
- **Level 3 (ADRs/Memories)**: Historical context and deep knowledge

AI navigates to deeper levels when needed.

### 2. Explicit Over Implicit

State things clearly rather than assuming AI will figure it out:

```
❌ "Follow best practices"
✅ "Use the Repository pattern for data access (see ADR-005)"

❌ "Write clean code"
✅ "Maximum function length: 30 lines. See claude-docs/code-quality.md"
```

### 3. Examples Over Descriptions

Show, don't just tell:

```
❌ "Use meaningful variable names"
✅ "Use meaningful variable names:
    - ❌ d (what is d?)
    - ✅ daysSinceLastLogin"
```

### 4. Actionable Guidance

Every instruction should be actionable:

```
❌ "Consider performance implications"
✅ "Before adding N+1 queries, check claude-docs/performance.md for batching patterns"
```

### 5. Living Documentation

Guardrails evolve with the project:

- Update CLAUDE.md when patterns change
- Add ADRs for new decisions
- Create memories for discoveries
- Remove outdated guidance

## Guardrail Design Patterns

### Decision Trees

For complex choices, provide decision paths:

```markdown
## Choosing a Data Store

Need persistence?
├── No → Use in-memory store
└── Yes → Need transactions?
    ├── Yes → Use PostgreSQL
    └── No → Need document flexibility?
        ├── Yes → Use MongoDB
        └── No → Use PostgreSQL
```

### Checklists

For processes, provide step-by-step verification:

```markdown
## Before Merging Checklist
- [ ] Tests pass locally
- [ ] Tests pass in CI
- [ ] No new warnings
- [ ] Documentation updated
- [ ] ADR created if architectural change
```

### Pattern Libraries

For recurring problems, document solutions:

```markdown
## Common Patterns

### Retrying Failed Operations
Use the RetryPolicy from src/utils/retry.ts:
[code example]

### Validating User Input
Use the ValidationPipeline pattern:
[code example]
```

### Anti-Pattern Warnings

Call out known pitfalls:

```markdown
## Don't Do This

❌ Direct database access in controllers
   Why: Violates layer separation
   Instead: Use repository pattern

❌ Catching and ignoring exceptions
   Why: Hides bugs
   Instead: Log and rethrow or handle specifically
```

## Measuring Guardrail Effectiveness

Good guardrails lead to:

- **Fewer clarifying questions** - AI knows what to do
- **Consistent code style** - Patterns are followed
- **Faster onboarding** - New team members (and AI) ramp up quickly
- **Reduced rework** - Decisions are documented, not repeated

## Maintaining Guardrails

### Regular Review

Quarterly, review guardrails for:
- Outdated information
- Missing common scenarios
- Overly restrictive rules
- Gaps in coverage

### Feedback Loop

When AI makes a mistake:
1. Was the guidance clear?
2. Was the guidance present?
3. Update guardrails to prevent recurrence

### Version Control

Guardrails are code - treat them that way:
- Review changes in PRs
- Commit messages explain "why"
- Don't edit history (supersede instead)

## Common Mistakes

### Over-Documentation

❌ Documenting every trivial decision
✅ Document decisions that:
   - Are non-obvious
   - Have been debated
   - Will be questioned later

### Under-Maintenance

❌ "Set it and forget it" guardrails
✅ Regular review and updates

### One-Size-Fits-All

❌ Generic rules that don't fit the project
✅ Project-specific guidance with rationale

### Enforcement Without Understanding

❌ "Do this because I said so"
✅ "Do this because [specific reason]"
