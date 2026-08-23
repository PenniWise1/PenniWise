# PenniWise — Brokerage Documentation

## 1. Overview

The brokerage component is responsible for connecting PenniWise users to supported investment and brokerage services.

It provides controlled access to investment-related functionality while ensuring that authentication, authorization, validation, risk controls, confirmation, order execution, transaction tracking, and security remain under the control of PenniWise.

The brokerage integration may support capabilities such as:

- Viewing investment portfolios.
- Viewing holdings.
- Viewing available investment balances.
- Viewing market information.
- Searching supported investment instruments.
- Placing buy orders.
- Placing sell orders.
- Checking order status.
- Tracking investment transactions.
- Receiving brokerage events.
- Reconciling order and transaction states.

The exact capabilities depend on the brokerage provider(s) selected for PenniWise.

---

## 2. Architectural Principle

The AI must never communicate directly with the brokerage provider.

The preferred architecture is:

```text
User
  │
  ▼
Conversation Engine
  │
  ▼
AI
  │
  ▼
Brokerage Tool
  │
  ▼
Brokerage Service
  │
  ▼
Brokerage Provider
  │
  ▼
Investment Account

The AI can understand the user's investment request, but the Brokerage Service determines whether the operation is valid, authorized, permitted, and safe to execute.

3. Brokerage Responsibilities

The brokerage module is responsible for:

Managing supported brokerage integrations.
Managing linked investment accounts.
Retrieving portfolio information.
Retrieving holdings.
Retrieving investment balances.
Retrieving supported market data.
Searching supported instruments.
Creating investment orders.
Tracking order status.
Processing brokerage webhooks.
Handling provider failures.
Preventing duplicate orders.
Maintaining provider references.
Reconciling orders and transactions.
Providing verified investment information to the Conversation Engine.
4. What the Brokerage Module Should Not Do

The brokerage module should not:

Give the AI direct access to brokerage credentials.
Trust AI-generated order parameters without validation.
Allow arbitrary investment orders.
Bypass user authorization.
Execute high-risk investment actions without required confirmation.
Allow the AI to override brokerage restrictions.
Claim an order was executed without provider confirmation.
Store unnecessary brokerage credentials.
Treat a network timeout as a successful order.
Treat a WhatsApp delivery failure as an investment transaction failure.
5. Brokerage Architecture
                         USER
                           │
                           ▼
                  Conversation Engine
                           │
                           ▼
                          AI
                           │
                           ▼
                    Brokerage Tool
                           │
                           ▼
                  Brokerage Authorization
                           │
                           ▼
                 Brokerage Service Layer
                           │
                    ┌──────┴──────┐
                    ▼             ▼
               PostgreSQL    Brokerage Provider
                                  │
                                  ▼
                           Investment Account
6. Provider Abstraction

The brokerage integration should isolate provider-specific implementation.

Conceptually:

PenniWise Brokerage Service
          │
          ▼
  Brokerage Provider Interface
          │
      ┌───┴────┐
      ▼        ▼
 Provider A  Provider B

This allows PenniWise to add or replace brokerage providers without changing the Conversation Engine.

7. Provider Selection

The final brokerage provider should be selected according to:

Supported countries.
Supported exchanges.
Available financial instruments.
API capabilities.
Regulatory requirements.
Account-opening requirements.
Order types supported.
Sandbox availability.
Webhook support.
Security requirements.

Provider-specific implementation should remain isolated from the rest of the application.

8. Investment Account

A PenniWise user may have one or more linked investment accounts depending on the product requirements.

Conceptually:

User
 │
 ├── Investment Account A
 └── Investment Account B

Each investment account must belong to the correct PenniWise user.

9. Investment Account Ownership

Every brokerage resource must be associated with the authenticated PenniWise user.

Authenticated User
       │
       ▼
Investment Account
       │
       ▼
Brokerage Provider Account

The application must verify ownership before returning or modifying investment information.

10. Investment Account Data

Potential database fields include:

id
userId
provider
providerAccountId
accountName
currency
status
createdAt
updatedAt

The exact schema should follow schema.md.

Sensitive provider credentials should not be stored as ordinary user-facing data.

11. Brokerage Authentication

The brokerage provider may require a secure account-linking or authentication flow.

Conceptually:

User
 │
 ▼
Connect Investment Account
 │
 ▼
Brokerage Provider
 │
 ▼
Secure Authentication
 │
 ▼
Provider Authorization
 │
 ▼
PenniWise
 │
 ▼
Linked Investment Account

PenniWise should use the provider's recommended secure authorization mechanism.

12. Credentials and Tokens

Brokerage credentials and tokens must never be passed to the AI.

Avoid exposing:

Brokerage password
Trading PIN
API secret
Access token
Refresh token
Private credentials

If tokens must be stored, they should be protected using an appropriate secure storage mechanism.

13. Portfolio

The brokerage service may provide a portfolio overview.

Potential information includes:

Total portfolio value
Available cash
Invested value
Daily change
Overall change

The exact fields depend on the provider and PenniWise product requirements.

14. Portfolio Data Flow
User
 │
 ▼
AI
 │
 ▼
getPortfolio
 │
 ▼
Brokerage Service
 │
 ▼
Brokerage Provider
 │
 ▼
Verified Portfolio
 │
 ▼
AI
 │
 ▼
User

The AI should only present information returned by the brokerage service.

15. Holdings

A portfolio may contain multiple investment holdings.

Example:

Portfolio
 ├── Asset A
 ├── Asset B
 ├── Asset C
 └── Cash

Each holding may include:

Instrument
Quantity
Average Price
Current Price
Market Value
Unrealized Gain/Loss
Currency

The exact fields depend on the provider.

16. Holding Ownership

Holdings must always be scoped to the authenticated user's investment account.

The system must prevent:

User A
   │
   X
User B Holdings

from being returned to User A.

17. Market Data

If PenniWise provides current market information, it should retrieve it from an approved market-data or brokerage provider.

The AI must not invent current prices.

Example:

User:
What's the current price of GTCO?

        │
        ▼

Market Data Tool

        │
        ▼

Verified Provider Data

        │
        ▼

AI Response
18. Market Data vs Brokerage Data

Market information and brokerage account information should be treated as separate concerns.

Market Data
 └── Current market information

Brokerage Data
 └── User's account
 └── Holdings
 └── Orders
 └── Transactions

The system should not assume that market data represents the user's actual execution price.

19. Investment Instrument

An instrument represents an investment that may be available for trading.

Examples may include:

Stocks
ETFs
Bonds
Funds
Other supported instruments

The exact supported instruments should be defined by the brokerage provider and PenniWise product scope.

20. Instrument Search

Users may ask:

Show me information about GTCO.

The system may use an approved instrument-search or market-data service.

The returned instrument should contain enough information to identify the correct asset.

Potential fields:

symbol
name
exchange
assetType
currency
status
21. Instrument Validation

Before placing an order, the application must verify that the instrument is supported and valid.

The AI must not be allowed to invent an instrument symbol.

Example:

AI
 │
 ▼
Instrument
 │
 ▼
Instrument Validation
 │
 ├── Valid → Continue
 │
 └── Invalid → Reject
22. Investment Order

An order represents a request to buy or sell an investment.

Potential order information includes:

Order ID
User ID
Investment Account
Instrument
Side
Quantity
Order Type
Limit Price
Currency
Status
Provider Reference
Created At
Updated At

The exact model should follow schema.md.

23. Buy and Sell Orders

Orders should distinguish between:

BUY
SELL

Example:

User:
Buy 10 shares of XYZ.

The application should convert this into a validated order request.

24. Order Validation

Before sending an order to the brokerage provider, PenniWise should validate:

User authorization.
Investment account ownership.
Instrument.
Buy/sell side.
Quantity.
Order type.
Price where applicable.
Currency.
Trading availability.
Account status.
Applicable limits.
Provider requirements.
25. Order Confirmation

Investment orders should require explicit confirmation when required by the product's risk model.

Example:

PenniWise:

You're about to place an order:

Action: BUY
Instrument: XYZ
Quantity: 10 shares
Estimated value: ₦50,000

Do you want to continue?

The exact information displayed should depend on the order type.

26. Confirmation Must Match the Order

The confirmation must be tied to the exact order parameters.

For example:

BUY
XYZ
10 shares

If the user changes the request to:

BUY
XYZ
20 shares

the previous confirmation should no longer be valid.

A new confirmation should be required.

27. Order Types

Depending on provider capabilities, PenniWise may support:

MARKET
LIMIT
STOP
STOP_LIMIT

The initial implementation should only support order types that are explicitly required and safely implemented.

28. Market Orders

A market order generally requests execution at available market prices.

The application should clearly communicate that the final execution price may differ from an estimated or displayed price.

The AI must not guarantee a specific execution price unless the provider explicitly guarantees one.

29. Limit Orders

A limit order contains a specified price condition.

Example:

Buy XYZ
Quantity: 10
Maximum price: ₦5,000

The application must validate:

Instrument.
Quantity.
Limit price.
Currency.
Account permissions.
Provider requirements.
30. Order Quantity

Quantity must be validated according to the instrument and provider.

The application must reject:

0
Negative quantity
Invalid decimal precision
Unsupported fractional quantity

where applicable.

31. Order Price

Where an order includes a price, the price must be validated.

The application must reject:

Negative price
Zero price where invalid
Invalid decimal precision
Unsupported currency
32. Buying Power

Before placing an order, the application should verify the relevant account has sufficient available funds where the provider requires such validation.

Conceptually:

Order Request
      │
      ▼
Check Available Funds
      │
 ┌────┴────┐
 ▼         ▼
Enough    Insufficient
 │            │
 ▼            ▼
Continue     Reject

The brokerage provider may also perform the final buying-power check.

33. Selling Holdings

Before placing a sell order, the system should verify that the user has sufficient available holdings where applicable.

Sell 100 shares
      │
      ▼
Check Available Quantity
      │
 ┌────┴────┐
 ▼         ▼
Enough    Insufficient
 │            │
 ▼            ▼
Continue     Reject
34. Order Lifecycle

A typical order lifecycle may be:

REQUESTED
    │
    ▼
VALIDATING
    │
    ▼
PENDING_CONFIRMATION
    │
    ▼
CONFIRMED
    │
    ▼
SUBMITTED
    │
    ▼
ACCEPTED
    │
    ▼
OPEN
    │
    ├──────► FILLED
    │
    ├──────► PARTIALLY_FILLED
    │
    ├──────► CANCELLED
    │
    └──────► REJECTED

The exact statuses should match the brokerage provider.

35. Order Status

The AI must always use the actual order status returned by the application.

It must not say:

Your order has been executed.

unless the provider confirms execution.

If the order is still open:

Your order is still open and waiting for execution.
36. Partial Fills

Some orders may execute partially.

Example:

Requested:
100 shares

Executed:
60 shares

Remaining:
40 shares

The application should represent partial execution accurately.

The AI should communicate the actual state.

37. Order Cancellation

If supported, users may request order cancellation.

The flow should be:

User
 │
 ▼
Cancel Order
 │
 ▼
Authorization
 │
 ▼
Check Order Status
 │
 ▼
Brokerage Service
 │
 ▼
Brokerage Provider
 │
 ▼
Cancellation Result

The application must not claim an order was cancelled unless the provider confirms it.

38. Duplicate Order Protection

Investment orders must be protected against duplicate execution.

Example:

User:
Buy 10 shares.

        │
        ▼
Order Request
        │
        ▼
Idempotency Key
        │
        ▼
Already Processed?
   │          │
  YES         NO
   │           │
Return       Submit
Existing     Order
Result

This is particularly important when requests time out or are retried.

39. Provider Timeout

A brokerage provider timeout does not necessarily mean the order failed.

Example:

PenniWise
    │
    ▼
Brokerage Provider
    │
    X
  Timeout

The order status should be checked before attempting another submission.

40. Unknown Order State

If PenniWise cannot determine whether an order was accepted:

UNKNOWN

should be treated differently from:

REJECTED

The system should reconcile the order with the brokerage provider.

41. Order References

Each order should have:

PenniWise Order ID
Provider Order ID

Example:

PenniWise:
PW-ORD-123456

Provider:
BRK-987654

These references are useful for:

Tracking.
Support.
Reconciliation.
Auditing.
User communication.
42. Brokerage Transactions

Completed investment activity may generate transaction records.

Examples:

BUY
SELL
DIVIDEND
FEE
DEPOSIT
WITHDRAWAL
TRANSFER

The exact transaction types depend on the provider.

43. Portfolio Updates

When an order is filled, portfolio holdings may change.

Conceptually:

Order Filled
     │
     ▼
Brokerage Provider
     │
     ▼
Updated Holdings
     │
     ▼
PenniWise
     │
     ▼
Database

The database should be updated using verified provider information.

44. Reconciliation

PenniWise should periodically or event-driven reconcile:

Orders
Holdings
Transactions
Balances

against the brokerage provider.

Example:

PenniWise
   │
   ▼
Internal Order
   │
   ▼
Provider Order
   │
   ▼
Compare
   │
 ┌─┴─┐
 ▼   ▼
Match Mismatch
       │
       ▼
 Reconciliation
45. Brokerage Webhooks

The brokerage provider may send events such as:

Order Accepted
Order Rejected
Order Filled
Order Partially Filled
Order Cancelled
Account Updated
Transaction Completed

The application should process these events through a secure webhook endpoint.

46. Webhook Architecture
Brokerage Provider
       │
       ▼
POST /webhooks/brokerage
       │
       ▼
Webhook Verification
       │
       ▼
Payload Validation
       │
       ▼
Event Processing
       │
       ▼
Order / Account Update

The exact endpoint should follow the project's API conventions.

47. Webhook Verification

Brokerage webhook requests must be verified using the provider's security mechanism.

Possible controls include:

Signatures.
Secret tokens.
Timestamp validation.
Provider authentication.
Replay protection.

Unverified events must not modify financial records.

48. Webhook Idempotency

Brokerage events may be delivered multiple times.

The system must identify events that have already been processed.

Provider Event ID
       │
       ▼
Already Processed?
   │          │
  YES         NO
   │           │
Ignore       Process
49. Financial Source of Truth

For brokerage operations, the brokerage provider should be treated as the authoritative source for:

Order status.
Execution status.
Executed quantity.
Provider transaction status.
Provider account state.

PenniWise stores its application-level representation of that information.

50. Brokerage Tools

The Conversation Engine may expose controlled tools such as:

getInvestmentAccounts
getPortfolio
getHoldings
getInvestmentBalance
searchInstrument
getMarketData
getOrders
getOrder
placeOrder
cancelOrder
getInvestmentTransactions

The final list should match the actual product scope.

51. Read vs Write Tools
Read Operations
getInvestmentAccounts
getPortfolio
getHoldings
getInvestmentBalance
searchInstrument
getMarketData
getOrders
getOrder
getInvestmentTransactions
Write Operations
placeOrder
cancelOrder
linkInvestmentAccount
unlinkInvestmentAccount

Write operations require stronger authorization and validation.

52. Brokerage Tool Permissions

Each tool should define:

Tool
Required Permission
Input Schema
Output Schema
Confirmation Required
Audit Requirement

Example:

placeOrder

Permission:
USER_INVESTMENT_ACTION

Confirmation:
Required

Audit:
Required
53. AI Brokerage Restrictions

The AI must not be able to:

Create arbitrary investment orders
Override risk controls
Override account restrictions
Access another user's portfolio
Modify brokerage credentials
Guarantee investment returns
Skip required confirmation

These restrictions must be enforced by application services.

54. Investment Advice

The Conversation Engine may provide educational or informational investment assistance according to the product's defined scope.

The AI should not present unsupported claims as facts.

Where investment recommendations or personalized advice are part of the product, the team should define the appropriate regulatory, compliance, suitability, and risk requirements before implementation.

55. Risk Controls

If PenniWise supports investment recommendations or order execution, appropriate risk controls should be considered.

Potential controls include:

Investment limits
Instrument restrictions
Account eligibility
Order-size limits
Risk profile
Trading permissions
Market availability

The exact controls should be defined by the product and applicable requirements.

56. No Guaranteed Returns

The AI must not guarantee investment returns.

Avoid statements such as:

You will definitely make 20%.

Investment outcomes should not be represented as guaranteed unless they are objectively guaranteed by the relevant product and provider.

57. Current Market Information

Current market information should come from an approved source.

If the provider returns:

Current Price: ₦X

the AI can communicate that value with appropriate context.

If current data is unavailable:

Current market data is unavailable right now.

is preferable to inventing a price.

58. Price Estimates

An estimated order value should be clearly identified as an estimate.

Example:

Estimated order value: ₦50,000

Final execution value may differ based on the execution price.

The exact wording should depend on the order type.

59. Investment Account Security

Access to investment accounts must require:

Authentication.
Authorization.
User ownership validation.
Appropriate provider authorization.

The AI must never determine ownership on its own.

60. Brokerage Data Privacy

Brokerage data should be treated as sensitive financial information.

Access must be restricted to:

Authenticated User
Authorized Application Services
Authorized Administrative Functions

Cross-user access must be prevented.

61. Logging

Brokerage logs should contain useful metadata without exposing sensitive credentials.

Useful fields include:

userId
investmentAccountId
orderId
providerOrderId
operation
status
timestamp
errorCode

Avoid logging:

Passwords
Trading PINs
OTP codes
API secrets
Access tokens
Private credentials
62. Audit Trail

Important brokerage events should be auditable.

Examples:

Investment Account Linked
Order Requested
Order Confirmed
Order Submitted
Order Accepted
Order Rejected
Order Partially Filled
Order Filled
Order Cancelled
Transaction Reconciled

Audit information should be protected from unauthorized modification.

63. Rate Limiting

Brokerage operations should be rate-limited appropriately.

Potential targets include:

Market data requests
Portfolio requests
Order requests
Cancellation requests
Account-linking attempts
Webhook requests

Order placement should have stricter controls than read operations.

64. Brokerage Credentials

Provider credentials should be stored securely.

Example:

BROKERAGE_API_KEY=
BROKERAGE_API_SECRET=
BROKERAGE_WEBHOOK_SECRET=

The exact variables depend on the selected provider.

These values must never be committed to GitHub.

65. Environment Configuration

.env.example should document required variables without containing real secrets.

Example:

BROKERAGE_API_KEY=
BROKERAGE_API_SECRET=
BROKERAGE_WEBHOOK_SECRET=

Actual credentials should remain in the local or deployment environment.

66. Sandbox Environment

If the provider provides a sandbox, development should use it instead of live trading.

Development
    │
    ▼
Brokerage Sandbox
    │
    ▼
Test Orders

Production should use separate credentials and configuration.

67. Testing

Brokerage tests should cover:

[ ] Account linking
[ ] Account unlinking
[ ] Portfolio retrieval
[ ] Holdings retrieval
[ ] Balance retrieval
[ ] Instrument search
[ ] Market data retrieval
[ ] Valid buy order
[ ] Valid sell order
[ ] Invalid order
[ ] Unauthorized order
[ ] Insufficient funds
[ ] Insufficient holdings
[ ] Invalid instrument
[ ] Invalid quantity
[ ] Invalid price
[ ] Duplicate order
[ ] Provider timeout
[ ] Provider failure
[ ] Pending order
[ ] Accepted order
[ ] Filled order
[ ] Partially filled order
[ ] Rejected order
[ ] Cancelled order
[ ] Webhook verification
[ ] Duplicate webhook
[ ] Reconciliation
68. Mock Brokerage Provider

Unit tests should not depend on a live brokerage provider.

Use a mock implementation:

Brokerage Service
      │
      ▼
Mock Brokerage Provider

Integration tests can use the provider's sandbox where appropriate.

69. Error Handling

Brokerage provider errors should be normalized by the Brokerage Service.

Provider Error
      │
      ▼
Brokerage Service
      │
      ▼
Normalized Error
      │
      ▼
Conversation Engine
      │
      ▼
User-Friendly Response

Raw provider errors should not automatically be exposed to users.

70. User-Facing Errors

Examples:

We couldn't retrieve your portfolio right now.

Your order could not be placed.

Your order is still being processed.

We couldn't confirm the order status yet.

This investment is not currently available for trading.

Responses should reflect the actual system state.

71. Brokerage and WhatsApp

WhatsApp is only one possible interface for brokerage functionality.

WhatsApp ─────┐
Web ──────────┤
Mobile ───────┤
              ▼
      Conversation Engine
              │
              ▼
       Brokerage Service

Brokerage logic must remain independent of WhatsApp.

72. Brokerage and AI

The AI acts as a conversational interface.

Example:

User:
Show me my investments.

        │
        ▼

AI

        │
        ▼

getPortfolio

        │
        ▼

Brokerage Service

        │
        ▼

Verified Portfolio

        │
        ▼

AI Response

        │
        ▼

User
73. No Hallucinated Investment Information

The AI must not invent:

Portfolio values.
Holdings.
Investment prices.
Order IDs.
Execution status.
Quantities.
Transaction records.
Brokerage account information.

All such information must come from verified application/provider data.

74. Database Integration

The brokerage module may persist:

Investment Accounts
Holdings
Orders
Investment Transactions
Provider References
Webhook Events
Reconciliation Records

The exact database design should be defined in:

docs/database/database.md
docs/database/schema.md
75. Recommended Backend Structure

A possible structure is:

server/
└── src/
    ├── modules/
    │   └── brokerage/
    │       ├── brokerage.controller.ts
    │       ├── brokerage.service.ts
    │       ├── brokerage.provider.ts
    │       ├── brokerage.types.ts
    │       ├── brokerage.validation.ts
    │       ├── brokerage.routes.ts
    │       └── brokerage.webhook.ts
    │
    ├── ai/
    ├── conversation/
    ├── banking/
    ├── config/
    └── database/

The actual structure should follow the project's established architecture.

76. API Responsibilities

Possible brokerage endpoints include:

GET  /brokerage/accounts
GET  /brokerage/portfolio
GET  /brokerage/holdings
GET  /brokerage/orders
GET  /brokerage/orders/:id
POST /brokerage/orders
POST /brokerage/orders/:id/cancel
GET  /brokerage/transactions

These are examples only. The final API should be defined in api.md.

77. Controller Responsibilities

Controllers should:

Receive Request
      │
      ▼
Validate Input
      │
      ▼
Identify User
      │
      ▼
Call Brokerage Service
      │
      ▼
Return Response

Controllers should not contain complex investment logic.

78. Service Responsibilities

The Brokerage Service should handle:

Validate order
Check account ownership
Check authorization
Check instrument
Check trading permissions
Check limits
Check buying power
Require confirmation
Create order
Call provider
Store provider reference
Update order status
Handle errors
79. Security Boundary

The Brokerage Service is a critical security boundary.

AI
 │
 ▼
Brokerage Tool
 │
 ▼
┌──────────────────────────┐
│   BROKERAGE SERVICE      │
│                          │
│ Authorization            │
│ Validation               │
│ Confirmation             │
│ Limits                   │
│ Order Controls           │
│ Idempotency              │
│ Audit                    │
└────────────┬─────────────┘
             │
             ▼
      Brokerage Provider
80. Implementation Checklist

Before considering the brokerage integration complete:

[ ] Brokerage provider selected
[ ] Sandbox configured
[ ] Provider abstraction defined
[ ] Investment account linking implemented
[ ] Account ownership implemented
[ ] Portfolio retrieval implemented
[ ] Holdings retrieval implemented
[ ] Investment balance retrieval implemented
[ ] Instrument search implemented
[ ] Market data integration implemented where required
[ ] Order creation implemented
[ ] Order validation implemented
[ ] Authorization implemented
[ ] Confirmation implemented
[ ] Order limits implemented
[ ] Buying-power checks implemented
[ ] Holdings checks implemented
[ ] Idempotency implemented
[ ] Order states implemented
[ ] Order cancellation implemented where supported
[ ] Brokerage webhooks implemented
[ ] Webhook verification implemented
[ ] Webhook idempotency implemented
[ ] Reconciliation implemented
[ ] Error handling implemented
[ ] Secrets configured
[ ] Rate limiting implemented
[ ] Audit logging implemented
[ ] Unit tests implemented
[ ] Integration tests implemented
[ ] Sandbox testing completed
[ ] Production configuration separated
81. Final Brokerage Architecture
                              USER
                                │
                                ▼
                    WhatsApp / Web / Mobile
                                │
                                ▼
                       Conversation Engine
                                │
                                ▼
                               AI
                                │
                                ▼
                       Brokerage Tools
                                │
                                ▼
                    ┌────────────────────┐
                    │ BROKERAGE SERVICE  │
                    │                    │
                    │ Authorization      │
                    │ Validation         │
                    │ Confirmation       │
                    │ Risk Controls      │
                    │ Order Limits       │
                    │ Idempotency        │
                    │ Audit              │
                    └─────────┬──────────┘
                              │
                              ▼
                    Brokerage Provider
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              Investment Account    Webhooks
                     │                 │
                     └────────┬────────┘
                              ▼
                       PenniWise Database
                              │
                              ▼
                       Verified Result
                              │
                              ▼
                         User Response

The fundamental brokerage principle is:

The AI can understand and request an investment action, but only the authenticated and authorized PenniWise Brokerage Service can validate, confirm, and execute that action through the brokerage provider.
