# PenniWise — System Components

## 1. Overview

PenniWise is composed of several interconnected components that work together to provide a WhatsApp-native savings and investment experience.

The system is designed so that the customer interacts primarily through WhatsApp, while the backend coordinates AI processing, user accounts, KYC, savings, wallets, trading, portfolio management, notifications, and external financial providers.

The major system components are:

1. WhatsApp Interface
2. Conversation Engine
3. AI Layer
4. Authentication & Authorization
5. User Management
6. KYC Service
7. Risk Profiling
8. Wallet Service
9. Ledger & Transaction Service
10. Savings Service
11. Trading Service
12. Portfolio Service
13. Market Data Service
14. Price Alert Service
15. Notification Service
16. Human Escalation
17. Banking Integration
18. Brokerage Integration
19. Admin & Operations
20. Audit Logging
21. PostgreSQL Database
22. Redis
23. External Provider Integration Layer

---

# 2. WhatsApp Interface

## Purpose

The WhatsApp interface is the primary customer-facing entry point for PenniWise.

Users should be able to perform the majority of their PenniWise activities without leaving WhatsApp.

## Responsibilities

* Receive incoming WhatsApp messages.
* Send responses to users.
* Handle interactive messages.
* Receive supported media.
* Deliver notifications.
* Deliver transaction confirmations.
* Deliver savings updates.
* Deliver investment updates.
* Initiate conversations where permitted.

## Does Not Own

The WhatsApp layer should not contain:

* Financial business rules.
* Wallet calculations.
* Trading execution logic.
* KYC verification logic.
* Database business logic.

Those responsibilities belong to backend services.

---

# 3. Conversation Engine

## Purpose

The Conversation Engine manages the state and flow of conversations between users and PenniWise.

## Responsibilities

* Identify the customer.
* Retrieve conversation state.
* Determine the current stage of an interaction.
* Route messages to the appropriate service.
* Manage multi-step conversations.
* Manage confirmation flows.
* Handle invalid or incomplete input.
* Trigger human escalation.

## Example

```text
User Message
     ↓
Conversation Engine
     ↓
Determine Intent
     ↓
Determine Current State
     ↓
Route Request
     ↓
Business Service
     ↓
Response
```

The Conversation Engine should make it possible for a user to continue an unfinished process rather than restarting the entire flow.

---

# 4. AI Layer

## Purpose

The AI Layer provides natural-language understanding and intelligent assistance.

## Responsibilities

* Understand natural-language messages.
* Identify user intent.
* Extract relevant information.
* Generate conversational responses.
* Provide financial education.
* Provide investment suggestions.
* Explain financial concepts.
* Provide portfolio-related insights.
* Assist with savings planning.

The product brief describes AI as supporting investment suggestions, portfolio nudges, price-related insights, and financial literacy coaching.

## Important Boundary

The AI must not directly execute financial transactions.

For example:

```text
AI
 ↓
"User wants to buy 100 shares"
 ↓
Structured Request
 ↓
Trading Service
 ↓
Validation
 ↓
Confirmation
 ↓
Execution
```

The AI interprets the request; the application decides whether it can be executed.

---

# 5. Authentication & Authorization

## Purpose

Controls access to protected PenniWise resources.

## Responsibilities

* Authenticate users.
* Authenticate administrators.
* Generate and validate JWTs.
* Enforce authorization.
* Enforce role-based access.
* Protect administrative endpoints.
* Protect sensitive financial operations.

## Admin Roles

The current system defines:

* SUPPORT
* ADMIN
* SUPER_ADMIN

These roles should have different levels of access.

---

# 6. User Management

## Purpose

Manages customer accounts and customer-related information.

## Responsibilities

* Create users.
* Update user information.
* Retrieve customer information.
* Track account status.
* Associate users with wallets.
* Associate users with KYC records.
* Associate users with savings goals.
* Associate users with investment accounts.

## User Status

The current data model supports account states such as:

* Active.
* Suspended.
* Closed.

User records also contain onboarding-related information such as phone number and WhatsApp ID.

---

# 7. KYC Service

## Purpose

Handles customer identity verification.

