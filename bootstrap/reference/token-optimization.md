# Token Optimization

Practical strategies for reducing cost and maintaining quality in AI-assisted development.

## Model Selection

Match the model to the task. Defaulting to the most powerful model wastes tokens.

| Task | Recommended | Why |
|------|-------------|-----|
| File search, exploration | Haiku | Fast, cheap, good enough for finding files |
| Simple single-file edits | Haiku / Sonnet | Clear instructions, limited scope |
| Multi-file implementation | Sonnet | Best balance of quality and cost |
| Complex architecture | Opus | Deep reasoning across many concerns |
| Security analysis | Opus | Can't afford to miss vulnerabilities |
| PR reviews | Sonnet | Understands context, catches nuance |
| Documentation | Haiku | Structure is straightforward |
| Debugging complex bugs | Opus | Needs to hold entire system in context |

**Rule of thumb**: Start with Sonnet for 90% of coding tasks. Upgrade to Opus when the first attempt fails, the task spans 5+ files, or it involves architectural decisions or security-critical code.

## Context Window Management

### MCP Tool Overhead

Every enabled MCP server adds tool descriptions to your context window. With too many active:
- 200k effective window can shrink to ~70k
- Quality degrades as the model has less room for your actual code

**Guidelines:**
- Keep under 10 MCP servers enabled per project
- Keep under 80 total tools active
- Disable unused MCPs per project via settings

```json
// Project-level settings - disable what you don't need
{
  "disabledMcpServers": ["supabase", "railway", "vercel"]
}
```

### Strategic Compaction

Auto-compaction at 95% context is too late - quality has already degraded. Compact at logical breakpoints instead.

**When to compact:**
- After research/exploration, before implementation
- After completing a milestone, before starting the next
- After debugging, before continuing feature work
- After a failed approach, before trying a new one

**When NOT to compact:**
- Mid-implementation (you'll lose variable names, file paths, partial state)
- While holding important context that hasn't been committed

**Recommended setting:**
```json
{
  "env": {
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
```

This triggers auto-compaction earlier, preserving more quality.

## Daily Workflow Tips

| Action | When | Cost |
|--------|------|------|
| `/clear` | Between unrelated tasks | Free, instant context reset |
| `/compact` | At logical breakpoints | Small cost, preserves quality |
| `/cost` | Periodically | Free, shows token spending |
| Switch to Opus | Deep reasoning needed | Higher cost per token |
| Switch to Haiku | Simple search/edits | Lower cost per token |

## Subagent Efficiency

Subagents save context by running in separate windows and returning summaries. But they need guidance to be effective.

**Do:**
- Pass objective context, not just the raw query
- Use iterative retrieval (search → evaluate → refine, max 3 cycles)
- Let subagents return summaries, not full file contents
- Use the cheapest sufficient model for each subagent

**Don't:**
- Dump entire files into subagent prompts
- Run subagents for tasks the main agent can handle quickly
- Spawn many subagents for sequential work (use them for parallel tasks)

## Codebase Structure Impact

Modular codebases are cheaper to work with:
- Files of 200-400 lines (vs 1000+) mean less context per read
- Clear separation of concerns reduces how much the AI needs to hold
- Well-named files reduce exploration cost

## Thinking Token Budget

Extended thinking defaults to 31,999 tokens per request. For most coding tasks, 10,000 is sufficient.

```json
{
  "env": {
    "MAX_THINKING_TOKENS": "10000"
  }
}
```

Reserve the full budget for complex architectural reasoning.

## Cost-Saving Settings Summary

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
```

These three settings alone can reduce costs by 50-70% without meaningful quality loss for typical development work.
