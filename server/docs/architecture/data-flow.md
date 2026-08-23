PenniWise — Data Flow
1. Overview

This document describes how data moves through PenniWise from the moment a user sends a message through WhatsApp to the point where the request is processed, stored, executed, and communicated back to the user.

PenniWise is designed as a WhatsApp-first financial platform. WhatsApp acts as the primary user interface, while the PenniWise backend coordinates conversation processing, AI, business logic, databases, and external financial providers.

The central data-flow principle is:

User input → Conversation → AI interpretation → Backend validation → Business service → External provider/database → Result → WhatsApp response

The AI layer interprets user intent, but the backend remains responsible for validating and executing financial operations.

2. High-Level Data Flow
                         USER
                          │
                          │ WhatsApp Message
                          ▼
                 ┌─────────────────┐
                 │ WhatsApp API    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Conversation    │
                 │ Engine          │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ AI Layer        │
                 │                 │
                 │ Intent + Data   │
                 │ Extraction      │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Core Backend    │
                 │                 │
                 │ Validation      │
                 │ Authorization   │
                 │ Business Rules  │
                 └────────┬────────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
        KYC            Savings          Trading
          │               │                │
          ▼               ▼                ▼
      KYC API           MFB API        Broker API
          │               │                │
          └───────────────┼────────────────┘
                          │
                          ▼
                    PostgreSQL
                          │
                          ▼
                       Redis
                          │
                          ▼
                 Notification Service
                          │
                          ▼
                    WhatsApp API
                          │
                          ▼
                         USER
3. Data Flow Principles

The system should follow several important principles.

3.1 WhatsApp Is the Interface, Not the Database

WhatsApp should not be treated as the source of truth for user information or financial state.

The backend and database are responsible for maintaining authoritative application state.

3.2 AI Is Not the Source of Truth

AI can interpret:

"I want to buy 100 GTCO shares."

But AI should not directly execute the order.

Instead:

AI
 ↓
Structured intent
 ↓
Trading Service
 ↓
Validation
 ↓
Confirmation
 ↓
Execution
3.3 External Providers Are Integration Boundaries

Banking, brokerage, KYC, WhatsApp, and market-data providers should communicate with PenniWise through dedicated integration layers.

PenniWise Service
       ↓
Integration Adapter
       ↓
External Provider
3.4 PostgreSQL Is the Persistent Application Store

Permanent application and financial records should be stored in PostgreSQL.

Redis should be used for temporary or high-speed infrastructure needs rather than permanent financial records.

4. User Message Data Flow

When a user sends a message, the flow begins with WhatsApp.

User
 │
 │ "I want to save ₦50,000 every month"
 ▼
WhatsApp
 │
 ▼
WhatsApp Webhook
 │
 ▼
PenniWise Backend

The webhook should validate that the request originated from the expected WhatsApp integration before processing it.

5. Message Processing Flow

Once the backend receives the message:

Incoming Message
       │
       ▼
Webhook Handler
       │
       ▼
Validate Request
       │
       ▼
Identify User
       │
       ▼
Load Conversation Context
       │
       ▼
Send Relevant Data to AI
       │
       ▼
AI Intent Detection
       │
       ▼
Structured Intent

For example:

{
  "intent": "create_savings_goal",
  "amount": 50000,
  "frequency": "monthly"
}

The exact internal AI response structure may evolve during implementation.

6. User Identification Flow

Every incoming WhatsApp interaction must be associated with the correct PenniWise user.

WhatsApp Message
       │
       ▼
WhatsApp User ID / Phone
       │
       ▼
User Lookup
       │
       ├── User exists
       │       │
       │       ▼
       │   Load account
       │
       └── User does not exist
               │
               ▼
          Start onboarding

The current data model includes user phone number and WhatsApp-related identification fields.

7. Conversation State Flow

PenniWise conversations can span multiple messages.

For example:

User:
"I want to invest."


       ↓


PenniWise:
"What would you like to invest in?"


       ↓


User:
"GTCO."


       ↓


PenniWise:
"How many shares?"


       ↓


User:
"100."


       ↓


PenniWise:
"Your estimated total is ₦XX,XXX.
Confirm purchase?"


       ↓


User:
"Yes."

