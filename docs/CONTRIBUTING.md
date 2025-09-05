# Contributing to node-red-contrib-grocy

Thank you for your interest in contributing to node-red-contrib-grocy! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Documentation](#documentation)
- [Security](#security)

## 📜 Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher
- Git
- A Grocy instance for testing (can be Docker-based)
- Node-RED 2.0.0 or higher for integration testing

### First Time Contributors

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Push to your fork
6. Create a pull request

## 🛠️ Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/democratize-technology/node-red-contrib-grocy.git
cd node-red-contrib-grocy

# Install dependencies
npm install

# Link for local Node-RED development
npm link
```

### 2. Set Up Test Environment

Create a `.env.test` file for test configuration:

```env
GROCY_API_URL=http://localhost:9283
GROCY_API_KEY=your-test-api-key
TEST_TIMEOUT=30000
```

### 3. Set Up Local Grocy Instance

Using Docker (recommended):

```bash
docker run -d \
  --name grocy-test \
  -p 9283:80 \
  -v grocy-db:/var/www/grocy/data \
  grocy/grocy:latest
```

### 4. Link to Local Node-RED

```bash
cd ~/.node-red
npm link node-red-contrib-grocy
```

## 🏗️ Architecture Overview

### Project Structure

```
node-red-contrib-grocy/
├── nodes/                    # Node definitions
│   ├── grocy-config.js      # Configuration node
│   ├── grocy-api.js         # Generic API node
│   ├── grocy-stock.js       # Stock management node
│   ├── grocy-shopping-list.js # Shopping list node
│   ├── grocy-chores.js      # Chores/tasks node
│   ├── grocy-batteries.js   # Battery tracking node
│   └── lib/                 # Shared libraries
│       ├── base-node.js     # Base node class
│       ├── grocy-client.js  # API client wrapper
│       ├── validators.js    # Input validation
│       ├── error-handler.js # Error handling
│       ├── timeout-handler.js # Timeout management
│       ├── operation-router.js # Operation routing
│       └── operations/      # Operation modules
│           ├── stock-operations.js
│           ├── shopping-list-operations.js
│           ├── task-chore-operations.js
│           ├── battery-operations.js
│           ├── product-operations.js
│           └── generic-operations.js
├── test/                    # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── fixtures/           # Test data
│   └── mocks/             # Mock objects
├── examples/              # Example flows
└── .github/              # GitHub workflows
```

### Key Design Patterns

#### 1. Base Node Pattern
All nodes extend from `BaseNode` which provides:
- Common initialization
- Error handling
- Status management
- Credential handling

```javascript
class MyNode extends BaseNode {
    constructor(config) {
        super(config, RED, 'my-node-type');
    }
    
    async processInput(msg, config) {
        // Node-specific logic
    }
}
```

#### 2. Operation Router Pattern
Operations are dynamically routed to specialized modules:

```javascript
// operations/my-operations.js
module.exports = {
    async myOperation(client, payload) {
        // Validation
        validators.validateRequired(payload, ['field1', 'field2']);
        
        // API call
        const result = await client.api.endpoint(payload);
        
        // Transform and return
        return transformResult(result);
    }
};
```

#### 3. Validator Composition
Validators can be composed for complex validation:

```javascript
const validators = require('./validators');

// Compose validators
validators.validateRequired(payload, ['id']);
validators.validateId(payload.id);
validators.validateString(payload.name, { minLength: 3, maxLength: 50 });
```

## 💻 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/issue-123
```

### 2. Make Changes

Follow the existing code structure and patterns:

```javascript
// Good: Use async/await
async function processData(data) {
    try {
        const result = await apiCall(data);
        return transform(result);
    } catch (error) {
        throw ErrorHandler.handleError(error, 'processData');
    }
}

// Bad: Callback hell
function processData(data, callback) {
    apiCall(data, (err, result) => {
        if (err) return callback(err);
        transform(result, callback);
    });
}
```

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/unit/validators.test.js

# Run with coverage
npm run test:coverage

# Watch mode during development
npm run test:watch
```

### 4. Update Documentation

- Update JSDoc comments
- Update README if adding features
- Add examples if introducing new functionality

## 🧪 Testing

### Test Structure

#### Unit Tests
Test individual functions and modules:

```javascript
// test/unit/validators.test.js
describe('Validators', () => {
    describe('validateRequired', () => {
        it('should pass with all required fields present', () => {
            const payload = { id: 1, name: 'Test' };
            expect(() => validators.validateRequired(payload, ['id', 'name']))
                .not.toThrow();
        });
        
        it('should throw for missing required fields', () => {
            const payload = { id: 1 };
            expect(() => validators.validateRequired(payload, ['id', 'name']))
                .toThrow(ValidationError);
        });
    });
});
```

#### Integration Tests
Test node behavior in Node-RED:

```javascript
// test/integration/stock-node.test.js
const helper = require('node-red-node-test-helper');

describe('Stock Node', () => {
    beforeEach((done) => {
        helper.startServer(done);
    });
    
    afterEach((done) => {
        helper.unload();
        helper.stopServer(done);
    });
    
    it('should fetch stock data', (done) => {
        const flow = [/* flow definition */];
        helper.load(nodes, flow, () => {
            const node = helper.getNode('stock-node');
            node.receive({ payload: {} });
            // Assert results
            done();
        });
    });
});
```

### Test Coverage Requirements

- Minimum 80% code coverage
- All new features must include tests
- Bug fixes should include regression tests

## 🎨 Code Style

### JavaScript Style Guide

We follow these conventions:

```javascript
// Use const/let, never var
const immutableValue = 42;
let mutableValue = 'can change';

// Use async/await over promises chains
async function fetchData() {
    const data = await api.get('/data');
    return processData(data);
}

// Use template literals
const message = `Hello ${name}, you have ${count} items`;

// Use object destructuring
const { id, name, amount } = payload;

// Use arrow functions for callbacks
array.map(item => item.value);

// But use regular functions for methods
class MyClass {
    async processData() {
        // Regular function for class methods
    }
}

// Clear, descriptive names
const productInventoryLevel = 10; // Good
const pil = 10; // Bad

// Constants in UPPER_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30000;
```

### JSDoc Comments

All functions should have JSDoc comments:

```javascript
/**
 * Validates that all required fields are present in the payload
 * @param {Object} payload - The payload to validate
 * @param {string[]} requiredFields - Array of required field names
 * @param {Object} options - Validation options
 * @param {boolean} options.collectAllErrors - Whether to collect all errors
 * @throws {ValidationError} If required fields are missing
 * @returns {void}
 */
function validateRequired(payload, requiredFields, options = {}) {
    // Implementation
}
```

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **test**: Test additions or modifications
- **chore**: Maintenance tasks
- **perf**: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(stock): add batch operation support"

# Bug fix
git commit -m "fix(validator): handle null values in ID validation"

# Documentation
git commit -m "docs(readme): add troubleshooting section"

# Refactoring
git commit -m "refactor(error-handler): simplify error classification logic"
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   npm test
   npm run test:coverage
   ```

3. **Check for linting issues** (when configured):
   ```bash
   npm run lint
   ```

4. **Update documentation** if needed

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. Automated checks run (tests, security scan)
2. Code review by maintainer
3. Address feedback
4. Approval and merge

## ✨ Adding New Features

### Adding a New Operation

1. **Define the operation** in the appropriate operations file:

```javascript
// nodes/lib/operations/stock-operations.js
async function newOperation(client, payload) {
    // Validate input
    validators.validateRequired(payload, ['requiredField']);
    
    // Make API call
    const result = await client.api.endpoint(payload);
    
    // Return transformed result
    return {
        success: true,
        data: result
    };
}

module.exports = {
    // ... existing operations
    newOperation
};
```

2. **Add to operation router**:

```javascript
// nodes/lib/operation-router.js
const operations = {
    stock: {
        // ... existing operations
        newOperation: require('./operations/stock-operations').newOperation
    }
};
```

3. **Update HTML definition**:

```html
<!-- nodes/grocy-stock.html -->
<option value="newOperation">New Operation</option>
```

4. **Add tests**:

```javascript
// test/unit/operations/stock-operations.test.js
describe('newOperation', () => {
    it('should handle valid input', async () => {
        const result = await operations.newOperation(mockClient, validPayload);
        expect(result).toMatchSnapshot();
    });
});
```

### Adding a New Node Type

1. Create node JavaScript file: `nodes/grocy-mynewnode.js`
2. Create node HTML file: `nodes/grocy-mynewnode.html`
3. Add to package.json `node-red.nodes`
4. Create operations module if needed
5. Add comprehensive tests
6. Update documentation

## 📚 Documentation

### Where to Document

- **Code**: Inline JSDoc comments
- **README.md**: User-facing features and usage
- **CONTRIBUTING.md**: Development processes
- **API_REFERENCE.md**: Technical API details
- **Examples**: Working flow examples

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up-to-date with code
- Use proper markdown formatting
- Include screenshots for UI changes

## 🔒 Security

### Security Considerations

- Never commit credentials or API keys
- Validate all user input
- Sanitize error messages
- Use parameterized queries
- Keep dependencies updated
- Report security issues privately

### Reporting Security Issues

Do NOT create public issues for security vulnerabilities. Instead:

1. Email hello@democratize.technology
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 🙏 Recognition

Contributors will be:
- Listed in the package.json contributors field
- Mentioned in release notes
- Given credit in the README

## 💬 Getting Help

- **Discord**: Join our community server
- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs or request features

## 📊 Project Metrics

We track:
- Test coverage (minimum 80%)
- Performance benchmarks
- Bundle size
- Dependency health
- Security vulnerabilities

Thank you for contributing to node-red-contrib-grocy!