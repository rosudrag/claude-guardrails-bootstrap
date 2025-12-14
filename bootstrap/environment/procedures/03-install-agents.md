# Procedure: Install Specialized Agents

Inform the user about specialized Claude Code agents (non-blocking).

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

## Important: Non-Blocking Step

**Agent installation is OPTIONAL and should NOT block the bootstrap process.**

Agents enhance Claude's capabilities but are not required for the bootstrap to complete successfully. The user can install them at any time - before, during, or after the bootstrap.

## Steps

### 1. Inform About Agents [AUTO]

Tell the user about agents and continue with bootstrap:

> "**Optional Enhancement: Specialized Agents**
>
> I recommend installing specialized agents for your tech stack. These give me deep expertise in areas like architecture review, TDD, debugging, and language-specific patterns.
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
> **To install (you can do this anytime):**
> 1. Visit **https://github.com/wshobson/agents**
> 2. Follow the installation instructions in their README
>
> I'm continuing with the rest of the bootstrap now. Agents are not required for bootstrap to complete."

### 2. Record in Manifest [AUTO]

Update `.claude-bootstrap/manifest.json`:
```json
{
  "agents": {
    "informed": true,
    "source": "https://github.com/wshobson/agents",
    "recommended_agents": ["architect-reviewer", "code-reviewer", "tdd-orchestrator", "{{language}}-expert"],
    "note": "User was informed about agents. Installation is optional and can be done anytime."
  }
}
```

### 3. Continue with Bootstrap [AUTO]

Immediately proceed to the next procedure. Do NOT wait for user to confirm agent installation.

## Skip Conditions

Skip this procedure entirely if:
- User explicitly asked to skip agents
- User wants minimal bootstrap only

## Notes

- Agent availability and installation methods may change - always refer to the source repo
- Users can add custom agents anytime
- Agents work best with Serena MCP installed for semantic code understanding
- **This step is informational only - it should never block bootstrap progress**

## If User Asks About Agents Later

If user returns to ask about agents after bootstrap:

1. Check if they've already been informed (check manifest for `agents.informed`)
2. Provide the same installation instructions
3. Offer to help troubleshoot if they encounter issues

## Optional: User Verification

If the user voluntarily reports they've installed agents:

Update manifest:
```json
{
  "agents": {
    "informed": true,
    "installed": true,
    "confirmed_at": "2024-01-15T10:50:00Z",
    "source": "https://github.com/wshobson/agents"
  }
}
```

**Note**: Do NOT prompt or wait for this confirmation. Only record it if user volunteers the information.

## Self-Verification Checklist

Before proceeding to the next step, verify:

- [ ] User was informed about relevant agents for their stack
- [ ] User was given the repository URL and basic instructions
- [ ] Manifest updated with `agents.informed: true`
- [ ] Did NOT wait for user confirmation (this step is non-blocking)

Proceed immediately to the next procedure after informing the user.
