# PenniWise — Banking Documentation

## 1. Overview

The banking component is responsible for connecting PenniWise users to supported banking services and enabling banking-related financial operations through the PenniWise application.

The banking layer provides controlled access to banking functionality while ensuring that authentication, authorization, validation, confirmation, transaction tracking, and security remain under the control of PenniWise.

The banking integration may support capabilities such as:

- Viewing account balances.
- Viewing transactions.
- Initiating transfers.
- Checking transfer status.
- Managing linked bank accounts.
- Receiving banking events.
- Reconciling transaction states.

The exact banking capabilities will depend on the banking provider(s) selected for PenniWise.

---

## 2. Architectural Principle

The AI must never communicate directly with the banking provider.

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
Banking Tool
  │
  ▼
Banking Service
  │
  ▼
Banking Provider
  │
  ▼
Bank Account

The AI can request a banking operation, but the Banking Service determines whether that operation is valid and authorized.

3. Banking Responsibilities

The banking module is responsible for:

Managing supported banking integrations.
Managing linked bank accounts.
Retrieving account information.
Retrieving transaction information.
Initiating supported banking operations.
Tracking transaction status.
Handling provider responses.
Handling provider failures.
Processing banking webhooks.
Maintaining transaction references.
Preventing duplicate operations.
Providing verified banking information to the Conversation Engine.
4. What the Banking Module Should Not Do

The banking module should not:

Allow the AI direct access to provider credentials.
Trust AI-generated financial values without validation.
Allow arbitrary banking operations.
Bypass user authorization.
Execute high-risk operations without required confirmation.
Store unnecessary banking credentials.
Treat a network timeout as a successful transaction.
Treat a WhatsApp delivery failure as a banking failure.
5. Banking Architecture
                         USER
                           │
                           ▼
                  Conversation Engine
                           │
                           ▼
                          AI
                           │
                           ▼
                     Banking Tool
                           │
                           ▼
                  Banking Authorization
                           │
                           ▼
                  Banking Service Layer
                           │
                    ┌──────┴──────┐
                    ▼             ▼
               PostgreSQL    Banking Provider
                                  │
                                  ▼
                              Bank Account
6. Banking Provider Abstraction

The application should isolate provider-specific implementation.

Conceptually:

PenniWise Banking Service
          │
          ▼
   Banking Provider Interface
          │
      ┌───┴────┐
      ▼        ▼
 Provider A  Provider B

This makes it possible to replace or add providers without rewriting the rest of the application.

7. Provider Selection

The exact banking provider should be determined by the project's product and integration requirements.

The provider should support the required operations and be suitable for the countries and financial institutions targeted by PenniWise.

Provider-specific implementation details should not leak into the Conversation Engine.

8. Linked Bank Accounts

A PenniWise user may have one or more linked bank accounts depending on the product requirements.

Conceptually:

User
 │
 ├── Bank Account A
 ├── Bank Account B
 └── Bank Account C

Each linked account should belong to the authenticated PenniWise user.

9. Bank Account Ownership

Every banking resource must be associated with the correct PenniWise user.

Example:

Authenticated User
       │
       ▼
Linked Bank Account
       │
       ▼
Provider Account

The application must verify ownership before returning or modifying banking information.

10. Bank Account Data

The application should store only the banking information required by PenniWise.

Potential fields include:

id
userId
provider
providerAccountId
bankName
accountName
accountNumberLast4
currency
status
createdAt
updatedAt

The exact database fields should follow schema.md.

11. Sensitive Banking Data

Banking credentials and sensitive provider information must never be exposed to the AI.

Avoid passing:

Bank password
PIN
OTP
API secret
Provider access token
Full sensitive account credentials

through the Conversation Engine.

12. Account Linking

The process of linking a bank account should follow the selected provider's secure authentication flow.

Conceptually:

User
 │
 ▼
Start Bank Linking
 │
 ▼
Bank Provider
 │
 ▼
Secure Authentication
 │
 ▼
Provider Confirmation
 │
 ▼
PenniWise
 │
 ▼
Linked Bank Account

