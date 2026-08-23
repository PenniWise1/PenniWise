# PenniWise — Database Schema Documentation

## 1. Overview

The PenniWise database schema defines the structure of the PostgreSQL database used by the application.

The schema is managed using Prisma and is located at:

```text
server/prisma/schema.prisma

The schema defines:

Database models.
Relationships between models.
Enumerations.
Primary keys.
Foreign keys.
Unique constraints.
Indexes.
Default values.
Timestamps.
Database-level relationships.

The database uses PostgreSQL.

2. Schema Architecture

The database can be viewed as several connected domains:

                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
        KYC                Risk Profile           Wallet
          │                                           │
          │                                           ▼
          │                                      Transaction
          │                                           │
          │                                           ▼
          │                                      Ledger Entry
          │
          ├───────────────────────────────────────────┐
          │                                           │
          ▼                                           ▼
   Savings Goals                                Investments
                                                      │
                                  ┌───────────────────┼───────────────────┐
                                  │                   │                   │
                                  ▼                   ▼                   ▼
                              Instrument           Order              Holding
                                  │
                                  ▼
                            Market Data

User
 │
 ├── Conversations
 ├── Notifications
 ├── Price Alerts
 └── Audit Logs

The exact relationships and models must always follow the current schema.prisma.

3. Prisma Schema Location

The primary schema file is:

server/prisma/schema.prisma

The Prisma configuration file is:

server/prisma.config.ts

The migration directory is:

server/prisma/migrations

Generated Prisma client files are located at:

server/src/generated/prisma
4. Prisma Generator

PenniWise uses the Prisma client generator.

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

This means Prisma generates the client into:

server/src/generated/prisma

The generated client is consumed by the backend database configuration.

5. Database Provider

PenniWise uses PostgreSQL.

datasource db {
  provider = "postgresql"
}

The database connection URL is supplied through environment configuration.

The connection string must not be hardcoded into the Prisma schema.

6. Schema as the Source of Truth

The Prisma schema should be treated as the primary source definition for the database structure.

The expected relationship is:

schema.prisma
      │
      ▼
Prisma Migration
      │
      ▼
PostgreSQL
      │
      ▼
Application

Database structure changes should therefore begin with the Prisma schema rather than directly modifying the shared database.

7. User Model

The User model represents a PenniWise customer.

The user is the central entity around which most application data is organized.

Conceptually:

User
 │
 ├── Authentication
 ├── KYC
 ├── Risk Profile
 ├── Wallets
 ├── Transactions
 ├── Savings Goals
 ├── Orders
 ├── Holdings
 ├── Price Alerts
 ├── Notifications
 ├── Conversations
 └── Audit Records

The exact fields should be taken from the current Prisma schema.

8. User Relationships

The user model should act as the parent entity for customer-specific resources.

Conceptually:

User
 │
 ├── 1 → Many Wallets
 ├── 1 → Many Transactions
 ├── 1 → Many Savings Goals
 ├── 1 → Many Orders
 ├── 1 → Many Holdings
 ├── 1 → Many Notifications
 ├── 1 → Many Price Alerts
 └── 1 → Many Conversations

Some relationships may instead be one-to-one depending on the actual Prisma implementation.

9. Authentication Schema

Authentication-related data is associated with the user.

Passwords, where applicable, must never be stored as plain text.

Passwords should be stored only as securely hashed values.

JWT secrets are not part of the database schema.

JWT secrets belong in environment variables.

JWT_SECRET

must never be committed to GitHub.

10. KYC Model

KYC records contain information about the user's identity-verification process.

The KYC model may track:

User.
Verification status.
Verification provider.
Provider reference.
Verification timestamps.
Relevant verification metadata.

Sensitive identity information must be handled carefully.

The database should store only information required by the application and regulatory/integration requirements.

11. KYC Status

The KYC lifecycle should be represented using controlled status values.

Conceptually:

PENDING
   │
   ├── VERIFIED
   │
   └── FAILED

The actual enum values must match the current Prisma schema.

12. Risk Profile Model

The risk profile stores the user's investment risk classification.

Current conceptual classifications are:

CONSERVATIVE
MODERATE
AGGRESSIVE

The risk profile may be used by:

Investment recommendations.
Portfolio analysis.
AI services.
Suitability checks.
Investment workflows.

The actual model fields and relationships must follow schema.prisma.

13. Wallet Model

Wallets represent financial accounts or balances associated with a user.

Conceptually:

Wallet
 ├── User
 ├── Currency
 ├── Balance
 ├── Type
 ├── Status
 └── Timestamps

Example:

User
 │
 └── NGN Wallet
       │
       └── Balance

Wallet balances are financially sensitive and must not be modified casually.

14. Transaction Model

Transactions represent financial movements within PenniWise.

Possible transaction categories include:

DEPOSIT
WITHDRAWAL
TRANSFER
SAVINGS_CONTRIBUTION
TRADE
FEE

The final transaction types must match the current Prisma schema.

A transaction should provide sufficient information to determine:

Who initiated it.
What financial account was affected.
The amount.
Currency.
Transaction type.
Transaction status.
External provider reference.
Idempotency information.
Timestamps.
15. Transaction Status

Transactions normally require a lifecycle.

Conceptually:

PENDING
   │
   ├── COMPLETED
   │
   ├── FAILED
   │
   └── REVERSED

The exact values must match the Prisma schema.

16. Ledger Model

The ledger records financial changes that affect account balances.

Conceptually:

Financial Operation
       │
       ▼
Transaction
       │
       ▼
Ledger Entry
       │
       ▼
Account Balance

Ledger records are critical financial records.

They should generally be treated as historical records rather than records that are freely edited or deleted.

17. Savings Goal Model

Savings goals represent targets created by users.

Conceptually:

SavingsGoal
 ├── User
 ├── Name
 ├── Target Amount
 ├── Current Amount
 ├── Target Date
 ├── Type
 ├── Status
 └── Timestamps

Example:

User
 │
 └── Emergency Fund
       │
       ├── Target: ₦500,000
       ├── Current: ₦150,000
       └── Target Date
18. Investment Instrument Model

An investment instrument represents an asset available through PenniWise.

For example:

GTCO

An instrument may contain:

Ticker.
Name.
Exchange.
Asset type.
Current market information.
Status.

Conceptually:

Instrument
 ├── Ticker
 ├── Name
 ├── Exchange
 ├── Asset Type
 └── Status
19. Order Model

Orders represent investment instructions submitted by users.

Conceptually:

Order
 ├── User
 ├── Instrument
 ├── Side
 ├── Quantity
 ├── Price
 ├── Status
 ├── External Reference
 └── Timestamps

Common order sides include:

BUY
SELL

The final values must match the implemented schema.

20. Order Lifecycle

An order may progress through multiple states.

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

The exact lifecycle must follow the brokerage integration and current Prisma schema.

21. Holding Model

Holdings represent investment assets owned by a user.

Conceptually:

Holding
 ├── User
 ├── Instrument
 ├── Quantity
 ├── Average Cost
 └── Timestamps

Example:

User
 │
 └── Holding
       │
       ├── Instrument: GTCO
       ├── Quantity: 100
       └── Average Cost

Holdings should represent confirmed investment positions rather than unconfirmed orders.

22. Portfolio Relationship

Portfolio information can be derived from holdings and current market prices.

User
 │
 └── Holdings
       │
       ├── Instrument A
       ├── Instrument B
       └── Instrument C
              │
              ▼
        Market Prices
              │
              ▼
       Portfolio Value

Not every portfolio metric needs to be stored permanently.

Some values can be calculated when requested.

23. Market Data Model

Market data represents pricing information for investment instruments.

Conceptually:

Instrument
    │
    ▼
Market Data
    │
    ├── Price
    ├── Timestamp
    ├── Volume
    └── Other Provider Data

The exact fields depend on the selected market-data provider and the current schema.

24. Price Alert Model

Price alerts allow users to specify market conditions they want to be notified about.

Conceptually:

PriceAlert
 ├── User
 ├── Instrument
 ├── Target Price
 ├── Direction
 ├── Active
 └── Triggered At

Example:

"Notify me when GTCO reaches ₦100."

The alert is associated with both the user and the investment instrument.

25. Notification Model

Notifications represent messages generated by the PenniWise system.

Notifications may be triggered by:

Transactions.
Savings events.
KYC events.
Investment events.
Price alerts.
Security events.
Account events.

Conceptually:

System Event
     │
     ▼
Notification
     │
     ▼
Delivery Channel

Possible delivery channels include WhatsApp and other supported channels.

26. Conversation Model

Conversation data supports the conversational experience of PenniWise.

Conceptually:

User
 │
 └── Conversation
       │
       ├── Message
       ├── Message
       ├── Message
       └── Message

Conversation data allows the application to maintain context across interactions.

The exact conversation/message models must follow the current Prisma schema.

27. Audit Log Model

Audit logs record important system activities.

Potential events include:

Authentication.
Account changes.
Financial transactions.
Investment actions.
Administrative actions.
KYC changes.
Security events.

Conceptually:

System Action
      │
      ▼
Audit Log
      │
      ├── Actor
      ├── Action
      ├── Resource
      ├── Timestamp
      └── Metadata

Audit logs should generally be retained rather than casually deleted.

28. External Provider References

Financial and identity integrations require external references.

Examples include:

Bank Transaction ID
Broker Order ID
KYC Verification ID
WhatsApp Message ID

These references allow PenniWise to correlate external events with internal database records.

Conceptually:

PenniWise Record
      │
      └── External Reference
                │
                ▼
        External Provider
29. Primary Keys

Each database model should have a unique primary identifier.

The exact primary-key type and implementation must follow the current Prisma schema.

The primary key is used to uniquely identify records and establish relationships between models.

Example:

User
 └── id

Order
 └── id

Transaction
 └── id
30. Foreign Keys

Foreign keys connect related records.

Example:

Transaction
     │
     └── userId
             │
             ▼
           User.id

Foreign keys help maintain referential integrity.

A transaction belonging to a user should not reference a nonexistent user.

31. Unique Constraints

Unique constraints should be used for values that must not be duplicated.

Potential examples include:

User phone number
User email
External transaction reference
External order reference
Idempotency key
Instrument ticker

The exact constraints must be defined in schema.prisma.

32. Indexes

Indexes should support frequently executed queries.

Potential indexes include:

userId
status
createdAt
externalReference
ticker

Indexes should be created based on actual application access patterns.

Example:

Transaction
 ├── userId
 ├── status
 └── createdAt

This can improve transaction-history queries.

33. Enums

Enums should be used where a field has a controlled set of possible values.

Examples include:

TransactionStatus
OrderStatus
OrderSide
UserStatus
KycStatus
RiskProfile

Enums prevent inconsistent values from entering the database.

For example, instead of allowing:

completed
Complete
DONE
success

a controlled enum can enforce:

COMPLETED

The exact enum names and values must match the current Prisma schema.

34. Timestamps

Models should use consistent timestamps.

Common fields include:

createdAt
updatedAt

State-specific timestamps may include:

verifiedAt
completedAt
settledAt
cancelledAt
triggeredAt

Timestamps should use a consistent timezone strategy.

UTC should be preferred for persisted timestamps.

35. Financial Precision

Financial amounts must be stored using a representation that preserves monetary precision.

Floating-point values should not be used where they can introduce financial rounding errors.

For example:

100000.00
50000.50
2500.75

The exact Prisma type for monetary values must be determined by the current schema and financial implementation.

36. Relationships and Cascades

Relationship behavior must be explicitly considered when defining Prisma relations.

For each relationship, the team should determine what happens when the parent record changes or is removed.

Examples include:

CASCADE
RESTRICT
SET NULL

Financial records should generally not be automatically deleted through cascading relationships without careful review.

37. Soft Deletion

Some entities may require soft deletion instead of permanent deletion.

A soft-delete implementation may use:

deletedAt

or an equivalent status field.

This is particularly useful where historical records need to remain available for:

Auditing.
Compliance.
Reconciliation.
Customer support.

Financial records should generally be retained.

38. Idempotency Schema

Financial operations should support idempotency.

Conceptually:

Transaction
 ├── id
 ├── idempotencyKey
 └── status

The idempotency key can be used to detect duplicate requests.

Example:

Request A
Idempotency-Key: ABC123
        │
        ▼
Transaction Created

Request A Retry
Idempotency-Key: ABC123
        │
        ▼
Existing Transaction Found

The exact implementation must follow the current schema.

39. External Integration Schema

External integrations may require provider-specific identifiers.

Conceptually:

Internal Record
 │
 ├── provider
 ├── providerReference
 └── status

This allows the application to track external operations without tightly coupling the core database model to a specific provider.

40. Database Normalization

The schema should avoid unnecessary duplication of information.

For example, instead of storing the complete instrument information repeatedly on every order:

Order
  └── instrumentId
          │
          ▼
      Instrument

The order references the instrument.

This improves consistency and reduces duplicated data.

41. Denormalized Data

Denormalization may be introduced when there is a demonstrated performance requirement.

Examples could include:

Cached portfolio totals.
Aggregated statistics.
Frequently accessed market values.

Denormalized values must have a clear strategy for keeping them synchronized with the underlying source data.

42. Database Transactions

Operations involving multiple related records should use Prisma/database transactions when atomicity is required.

Example:

Financial Operation
       │
       ▼
Database Transaction
       │
       ├── Transaction Record
       ├── Ledger Entry
       ├── Wallet Update
       └── Related Record Update
       │
       ▼
     COMMIT

If a required operation fails, the database transaction should roll back where appropriate.

43. External Transaction Boundary

A database transaction cannot automatically make an external API operation atomic.

For example:

PostgreSQL
    │
    ▼
Brokerage API

The brokerage operation may succeed even if the local database operation fails.

Therefore, external financial operations require:

Provider references.
Status tracking.
Idempotency.
Retry handling.
Reconciliation.
Webhook processing.
44. Migration Relationship

Schema changes are tracked using Prisma migrations.

schema.prisma
      │
      ▼
Migration
      │
      ▼
Neon PostgreSQL

Migration files are stored in:

server/prisma/migrations

Migration files must be committed to GitHub.

45. Developer Schema Workflow

When implementing a feature that requires database changes:

1. Identify required data.
2. Update schema.prisma.
3. Define relationships.
4. Define constraints.
5. Define indexes where necessary.
6. Review enum values.
7. Create Prisma migration.
8. Test migration.
9. Apply migration.
10. Generate Prisma Client.
11. Update application services.
12. Test the feature.
46. Shared Database Workflow

Because PenniWise is being developed collaboratively, schema changes must be communicated between developers.

Recommended workflow:

Developer A
     │
     ▼
Update schema.prisma
     │
     ▼
Create migration
     │
     ▼
Commit migration
     │
     ▼
Push to GitHub
     │
     ▼
Developer B pulls changes
     │
     ▼
Apply migration
     │
     ▼
Generate Prisma Client

The migration history is the shared record of database structure changes.

47. Shared Neon Database

The development team uses a shared Neon PostgreSQL database.

Both developers can connect to the database using their own local .env files.

Example:

DATABASE_URL="postgresql://..."

The actual connection string must remain private.

The .env file must not be committed to GitHub.

48. Environment Separation

The application should eventually have separate databases for:

Development
     │
     ▼
Development Database

Staging
     │
     ▼
Staging Database

Production
     │
     ▼
Production Database

Production data should never be used casually for development.

49. Schema Safety Rules

The following rules apply to schema development:

Do not manually edit generated Prisma client files.
Do not commit .env files containing secrets.
Do not hardcode database credentials.
Do not directly modify the shared database when a Prisma migration should be used.
Do not delete financial records casually.
Review relationships before changing models.
Review migration SQL before applying major changes.
Coordinate destructive schema changes with the team.
Test migrations before applying them to production.
Keep Prisma schema and migration history synchronized.
50. Schema Change Checklist

Before merging a schema change:

[ ] Requirement identified
[ ] schema.prisma updated
[ ] Relationships reviewed
[ ] Foreign keys reviewed
[ ] Constraints reviewed
[ ] Indexes reviewed
[ ] Enums reviewed
[ ] Financial precision reviewed
[ ] Migration created
[ ] Migration tested
[ ] Prisma Client regenerated
[ ] Application code updated
[ ] Tests passed
[ ] Migration committed
[ ] Team notified
51. Schema Documentation Rule

Whenever a new database model is introduced, this document should be updated.

The documentation should explain:

Purpose of the model.
Important fields.
Relationships.
Constraints.
Indexes.
Lifecycle.
Security considerations.
Whether the model contains financial or sensitive information.
52. Current Schema Authority

The actual database structure is always determined by the current:

server/prisma/schema.prisma

This documentation explains the intended organization and responsibilities of the database schema.

If this document and the actual Prisma schema differ, the implementation should be reviewed and the documentation updated rather than silently assuming that the documented structure is correct.

53. Schema Design Principles

PenniWise database schema development follows these principles:

Integrity — Related data must remain consistent.
Security — Sensitive information must be protected.
Auditability — Important actions must be traceable.
Precision — Financial values must maintain monetary accuracy.
Idempotency — Financial operations should not be duplicated.
Scalability — The schema should support future growth.
Maintainability — Changes must be tracked through migrations.
Reproducibility — The database should be reconstructable from the schema and migration history.
Separation of concerns — Database models should not contain unnecessary application logic.
Financial safety — Financial records should be treated as durable historical records.
54. Final Schema Workflow

The complete database development lifecycle is:

Feature Requirement
        │
        ▼
Database Design
        │
        ▼
schema.prisma
        │
        ▼
Prisma Migration
        │
        ▼
Neon PostgreSQL
        │
        ▼
Prisma Client
        │
        ▼
Backend Services
        │
        ▼
API
        │
        ▼
Client / WhatsApp

The Prisma schema, migration history, and actual Neon database should remain synchronized throughout development.
