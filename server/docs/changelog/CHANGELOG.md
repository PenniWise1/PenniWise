# PenniWise — Changelog

All notable changes to PenniWise are documented in this file.

The changelog records important changes to the project, including:

- New features
- Improvements
- Bug fixes
- Breaking changes
- Security changes
- Database changes
- API changes
- Integration changes
- Deployment changes

---

## Changelog Format

Each release should follow this structure:

```text
## [Version] — YYYY-MM-DD

### Added
- New functionality.

### Changed
- Changes to existing functionality.

### Fixed
- Bug fixes.

### Removed
- Removed functionality.

### Security
- Security-related changes.

### Database
- Database schema or migration changes.

### API
- API endpoint or contract changes.

### Integrations
- Changes to external integrations.

### Deployment
- Infrastructure or deployment changes.

Only sections that contain changes need to be included for a particular release.

Unreleased

Changes currently being developed and not yet included in a released version.

Added
Initial PenniWise project documentation structure.
Project overview documentation.
Project requirements documentation.
Project roadmap documentation.
System architecture documentation.
System components documentation.
Data-flow documentation.
API documentation.
Database documentation.
Database schema documentation.
AI documentation.
Conversation engine documentation.
AI safety and guardrails documentation.
WhatsApp documentation.
Banking documentation.
Brokerage documentation.
Security documentation.
Deployment documentation.
Changelog documentation.
Versioning

PenniWise should use a versioning strategy for significant releases.

The project may follow Semantic Versioning:

MAJOR.MINOR.PATCH

For example:

1.0.0

Where:

MAJOR

Used for breaking changes that require users, developers, or integrations to make significant changes.

Example:

1.0.0 → 2.0.0
MINOR

Used for backward-compatible new features.

Example:

1.0.0 → 1.1.0
PATCH

Used for backward-compatible bug fixes and small improvements.

Example:

1.1.0 → 1.1.1
Database Changes

Database changes should be documented when they affect the application's data structure.

Examples include:

New tables.
Removed tables.
New columns.
Removed columns.
Modified relationships.
Index changes.
Constraints.
Prisma migrations.

Example:

### Database

- Added `transactions` table.
- Added relationship between `User` and `Transaction`.
- Added Prisma migration for transaction records.

The corresponding Prisma migration should also be committed to the repository.

API Changes

API changes should be recorded when they affect:

New endpoints.
Removed endpoints.
Modified endpoints.
Request formats.
Response formats.
Authentication requirements.
Authorization requirements.
Error responses.

Example:

### API

- Added `GET /api/transactions`.
- Added authentication requirement to transaction endpoints.
- Updated transaction response structure.
Security Changes

Security-related changes should be documented separately.

Examples:

Authentication improvements.
Authorization changes.
JWT changes.
Rate limiting.
Input validation.
Webhook verification.
Secret-management changes.
Security vulnerability fixes.

Example:

### Security

- Added rate limiting to authentication endpoints.
- Added authorization checks for financial operations.
- Added webhook signature verification.

Sensitive information such as credentials, secrets, tokens, or private keys must never be included in the changelog.

AI Changes

AI-related changes should be recorded when they affect:

AI models.
System prompts.
Conversation logic.
AI tools.
Tool permissions.
Context handling.
Safety controls.
AI workflows.

Example:

### AI

- Added transaction lookup tool.
- Updated conversation engine to request confirmation before sensitive actions.
- Added validation for AI-generated tool parameters.
Integration Changes

External service changes should be documented.

Potential integrations include:

WhatsApp
Banking providers
Brokerage providers
AI providers
Redis
PostgreSQL

Example:

### Integrations

- Added WhatsApp webhook processing.
- Added banking provider connection.
- Added brokerage sandbox integration.
Deployment Changes

Infrastructure changes should be documented.

Examples:

Hosting provider changes.
Environment-variable changes.
CI/CD changes.
Database deployment changes.
Redis infrastructure changes.
Monitoring changes.

Example:

### Deployment

- Added production deployment pipeline.
- Added automated Prisma migration deployment.
- Added production health checks.
Release History
0.1.0 — Initial Development
Added
Initial PenniWise backend project.
TypeScript backend setup.
Express application.
Prisma database layer.
PostgreSQL integration.
Redis integration.
Environment-variable configuration.
Authentication foundation.
Security middleware foundation.
Logging infrastructure.
API foundation.
Documentation
Added project documentation structure.
Added architecture documentation.
Added database documentation.
Added AI documentation.
Added integration documentation.
Added security documentation.
Added deployment documentation.
Future Releases

Future releases should be added above older releases, with the newest release first.

Example:

# 1.1.0 — YYYY-MM-DD

### Added

- Added new feature.

### Changed

- Improved existing functionality.

### Fixed

- Fixed reported issue.

### Database

- Added new database migration.

### API

- Added new endpoint.

### Security

- Improved authorization checks.
Changelog Guidelines

When making a significant change to PenniWise:

Make the code change.
Test the change.
Update the relevant documentation.
Add the change to the Unreleased section.
Include database/API/security information where applicable.
Commit the changes to Git.
When a release is created, move the relevant changes from Unreleased into a versioned release.
What Should Be Added to the Changelog?

Not every small code change needs to be recorded.

Usually Record
New features.
Important bug fixes.
Breaking changes.
Database migrations.
API changes.
Security fixes.
Major AI changes.
New integrations.
Deployment/infrastructure changes.
Major performance improvements.
Usually Do Not Record
Typographical corrections.
Minor formatting changes.
Internal refactoring with no user-visible effect.
Small code cleanup.
Temporary development experiments.
Change Categories

PenniWise changes should generally fall into one or more of these categories:

Added
Changed
Fixed
Removed
Security
Database
API
AI
Integrations
Deployment
Documentation
Important Principle

The changelog should provide a clear historical record of how PenniWise evolves.

A developer joining the project should be able to use this file to understand:

What has changed.
When it changed.
Why the change matters.
Whether the change affects the database.
Whether the change affects the API.
Whether the change affects security.
Whether the change affects integrations.
Whether the change requires deployment action.

The changelog should remain concise and should link major changes to the relevant documentation, pull requests, issues, or commits when appropriate.