The system therefore needs to maintain conversation context.

Message
   ↓
Conversation State
   ↓
Context
   ↓
AI
   ↓
Next Action
   ↓
Updated Conversation State

Temporary conversation information may be stored or cached using Redis where appropriate, while important persistent state should be stored in PostgreSQL.

8. AI Data Flow

The AI layer receives only the information required to understand and respond to the user's request.

A conceptual flow is:

User Message
     │
     ▼
Conversation Context
     │
     ├── User state
     ├── Current conversation
     ├── Relevant account information
     └── Relevant product information
     │
     ▼
AI Model
     │
     ▼
Intent + Extracted Data

The AI should not receive unnecessary sensitive information.

9. AI Response Flow

The AI may produce:

A conversational response.
An intent.
Extracted parameters.
A request for additional information.
A recommendation.
A request for confirmation.

Example:

User:
"Buy 50 GTCO."


AI:
Intent = BUY_STOCK
Ticker = GTCO
Quantity = 50

The backend then validates these values.

10. Financial Action Validation

All financial actions pass through backend validation.

AI Intent
   │
   ▼
Business Service
   │
   ├── Is user authenticated?
   ├── Is account active?
   ├── Has KYC been completed?
   ├── Is user authorized?
   ├── Is instrument valid?
   ├── Is quantity valid?
   ├── Is wallet funded?
   └── Is transaction permitted?
   │
   ▼
Valid Request

If validation fails, the transaction should not be executed.

11. KYC Data Flow

The onboarding and KYC process is one of the major data flows in PenniWise.

The product brief describes BVN, NIN, and liveness verification as part of onboarding.

User
 │
 ▼
WhatsApp
 │
 ▼
Conversation Engine
 │
 ▼
KYC Service
 │
 ├── BVN
 ├── NIN
 └── Liveness
 │
 ▼
KYC Provider
 │
 ▼
Verification Result
 │
 ▼
KYC Service
 │
 ▼
PostgreSQL
 │
 ▼
User Account Status
 │
 ▼
WhatsApp

Sensitive KYC information should be handled carefully and should not be unnecessarily exposed to the AI layer or logs.

12. Risk Profiling Data Flow

After or during onboarding, the user may complete risk profiling.

User
 │
 ▼
Risk Questions
 │
 ▼
Conversation Engine
 │
 ▼
Risk Profiling Service
 │
 ▼
Risk Calculation
 │
 ▼
Risk Profile
 │
 ├── Conservative
 ├── Moderate
 └── Aggressive
 │
 ▼
PostgreSQL

The risk profile can later be used by the recommendation system.

The current schema defines these three risk-profile categories.

13. Savings Data Flow

A savings request can begin entirely through natural language.

Example:

"I want to save ₦100,000 before December."

The flow is:

User
 │
 ▼
WhatsApp
 │
 ▼
Conversation Engine
 │
 ▼
AI
 │
 ▼
Structured Savings Request
 │
 ▼
Savings Service
 │
 ├── Target amount
 ├── Target date
 ├── Savings type
 └── Projection
 │
 ▼
User Confirmation
 │
 ▼
Savings Goal
 │
 ▼
PostgreSQL
 │
 ▼
MFB Integration
14. Savings Contribution Flow

When money is added to a savings goal:

User
 │
 ▼
Deposit Request
 │
 ▼
Banking/MFB Integration
 │
 ▼
Deposit Confirmation
 │
 ▼
PenniWise Backend
 │
 ├── Transaction
 ├── Ledger Entry
 └── Savings Goal Update
 │
 ▼
PostgreSQL
 │
 ▼
Notification
 │
 ▼
WhatsApp

The transaction and relevant financial records should be created consistently.

15. Trading Data Flow

The trading flow is one of the most important data flows in the system.

User
 │
 │ "Buy 100 GTCO"
 ▼
WhatsApp
 │
 ▼
Conversation Engine
 │
 ▼
AI
 │
 ▼
Trading Intent
 │
 ▼
Trading Service

The Trading Service then performs validation.

Trading Service
 │
 ├── Validate instrument
 ├── Validate quantity
 ├── Fetch current price
 ├── Calculate order value
 ├── Calculate fees
 ├── Check wallet
 └── Check trading eligibility
 │
 ▼
