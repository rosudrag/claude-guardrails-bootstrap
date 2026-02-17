# AI Praxis

**Make your AI coding assistant actually good at your codebase.**

## Get Started

**1. Clone to a temp folder:**

```bash
git clone https://github.com/rosudrag/ai-praxis.git /tmp/ai-praxis
```

**2. Open your project in your AI coding tool and tell it:**

```
Read /tmp/ai-praxis and use it to bootstrap my project
```

Your AI detects your stack, installs MCP tools, and generates everything.
You can delete the cloned folder after.

Works with: **Claude Code** · **Cursor** · **Windsurf** · **Cline** · any MCP-compatible tool

---

## What You Get

- **Custom AGENTS.md** — AI instructions tailored to your actual tech stack and conventions
- **TDD & Code Quality Guides** — Methodology docs your AI follows automatically
- **Semantic Code Navigation** — Serena MCP gives your AI real understanding of your codebase
- **Up-to-Date Library Docs** — Context7 MCP pulls current documentation into prompts
- **Structured Problem-Solving** — Sequential Thinking MCP for complex debugging and design
- **Architecture Decision Records** — Track and enforce architectural decisions with your AI

## How It Works

AI Praxis has two modes that run automatically:

| Mode | When | What it does |
|------|------|--------------|
| **Environment Setup** | Once per machine | Installs MCP servers (Serena, Context7, Sequential Thinking) and agents globally |
| **Project Bootstrap** | Once per project | Generates AGENTS.md, methodology guides, ADRs, and Serena config for your project |

First-time users get both automatically. Your AI detects what's already done and skips it.

## What Gets Created

**In your project:**

```
your-project/
├── AGENTS.md           # AI instructions for your codebase
├── ai-docs/            # TDD, security, research, code quality guides
├── docs/adrs/          # Architecture Decision Records
└── .serena/            # Semantic code understanding config
```

**On your machine** (global, shared across projects):

MCP servers configured in your AI tool — Serena, Context7, and Sequential Thinking.

## Examples

See real-world AGENTS.md files generated for different stacks:

- [Next.js SaaS](examples/nextjs-saas-AGENTS.md)
- [.NET API](examples/dotnet-api-AGENTS.md)
- [Django API](examples/django-api-AGENTS.md)
- [Go Microservice](examples/go-microservice-AGENTS.md)

## AGENTS.md Convention

This project follows the [AGENTS.md](https://agents.md) convention — a standard for AI coding assistant configuration adopted by 20,000+ repositories. Claude Code users get an auto-generated `CLAUDE.md` forwarding file.

## Customization

After bootstrapping, everything is yours to edit:

- `AGENTS.md` — Add project-specific rules and conventions
- `ai-docs/` — Add or modify methodology guides
- `docs/adrs/` — Record architectural decisions
- `.serena/memories/` — Persist knowledge across sessions

## Philosophy

1. **Methodology over configuration** — A complete way of working, not just settings files
2. **Test-first thinking** — Tests are hypotheses; state expectations, then prove them
3. **Research before assuming** — Investigate systematically, don't guess
4. **Tool-agnostic** — Works with any AI coding assistant, not just one vendor

## Requirements

- An AI coding assistant (Claude Code, Cursor, Windsurf, Cline, etc.)
- Node.js 18+
- Git

## Contributing

See [AGENTS.md](AGENTS.md) for development instructions.

## License

MIT
