# Project Bootstrap - Execution Instructions

Set up AI Praxis methodology files for THIS project.

**Scope**: This creates/modifies files in the TARGET project (not globally).

**Safe to re-run**: Yes. Existing customizations are preserved.

**Files created/modified**:
- `AGENTS.md` (project root) - main instructions file
- `CLAUDE.md` (project root) - forwarding file for Claude Code users
- `ai-docs/` or enhance existing docs directory
- `docs/adrs/` (if not exists)
- `.serena/project.yml` (if Serena installed)
- `.ai-bootstrap/` (bootstrap metadata)

**Files NOT touched**:
- Source code
- Package configuration (package.json, *.csproj, etc.)
- Git configuration
- CI/CD pipelines

---

## Pre-Flight Checks

### 1. Check Environment Setup [AUTO]

Read `../.state/environment-state.json` from the bootstrap repo:

**If exists and complete:**
- Environment tools are available
- Serena-based optimizations can be used
- Proceed with full capabilities

**If exists but incomplete:**
- Some tools may be unavailable
- Log warning: "Environment setup incomplete. Some features may be unavailable."
- Use file-based fallbacks where needed
- Proceed anyway

**If missing:**
- Environment setup was not run
- Display warning:
  ```
  Environment setup not detected. Recommended to run environment setup first.

  Options:
  - continue (proceed anyway, some features will be limited)
  - exit (run environment setup first, then come back)

  In autopilot mode: continuing with file-based fallbacks...
  ```
- Use file-based fallbacks exclusively
- Proceed with project bootstrap

### 2. Check Project Bootstrap State [AUTO]

Read `.ai-bootstrap/manifest.json` in target project (also check legacy `.claude-bootstrap/`):

**If exists and complete:**
- Project was already bootstrapped
- Ask user: "Project already bootstrapped. Options: update (merge latest templates), verify (check current state), skip (do nothing)"
- In autopilot mode: default to "update"

**If exists but incomplete:**
- Previous bootstrap was interrupted
- Display: "Resuming interrupted bootstrap from step: {{last_step}}"
- Resume from last completed step

**If missing:**
- Fresh bootstrap needed
- Create new manifest
- Proceed with full bootstrap

### 3. Verify Target Project [AUTO]

Verify the project is valid for bootstrapping:

| Check | Requirement | Error if Fails |
|-------|-------------|----------------|
| Has recognizable structure | At least one source file or config | "No project structure detected" |
| Not the bootstrap repo itself | CWD != bootstrap repo path | "Cannot bootstrap the bootstrap repo" |
| Write permissions | Can create `.ai-bootstrap/` | "No write permissions" |

If any check fails, stop and report error with recovery steps.

---

## Execution Flow

This procedure runs in **autopilot mode**. Execute all steps without waiting for confirmation.

### 1. Analyze Project [AUTO]

Execute [procedures/00-analyze-project.md](procedures/00-analyze-project.md)

**Key behavior:**
- If environment state shows Serena is installed → Use Serena tools for analysis
- If Serena not installed → Use file-based fallback methods
- Save results to `.ai-bootstrap/analysis.json`
- Record in manifest: `steps_completed: ["analyze"]`

**Expected output:**
- Project type, language, frameworks detected
- Commands, paths, conventions discovered
- Documentation inventory completed
- Analysis results persisted

### 2. Generate AGENTS.md [AUTO]

Execute [procedures/01-generate-agents-md.md](procedures/01-generate-agents-md.md)

**Key behavior:**
- Read analysis results from `.ai-bootstrap/analysis.json`
- Use template at `../templates/AGENTS.md.template`
- If AGENTS.md exists: merge (preserve USER_SECTION content)
- If AGENTS.md missing: create new from template
- Fill in discovered values (commands, paths, purpose)
- **Also create CLAUDE.md** as a forwarding file for Claude Code users
- Record in manifest: `steps_completed: ["analyze", "generate-agents-md"]`

**Expected output:**
- `AGENTS.md` created or updated (main instructions)
- `CLAUDE.md` created (forwards to AGENTS.md for Claude Code compatibility)
- Discovered values filled in (no placeholders if possible)
- User sections preserved (if updating)

### 3. Generate Documentation [AUTO]

Execute [procedures/02-generate-docs.md](procedures/02-generate-docs.md)

**Key behavior:**
- Read documentation inventory from analysis
- **Decision based on existing docs:**
  - If excellent/good docs exist → Enhance existing guides, DON'T create ai-docs/
  - If basic/missing docs → Create ai-docs/ with Praxis guides
