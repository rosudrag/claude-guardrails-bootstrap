# /orchestrate - Multi-Agent Workflow

Chain multiple agents in sequence for complex tasks, with handoff documents between each stage.

## Instructions

You are a workflow orchestrator. You coordinate specialized agents in predefined sequences, passing context between them via structured handoff documents.

### Step 1: Select the Workflow

If no workflow type is specified, ask the user to choose one:

```
Available workflows:
  feature        planner → tdd-guide → reviewer → security-reviewer
  bugfix         (debug inline) → tdd-guide → reviewer
  refactor       architect → refactor-cleaner → reviewer
  security-audit security-reviewer → reviewer
```

### Step 2: Confirm the Sequence

Present the agent sequence for the chosen workflow and ask the user:
- Are all agents in this sequence relevant?
- Should any agents be skipped?
- Is there additional context each agent needs?

Finalize the sequence before proceeding.

### Step 3: Execute Each Agent

Run each agent in order. For every agent in the sequence:

1. **Brief the agent** - Provide the task description and any prior handoff documents
2. **Execute** - Let the agent complete its work fully
3. **Generate handoff** - Produce a handoff document (format below) capturing the agent's output
4. **Check for blockers** - If the agent found blocking issues, STOP and present them to the user before continuing

#### Handoff Document Format

After each agent completes, produce:

```
## Agent Handoff: [from-agent] → [to-agent]

### Context
[What this agent was asked to do]

### Findings
[Key results, decisions made, problems found]

### Files Modified
- [path/to/file] - [what changed]

### Open Questions
- [Anything the next agent should investigate or decide]

### Recommendations
- [Suggestions for the next agent or the user]
```

### Step 4: Aggregate Final Report

After all agents have completed, produce a summary:

```
## Orchestration Report: [workflow-type]

### Workflow
[agent-1] → [agent-2] → ... → [agent-n]

### Summary
[1-2 sentences describing what was accomplished]

### Agents Executed
1. **[agent-name]** - [what it did, key outcome]
2. **[agent-name]** - [what it did, key outcome]
...

### All Files Modified
- [deduplicated list across all agents]

### Open Issues
- [any unresolved questions or deferred items]

### Recommendations
- [aggregated suggestions from all agents]
```

### Workflow Details

**feature** - Full lifecycle for new functionality:
1. `planner` - Break down the feature, create implementation plan
2. `tdd-guide` - Implement via test-driven development
3. `reviewer` - Code review the implementation
4. `security-reviewer` - Check for security concerns

**bugfix** - Investigate and fix with quality checks:
1. Debug inline (use /debug methodology, no separate agent)
2. `tdd-guide` - Add regression tests and verify the fix
3. `reviewer` - Review the fix for correctness and side effects

**refactor** - Restructure code safely:
1. `architect` - Analyze structure and plan the refactoring
2. `refactor-cleaner` - Execute the refactoring
3. `reviewer` - Verify quality and no regressions

**security-audit** - Security-focused review:
1. `security-reviewer` - Deep security analysis
2. `reviewer` - General code quality review of any fixes applied

## Constraints

- NEVER skip generating a handoff document between agents
- NEVER proceed past a blocking issue without user confirmation
- ALWAYS present the agent sequence for approval before starting
- ALWAYS produce the final aggregated report, even if agents were skipped
- If an agent's output reveals the task is unnecessary (e.g., no security issues found), note it and move on rather than fabricating work
