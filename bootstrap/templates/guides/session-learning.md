# Session Learning Guide

Teach your AI assistant to remember what it learns across sessions.

---

## The Problem

Every AI coding session starts from zero. The assistant has no memory of:

- Mistakes it made last time (and the corrections you gave)
- Patterns it discovered in your codebase
- Tool preferences you expressed
- Errors it resolved and how

You end up repeating the same corrections, re-explaining the same preferences, and watching the assistant make the same mistakes. This is wasted time.

## The Solution: Session Learning

Session Learning is a lightweight persistence mechanism. Two hooks work together:

1. **Session End** - Summarizes what happened and appends learnings to a file
2. **Session Start** - Loads recent learnings and surfaces them as context

The learnings live in `ai-docs/learnings.md` -- a plain markdown file you can read, edit, and curate alongside your other project documentation.

This is **v1**: simple, transparent, and manual-friendly. No databases, no APIs, no magic. Just a markdown file that grows smarter over time.

---

## How It Works

### The Learning Cycle

```
Session N ends
    |
    v
[session-end-summary.js]
    |-- Detects learning signals in the session
    |-- Appends timestamped entry to ai-docs/learnings.md
    |-- Prunes entries older than 30 days
    |
    v
ai-docs/learnings.md (persistent storage)
    |
    v
Session N+1 starts
    |
    v
[session-start-loader.js]
    |-- Reads ai-docs/learnings.md
    |-- Outputs the 10 most recent entries
    |-- Assistant starts with context from previous sessions
```

### What Gets Captured

The session-end hook looks for signals in the session transcript:

| Signal Category | Trigger Patterns | Example |
|----------------|-----------------|---------|
| `correction` | "actually", "wrong", "fix", "corrected" | You corrected a wrong assumption |
| `error-resolved` | "error", "exception", "failure", "bug" | An error was debugged and fixed |
| `preference` | "prefer", "instead", "better", "rather" | You expressed a tool/style preference |
| `pattern` | "pattern", "approach", "convention" | A codebase pattern was discovered |

The hook creates a skeleton entry with detected categories. You then edit the entry to record the actual learning in your own words.

### What Gets Loaded

At session start, the loader reads the learnings file and outputs the 10 most recent entries to stderr. The assistant sees these as context before your first message, priming it with accumulated knowledge.

---

## Setup

### 1. Hook Configuration

Add the session hooks to your `.claude/settings.json` (or equivalent for your tool):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/session-end-summary.js"
          }
        ],
        "description": "Summarize session learnings to ai-docs/learnings.md"
      }
    ],
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/session-start-loader.js"
          }
        ],
        "description": "Load recent learnings at session start"
      }
    ]
  }
}
```

### 2. Create the Learnings File

The hook creates this automatically on first run, but you can seed it:

```bash
mkdir -p ai-docs
cat > ai-docs/learnings.md << 'EOF'
# Session Learnings

Auto-maintained by session hooks. Edit freely to curate.

EOF
```

### 3. Add to .gitignore (Optional)

Decide whether learnings should be shared with your team or kept personal:

**Shared** (recommended for team projects):
```
# Learnings are committed - team knowledge accumulates
```

**Personal** (for solo or sensitive projects):
```gitignore
ai-docs/learnings.md
```

---

## The Learnings File Format

The file uses a simple markdown structure:

```markdown
# Session Learnings

Auto-maintained by session hooks. Edit freely to curate.

### 2026-02-17 14:30
- Signals: `correction` `preference`
- The API client uses camelCase, not snake_case for request bodies
- User prefers explicit error types over generic Error class

### 2026-02-16 09:15
- Signals: `error-resolved`
- ESM imports need .js extension even for .ts files in this project
- The test runner needs NODE_OPTIONS=--experimental-vm-modules

### 2026-02-15 16:45
- Signals: `pattern`
- All service classes follow the Repository pattern with constructor injection
- Database queries go through the QueryBuilder, never raw SQL
```

Each entry has:
- **Date and time** header (for ordering and pruning)
- **Signal tags** showing what type of learning was detected
- **Learning lines** describing what was discovered (you edit these)

---

## Manual Curation

The auto-detected signals are a starting point. The real value comes from editing entries to capture precise learnings.

### Editing Entries

After a session, open `ai-docs/learnings.md` and refine the latest entry:

**Before (auto-generated):**
```markdown
### 2026-02-17 14:30
- Signals: `correction` `preference`
- _(Edit this entry to record what was learned)_
```

**After (curated):**
```markdown
### 2026-02-17 14:30
- Signals: `correction` `preference`
- CORRECTION: The auth middleware expects Bearer tokens without the "Bearer " prefix
- PREFERENCE: Always use named exports, never default exports in this project
```

### Adding Entries Manually

You do not need hooks to add learnings. Open the file and add an entry:

```markdown
### 2026-02-17 11:00
- Signals: `manual`
- The CI pipeline requires Node 20, not Node 18
- Feature flags are controlled via environment variables, not config files
- The staging database uses a read replica; writes go to the primary
```

### Removing Stale Entries

The hook automatically prunes entries older than 30 days. But you should also:

- Delete learnings that are no longer relevant (e.g., after a major refactor)
- Consolidate repeated learnings into a single clear entry
- Promote important learnings to AGENTS.md where they become permanent

### Promoting to AGENTS.md

When a learning proves consistently important, move it from the ephemeral learnings file to your permanent project instructions:

```markdown
<!-- In AGENTS.md -->
## Project Notes

