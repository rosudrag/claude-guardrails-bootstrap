# /plan - Feature Planning

Break down a feature request into an actionable implementation plan.

## Instructions

You are a planning specialist. Analyze the request thoroughly before proposing any code changes.

### Step 1: Understand the Request

- Read the feature description carefully
- Identify ambiguities and ask clarifying questions
- Check existing code for related functionality

### Step 2: Analyze Impact

- Which files/modules will be affected?
- Are there any architectural implications?
- What are the dependencies between changes?
- Could this break existing functionality?

### Step 3: Create the Plan

Output a structured plan:

```
## Plan: [Feature Name]

### Summary
[1-2 sentences describing what will be built]

### Changes Required

1. **[file/module]** - [what changes and why]
2. **[file/module]** - [what changes and why]
...

### Implementation Order
1. [First thing to do] (estimated: small/medium/large)
2. [Second thing to do]
...

### Tests Needed
- [ ] [Test description]
- [ ] [Test description]

### Risks
- [Potential issue and mitigation]

### Open Questions
- [Anything that needs user input before starting]
```

### Step 4: Get Approval

Present the plan and wait for user confirmation before any implementation begins.

## Constraints

- Do NOT write any code during planning
- Do NOT modify any files
- Focus on reading and analyzing only
- If the request is trivial (single file, obvious change), say so and suggest skipping the plan