PenniWise should not collect banking credentials directly unless explicitly required and securely supported by the provider.

13. Authentication vs Authorization

Bank authentication establishes the user's relationship with the banking provider.

PenniWise authorization determines what the user can do inside PenniWise.

These are separate concerns.

Bank Authentication
        │
        ▼
Bank Account Connection
        │
        ▼
PenniWise User
        │
        ▼
PenniWise Authorization
14. Account Balance

The Banking Service may expose a balance tool to the Conversation Engine.

Example:

User:
How much money do I have?

AI
 │
 ▼
getAccountBalance
 │
 ▼
Banking Service
 │
 ▼
Bank Provider
 │
 ▼
Verified Balance
 │
 ▼
AI
 │
 ▼
User

The balance should come from an authoritative source.

15. Balance Accuracy

The AI must not guess a user's balance.

If the banking provider returns:

₦125,500

the response should be based on that verified value.

If the provider is unavailable, the AI should clearly state that the current balance could not be retrieved.

16. Transaction History

Users may be able to request their transaction history.

Example:

User:
Show me my recent transactions.

        │
        ▼

Banking Service

        │
        ▼

Bank Provider

        │
        ▼

Verified Transactions

Only transactions belonging to the authenticated user should be returned.

17. Transaction Filtering

The Banking Service may support filtering by:

Date.
Amount.
Transaction type.
Status.
Account.
Reference.

Example:

User:
How much did I spend this month?

The application should calculate this using verified transaction data rather than allowing the AI to estimate the result.

18. Transaction Types

Depending on provider capabilities, transactions may include:

DEPOSIT
WITHDRAWAL
TRANSFER
PAYMENT
REVERSAL
REFUND
FEE
OTHER

The exact transaction types should follow the provider and PenniWise data model.

19. Transaction Status

Banking transactions should have explicit states.

Example:

PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REVERSED
UNKNOWN

The exact states should match the banking provider and PenniWise transaction model.

20. Transfer Flow

A transfer should follow a controlled workflow.

User
 │
 ▼
Transfer Request
 │
 ▼
AI
 │
 ▼
Banking Tool
 │
 ▼
Input Validation
 │
 ▼
Authorization
 │
 ▼
Confirmation
 │
 ▼
Banking Service
 │
 ▼
Banking Provider
 │
 ▼
Transaction Result
 │
 ▼
User
21. Transfer Validation

Before executing a transfer, the system should validate:

User authorization.
Source account.
Destination account.
Amount.
Currency.
Transfer limits.
Account status.
Required fields.
Provider requirements.

Invalid requests must be rejected before reaching the provider.

22. Transfer Confirmation

Transfers should require explicit confirmation when required by the product's risk model.

Example:

PenniWise:

You're about to transfer:

Amount: ₦50,000
Recipient: John Doe
Bank: Example Bank
Account: ****1234

Do you want to continue?

The application should only execute the transfer after valid confirmation.

23. Confirmation Must Match the Action

The confirmation must be tied to the exact intended transaction.

For example:

Amount: ₦50,000
Recipient: John Doe
Account: ****1234

If the amount changes to:

₦100,000

the previous confirmation should no longer be valid.

A new confirmation should be required.

24. Transfer Limits

The Banking Service should enforce applicable transaction limits.

Limits may be defined by:

Provider.
Account.
User.
Transaction type.
Daily limit.
Per-transaction limit.

The AI should never be allowed to override these limits.

25. Idempotency

Transfers must be protected against duplicate execution.

Example:

Transfer Request
      │
      ▼
Idempotency Key
      │
      ▼
Already Processed?
   │          │
  YES         NO
   │           │
Return       Execute
Existing
Result

This is critical for financial operations.

26. Duplicate Transfer Protection

The system must prevent scenarios where:

User:
Transfer ₦50,000.

causes two separate transfers because:

The webhook was duplicated.
The request timed out.
The user clicked twice.
The application retried the request.
The provider retried an event.
27. Provider Timeouts

A provider timeout does not necessarily mean that a transfer failed.

Example:

PenniWise
    │
    ▼
Bank Provider
    │
    X
  Timeout

The transaction may actually have been accepted by the provider.

The system should check the transaction status before retrying.

28. Unknown Transaction State

If the system cannot determine the transaction status:

UNKNOWN

should be treated differently from:

FAILED

The system should reconcile the transaction with the provider before performing another operation.

29. Transaction References

Each banking operation should have an internal reference and, where available, a provider reference.

Example:

PenniWise Reference:
PW-TRX-123456

Provider Reference:
PROVIDER-987654

These references are useful for:

Support.
Reconciliation.
Auditing.
Debugging.
User communication.
30. Banking Webhooks

Banking providers may send events to PenniWise.

Examples:

Transfer completed
Transfer failed
Transfer reversed
Account updated
Payment received

The application should expose provider-specific webhook endpoints.

Conceptually:

Bank Provider
     │
     ▼
POST /webhooks/banking
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
Transaction Update
31. Webhook Verification

Banking webhook requests must be authenticated according to the provider's security mechanism.

Possible controls include:

Signature verification.
Secret tokens.
Timestamp validation.
Provider authentication.
Replay protection.

Unverified events must not update financial records.

32. Webhook Idempotency

Banking webhook events may be delivered more than once.

The application must identify already-processed events.

Example:

Provider Event ID
       │
       ▼
Already Processed?
   │          │
  YES         NO
   │           │
Ignore       Process
33. Transaction Reconciliation

PenniWise should reconcile internal transaction records with the provider's records.

Example:

PenniWise Transaction
        │
        ▼
Provider Transaction
        │
        ▼
Compare Status
        │
   ┌────┴────┐
   ▼         ▼
 Match     Mismatch
             │
             ▼
        Reconciliation

This is important when network failures or webhook delays occur.

34. Financial Source of Truth

For banking operations, the external banking provider should be treated as the authoritative source for provider-side transaction status.

PenniWise's database stores the application's representation of that state.

The AI should use verified application/provider results.

35. Banking Tool Interface

The Conversation Engine may expose controlled tools such as:

getLinkedAccounts
getAccountBalance
getTransactions
getTransaction
initiateTransfer
getTransferStatus

The final tool list should reflect the actual product scope.

36. Read vs Write Tools

Banking tools should be classified into read and write operations.

Read
getLinkedAccounts
getAccountBalance
getTransactions
getTransaction
Write
initiateTransfer
linkAccount
unlinkAccount

Write operations require stronger validation and authorization.

37. Banking Tool Permissions

Each tool should define:

Tool
Required Permission
Input Schema
Output Schema
Confirmation Required
Audit Requirement

Example:

initiateTransfer

Permission:
USER_FINANCIAL_ACTION

Confirmation:
Required

Audit:
Required
38. AI Tool Restrictions

The AI should not be able to:

Create arbitrary transfers
Modify provider credentials
Change account ownership
Access another user's account
Override transaction limits
Skip confirmation

The Banking Service must enforce these restrictions independently of AI instructions.

39. Banking Service Layer

The Banking Service should be the main business-logic boundary.

Conceptually:

Banking Tool
     │
     ▼
Banking Service
     │
     ├── Validate
     ├── Authorize
     ├── Confirm
     ├── Apply Limits
     ├── Create Transaction
     ├── Call Provider
     └── Update Status
40. Database Integration

The banking module may persist:

Linked accounts.
Transactions.
Provider references.
Transaction status.
Webhook events.
Reconciliation information.

The exact models should be defined in:

docs/database/schema.md

and related database documentation.

41. Banking Credentials

Provider credentials must be stored securely.

Example:

BANKING_API_KEY=
BANKING_API_SECRET=
BANKING_WEBHOOK_SECRET=

The exact variables depend on the selected provider.

They must not be committed to GitHub.

42. Environment Configuration

The .env.example file should document required variables without exposing actual secrets.

Example:

BANKING_API_KEY=
BANKING_API_SECRET=
BANKING_WEBHOOK_SECRET=

Each developer should use appropriate local credentials/configuration.

