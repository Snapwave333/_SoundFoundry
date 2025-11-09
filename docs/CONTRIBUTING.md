# Contributing to SoundFoundry

Thank you for your interest in contributing to SoundFoundry! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- **Node.js 20+** (for frontend)
- **Python 3.11+** (for backend)
- **Docker Desktop** (for local infrastructure)
- **Git** (for version control)

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/_SoundFoundry.git
   cd _SoundFoundry
   ```

2. **Start infrastructure**:
   ```bash
   cd infra
   docker compose up -d
   ```

3. **Set up backend**:
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   ```

4. **Set up frontend**:
   ```bash
   cd web
   npm install
   ```

5. **Configure environment variables**:
   - Copy `server/.env.example` to `server/.env` and fill in values
   - Copy `config/.env.local.example` to `web/.env.local` and fill in values

6. **Start development servers**:
   ```bash
   # Terminal 1: Backend API
   cd server
   uvicorn app.main:app --reload --port 8000

   # Terminal 2: Celery Worker
   cd server
   celery -A app.celery_app worker --loglevel=info

   # Terminal 3: Frontend
   cd web
   npm run dev
   ```

## Branching Strategy

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

**Examples**:
- `feature/add-playlist-support`
- `fix/audio-streaming-error`
- `docs/update-api-documentation`

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
```

## Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

### Examples

```bash
feat(api): add playlist creation endpoint

fix(ui): resolve audio player loading state

docs(readme): update installation instructions

refactor(services): simplify credit calculation logic
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new features or bug fixes
3. **Run linters** and fix any issues:
   ```bash
   cd web && npm run lint
   cd server && flake8 .  # or your preferred linter
   ```
4. **Run tests** and ensure they pass:
   ```bash
   cd web && npm run test:e2e
   cd server && pytest
   ```
5. **Update CHANGELOG.md** if applicable

### PR Format

**Title**: Use conventional commit format
```
feat(api): add playlist support
```

**Description Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. **Never force-push to main branch**

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript for type safety
- Follow ESLint configuration
- Use functional components with hooks
- Prefer named exports
- Use Tailwind CSS for styling
- Follow existing component patterns

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions/classes
- Use async/await for async operations
- Follow FastAPI best practices

### General

- Write self-documenting code
- Add comments for complex logic
- Keep functions focused and small
- Use meaningful variable names
- Avoid code duplication

## Testing

### Frontend Tests

```bash
cd web
npm run test:e2e        # End-to-end tests
npm run test:e2e:ui     # Interactive UI mode
```

### Backend Tests

```bash
cd server
pytest                  # Run all tests
pytest -v              # Verbose output
pytest --cov           # With coverage
```

### Test Requirements

- New features should include tests
- Bug fixes should include regression tests
- Aim for >80% code coverage
- Tests should be fast and isolated

## Documentation

### Code Documentation

- Add docstrings to functions/classes
- Document complex algorithms
- Include examples for public APIs

### User Documentation

- Update README.md for user-facing changes
- Add/update API documentation
- Update architecture docs if needed

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node/Python versions)
- Screenshots if applicable

### Feature Requests

- Clear description of the feature
- Use case and motivation
- Proposed implementation (if applicable)
- Alternatives considered

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open an issue for questions or discussions
- Check existing issues and PRs first
- Be patient and respectful

Thank you for contributing to SoundFoundry! 🎵

