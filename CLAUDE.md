# Claude Praxis - Development Instructions

This file contains instructions for developing and improving THIS repository itself.

> **If you're here to bootstrap another project**, see [bootstrap/CLAUDE.md](bootstrap/CLAUDE.md) instead.

## Project Purpose

This repository is a **comprehensive methodology system** for Claude Code. When users point Claude at this repo, it reads the instructions in `/bootstrap` and uses them to set up the praxis system in the user's own project.

## Repository Structure

```
claude-praxis/
├── CLAUDE.md                    # You are here (meta instructions)
├── README.md                    # Human documentation
└── bootstrap/
    ├── CLAUDE.md                # Entry point router (mode selection)
    ├── .state/                  # Environment setup state
    │   ├── .gitkeep
    │   └── environment-state.template.json
    ├── environment/             # Mode 1: Environment setup (global tools)
    │   ├── CLAUDE.md           # Environment orchestrator
    │   └── procedures/
    │       ├── 01-install-serena.md
    │       ├── 02-install-mcp-servers.md
    │       └── 03-install-agents.md
    ├── project/                 # Mode 2: Project bootstrap (project files)
    │   ├── CLAUDE.md           # Project orchestrator
    │   ├── procedures/
    │   │   ├── 00-analyze-project.md
    │   │   ├── 01-generate-claude-md.md
    │   │   ├── 02-generate-docs.md
    │   │   └── 03-setup-adrs.md
    │   └── verification.md      # Post-bootstrap verification
    ├── templates/               # Shared templates for both modes
    │   ├── CLAUDE.md.template
    │   ├── adr-template.md
    │   └── guides/              # Guide templates (TDD, code quality, etc.)
    └── reference/               # Shared reference docs
        ├── guardrail-principles.md
        └── serena-best-practices.md
```

## Development Guidelines

### When Editing Procedures
- Each procedure should be self-contained and executable
- Use clear step numbering (1, 2, 3...)
- Include decision points where Claude should ask the user
- Mark actions as `[AUTO]`, `[CONFIRM]`, or `[INTERACTIVE]`

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
3. Update the appropriate orchestrator (environment/CLAUDE.md or project/CLAUDE.md)
4. Update `/bootstrap/CLAUDE.md` if mode routing logic changes
5. Update this file if the repo structure changes

## Testing Changes

To test bootstrap changes:
1. Create a test repository
2. Point Claude Code at this repo and ask it to bootstrap the test repo
3. Verify the generated files match expectations
4. Check idempotency by running bootstrap again

## Commit Guidelines

- Use 50/72 rule for commit messages
- First line: imperative summary (max 50 chars)
- Second line: blank
- Third line onwards: details if needed (wrap at 72 chars)
