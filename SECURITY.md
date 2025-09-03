# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them directly via email to:
- **Email**: hello@democratize.technology
- **Subject**: [SECURITY] node-red-contrib-grocy vulnerability

Please include:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

## Security Best Practices

When using node-red-contrib-grocy:

### API Key Security
- Never commit API keys to version control
- Use Node-RED's built-in credential encryption
- Store API keys in environment variables when possible
- Rotate API keys regularly

### Network Security
- Always use HTTPS for production Grocy instances
- Implement proper network segmentation
- Use VPN or SSH tunnels for remote access
- Enable TLS verification unless using self-signed certificates

### Node-RED Security
- Enable authentication on your Node-RED instance
- Use HTTPS for Node-RED admin interface
- Implement proper user permissions
- Regularly update Node-RED and all nodes

### Input Validation
- The nodes validate all inputs, but always validate data in your flows
- Sanitize any user-provided input before passing to nodes
- Use the built-in validators for custom function nodes

## Security Features

This package includes several security features:

- **Input Validation**: All inputs are validated before API calls
- **XSS Prevention**: User inputs are sanitized
- **Error Sanitization**: Sensitive data is removed from error messages
- **Timeout Protection**: Prevents resource exhaustion attacks
- **Rate Limiting Support**: Can integrate with rate limiting middleware
- **Dependency Scanning**: Automated security scanning via GitHub Actions

## Dependencies

We regularly update dependencies to patch known vulnerabilities. You can check for vulnerabilities in your installation:

```bash
npm audit
```

To automatically fix vulnerabilities where possible:

```bash
npm audit fix
```

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities. Contributors who report valid security issues will be acknowledged in our release notes (unless they prefer to remain anonymous).