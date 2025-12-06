# Claude Guardrails Bootstrap - Execution Instructions

You are reading this because a user has asked you to bootstrap their project with AI guardrails.

## Your Mission

Transform the user's project into an AI-friendly codebase by:
1. Installing semantic code tools (Serena MCP)
2. Installing specialized agents for their tech stack
3. Generating customized CLAUDE.md and supporting docs
4. Setting up architecture decision records (ADRs)

## Execution Flow

Follow these procedures in order. Each procedure file contains detailed steps.

### Phase 1: Analysis
1. Read [procedures/00-analyze-project.md](procedures/00-analyze-project.md)
2. Execute the analysis and gather project information
3. Save results to `.claude-bootstrap/analysis.json`
4. Present findings to user and get confirmation to proceed

### Phase 2: Tool Installation
5. Read [procedures/01-install-serena.md](procedures/01-install-serena.md)
6. Install and configure Serena MCP (use Serena's onboarding tool)
7. Read [procedures/02-install-agents.md](procedures/02-install-agents.md)
8. Direct user to agent installation repo

### Phase 3: Content Generation
9. Read [procedures/03-generate-claude-md.md](procedures/03-generate-claude-md.md)
10. Generate customized CLAUDE.md using analysis data and templates
11. Read [procedures/04-generate-docs.md](procedures/04-generate-docs.md)
12. Create claude-docs/ with relevant guides
13. Read [procedures/05-setup-adrs.md](procedures/05-setup-adrs.md)
14. Initialize ADR structure

### Phase 4: Verification
15. Read [procedures/06-verify-installation.md](procedures/06-verify-installation.md)
16. Verify all files were created correctly
17. Test Serena connectivity (if installed)
18. Present summary and next steps to user

## Safety Rules

### NEVER do these without explicit permission:
- Modify source code files (*.cs, *.ts, *.py, etc.)
- Change git configuration or remotes
- Install runtime dependencies (NuGet, npm packages in their project)
- Modify CI/CD pipelines
- Delete any existing files

### ALWAYS safe to do:
- Read any file for analysis
- Create new files in: CLAUDE.md, claude-docs/, docs/adrs/, .serena/, .claude/, .claude-bootstrap/
- Install development tools (Serena MCP, agents)

### ASK before:
- Overwriting existing CLAUDE.md
- Modifying existing documentation
- Creating files in project root

## Interactivity Guidelines

- **After analysis**: Present findings and ask "Should I proceed with this plan?"
- **Before overwriting**: Ask "I found an existing X. Should I merge, replace, or skip?"
- **For optional steps**: Ask "Do you want me to set up X? (recommended for your stack)"
- **On any error**: Explain what happened and offer alternatives

## State Management

All bootstrap state is stored in `.claude-bootstrap/`:

| File | Purpose |
|------|---------|
| `analysis.json` | Project analysis results (language, frameworks, structure) |
| `manifest.json` | Bootstrap progress and completion status |

This enables:
- Template processing with consistent data
- Safe re-runs (skip completed steps)
- Verification of what was installed

## Quick Reference

| What | Where |
|------|-------|
| Project analysis | [procedures/00-analyze-project.md](procedures/00-analyze-project.md) |
| Serena installation | [procedures/01-install-serena.md](procedures/01-install-serena.md) |
| Agent installation | [procedures/02-install-agents.md](procedures/02-install-agents.md) |
| CLAUDE.md generation | [procedures/03-generate-claude-md.md](procedures/03-generate-claude-md.md) |
| Docs generation | [procedures/04-generate-docs.md](procedures/04-generate-docs.md) |
| ADR setup | [procedures/05-setup-adrs.md](procedures/05-setup-adrs.md) |
| Verification | [procedures/06-verify-installation.md](procedures/06-verify-installation.md) |
| CLAUDE.md template | [templates/CLAUDE.md.template](templates/CLAUDE.md.template) |
| Guide templates | [templates/guides/](templates/guides/) |
| Background principles | [reference/guardrail-principles.md](reference/guardrail-principles.md) |

## Begin

Start by reading and executing [procedures/00-analyze-project.md](procedures/00-analyze-project.md).
