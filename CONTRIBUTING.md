# Contributing to TVN

We welcome contributions from all builders in the network. To maintain high code quality and clear history, please adhere to the following guidelines.

---

## Development Process

1. **Find an Issue:** Look through the issue tracker for bugs, feature requests, or project proposals.
2. **Assign Yourself:** Comment on the issue to let others know you are working on it.
3. **Branch Naming:** Use structural branch names.
   - `feat/add-payment-gateway`
   - `fix/auth-middleware-bug`
   - `docs/update-api-spec`

## Commit Standards

We use [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages must follow this structure:

```text
<type>[optional scope]: <description>

[optional body]
```

**Allowed Types:**
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Formatting, missing semi-colons, etc.
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

## Pull Request Guidelines

- **Keep it focused:** Submit one PR per feature or fix. Do not bundle unrelated changes.
- **Pass checks:** Ensure all CI/CD pipelines, tests, and linters pass before requesting a review.
- **Provide context:** Use the standard PR template. Explain *why* the change is necessary, not just *what* it does.
- **Request review:** Tag code owners or relevant builders for a review.

## Proposing New Projects

If you want to introduce a new open-source project to the TVN ecosystem, open a **Project Proposal Issue**. Include:
- System architecture overview
- Tech stack
- Problem statement
- Immediate engineering needs
