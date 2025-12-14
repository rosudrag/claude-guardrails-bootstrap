# Procedure: Generate Documentation

Create or enhance AI documentation for the project.

## Purpose

Projects need detailed guides that CLAUDE.md references. These provide in-depth instructions for specific practices without cluttering the main file.

**⚠️ CRITICAL**: This procedure's behavior depends on the `comparison_to_praxis.recommendation` from analysis.json:
- `enhance_existing` → Enhance guides in the existing docs location
- `create_new` → Create `claude-docs/` directory with Praxis guides
- `no_changes_needed` → Skip this procedure entirely

---

## Pre-Check: Read Analysis Results [AUTO]

Before proceeding, read `.claude-bootstrap/analysis.json` and check:

```json
{
  "comparison_to_praxis": {
    "recommendation": "enhance_existing|create_new|no_changes_needed",
    "gaps_identified": ["hypothesis_tdd", "security", ...]
  },
  "documentation_inventory": {
    "ai_docs_directory": {
      "path": "docs/ai-includes/",  // or null if none found
      ...
    }
  }
}
```

**Decision tree:**

```
IF recommendation == "no_changes_needed":
    → Skip this procedure. Log: "Existing docs exceed Praxis templates. No changes needed."
    → Proceed to next procedure.

IF recommendation == "enhance_existing":
    → Use existing docs path (e.g., "docs/ai-includes/")
    → Only add/enhance guides listed in gaps_identified
    → DO NOT create claude-docs/

IF recommendation == "create_new":
    → Create claude-docs/ with all Praxis guides
    → Standard procedure below applies
```

---

## Path A: Enhance Existing Documentation

**When**: `recommendation == "enhance_existing"`

### A1. Identify Target Directory [AUTO]

Use the path from `documentation_inventory.ai_docs_directory.path` (e.g., `docs/ai-includes/`).

### A2. Identify Gaps [AUTO]

Check `comparison_to_praxis.gaps_identified`. Common gaps:

| Gap ID | What's Missing | Action |
|--------|----------------|--------|
| `hypothesis_tdd` | TDD guide lacks hypothesis-driven approach | Enhance existing TDD guide |
| `security` | No security guide | Add new security.md |
| `iterative_problem_solving` | No debugging methodology | Add new guide |
| `multi_approach_validation` | No approach comparison guide | Add new guide |
| `code_quality` | No code quality principles | Add new guide |
| `research_workflow` | No research methodology | Add new guide |

### A3. For Each Gap: Enhance or Create [AUTO]

**If existing guide needs enhancement** (e.g., `hypothesis_tdd`):