## Responsibilities

* Start KYC verification.
* Submit verification requests to providers.
* Process verification responses.
* Store verification status.
* Store provider references.
* Handle verification failures.
* Trigger account activation after successful verification.

## Supported Verification

The current product requires:

* BVN verification.
* NIN verification.
* Liveness verification.

Potential providers identified in the product brief include Smile Identity and Dojah.

## Provider Abstraction

```text
KYC Service
     │
     ├── Provider Adapter
     │      ├── Provider A
     │      └── Provider B
     │
     └── KYC Records
```

The rest of the application should communicate with the KYC service rather than directly with an individual provider.

---

# 8. Risk Profiling

## Purpose

Determines the user's basic investment risk profile.

## Supported Profiles

The current system defines:

* Conservative.
* Moderate.
* Aggressive.

The risk profile can be used by the AI recommendation layer to personalize investment suggestions.

---

# 9. Wallet Service

## Purpose

Manages customer financial wallets and balances.

## Wallet Types

The current data model supports:

* Savings wallet.
* Trading wallet.

## Responsibilities

* Create wallets.
* Retrieve balances.
* Update balances through controlled financial operations.
* Associate wallets with users.
* Track wallet currency.
* Coordinate with transactions and ledger entries.

Financial balances should not be changed directly by the AI or WhatsApp layer.

---

# 10. Ledger & Transaction Service

## Purpose

Provides the financial record of money movement within the platform.

## Responsibilities

* Create transactions.
* Track transaction states.
* Create ledger entries.
* Record debits and credits.
* Maintain transaction references.
* Prevent duplicate financial operations.
* Support reconciliation.

## Transaction Types

The current model supports:

* Deposit.
* Withdrawal.
* Buy trade.
* Sell trade.
* Savings lock.
* Savings unlock.
* Interest accrual.
* Fee.
* Transfer.

## Transaction States

Transactions may move through:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

or:

```text
PENDING
   ↓
FAILED
```

A completed transaction may also be reversed where required.

---

# 11. Savings Service

## Purpose

Manages customer savings goals.

## Responsibilities

* Create savings goals.
* Update savings goals.
* Track target amounts.
* Track target dates.
* Calculate savings projections.
* Support flexible savings.
* Support locked savings.
* Process savings lock/unlock operations.
* Track interest accrual.
* Trigger savings notifications.

The product brief describes savings as a conversational goal-based experience.

## Example

```text
"I want to save ₦200,000 for December."

        ↓

Savings Service

        ↓

Goal:
Target = ₦200,000
Date = December
Type = Selected by user

        ↓

Projection

        ↓

User Confirmation

        ↓

Savings Goal Created
```

---

# 12. Trading Service

## Purpose

Handles the complete lifecycle of investment orders.

## Responsibilities

* Interpret structured trade requests.
* Validate instruments.
* Validate quantities.
* Obtain market prices.
* Calculate trade value.
* Calculate applicable fees.
* Check wallet balance.
* Request user confirmation.
* Submit orders to the broker.
* Track order status.
* Update holdings.
* Coordinate settlement.
* Notify users.

## Supported Trading

The initial product focuses on NGX-listed equities.

## Trade Flow

```text
Trade Request
     ↓
Validate
     ↓
Get Market Price
     ↓
Calculate Total Cost
     ↓
Check Wallet
     ↓
User Confirmation
     ↓
Submit to Broker
     ↓
Track Order
     ↓
Settlement
     ↓
Update Portfolio
```

---

# 13. Portfolio Service

## Purpose

Maintains the user's investment positions.

## Responsibilities

* Track holdings.
* Track quantities.
* Track average cost.
* Associate holdings with instruments.
* Update holdings following settlement.
* Provide portfolio information.
* Support portfolio insights.

The current schema contains holdings linked to users and instruments.

---

# 14. Market Data Service

## Purpose

Provides current and relevant market information to PenniWise services.

## Responsibilities

* Retrieve instrument information.
* Retrieve current prices.
* Store latest price information.
* Track price timestamps.
* Provide market information to trading.
* Provide market information to AI recommendations.
* Support price alerts.

