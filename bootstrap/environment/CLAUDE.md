# Environment Setup - Execution Instructions

Install global tools that make Claude Code better for ALL projects.

**Scope**: This modifies your GLOBAL environment (not a specific project).

**Safe to re-run**: Yes. Existing installations are detected and skipped.

**Files modified**:
- `~/.claude/settings.local.json` (global MCP server config)
- `../.state/environment-state.json` (in bootstrap repo, tracks completion)

**Files NOT touched**:
- Project source code
- Project configuration files
- Project-specific Claude files

---

## Execution Flow

This procedure runs in **autopilot mode**. Execute all steps without waiting for confirmation.

### 1. Check Existing State [AUTO]

Read `../.state/environment-state.json` if it exists.

Expected schema:
```json
{
  "environment_setup_version": "1.0.0",
  "completed_at": "2025-12-14T10:30:00Z",
  "components": {
    "serena_mcp": {
      "installed": true,
      "version": "1.2.3",
      "installed_at": "2025-12-14T10:15:00Z"
    },
    "context7_mcp": {
      "installed": true,
      "installed_at": "2025-12-14T10:20:00Z"
    },
    "sequential_thinking_mcp": {
      "installed": true,
      "installed_at": "2025-12-14T10:20:00Z"
    },
    "agents_notified": true
  },
  "skip_reasons": {},
  "last_updated": "2025-12-14T10:30:00Z"
}
```

**If state exists and all components installed:**
- Inform user: "Environment setup already complete (last run: {{date}})"
- Ask: "Options: skip (default), verify (test installations), reinstall (force reinstall), update (update to latest)"
- In autopilot mode: default to "skip" and proceed to next phase

**If state exists but incomplete:**
- Resume from failed/skipped steps
- Retry components that failed previously

**If state does not exist:**
- Create new state file with empty components
- Proceed with full installation

### 2. Execute Procedures [AUTO]

Run in sequence (skip completed steps based on state):

1. **Install Serena MCP**: [procedures/01-install-serena.md](procedures/01-install-serena.md)
   - Check if `components.serena_mcp.installed` is true → skip
   - Otherwise, execute procedure
   - Record result in state

2. **Install MCP Servers**: [procedures/02-install-mcp-servers.md](procedures/02-install-mcp-servers.md)
   - Check if both `context7_mcp` and `sequential_thinking_mcp` are installed → skip
   - Otherwise, execute procedure
   - Record result in state

3. **Notify about Agents**: [procedures/03-install-agents.md](procedures/03-install-agents.md)
   - Check if `agents_notified` is true → skip
   - Otherwise, execute procedure
   - Record result in state

**Important**: Each procedure:
- Checks if already installed (idempotent)
- Attempts installation
- Records result in state (success or failure)
- **Continues even on failure** (non-blocking)

### 3. Save State [AUTO]

After all procedures complete, write/update `../.state/environment-state.json`:

```json
{
  "environment_setup_version": "1.0.0",
  "completed_at": "2025-12-14T10:30:00Z",
  "components": {
    "serena_mcp": {
      "installed": true|false,
      "version": "1.2.3" (if available),
      "installed_at": "2025-12-14T10:15:00Z",
      "skip_reason": "error_message" (if failed),
      "error": "detailed error" (if failed)
    },
    "context7_mcp": {
      "installed": true|false,
      "installed_at": "2025-12-14T10:20:00Z",
      "skip_reason": "..." (if failed)
    },
    "sequential_thinking_mcp": {
      "installed": true|false,
      "installed_at": "2025-12-14T10:20:00Z",
      "skip_reason": "..." (if failed)
    },
    "agents_notified": true|false
  },
  "last_updated": "2025-12-14T10:30:00Z"
}
```

### 4. Summary Report [AUTO]

Generate and display summary:

```
Environment setup complete!

✓ Serena MCP - Semantic code understanding
✓ Context7 MCP - Up-to-date library docs
✓ Sequential Thinking MCP - Structured reasoning
ℹ Agents - See installation guide

Note: Restart Claude Code to activate MCP servers.

Next step: Bootstrap a project with 'project' mode.
```

