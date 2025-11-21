# Security Policy

## Secrets Management

### Development Environment

#### Setup
1. **Never use the committed `.env` file for development**
2. Generate secure secrets for local development:
   ```bash
   ./scripts/generate-secrets.sh
   ```
3. This creates a `.env.local` file with strong random secrets
4. The `.env.local` file is git-ignored and will never be committed

#### Secret Requirements
- **JWT Secrets**: Minimum 32 characters (256 bits)
- **Database Passwords**: Minimum 16 characters with mixed case, numbers, and symbols
- **API Keys**: Use provider-generated keys or minimum 32 characters

#### What NOT to do
- ❌ Don't commit `.env.local` to version control
- ❌ Don't use the example secrets from `.env.example` in production
- ❌ Don't share your local secrets via Slack, email, or other channels
- ❌ Don't reuse secrets across environments

### Staging/Production Environments

#### Kubernetes Secrets
All production secrets must be stored in Kubernetes Secrets with encryption at rest enabled.

```bash
# Create a secret
kubectl create secret generic petmatch-secrets \
  --from-literal=jwt-access-secret=$(openssl rand -base64 32) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --namespace=petmatch-prod

# Enable encryption at rest
kubectl create secret generic encryption-config \
  --from-file=encryption-config.yaml \
  --namespace=kube-system
```

#### Secret Rotation
- **JWT Secrets**: Rotate every 90 days
- **Database Credentials**: Rotate every 180 days
- **API Keys**: Follow provider recommendations
- **Certificate**: Automated via cert-manager

#### Access Control
- Use RBAC to restrict secret access
- Only authorized services can read secrets
- Audit all secret access via Kubernetes audit logs

### Secrets Checklist

#### Before Committing Code
- [ ] No secrets in code files
- [ ] No secrets in configuration files committed to git
- [ ] `.env.local` is in `.gitignore`
- [ ] Only `.env.example` with placeholder values is committed

#### Before Deploying to Production
- [ ] All secrets generated using cryptographically secure methods
- [ ] Kubernetes Secrets configured with encryption at rest
- [ ] RBAC policies in place
- [ ] Secret rotation schedule documented
- [ ] Monitoring and alerting for secret access configured

### Reporting Security Issues

If you discover a security vulnerability, please email security@petmatch.example.com

**Do not** create public GitHub issues for security vulnerabilities.

### Security Headers

Production deployments automatically include:
- `Strict-Transport-Security`: Forces HTTPS
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-XSS-Protection`: Enables XSS filtering

### CORS Policy

- **Development**: Only `localhost` origins allowed
- **Production**: Only registered production domains allowed
- **Credentials**: Only sent to allowed origins
- Wildcard (`*`) origins are **never** used

### Authentication

- JWT tokens with short expiration (15 minutes for access tokens)
- Refresh tokens with longer expiration (7 days)
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`
- Password requirements: Minimum 12 characters with complexity

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Updates

Security patches are released as soon as possible after a vulnerability is confirmed.
