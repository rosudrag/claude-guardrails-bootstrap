# Procedure: Analyze Project

Gather comprehensive information about the target project to customize the bootstrap.

This procedure goes beyond basic language detection to **discover** project-specific details that allow CLAUDE.md to be generated with minimal user placeholders.

## Overview

The analysis has two phases:
1. **Technical Detection** - Language, frameworks, project structure
2. **Deep Discovery** - Commands, paths, conventions, patterns

This runs in **autopilot mode** - no user confirmation needed. Just execute and proceed.

---

## Phase A: Technical Detection

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
- `Program.cs` with `WebApplication` -> ASP.NET Core
- `Startup.cs` -> ASP.NET Core (older style)
- References to `Microsoft.EntityFrameworkCore` -> EF Core

**TypeScript/JavaScript:**
- `next.config.js` -> Next.js
- `angular.json` -> Angular
- `vite.config.ts` -> Vite
- `remix.config.js` -> Remix
- `dependencies` contains `react` -> React
- `dependencies` contains `express` -> Express

**Python:**
- Imports `fastapi` -> FastAPI
- Imports `django` -> Django
- Imports `flask` -> Flask

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

### 5b. Discover Existing Documentation [AUTO] ⚠️ CRITICAL

**This step is essential.** Projects may already have AI documentation in non-standard locations. Skipping this leads to creating redundant docs that duplicate existing content.

Check these locations for existing AI/Claude documentation:

| Location | What to look for |
|----------|------------------|
| `docs/` | Any `.md` files with AI-related content |
| `docs/ai-includes/` | Guide organization (common pattern) |
| `docs/ai/` | Alternative AI docs location |
| `docs/claude/` | Claude-specific docs |
| `.claude/docs/` | Claude Code docs location |
| `claude-docs/` | Standard Praxis location |
| Root `*.md` files | README sections about AI assistance |

**For each discovered docs directory:**

1. **List all markdown files** - Record filenames and line counts
2. **Categorize by purpose** - Map to Praxis guide types:
   - TDD/testing guides → `tdd-enforcement.md` equivalent
   - Security guides → `security.md` equivalent
   - Architecture guides → relates to ADRs
   - Problem-solving guides → `iterative-problem-solving.md` equivalent
   - Code quality guides → `code-quality.md` equivalent
3. **Assess quality** - Check if guides are comprehensive:
   - Line count (>100 lines usually indicates effort)
   - Project-specific examples (not generic)
   - Cross-references to other docs
4. **Compare to Praxis templates** - Are existing guides better, worse, or different?

**Quality assessment criteria:**

| Quality | Indicators |
|---------|------------|
| **Excellent** | 5+ guides, >200KB total, cross-references, project-specific examples, hypothesis-driven TDD |
| **Good** | 3-5 guides, >50KB total, some customization |
| **Basic** | 1-2 guides or generic content |
| **Missing** | No AI documentation found |

**Record in analysis.json:**

```json
"documentation_inventory": {
  "claude_md": {
    "path": "CLAUDE.md",
    "lines": 200,
    "quality": "excellent|good|basic|missing",
    "coverage": ["build_commands", "architecture", "constraints", ...]
  },
  "ai_docs_directory": {
    "path": "docs/ai-includes/",
    "files": 8,
    "total_lines": 2700,
    "guides": [
      {"name": "tdd-enforcement.md", "lines": 314, "has_hypothesis_tdd": false},
      {"name": "testing-guide.md", "lines": 450, "project_specific": true},
      ...
    ]
  },
  "adrs": {
    "path": "docs/adrs/",
    "count": 9,
    "has_template": true,
    "has_index": true
  }
},
"comparison_to_praxis": {
  "claude_md_quality": "exceeds_template|matches_template|below_template",
  "guide_coverage": "exceeds_template|matches_template|below_template",
  "gaps_identified": ["hypothesis_tdd", "security", "iterative_problem_solving"],
  "recommendation": "enhance_existing|create_new|no_changes_needed"
}
```

**⚠️ CRITICAL DECISION**: Based on documentation inventory:

| Existing Docs Quality | Recommendation | Action |
|----------------------|----------------|--------|
| **Excellent** | `enhance_existing` | DON'T create `claude-docs/`. Enhance existing guides in place. |
| **Good** | `enhance_existing` | DON'T create `claude-docs/`. Add missing guides to existing location. |
| **Basic** | `create_new` | Create `claude-docs/` OR enhance existing location (user choice). |
| **Missing** | `create_new` | Create `claude-docs/` with all Praxis guides. |

