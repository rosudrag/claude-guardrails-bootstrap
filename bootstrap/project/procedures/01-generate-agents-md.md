# Procedure: Generate AGENTS.md

Create a lean, table-based AGENTS.md for the user's project, plus a forwarding CLAUDE.md for Claude Code compatibility.

## Purpose

AGENTS.md is a **lookup document**, not a manual. AI assistants scan it to find:
- Build/test commands
- Critical rules that must never be violated
- Links to detailed guides
- Key paths in the codebase

**Target size**: ~60-80 lines. If larger, it's too verbose.

---

## Pre-Check: Read Analysis Results [AUTO]

Before proceeding, read `.ai-bootstrap/analysis.json` and check:

```json
{
  "comparison_to_praxis": {
    "recommendation": "enhance_existing|create_new|no_changes_needed"
  },
  "documentation_inventory": {
    "ai_docs_directory": {
      "path": "docs/ai-includes/"  // or null
    }
  }
}
```

**Determine `docs_path`**:

| Recommendation | docs_path |
|---------------|-----------|
| `enhance_existing` | Use existing path (e.g., `./docs/ai-includes`) |
| `create_new` | Use `./ai-docs` |
| `no_changes_needed` | Use existing path |

---

## Steps

### 1. Check for Existing Files [AUTO]

**If `AGENTS.md` exists:**
- Create backup as `AGENTS.md.backup`
- Read existing content for user customizations

**If `CLAUDE.md` exists (legacy):**
- Check if it's a forwarding file or full content
- If full content, migrate it to AGENTS.md format
- Preserve user customizations

### 2. Load Template [AUTO]

Read template from [templates/AGENTS.md.template](../templates/AGENTS.md.template).

### 3. Customize Template [AUTO]

Replace placeholders with values from `analysis.json`:

#### Core Variables

| Placeholder | Source | Fallback |
|-------------|--------|----------|
| `{{project_name}}` | Directory name or package.json/csproj | Directory name |
| `{{docs_path}}` | `documentation_inventory.ai_docs_directory.path` or `ai-docs` | `./ai-docs` |
| `{{has_adrs}}` | `true` if `docs/adrs/` exists | `false` |
| `{{non_trivial_project}}` | `analysis.json` → `structure.non_trivial_project` | `false` |

#### Discovery Variables

| Placeholder | Source |
|-------------|--------|
| `{{discovery.project_purpose.value}}` | Extracted description |
| `{{discovery.commands.build.value}}` | Detected build command |
| `{{discovery.commands.test.value}}` | Detected test command |
| `{{discovery.commands.lint.value}}` | Detected lint command |
| `{{discovery.commands.dev.value}}` | Detected dev command |
| `{{discovery.key_paths.entry_point.value}}` | Detected entry point |
| `{{discovery.key_paths.business_logic.value}}` | Detected source path |
| `{{discovery.key_paths.tests.value}}` | Detected tests path |
| `{{discovery.key_paths.config.value}}` | Detected config path |

#### Conditional Processing

- `{{#if value}}...{{/if}}` - Include block if value is truthy
- `{{#if value}}...{{else}}...{{/if}}` - Include else block if value is falsy
- Remove all template tags after processing

**Project-size conditionals**: The template uses `{{non_trivial_project}}` (>10 source files) to gate sections that only make sense for multi-file codebases:
- **Agent-First critical rule** - omitted for small projects where delegation adds overhead
- **Workflow section** - omitted for small projects (no subagents to coordinate)

### 4. Preserve User Customizations [AUTO]

When merging with existing AGENTS.md (or legacy CLAUDE.md), preserve content between:
- `<!-- CUSTOM_RULES_START -->` / `<!-- CUSTOM_RULES_END -->`
- `<!-- CUSTOM_DOCS_START -->` / `<!-- CUSTOM_DOCS_END -->`
- `<!-- KEY_PATHS_START -->` / `<!-- KEY_PATHS_END -->`
- `<!-- ARCHITECTURE_START -->` / `<!-- ARCHITECTURE_END -->`
- `<!-- PROJECT_NOTES_START -->` / `<!-- PROJECT_NOTES_END -->`

If user has edited these sections, keep their content.

### 5. Write AGENTS.md [AUTO]

Write generated content to `AGENTS.md` in project root.

### 6. Create CLAUDE.md Forwarding File [AUTO]

Create a `CLAUDE.md` file that forwards to AGENTS.md for Claude Code compatibility:

```markdown
# {{project_name}} - Claude Code Instructions

> This project uses the standard AGENTS.md convention for AI coding assistant instructions.
> This file exists for Claude Code compatibility.

@AGENTS.md
```

This ensures:
- Claude Code users get proper instructions via the @-mention syntax
- Other AI tools read AGENTS.md directly
- Single source of truth (AGENTS.md)

### 7. Log Summary [AUTO]

```
Created AGENTS.md (~XX lines):
- Commands: build, test [detected/placeholder]
- Docs path: {{docs_path}}
- Key paths: X detected

Created CLAUDE.md (forwarding file):
- Points to AGENTS.md for Claude Code compatibility
```

---

## Error Handling

### Template Not Found

Generate minimal fallback:

```markdown
# {{project_name}}

## Commands
| Task | Command |
|------|---------|
| Build | `<!-- ADD -->` |
| Test | `<!-- ADD -->` |

## Doc Lookup
| Need to... | Read |
|------------|------|
| TDD workflow | [tdd-enforcement.md]({{docs_path}}/tdd-enforcement.md) |
```

### Cannot Write File

1. Log error
2. Record in manifest
3. Continue with next procedure

---

## Migration from Legacy CLAUDE.md

If project has an existing CLAUDE.md with full content (not a forwarding file):

1. Read existing CLAUDE.md content
2. Extract user customizations from USER_SECTION markers
3. Create AGENTS.md with template + preserved customizations
4. Replace CLAUDE.md with forwarding file
5. Log: "Migrated CLAUDE.md to AGENTS.md (standard convention)"

---

## Self-Verification Checklist

Before proceeding:

- [ ] AGENTS.md is ~60-80 lines (not bloated)
- [ ] Uses table format (not prose)
- [ ] `docs_path` points to correct location
- [ ] User sections preserved if existed
- [ ] Backup created if replacing existing file
- [ ] CLAUDE.md forwarding file created
