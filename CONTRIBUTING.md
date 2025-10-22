# Contributing to Fitness Goal Tracker

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- MongoDB 6.0+
- npm 9.x+

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fitness-tracker.git
   cd fitness-tracker
   ```

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start MongoDB** (if not running)
   ```bash
   # Option 1: Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0

   # Option 2: Local MongoDB
   mongod --dbpath /path/to/data
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates

### Development Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run format:check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

## Code Quality

### ESLint

We use ESLint to enforce code quality and consistency.

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Prettier

We use Prettier for code formatting.

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks (Recommended)

Install Husky for pre-commit hooks:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "cd server && npm run lint:fix && npm run format"
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests verbosely
npm run test:verbose
```

### Writing Tests

- Place tests in `__tests__/` directory
- Name test files with `.test.js` extension
- Follow the existing test structure
- Aim for 60%+ code coverage

**Test Structure Example:**

```javascript
const request = require('supertest');
const app = require('../server');
const { connectTestDb, closeTestDb } = require('./helpers/testDb');

describe('Auth Routes', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });
  });
});
```

### Test Coverage Goals

- **Branches**: 60%
- **Functions**: 60%
- **Lines**: 60%
- **Statements**: 60%

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add JWT token refresh endpoint

fix(posts): resolve race condition in reaction system

docs(readme): update installation instructions

test(badges): add tests for badge gifting
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm test`)
2. ✅ Code is linted (`npm run lint`)
3. ✅ Code is formatted (`npm run format`)
4. ✅ New features have tests
5. ✅ Documentation is updated
6. ✅ Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one approval required
3. **Testing**: Reviewer tests the changes locally
4. **Merge**: Squash and merge to main

## API Documentation

When adding or modifying API endpoints, update the Swagger documentation:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Brief description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 */
```

View docs at: `http://localhost:3000/api-docs`

## Security

### Reporting Vulnerabilities

Please report security vulnerabilities to security@example.com. Do not open public issues for security concerns.

### Security Best Practices

- Never commit secrets or API keys
- Always validate and sanitize user input
- Use parameterized queries for database operations
- Implement rate limiting on sensitive endpoints
- Keep dependencies up to date

## Questions?

- Check existing issues and pull requests
- Read the project documentation
- Ask questions in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
