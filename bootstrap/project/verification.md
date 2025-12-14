# Project Bootstrap Verification

Verify that all expected files were created correctly and are functional.

This procedure runs automatically after project bootstrap completes.

---

## Verification Checks

### 1. File Existence [AUTO]

Verify all expected files exist:

| File/Directory | Required | Check |
|----------------|----------|-------|
| `CLAUDE.md` | Yes | File exists and is readable |
| `claude-docs/` OR enhanced existing docs | Yes | Directory exists with guides |
| `docs/adrs/` | Yes | Directory exists |
| `docs/adrs/0000-adr-template.md` | Yes | Template exists |
| `.claude-bootstrap/` | Yes | Directory exists |
| `.claude-bootstrap/analysis.json` | Yes | File exists and valid JSON |
| `.claude-bootstrap/manifest.json` | Yes | File exists and valid JSON |
| `.serena/project.yml` | If Serena available | File exists |

**For each missing required file:**
- Log error: "Missing required file: {{filename}}"
- Set verification status to FAILED

### 2. CLAUDE.md Validation [AUTO]

Validate CLAUDE.md content:

| Check | Validation |
|-------|------------|
| File size | > 100 bytes (not empty) |
| Has project name/description | Search for project-specific content |
| Has build commands | Contains discovered commands |
| Has file structure | Contains key paths |
| No excessive placeholders | < 5 instances of "{{" or "USER_SECTION" unfilled |

**If validation fails:**
- Log warning: "CLAUDE.md may be incomplete or corrupted"
- Set verification status to WARNING

### 3. Documentation Validation [AUTO]

Validate generated/enhanced documentation:

**If claude-docs/ was created:**
- Check for expected guides:
  - `tdd-enforcement.md` OR `hypothesis-driven-tdd.md`
  - `code-quality.md`
  - `iterative-problem-solving.md`
  - `security.md`
  - `research-workflow.md`
- Verify each guide is > 500 bytes (not just empty templates)

**If existing docs were enhanced:**
- Verify at least one guide was added or updated
- Check manifest for documentation_action taken

**If validation fails:**
- Log warning: "Documentation may be incomplete"
- Set verification status to WARNING

### 4. ADR Structure Validation [AUTO]

Validate ADR setup:

| Check | Validation |
|-------|------------|
| `docs/adrs/` exists | Directory present |
| Template exists | `0000-adr-template.md` or `template.md` |
| Template has sections | Contains "Status", "Context", "Decision" |
| Index exists | `README.md` or `index.md` (optional) |

**If validation fails:**
- Log warning: "ADR structure may be incomplete"
- Set verification status to WARNING

### 5. Serena Connectivity Test [AUTO]

**Only if Serena is marked as available in manifest:**

1. Try calling `mcp__serena__check_onboarding_performed`
2. If successful:
   - Log: "✓ Serena connectivity verified"
   - Check if onboarding was performed
3. If fails:
   - Log warning: "⚠ Serena is installed but not responding"
   - Suggest: "Try restarting Claude Code"
   - Set verification status to WARNING

**If Serena not available:**
- Skip this check
- Note in report: "⊗ Serena not configured"

### 6. Manifest Completeness [AUTO]

Verify manifest has all required fields:

```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "<timestamp>",
  "completed_at": "<timestamp>",
  "steps_completed": ["analyze", "generate-claude-md", "generate-docs", "setup-adrs"],
  "steps_skipped": [],
  "project_type": "<type>",
  "environment_setup_available": true|false,
  "serena_available": true|false
}
```

**Required fields:**
- `bootstrap_version`
- `started_at`
- `completed_at`
- `steps_completed` (array with at least 3 items)
- `project_type`

**If validation fails:**
- Log error: "Manifest is incomplete"
- Set verification status to FAILED

---

## Verification Report

Generate and display report:

### Success Report

```
Verification complete - All checks passed!

✓ CLAUDE.md (80 lines)
✓ claude-docs/ (6 files, 45KB)
✓ docs/adrs/ (structure initialized, template present)
✓ .serena/ (configured and responding)
✓ .claude-bootstrap/ (analysis and manifest valid)

Bootstrap successful! Ready to use.
```

### Warning Report

```
Verification complete - Warnings found

✓ CLAUDE.md (80 lines)
✓ claude-docs/ (6 files, 45KB)
✓ docs/adrs/ (structure initialized)
⚠ .serena/ (not responding - try restarting Claude Code)
✓ .claude-bootstrap/ (analysis and manifest valid)

Bootstrap completed with warnings. See above for details.
```

### Failure Report

```
Verification failed - Critical issues found

✗ CLAUDE.md (missing or corrupted)
✓ claude-docs/ (6 files)
✗ docs/adrs/ (structure incomplete)
✓ .claude-bootstrap/ (analysis valid, manifest corrupted)

Please review errors above and retry bootstrap.
```

---

## Verification Status Levels

| Level | Meaning | Action |
|-------|---------|--------|
| PASSED | All checks successful | Proceed, display success report |
| WARNING | Non-critical issues found | Proceed, display warnings in report |
| FAILED | Critical issues found | Display errors, suggest re-running bootstrap |

---

## Recovery Recommendations

Based on verification results, provide actionable recommendations:

### Missing Files
```
Recommendation: Re-run project bootstrap
Command: "bootstrap this project"
```

### Serena Not Responding
```
Recommendation: Restart Claude Code
If still not working: "verify environment setup"
```

### Corrupted Manifest
```
Recommendation: Delete .claude-bootstrap/ and re-run
Commands:
1. Delete .claude-bootstrap/ directory
2. "bootstrap this project"
```

### Documentation Incomplete
```
Recommendation: Re-run documentation generation
This is safe - existing guides won't be overwritten
```

---

## Integration with Bootstrap Flow

This verification runs automatically:
- At the end of project bootstrap (step 7)
- Can be run manually with "verify project bootstrap"
- Results are displayed in summary report
- Status is recorded in manifest

---

## Self-Verification Checklist

Before completing this procedure:

- [ ] All file existence checks performed
- [ ] CLAUDE.md validated
- [ ] Documentation validated
- [ ] ADR structure validated
- [ ] Serena connectivity tested (if applicable)
- [ ] Manifest completeness checked
- [ ] Verification report generated and displayed
- [ ] Status level determined (PASSED/WARNING/FAILED)
- [ ] Recovery recommendations provided (if needed)

---

## Exit Codes

For automation/scripting:

| Status | Meaning |
|--------|---------|
| PASSED | Verification successful, no issues |
| WARNING | Verification successful, minor issues |
| FAILED | Verification failed, critical issues |