If any components failed:
```
Environment setup complete (with warnings)!

✓ Serena MCP - Semantic code understanding
✗ Context7 MCP - Installation failed (network error)
✓ Sequential Thinking MCP - Structured reasoning
ℹ Agents - See installation guide

Note: Some features may be unavailable. You can retry with: "update environment setup"
Note: Restart Claude Code to activate MCP servers.

Next step: Bootstrap a project with 'project' mode.
```

### 5. Return to Entry Point [AUTO]

**If running in "environment" mode only:**
- Exit after showing summary

**If running in "both" mode:**
- State is now saved and ready
- Proceed to project bootstrap (entry point will handle this)

---

## Error Handling

### Non-Blocking Errors

All environment setup errors are non-blocking:

| Error Type | Action |
|------------|--------|
| Node.js not installed | Log warning, skip Serena/MCP, continue |
| npm install fails | Log error, record in state, continue |
| Config file write fails | Log error, record in state, continue |
| Network error | Log error, record in state, continue |

**Example error handling:**
```
⚠ Serena MCP installation failed

Error: npm install returned error code 1
Reason: Network timeout

This is optional - continuing with remaining installations.
Project bootstrap will use file-based analysis instead of Serena.

You can retry later with: "update environment setup"
```

### State File Errors

If cannot write state file:
- Log warning
- Continue anyway (state will be recreated on next run)
- Inform user that state tracking is unavailable

---

## Verification Commands

When user asks to "verify environment" or mode is "verify":

1. Read state file
2. For each component marked as installed:
   - **Serena**: Try `mcp__serena__initial_instructions` (test connection)
   - **Context7/Sequential**: Check `.claude/settings.local.json` has entries
   - **Node.js**: Run `node --version`
3. Report findings:
   ```
   Environment Verification:

   ✓ Serena MCP v1.2.3 (working)
   ✓ Context7 MCP (configured in settings.local.json)
   ✓ Sequential Thinking MCP (configured in settings.local.json)
   ℹ Agents (notification shown previously)
   ✓ Node.js v20.11.0

   All components operational!
   ```

If verification finds issues:
```
Environment Verification:

✗ Serena MCP (configured but not responding)
  → Try restarting Claude Code
  → Or reinstall with: "reinstall environment setup"
✓ Context7 MCP (configured)
✓ Sequential Thinking MCP (configured)
✓ Node.js v20.11.0

1 issue found. See recommendations above.
```

---

## Update Commands

When user asks to "update environment setup":

1. Read current state
2. For each component:
   - Check if update is available
   - If yes, prompt: "Update {{component}} from {{old_version}} to {{new_version}}?" (in autopilot: auto-accept)
   - Perform update
   - Record new version in state
3. Save updated state
4. Display what was updated

---

## Idempotency

This procedure is safe to run multiple times:
- Existing installations are detected and skipped
- State file prevents redundant work
- Failed installations can be retried
- Updates can be performed selectively

**Always check state first before executing any procedure.**

---

## Integration with Project Bootstrap

After environment setup completes:
- State file is available at `../.state/environment-state.json`
- Project bootstrap will read this file
- If Serena is installed, project bootstrap uses Serena tools
- If Serena is not installed, project bootstrap uses file-based fallbacks

This decoupling allows:
- Environment failures don't block project setup
- Project can adapt based on available tools
- Clear separation of global vs. project concerns

---

## Quick Reference

| Procedure | Location | Purpose | Blocking? |
|-----------|----------|---------|-----------|
| Install Serena | [procedures/01-install-serena.md](procedures/01-install-serena.md) | Semantic code tools | No |
| Install MCP Servers | [procedures/02-install-mcp-servers.md](procedures/02-install-mcp-servers.md) | Context7, Sequential Thinking | No |
| Notify Agents | [procedures/03-install-agents.md](procedures/03-install-agents.md) | Inform about agent repo | No |

---

## Begin

Start by checking state file, then execute procedures in sequence.