Trade Preview
 │
 ▼
WhatsApp
 │
 ▼
User Confirmation

The product brief explicitly requires mandatory confirmation before order execution.

16. Trade Execution Data Flow

After confirmation:

User Confirmation
       │
       ▼
Trading Service
       │
       ▼
Create Order
       │
       ▼
Brokerage Adapter
       │
       ▼
Broker API
       │
       ▼
Broker
       │
       ▼
Order Reference
       │
       ▼
PenniWise
       │
       ├── Store order
       ├── Store external reference
       └── Update order status

The order may initially be:

PENDING

and later transition through processing and completion/failure states.

17. Trade Settlement Flow

Order submission and settlement should be treated as separate events.

Order Submitted
       │
       ▼
Broker Processing
       │
       ▼
Order Filled
       │
       ▼
Settlement
       │
       ▼
PenniWise
       │
       ├── Update Order
       ├── Update Holding
       ├── Update Wallet
       ├── Create Ledger Entries
       └── Create Audit Record
       │
       ▼
Notification
       │
       ▼
WhatsApp

This distinction is important because submitting an order does not necessarily mean that the trade has already settled.

18. Portfolio Data Flow

Portfolio information is derived from investment activity and market information.

Executed / Settled Trade
          │
          ▼
      Holding
          │
          ├── Instrument
          ├── Quantity
          └── Average Cost
          │
          ▼
     Market Price
          │
          ▼
   Portfolio Valuation
          │
          ▼
    Portfolio Service
          │
          ▼
        User

The current schema represents holdings separately from instruments and orders.

19. Market Data Flow

Market information can enter PenniWise from an external market-data provider.

Market Data Provider
        │
        ▼
Market Data Adapter
        │
        ▼
Market Data Service
        │
        ├── Validate data
        ├── Normalize data
        └── Store latest information
        │
        ▼
PostgreSQL / Cache

The information can then be consumed by:

Trading.
Portfolio.
AI.
Price alerts.
Notifications.
20. Price Alert Data Flow

Example:

"Tell me when GTCO reaches ₦100."

User
 │
 ▼
WhatsApp
 │
 ▼
AI
 │
 ▼
Price Alert Intent
 │
 ▼
Price Alert Service
 │
 ▼
PostgreSQL
 │
 ▼
Market Data Updates
 │
 ▼
Price Alert Evaluation
 │
 ▼
Condition Met
 │
 ▼
Notification Service
 │
 ▼
WhatsApp

The current data model supports price targets, direction, active status, and trigger information.

21. AI Recommendation Data Flow

AI recommendations require relevant financial context.

User
 │
 ▼
Recommendation Request
 │
 ▼
AI Recommendation Service
 │
 ├── User Risk Profile
 ├── Portfolio
 ├── Holdings
 ├── Market Data
 └── Relevant Product Data
 │
 ▼
AI Model
 │
 ▼
Recommendation
 │
 ▼
Backend Validation / Policy Checks
 │
 ▼
WhatsApp

The product brief describes recommendations as being based on factors such as risk profile, portfolio composition, and current market data.

Recommendations should be presented as suggestions rather than financial advice.

22. Banking Data Flow

Banking operations pass through the banking integration layer.

PenniWise Service
       │
       ▼
Banking Adapter
       │
       ▼
MFB API
       │
       ▼
MFB
       │
       ▼
Response / Transaction Reference
       │
       ▼
PenniWise
       │
       ├── Transaction
       ├── Ledger
       ├── Wallet
       └── Audit

The MFB is expected to provide deposit-holding and payment infrastructure.

23. Brokerage Data Flow
Trading Service
       │
       ▼
Brokerage Adapter
       │
       ▼
Broker API
       │
       ▼
Broker
       │
       ├── Order
       ├── Status
       └── Settlement
       │
       ▼
PenniWise
       │
       ├── Order
       ├── Holding
       ├── Transaction
       └── Notification

The brokerage layer should hide provider-specific API details from the rest of the application.

24. Notification Data Flow

Notifications may originate from several services.

Trading ───────┐
Savings ───────┤
Price Alerts ──┤
System Events ─┤
               ▼
       Notification Service
               │
               ▼
        WhatsApp Adapter
               │
               ▼
          WhatsApp API
               │
               ▼
             User

