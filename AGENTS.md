# AI Praxis - Development Instructions

This file contains instructions for developing and improving THIS repository itself.

> **If you're here to bootstrap another project**, see [bootstrap/AGENTS.md](bootstrap/AGENTS.md) instead.

## Project Purpose

This repository is a **comprehensive methodology system** for AI coding assistants. When users point their AI tool at this repo, it reads the instructions in `/bootstrap` and uses them to set up the praxis system in the user's own project.

**Supported Tools**: Claude Code, Cursor, Windsurf, Cline, and other MCP-compatible AI assistants.

## Guiding Principles

1. **Tool-agnostic first** - AGENTS.md is the primary format; CLAUDE.md is a forwarding shim. Every feature must work across tools, with tool-specific branches only where unavoidable.
2. **Methodology over config** - We teach patterns and principles, not dump config files. The bootstrap should make the user's project self-sufficient.
3. **Progressive disclosure** - Don't overwhelm. Start with what matters most, let users discover depth as they need it.
4. **Minimal footprint** - Generate only what the project needs. No bloat, no unused templates, no speculative features.
5. **Idempotent and safe** - Running bootstrap twice should not break anything or duplicate content.

## What This Repo Is NOT

- **Not a plugin** - We don't ship runtime code that hooks into AI tools
- **Not a config dump** - We don't copy dozens of files into `~/.claude/`
- **Not Claude-specific** - Despite the CLAUDE.md shim, the system targets all AI coding assistants
- **Not prescriptive about stack** - We detect and adapt to the user's tech stack, not impose one

## Repository Structure

```
ai-praxis/
├── AGENTS.md                    # You are here (meta instructions)
├── CLAUDE.md                    # Forwarding file for Claude Code
├── README.md                    # Human documentation
├── examples/                    # Real-world AGENTS.md examples by stack
├── tasks/                       # Backlog of improvement ideas (gitignored)
└── bootstrap/
    ├── AGENTS.md                # Entry point router (mode selection)
    ├── .state/                  # Environment setup state
    │   ├── .gitkeep
    │   └── environment-state.template.json
    ├── environment/             # Mode 1: Environment setup (global tools)
    │   ├── AGENTS.md           # Environment orchestrator
    │   └── procedures/
    │       ├── 01-install-serena.md
    │       ├── 02-install-mcp-servers.md
    │       └── 03-install-agents.md
    ├── project/                 # Mode 2: Project bootstrap (project files)
    │   ├── AGENTS.md           # Project orchestrator
    │   ├── procedures/
    │   │   ├── 00-analyze-project.md
    │   │   ├── 01-generate-agents-md.md
    │   │   ├── 02-generate-docs.md
    │   │   ├── 03-setup-adrs.md
    │   │   └── 04-setup-contexts-commands-agents.md
    │   └── verification.md      # Post-bootstrap verification
    ├── templates/               # Shared templates for both modes
    │   ├── AGENTS.md.template
    │   ├── adr-template.md
    │   ├── agents/              # Agent definition templates
    │   ├── commands/            # Slash command templates
    │   ├── contexts/            # Behavior mode templates (dev, review, research)
    │   ├── guides/              # Guide templates (TDD, code quality, etc.)
    │   ├── hooks/               # Hook script templates (Claude Code)
    │   ├── hooks.json.template  # Hook config template
    │   └── rules/               # Rule templates (common + language-specific)
    │       └── common/          # Language-agnostic rules
    └── reference/               # Shared reference docs
        ├── guardrail-principles.md
        ├── serena-best-practices.md
        └── token-optimization.md
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| AGENTS.md over CLAUDE.md | Tool-agnostic convention; CLAUDE.md just forwards |
| Two bootstrap modes | Environment setup (once per machine) vs project setup (once per repo) are different concerns with different lifecycles |
| Procedures as markdown | AI assistants read markdown natively; no runtime dependency |
| `ai-docs/` not `claude-docs/` | Tool-neutral naming in bootstrapped projects |
| `.ai-bootstrap/` state dir | Tracks progress, enables idempotent re-runs |
| Templates with `{{placeholders}}` | Simple enough for any AI to process, no template engine needed |

## Development Guidelines

### When Editing Procedures
- Each procedure should be self-contained and executable
- Use clear step numbering (1, 2, 3...)
- Include decision points where the AI should ask the user
- Mark actions as `[AUTO]`, `[CONFIRM]`, or `[INTERACTIVE]`
- Include tool-specific instructions for different AI tools (Claude Code, Cursor, etc.)

### When Editing Templates
- Use `{{placeholder}}` syntax for dynamic content
- Use `{{#if condition}}...{{/if}}` for conditional sections
- Mark user-preservable sections with `<!-- USER_SECTION_START -->` / `<!-- USER_SECTION_END -->`

### When Adding New Features
1. Determine which mode it affects:
   - Environment setup → `/bootstrap/environment/procedures/`
   - Project bootstrap → `/bootstrap/project/procedures/`
   - Both → update relevant orchestrators
2. Add any new templates to `/bootstrap/templates/`
3. Update the appropriate orchestrator (environment/AGENTS.md or project/AGENTS.md)
4. Update `/bootstrap/AGENTS.md` if mode routing logic changes
5. Update this file if the repo structure changes

### Tool-Agnostic Considerations
- MCP installation varies by tool - include instructions for each supported tool
- Use generic terms like "AI coding assistant" instead of "Claude Code" where appropriate
- The bootstrap generates both `AGENTS.md` (primary) and `CLAUDE.md` (forwarding file for Claude Code)
- Docs directory is `ai-docs/` not `claude-docs/`
- Bootstrap state is `.ai-bootstrap/` not `.claude-bootstrap/`

## Code Style

This repo is mostly markdown, but when writing code (scripts, templates with code snippets, hook examples):

- **No hardcoded secrets** in templates or examples - use `YOUR_KEY_HERE` placeholders
- **Cross-platform** - Node.js for scripts, not bash (Windows compatibility)
- **Small files** - 200-400 lines typical, 800 max
- **Explicit error handling** - templates should show proper error patterns, not happy-path-only

## Security Awareness

Bootstrap procedures handle MCP configs that may contain API keys. Rules:

- Never include real API keys in any committed file
- Use clearly fake placeholders: `YOUR_API_KEY_HERE`, `sk-placeholder`
- Templates must remind users to use environment variables for secrets
- Example configs should show env var patterns, not inline secrets

## Working with the Backlog

The `tasks/` directory (gitignored) holds improvement ideas as numbered markdown files. Each task includes: origin, problem statement, proposal, implementation notes, priority, and references.

When picking up work:
1. Read the relevant task file for context
2. Check if `tmp/` has reference material mentioned in the task
3. Follow the development guidelines above for implementation
4. Update or remove the task file when done

## Development Workflow

For non-trivial changes to this repo:

1. **Understand** - Read the relevant procedures, templates, and orchestrators
2. **Plan** - Use plan mode for changes touching multiple files
3. **Implement** - Follow the guidelines above
4. **Test** - Create a test repo, run the bootstrap, verify output
5. **Verify idempotency** - Run bootstrap again, confirm no duplication or breakage

## Testing Changes

To test bootstrap changes:
1. Create a test repository
2. Point your AI coding tool at this repo and ask it to bootstrap the test repo
3. Verify the generated files match expectations
4. Check idempotency by running bootstrap again
5. Test with different AI tools if possible (Claude Code, Cursor, etc.)

## Commit Guidelines

- Use 50/72 rule for commit messages
- First line: imperative summary (max 50 chars)
- Second line: blank
- Third line onwards: details if needed (wrap at 72 chars)
