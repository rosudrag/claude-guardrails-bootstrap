# Delegation

## Context Conservation

The main conversation context is finite. Protect it by delegating substantial work to subagents.

## When to Delegate

- Tasks requiring more than 3 tool calls (file reads, greps, commands)
- Multi-file exploration or code archaeology
- Implementation tasks (write code, run tests, fix bugs)
- Research tasks (trace dependencies, find how something works)
- Health checks, log analysis, monitoring

## When NOT to Delegate

- Single file reads needed to decide what to delegate next
- One-off commands (git status, branch check)
- Interactive pair-programming with user feedback each step

## How to Delegate

- Write self-contained agent prompts — include all needed context
- Launch independent agents in parallel
- Summarize results; don't echo raw agent output
- Chain follow-ups to new agents instead of investigating in main context
