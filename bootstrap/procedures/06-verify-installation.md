# Procedure: Verify Installation

Verify the bootstrap completed successfully and everything works.

## Purpose

After all bootstrap steps complete, verify that:
- All files were created correctly
- Serena MCP is accessible (if installed)
- The generated CLAUDE.md is valid
- The manifest is complete

## Steps

### 1. Check Generated Files [AUTO]

Verify these files exist:

| File | Required | Status |
|------|----------|--------|
| `CLAUDE.md` | Yes | Check exists and is non-empty |
| `claude-docs/README.md` | Yes | Check exists |
| `claude-docs/tdd-enforcement.md` | Yes | Check exists |
| `claude-docs/code-quality.md` | Yes | Check exists |
| `claude-docs/research-workflow.md` | Yes | Check exists |
| `docs/adrs/README.md` | Yes | Check exists |
| `docs/adrs/000-template.md` | Yes | Check exists |
| `.claude-bootstrap/analysis.json` | Yes | Check exists and is valid JSON |
| `.claude-bootstrap/manifest.json` | Yes | Check exists and is valid JSON |

If Serena was installed:
| File | Required | Status |
|------|----------|--------|
| `.serena/project.yml` | If Serena | Check exists |
| `.claude/settings.local.json` | If Serena | Check contains serena config |

### 2. Verify CLAUDE.md Content [AUTO]

Check that CLAUDE.md contains:
- [ ] Project name (not placeholder)
- [ ] Primary language (not placeholder)
- [ ] Documentation index with valid links
- [ ] Core principles section
- [ ] No unresolved `{{placeholders}}`

### 3. Verify Serena (if installed) [AUTO]

If Serena was installed, test it works:

1. Try using Serena's `get_symbols_overview` tool on a source file
2. If it responds with symbols, Serena is working
3. If it fails, note the error for troubleshooting

### 4. Update Manifest [AUTO]

Update `.claude-bootstrap/manifest.json`:

```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "...",
  "completed_at": "2024-01-15T10:45:00Z",
  "steps_completed": ["analyze", "serena", "agents", "claude-md", "docs", "adrs", "verify"],
  "steps_skipped": [],
  "verification": {
    "files_created": true,
    "claude_md_valid": true,
    "serena_working": true,
    "verified_at": "2024-01-15T10:45:00Z"
  }
}
```

### 5. Present Summary [CONFIRM]

Tell the user:

> "Bootstrap complete! Here's what was set up:
>
> **Files Created:**
> - `CLAUDE.md` - Your project's AI instructions
> - `claude-docs/` - Supporting guides (TDD, code quality, research)
> - `docs/adrs/` - Architecture decision records structure
>
> **Tools Configured:**
> - Serena MCP: [Installed/Skipped]
> - Specialized Agents: [Installed/Skipped]
>
> **Verification:**
> - All files created successfully: [Yes/No]
> - CLAUDE.md is valid: [Yes/No]
> - Serena is working: [Yes/No/Not installed]
>
> **Next Steps:**
> 1. Review and customize `CLAUDE.md` for your project
> 2. Add project-specific details to the USER_SECTION blocks
> 3. Create ADRs for existing architectural decisions
> 4. Add Serena memories as you learn about the codebase
>
> You may need to restart Claude Code for all changes to take effect."

### 6. Handle Failures [INTERACTIVE]

If any verification fails:

> "Some verification checks failed:
> - [List of failures]
>
> Would you like me to:
> 1. Attempt to fix the issues
> 2. Show troubleshooting steps
> 3. Continue anyway (not recommended)"

## Troubleshooting

### CLAUDE.md has unresolved placeholders
- Re-run procedure 03 (generate-claude-md)
- Check `.claude-bootstrap/analysis.json` exists and has valid data

### Serena not responding
- Restart Claude Code
- Check `.claude/settings.local.json` syntax
- Verify `serena-mcp` is installed globally: `npm list -g serena-mcp`

### Missing files
- Check which procedure failed in manifest
- Re-run the specific procedure
- Check file permissions in project directory

### Manifest is corrupted
- Delete `.claude-bootstrap/manifest.json`
- Re-run bootstrap from the beginning

## Output

- Updates manifest with completion status
- Reports success/failure to user
- Provides next steps guidance
