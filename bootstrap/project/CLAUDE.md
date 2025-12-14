# Project Bootstrap - Execution Instructions

Set up Claude Praxis methodology files for THIS project.

**Scope**: This creates/modifies files in the TARGET project (not globally).

**Safe to re-run**: Yes. Existing customizations are preserved.

**Files created/modified**:
- `CLAUDE.md` (project root)
- `claude-docs/` or enhance existing docs directory
- `docs/adrs/` (if not exists)
- `.serena/project.yml` (if Serena installed)
- `.claude-bootstrap/` (bootstrap metadata)

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

Read `.claude-bootstrap/manifest.json` in target project:

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
| Write permissions | Can create `.claude-bootstrap/` | "No write permissions" |

If any check fails, stop and report error with recovery steps.

---

## Execution Flow

This procedure runs in **autopilot mode**. Execute all steps without waiting for confirmation.

### 1. Analyze Project [AUTO]

Execute [procedures/00-analyze-project.md](procedures/00-analyze-project.md)

**Key behavior:**
- If environment state shows Serena is installed → Use Serena tools for analysis
- If Serena not installed → Use file-based fallback methods
- Save results to `.claude-bootstrap/analysis.json`
- Record in manifest: `steps_completed: ["analyze"]`

**Expected output:**
- Project type, language, frameworks detected
- Commands, paths, conventions discovered
- Documentation inventory completed
- Analysis results persisted

### 2. Generate CLAUDE.md [AUTO]

Execute [procedures/01-generate-claude-md.md](procedures/01-generate-claude-md.md)

**Key behavior:**
- Read analysis results from `.claude-bootstrap/analysis.json`
- Use template at `../templates/CLAUDE.md.template`
- If CLAUDE.md exists: merge (preserve USER_SECTION content)
- If CLAUDE.md missing: create new from template
- Fill in discovered values (commands, paths, purpose)
- Record in manifest: `steps_completed: ["analyze", "generate-claude-md"]`

**Expected output:**
- `CLAUDE.md` created or updated
- Discovered values filled in (no placeholders if possible)
- User sections preserved (if updating)

### 3. Generate Documentation [AUTO]

Execute [procedures/02-generate-docs.md](procedures/02-generate-docs.md)

**Key behavior:**
- Read documentation inventory from analysis
- **Decision based on existing docs:**
  - If excellent/good docs exist → Enhance existing guides, DON'T create claude-docs/
  - If basic/missing docs → Create claude-docs/ with Praxis guides
- Use templates from `../templates/guides/`
- Customize guides based on project patterns (from analysis)
- Record in manifest: `steps_completed: ["analyze", "generate-claude-md", "generate-docs"]`

**Expected output:**
- Either `claude-docs/` created with guides
- Or existing docs enhanced with missing guides
- Guides customized for project's stack and patterns

### 4. Setup ADRs [AUTO]

Execute [procedures/03-setup-adrs.md](procedures/03-setup-adrs.md)

**Key behavior:**
- Check if ADRs already exist
- If not, create `docs/adrs/` structure
- Create ADR template
- Create initial ADR if none exist
- Record in manifest: `steps_completed: ["analyze", "generate-claude-md", "generate-docs", "setup-adrs"]`

**Expected output:**
- `docs/adrs/` directory structure
- ADR template
- Initial ADR (if created)

### 5. Project-Specific Serena Setup [AUTO]

**If Serena is installed** (check environment state):

1. Run Serena project onboarding: `mcp__serena__onboarding`
2. Create initial project memory with bootstrap info
3. Index the codebase
4. Record in manifest: `serena_available: true`

**If Serena not installed:**
- Skip this step
- Record in manifest: `serena_available: false`
- Note: User can run Serena onboarding later if they install it

### 6. Save Manifest [AUTO]

Write `.claude-bootstrap/manifest.json` with completion status:

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

### 7. Verification [AUTO]

Execute [verification.md](verification.md):

**Checks:**
- All expected files exist
- CLAUDE.md has valid syntax
- Guides were created/updated
- ADR structure is valid
- Serena connectivity (if available)

**Report:**
```
Verification complete:
✓ CLAUDE.md (80 lines)
✓ claude-docs/ (6 files)
✓ docs/adrs/ (structure initialized)
✓ .serena/ (configured and working)

All checks passed!
```

### 8. Summary Report [AUTO]

Display summary:

```
Project bootstrap complete!

✓ CLAUDE.md - Project instructions (80 lines)
✓ claude-docs/ - Methodology guides (6 files)
  - tdd-enforcement.md
  - code-quality.md
  - iterative-problem-solving.md
  - security.md
  - research-workflow.md
  - hypothesis-driven-tdd.md
✓ docs/adrs/ - Architecture decision records
✓ .serena/ - Semantic code navigation

Next steps:
1. Review and customize CLAUDE.md
2. Create your first ADR for existing decisions
3. Try asking Claude about your codebase
```

If Serena was not available:
```
Project bootstrap complete!

✓ CLAUDE.md - Project instructions (80 lines)
✓ claude-docs/ - Methodology guides (6 files)
✓ docs/adrs/ - Architecture decision records
⊗ .serena/ - Not configured (Serena not installed)

Note: Some optimizations unavailable (Serena not installed).
To enable Serena, run: "setup environment"

Next steps:
1. Review and customize CLAUDE.md
2. Create your first ADR for existing decisions
3. Start using the methodology guides
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
- No file locks on CLAUDE.md

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

1. **CLAUDE.md**: Merge new template sections, preserve USER_SECTION content
2. **Guides**: Only create missing guides, don't overwrite existing ones
3. **ADRs**: Don't touch existing ADRs, ensure structure exists
4. **Analysis**: Re-run to detect changes
5. **Manifest**: Update completion timestamp, add any new steps

### User Confirmation (Autopilot Override)

In autopilot mode, updating is automatic with these safe defaults:
- Merge CLAUDE.md (preserve user content)
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
✓ CLAUDE.md generation

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

Location: `.claude-bootstrap/analysis.json`

Contains all discovered project information used for template filling.

### Manifest State

Location: `.claude-bootstrap/manifest.json`

Tracks bootstrap progress and completion status.

### Environment State (Read-Only)

Location: `../.state/environment-state.json` (in bootstrap repo)

Read to determine available tools, never modified by project bootstrap.

---

## Quick Reference

| Procedure | Location | Purpose | Depends On |
|-----------|----------|---------|------------|
| Analyze Project | [procedures/00-analyze-project.md](procedures/00-analyze-project.md) | Discover project info | Serena (optional) |
| Generate CLAUDE.md | [procedures/01-generate-claude-md.md](procedures/01-generate-claude-md.md) | Create project instructions | Analysis |
| Generate Docs | [procedures/02-generate-docs.md](procedures/02-generate-docs.md) | Create methodology guides | Analysis |
| Setup ADRs | [procedures/03-setup-adrs.md](procedures/03-setup-adrs.md) | Initialize ADR structure | None |
| Verification | [verification.md](verification.md) | Verify installation | All above |

---

## Begin

Start by running pre-flight checks, then execute procedures in sequence.