The notification service should track delivery status where supported.

25. Human Escalation Data Flow

When AI or the application determines that human intervention is necessary:

User
 │
 ▼
Conversation
 │
 ▼
AI / Rules
 │
 ▼
Escalation Required
 │
 ▼
Create Escalation
 │
 ▼
Support Queue
 │
 ▼
Human Agent
 │
 ▼
Response
 │
 ▼
WhatsApp
 │
 ▼
User

The system should preserve relevant conversation context so that the user does not have to repeatedly explain the issue.

26. Database Data Flow

Application services communicate with PostgreSQL through the backend data-access layer.

Application Service
       │
       ▼
Prisma Client
       │
       ▼
PostgreSQL
       │
       ▼
Neon

The database contains persistent application and financial information.

Examples include:

User
Wallet
Transaction
LedgerEntry
SavingsGoal
Instrument
Holding
Order
Notification
PriceAlert
AuditLog
27. Redis Data Flow

Redis should handle information where speed or temporary state is important.

Application
    │
    ├── Cache
    ├── Temporary State
    ├── Rate Limits
    └── Background Jobs
           │
           ▼
         Redis

Redis should not replace PostgreSQL as the source of truth for:

Account balances.
Transactions.
Ledger entries.
Orders.
Holdings.
KYC records.
28. Authentication Data Flow
Client / Admin
      │
      ▼
Authentication Endpoint
      │
      ▼
Validate Credentials
      │
      ▼
Generate JWT
      │
      ▼
Client
      │
      ▼
Protected Request
      │
      ▼
JWT Validation
      │
      ▼
Authorization
      │
      ▼
Requested Resource

JWT secrets must remain in environment variables and must never be committed to the repository.

29. Admin Data Flow

Administrative operations follow a separate authorization path.

Admin
 │
 ▼
Admin Authentication
 │
 ▼
JWT
 │
 ▼
Admin API
 │
 ▼
Role Check
 │
 ├── SUPPORT
 ├── ADMIN
 └── SUPER_ADMIN
 │
 ▼
Administrative Operation
 │
 ├── Database
 ├── External Provider
 └── Audit Log

Administrative actions should be auditable.

30. Audit Data Flow

Important operations should generate audit records.

Important Action
      │
      ▼
Business Service
      │
      ├───────────────┐
      ▼               ▼
Operation         Audit Service
                      │
                      ▼
                  Audit Log
                      │
                      ▼
                  PostgreSQL

Audit records should capture sufficient information to determine:

Who performed the action.
What happened.
Which resource was affected.
When it happened.
Relevant previous and new state.
Request metadata where appropriate.

The current audit model includes actor, action, resource, previous state, new state, IP address, user agent, and timestamp.

31. Error Data Flow

Errors should not simply disappear after an external request fails.

Example:

External Provider
       │
       ▼
Provider Error
       │
       ▼
Integration Layer
       │
       ├── Log Error
       ├── Determine Retryability
       └── Normalize Error
       │
       ▼
Business Service
       │
       ▼
User-Friendly Response
       │
       ▼
WhatsApp

Internal error details should not be exposed directly to customers.

32. Retry Data Flow

Some external operations may fail temporarily.

Request
  │
  ▼
External API
  │
  ├── Success ──────────────► Continue
  │
  └── Temporary Failure
            │
            ▼
       Retry Strategy
            │
            ├── Retry
            ├── Retry
            └── Final Failure
                    │
                    ▼
              Error Handling

Financial operations must be designed carefully so that retries cannot accidentally execute the same operation twice.

Idempotency keys should be used where appropriate.

The current transaction model includes an idempotencyKey field for this purpose.

33. Complete Example — "I Want to Buy 100 GTCO"

The complete data flow looks like this:

1. User
   ├── Validate KYC
   ├── Validate Instrument
   ├── Fetch Market Price
   ├── Calculate Cost
   ├── Calculate Fees
   └── Check Wallet
   │
   ▼


7. Trade Preview
   │
   ▼


8. WhatsApp
   │
   │ "Buy 100 GTCO for approximately ₦X?
   │    Confirm?"
   ▼