**This affects procedure 04-generate-docs.md behavior.**

---

## Phase B: Deep Discovery

Go beyond detection to **discover** project-specific information that eliminates USER_SECTION placeholders.

### 6. Discover Project Purpose [AUTO]

Extract a description of what the project does. Check these sources in order:

| Source | Field/Location | Confidence |
|--------|---------------|------------|
| `README.md` | First paragraph after title/badges | Medium |
| `package.json` | `description` field | High |
| `pyproject.toml` | `[project].description` or `[tool.poetry].description` | High |
| `Cargo.toml` | `[package].description` | High |
| `*.csproj` | `<Description>` element | High |
| `pom.xml` | `<description>` element | High |

**Using Serena (ONLY if already installed - skip during first bootstrap):**

> **IMPORTANT**: During first bootstrap, Serena is NOT yet installed. Skip Serena-based
> optimizations and use the file-based fallback methods below. Serena tools become
> available only AFTER completing procedure 01-install-serena.md.

```
Use mcp__serena__search_for_pattern with pattern "^## (About|Description|Overview)"
to find description sections in README without reading entire file.
```

**File-based fallback (use during first bootstrap or if Serena unavailable):**
- Read the first 50-100 lines of README.md
- Extract first paragraph after the title/badges
- Parse description fields from package.json, pyproject.toml, Cargo.toml, etc.

**Fallback inference (Low confidence):**
If no explicit description, infer from:
- Directory name (e.g., "payment-gateway" -> "Payment processing")
- Main entry file docstrings/comments
- Controller/route names suggesting domain

Store as: `discovery.project_purpose`

### 7. Discover Build & Test Commands [AUTO]

Extract commands from project configuration files.

#### From package.json (Node.js/TypeScript/JavaScript)

```javascript
// Read "scripts" section
{
  "scripts": {
    "build": "...",    // -> commands.build
    "test": "...",     // -> commands.test
    "lint": "...",     // -> commands.lint
    "dev": "...",      // -> commands.dev
    "start": "..."     // -> commands.start
  }
}
```

#### From *.csproj / *.sln (C#/.NET)

| Command | Default | Notes |
|---------|---------|-------|
| Build | `dotnet build` | Add solution name if present |
| Test | `dotnet test` | |
| Run | `dotnet run` | Add project name if multiple |

#### From Cargo.toml (Rust)

| Command | Default | Notes |
|---------|---------|-------|
| Build | `cargo build` | |
| Test | `cargo test` | |
| Run | `cargo run` | |
| Lint | `cargo clippy` | If clippy configured |

#### From pyproject.toml / setup.py (Python)

| Pattern | Command |
|---------|---------|
| pytest in deps | `pytest` |
| poetry.lock exists | Prefix with `poetry run` |
| ruff in deps | `ruff check .` |
| black in deps | `black --check .` |

#### From Makefile

Parse for standard targets: `build`, `test`, `lint`, `dev`, `run`

#### From go.mod (Go)

| Command | Default |
|---------|---------|
| Build | `go build ./...` |
| Test | `go test ./...` |
| Lint | `golangci-lint run` (if config present) |

Store as: `discovery.commands`

### 8. Discover Key Locations [AUTO]

Find important directories and files for navigation.

#### Entry Point Detection

| Language | Look For | Confidence |
|----------|----------|------------|
| C# | `Program.cs` in project root or `src/` | High |
| TypeScript/JS | `src/index.ts`, `src/main.ts`, `index.ts`, `app.ts` | High |
| TypeScript/JS | package.json `main` or `module` field | High |
| Python | `main.py`, `app.py`, `__main__.py`, `manage.py` | High |
| Go | `main.go`, `cmd/*/main.go` | High |
| Rust | `src/main.rs`, `src/lib.rs` | High |
| Java | Class with `public static void main` | Medium |

**Using Serena (ONLY if already installed - skip during first bootstrap):**
```
Use mcp__serena__get_symbols_overview on candidate entry files to confirm they
contain main/entry symbols without reading full content.
```

