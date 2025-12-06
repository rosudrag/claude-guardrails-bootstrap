# Claude Guardrails Bootstrap

An opinionated bootstrap system for setting up AI-assisted development guardrails in your projects.

## What Is This?

This repository contains **instructions for Claude Code** to set up your project with:

- **Serena MCP** - Semantic code understanding for Claude
- **Specialized Agents** - Task-specific AI agents for your stack
- **CLAUDE.md** - Customized instructions file for your project
- **claude-docs/** - Supporting documentation (TDD guides, code quality, etc.)
- **ADR Structure** - Architecture Decision Records for your team

## How To Use

1. Open your project in Claude Code
2. Tell Claude:

```
Look at https://github.com/rosudrag/claude-guardrails-bootstrap
and use it to set up guardrails for my project
```

3. Claude will:
   - Analyze your project structure and tech stack
   - Present a bootstrap plan for your approval
   - Install Serena MCP and configure it
   - Install relevant specialized agents
   - Generate a customized CLAUDE.md
   - Create supporting documentation

## What Gets Created

After bootstrapping, your project will have:

```
your-project/
├── CLAUDE.md              # AI instructions customized for your project
├── claude-docs/           # Supporting guides
│   ├── tdd-enforcement.md
│   ├── code-quality.md
│   └── research-workflow.md
├── docs/
│   └── adrs/              # Architecture Decision Records
│       ├── README.md
│       └── 000-template.md
├── .serena/               # Serena configuration
│   ├── project.yml
│   └── memories/
└── .claude/               # Claude Code configuration
    └── settings.local.json
```

## Philosophy

This bootstrap follows these principles:

1. **Guardrails, not handcuffs** - Guide AI behavior without being overly restrictive
2. **Project-aware** - Instructions adapt to your actual tech stack
3. **TDD-first** - Test-driven development as a core practice
4. **Research before assuming** - Claude should investigate, not guess
5. **Self-documenting** - Code should be clear; comments explain "why"

## Customization

After bootstrapping:

- Edit `CLAUDE.md` to add project-specific instructions
- Add custom guides to `claude-docs/`
- Create ADRs for architectural decisions
- Add Serena memories for persistent knowledge

## Requirements

- Claude Code CLI or VS Code extension
- Node.js (for Serena MCP installation)
- Git

## Contributing

See [CLAUDE.md](CLAUDE.md) for development instructions.

## License

MIT
