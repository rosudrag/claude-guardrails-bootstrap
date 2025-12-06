# Procedure: Install Specialized Agents

Guide the user through installing specialized Claude Code agents.

## What Are Agents?

Specialized agents are custom instructions that give Claude deep expertise in specific domains. They're installed as markdown files that Claude Code can invoke for specialized tasks.

## Agent Source

**https://github.com/wshobson/agents**

This repository contains 85+ specialized agents organized by category including:
- Architecture & System Design
- Language-specific experts (C#, TypeScript, Python, Go, Rust, etc.)
- Testing & Debugging
- DevOps & Deployment
- Security & Code Review

## Steps

### 1. Recommend Agents [INTERACTIVE]

Based on the project analysis, tell the user:

> "I recommend installing specialized agents for your tech stack. These give me deep expertise in areas like architecture review, TDD, debugging, and language-specific patterns.
>
> Based on your project ({{primary_language}}), relevant agents include:
>
> **Core (recommended for all projects):**
> - `architect-reviewer` - Validates architectural decisions
> - `code-reviewer` - Code quality and security review
> - `tdd-orchestrator` - Test-driven development guidance
> - `debugger` - Error resolution and debugging
>
> **For {{primary_language}}:**
> - Language-specific expert agent
> - Framework-specific agents if applicable
>
> Would you like to install agents now?"

### 2. Direct to Installation [INTERACTIVE]

If user agrees:

> "To install agents:
>
> 1. Visit **https://github.com/wshobson/agents**
> 2. Follow the installation instructions in their README
> 3. The repo has detailed setup guides for different environments
>
> The repository is actively maintained and has the most current installation method.
>
> Let me know when you've completed the agent installation, or if you'd like to skip this step and continue with the rest of the bootstrap."

### 3. Wait for User [CONFIRM]

Wait for user to confirm they've either:
- Completed agent installation
- Want to skip this step

### 4. Record in Manifest [AUTO]

Update `.claude-bootstrap/manifest.json`:
```json
{
  "agents": {
    "installed": true | false,
    "skipped": false | true,
    "source": "https://github.com/wshobson/agents"
  }
}
```

## Skip Conditions

Skip this procedure if:
- User explicitly asked to skip agents
- User wants minimal bootstrap only

## Notes

- Agent availability and installation methods may change - always refer to the source repo
- Users can add custom agents anytime
- Agents work best with Serena MCP installed for semantic code understanding