The current `Instrument` model stores ticker, name, exchange, last price, and price timestamp.

---

# 15. Price Alert Service

## Purpose

Allows users to receive notifications when an instrument reaches a configured price.

## Responsibilities

* Create price alerts.
* Validate target prices.
* Monitor relevant prices.
* Trigger alerts.
* Mark alerts as triggered.
* Prevent unnecessary duplicate notifications.

The current data model supports target price, direction, active state, and trigger information.

## Example

```text
User:
"Alert me when GTCO reaches ₦100."

        ↓

Price Alert Service

        ↓

Target = ₦100
Direction = ABOVE

        ↓

Market Price Monitoring

        ↓

Condition Met

        ↓

Notification Service

        ↓

WhatsApp
```

---

# 16. Notification Service

## Purpose

Handles system-generated messages to users.

## Notification Types

The current system supports concepts such as:

* Trade settlement.
* Price alerts.
* Savings nudges.
* Goal completion.
* System notifications.

## Responsibilities

* Create notifications.
* Determine delivery channel.
* Send notifications.
* Track delivery status.
* Handle failures.
* Retry where appropriate.
* Store provider references.

WhatsApp is expected to be the primary notification channel during the initial product stage.

---

# 17. Human Escalation

## Purpose

Allows conversations to move from AI handling to human support when necessary.

## Responsibilities

* Detect requests requiring human intervention.
* Create escalation records.
* Assign conversations to support staff.
* Notify support agents.
* Transfer conversation context.
* Return the conversation to normal handling when resolved.

The product brief targets human escalation within 60 seconds during business hours.

---

# 18. Banking Integration

## Purpose

Connects PenniWise with the regulated MFB infrastructure responsible for savings and deposit-related functionality.

## Responsibilities

* Create/associate savings accounts or wallets.
* Process deposits.
* Process withdrawals.
* Support transfers.
* Retrieve relevant account information.
* Handle provider responses.
* Reconcile external transactions.

The product brief identifies MFB partners as the infrastructure layer for deposit holding and NIP transfers.

---

# 19. Brokerage Integration

## Purpose

Connects PenniWise to regulated brokerage infrastructure.

## Responsibilities

* Facilitate CSCS account creation.
* Submit buy orders.
* Submit sell orders.
* Retrieve order status.
* Retrieve settlement information.
* Handle broker errors.
* Store external references.

The product brief identifies brokerage infrastructure as responsible for NGX access, CSCS account opening, and order execution.

---

# 20. External Integration Layer

## Purpose

Provides a consistent internal interface for third-party services.

Instead of allowing different application modules to directly communicate with third-party APIs, integrations should be isolated.

```text
Application Service
       │
       ▼
Integration Interface
       │
       ▼
Provider Adapter
       │
       ▼
External API
```

## Expected Integrations

* WhatsApp.
* KYC provider.
* MFB/banking provider.
* Brokerage provider.
* Market data provider.
* AI provider.

This makes it possible to change providers without rewriting the core application.

---

# 21. PostgreSQL Database

## Purpose

Primary persistent data store.

## Stores

* Users.
* Admin users.
* KYC records.
* Wallets.
* Transactions.
* Ledger entries.
* Savings goals.
* Instruments.
* Holdings.
* Orders.
* Notifications.
* Price alerts.
* Audit logs.

The Prisma schema provides the current relational data model for these components.

---

# 22. Redis

## Purpose

Provides fast temporary data and infrastructure support.

Potential responsibilities include:

* Caching.
* Rate limiting.
* Temporary conversation state.
* Background jobs.
* Queues.
* Short-lived locks.

Redis should not be used as the authoritative financial database.

Permanent financial records must remain in PostgreSQL.

---

# 23. Admin & Operations

## Purpose

Provides internal tools for PenniWise staff.

## Responsibilities

* Customer support.
* KYC monitoring.
* Transaction monitoring.
* Trading monitoring.
* User management.
* Operational intervention.
* System monitoring.
* Audit review.

Administrative users should have role-based permissions.

---

# 24. Audit Logging

## Purpose

Maintains a traceable record of important system actions.

## Audit Events

Examples include:

* User changes.
* Administrative actions.
* KYC actions.
* Financial operations.
* Order actions.
* Permission changes.
* System-level actions.

The current schema supports actor type, action, resource, previous state, new state, IP address, user agent, and timestamp.

---

# 25. Background Job System

Certain operations should not block the main request-response cycle.

Potential background jobs include:

* Sending notifications.
* Processing price alerts.
* Market data updates.
* Reconciliation.
* Retry operations.
* Scheduled savings reminders.
* Portfolio updates.

Redis can support the infrastructure required for background processing.

The exact queue technology and worker architecture should be documented when implemented.

---

# 26. Logging & Monitoring

The application should provide centralized application logging.

The current backend uses Winston for logging.

Logging should support:

* Application errors.
* External API failures.
* Authentication failures.
* Transaction failures.
* Database errors.
* Background job failures.
* Important operational events.

Sensitive information such as passwords, JWT secrets, API keys, raw KYC values, and other credentials must not be written to logs.

---

# 27. Component Dependency Overview

```text
                         WhatsApp
                            │
                            ▼
                    Conversation Engine
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
             AI                     Core Backend
                                        │
       ┌────────────┬──────────┬────────┼───────────┐
       ▼            ▼          ▼        ▼           ▼
      KYC        Savings     Wallet   Trading    Portfolio
       │            │          │        │
       ▼            ▼          ▼        ▼           │
    KYC API       MFB       Ledger   Brokerage      │
                                      │              │
                                      ▼              ▼
                                  Market Data     Database
                                                     │
                                                     ▼
                                                  Redis
                                                     │
                                                     ▼
                                              Notifications
                                                     │
                                                     ▼
                                                  WhatsApp
```

---

# 28. Component Ownership Boundaries

Each component should have a clearly defined responsibility.

| Component             | Primary Responsibility                  |
| --------------------- | --------------------------------------- |
| WhatsApp Interface    | Customer communication                  |
| Conversation Engine   | Conversation state and routing          |
| AI Layer              | Language understanding and intelligence |
| Auth                  | Identity and access                     |
| User Service          | Customer accounts                       |
| KYC                   | Identity verification                   |
| Risk Profiling        | Investment risk classification          |
| Wallet                | Financial account balances              |
| Ledger                | Financial records                       |
| Savings               | Savings goals and operations            |
| Trading               | Order lifecycle                         |
| Portfolio             | Investment holdings                     |
| Market Data           | Market information                      |
| Price Alerts          | Price-triggered events                  |
| Notifications         | Outbound system communication           |
| Human Escalation      | Human support handoff                   |
| Banking Integration   | MFB connectivity                        |
| Brokerage Integration | Broker connectivity                     |
| Database              | Persistent data                         |
| Redis                 | Temporary/fast infrastructure data      |
| Admin                 | Internal operations                     |
| Audit                 | Traceability                            |
| Background Jobs       | Asynchronous processing                 |

---

# 29. Component Design Principles

All PenniWise components should follow these principles:

### Single responsibility

Each component should have a clearly defined purpose.

### Loose coupling

Components should communicate through defined interfaces rather than relying on internal implementation details.

### Financial safety

Financial components must validate all operations independently of AI-generated requests.

### External provider isolation

Third-party integrations should be isolated behind adapters.

### Auditability

Important operations must leave an auditable trail.

### Idempotency

Operations that can create financial side effects should be protected against duplicate execution.

### Security by default

Sensitive operations should require authentication, authorization, validation, and appropriate logging.

### Replaceability

External providers should be replaceable without redesigning the entire system.

---

# 30. Component Evolution

The initial PenniWise implementation does not need to deploy every component as an independent microservice.

Components may initially exist as modular parts of the same backend application.

For example:

```text
server/
├── auth/
├── users/
├── kyc/
├── conversations/
├── ai/
├── wallets/
├── ledger/
├── savings/
├── trading/
├── portfolio/
├── notifications/
├── integrations/
├── admin/
└── audit/
```

As PenniWise grows, components that require independent scaling or deployment can be separated.

The goal is to maintain **modularity first, distributed infrastructure only where necessary**.

