# Agent-First Architecture

A context conservation strategy where the main AI assistant instance acts as a thin coordinator, delegating all substantial work to subagents.

---

## Core Principle

> **The main conversation context is a finite, precious resource. Protect it.**

Every file read, every grep, every multi-step analysis consumes context window tokens in the main thread. Once context fills up, the assistant loses earlier conversation history to compression, degrading its ability to make coherent decisions.

By restricting the main instance to coordination and delegating all file reads, searches, code analysis, and implementation to subagents, you:

- Get more conversational turns before context compression kicks in
- Handle larger multi-file tasks without losing earlier context
- Get parallel execution of independent work
- Keep the main thread focused on decisions and user interaction

---

## The Coordinator Role

The main instance has exactly five jobs:

1. **Understand** what the user needs
2. **Clarify** ambiguous or underspecified requests
3. **Plan** the overall approach
4. **Delegate** all actual work to subagents
5. **Synthesize** results from subagents for the user

Everything else — reading files, searching code, running commands, analyzing logs, writing implementations — is agent work.

---

## Delegation Rules

### Always Delegate

- Tasks involving more than 2-3 tool calls (file reads, greps, commands)
- Health checks, log analysis, monitoring
- Multi-file exploration or code archaeology
- Implementation tasks (write code, run tests, fix bugs)
- Research tasks (find how something works, trace dependencies)

### Delegate Immediately

Don't pre-read files "to understand the task" before delegating. The agent can read them itself. Don't start implementation in the main context and then realize it's complex — dispatch immediately.

```
BAD:  Read 3 files → realize task is complex → spawn agent
GOOD: Recognize task scope → spawn agent with clear instructions
```

### Keep in Main Context

Single quick lookups where delegating would be slower — one file read, one grep, one command — **only when** the result is needed immediately to decide what to delegate next.

---

## Parallelization

When multiple independent pieces of information are needed, launch all agents in a single message. Don't serialize what can be parallel.

```
BAD (sequential):
  Agent 1: "Analyze the auth module" → wait → read results →
  Agent 2: "Analyze the API module" → wait → read results →
  Synthesize

GOOD (parallel):
  Agent 1: "Analyze the auth module"  ┐
  Agent 2: "Analyze the API module"   ├─ all launched together
  Agent 3: "Analyze the DB module"    ┘
  → Synthesize all results
```

Use background agents for truly independent long-running work that doesn't block the user's next request.

---

## Agent Prompt Quality

Good delegation requires good prompts. Each agent prompt should be:

**Self-contained** — Include all context the agent needs. Don't assume it can see the main conversation.

**Scoped** — Tell the agent exactly what you expect: research only, implementation, or both.

**Formatted** — Specify the expected output structure so results are easy to synthesize.

```
WEAK:  "Look at the payment module and tell me what's wrong"
STRONG: "Read src/payments/processor.ts and src/payments/validator.ts.
         Identify why orders over $10,000 fail validation.
         Report: root cause, affected code paths, and a proposed fix."
```

---

## Handling Results

### Summarize, Don't Echo

Agent results can be verbose. The main instance should distill findings into what the user needs to know, not paste raw output.

### Chain, Don't Absorb

If agent findings need follow-up investigation, spawn a new agent rather than doing it in the main context.

```
Agent 1 reports: "The bug is in the retry logic, but I'd need to check
                  how the circuit breaker interacts with it"
→ Spawn Agent 2: "Investigate circuit breaker interaction with retry
                   logic in src/resilience/"
```

### Cross-Reference

When multiple agents return results, synthesize across them before presenting to the user. Look for contradictions, dependencies, and patterns that individual agents couldn't see.

---

## When NOT to Apply This Pattern

Not every interaction benefits from delegation:

- **Simple single-file edits** — "Fix the typo on line 42" doesn't need an agent
- **Quick one-off commands** — "What branch am I on?" is one tool call
- **Interactive sequential work** — Pair-programming style conversations where each step depends on user feedback
- **Trivial lookups** — When spawning an agent costs more context than the lookup itself

**Rule of thumb:** If the task takes fewer than 3 tool calls and doesn't need parallel work, do it directly.

---

## Anti-Patterns

### Context Hoarding

❌ Reading 10 files into main context "just in case"
✅ Delegate the reading to an agent that returns only the relevant findings

### Over-Delegation

❌ Spawning an agent to read one file and return its contents
✅ Read the single file directly when that's all you need

### Vague Delegation

❌ "Look into the auth system and report back"
✅ "Find all authentication middleware in src/middleware/. List each one with its purpose and what routes it protects."

### Sequential When Parallel Is Possible

❌ Waiting for Agent 1 to finish before launching independent Agent 2
✅ Launching all independent agents in a single message

### Absorbing Agent Work

❌ Agent reports a lead, main instance starts investigating directly
✅ Agent reports a lead, main instance spawns a follow-up agent

---

## Quick Reference

```
1. USER REQUEST arrives

2. ASSESS scope
   - < 3 tool calls, no parallelism needed → do it directly
   - Otherwise → delegate

3. PLAN delegation
   - What agents are needed?
   - Which are independent (parallel) vs dependent (sequential)?
   - What does each agent need to know?

4. DISPATCH agents
   - Self-contained prompts
   - Clear scope and expected output
   - Launch independent agents in parallel

5. SYNTHESIZE results
   - Summarize, don't echo
   - Chain follow-ups to new agents
   - Present coherent answer to user
```

---

## Related Guides

- [Research Workflow](research-workflow.md) — Systematic investigation patterns agents can follow
- [Iterative Problem Solving](iterative-problem-solving.md) — Structured debugging approach for agent tasks
