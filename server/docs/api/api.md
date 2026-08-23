# PenniWise — API Documentation

## 1. Overview

The PenniWise API provides the backend interface between the WhatsApp experience, frontend/admin applications, internal services, the database, and external financial providers.

The API is responsible for:

- Authentication and authorization.
- User management.
- KYC operations.
- Savings.
- Wallet operations.
- Transactions.
- Trading.
- Portfolio management.
- Market data.
- Price alerts.
- Notifications.
- Admin operations.
- System health and monitoring.

The API should expose business operations through controlled endpoints while keeping sensitive business logic inside the backend.

---

## 2. API Architecture

```text
Client
  │
  ├── WhatsApp
  ├── Admin Dashboard
  └── Internal Services
        │
        ▼
   PenniWise API
        │
        ├── Authentication
        ├── Users
        ├── KYC
        ├── Savings
        ├── Wallets
        ├── Transactions
        ├── Trading
        ├── Portfolio
        ├── Market Data
        ├── Price Alerts
        ├── Notifications
        └── Admin
        │
        ▼
   Business Services
        │
        ├── PostgreSQL
        ├── Redis
        └── External Integrations

3. API Base URL

The API base URL depends on the deployment environment.

Development
http://localhost:<PORT>
Production
https://<production-domain>

The production domain should be added once deployment infrastructure is finalized.

4. API Versioning

API endpoints should be versioned to allow future changes without immediately breaking existing clients.

Recommended structure:

/api/v1

Examples:

/api/v1/users
/api/v1/savings
/api/v1/trading/orders

Future versions can use:

/api/v2
5. Authentication

Protected endpoints require authentication.

PenniWise uses JWT-based authentication.

Client
  │
  ▼
Login
  │
  ▼
Authentication Service
  │
  ▼
JWT
  │
  ▼
Client

The client sends the token with protected requests.

Authorization: Bearer <JWT>

JWT secrets must remain in environment variables and must never be committed to GitHub.

6. Authorization

Authentication determines who the user is.

Authorization determines what the user is allowed to do.

Administrative access should use role-based authorization.

Current administrative roles include:

SUPPORT
ADMIN
SUPER_ADMIN

Example:

User
 └── Regular customer endpoints

SUPPORT
 └── Customer support operations

ADMIN
 └── Administrative operations

SUPER_ADMIN
 └── Highest-level administrative operations
7. Request Format

API requests should generally use JSON.

Content-Type: application/json

Example:

{
  "amount": 50000,
  "currency": "NGN"
}
8. Response Format

API responses should follow a consistent structure.

Successful Response
{
  "success": true,
  "data": {}
}
Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}

The exact response structure may be refined as the API implementation evolves.

9. HTTP Status Codes
Status	Meaning
200	Successful request
201	Resource created
204	Successful request with no response body
400	Bad request
401	Authentication required/failed
403	Insufficient permissions
404	Resource not found
409	Conflict
422	Validation error
429	Rate limit exceeded
500	Internal server error
502	External provider failure
503	Service unavailable
10. Health Check

The API should expose a health endpoint.

GET /health

Purpose:

Confirm that the server is running.
Support deployment health checks.
Support monitoring.

Example response:

{
  "success": true,
  "status": "ok"
}

A readiness endpoint may also be introduced later.

GET /health/ready

This can verify dependencies such as:

PostgreSQL.
Redis.
Required external services.
11. Authentication Endpoints

Authentication endpoints manage customer and administrative authentication.

Login
POST /api/v1/auth/login

Example request:

{
  "email": "user@example.com",
  "password": "password"
}

Example response:

{
  "success": true,
  "data": {
    "token": "<JWT>"
  }
}

The exact authentication fields should follow the final authentication implementation.

12. User Endpoints
Get Current User
GET /api/v1/users/me

Returns information about the authenticated user.

Example:

{
  "success": true,
  "data": {
    "id": "user-id",
    "phone": "+234...",
    "status": "ACTIVE"
  }
}
Update User
PATCH /api/v1/users/me

Example:

{
  "firstName": "John",
  "lastName": "Doe"
}
Get User

Administrative endpoint:

GET /api/v1/users/:userId

Access should be restricted according to the administrator's role.

13. KYC Endpoints

KYC endpoints manage identity verification.

Start KYC
POST /api/v1/kyc

Example:

{
  "bvn": "***********",
  "nin": "***********"
}

Sensitive identity information must be handled securely.

Get KYC Status
GET /api/v1/kyc/status

Example response:

{
  "success": true,
  "data": {
    "status": "VERIFIED"
  }
}

Possible states may include:

PENDING
VERIFIED
FAILED

The final states should follow the implemented data model.

14. Risk Profile Endpoints
Get Risk Profile
GET /api/v1/risk-profile

Example response:

{
  "success": true,
  "data": {
    "profile": "MODERATE"
  }
}

Current supported risk profiles are:

CONSERVATIVE
MODERATE
AGGRESSIVE
Submit Risk Assessment
POST /api/v1/risk-profile

Example:

{
  "answers": [
    {
      "questionId": "q1",
      "answer": "..."
    }
  ]
}

The backend calculates and stores the resulting risk profile.

15. Wallet Endpoints
Get Wallets
GET /api/v1/wallets

Returns the authenticated user's wallets.

Get Wallet
GET /api/v1/wallets/:walletId

Example response:

{
  "success": true,
  "data": {
    "id": "wallet-id",
    "type": "SAVINGS",
    "currency": "NGN",
    "balance": "50000"
  }
}
16. Transaction Endpoints
Get Transactions
GET /api/v1/transactions

Supports filtering and pagination.

Example:

GET /api/v1/transactions?page=1&limit=20
Get Transaction
GET /api/v1/transactions/:transactionId

Returns details of a specific transaction.

17. Savings Endpoints

Savings endpoints manage customer savings goals.

Create Savings Goal
POST /api/v1/savings/goals

Example:

{
  "name": "December Goal",
  "targetAmount": 100000,
  "targetDate": "2026-12-01",
  "type": "FLEXIBLE"
}
Get Savings Goals
GET /api/v1/savings/goals
Get Savings Goal
GET /api/v1/savings/goals/:goalId
Update Savings Goal
PATCH /api/v1/savings/goals/:goalId
Contribute to Savings Goal
POST /api/v1/savings/goals/:goalId/contribute

Example:

{
  "amount": 10000
}
Lock Savings
POST /api/v1/savings/goals/:goalId/lock
Unlock Savings
POST /api/v1/savings/goals/:goalId/unlock

The final endpoint behavior will depend on the savings rules and MFB integration.

18. Instrument Endpoints

Investment instruments such as NGX-listed equities are exposed through instrument endpoints.

List Instruments
GET /api/v1/instruments
Get Instrument
GET /api/v1/instruments/:instrumentId
Find Instrument by Ticker
GET /api/v1/instruments?ticker=GTCO

Example response:

{
  "success": true,
  "data": {
    "ticker": "GTCO",
    "name": "Guaranty Trust Holding Company",
    "exchange": "NGX",
    "lastPrice": 100
  }
}

The exact instrument information depends on the selected market-data source.

19. Trading Endpoints

Trading endpoints handle investment orders.

Preview Buy Order
POST /api/v1/trading/orders/preview

Example:

{
  "instrumentId": "instrument-id",
  "side": "BUY",
  "quantity": 100
}

The preview should calculate relevant information such as:

Current/estimated price.
Quantity.
Estimated trade value.
Fees.
Total estimated cost.
Create Order
POST /api/v1/trading/orders

Example:

{
  "instrumentId": "instrument-id",
  "side": "BUY",
  "quantity": 100,
  "confirmation": true
}

The backend must independently validate the request before execution.

Get Orders
GET /api/v1/trading/orders

Supports pagination and filtering.

Get Order
GET /api/v1/trading/orders/:orderId
Cancel Order
POST /api/v1/trading/orders/:orderId/cancel

Whether an order can be cancelled depends on its current state and the brokerage provider.

20. Trading Confirmation

Financial orders require explicit confirmation before execution.

Recommended flow:

Trade Request
     ↓
Order Preview
     ↓
User Confirmation
     ↓
Backend Validation
     ↓
Order Execution

The system should not treat an AI-generated intention alone as confirmation.

21. Portfolio Endpoints
Get Portfolio
GET /api/v1/portfolio

Returns the user's investment portfolio.

Get Holdings
GET /api/v1/portfolio/holdings
Get Holding
GET /api/v1/portfolio/holdings/:holdingId
22. Market Data Endpoints
Get Latest Market Data
GET /api/v1/market-data
Get Instrument Price
GET /api/v1/market-data/:instrumentId
Price History
GET /api/v1/market-data/:instrumentId/history

Historical market-data support depends on the selected provider and final implementation.

23. Price Alert Endpoints
Create Price Alert
POST /api/v1/price-alerts

Example:

{
  "instrumentId": "instrument-id",
  "targetPrice": 100,
  "direction": "ABOVE"
}
Get Price Alerts
GET /api/v1/price-alerts
Update Price Alert
PATCH /api/v1/price-alerts/:alertId
Delete Price Alert
DELETE /api/v1/price-alerts/:alertId
24. Notification Endpoints
Get Notifications
GET /api/v1/notifications
Mark Notification as Read
PATCH /api/v1/notifications/:notificationId/read

Notifications may also be generated internally without an externally accessible API endpoint.

25. Conversation Endpoints

Conversation endpoints manage interactions where an API interface is required outside the WhatsApp webhook.

Send Message
POST /api/v1/conversations/messages

Example:

{
  "message": "I want to save ₦50,000"
}
Get Conversation
GET /api/v1/conversations/:conversationId
26. WhatsApp Webhook

WhatsApp webhooks receive incoming events from the WhatsApp provider.

POST /api/v1/webhooks/whatsapp

The webhook may receive:

Incoming messages.
Message status updates.
Delivery events.
Read events.
Other supported WhatsApp events.

Webhook requests must be verified before being processed.

27. KYC Webhook

External KYC providers may send verification results asynchronously.

POST /api/v1/webhooks/kyc

The webhook should:

Validate the provider request.
Identify the verification request.
Update KYC status.
Record relevant provider references.
Trigger required account actions.
Notify the user where appropriate.
28. Banking Webhook

Banking providers may send asynchronous transaction updates.

POST /api/v1/webhooks/banking

Possible events include:

Deposit completed.
Transfer completed.
Withdrawal completed.
Transaction failed.
Transaction reversed.

The exact events depend on the selected MFB provider.

29. Brokerage Webhook

Brokerage providers may send order updates.

POST /api/v1/webhooks/brokerage

Possible events include:

ORDER_ACCEPTED
ORDER_REJECTED
ORDER_PARTIALLY_FILLED
ORDER_FILLED
ORDER_CANCELLED
SETTLEMENT_COMPLETED

The exact event names should match the final brokerage integration.

30. Admin Endpoints

Administrative endpoints should be protected by authentication and role-based authorization.

Get Users
GET /api/v1/admin/users
Get User
GET /api/v1/admin/users/:userId
Suspend User
POST /api/v1/admin/users/:userId/suspend
Reactivate User
POST /api/v1/admin/users/:userId/reactivate
View Transactions
GET /api/v1/admin/transactions
View Orders
GET /api/v1/admin/orders
View Audit Logs
GET /api/v1/admin/audit-logs

The final administrative endpoints should reflect the permissions assigned to each role.

31. Pagination

Collection endpoints should support pagination.

Example:

GET /api/v1/transactions?page=1&limit=20

Recommended response:

{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

The exact pagination implementation may change as the API is developed.

32. Filtering

Collection endpoints should support filtering where appropriate.

Example:

GET /api/v1/transactions?type=DEPOSIT&status=COMPLETED

Trading:

GET /api/v1/trading/orders?status=FILLED

Notifications:

GET /api/v1/notifications?read=false
33. Idempotency

Financial operations should support idempotency where duplicate requests could create duplicate financial effects.

Example:

Idempotency-Key: unique-request-id

Potential operations include:

Deposits.
Withdrawals.
Transfers.
Buy orders.
Sell orders.
Savings contributions.

The transaction model includes an idempotency key to help prevent duplicate financial operations.

34. Validation

All API input must be validated before reaching business logic.

The project uses Zod for validation.

Example:

HTTP Request
     ↓
Schema Validation
     ↓
Valid?
 ┌───┴────┐
 │        │
Yes       No
 │        │
 ▼        ▼
Service  422

Validation should cover:

Required fields.
Data types.
String formats.
Numeric ranges.
Enum values.
Dates.
IDs.
Financial amounts.
35. Rate Limiting

The API uses express-rate-limit.

Rate limiting should be applied especially to:

Authentication endpoints.
Public endpoints.
Webhooks where appropriate.
Password-related operations.
High-frequency API requests.

The exact rate limits should be documented when finalized.

36. Security Requirements

The API must:

Validate authentication.
Validate authorization.
Validate all inputs.
Protect secrets.
Use HTTPS in production.
Apply rate limiting.
Use secure HTTP headers.
Avoid exposing internal errors.
Avoid logging sensitive information.
Protect webhook endpoints.
Use idempotency for financial operations where necessary.
Maintain audit trails for sensitive actions.

The backend currently includes security-related dependencies such as Helmet, CORS, bcryptjs, and express-rate-limit.

37. Error Handling

API errors should be normalized before being returned to clients.

Example:

{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "You do not have enough funds to complete this transaction."
  }
}

Internal errors should be logged but should not expose:

Stack traces.
Database details.
API keys.
Provider credentials.
Internal implementation details.
38. External Provider Errors

External provider errors should be converted into application-level errors.

Broker API
    │
    ▼
Provider Error
    │
    ▼
Brokerage Adapter
    │
    ▼
Normalized PenniWise Error
    │
    ▼
Trading Service
    │
    ▼
API Response

This prevents the rest of the application from becoming dependent on provider-specific error formats.

39. Webhook Security

External webhooks must be verified before processing.

The verification mechanism depends on the provider and may include:

Signature verification.
Secret tokens.
Request validation.
Timestamp validation.
Provider-specific authentication.

Webhook handlers should also be idempotent because providers may retry events.

40. API and Database Boundary

API routes should not contain complex database logic.

Recommended flow:

Route
  ↓
Controller
  ↓
Validation
  ↓
Service
  ↓
Repository / Prisma
  ↓
PostgreSQL

Example:

POST /api/v1/savings/goals
        ↓
Savings Controller
        ↓
Validate Request
        ↓
Savings Service
        ↓
Prisma
        ↓
PostgreSQL

This separation makes the application easier to test and maintain.

41. API and AI Boundary

AI-generated instructions must enter the normal backend flow.

Incorrect:

AI → Database

Incorrect:

AI → Broker

Correct:

AI
 ↓
Structured Intent
 ↓
Backend Service
 ↓
Validation
 ↓
Authorization
 ↓
Confirmation
 ↓
External Provider

This boundary is especially important for financial operations.

42. API Documentation Maintenance

Every new endpoint should be added to this document when implemented.

For each endpoint, document:

HTTP method.
URL.
Authentication requirement.
Required role.
Request body.
Query parameters.
Path parameters.
Successful response.
Possible errors.
External side effects.
Idempotency requirements.

Example:

Endpoint:
POST /api/v1/trading/orders

Authentication:
Required

Role:
Authenticated customer

Request:
instrumentId
side
quantity
confirmation

Side Effects:
Creates trading order.
May create transaction records.
May communicate with brokerage provider.

Idempotency:
Required.
43. API Development Rule

An API endpoint should not directly perform an operation simply because the request is syntactically valid.

The complete flow should be:

Request
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Business Rules
   ↓
Confirmation (where required)
   ↓
Execution
   ↓
Persistence
   ↓
Audit
   ↓
Response

This is particularly important for financial endpoints.

44. Current Implementation Status

The endpoint list in this document represents the planned API structure for PenniWise.

Endpoints should be marked as they are actually implemented.

Recommended status labels:

PLANNED
IN DEVELOPMENT
IMPLEMENTED
TESTED
PRODUCTION
DEPRECATED