**File-based fallback (use during first bootstrap):**
- Check if candidate files exist using file listing
- Read the first 30-50 lines looking for main/entry patterns:
  - C#: `static void Main` or `WebApplication.CreateBuilder`
  - TypeScript/JS: `export default` or top-level execution code
  - Python: `if __name__ == "__main__"`
  - Go: `func main()`
  - Rust: `fn main()`

#### Business Logic Detection

| Pattern | Path | Confidence |
|---------|------|------------|
| `src/services/`, `src/domain/` | That path | High |
| `src/core/`, `src/lib/` | That path | High |
| `app/services/`, `app/domain/` | That path | High |
| `internal/` (Go) | `internal/` | High |
| `Controllers/`, `Handlers/` | Parent directory | Medium |
| Single `src/` with code | `src/` | Medium |

#### Test Directory Detection

| Pattern | Path | Confidence |
|---------|------|------------|
| `tests/` directory | `tests/` | High |
| `test/` directory | `test/` | High |
| `__tests__/` directory | `__tests__/` | High |
| `*.test.ts`, `*.spec.ts` files | Directory containing them | High |
| `*_test.go` files | Same as source | High |
| `*Tests.cs`, `*.Tests/` | Directory/project | High |

#### Configuration Location Detection

| Pattern | Path | Confidence |
|---------|------|------------|
| `.env.example`, `.env.template` | Project root | High |
| `config/` directory | `config/` | High |
| `appsettings.json` | Project root | High |
| `settings/` directory | `settings/` | High |

Store as: `discovery.key_paths`

### 9. Discover Coding Conventions [AUTO]

Detect code style from configuration files and code samples.

#### From Configuration Files

| File | What It Tells Us |
|------|------------------|
| `.eslintrc*`, `eslint.config.*` | Linting rules, naming conventions |
| `.prettierrc*` | Formatting (quotes, semicolons, tabs) |
| `.editorconfig` | Indentation, line endings |
| `biome.json` | Combined linter/formatter |
| `ruff.toml`, `[tool.ruff]` | Python linting |
| `.rubocop.yml` | Ruby style |
| `.golangci.yml` | Go linting |
| `rustfmt.toml` | Rust formatting |
| `stylecop.json` | C# style |

#### From Code Samples (Sample 2-3 Files)

Pick representative files from business logic directory:

**Naming Conventions:**
- Functions: `camelCase` vs `snake_case`
- Classes: `PascalCase` (usually standard)
- Constants: `SCREAMING_SNAKE_CASE` vs `PascalCase`
- Files: Match class names? kebab-case? snake_case?

**Import Organization:**
- Standard library -> external -> internal?
- Grouped with blank lines?
- Alphabetically sorted?

**Style Details:**
- Quote style (JS/TS): single vs double
- Semicolons: present or omitted
- Trailing commas: always, never, multi-line only
- Brace style: same line or new line

**Using Serena (ONLY if already installed - skip during first bootstrap):**
```
# Sample naming from symbols
Use mcp__serena__get_symbols_overview on 2-3 source files to see function/class names.

# Check import patterns
Use mcp__serena__search_for_pattern with "^import " to sample import organization.
```

**File-based fallback (use during first bootstrap):**
- Read 2-3 representative source files from the business logic directory
- Manually examine function/class names for naming convention patterns
- Use grep/search to sample import statements across multiple files
- Check linter/formatter config files for explicit convention settings

Store as: `discovery.conventions`

### 10. Discover Project Patterns [AUTO]

Analyze how the project handles common concerns.

#### Error Handling Pattern

| Pattern | Detection |
|---------|-----------|
| **Result/Either types** | Search for `Result<`, `Either<`; check deps for `neverthrow`, `fp-ts` |
| **Exceptions** | Custom exception classes, `throw new`, `raise` |
| **Error codes** | Error code enums, numeric constants |
| **Error objects** | `{ error: ... }` or `{ success: false }` patterns |

**Using Serena (ONLY if already installed - skip during first bootstrap):**
```
Use mcp__serena__find_symbol with pattern "Error" or "Exception" to locate error types.
Use mcp__serena__search_for_pattern for "Result<" or "throw new" patterns.
```

**File-based fallback (use during first bootstrap):**
- Use grep to search for `Result<`, `Either<`, `throw new`, `raise` patterns
- Check package dependencies for error handling libraries (neverthrow, fp-ts, etc.)
- Read a few source files to observe error handling style in practice

