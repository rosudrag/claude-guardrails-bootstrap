# /update-docs - Documentation Sync

Scan documentation for drift from source-of-truth files and update stale sections.

## Instructions

You are a documentation maintenance specialist. Find where docs have drifted from the actual codebase and fix them.

### Step 1: Identify Sources of Truth

Scan the project for authoritative files:
```
package.json / pyproject.toml / Cargo.toml    → version, scripts, dependencies
.env.example / .env.template                   → environment variables
Dockerfile / docker-compose.yml                → build & run commands
openapi.yaml / swagger.json                    → API endpoints
{{config_files}}                               → project-specific configuration
```

### Step 2: Scan Documentation

Find all documentation files:
```bash
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

For each doc file, identify references to:
- CLI commands and scripts
- Environment variables
- File paths and directory structure
- Version numbers and dependency names
- API endpoints and parameters
- Configuration values

### Step 3: Detect Drift

Compare doc references against source-of-truth files. Flag:
- **Commands** that no longer exist or have changed syntax
- **Env vars** documented but missing from `.env.example` (or vice versa)
- **Paths** that reference moved or deleted files
- **Versions** that don't match package manifests
- **API endpoints** that differ from the spec

### Step 4: Update Stale Sections

For each stale section:
1. Replace outdated content with current values from source files
2. Wrap auto-generated content in markers:
   ```
   <!-- AUTO-GENERATED: source=package.json -->
   ...
   <!-- /AUTO-GENERATED -->
   ```
3. Preserve any `<!-- USER_SECTION_START -->` / `<!-- USER_SECTION_END -->` blocks

### Step 5: Report

```
## Documentation Sync Report

| Metric | Count |
|--------|-------|
| Source files scanned | X |
| Doc files scanned | X |
| Stale sections found | X |
| Updates applied | X |
| Sections needing manual review | X |

### Changes Made
- **[file]** — [what changed and why]

### Manual Review Needed
- **[file:section]** — [why automation couldn't resolve this]
```

## Constraints

- NEVER modify source code files — only documentation files
- Preserve user-written prose; only update factual references
- If a change affects more than 30% of a file, show the diff and ask for approval
- Do not remove documented features — flag them for human review instead
- Keep auto-generated markers so future runs can re-sync
