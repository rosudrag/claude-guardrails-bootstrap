# Procedure: Generate CLAUDE.md

Create a lean, table-based CLAUDE.md for the user's project.

## Purpose

CLAUDE.md is a **lookup document**, not a manual. Claude scans it to find:
- Build/test commands
- Critical rules that must never be violated
- Links to detailed guides
- Key paths in the codebase

**Target size**: ~60-80 lines. If larger, it's too verbose.

---

## Pre-Check: Read Analysis Results [AUTO]

Before proceeding, read `.claude-bootstrap/analysis.json` and check:

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
| `create_new` | Use `./claude-docs` |
| `no_changes_needed` | Use existing path |

---

## Steps

### 1. Check for Existing CLAUDE.md [AUTO]

If `CLAUDE.md` exists:
- Create backup as `CLAUDE.md.backup`
- Read existing content for user customizations

### 2. Load Template [AUTO]

Read template from [templates/CLAUDE.md.template](../templates/CLAUDE.md.template).

### 3. Customize Template [AUTO]

Replace placeholders with values from `analysis.json`:

#### Core Variables

| Placeholder | Source | Fallback |
|-------------|--------|----------|
| `{{project_name}}` | Directory name or package.json/csproj | Directory name |
| `{{docs_path}}` | `documentation_inventory.ai_docs_directory.path` or `claude-docs` | `./claude-docs` |
| `{{has_adrs}}` | `true` if `docs/adrs/` exists | `false` |

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

### 4. Preserve User Customizations [AUTO]

When merging with existing CLAUDE.md, preserve content between:
- `<!-- CUSTOM_RULES_START -->` / `<!-- CUSTOM_RULES_END -->`
- `<!-- CUSTOM_DOCS_START -->` / `<!-- CUSTOM_DOCS_END -->`
- `<!-- KEY_PATHS_START -->` / `<!-- KEY_PATHS_END -->`
- `<!-- ARCHITECTURE_START -->` / `<!-- ARCHITECTURE_END -->`
- `<!-- PROJECT_NOTES_START -->` / `<!-- PROJECT_NOTES_END -->`

If user has edited these sections, keep their content.

### 5. Write CLAUDE.md [AUTO]

Write generated content to `CLAUDE.md` in project root.

### 6. Log Summary [AUTO]

```
Created CLAUDE.md (~XX lines):
- Commands: build, test [detected/placeholder]
- Docs path: {{docs_path}}
- Key paths: X detected
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

## Self-Verification Checklist

Before proceeding:

- [ ] CLAUDE.md is ~60-80 lines (not bloated)
- [ ] Uses table format (not prose)
- [ ] `docs_path` points to correct location
- [ ] User sections preserved if existed
- [ ] Backup created if replacing existing file
