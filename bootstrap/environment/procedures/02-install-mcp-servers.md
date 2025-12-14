# Procedure: Install MCP Servers

Install essential MCP servers for enhanced AI-assisted development.

## What Are MCP Servers?

MCP (Model Context Protocol) servers extend Claude's capabilities by providing:
- Access to up-to-date documentation (Context7)
- Structured reasoning for complex problems (Sequential Thinking)
- Integration with external tools and services

## MCP Servers Installed

### Context7

**Purpose**: Provides up-to-date, version-specific library documentation directly in prompts.

**Benefits**:
- Eliminates outdated or hallucinated API information
- Injects real documentation for libraries you're using
- Supports 1000+ popular libraries and frameworks

**Usage**: Add "use context7" to prompts, e.g., "How do I use React Server Components? use context7"

### Sequential Thinking

**Purpose**: Enables structured, step-by-step reasoning for complex problems.

**Benefits**:
- Breaks down complex problems into manageable steps
- Supports thought revision as understanding evolves
- Enables branching for alternative reasoning paths
- Maintains context over multiple reasoning steps

**Best for**:
- Planning and design tasks
- Debugging complex issues
- Analysis requiring course correction
- Problems where full scope isn't initially clear

---

## Prerequisites

- Node.js 18+ installed (check with `node --version`)
- npm available (check with `npm --version`)

If prerequisites aren't met, log a warning and skip MCP server installation.

## Steps

### 1. Check for Existing MCP Configuration [AUTO]

Look for existing MCP server configuration in:
- `.claude/settings.local.json`
- Check if context7 and/or sequential-thinking are already configured

If both are already configured, skip to verification step.

### 2. Check Node.js Prerequisites [AUTO]

Verify Node.js 18+ and npm are available:
- If available: continue with installation
- If not available: log warning, skip MCP servers, continue with other bootstrap steps

### 3. Configure MCP Servers [AUTO]

Create or update `.claude/settings.local.json` to include the MCP servers:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

If settings file already exists with other MCP servers (like Serena), **merge** the new configurations without overwriting existing entries.

### 4. Log Installation Status [AUTO]

Log what was accomplished:

> "MCP servers configured:
>
> **Context7** - Up-to-date library documentation
> - Usage: Add 'use context7' to prompts for current docs
> - Example: 'How do I use Next.js App Router? use context7'
>
> **Sequential Thinking** - Structured reasoning
> - Automatically used for complex multi-step problems
> - Helps with planning, debugging, and analysis tasks
>
> Note: Claude Code restart may be needed for MCP server recognition."

## MCP Server Reference

Once installed, these MCP servers provide the following capabilities:

### Context7 Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `resolve-library-id` | Resolves library name to Context7 ID | `libraryName` (required) |
| `get-library-docs` | Fetches documentation for a library | `context7CompatibleLibraryID` (required), `topic` (optional), `tokens` (optional, default 5000) |

### Sequential Thinking Tools

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `sequentialthinking` | Record and track reasoning steps | `thought`, `thoughtNumber`, `totalThoughts`, `nextThoughtNeeded`, `isRevision`, `revisesThought`, `branchFromThought`, `branchId` |

---

## Skip Conditions

Skip this procedure if:
- User explicitly asked to skip MCP servers
- Node.js/npm not available (log and continue)
- Both servers already configured

## Error Handling

For all errors in this procedure:
1. Log the error to console
2. Record in manifest: `"mcpServers": { "installed": false, "skipped": true, "reason": "{{error_type}}", "error": "{{error_message}}" }`
3. Continue with next bootstrap procedure

Do NOT stop the bootstrap for MCP server failures - they are optional enhancements.

## Merging with Existing Configuration

When `.claude/settings.local.json` already exists:

1. Read existing configuration
2. Parse as JSON
3. Merge `mcpServers` objects:
   - Keep all existing server configurations
   - Add new servers only if not already present
   - Never overwrite existing server configs (user may have customized them)
4. Write merged configuration back

Example merge scenario:
```json
// Existing
{
  "mcpServers": {
    "serena": { "command": "serena-mcp", "args": ["--project", "."] }
  }
}

// After merge
{
  "mcpServers": {
    "serena": { "command": "serena-mcp", "args": ["--project", "."] },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"] },
    "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] }
  }
}
```

## Self-Verification Checklist

Before proceeding to the next step, verify:

- [ ] Node.js availability checked
- [ ] `.claude/settings.local.json` exists with MCP server configurations
- [ ] Existing configurations were preserved (if any)
- [ ] Context7 server configured
- [ ] Sequential Thinking server configured
- [ ] Manifest updated with MCP servers status

Proceed to next step regardless of MCP server success/failure.

## Troubleshooting Reference

**MCP servers not recognized:**
- Restart Claude Code
- Check `.claude/settings.local.json` syntax is valid JSON
- Verify Node.js 18+ is installed

**Context7 not working:**
- Ensure you include "use context7" in prompts
- Library may not be in Context7's database yet
- Try specifying the Context7 library ID directly

**Sequential Thinking not activating:**
- Tool is used automatically for complex reasoning
- Can be explicitly invoked for structured problem-solving
- Check Claude Code logs for MCP connection status

**npx command fails:**
- Check internet connectivity
- npm cache may need clearing: `npm cache clean --force`
- Try installing packages directly: `npm install -g @upstash/context7-mcp`
