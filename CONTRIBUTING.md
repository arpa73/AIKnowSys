# Contributing to Knowledge System Template

First off, thank you for considering contributing! This project benefits from real-world usage and diverse tech stack examples.

## How to Contribute

### 1. Reporting Issues

- **Bug reports**: Include steps to reproduce, expected behavior, actual behavior
- **Feature requests**: Explain the use case and why existing features don't solve it
- **Documentation**: Point out unclear sections or missing information

### 2. Adding New Examples

We'd love examples for additional tech stacks! High-value contributions:

**Backend:**
- Go (Gin, Fiber, Echo)
- Java (Spring Boot)
- C# (ASP.NET Core)
- Ruby (Rails)
- PHP (Laravel)

**Frontend:**
- Svelte/SvelteKit
- SolidJS
- Angular
- Htmx + Alpine.js

**Mobile:**
- React Native
- Flutter
- SwiftUI
- Kotlin Compose

**Requirements for new examples:**
1. Follow existing structure (see `examples/python-django/` as reference)
2. Include all required sections:
   - Technology Stack
   - Validation Matrix (exact commands)
   - Core Patterns (5-10 with code examples)
   - Testing Patterns
   - Project Invariants
   - Common Gotchas (real issues, not hypothetical)
   - Architecture Decisions (why X over Y)
3. Minimum 500 lines (comprehensive, not toy examples)
4. Real patterns from production experience (not tutorial code)

### 3. Improving Skills

Skills are reusable workflow guides. Good skill contributions:

- **Framework-specific workflows**: Rails migrations, Spring Boot setup, Laravel deployment
- **Tool integrations**: GitHub Actions, GitLab CI, CircleCI
- **Development workflows**: Database seeding, API testing, E2E testing
- **Quality checks**: Security audits, performance profiling, accessibility testing

**Skill requirements:**
1. Step-by-step instructions (actionable, not conceptual)
2. Concrete examples (exact commands, not "run tests")
3. Validation steps (how to verify it worked)
4. Common pitfalls section
5. When to use / when NOT to use

### 4. Documentation Improvements

- Fix typos, unclear explanations
- Add diagrams or visual aids
- Expand troubleshooting sections
- Improve search/discoverability

### 5. Code Contributions

For scripts or automation:

- **Python**: Follow PEP 8, type hints required
- **Bash**: ShellCheck clean, POSIX-compatible when possible
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant docs

## Development Workflow

1. **Fork the repository**

```bash
git clone https://github.com/[YOUR-USERNAME]/aiknowsys.git
cd aiknowsys
```

2. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b example/tech-stack-name
```

3. **Make your changes**

Follow existing patterns:
- Examples go in `examples/[tech-stack-name]/`
- Skills go in `.github/skills/[skill-name]/`
- Documentation goes in `docs/`

4. **Test your changes**

For examples:
- Verify all code compiles/runs
- Test validation commands actually work
- Check for typos and formatting

For skills:
- Walk through the workflow step-by-step
- Verify commands are copy-paste ready

5. **Commit with clear messages**

```bash
git commit -m "feat(examples): Add Go/Fiber REST API example"
# or
git commit -m "docs(migration): Clarify database migration steps"
# or
git commit -m "fix(scripts): Handle edge case in setup.sh"
```

Format: `<type>(<scope>): <description>`

Types:
- `feat`: New feature (example, skill, script)
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

6. **Push and create PR**

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of what changed
- Why it's valuable
- Any breaking changes or migration notes

## Code Style

### Markdown

- Use ATX-style headers (`#` not `===`)
- Fenced code blocks with language specified
- Maximum line length: 120 characters
- Blank line before and after code blocks

### Code Examples

- **Complete, runnable code** (not pseudocode)
- Comments explaining "why", not "what"
- Include imports/setup needed
- Show both correct and incorrect patterns when demonstrating gotchas

### Shell Scripts

- Include shebang: `#!/usr/bin/env bash`
- Set safety flags: `set -euo pipefail`
- Quote all variables: `"$var"` not `$var`
- Check for required commands: `command -v npm >/dev/null 2>&1`
- Provide helpful error messages

## Review Process

1. **Automated checks**: Linting, link checking, spell checking
2. **Manual review**: Maintainers review for quality and fit
3. **Feedback**: Requested changes or clarification
4. **Approval**: PR merged with credit

**Timeline**: Most PRs reviewed within 7 days.

---

## Working with AI Assistants (VSCode Users)

If using AI coding assistants (Copilot, Claude) **in VSCode**, be aware of file operation conflicts.

**Common issue:** Terminal operations fail when VSCode has files open/modified.  
**Quick fix:** Click "Keep" or "Discard" in VSCode's diff UI, then ask AI to retry.  
**Details:** See [VSCode File Operations Troubleshooting](../.aiknowsys/learned/vscode-file-operations.md) for full guide.

---

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/[YOUR-USERNAME]/aiknowsys/discussions)
- **Real-time chat**: [Discord](link-to-discord) (if available)
- **Email**: [your-email] for private concerns

## Recognition

Contributors are:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Credited in commit messages
- Thanked in release notes

Significant contributions may result in:
- Co-maintainer status
- Your project featured in examples
- Shout-outs in documentation

## Code of Conduct

Be respectful, constructive, and collaborative:

- ✅ Assume good intentions
- ✅ Provide specific, actionable feedback
- ✅ Celebrate diverse perspectives
- ❌ No harassment, discrimination, or personal attacks
- ❌ No spam or self-promotion without context

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making this project better!** 🙏
