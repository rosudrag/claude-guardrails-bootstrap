# Serena Best Practices

Getting the most out of Serena MCP for semantic code understanding.

## What Serena Provides

Serena is a Model Context Protocol (MCP) server that gives Claude semantic understanding of code:

| Capability | What It Does |
|------------|--------------|
| Symbol Search | Find classes, functions, methods by name |
| Reference Finding | Find all usages of a symbol |
| Semantic Navigation | Jump to definitions, implementations |
| Memory System | Persist knowledge across sessions |

## Configuration

### project.yml Setup

Location: `.serena/project.yml`

```yaml
project_name: "your-project"
language: "typescript"  # or csharp, python, go, rust, etc.

include_patterns:
  - "src/**/*.ts"
  - "lib/**/*.ts"

exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - "*.test.ts"  # Optional: exclude tests for faster indexing
  - "*.spec.ts"

use_gitignore: true  # Respect .gitignore
```

### Language-Specific Tips

**TypeScript/JavaScript:**
```yaml
include_patterns:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - ".next/**"
```

**C#:**
```yaml
include_patterns:
  - "**/*.cs"
exclude_patterns:
  - "**/bin/**"
  - "**/obj/**"
  - "**/*.Designer.cs"  # Generated files
```

**Python:**
```yaml
include_patterns:
  - "**/*.py"
exclude_patterns:
  - "**/__pycache__/**"
  - "**/venv/**"
  - "**/.venv/**"
  - "**/site-packages/**"
```

## Memory System

### What Are Memories?

Memories are markdown files that persist knowledge across Claude sessions. They're stored in `.serena/memories/`.

### When to Create Memories

Create a memory when you:
- Discover non-obvious behavior
- Complete a deep investigation
- Learn how a complex system works
- Find a bug and its root cause
- Document integration patterns

### Memory File Structure

```markdown
# Title: Brief Description

## Context
What prompted this investigation/discovery.

## Findings
What was learned.

### Key Points
- Point 1
- Point 2

### Code References
- `src/path/to/file.ts:123` - Description
- `src/other/file.ts:456` - Description

## Implications
How this affects development.

## Related
- Links to other memories
- Links to ADRs
- Links to external docs
```

### Memory Naming Conventions

Use descriptive, searchable names:

```
✅ Good names:
- authentication-flow-analysis.md
- payment-webhook-integration.md
- database-connection-pooling.md
- user-permission-system.md

❌ Bad names:
- notes.md
- investigation.md
- stuff-i-learned.md
- 2024-01-15.md
```

### Memory Organization

For large projects, use prefixes to group memories:

```
.serena/memories/
├── arch-*.md          # Architecture discoveries
├── bug-*.md           # Bug investigations
├── integration-*.md   # External integrations
├── perf-*.md          # Performance findings
└── domain-*.md        # Business domain knowledge
```

## Effective Symbol Searches

### Finding Symbols

```
# Find a class
find_symbol: UserService

# Find a method in a class
find_symbol: UserService.createUser

# Find with pattern
find_symbol: *Repository  # All repositories
find_symbol: handle*      # All handlers
```

### Finding References

When you need to understand usage:

```
# Find all usages of a function
find_references: validateEmail

# Find who calls a method
find_references: UserService.authenticate
```

### Navigation Patterns

**Top-Down Exploration:**
1. Find entry point (controller, route handler)
2. Follow to service layer
3. Follow to repository/data layer

**Bottom-Up Exploration:**
1. Find data model
2. Find references to understand usage
3. Trace up to business logic

**Feature Tracing:**
1. Find test for feature
2. Trace through tested code path
3. Understand dependencies

## Common Workflows

### Understanding a Feature

```
1. find_symbol: FeatureName
   → Get overview of related symbols

2. Read the main class/function body
   → Understand core logic

3. find_references: MainClass
   → See how it's used

4. Check tests for expected behavior
   → Understand edge cases

5. Create memory if significant
   → Preserve understanding
```

### Investigating a Bug

```
1. find_symbol: AffectedComponent
   → Locate the code

2. Read and understand the logic
   → Form hypothesis

3. find_references: SuspiciousFunction
   → Check for misuse

4. Verify in tests
   → Confirm behavior

5. Document in memory
   → bug-[name].md
```

### Refactoring Safely

```
1. find_symbol: TargetClass
   → Understand current state

2. find_references: TargetClass
   → Find all usages

3. Plan changes
   → List affected files

4. Update with confidence
   → All impacts are known
```

## Performance Tips

### Indexing

- Exclude generated files (faster indexing)
- Exclude tests if not needed for current task
- Exclude node_modules/vendor directories

### Query Efficiency

- Be specific in symbol searches
- Use exact names when known
- Use patterns only when exploring

### Memory Management

- Keep memories focused (one topic each)
- Archive old memories if they pile up
- Reference rather than duplicate

## Troubleshooting

### Symbol Not Found

Possible causes:
- File not in include_patterns
- File in exclude_patterns
- Index needs refresh
- Symbol name is different than expected

Solutions:
1. Check project.yml patterns
2. Run `serena-mcp reindex`
3. Search for partial name

### Slow Performance

Possible causes:
- Too many files indexed
- Large generated files
- No gitignore integration

Solutions:
1. Add exclude_patterns for large/generated files
2. Enable use_gitignore: true
3. Be more specific in searches

### Memory Not Persisting

Possible causes:
- Memory file not saved
- Invalid markdown syntax
- File permissions issue

Solutions:
1. Check .serena/memories/ directory exists
2. Validate markdown formatting
3. Check file was written successfully

## Integration with Guardrails

Serena memories complement other guardrails:

| Discovery Type | Where to Document |
|---------------|-------------------|
| Temporary investigation | Serena memory |
| Architectural decision | ADR |
| Process/workflow | claude-docs/ guide |
| Quick reference | CLAUDE.md |

Use memories for knowledge discovery, ADRs for decisions.
