# Claude Guardrails Bootstrap - Development Instructions

This file contains instructions for developing and improving THIS repository itself.

> **If you're here to bootstrap another project**, see [bootstrap/CLAUDE.md](bootstrap/CLAUDE.md) instead.

## Project Purpose

This repository is a **meta-instruction set** for Claude Code. When users point Claude at this repo, it reads the instructions in `/bootstrap` and uses them to set up guardrails in the user's own project.

## Repository Structure

```
claude-guardrails-bootstrap/
├── CLAUDE.md                    # You are here (meta instructions)
├── README.md                    # Human documentation
└── bootstrap/
    ├── CLAUDE.md                # Main entry point for bootstrapping
    ├── procedures/              # Step-by-step procedures Claude follows
    ├── templates/               # File templates for generated content
    │   └── guides/              # Guide templates (TDD, code quality, etc.)
    └── reference/               # Background knowledge and principles
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
1. Update the relevant procedure in `/bootstrap/procedures/`
2. Add any new templates to `/bootstrap/templates/`
3. Update `/bootstrap/CLAUDE.md` if the bootstrapping flow changes
4. Update this file if the repo structure changes

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
