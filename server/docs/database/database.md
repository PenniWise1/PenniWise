# PenniWise — Database Documentation

## 1. Overview

PenniWise uses PostgreSQL as its primary persistent database.

The database stores the application's core user, financial, investment, savings, notification, audit, and integration-related data.

Prisma is used as the application's ORM and database access layer.

The current database architecture is:

```text
PenniWise Backend
       │
       ▼
   Prisma Client
       │
       ▼
   PostgreSQL
       │
       ▼
      Neon

Redis is used separately for temporary and high-speed application needs and is not intended to replace PostgreSQL as the primary source of truth.

2. Database Technology
Database
PostgreSQL
Database Hosting
Neon
ORM
Prisma
Database Adapter
@prisma/adapter-pg
PostgreSQL Driver
pg

The backend uses Prisma together with the PostgreSQL adapter.

3. Database Configuration

The Prisma schema is located at:

server/prisma/schema.prisma

The Prisma configuration file is:

server/prisma.config.ts

The Prisma configuration points to:

prisma/schema.prisma

and uses:

prisma/migrations

as the migrations directory.

The database connection URL is provided through the environment:

DATABASE_URL

The database URL must never be committed to GitHub.

4. Environment Configuration

The backend requires a database connection string.

Example:

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

The actual production value must remain inside the environment configuration and should not be added to source control.

Developers should maintain their own local .env files.

5. Database Ownership

The shared Neon PostgreSQL database is the common development database for the PenniWise project.

The recommended team structure is:

Developer A
     │
     ├── Local Code
     ├── Local .env
     │
     └──────────┐
                │
                ▼
         Shared Neon DB
                ▲
                │
     ┌──────────┘
     │
Developer B
     │
     ├── Local Code
     └── Local .env

Both developers can therefore work against the same database while keeping secrets out of GitHub.

6. Prisma Schema

The Prisma schema defines the database structure used by the application.

The schema is located at:

server/prisma/schema.prisma

The generator configuration is:

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

The database provider is PostgreSQL:

datasource db {
  provider = "postgresql"
}

The connection URL is supplied through Prisma configuration/environment rather than hardcoded into the schema.

7. Prisma Client

The generated Prisma client is output to:

server/src/generated/prisma

The application database configuration imports the generated client.

Example architecture:

Application Service
       │
       ▼
Database Configuration
       │
       ▼
Prisma Client
       │
       ▼
PostgreSQL

Generated Prisma files should not be manually edited.

They should be regenerated whenever the Prisma schema or Prisma configuration requires regeneration.

8. Database Migrations

Database migrations are used to safely track changes to the database schema.

The migrations directory is:

server/prisma/migrations

A migration represents a controlled database structure change.

Examples include:

Creating a new table.
Adding a column.
Removing a column.
Changing a field.
Adding an index.
Adding or removing relationships.
Adding constraints.
9. Migration Workflow

When a developer changes the Prisma schema:

Edit schema.prisma
       │
       ▼
Review schema change
       │
       ▼
Create migration
       │
       ▼
Migration stored in
prisma/migrations
       │
       ▼
Apply migration
       │
       ▼
Shared Neon Database
       │
       ▼
Generate Prisma Client

The migration files should be committed to GitHub.

The database itself should not be committed to GitHub.

10. Team Migration Workflow

Because multiple developers work on PenniWise, database changes must be coordinated.

Recommended workflow:

Developer makes schema change
          │
          ▼
Create migration
          │
          ▼
Test migration
          │
          ▼
Commit schema + migration
          │
          ▼
Push to GitHub
          │
          ▼
Other developer pulls changes
          │
          ▼
Apply migration
          │
          ▼
Regenerate Prisma Client

The migration files are the shared record of how the database structure evolves.

11. Important Migration Rule

Developers should not manually modify the shared Neon database structure when the change should be represented by Prisma.

Instead:

Prisma Schema
      ↓
Migration
      ↓
Database

This ensures that the database structure can be reproduced consistently.

12. Database Schema Development

The Prisma schema should be treated as the primary definition of the application's database structure.

When a new feature requires persistent data:

Feature Requirement
       ↓
Determine Required Data
       ↓
Update Prisma Schema
       ↓
Review Relationships
       ↓
Create Migration
       ↓
Apply Migration
       ↓
Update Application Code
13. Core Database Domains

The PenniWise database is divided conceptually into several domains.

Users
 │
 ├── Authentication
 ├── KYC
 └── Risk Profile

Financial
 │
 ├── Wallets
 ├── Transactions
 └── Ledger

Savings
 │
 └── Savings Goals

Investments
 │
 ├── Instruments
 ├── Orders
 ├── Holdings
 └── Market Data

Communication
 │
 ├── Conversations
 └── Notifications

Monitoring
 │
 ├── Audit Logs
 └── System Events

External Integrations
 │
 ├── Banking
 ├── Brokerage
 ├── KYC
 └── WhatsApp
14. User Data

User-related data represents the people using PenniWise.

Typical user information includes:

User ID.
Phone number.
Name.
Email where applicable.
Account status.
WhatsApp identity.
Authentication information.
Timestamps.

User records serve as the central relationship point for many other database entities.

Conceptually:

User
 │
 ├── KYC
 ├── Risk Profile
 ├── Wallets
 ├── Transactions
 ├── Savings Goals
 ├── Orders
 ├── Holdings
 ├── Notifications
 └── Audit-related activity
15. Authentication Data

Authentication-related information must be protected.

Passwords must never be stored as plain text.

Where passwords are used, they should be securely hashed using the application's password hashing mechanism.

JWT secrets must remain in environment variables.

Authentication secrets should never be stored in:

GitHub
Prisma schema
Source code
Database logs
Application logs
16. KYC Data

KYC data represents identity verification information.

The system may integrate with external KYC providers for:

BVN verification.
NIN verification.
Liveness verification.
Identity verification status.

KYC information is sensitive and must have restricted access.

The database should store only information necessary for PenniWise to operate and track verification.

Where possible, provider references and verification status should be stored instead of unnecessary copies of highly sensitive information.

17. Risk Profile Data

The user's risk profile determines their investment-risk classification.

The current categories are:

CONSERVATIVE
MODERATE
AGGRESSIVE

Risk-profile information may be used by:

Recommendation services.
Portfolio analysis.
AI interactions.
Investment suitability logic.
18. Wallet Data

Wallets represent user financial balances.

A wallet may contain information such as:

Wallet
 ├── User
 ├── Currency
 ├── Balance
 ├── Status
 └── Wallet Type

Example:

User
 └── NGN Wallet
       └── Balance

Wallet balances must be handled carefully because they represent financial state.

19. Transaction Data

Transactions represent financial movements through the platform.

Examples include:

DEPOSIT
WITHDRAWAL
TRANSFER
SAVINGS_CONTRIBUTION
TRADE
FEE

The exact transaction types should follow the implemented Prisma schema.

A transaction should maintain enough information to identify:

User.
Wallet.
Amount.
Currency.
Transaction type.
Transaction status.
External reference.
Idempotency key.
Timestamps.
20. Ledger Data

The ledger represents the financial record of movements affecting account balances.

The conceptual relationship is:

Financial Operation
       │
       ▼
Transaction
       │
       ▼
Ledger Entries
       │
       ▼
Account Balance

Ledger data should be treated as highly sensitive and should not be casually modified or deleted.

For financial systems, ledger records should generally be append-oriented rather than being freely overwritten.

21. Idempotency

Financial requests may be retried due to:

Network failures.
Client retries.
Provider retries.
Server retries.
Webhook retries.

To prevent duplicate financial operations, idempotency keys should be used where appropriate.

Example:

Request
  │
  ├── Idempotency-Key: ABC123
  │
  ▼
Check existing operation
  │
  ├── Exists → Return existing result
  │
  └── Does not exist
          │
          ▼
      Process operation

The idempotency key should be unique for the operation being protected.

22. Savings Data

Savings goals represent user-defined financial targets.

A savings goal may contain:

Savings Goal
 ├── User
 ├── Name
 ├── Target Amount
 ├── Target Date
 ├── Current Amount
 ├── Savings Type
 ├── Status
 └── Timestamps

Example:

User
 │
 └── December Goal
       │
       ├── Target: ₦100,000
       ├── Current: ₦35,000
       └── Target Date: December
23. Investment Instrument Data

An instrument represents an investment product available through PenniWise.

For equities, an instrument may contain:

Instrument
 ├── Symbol/Ticker
 ├── Name
 ├── Exchange
 ├── Asset Type
 ├── Current Price
 └── Status

Example:

GTCO
 │
 ├── Exchange: NGX
 ├── Asset Type: EQUITY
 └── Current Price

Instrument data may originate from an external market-data provider.

24. Order Data

Orders represent investment instructions submitted by users.

An order may contain:

Order
 ├── User
 ├── Instrument
 ├── Side
 ├── Quantity
 ├── Price
 ├── Status
 ├── External Reference
 └── Timestamps

Typical order sides include:

BUY
SELL

Order status should reflect the actual state of the order.

25. Order Lifecycle

An order may move through multiple states.

Conceptually:

REQUESTED
    ↓
PENDING
    ↓
SUBMITTED
    ↓
PARTIALLY_FILLED
    ↓
FILLED
    ↓
SETTLED

Other possible outcomes include:

REJECTED
CANCELLED
FAILED

The exact states should follow the final Prisma schema and brokerage integration.

26. Holdings Data

Holdings represent the investment assets currently owned by a user.

Conceptually:

User
 │
 └── Holding
       ├── Instrument
       ├── Quantity
       ├── Average Cost
       └── Current Value

Holdings should be updated based on confirmed investment transactions rather than simply based on user requests.

27. Portfolio Data

A portfolio is derived from a user's holdings and relevant market data.

User
 │
 ├── Holdings
 │
 └── Market Prices
        │
        ▼
   Portfolio Value

Portfolio information can be calculated rather than storing every calculated value permanently.

28. Price Alert Data

Price alerts allow users to specify conditions for investment instruments.

Example:

User
 │
 └── Price Alert
       ├── Instrument
       ├── Target Price
       ├── Direction
       ├── Active
       └── Triggered At

Example:

"Notify me when GTCO reaches ₦100."

The system stores the alert and evaluates it against incoming market data.

29. Notification Data

Notifications record messages and system events that need to be communicated to users.

Examples include:

Trade updates.
Savings updates.
Price alerts.
Account updates.
KYC updates.
Security notifications.

Conceptually:

Event
  ↓
Notification Service
  ↓
Notification Record
  ↓
WhatsApp / Other Channel
30. Conversation Data

Conversation data supports the WhatsApp-first experience.

Conversation records may be associated with:

User.
Messages.
Conversation state.
AI interactions.
Timestamps.

The purpose is to allow PenniWise to maintain context across multiple interactions.

Example:

User
 │
 └── Conversation
       │
       ├── Message
       ├── Message
       ├── Message
       └── Message
31. Audit Log Data

Sensitive actions should generate audit records.

Examples include:

Authentication events.
Account changes.
Financial operations.
Administrative actions.
KYC status changes.
Trading operations.
Security events.

Conceptually:

Action
  ↓
Audit Service
  ↓
Audit Log

Audit records should contain enough information to determine:

Who performed the action.
What action occurred.
What resource was affected.
When it happened.
Previous state where appropriate.
New state where appropriate.
Relevant request metadata.
32. External Provider References

When PenniWise communicates with an external provider, the database may need to store provider references.

Examples:

Bank Transaction Reference
Broker Order Reference
KYC Verification Reference
WhatsApp Message ID

These references allow PenniWise to reconcile internal records with external systems.

Example:

PenniWise Transaction
       │
       └── External Reference
                │
                ▼
         Banking Provider
33. Database Relationships

The database should maintain clear relationships between entities.

Conceptual structure:

User
 │
 ├───────────────┐
 │               │
 ▼               ▼
Wallet         SavingsGoal
 │
 ▼
Transaction
 │
 ▼
LedgerEntry

User
 │
 ├── Order
 │     │
 │     ▼
 │  Instrument
 │
 └── Holding
       │
       ▼
    Instrument
34. Referential Integrity

Relationships between database records should be protected using appropriate foreign keys and Prisma relations.

For example:

Order
  │
  └── must reference a valid User

Order
  │
  └── must reference a valid Instrument

This prevents orphaned records and inconsistent data.

35. Deletion Policy

Financial records should not be casually deleted.

Records such as:

Transactions.
Ledger entries.
Orders.
Audit logs.

should generally be retained according to the application's retention requirements.

Where an entity needs to be removed from active use, a status or soft-delete approach may be preferable to permanently deleting historical records.

36. Database Indexing

Indexes should be created for fields that are frequently queried.

Potential examples include:

User.phone
User.email
Transaction.userId
Transaction.status
Transaction.createdAt
Order.userId
Order.status
Order.createdAt
Holding.userId
PriceAlert.userId
Notification.userId
AuditLog.createdAt

Indexes should be added based on actual query patterns and measured performance.

Indexes should not be added indiscriminately because they increase storage and write overhead.

37. Database Constraints

The database should enforce important integrity rules where appropriate.

Examples include:

Required fields.
Unique user identifiers.
Unique external references.
Valid relationships.
Unique idempotency keys.
Appropriate enum values.
Non-negative financial quantities where applicable.

Application-level validation should still be used in addition to database constraints.

38. Financial Amounts

Financial amounts should use a database representation appropriate for monetary precision.

The implementation should avoid floating-point arithmetic for financial values where precision can be lost.

Amounts should be represented using the Prisma/database type selected for financial precision.

Example conceptual values:

100000.00
50000.50
2500.75

The final monetary representation should follow the implemented Prisma schema and financial-service requirements.

39. Timestamps

Database entities should use consistent timestamps.

Common fields include:

createdAt
updatedAt

Additional timestamps may be required for state changes.

Examples:

verifiedAt
completedAt
settledAt
triggeredAt
cancelledAt

All services should use a consistent timezone strategy, preferably storing timestamps in UTC.

40. Database Transactions

Operations that modify multiple related financial records should use database transactions where necessary.

Example:

Trade Completed
      │
      ▼
Database Transaction
      │
      ├── Create Transaction
      ├── Create Ledger Entry
      ├── Update Wallet
      ├── Update Order
      └── Update Holding
      │
      ▼
Commit

If a required database operation fails, the transaction should roll back where appropriate.

This prevents partial financial state.

41. Database and External Providers

Database transactions cannot automatically guarantee atomicity across external providers.

For example:

PenniWise Database
        │
        ▼
Broker API

A broker may successfully execute an order while a local database operation fails.

Therefore, external financial integrations must support:

External references.
Idempotency.
Status tracking.
Reconciliation.
Retry handling.
Webhook processing.
42. Reconciliation

PenniWise should periodically reconcile internal financial records with external providers.

Conceptually:

PenniWise Records
       │
       │ Compare
       ▼
External Provider
       │
       ▼
Reconciliation Result
       │
       ├── Match
       │
       └── Difference
              │
              ▼
          Investigation

This becomes especially important for:

Wallet balances.
Bank transactions.
Brokerage orders.
Trade settlement.
Holdings.
43. Neon Database

Neon hosts the shared PostgreSQL database used by the development team.

The application connects using:

DATABASE_URL="..."

Each developer should configure their local environment to point to the appropriate Neon database.

The Neon connection string must not be committed to GitHub.

44. Shared Database Development

Both developers can work against the same Neon database.

However, database changes should be coordinated.

Recommended process:

Developer A
     │
     ├── Changes schema
     ├── Creates migration
     └── Pushes migration
              │
              ▼
           GitHub
              │
              ▼
Developer B
     │
     ├── Pulls changes
     ├── Applies migration
     └── Continues development

Developers should avoid independently changing the shared database structure without recording the change through Prisma migrations.

45. Local Development Database

A separate local PostgreSQL database may be used in the future if the team needs isolated development environments.

For example:

Developer A
    │
    └── Local PostgreSQL

Developer B
    │
    └── Local PostgreSQL

Production
    │
    └── Neon PostgreSQL

However, if the current team has agreed to use the shared Neon database during development, that setup should remain consistent until the team decides otherwise.

46. Environment Separation

PenniWise should eventually maintain separate databases for different environments.

Recommended structure:

Development
    ↓
Development Database

Staging
    ↓
Staging Database

Production
    ↓
Production Database

Production data should never be casually used for development or testing.

47. Database Backups

The database hosting strategy should include reliable backups and recovery procedures.

The team should document:

Backup provider.
Backup frequency.
Retention period.
Recovery procedure.
Recovery testing process.

These details should be added once the production infrastructure is finalized.

48. Database Security

Database credentials must be treated as secrets.

Never commit:

DATABASE_URL
Database passwords
Database credentials
API keys
JWT secrets
Provider secrets

to GitHub.

Sensitive credentials should be stored using:

.env
Environment variables
Deployment platform secrets
Secret management systems

The .env file should be included in .gitignore.

49. Prisma Client Generation

After changes to the Prisma schema, regenerate the Prisma client.

Conceptually:

schema.prisma
      │
      ▼
Prisma Generate
      │
      ▼
Generated Prisma Client
      │
      ▼
Application

Generated files should not be manually modified.

50. Database Change Checklist

Before committing a database change:

[ ] Update schema.prisma
[ ] Review relationships
[ ] Review constraints
[ ] Review indexes
[ ] Create migration
[ ] Test migration
[ ] Test affected application code
[ ] Regenerate Prisma Client
[ ] Confirm migration works
[ ] Commit schema changes
[ ] Commit migration files
[ ] Push to GitHub
51. Developer Setup Checklist

A new developer joining the project should:

[ ] Clone repository
[ ] Install dependencies
[ ] Create local .env
[ ] Obtain DATABASE_URL
[ ] Configure required environment variables
[ ] Run Prisma generation
[ ] Apply existing migrations
[ ] Verify database connection
[ ] Start development server

The developer should never copy another developer's entire .env file into GitHub.

52. Database Change Checklist for the Team

Before making a major schema change:

1. Discuss the change with the team.
2. Determine which models are affected.
3. Update schema.prisma.
4. Review relationships and constraints.
5. Create a Prisma migration.
6. Test the migration.
7. Commit the migration.
8. Push to GitHub.
9. Notify the other developer.
10. Apply the migration to the shared database.
53. Database Source of Truth

The database architecture follows this hierarchy:

Prisma Schema
      │
      ▼
Prisma Migrations
      │
      ▼
PostgreSQL / Neon
      │
      ▼
Application Data

The Prisma schema and migration history should remain synchronized with the actual database.

54. Database Design Principles

PenniWise database development should follow these principles:

Consistency — Data should remain internally consistent.
Integrity — Relationships and financial records must be protected.
Security — Sensitive data must be protected.
Auditability — Important financial actions must be traceable.
Idempotency — Duplicate requests must not create duplicate financial effects.
Scalability — The schema should support future growth.
Maintainability — Database changes should be tracked through migrations.
Separation of concerns — Database logic should remain separate from API route logic.
Reconciliation — External financial records should be reconcilable with internal records.
Least privilege — Services and users should only access the data they need.
55. Database Development Rule

The most important database development rule for PenniWise is:

Never make an important database structure change directly on the shared database without representing that change in the Prisma schema and migration history.

The expected workflow is:

Requirement
    ↓
Prisma Schema
    ↓
Migration
    ↓
Shared Database
    ↓
Prisma Client
    ↓
Application
