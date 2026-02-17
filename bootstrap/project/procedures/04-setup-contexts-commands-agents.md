# Procedure: Setup Contexts, Commands, and Agents

Set up AI workflow automation: context modes, slash commands, and specialized agents.

## Purpose

These components enhance the AI assistant's workflow beyond the basic AGENTS.md + docs setup:
- **Contexts** switch the AI's behavior mode (dev, review, research)
- **Commands** provide slash-command workflows (/plan, /review, /tdd, /verify, /debug)
- **Agents** define specialized subagents with constrained tools and focused expertise

**Tool compatibility:**
- Contexts: All tools (pure markdown, referenced in AGENTS.md)
- Commands: Claude Code (`.claude/commands/`), Cursor (`.cursor/commands/`), others via doc reference
- Agents: Claude Code (`.claude/agents/`), adaptable to other tools

---

## Pre-Check [AUTO]

Read `.ai-bootstrap/analysis.json` and check the detected AI tool context:

```json
{
  "ai_tool": "claude-code|cursor|generic"
}
```

If AI tool is not detectable, default to `generic` (contexts only, commands/agents as docs).

---

## Step 1: Setup Contexts [AUTO]

Contexts are tool-agnostic markdown files. Always create them.

### 1a. Create Contexts Directory [AUTO]

```
ai-docs/contexts/
├── dev.md        # Implementation mode
├── review.md     # Code review mode
└── research.md   # Investigation mode
```

**If `ai-docs/contexts/` already exists**: Skip existing files, only create missing ones.

### 1b. Customize Contexts [AUTO]

For each context, adapt the template from `templates/contexts/`:
- Replace generic examples with project-specific patterns
- Adjust tool preferences based on project stack
- Keep the core mindset and checklist structure

### 1c. Reference in AGENTS.md [AUTO]

Add a contexts section to the project's AGENTS.md:

```markdown
## Modes

| Mode | When to use | Context |
|------|-------------|---------|
| Development | Writing new code or fixing bugs | [dev.md](ai-docs/contexts/dev.md) |
| Review | Reviewing PRs or code changes | [review.md](ai-docs/contexts/review.md) |
| Research | Investigating unknowns or planning | [research.md](ai-docs/contexts/research.md) |
```

---

## Step 2: Setup Commands [AUTO]

Commands provide slash-command workflows for the AI assistant.

### 2a. Determine Command Location [AUTO]

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | `.claude/commands/` | Markdown files (auto-discovered as /commands) |
| Cursor | `.cursor/commands/` | Markdown files |
| Generic | `ai-docs/commands/` | Referenced in AGENTS.md |

### 2b. Create Command Files [AUTO]

From `templates/commands/`, create:

| Command | File | Purpose |
|---------|------|---------|
| `/plan` | `plan.md` | Feature planning without code changes |
| `/review` | `review.md` | Structured code review |
| `/tdd` | `tdd.md` | Test-driven development workflow |
| `/verify` | `verify.md` | Pre-PR verification loop |
| `/debug` | `debug.md` | Systematic debugging methodology |
| `/build-fix` | `build-fix.md` | Fix build errors iteratively |
| `/refactor-clean` | `refactor-clean.md` | Remove dead code safely |
| `/test-coverage` | `test-coverage.md` | Analyze and fill test coverage gaps |
| `/orchestrate` | `orchestrate.md` | Chain agents for complex workflows |
| `/update-docs` | `update-docs.md` | Sync documentation with code |

### 2c. Customize Commands [AUTO]

For each command:
- Replace `{{test_command}}` with the project's test command
- Replace `{{build_command}}` with the project's build command
- Replace `{{lint_command}}` with the project's lint command
- Replace `{{typecheck_command}}` with the project's type check command
- Adapt examples to the project's language/framework

### 2d. Reference in AGENTS.md [AUTO]

Add a commands section:

```markdown
## Commands

| Command | Purpose |
|---------|---------|
| `/plan` | Plan a feature before implementing |
| `/review` | Review recent code changes |
| `/tdd` | Implement with test-driven development |
| `/verify` | Run pre-PR verification checks |
| `/debug` | Systematic debugging workflow |
```

---

## Step 3: Setup Agents [AUTO]

Agents define specialized subagents with focused roles and constrained tools.

### 3a. Determine Agent Location [AUTO]

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | `.claude/agents/` | Markdown with YAML frontmatter |
| Generic | `ai-docs/agents/` | Referenced as methodology docs |

### 3b. Select Agents [AUTO]

Install agents based on project needs:

| Agent | Always Install | When to Skip |
|-------|---------------|--------------|
| `planner.md` | Yes | Never |
| `reviewer.md` | Yes | Never |
| `tdd-guide.md` | Yes | If project has no tests and user opts out |
| `security-reviewer.md` | Yes | Never |
| `architect.md` | If project has >10 source files | Very small projects |
| `build-error-resolver.md` | If project has build step | Projects without build step |
| `refactor-cleaner.md` | If project has >20 source files | Very small projects |
| `doc-updater.md` | If project has documentation | No docs to maintain |

### 3c. Customize Agent Definitions [AUTO]

For each agent:
- Adjust Serena tool references (include only if Serena is installed)
- Replace `{{test_command}}` placeholders
- Add project-specific patterns to review checklists
- Adjust language-specific guidance based on detected stack

### 3d. Reference in AGENTS.md [AUTO]

Add an agents section:

```markdown
## Agents

| Agent | Role | Modifies Code? |
|-------|------|----------------|
| planner | Feature planning and task breakdown | No (read-only) |
| reviewer | Code review and quality analysis | No (read-only) |
| tdd-guide | Test-driven development coach | Yes |
| security-reviewer | Security vulnerability scanning | No (read-only) |
| architect | System design and trade-off analysis | No (read-only) |
| build-error-resolver | Fix build errors iteratively | Yes |
| refactor-cleaner | Dead code removal and cleanup | Yes |
| doc-updater | Documentation drift detection and fixes | Yes (docs only) |
```

---

## Step 4: Update Manifest [AUTO]

Record completion in `.ai-bootstrap/manifest.json`:

```json
{
  "steps_completed": [..., "setup-contexts-commands-agents"],
  "contexts_created": ["dev.md", "review.md", "research.md"],
  "commands_created": ["plan.md", "review.md", "tdd.md", "verify.md", "debug.md", "build-fix.md", "refactor-clean.md", "test-coverage.md", "orchestrate.md", "update-docs.md"],
  "agents_created": ["planner.md", "reviewer.md", "tdd-guide.md", "security-reviewer.md", "architect.md", "build-error-resolver.md", "refactor-cleaner.md", "doc-updater.md"],
  "commands_location": ".claude/commands/",
  "agents_location": ".claude/agents/"
}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Cannot create command directory | Fall back to `ai-docs/commands/`, reference in AGENTS.md |
| Agent format unsupported by tool | Store in `ai-docs/agents/` as reference docs |
| Template placeholder unfilled | Leave as `<!-- ADD COMMAND -->` with comment |

---

## Self-Verification Checklist

- [ ] Context files exist and are customized
- [ ] Commands are in the correct tool-specific directory
- [ ] Command placeholders (test, build, lint) are filled in
- [ ] Agents are in the correct tool-specific directory
- [ ] Agent tool lists match available tools (Serena included/excluded correctly)
- [ ] AGENTS.md updated with Modes, Commands, and Agents sections
- [ ] Manifest updated

Proceed to next step.