43. Production Credentials

Production banking credentials must be separated from development credentials.

Development
    │
    └── Test/Sandbox Provider

Production
    │
    └── Production Provider

Production credentials must not be placed in local development files or GitHub.

44. Sandbox Environment

Where the banking provider offers a sandbox environment, development should use it.

Sandbox testing should cover:

Account linking.
Balance retrieval.
Transaction retrieval.
Transfers.
Failed transactions.
Pending transactions.
Webhooks.
45. Testing Banking Operations

Banking tests should include:

[ ] Account linking
[ ] Account unlinking
[ ] Balance retrieval
[ ] Transaction retrieval
[ ] Valid transfer
[ ] Invalid transfer
[ ] Unauthorized transfer
[ ] Insufficient funds
[ ] Transfer limit exceeded
[ ] Duplicate transfer
[ ] Provider timeout
[ ] Provider failure
[ ] Pending transfer
[ ] Successful transfer
[ ] Failed transfer
[ ] Reversed transfer
[ ] Webhook verification
[ ] Duplicate webhook
[ ] Reconciliation
46. Mocking the Banking Provider

Unit tests should not depend on live banking providers.

Instead:

Banking Service
      │
      ▼
Mock Banking Provider

Integration tests can use the provider's sandbox environment where appropriate.

47. Error Handling

Banking errors should be normalized into application-level errors.

For example:

Provider Error
      │
      ▼
Banking Service
      │
      ▼
Normalized Error
      │
      ▼
Conversation Engine
      │
      ▼
User-Friendly Response

Raw provider errors should not necessarily be exposed to users.

48. User-Facing Banking Errors

Examples:

We couldn't retrieve your balance right now.

Your transfer could not be completed.

Your transfer is still being processed.

We couldn't verify the transaction status yet.

The response should reflect the actual state where known.

49. Banking and WhatsApp

WhatsApp is only one possible interface to banking features.

WhatsApp ─────┐
Web ──────────┤
Mobile ───────┤
              ▼
      Conversation Engine
              │
              ▼
       Banking Service

Banking logic should therefore remain independent of WhatsApp.

50. Banking and AI

The AI acts as a conversational interface to banking capabilities.

Example:

User:
How much do I have?

AI:
I'll check your balance.

     │
     ▼
getAccountBalance

     │
     ▼
Banking Service

     │
     ▼
Verified Result

     │
     ▼
AI:
Your current balance is ₦XXX.
51. No Hallucinated Banking Information

The AI must not invent:

Account balances.
Transaction records.
Transfer references.
Bank names.
Transfer status.
Account details.

If the required information is unavailable, the AI should communicate that clearly.

52. Banking Data Privacy

Banking data should be treated as sensitive.

Access should be restricted based on:

User identity.
Resource ownership.
Application permissions.
Service authorization.

Cross-user access must be prevented.

53. Logging

Banking logs should contain enough information for debugging without exposing sensitive information.

Useful metadata includes:

userId
transactionId
providerReference
operation
status
timestamp
errorCode

Avoid logging:

Passwords
PINs
OTP codes
API secrets
Full credentials
54. Audit Trail

Financial operations should be auditable.

Important events include:

Account Linked
Transfer Requested
Transfer Confirmed
Transfer Submitted
Transfer Successful
Transfer Failed
Transfer Reversed
Webhook Received
Transaction Reconciled

Audit records should be protected from unauthorized modification.

55. Security Controls

The banking module must follow the general PenniWise security architecture.

Controls include:

Authentication
Authorization
Input Validation
Tool Allowlisting
Confirmation
Idempotency
Rate Limiting
Webhook Verification
Audit Logging
Secret Management
56. Rate Limiting

Banking operations should be rate-limited where appropriate.

Potential limits include:

Balance requests
Transaction history requests
Transfer attempts
Account linking attempts
Webhook processing

Financial write operations should have stricter controls than read operations.

57. Transaction Limits

PenniWise should support configurable limits where required.

Example:

Maximum transfer per transaction
Maximum daily transfer
Maximum number of transfers per day

