# Procedure: Generate Documentation

Create the claude-docs/ directory with supporting guides.

## Purpose

The `claude-docs/` directory contains detailed guides that CLAUDE.md references. These provide in-depth instructions for specific practices without cluttering the main file.

## Standard Documents

Create these files in `claude-docs/`:

| File | Purpose | Template |
|------|---------|----------|
| `tdd-enforcement.md` | TDD workflow and requirements | [templates/guides/tdd-enforcement.md](../templates/guides/tdd-enforcement.md) |
| `code-quality.md` | Code standards and principles | [templates/guides/code-quality.md](../templates/guides/code-quality.md) |
| `research-workflow.md` | When/how to investigate unknowns | [templates/guides/research-workflow.md](../templates/guides/research-workflow.md) |

## Steps

### 1. Create Directory [AUTO]

```bash
mkdir -p claude-docs
```

### 2. Check for Existing Docs [AUTO]

For each standard document, check if it already exists:
- If exists: Skip (don't overwrite user customizations)
- If missing: Create from template

### 3. Generate TDD Guide [AUTO if missing]

Copy from template, customize for detected language:

```markdown
# TDD Enforcement Guide

[Language-specific examples based on {{primary_language}}]
```

See [templates/guides/tdd-enforcement.md](../templates/guides/tdd-enforcement.md).

### 4. Generate Code Quality Guide [AUTO if missing]

Copy from template, customize for detected stack:

```markdown
# Code Quality Principles

[Stack-specific patterns based on {{frameworks}}]
```

See [templates/guides/code-quality.md](../templates/guides/code-quality.md).

### 5. Generate Research Workflow [AUTO if missing]

Copy from template:

```markdown
# Research Workflow

When uncertain about implementation details...
```

See [templates/guides/research-workflow.md](../templates/guides/research-workflow.md).

### 6. Create Index [AUTO]

Create `claude-docs/README.md`:

```markdown
# Claude Documentation

Supporting guides for AI-assisted development.

## Available Guides

- [TDD Enforcement](tdd-enforcement.md) - Test-driven development workflow
- [Code Quality](code-quality.md) - Coding standards and principles
- [Research Workflow](research-workflow.md) - How to investigate unknowns

## Adding Custom Guides

Add any project-specific guides to this directory and reference them in the root CLAUDE.md.
```

### 7. Report to User [CONFIRM]

> "I've created the claude-docs/ directory with these guides:
> - `tdd-enforcement.md` - TDD workflow ({{status}})
> - `code-quality.md` - Code standards ({{status}})
> - `research-workflow.md` - Research approach ({{status}})
> - `README.md` - Index
>
> These are referenced from your CLAUDE.md. Customize them for your project's specific needs."

Where `{{status}}` is "created" or "skipped (already exists)".

## Optional Documents

Based on project analysis, offer to create:

| Condition | Document | Purpose |
|-----------|----------|---------|
| Is monorepo | `monorepo-navigation.md` | How to navigate between packages |
| Has complex architecture | `architecture-overview.md` | System design guide |
| Has external integrations | `integration-guide.md` | How to work with external APIs |

Ask user:

> "Based on your project, would you like me to create any additional guides?
> {{#if is_monorepo}}
> - [ ] Monorepo navigation guide
> {{/if}}
> - [ ] Custom guide (describe what you need)"

## Output

- Creates `claude-docs/` directory
- Creates standard guide files (if not existing)
- Creates README.md index
