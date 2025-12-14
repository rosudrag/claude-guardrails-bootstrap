# Procedure: Install Serena MCP

Install and configure Serena MCP for semantic code understanding.

## What is Serena?

Serena is an MCP (Model Context Protocol) server that gives Claude semantic understanding of code:
- Find symbols by name across the codebase
- Understand relationships between classes/functions
- Navigate code intelligently (not just text search)
- Persistent memory for project-specific knowledge

---

## Serena MCP Tool Reference

Once installed, Serena provides these MCP tools for code analysis and memory management:

### Core Analysis Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__serena__get_symbols_overview` | Get high-level view of symbols in a file (classes, functions, etc.) | `relative_path` (required) |
| `mcp__serena__find_symbol` | Find symbols by name pattern across codebase | `name_path_pattern` (required), `relative_path` (optional), `include_body`, `depth` |
| `mcp__serena__search_for_pattern` | Regex search across files (flexible file filtering) | `substring_pattern` (required), `relative_path`, `paths_include_glob`, `paths_exclude_glob` |
| `mcp__serena__find_referencing_symbols` | Find all references to a specific symbol | `name_path` (required), `relative_path` (required) |

### Memory Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__serena__write_memory` | Store project knowledge for future sessions | `memory_file_name` (required), `content` (required) |
| `mcp__serena__read_memory` | Retrieve previously stored project knowledge | `memory_file_name` (required) |
| `mcp__serena__list_memories` | List all available memory files | (none) |
| `mcp__serena__edit_memory` | Update existing memory content | `memory_file_name`, `needle`, `repl`, `mode` |
| `mcp__serena__delete_memory` | Remove a memory file | `memory_file_name` (required) |

### Project Management Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__serena__onboarding` | Initialize Serena for a new project | (none) - interactive |
| `mcp__serena__check_onboarding_performed` | Verify if project is already configured | (none) |
| `mcp__serena__activate_project` | Switch to a different project | `project` (required) |
| `mcp__serena__list_dir` | List directory contents | `relative_path`, `recursive` |
| `mcp__serena__find_file` | Find files by name/mask | `file_mask`, `relative_path` |

### Code Modification Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__serena__replace_symbol_body` | Replace a symbol's implementation | `name_path`, `relative_path`, `body` |
| `mcp__serena__insert_after_symbol` | Insert code after a symbol | `name_path`, `relative_path`, `body` |
| `mcp__serena__insert_before_symbol` | Insert code before a symbol | `name_path`, `relative_path`, `body` |
| `mcp__serena__rename_symbol` | Rename a symbol across codebase | `name_path`, `relative_path`, `new_name` |

### Workflow Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__serena__think_about_collected_information` | Reflect on search results | (none) |
| `mcp__serena__think_about_task_adherence` | Verify still on track before edits | (none) |
| `mcp__serena__think_about_whether_you_are_done` | Check if task is complete | (none) |
| `mcp__serena__initial_instructions` | Get Serena usage manual | (none) |

---

## Prerequisites

- Node.js installed (check with `node --version`)
- npm available (check with `npm --version`)

If prerequisites aren't met, log a warning and skip Serena installation.

## Steps

### 1. Check for Existing Serena Setup [AUTO]

Look for `.serena/project.yml` in the project root.

If found, skip Serena setup and proceed to next procedure.

### 2. Check Node.js Prerequisites [AUTO]

Verify Node.js and npm are available:
- If available: continue with installation
- If not available: log warning, skip Serena, continue with other bootstrap steps

### 3. Install Serena MCP [AUTO]

Attempt to install Serena:

```bash
npm install -g serena-mcp
```

**On failure**: Log the error, record in manifest as skipped, and continue with bootstrap.

### 4. Configure Claude Code MCP Settings [AUTO]

Create or update `.claude/settings.local.json` to include Serena:

```json
{
  "mcpServers": {
    "serena": {
      "command": "serena-mcp",
      "args": ["--project", "."]
    }
  }
}
```

If settings file already exists, merge the serena configuration.

### 5. Initialize Serena Project [AUTO]

Use Serena's `onboarding` tool to initialize the project automatically.

This will:
- Detect the project's language and structure
- Create `.serena/project.yml` configuration
- Set up the memories directory
- Index the codebase

### 6. Create Initial Memory [AUTO]

After Serena initializes, create a bootstrap memory using Serena's memory tools:

```markdown
# Bootstrap Information

Bootstrapped on {{date}} using Claude Praxis.

## Project Analysis Results
- **Project Type**: {{project_type}}
- **Primary Language**: {{primary_language}}
- **Frameworks**: {{frameworks}}

## Guardrails Installed
- CLAUDE.md with project instructions
- claude-docs/ with guides (TDD, code quality, research workflow)
- ADR structure at docs/adrs/

## Next Steps
- Review and customize CLAUDE.md
- Add project-specific knowledge to memories
- Create ADRs for existing architectural decisions
```

### 7. Log Installation Status [AUTO]

Log what was accomplished:

> "Serena MCP installed and initialized:
> - `.serena/project.yml` - Project configuration
> - `.serena/memories/` - Persistent knowledge store
> - Semantic code navigation capabilities
>
> Note: Claude Code restart may be needed for MCP server recognition."

## Troubleshooting Reference

**npm install fails:**
- Node.js version issue (requires 18+)
- Permission issue (may need admin/sudo)
- Network connectivity

**Serena not recognized in Claude Code:**
- Restart Claude Code
- Check `.claude/settings.local.json` syntax
- Verify serena-mcp is in PATH

**Serena initialization fails:**
- Project may have no recognizable source files
- Language may not be supported
- Try manual configuration if needed

## Skip Conditions

Skip this procedure if:
- User explicitly asked to skip Serena
- Node.js/npm not available (log and continue)
- Installation fails after one attempt (log and continue)

## Error Handling

For all errors in this procedure:
1. Log the error to console
2. Record in manifest: `"serena": { "installed": false, "skipped": true, "reason": "{{error_type}}", "error": "{{error_message}}" }`
3. Continue with next bootstrap procedure

Do NOT stop the bootstrap for Serena failures - it's an optional enhancement.

## Self-Verification Checklist

Before proceeding to the next step, verify:

- [ ] Node.js availability checked
- [ ] Installation attempted OR skip reason recorded
- [ ] If installed: `.claude/settings.local.json` configured
- [ ] If installed: `.serena/project.yml` exists
- [ ] Manifest updated with Serena status

Proceed to next step regardless of Serena success/failure.
