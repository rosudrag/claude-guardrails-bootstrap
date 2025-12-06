# Procedure: Generate CLAUDE.md

Create a customized CLAUDE.md file for the user's project.

## Purpose

CLAUDE.md is the primary instruction file that Claude Code reads when working on a project. It should contain:
- Project overview and context
- Key architectural decisions
- Navigation guides
- Coding standards
- Links to detailed documentation

## Steps

### 1. Check for Existing CLAUDE.md [CONFIRM]

If `CLAUDE.md` already exists in the project root:

> "I found an existing CLAUDE.md. How would you like me to handle it?
> 1. **Merge** - Add guardrails sections while preserving your content
> 2. **Replace** - Create new CLAUDE.md (backup old as CLAUDE.md.backup)
> 3. **Skip** - Leave existing file unchanged"

### 2. Load Template [AUTO]

Read the template from [templates/CLAUDE.md.template](../templates/CLAUDE.md.template).

### 3. Customize Template [AUTO]

Process the template by replacing placeholders with values from the analysis file (`.claude-bootstrap/analysis.json`).

#### Variable Substitution Rules

Replace these placeholders with actual values:

| Placeholder | Replace With |
|-------------|--------------|
| `{{project_name}}` | Project directory name, or `name` from package.json/*.csproj if available |
| `{{primary_language}}` | Value from analysis (e.g., "TypeScript", "C#", "Python") |
| `{{frameworks}}` | Comma-separated list from analysis (e.g., "React, Next.js") |
| `{{project_type}}` | Value from analysis (e.g., "Application", "Library", "Monorepo") |
| `{{date}}` | Current date in YYYY-MM-DD format |

#### Conditional Section Rules

For sections wrapped in `{{#if condition}}...{{/if}}`:

- **Include the section** if the condition is true
- **Remove the entire block** (including the if tags) if false

Condition mappings based on analysis:

| Condition | Include When |
|-----------|--------------|
| `has_tests` | `tests/`, `test/`, `__tests__/`, or `*.test.*` files exist |
| `is_monorepo` | Multiple package.json files or `packages/`/`apps/` directories exist |
| `language_csharp` | Primary language is C# |
| `language_typescript` | Primary language is TypeScript |
| `language_python` | Primary language is Python |
| `language_go` | Primary language is Go |
| `language_rust` | Primary language is Rust |

#### Example Transformation

Template:
```markdown
**Primary Language**: {{primary_language}}
{{#if language_typescript}}
## TypeScript Guidelines
Use strict mode and proper typing.
{{/if}}
```

With analysis `{ primary_language: "TypeScript", language_typescript: true }`:
```markdown
**Primary Language**: TypeScript

## TypeScript Guidelines
Use strict mode and proper typing.
```

### 4. Add Project-Specific Sections [INTERACTIVE]

Ask the user:

> "I'm generating your CLAUDE.md. Would you like to add any of these optional sections?
> - [ ] Build commands (I'll try to detect them)
> - [ ] Key services/modules to highlight
> - [ ] Team conventions or coding standards
> - [ ] Known gotchas or areas needing care
>
> You can also add these later by editing CLAUDE.md directly."

If user wants build commands, detect from:
- `package.json` scripts (npm/yarn/pnpm)
- `Makefile` targets
- `*.csproj` for dotnet commands
- `Cargo.toml` for cargo commands
- `pyproject.toml` for Python commands

### 5. Write CLAUDE.md [AUTO]

Write the generated content to `CLAUDE.md` in the project root.

If replacing an existing file, first copy it to `CLAUDE.md.backup`.

### 6. Report to User [CONFIRM]

> "I've created CLAUDE.md with the following sections:
> - Project Overview
> - Tech Stack
> - Documentation Index (links to claude-docs/)
> - Core Principles
> - Navigation Guide
>
> Review it and customize as needed. The `<!-- USER_SECTION -->` blocks are yours to edit - I'll preserve them if you re-run bootstrap later."

## Template Location

The template is at: `bootstrap/templates/CLAUDE.md.template`

## Merge Strategy

When merging with existing CLAUDE.md:

1. **Preserve**: Everything between `<!-- USER_SECTION_START: name -->` and `<!-- USER_SECTION_END -->`
2. **Update**: Standard sections (Documentation Index, Core Principles)
3. **Add**: New sections that don't exist
4. **Never delete**: User's custom content

## Output

- Creates or updates `CLAUDE.md` in project root
- If replaced, creates `CLAUDE.md.backup`
- Updates `.claude-bootstrap/manifest.json` with generation timestamp
