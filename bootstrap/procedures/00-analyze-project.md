# Procedure: Analyze Project

Gather information about the target project to customize the bootstrap.

## Steps

### 1. Create Bootstrap Directory [AUTO]

Create the `.claude-bootstrap/` directory to store bootstrap state:

```bash
mkdir -p .claude-bootstrap
```

### 2. Detect Primary Language [AUTO]

Check for these files to determine the primary language:

| Files Present | Language | Confidence |
|---------------|----------|------------|
| `*.csproj`, `*.sln` | C# | High |
| `package.json` + `tsconfig.json` | TypeScript | High |
| `package.json` (no tsconfig) | JavaScript | Medium |
| `pyproject.toml`, `requirements.txt`, `setup.py` | Python | High |
| `go.mod` | Go | High |
| `Cargo.toml` | Rust | High |
| `pom.xml`, `build.gradle` | Java | High |
| `Gemfile` | Ruby | High |
| `composer.json` | PHP | High |

### 3. Detect Frameworks [AUTO]

Based on language, check for framework indicators:

**C#:**
- `Program.cs` with `WebApplication` → ASP.NET Core
- `Startup.cs` → ASP.NET Core (older style)
- References to `Microsoft.EntityFrameworkCore` → EF Core

**TypeScript/JavaScript:**
- `next.config.js` → Next.js
- `angular.json` → Angular
- `vite.config.ts` → Vite
- `remix.config.js` → Remix
- `dependencies` contains `react` → React
- `dependencies` contains `express` → Express

**Python:**
- Imports `fastapi` → FastAPI
- Imports `django` → Django
- Imports `flask` → Flask

### 4. Detect Project Structure [AUTO]

| Pattern | Classification |
|---------|----------------|
| Multiple `package.json` in subdirs | Monorepo |
| `packages/` or `apps/` directory | Monorepo |
| `src/` only, no `examples/` | Library |
| `src/` + `tests/` + entry point | Application |
| `Dockerfile` present | Containerized |
| `.github/workflows/` | CI/CD configured |
| `tests/`, `test/`, `__tests__/` | Has test structure |
| `docs/` | Has documentation |

### 5. Check Existing Guardrails [AUTO]

Look for:
- `CLAUDE.md` - Already has Claude instructions
- `.serena/` - Already has Serena configured
- `.claude/` - Already has Claude Code config
- `docs/adrs/` - Already has ADR structure

### 6. Save Analysis Results [AUTO]

Write analysis to `.claude-bootstrap/analysis.json`:

```json
{
  "analyzed_at": "2024-01-15T10:30:00Z",
  "project_name": "my-project",
  "primary_language": "TypeScript",
  "language_confidence": "high",
  "frameworks": ["React", "Next.js"],
  "project_type": "Application",
  "structure": {
    "has_tests": true,
    "has_ci_cd": true,
    "has_docs": false,
    "is_containerized": true,
    "is_monorepo": false
  },
  "existing_guardrails": {
    "has_claude_md": false,
    "has_serena": false,
    "has_adrs": false
  },
  "flags": {
    "language_csharp": false,
    "language_typescript": true,
    "language_javascript": false,
    "language_python": false,
    "language_go": false,
    "language_rust": false
  }
}
```

This file is used by subsequent procedures for template processing.

### 7. Generate Analysis Report

Compile findings into this format for the user:

```
## Project Analysis

**Primary Language**: [language] (confidence: high/medium/low)
**Frameworks**: [list]
**Project Type**: [monorepo/library/application]
**Structure**:
  - Has tests: yes/no
  - Has CI/CD: yes/no
  - Has docs: yes/no
  - Containerized: yes/no

**Existing Guardrails**:
  - CLAUDE.md: exists/missing
  - Serena: configured/not configured
  - ADRs: exists/missing

**Recommended Bootstrap**:
  - [ ] Install Serena MCP
  - [ ] Install agents (recommended: [list based on stack])
  - [ ] Generate CLAUDE.md
  - [ ] Create claude-docs/
  - [ ] Set up ADRs
```

### 8. Present to User [CONFIRM]

Show the analysis report and ask:

> "I've analyzed your project. Here's what I found and what I recommend setting up. Should I proceed with this plan? You can also tell me to skip specific steps."

Wait for user confirmation before proceeding to installation procedures.

### 9. Initialize Manifest [AUTO]

Create `.claude-bootstrap/manifest.json` to track bootstrap progress:

```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "steps_completed": ["analyze"],
  "steps_skipped": [],
  "project_type": "TypeScript Application"
}
```

## Output

Analysis results are persisted in `.claude-bootstrap/analysis.json` for use by subsequent procedures.

The manifest at `.claude-bootstrap/manifest.json` tracks overall bootstrap progress.
