# Research Workflow

How to investigate and learn when facing uncertainty.

## The Core Principle

> **Never assume. Always verify.**

When you're not 100% certain about how something works, research it before writing code.

## When To Research

Research is needed when:

- You're unsure how a library/framework feature works
- You're modifying code you haven't fully read
- You're integrating with external systems or APIs
- You're encountering unfamiliar patterns in the codebase
- Something "should work" but doesn't

## Research Escalation Ladder

Start at step 1 and escalate as needed:

### 1. Check Existing Documentation

**Location**: `docs/`, `README.md`, code comments, ADRs

Questions to answer:
- Has this been documented already?
- Is there an ADR explaining why things are this way?
- Are there examples in the codebase?

Time budget: 5 minutes

### 2. Search the Codebase

**Tools**: Grep, Serena MCP, IDE search

Look for:
- Similar implementations elsewhere
- Usage patterns of the library/function
- Tests that demonstrate expected behavior
- Configuration files that define behavior

```
# Find usage patterns
grep -r "function_name" --include="*.ts"

# Find tests
grep -r "describe.*FeatureName" tests/
```

Time budget: 10 minutes

### 3. Read the Source

**When**: Internal code that's unclear

Steps:
1. Find the entry point
2. Trace the execution path
3. Note any side effects or dependencies
4. Look at related tests for expected behavior

Use Serena MCP for semantic navigation:
- Find symbol definitions
- Find references and usages
- Understand class hierarchies

Time budget: 15-30 minutes

### 4. Check External Documentation

**Sources**: Official docs, GitHub repos, API references

For libraries:
- Official documentation
- GitHub README
- Changelog (for recent changes)
- GitHub issues (for known problems)

For APIs:
- API documentation
- OpenAPI/Swagger specs
- Postman collections
- Example responses

Time budget: 15 minutes

### 5. Experiment and Verify

**When**: Documentation is unclear or missing

Create a minimal test:
```
# Write a small test to verify behavior
test("library behaves as expected", () => {
    const result = libraryFunction(input)
    // See what actually happens
    console.log(result)
    expect(result).toEqual(expected)
})
```

Or create a scratch file:
```
# Quick experiment
const lib = require('the-library')
console.log(lib.mysteryFunction({ test: true }))
```

Time budget: 15 minutes

### 6. Ask for Help

**When**: Research hasn't yielded answers

Before asking:
- Document what you've tried
- State what you expected vs. what happened
- Include relevant error messages/output

Who to ask:
- Team members familiar with the area
- Stack Overflow (with proper search)
- Library maintainers (GitHub issues)

## Document Your Findings

After researching, capture what you learned:

### For Significant Discoveries

Create a Serena memory:
```
.serena/memories/discovery-name.md

# Discovery: How X Actually Works

## Context
What I was trying to do when I discovered this.

## Finding
What I learned about how X works.

## Evidence
- Code references
- Documentation links
- Test results

## Implications
How this affects our codebase.
```

### For Architectural Decisions

Create an ADR:
```
docs/adrs/NNN-title.md
```

See ADR template for format.

### For Code Understanding

Add comments explaining "why":
```
// OrderService uses optimistic locking because concurrent updates
// are common in peak hours. See: docs/adrs/015-concurrency-strategy.md
```

## Research Checklist

Before writing code that you researched:

- [ ] I understand what the code does
- [ ] I understand why it does it that way
- [ ] I've verified my understanding (test/experiment)
- [ ] I've documented significant findings
- [ ] I know the edge cases and failure modes

## Anti-Patterns

### Copy-Paste from Stack Overflow
❌ Copy code without understanding it
✅ Understand it first, then adapt to your context

### Assuming Documentation is Current
❌ Trust documentation blindly
✅ Verify behavior, especially for older docs

### Skipping Research "To Save Time"
❌ "I'll figure it out as I go"
✅ Research upfront saves debugging time later

### Not Documenting Findings
❌ Research, implement, move on
✅ Research, document, implement (others will thank you)

## Time Boxes

Research should be time-boxed to avoid rabbit holes:

| Research Type | Max Time |
|--------------|----------|
| Quick lookup | 10 min |
| Feature understanding | 30 min |
| Deep investigation | 1 hour |
| Unknown territory | 2 hours, then ask for help |

If you exceed the time box:
1. Document what you've learned so far
2. Document what's still unclear
3. Escalate to the team