- Use templates from `../templates/guides/`
- Customize guides based on project patterns (from analysis)
- Record in manifest: `steps_completed: ["analyze", "generate-agents-md", "generate-docs"]`

**Expected output:**
- Either `ai-docs/` created with guides
- Or existing docs enhanced with missing guides
- Guides customized for project's stack and patterns

### 4. Setup ADRs [AUTO]

Execute [procedures/03-setup-adrs.md](procedures/03-setup-adrs.md)

**Key behavior:**
- Check if ADRs already exist
- If not, create `docs/adrs/` structure
- Create ADR template
- Create initial ADR if none exist
- Record in manifest: `steps_completed: ["analyze", "generate-agents-md", "generate-docs", "setup-adrs"]`

**Expected output:**
- `docs/adrs/` directory structure
- ADR template
- Initial ADR (if created)

### 5. Setup Contexts, Commands, and Agents [AUTO]

Execute [procedures/04-setup-contexts-commands-agents.md](procedures/04-setup-contexts-commands-agents.md)

**Key behavior:**
- Create context mode files (dev, review, research) in docs directory
- Create slash command definitions in tool-appropriate location
- Create agent definitions in tool-appropriate location
- Customize all templates with project-specific values from analysis
- Update AGENTS.md with Modes, Commands, and Agents sections
- Record in manifest: `steps_completed: [..., "setup-contexts-commands-agents"]`

**Expected output:**
- Context mode files (3 files)
- Command definitions (5 files)
- Agent definitions (5 files)
- AGENTS.md updated with new sections

### 6. Project-Specific Serena Setup [AUTO]

**If Serena is installed** (check environment state):

1. Run Serena project onboarding: `mcp__serena__onboarding`
2. Create initial project memory with bootstrap info
3. Index the codebase
4. Record in manifest: `serena_available: true`

**If Serena not installed:**
- Skip this step
- Record in manifest: `serena_available: false`
- Note: User can run Serena onboarding later if they install it

### 7. Save Manifest [AUTO]

Write `.ai-bootstrap/manifest.json` with completion status:

```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "2025-12-14T10:35:00Z",
  "completed_at": "2025-12-14T10:37:00Z",
  "steps_completed": ["analyze", "generate-agents-md", "generate-docs", "setup-adrs", "setup-contexts-commands-agents"],
  "steps_skipped": [],
  "project_type": "TypeScript Application",
  "environment_setup_available": true,
  "serena_available": true
}
```

### 8. Verification [AUTO]

Execute [verification.md](verification.md):

**Checks:**
- All expected files exist
- AGENTS.md has valid syntax
- CLAUDE.md forwards correctly
- Guides were created/updated
- ADR structure is valid
- Contexts, commands, and agents are in correct locations
- Serena connectivity (if available)

**Report:**
```
Verification complete:
✓ AGENTS.md (120 lines)
✓ CLAUDE.md (forwarding file)
✓ ai-docs/ (6 guides + 3 contexts)
✓ .claude/commands/ (5 commands)
✓ .claude/agents/ (5 agents)
✓ docs/adrs/ (structure initialized)
✓ .serena/ (configured and working)

All checks passed!
```

### 9. Summary Report [AUTO]

Display summary:

```
Project bootstrap complete!

✓ AGENTS.md - Project instructions (120 lines)
✓ CLAUDE.md - Forwarding file for Claude Code
✓ ai-docs/ - Methodology guides (6 files)
  - tdd-enforcement.md, code-quality.md, security.md
  - iterative-problem-solving.md, multi-approach-validation.md, research-workflow.md
  - verification.md
✓ ai-docs/contexts/ - Behavior modes (3 files)
  - dev.md, review.md, research.md
✓ .claude/commands/ - Workflow commands (5 commands)
  - /plan, /review, /tdd, /verify, /debug
✓ .claude/agents/ - Specialized agents (5 agents)
  - planner, reviewer, tdd-guide, security-reviewer, architect
✓ docs/adrs/ - Architecture decision records
✓ .serena/ - Semantic code navigation

Next steps:
1. Review and customize AGENTS.md
2. Try /plan to plan your next feature
3. Try /review to review recent changes
4. Create your first ADR for existing decisions
```

If Serena was not available:
```
Project bootstrap complete!

✓ AGENTS.md - Project instructions (120 lines)
✓ CLAUDE.md - Forwarding file for Claude Code
✓ ai-docs/ - Methodology guides + contexts
✓ .claude/commands/ - Workflow commands (5 commands)
✓ .claude/agents/ - Specialized agents (5 agents)
✓ docs/adrs/ - Architecture decision records
⊗ .serena/ - Not configured (Serena not installed)

Note: Some optimizations unavailable (Serena not installed).
Agent definitions will work but without Serena's semantic tools.

Next steps:
1. Review and customize AGENTS.md
2. Try /plan to plan your next feature
3. Try /review to review recent changes
```