#### Logging Pattern

| Dependency | Pattern |
|------------|---------|
| `winston`, `pino`, `bunyan` | Structured logging (Node) |
| `loguru`, `structlog` | Structured logging (Python) |
| `slog`, `zerolog`, `zap` | Structured logging (Go) |
| `Serilog`, `NLog` | Structured logging (C#) |
| `console.log` only | Basic console logging |

#### Testing Pattern

| Framework | Style | Pattern |
|-----------|-------|---------|
| Jest, Vitest, Mocha | BDD | `describe`, `it`, `expect` |
| pytest | Function | `def test_*`, `assert` |
| unittest, NUnit, xUnit | Class | `class Test*`, attributes |
| Go testing | Function | `func Test*` |

Also detect:
- AAA (Arrange-Act-Assert) from comments/structure
- BDD (Given-When-Then) from naming
- Fixture patterns

#### Documentation Pattern

| Pattern | Detection |
|---------|-----------|
| JSDoc/TSDoc | `/** ... */` comments |
| Python docstrings | Triple-quoted strings |
| XML docs (C#) | `/// <summary>` |
| Go doc comments | `//` before exported items |

Store as: `discovery.patterns`

---

## Phase B (continued): Save Results

### 11. Save Analysis Results [AUTO]

Write comprehensive analysis to `.claude-bootstrap/analysis.json`:

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
  },
  "discovery": {
    "project_purpose": {
      "value": "A payment gateway API for processing credit card transactions",
      "source": "readme",
      "confidence": "medium"
    },
    "commands": {
      "build": { "value": "npm run build", "source": "package.json", "confidence": "high" },
      "test": { "value": "npm test", "source": "package.json", "confidence": "high" },
      "lint": { "value": "npm run lint", "source": "package.json", "confidence": "high" },
      "dev": { "value": "npm run dev", "source": "package.json", "confidence": "high" }
    },
    "key_paths": {
      "entry_point": { "value": "src/index.ts", "confidence": "high" },
      "business_logic": { "value": "src/services/", "confidence": "high" },
      "tests": { "value": "tests/", "confidence": "high" },
      "config": { "value": ".env.example", "confidence": "high" }
    },
    "conventions": {
      "naming_style": "camelCase for functions, PascalCase for classes",
      "linter": "eslint",
      "formatter": "prettier",
      "import_order": "external -> internal",
      "quote_style": "single",
      "semicolons": true
    },
    "patterns": {
      "error_handling": "Result types (neverthrow)",
      "logging": "Structured JSON (pino)",
      "testing": "BDD style with Jest, AAA pattern",
      "documentation": "TSDoc on public APIs"
    }
  }
}
```

### 12. Generate Analysis Report

Format findings for user review:

```markdown
## Project Analysis

**Primary Language**: TypeScript (confidence: high)
**Frameworks**: React, Next.js
**Project Type**: Application

### Structure
- Has tests: yes
- Has CI/CD: yes
- Has docs: no
- Containerized: yes

### Existing Guardrails
- CLAUDE.md: missing
- Serena: not configured
- ADRs: missing

---

## Discovery Results

### Project Purpose
> A payment gateway API for processing credit card transactions
> *(Source: README.md)*

### Build & Test Commands

| Action | Command | Source |
|--------|---------|--------|
| Build | `npm run build` | package.json |
| Test | `npm test` | package.json |
| Lint | `npm run lint` | package.json |
| Dev | `npm run dev` | package.json |

### Key Locations

| Looking for... | Location |
|----------------|----------|
| Entry point | `src/index.ts` |
| Business logic | `src/services/` |
| Tests | `tests/` |
| Configuration | `.env.example` |

### Coding Conventions
- **Naming**: camelCase for functions, PascalCase for classes
- **Linter**: ESLint
- **Formatter**: Prettier
- **Quotes**: Single quotes
- **Semicolons**: Yes

### Project Patterns
- **Error handling**: Result types (neverthrow)
- **Logging**: Structured JSON (pino)
- **Testing**: BDD style with Jest, AAA pattern
- **Documentation**: TSDoc on public APIs

---

