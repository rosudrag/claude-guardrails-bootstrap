# Security

## Before Every Commit

- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings)
- [ ] All user inputs validated
- [ ] SQL/query injection prevented (parameterized queries only)
- [ ] XSS prevention (sanitized output)
- [ ] Authentication and authorization verified on all protected endpoints
- [ ] Error messages don't leak internal details

## Secret Management

- Use environment variables or a secret manager
- Never commit secrets to version control
- Validate required secrets are present at startup
- Rotate any secret that may have been exposed

## Security Response

If a security issue is found during development:
1. Stop current work
2. Assess severity and blast radius
3. Fix the issue before continuing
4. Check for similar issues elsewhere in the codebase
5. Document the fix and prevention strategy
