# PenniWise — Deployment Documentation

## 1. Overview

PenniWise consists of multiple application components that must be configured and deployed correctly for the platform to operate.

The deployment environment may include:

- Frontend application
- Backend API
- PostgreSQL database
- Redis
- AI services
- WhatsApp integration
- Banking integrations
- Brokerage integrations
- Environment variables
- External APIs

The deployment architecture should keep sensitive services and credentials on the server side.

---

## 2. Deployment Architecture

The general production architecture is:

```text
                         USERS
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
          Web App                    WhatsApp
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                     PenniWise API
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      PostgreSQL         Redis          AI Services
          │                                 │
          │                ┌────────────────┘
          │                │
          ▼                ▼
     Banking APIs      Brokerage APIs

The exact hosting providers may be selected later.

3. Deployment Environments

PenniWise should maintain separate environments.

Development
     │
     ▼
Staging
     │
     ▼
Production
Development

Used by developers while building and testing features locally.

Staging

Used to test features in an environment similar to production before release.

Production

The live environment used by real users.

4. Environment Isolation

Each environment should have its own configuration and credentials.

Example:

Development
├── Development Database
├── Development Redis
├── Development JWT Secret
└── Development API Credentials

Staging
├── Staging Database
├── Staging Redis
├── Staging JWT Secret
└── Staging API Credentials

Production
├── Production Database
├── Production Redis
├── Production JWT Secret
└── Production API Credentials

Production credentials should never be used unnecessarily during local development.

5. Frontend Deployment

The frontend should be deployed as a separate application where appropriate.

The frontend communicates with the backend API through the configured API URL.

Conceptually:

Browser
   │
   ▼
PenniWise Frontend
   │
   ▼
PenniWise Backend API

The frontend must not contain server-side secrets.

6. Backend Deployment

The backend is the main server-side application.

The backend is responsible for:

Authentication
Authorization
Business logic
Database access
AI integration
Banking integration
Brokerage integration
WhatsApp integration
Security controls
API endpoints

The backend should run in a production Node.js environment.

7. Backend Application

The project currently uses:

Node.js
TypeScript
Express
Prisma
PostgreSQL
Redis

The backend development command is:

pnpm dev

The project build command is:

pnpm build

The project start command is:

pnpm start

The exact production start command should be confirmed with the final deployment configuration.

8. Package Manager

PenniWise uses:

pnpm

The project specifies:

packageManager: pnpm@10.33.0

Deployment environments should use the project's specified pnpm version where possible.

9. Dependency Installation

Dependencies should be installed using the project's lockfile.

Typical deployment flow:

pnpm install --frozen-lockfile

This helps ensure that the deployment uses the dependency versions defined by the project.

10. Build Process

The backend build process should compile the TypeScript application.

Typical flow:

GitHub
   │
   ▼
Install Dependencies
   │
   ▼
Generate Prisma Client
   │
   ▼
Build TypeScript
   │
   ▼
Run Tests
   │
   ▼
Deploy

The exact order may be adjusted based on the hosting platform and Prisma configuration.

11. Prisma Client

PenniWise uses Prisma for database access.

The Prisma client must be generated during development and deployment when required.

Typical command:

pnpm prisma generate

The generated Prisma client must correspond to the current Prisma schema.

12. Database Migrations

Database structure changes should be managed using Prisma migrations.

Typical development workflow:

Modify schema.prisma
        │
        ▼
Create Migration
        │
        ▼
Review Migration
        │
        ▼
Commit Migration to Git
        │
        ▼
Deploy
        │
        ▼
Apply Migration

The prisma/migrations directory should be committed to Git once migrations are created.

13. Production Migrations

Production database migrations should be applied using the production-safe Prisma migration command.

Typical command:

pnpm prisma migrate deploy

Production migrations should not normally be created directly against the production database.

Instead:

Developer
   │
   ▼
Schema Change
   │
   ▼
Migration Created
   │
   ▼
GitHub
   │
   ▼
Deployment
   │
   ▼
Production Migration
14. Database

PenniWise uses PostgreSQL.

The application connects to PostgreSQL through:

DATABASE_URL=

The production database should be hosted using a reliable managed PostgreSQL provider.

The current project may use Neon or another PostgreSQL provider depending on the final infrastructure decision.

15. Database Deployment Principle

The application should never connect directly to the database from the frontend.

Correct:

Frontend
   │
   ▼
Backend
   │
   ▼
PostgreSQL
16. Database Backups

Production database backups should be enabled.

The team should define:

Backup frequency
Retention period
Recovery process
Point-in-time recovery where available
Restoration testing

A backup strategy should exist before production launch.

17. Redis Deployment

Redis is used by the backend where required.

The connection is configured through:

REDIS_URL=

Redis may support:

Caching
Rate limiting
Sessions
Temporary state
Background processing

The exact Redis responsibilities should follow the application's implementation.

18. Redis Availability

Production Redis should be hosted using a reliable managed Redis service or an appropriately secured infrastructure.

The Redis connection should not be exposed publicly without appropriate security controls.

19. Environment Variables

Production configuration should be supplied through the hosting platform's environment-variable/secret management system.

Potential variables include:

NODE_ENV=
PORT=
DATABASE_URL=
REDIS_URL=
JWT_SECRET=

Additional variables will be required as external integrations are implemented.

20. Environment Variable Rules

Environment variables containing secrets must:

Never be committed to GitHub.
Never be included in frontend code.
Never be printed in logs.
Never be hard-coded into source files.
Be configured separately for each environment.
21. .env.example

The repository should contain an example environment file.

Example:

NODE_ENV=
PORT=
DATABASE_URL=
REDIS_URL=
JWT_SECRET=

Real credentials must not be placed in this file.

22. Deployment Secrets

Production secrets should be stored using the deployment provider's secret management system.

Examples include:

JWT_SECRET
DATABASE_URL
REDIS_URL
AI API Keys
Banking API Keys
Brokerage API Keys
WhatsApp Credentials
Webhook Secrets
23. JWT Secret

The production backend must have a stable JWT secret configured.

Example:

JWT_SECRET=<production-secret>

The production JWT secret should not be changed casually because changing it may invalidate existing tokens depending on the authentication implementation.

24. CORS Configuration

Production CORS should allow only approved frontend origins.

Example concept:

Production Frontend
        │
        ▼
Backend API
        │
        ▼
CORS Validation
        │
        ▼
Allowed Origin

Development and production origins should be configured separately.

25. API URL Configuration

The frontend should use the appropriate backend API URL for each environment.

Example:

Development
→ Local API

Staging
→ Staging API

Production
→ Production API

The frontend should never hard-code a development API URL into the production build.

26. Health Check

The backend should provide a health-check endpoint.

Example:

GET /health

A health check can verify that the application process is running.

A more comprehensive readiness check may verify required dependencies such as:

Application
Database
Redis
27. Deployment Health Flow

After deployment:

Deployment
   │
   ▼
Application Starts
   │
   ▼
Health Check
   │
   ▼
Database Connection
   │
   ▼
Redis Connection
   │
   ▼
API Verification
   │
   ▼
Deployment Confirmed
28. Logging

Production logs should be enabled.

The project currently uses:

winston

Logs should provide enough information for:

Debugging
Monitoring
Error investigation
Operational visibility

Sensitive credentials must never be logged.

29. Production Error Handling

Production errors should not expose:

Stack traces to users
Database credentials
API keys
Internal filesystem paths
SQL queries
JWT secrets

Internal details should remain in server-side logs where appropriate.

30. Monitoring

Production monitoring should eventually cover:

Application uptime
API errors
Database availability
Redis availability
Response times
CPU usage
Memory usage
Request volume
Failed authentication
External API failures

The final monitoring provider can be selected later.

31. External Integrations

PenniWise depends on external services.

Potential integrations include:

AI Provider
WhatsApp
Banking Provider
Brokerage Provider
PostgreSQL Provider
Redis Provider

Each integration requires its own production credentials.

32. AI Deployment

AI provider credentials must remain on the backend.

Correct:

Frontend
   │
   ▼
PenniWise API
   │
   ▼
AI Provider

The AI API key must never be exposed in frontend JavaScript.

33. WhatsApp Deployment

The WhatsApp integration requires production webhook configuration.

General flow:

WhatsApp Provider
       │
       ▼
Production Webhook
       │
       ▼
PenniWise API
       │
       ▼
Conversation Engine

The production webhook URL must point to the deployed backend.

Webhook verification and signature validation must be enabled where supported.

34. Banking Deployment

Banking integrations should use production credentials only in the production environment.

The deployment should verify:

API credentials
Webhook URLs
Callback URLs
Encryption/TLS
Transaction configuration
Provider environment

Banking operations should not accidentally point to production while testing development features.

35. Brokerage Deployment

Brokerage integrations should similarly maintain separate environments.

Development
   │
   ▼
Brokerage Sandbox/Test Environment

Production
   │
   ▼
Brokerage Production Environment

Production trading credentials must not be used during ordinary development.

36. Webhook Deployment

All external webhooks should point to the correct environment.

Example:

Development
→ Development Webhook

Staging
→ Staging Webhook

Production
→ Production Webhook

Webhook signatures should be verified before processing events.

37. CI/CD

The project should eventually use a CI/CD pipeline.

A typical pipeline is:

Developer
    │
    ▼
Git Push
    │
    ▼
GitHub
    │
    ▼
Install Dependencies
    │
    ▼
Lint
    │
    ▼
Tests
    │
    ▼
Build
    │
    ▼
Deploy
38. Pull Request Workflow

A recommended workflow is:

Feature Branch
      │
      ▼
Development
      │
      ▼
Commit
      │
      ▼
Push to GitHub
      │
      ▼
Pull Request
      │
      ▼
Code Review
      │
      ▼
Tests / Checks
      │
      ▼
Merge
39. Branch Strategy

The final branch strategy should be agreed upon by the team.

A possible structure is:

main
 │
 ├── feature/...
 ├── fix/...
 └── chore/...

The production branch should remain stable.

40. Deployment from GitHub

The deployment provider should be connected to the GitHub repository.

Typical flow:

GitHub Repository
       │
       ▼
Deployment Provider
       │
       ▼
Build
       │
       ▼
Environment Variables
       │
       ▼
Deploy

The exact provider should be documented once selected.

41. Database and Deployment Coordination

Application deployments and database migrations must be coordinated.

Example:

Schema Change
     │
     ▼
Migration Created
     │
     ▼
Migration Committed
     │
     ▼
Application Code Updated
     │
     ▼
Deploy
     │
     ▼
Migration Applied

The team should avoid deploying code that requires database fields that do not yet exist.

42. Zero-Downtime Considerations

When possible, database changes should be backward-compatible.

For example, instead of:

Remove old column immediately

prefer:

1. Add new column
2. Deploy compatible application
3. Migrate data
4. Stop using old column
5. Remove old column later

This reduces deployment risks.

43. Rollback Strategy

Every production deployment should have a rollback strategy.

Possible rollback components:

Application version
Database migration strategy
Environment configuration
External integration configuration

Application rollback does not automatically mean database rollback is safe.

Database migrations should therefore be designed carefully.

44. Deployment Checklist

Before deploying:

[ ] Code reviewed
[ ] Tests passing
[ ] Lint passing
[ ] Build passing
[ ] Environment variables configured
[ ] Prisma client generated
[ ] Database migration reviewed
[ ] Production migration ready
[ ] CORS configured
[ ] API URL configured
[ ] Redis configured
[ ] External API credentials configured
[ ] Webhooks configured
[ ] Health check available
45. Post-Deployment Checklist

After deployment:

[ ] Application starts successfully
[ ] Health endpoint works
[ ] Database connection works
[ ] Redis connection works
[ ] Authentication works
[ ] API endpoints respond
[ ] AI integration works
[ ] WhatsApp webhook works
[ ] Banking integration works where applicable
[ ] Brokerage integration works where applicable
[ ] Logs are working
[ ] No critical errors are present
46. Production Security Checklist

Before production launch:

[ ] HTTPS enabled
[ ] Production secrets configured
[ ] .env excluded from Git
[ ] CORS restricted
[ ] Rate limiting enabled
[ ] Authentication enabled
[ ] Authorization enabled
[ ] Input validation enabled
[ ] Sensitive logs removed
[ ] Database backups enabled
[ ] Webhook verification enabled
[ ] External API credentials secured
[ ] AI credentials secured
[ ] Admin endpoints protected
47. Deployment Responsibilities

The team should clearly define who is responsible for:

Repository
Backend deployment
Frontend deployment
Database
Redis
Environment variables
AI provider
WhatsApp
Banking integration
Brokerage integration
Monitoring
Production access

Production credentials should not be unnecessarily shared between team members.

48. Shared Development Infrastructure

For development, the team may share services such as:

Shared Neon PostgreSQL
Shared development Redis
Shared sandbox integrations

However, production infrastructure should remain separately controlled.

49. Local Development vs Production

The architecture should remain conceptually consistent while credentials and infrastructure differ.

LOCAL

Developer Computer
   │
   ├── Backend
   ├── PostgreSQL / Neon
   └── Redis


PRODUCTION

Cloud Infrastructure
   │
   ├── Backend
   ├── Managed PostgreSQL
   └── Managed Redis
50. Deployment Documentation Updates

This document should be updated whenever there is a significant change to:

Hosting provider
Database provider
Redis provider
CI/CD pipeline
Environment variables
Production architecture
External integrations
Deployment process
Monitoring
Backup strategy
51. Future Deployment Architecture

The final deployment architecture may evolve as PenniWise grows.

Potential future components include:

CDN
Load Balancer
Multiple API Instances
Background Workers
Queue System
Dedicated Monitoring
Dedicated Logging
Object Storage
Automated Backups
Disaster Recovery

These should only be introduced when required by the application's scale and operational needs.

52. Final Deployment Flow
                    DEVELOPER
                        │
                        ▼
                   GitHub Repo
                        │
                        ▼
                  Pull Request
                        │
                        ▼
                 Review + Tests
                        │
                        ▼
                      Merge
                        │
                        ▼
                  CI/CD Pipeline
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
         Build App            Run Checks
             │                     │
             └──────────┬──────────┘
                        ▼
                 Generate Prisma
                        │
                        ▼
                Apply Migration
                        │
                        ▼
                  Deploy Backend
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
          PostgreSQL  Redis      AI
              │         │         │
              └─────────┼─────────┘
                        ▼
                 External APIs
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           WhatsApp  Banking  Brokerage
                        │
                        ▼
                 Health Checks
                        │
                        ▼
                 LIVE PENNIWISE
53. Deployment Principle

The deployment process should prioritize:

Reproducibility, security, reliability, and controlled releases.

Every production deployment should be traceable to a specific Git commit, use the correct environment configuration, apply database changes safely, and provide a clear method for detecting and recovering from deployment failures.