**Recommended Bootstrap**:
- [ ] Install Serena MCP
- [ ] Install agents (recommended: typescript, react)
- [ ] Generate CLAUDE.md
- [ ] Create claude-docs/
- [ ] Set up ADRs
```

### 13. Show Analysis Summary [AUTO]

Display a brief summary of what was discovered (informational only, no confirmation needed):

```
Analysis complete:
- Language: TypeScript (high confidence)
- Frameworks: React, Next.js
- Entry point: src/index.ts
- Test command: npm test

Proceeding with bootstrap...
```

### 14. Initialize Manifest [AUTO]

Create `.claude-bootstrap/manifest.json`:

```json
{
  "bootstrap_version": "1.0.0",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "steps_completed": ["analyze"],
  "steps_skipped": [],
  "project_type": "TypeScript Application",
  "discovery_validated": true,
  "user_corrections_applied": 1
}
```

---

## Efficient Discovery Techniques

### Using Serena Tools (Post-Installation Only)

> **CRITICAL**: During initial bootstrap, Serena is NOT yet installed. All Serena-based
> optimizations in this procedure should be SKIPPED until after procedure 01-install-serena.md
> completes. Use the file-based fallback methods instead.

When Serena MCP is available (after installation), use these tools for efficient discovery:

| Task | Tool | Example |
|------|------|---------|
| See file structure | `mcp__serena__get_symbols_overview` | Check entry point files for main symbols |
| Find patterns | `mcp__serena__search_for_pattern` | Search for `Result<` or `throw new` |
| Locate types | `mcp__serena__find_symbol` | Find custom Error classes |
| Sample imports | `mcp__serena__search_for_pattern` | Check `^import ` patterns |

**Benefits (when available):**
- Faster than reading entire files
- Works on large codebases
- Semantic understanding of code structure

**When to use Serena vs File-based methods:**
| Scenario | Approach |
|----------|----------|
| First bootstrap of a new project | Use file-based fallback methods |
| Re-running bootstrap after Serena installed | Use Serena tools for efficiency |
| Serena installation failed/skipped | Use file-based fallback methods |
| Analyzing a second project (Serena already global) | Check if project has `.serena/` config first |

### Sampling Strategy

Don't read every file. Sample intelligently:

| What to Discover | How to Sample |
|-----------------|---------------|
| Naming conventions | 2-3 business logic files |
| Import patterns | 5-10 import statements via search |
| Error handling | Search for error-related patterns |
| Test patterns | 1-2 test files |

### What NOT to Discover

Some things are better left for user input:
- Team-specific conventions not in code
- Future architectural plans
- Business context beyond documentation
- Security-sensitive configuration

---

## If This Step Fails

### Failure: Cannot Create Bootstrap Directory
**Recovery**: Try `.claude/bootstrap/` instead. If still fails, report error and stop.

### Failure: Language Detection Ambiguous
**Recovery**: Pick the language with most files. Note in analysis as "auto-selected".

### Failure: Discovery Cannot Determine Value
**Recovery**: Leave as null/empty. Template will show placeholder comment.

### Failure: Path Discovery Incomplete
**Recovery**: Continue with partial discovery. Missing paths show as "Not detected" in output.

### Failure: Command Discovery Failed
**Recovery**: Use language defaults (e.g., `dotnet build` for C#). Note source as "default".

---

## Self-Verification Checklist

Before proceeding to the next step, verify:

**Technical Detection:**
- [ ] `.claude-bootstrap/` directory exists and is writable
- [ ] Primary language detected or user provided
- [ ] Language confidence recorded
- [ ] Frameworks detected (or empty array)
- [ ] Project structure classified

**Deep Discovery:**
- [ ] Project purpose populated (discovered or user-provided)
- [ ] Build and test commands known
- [ ] Entry point identified
- [ ] Business logic directory identified
- [ ] Test directory identified
- [ ] Conventions noted (at minimum: naming, linter/formatter)
- [ ] Error handling pattern identified

**Output:**
- [ ] `analysis.json` written successfully
- [ ] `manifest.json` created
- [ ] Summary displayed to user

Proceed immediately to next phase.

---

## Output

Analysis results persist in `.claude-bootstrap/analysis.json`.

Manifest tracks progress in `.claude-bootstrap/manifest.json`.

The discovery section specifically enables:
- **CLAUDE.md generation** with pre-filled commands and paths
- **Accurate project description** without user editing
- **Correct coding convention guidance** in generated docs
- **Pattern-aware suggestions** in TDD and quality guides