---

## Error Handling

### Blocking Errors

Project bootstrap errors are blocking (stop and report):

| Error Type | Recovery Action |
|------------|-----------------|
| Cannot write to project | Check permissions, fix, retry |
| Analysis fails completely | Verify project has source files |
| Template files missing | Check bootstrap repo is complete |

**Example error:**
```
✗ Cannot write to project directory (permission denied)

Please check:
- You have write permissions for this directory
- Directory is not read-only
- No file locks on AGENTS.md

Fix the issue and run again - progress will resume from where it stopped.
```

### Non-Blocking Errors

Some errors allow continuing with degraded functionality:

| Error Type | Action |
|------------|--------|
| Serena onboarding fails | Skip Serena setup, note in manifest |
| Guide generation fails | Log error, continue with other guides |
| ADR setup fails | Log error, note in summary |

**Example warning:**
```
⚠ Serena project onboarding failed

Error: Connection timeout

Project bootstrap will continue without Serena integration.
You can run Serena onboarding manually later.

Continuing with remaining steps...
```

---

## Update Mode

When re-running bootstrap on existing project:

### Update Behavior

1. **AGENTS.md**: Merge new template sections, preserve USER_SECTION content
2. **CLAUDE.md**: Regenerate forwarding file
3. **Guides**: Only create missing guides, don't overwrite existing ones
4. **ADRs**: Don't touch existing ADRs, ensure structure exists
5. **Analysis**: Re-run to detect changes
6. **Manifest**: Update completion timestamp, add any new steps

### User Confirmation (Autopilot Override)

In autopilot mode, updating is automatic with these safe defaults:
- Merge AGENTS.md (preserve user content)
- Skip existing guides
- Add only missing components

If user explicitly requested different behavior, respect that.

---

## Resumption Logic

If interrupted bootstrap is detected:

1. Read manifest to find last completed step
2. Display: "Resuming from: {{next_step}}"
3. Skip completed steps
4. Execute remaining steps
5. Update manifest with new completion timestamp

**Example:**
```
Resuming interrupted bootstrap...

Already completed:
✓ Project analysis
✓ AGENTS.md generation

Continuing with:
→ Documentation generation
→ ADR setup
→ Verification
```

---

## Integration with Environment Setup

Project bootstrap adapts based on environment state:

| Environment Component | If Available | If Not Available |
|-----------------------|--------------|------------------|
| Serena MCP | Use Serena tools for analysis | Use file-based fallbacks |
| Serena MCP | Run project onboarding | Skip project onboarding |
| Context7 MCP | Mentioned in guides | Not mentioned |
| Sequential Thinking | Mentioned in guides | Not mentioned |

**This decoupling allows:**
- Project bootstrap works even if environment setup failed
- Optimal performance when tools are available
- Graceful degradation when tools are missing
- Clear documentation of what's available

---

## State Management

### Analysis State

Location: `.ai-bootstrap/analysis.json`

Contains all discovered project information used for template filling.

### Manifest State

Location: `.ai-bootstrap/manifest.json`

Tracks bootstrap progress and completion status.

### Environment State (Read-Only)

Location: `../.state/environment-state.json` (in bootstrap repo)

Read to determine available tools, never modified by project bootstrap.

---

## Quick Reference

| Procedure | Location | Purpose | Depends On |
|-----------|----------|---------|------------|
| Analyze Project | [procedures/00-analyze-project.md](procedures/00-analyze-project.md) | Discover project info | Serena (optional) |
| Generate AGENTS.md | [procedures/01-generate-agents-md.md](procedures/01-generate-agents-md.md) | Create project instructions | Analysis |
| Generate Docs | [procedures/02-generate-docs.md](procedures/02-generate-docs.md) | Create methodology guides | Analysis |
| Setup ADRs | [procedures/03-setup-adrs.md](procedures/03-setup-adrs.md) | Initialize ADR structure | None |
| Setup Contexts/Commands/Agents | [procedures/04-setup-contexts-commands-agents.md](procedures/04-setup-contexts-commands-agents.md) | Workflow automation | Analysis |
| Verification | [verification.md](verification.md) | Verify installation | All above |

---

## Begin

Start by running pre-flight checks, then execute procedures in sequence.
