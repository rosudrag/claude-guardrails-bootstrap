# Procedure: Install Serena MCP

Install and configure Serena MCP for semantic code understanding.

## What is Serena?

Serena is an MCP (Model Context Protocol) server that gives Claude semantic understanding of code:
- Find symbols by name across the codebase
- Understand relationships between classes/functions
- Navigate code intelligently (not just text search)
- Persistent memory for project-specific knowledge

## Prerequisites

- Node.js installed (check with `node --version`)
- npm available (check with `npm --version`)

If prerequisites aren't met, inform the user and provide installation guidance.

## Steps

### 1. Check for Existing Serena Setup [AUTO]

Look for `.serena/project.yml` in the project root.

If found, ask user:
> "Serena is already configured for this project. Should I skip Serena setup, or reconfigure it?"

### 2. Install Serena MCP [AUTO]

Follow Serena's installation instructions. The typical approach:

```bash
npm install -g serena-mcp
```

Or check https://github.com/serena-ai/serena-mcp for current installation method.

### 3. Configure Claude Code MCP Settings [AUTO]

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

### 4. Initialize Serena Project [INTERACTIVE]

Tell the user:

> "Serena MCP is installed. Now I'll initialize it for your project using Serena's onboarding process.
>
> This will:
> - Detect your project's language and structure
> - Create `.serena/project.yml` configuration
> - Set up the memories directory
> - Index your codebase
>
> Proceed with initialization?"

If user agrees, use Serena's `onboarding` tool to initialize the project.

### 5. Create Initial Memory [AUTO after Serena init]

After Serena initializes, create a bootstrap memory using Serena's memory tools:

```markdown
# Bootstrap Information

Bootstrapped on {{date}} using claude-guardrails-bootstrap.

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

### 6. Verify Installation [CONFIRM]

Tell the user:

> "Serena MCP is installed and initialized. You now have:
> - `.serena/project.yml` - Project configuration
> - `.serena/memories/` - Persistent knowledge store
> - Semantic code navigation capabilities
>
> You may need to restart Claude Code for the MCP server to be recognized."

## Troubleshooting

**npm install fails:**
- Check Node.js version (requires 18+)
- Try with sudo/admin privileges
- Check network connectivity

**Serena not recognized in Claude Code:**
- Restart Claude Code
- Check `.claude/settings.local.json` syntax
- Verify serena-mcp is in PATH

**Serena initialization fails:**
- Check that the project has recognizable source files
- Verify the language is supported by Serena
- Try manual configuration if auto-detection fails

## Skip Conditions

Skip this procedure if:
- User explicitly asked to skip Serena
- User wants minimal bootstrap only