9. User
   │
   │ "Confirm"
   ▼


10. Trading Service
    │
    ▼


11. Create Order
    │
    ▼


12. Brokerage Adapter
    │
    ▼


13. Broker
    │
    ▼


14. Order Response
    │
    ├── Order Reference
    └── Status
    │
    ▼


15. PostgreSQL
    │
    ├── Order
    ├── Transaction
    ├── Ledger
    └── Audit Log
    │
    ▼


16. Settlement
    │
    ▼


17. Portfolio Service
    │
    ▼


18. Holding Updated
    │
    ▼


19. Notification Service
    │
    ▼


20. WhatsApp
    │
    ▼


21. User receives update
34. Complete Example — "Help Me Save ₦100,000"
User
 │
 ▼
WhatsApp
 │
 ▼
Conversation Engine
 │
 ▼
AI
 │
 └── Intent:
     CREATE_SAVINGS_GOAL
     Target: ₦100,000
 │
 ▼
Savings Service
 │
 ├── Ask target date
 ├── Ask savings type if required
 └── Calculate projection
 │
 ▼
User Confirmation
 │
 ▼
Savings Goal
 │
 ▼
PostgreSQL
 │
 ▼
MFB Integration
 │
 ▼
Savings Account / Deposit
 │
 ▼
Transaction + Ledger
 │
 ▼
Notification
 │
 ▼
WhatsApp
35. Complete Example — User Onboarding
User
 │
 │ "Hi"
 ▼
WhatsApp
 │
 ▼
Conversation Engine
 │
 ▼
User Lookup
 │
 └── User not found
       │
       ▼
   Create onboarding session
       │
       ▼
   Request information
       │
       ▼
   BVN
       │
       ▼
   NIN
       │
       ▼
   Liveness
       │
       ▼
   KYC Provider
       │
       ▼
   Verification Result
       │
       ▼
   Risk Profiling
       │
       ▼
   Account Activation
       │
       ▼
   PostgreSQL
       │
       ▼
   WhatsApp
36. Data Ownership

Each type of information should have a clear owner.

Data	Primary Owner
User profile	User Service
Authentication	Auth Service
KYC status	KYC Service
Risk profile	Risk Profiling Service
Wallet balance	Wallet/Ledger
Transaction	Transaction Service
Ledger entries	Ledger Service
Savings goals	Savings Service
Orders	Trading Service
Holdings	Portfolio Service
Market prices	Market Data Service
Price alerts	Price Alert Service
Notifications	Notification Service
Audit records	Audit Service
Temporary cache	Redis
Persistent records	PostgreSQL
37. Data Flow Security

Sensitive data should follow the principle of least privilege.

Services should only access the data required to perform their responsibilities.

Examples:

AI
 └── Should receive relevant context,
     not unrestricted database access.


Trading
 └── Should access financial information
     required for trade validation.


KYC
 └── Should handle identity verification data.


Admin
 └── Should access customer data according
     to the administrator's role.

No external provider should receive more customer information than is required for the specific operation.

38. Data Flow Rule for Financial Operations

All financial operations should follow:

REQUEST
   ↓
AUTHENTICATE
   ↓
AUTHORIZE
   ↓
VALIDATE
   ↓
CONFIRM
   ↓
EXECUTE
   ↓
RECORD
   ↓
RECONCILE
   ↓
NOTIFY

This pattern should be applied consistently to:

Deposits.
Withdrawals.
Savings operations.
Buy orders.
Sell orders.
Transfers.
Fees.
Interest-related operations.
39. Data Flow and Eventual Consistency

Not every operation will complete immediately.

For example, a brokerage order may remain pending while the broker processes it.

Therefore:

Request
   ↓
Accepted
   ↓
Processing
   ↓
Completed / Failed

The system should distinguish between:

Request received.
Request accepted.
Processing.
Completed.
Failed.

Users should receive messages that accurately represent the current state rather than assuming that every submitted request has immediately completed.

40. Core Data Flow Principle

The most important rule for PenniWise's data flow is:

The user communicates through WhatsApp, AI interprets the request, backend services validate it, external providers execute regulated operations, PostgreSQL records persistent state, and the notification system communicates the result back to the user.
