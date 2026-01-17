# Contributing

Development setup and contribution guidelines for the AI Agent Guardrails project.

## Development Setup

### Prerequisites

- Node.js 20 or higher
- pnpm 10 or higher
- Git

### Installation

Fork and clone the repository:

```bash
git clone https://github.com/KrxGu/ai-agent-guardrails
cd ai-agent-guardrails
```

Install dependencies:

```bash
pnpm install
```

Build all packages:

```bash
pnpm build
```

Run the demo application:

```bash
echo "OPENAI_API_KEY=sk-..." > apps/demo-next/.env.local
pnpm -C apps/demo-next dev
```

## Project Structure

```
ai-agent-guardrails/
├── packages/
│   ├── ai-agent-guardrails/    # Core middleware library
│   └── mcp-server-demo/         # Example MCP server
├── apps/
│   └── demo-next/               # Next.js demo application
├── docs/                        # Documentation
└── Diagrams/                    # Architecture diagrams
```

## Development Workflow

Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Make changes in the appropriate package. After editing code, rebuild:

```bash
pnpm build
pnpm -C apps/demo-next dev
```

Commit with descriptive messages following conventional commits:

```bash
git commit -m "feat: add schema validation support"
```

### Commit Message Format

Use conventional commits specification:

- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- refactor: Code refactoring
- test: Test additions or changes
- chore: Maintenance tasks

Examples:
```
feat: add OpenTelemetry audit sink
fix: handle timeout errors gracefully
docs: update threat model
refactor: extract policy builders
test: add redaction pattern tests
```

## Code Guidelines

### Style

- TypeScript for all code
- Follow existing Prettier configuration
- Run ESLint before committing
- Add JSDoc comments for public APIs

### Testing

- Add tests for new features
- Update integration tests when needed
- Verify all tests pass locally

### Documentation

- Update README.md for new features
- Include code examples for new APIs
- Update THREAT_MODEL.md for security changes
- Add JSDoc comments to public functions

## Feature Contributions

### Priority Areas

1. Schema validation (Zod-based argument checking)
2. Concurrency control (per-tool execution limits)
3. OpenTelemetry export (native span generation)
4. MCP tool fingerprinting (schema drift detection)

### Process

1. Open GitHub issue describing the feature
2. Wait for maintainer feedback and approval
3. Implement with tests and documentation
4. Submit pull request

## Bug Reports

### Before Opening an Issue

- Search existing issues
- Verify reproducibility
- Test with latest version

### Report Template

```markdown
Description: [Clear description of the bug]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [etc]

Expected: [What should happen]
Actual: [What happens instead]

Environment:
- Node: X.X.X
- Package: X.X.X
- AI SDK: X.X.X
- OS: [macOS/Linux/Windows]
```

## Pull Requests

### Before Submitting

- Code builds successfully
- Tests pass
- Documentation updated
- Commits follow conventions
- Branch synced with main

### PR Description Template

```markdown
What: [Brief description of changes]

Why: [Motivation for changes]

How: [Implementation approach]

Testing: [How you tested]

Checklist:
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Breaking changes documented
```

### Review Process

Reviewers check for:
- Functionality correctness
- Code readability and maintainability
- Test coverage
- Documentation clarity
- Security implications
- Performance considerations

Address all feedback comments and ask questions when clarification is needed.

## Releases

### Versioning

Follows semantic versioning (semver):

- Major (X.0.0): Breaking changes
- Minor (0.X.0): New features, backward compatible
- Patch (0.0.X): Bug fixes

### Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.1.0`
4. Push tag: `git push --tags`
5. Publish to npm: `npm publish`
6. Create GitHub release with notes

## Security

### Reporting Vulnerabilities

Do not open public issues for security vulnerabilities.

Report via GitHub Security Advisories: https://github.com/KrxGu/ai-agent-guardrails/security/advisories/new

Include:
- Vulnerability description
- Reproduction steps
- Potential impact
- Suggested fix (if available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
