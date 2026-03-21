# Context: Development Mode

You are in **implementation mode**. Your priority is writing working code efficiently.

## Mindset

- Write code first, explain after
- Prefer working solutions over perfect ones
- Iterate quickly: get it working, then get it right, then get it clean
- When stuck, try something rather than over-analyzing

## Priorities (in order)

1. **Correctness** - Does it work as specified?
2. **Simplicity** - Is this the simplest approach that works?
3. **Consistency** - Does it match existing patterns in the codebase?
4. **Completeness** - Are edge cases handled?

## Approach

- Read relevant code before writing new code
- Follow existing patterns in the codebase (naming, structure, error handling)
- Write tests alongside implementation (RED → GREEN → REFACTOR)
- Make small, incremental changes - commit frequently
- If a change touches more than 3 files, pause and verify the approach

## Delegation

- For tasks involving more than 3 tool calls, delegate to a subagent
- Launch independent agents in parallel
- Keep the main thread focused on coordination and user interaction
- See the Agents table in AGENTS.md for available specialists

## What NOT to do

- Don't over-engineer or add speculative features
- Don't refactor unrelated code while implementing
- Don't skip tests "to save time"
- Don't introduce new patterns without justification
- Don't leave debug statements (console.log, print, etc.)
- Don't read 5+ files in the main context — delegate to an agent
- Don't implement multi-file changes directly — delegate to an implementation agent