- All service classes use constructor injection with the Repository pattern
- ESM imports require .js extensions even for TypeScript source files
- The auth middleware expects raw tokens without the "Bearer " prefix
```

This graduation from learnings to AGENTS.md is the key feedback loop: temporary observations become permanent project knowledge.

---

## Integration with AGENTS.md

Add a reference in your AGENTS.md so the assistant knows where to find learnings:

```markdown
## Session Continuity

This project uses session learning hooks. Check `ai-docs/learnings.md` for
accumulated knowledge from previous sessions. When you discover something
important about this codebase, add it to that file.
```

This tells the assistant two things:
1. Where to look for prior knowledge
2. That it should contribute new learnings

---

## How the Hooks Work

### session-end-summary.js

The end hook runs after every assistant response (on the `Stop` event):

1. Receives the session data via stdin (JSON)
2. Scans for learning signal patterns in the transcript
3. If signals are found, creates a timestamped entry
4. Appends the entry to `ai-docs/learnings.md`
5. Prunes entries older than 30 days
6. Passes through the original data unchanged

The hook never blocks or fails the session. All errors are silently caught.

### session-start-loader.js

The start hook runs on the `Notification` event:

1. Checks if `ai-docs/learnings.md` exists
2. Parses all entries from the file
3. Outputs the 10 most recent entries to stderr
4. The assistant sees these as contextual information

The loader focuses on recency because recent learnings are most likely to be relevant.

---

## Customization

### Changing the Retention Period

Edit `session-end-summary.js` and change:

```javascript
const MAX_AGE_DAYS = 30;  // Change to your preference
```

### Changing the Number of Loaded Entries

Edit `session-start-loader.js` and change:

```javascript
const MAX_ENTRIES = 10;  // Change to your preference
```

### Changing the File Location

Both hooks use:

```javascript
const LEARNINGS_FILE = path.join(process.cwd(), 'ai-docs', 'learnings.md');
```

Change `'ai-docs', 'learnings.md'` to your preferred path.

### Adding Custom Signal Categories

Edit the `extractLearnings` function in `session-end-summary.js`:

```javascript
const patterns = [
  // ... existing patterns ...
  { regex: /performance|slow|optimize|cache/i, category: 'performance' },
  { regex: /security|vulnerab|inject|auth/i, category: 'security' },
];
```

---

## Limitations of v1

This is intentionally simple. Known limitations:

1. **Signal detection is basic** - Pattern matching on keywords catches broad categories but misses nuance. Many auto-generated entries will need manual editing to be useful.

2. **No semantic understanding** - The hook does not understand what was learned, only that learning-like activity occurred. You provide the actual content.

3. **Flat file storage** - All learnings are in one file. For large teams or long projects, this may become unwieldy. Consider periodic curation.

4. **No cross-project learning** - Learnings are per-project. Insights from one project do not transfer to another unless you copy them manually.

5. **Transcript access varies** - Different AI tools provide different levels of session transcript access. The hook works with whatever is available but may detect fewer signals in some tools.

6. **No priority or confidence** - All entries are equal. There is no mechanism to mark some learnings as more important or more certain than others (though you can use your own conventions in the text).

---

## Future Improvements

These are planned for v2 and beyond:

- **Structured categories** with filtering (show only error-related learnings)
- **Confidence scoring** based on how often a learning is reinforced
- **Cross-project learnings** stored in a global file
- **Semantic deduplication** to merge similar learnings automatically
- **Integration with ADRs** to link learnings to architectural decisions
- **MCP server** for richer learning capture and retrieval

---

## Troubleshooting

### Learnings file not being created

1. Check that `ai-docs/` directory exists (or that the hook can create it)
2. Verify the hook is configured in your tool's settings
3. Check file permissions in the project directory

### Entries are empty or unhelpful

This is expected for v1. The auto-detection creates placeholders. The value comes from you editing entries after each session. Treat the auto-entries as reminders to capture what you learned.

### Too many entries accumulating

1. Reduce `MAX_AGE_DAYS` to prune more aggressively
2. Curate manually: delete noise, consolidate duplicates
3. Promote stable learnings to AGENTS.md and remove from learnings.md

### Hook errors in console

The hooks catch all errors silently. If you see errors, check:
1. Node.js is available in your PATH
2. The hook file path in settings matches the actual file location
3. The project directory has write permissions

---

## Quick Reference

| Item | Location |
|------|----------|
| Learnings file | `ai-docs/learnings.md` |
| End hook | `.claude/hooks/session-end-summary.js` |
| Start hook | `.claude/hooks/session-start-loader.js` |
| Retention | 30 days (configurable) |
| Entries loaded | 10 most recent (configurable) |

### Workflow Summary

1. Work normally with your AI assistant
2. Hooks auto-detect learning signals and create entries
3. After the session, edit the latest entry with specific learnings
4. Next session, the assistant loads those learnings automatically
5. Periodically promote important learnings to AGENTS.md
6. Prune stale or irrelevant entries

The goal is a virtuous cycle: each session makes the next one smarter.