1. **Read the existing guide** completely
2. **Read the Praxis template** for comparison
3. **Identify specific missing sections** from Praxis template
4. **Merge new content** into existing guide:
   - Add missing sections (don't duplicate existing content)
   - Preserve project-specific examples
   - Add cross-references to other guides
   - Adapt language/framework examples to match project

**If guide is missing entirely**:

1. **Copy from Praxis template**
2. **Adapt for project**:
   - Replace generic examples with project-specific ones
   - Adjust language/framework references
   - Add cross-references to existing project guides
3. **Write to existing docs directory** (NOT claude-docs/)

### A4. Update Cross-References [AUTO]

After adding/enhancing guides:
1. Check each guide's "Related Guides" section
2. Add links to newly added guides
3. Ensure bidirectional references exist

### A5. Log Enhancements [AUTO]

```
Enhanced existing documentation at docs/ai-includes/:
- tdd-enforcement.md - ENHANCED (added hypothesis-driven sections)
- security.md - CREATED (new guide)
- iterative-problem-solving.md - CREATED (new guide)
- multi-approach-validation.md - CREATED (new guide)

Preserved existing guides:
- testing-guide.md (project-specific, not modified)
- architecture.md (project-specific, not modified)
```

---

## Path B: Create New Documentation

**When**: `recommendation == "create_new"`

### B1. Create Directory [AUTO]

```bash
mkdir -p claude-docs
```

If directory creation fails, log error and skip this procedure.

### B2. Check for Existing Files [AUTO]

For each standard document, check if it already exists:
- If exists: **Skip** (don't overwrite user customizations)
- If missing: Create from template

### B3. Generate Guides [AUTO if missing]

Create these files in `claude-docs/`:

| File | Purpose | Template |
|------|---------|----------|
| `tdd-enforcement.md` | TDD workflow and requirements | [templates/guides/tdd-enforcement.md](../templates/guides/tdd-enforcement.md) |
| `code-quality.md` | Code standards and principles | [templates/guides/code-quality.md](../templates/guides/code-quality.md) |
| `security.md` | Security practices and guidelines | [templates/guides/security.md](../templates/guides/security.md) |
| `research-workflow.md` | When/how to investigate unknowns | [templates/guides/research-workflow.md](../templates/guides/research-workflow.md) |
| `iterative-problem-solving.md` | Systematic debugging methodology | [templates/guides/iterative-problem-solving.md](../templates/guides/iterative-problem-solving.md) |
| `multi-approach-validation.md` | Evaluating multiple solutions | [templates/guides/multi-approach-validation.md](../templates/guides/multi-approach-validation.md) |

**Customization**: Adapt examples for the detected language/framework from analysis.json.

### B4. Create Index [AUTO]

Create `claude-docs/README.md`:

```markdown
# Claude Documentation

Supporting guides for AI-assisted development.

## Available Guides

### Core Practices
- [TDD Enforcement](tdd-enforcement.md) - Hypothesis-driven test-first development
- [Code Quality](code-quality.md) - Coding standards and principles
- [Security](security.md) - Security practices and guidelines

### Problem Solving
- [Iterative Problem Solving](iterative-problem-solving.md) - Systematic debugging methodology
- [Multi-Approach Validation](multi-approach-validation.md) - Evaluating multiple solutions
- [Research Workflow](research-workflow.md) - How to investigate unknowns

## Adding Custom Guides

Add any project-specific guides to this directory and reference them in the root CLAUDE.md.
```

### B5. Log Creation [AUTO]

```
Created claude-docs/ with guides:
- tdd-enforcement.md - CREATED
- code-quality.md - CREATED
- security.md - CREATED
- research-workflow.md - CREATED
- iterative-problem-solving.md - CREATED
- multi-approach-validation.md - CREATED
- README.md - CREATED

Customize these guides for your project's specific needs.
```

---

## Enhancement Guidelines

When enhancing existing guides (Path A), follow these principles:

### DO:
- **Read existing content first** before adding anything
- **Preserve project-specific examples** - they're more valuable than generic ones
- **Merge methodology** - add Praxis concepts without duplicating structure
- **Add missing sections** at appropriate locations in existing structure
- **Maintain existing formatting** and style conventions
- **Add cross-references** to connect new and existing guides

### DON'T:
- **Don't replace** existing guides with templates
- **Don't duplicate** content that already exists
- **Don't change** project-specific terminology or examples
- **Don't restructure** existing well-organized guides
- **Don't create claude-docs/** if docs already exist elsewhere

### Example Enhancement: TDD Guide

If existing TDD guide is procedural (lacks hypothesis-driven approach):

```markdown
## The True Nature of TDD: Hypothesis-Driven Development

> **ADD THIS SECTION** to existing guide

TDD is not about testing. **TDD is about thinking clearly before coding.**

A test is a hypothesis expressed in code. When you write a test first, you're saying:

> "I hypothesize that when [condition], the system should [behavior]."

[... rest of hypothesis-driven content from Praxis template ...]
```

Preserve existing sections about:
- Project-specific test commands
- Framework-specific patterns
- Team conventions

---

## Error Handling

### Cannot Create Directory (Path B)

If `mkdir -p claude-docs` fails:
1. Log error with details
2. Record in manifest: `"docs": { "skipped": true, "reason": "directory_creation_failed" }`
3. Continue with next procedure

### Cannot Write to Existing Directory (Path A)

If writing to existing docs directory fails:
1. Log error with details
2. Try `claude-docs/` as fallback
3. If fallback fails, record in manifest and continue

### Template Files Not Found

If templates are missing:
1. Log which templates are missing
2. Create minimal versions with basic content
3. Continue with available templates

---

## Output

**Path A (enhance_existing)**:
- Enhanced guides in existing location
- New guides added to existing location
- Cross-references updated

**Path B (create_new)**:
- Creates `claude-docs/` directory
- Creates standard guide files
- Creates README.md index

---

## Self-Verification Checklist

Before proceeding to the next step, verify based on path taken:

**Path A (enhance_existing)**:
- [ ] All gaps from `gaps_identified` addressed
- [ ] Existing guides preserved (not overwritten)
- [ ] Cross-references added between guides
- [ ] Manifest updated with enhancement details

**Path B (create_new)**:
- [ ] `claude-docs/` directory exists
- [ ] Core guides present: `tdd-enforcement.md`, `code-quality.md`, `security.md`
- [ ] Problem-solving guides present: `iterative-problem-solving.md`, `multi-approach-validation.md`, `research-workflow.md`
- [ ] `claude-docs/README.md` exists
- [ ] Manifest updated with docs generation status

Proceed to next step regardless of which path was taken.
