# Git Workflow

## Commit Messages

Use conventional commits with the 50/72 rule:

```
<type>: <description>          (max 50 chars)
                                (blank line)
<optional body>                 (wrap at 72 chars)
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Before Committing

- All tests pass locally
- No new lint warnings
- No debug statements (console.log, print, etc.)
- Changes are focused (one concern per commit)

## Pull Requests

- Analyze full commit history, not just the latest commit
- Write a clear summary with context for reviewers
- Include a test plan
- Keep PRs focused and reviewable (under 400 lines changed when possible)

## Branch Strategy

- Feature branches from main
- Never commit directly to main
- Delete branches after merge