These limits must be enforced by the application and/or banking provider.

The AI cannot override them.

58. Transaction Lifecycle

A typical transfer lifecycle is:

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
PROCESSING
    │
    ├──────► SUCCESS
    │
    ├──────► FAILED
    │
    └──────► UNKNOWN
                    │
                    ▼
               RECONCILIATION

The exact states should match the final transaction model.

59. Cancellation

If supported by the provider, pending transactions may be cancellable.

Cancellation must be performed through the Banking Service.

The AI must not assume that a transaction can be cancelled.

60. Reversal

A transaction may be reversed by the provider.

Example:

SUCCESS
   │
   ▼
REVERSAL
   │
   ▼
REVERSED

The application should update its internal transaction state based on verified provider events.

61. Banking Availability

If the banking provider is unavailable:

User
 │
 ▼
PenniWise
 │
 ▼
Banking Provider
 │
 X
Unavailable

PenniWise should return a safe response without pretending that the requested operation succeeded.

62. Provider Switching

Because the banking integration should use an abstraction layer, a provider can be replaced or added later.

Banking Service
       │
       ▼
Provider Interface
       │
 ┌─────┴─────┐
 ▼           ▼
Provider A  Provider B

Business logic should remain above the provider-specific implementation.

63. Recommended Backend Structure

A possible structure is:

server/
└── src/
    ├── modules/
    │   └── banking/
    │       ├── banking.controller.ts
    │       ├── banking.service.ts
    │       ├── banking.provider.ts
    │       ├── banking.types.ts
    │       ├── banking.validation.ts
    │       ├── banking.routes.ts
    │       └── banking.webhook.ts
    │
    ├── ai/
    ├── conversation/
    ├── brokerage/
    ├── config/
    └── database/

The exact directory structure should follow the project's actual architecture.

64. API Responsibilities

Banking API endpoints should be responsible for transport-level concerns.

For example:

GET  /banking/accounts
GET  /banking/accounts/:id/balance
GET  /banking/transactions
GET  /banking/transactions/:id
POST /banking/transfers
GET  /banking/transfers/:id

These are examples only; the final API should be defined in api.md.

65. Service Responsibilities

The Banking Service should handle:

Validate request
Check ownership
Check authorization
Check limits
Create transaction
Request provider operation
Store provider reference
Update transaction status
Handle errors
66. Controller Responsibilities

Controllers should:

Receive request
Validate transport input
Identify authenticated user
Call Banking Service
Return response

Controllers should not contain complex financial logic.

67. Security Boundary

The Banking Service is a critical security boundary.

AI
 │
 ▼
Banking Tool
 │
 ▼
┌─────────────────────────┐
│    BANKING SERVICE      │
│                         │
│ Authorization           │
│ Validation              │
│ Confirmation            │
│ Limits                  │
│ Idempotency             │
└────────────┬────────────┘
             │
             ▼
      Banking Provider
68. Implementation Checklist

Before considering the banking integration complete:

[ ] Banking provider selected
[ ] Sandbox configured
[ ] Provider abstraction defined
[ ] Account linking implemented
[ ] User ownership implemented
[ ] Balance retrieval implemented
[ ] Transaction retrieval implemented
[ ] Transfer flow implemented
[ ] Input validation implemented
[ ] Authorization implemented
[ ] Confirmation implemented
[ ] Transaction limits implemented
[ ] Idempotency implemented
[ ] Transaction states implemented
[ ] Provider webhooks implemented
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
69. Final Banking Architecture
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
                         Banking Tools
                                │
                                ▼
                    ┌────────────────────┐
                    │  BANKING SERVICE   │
                    │                    │
                    │ Authorization      │
                    │ Validation         │
                    │ Confirmation       │
                    │ Limits             │
                    │ Idempotency        │
                    │ Audit              │
                    └─────────┬──────────┘
                              │
                              ▼
                    Banking Provider
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                Bank Accounts       Webhooks
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

The fundamental banking principle is:

The AI can request a banking operation, but only the authenticated and authorized PenniWise Banking Service can validate and execute that operation.
