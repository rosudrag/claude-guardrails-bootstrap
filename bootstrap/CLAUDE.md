# Claude Praxis Bootstrap - Entry Point

You are reading this because a user has asked you to bootstrap their project with Claude Praxis.

## Welcome to Claude Praxis

This bootstrap has two distinct modes:

1. **Environment Setup** (once per machine): Installs global tools (Serena MCP, Context7, Sequential Thinking, agents)
2. **Project Bootstrap** (once per project): Sets up project-specific files (CLAUDE.md, docs, ADRs)

---

## Automatic Mode Detection

[AUTO] Checking your environment status...

Execute the following checks:

1. **Check environment state**: Look for `.state/environment-state.json` in this bootstrap repo
2. **Check project state**: Look for `.claude-bootstrap/manifest.json` in the target project
3. **Determine recommended mode** based on the decision matrix below

### Decision Matrix

| Environment Setup | Project Bootstrap | Recommended Mode |
|-------------------|-------------------|------------------|
| ✗ Not done        | ✗ Not done        | Both (first-time) |
| ✗ Not done        | ✓ Done            | Environment only |
| ✓ Done            | ✗ Not done        | Project only     |
| ✓ Done            | ✓ Done            | Update/verify    |

---

## Mode Selection

Based on detection, present the recommended mode to the user.

**Available modes:**
- **environment** - Set up global tools (Serena, MCP servers, agents)
- **project** - Bootstrap this project with praxis files
- **both** - Run environment setup, then project bootstrap (recommended for first-time)
- **verify** - Check what's installed without making changes
- **help** - Explain the modes and what they do

**Autopilot behavior:**
- If mode is clear (e.g., "both" for first-time), proceed automatically
- Show what will happen before executing
- Use a brief transparency message (no countdown needed - just inform and proceed)

---

## Execution Flow

### Mode: Environment Setup

1. Inform user: "Setting up global environment tools..."
2. Proceed to [environment/CLAUDE.md](environment/CLAUDE.md)
3. Follow environment setup orchestrator

### Mode: Project Bootstrap

1. Check if environment setup is complete (read `.state/environment-state.json`)
2. If environment not ready, warn: "Environment setup not detected. Some features may be unavailable. Continue anyway?"
3. Proceed to [project/CLAUDE.md](project/CLAUDE.md)
4. Follow project bootstrap orchestrator

### Mode: Both

1. Inform user: "Running full bootstrap (environment + project)..."
2. Execute environment setup first:
   - Proceed to [environment/CLAUDE.md](environment/CLAUDE.md)
   - Wait for completion (blocking)
   - Check environment state
3. Execute project bootstrap:
   - Proceed to [project/CLAUDE.md](project/CLAUDE.md)
   - Uses environment state from previous phase
   - Enables optimizations if Serena available
4. Present combined summary report

### Mode: Verify

1. Read `.state/environment-state.json` (if exists)
2. Read `.claude-bootstrap/manifest.json` in target project (if exists)
3. Test connectivity:
   - Try using Serena tools (if state says installed)
   - Check `.claude/settings.local.json` for MCP servers
4. Display status report:
   ```
   Environment Status:
   ✓ Serena MCP v1.2.3 (working)
   ✓ Context7 MCP (configured)
   ✓ Sequential Thinking MCP (configured)

   Project Status:
   ✓ CLAUDE.md (exists)
   ✓ claude-docs/ (6 files)
   ✓ docs/adrs/ (initialized)
   ✓ .serena/ (configured)

   Recommendations:
   - None, everything looks good!
   ```
5. Exit without making changes

### Mode: Help

Display explanation of modes:

```
Claude Praxis bootstrap has two modes:

**Environment Setup** (once per machine)
- Installs tools globally (Serena MCP, Context7, Sequential Thinking)
- Modifies ~/.claude/settings.local.json
- Takes ~2 minutes
- Run when: New machine, or want to update tools

**Project Bootstrap** (once per project)
- Creates CLAUDE.md and docs for THIS project
- Modifies only this project directory
- Takes ~1 minute
- Run when: New project, or want to update project files

**Both Mode** (recommended for first time)
- Runs environment setup, then project bootstrap
- One command, complete setup
- Takes ~3 minutes

Which mode do you need?
```

---

## Error Handling

### Environment Setup Failures

Environment failures are **non-blocking**:
- Log the error
- Record in environment state
- Continue to project bootstrap (if in "both" mode)
- Use file-based fallbacks where Serena would have been used

Example message:
```
⚠ Serena MCP installation failed (npm error)

This is optional - continuing with project bootstrap.
You can retry later with: "run environment setup"

Project bootstrap will use file-based analysis instead.
```

### Project Bootstrap Failures

Project failures are **blocking**:
- Stop and report the issue
- Provide clear recovery steps
- Save progress to manifest
- Allow resume

Example message:
```
✗ Cannot write to project directory (permission denied)

Please check:
- You have write permissions
- Directory is not read-only
- No file locks on CLAUDE.md

Fix the issue and run again - progress will resume from where it stopped.
```

---

## State Management

### Environment State

Location: `bootstrap/.state/environment-state.json`

This tracks global tool installations across all projects.

Schema:
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
  "last_updated": "2025-12-14T10:30:00Z"
}
```

### Project State

Location: `.claude-bootstrap/manifest.json` (in target project)

This tracks project-specific bootstrap progress.

Schema:
```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "2025-12-14T10:35:00Z",
  "completed_at": "2025-12-14T10:37:00Z",
  "steps_completed": ["analyze", "generate-claude-md", "generate-docs", "setup-adrs"],
  "steps_skipped": [],
  "project_type": "TypeScript Application",
  "environment_setup_available": true,
  "serena_available": true
}
```

---

## Quick Reference

| Mode | When to Use | What It Does |
|------|-------------|--------------|
| **both** | First-time bootstrap on new machine | Installs global tools + sets up this project |
| **environment** | New machine, already have project files | Installs global tools only |
| **project** | Have global tools, need to bootstrap new project | Sets up this project only |
| **verify** | Want to check what's installed | Shows status without changes |
| **help** | Confused about modes | Explains the modes |

---

## Begin

**Default action for autopilot**: If this is clearly a first-time bootstrap (no environment state, no project state), automatically run "both" mode.

**Execution steps:**
1. Perform automatic mode detection
2. Select appropriate mode
3. Inform user what will happen
4. Execute the selected mode
5. Present summary report

Start by checking for environment and project state, then proceed with the appropriate mode.
