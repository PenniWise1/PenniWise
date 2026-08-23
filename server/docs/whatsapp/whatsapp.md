# PenniWise — WhatsApp Integration Documentation

## 1. Overview

WhatsApp is one of the communication channels through which users can interact with PenniWise.

The WhatsApp integration allows users to communicate with the PenniWise financial assistant through conversational messages rather than requiring them to use a traditional web interface.

The integration is responsible for:

- Receiving WhatsApp messages.
- Identifying the associated PenniWise user.
- Passing messages to the PenniWise conversation engine.
- Returning AI-generated responses to the user.
- Handling WhatsApp-specific authentication and webhook requirements.
- Supporting conversational financial workflows.
- Maintaining conversation context.
- Handling delivery and provider events.

The WhatsApp integration should act as a communication layer rather than becoming the core business-logic layer.

---

## 2. Architectural Principle

The WhatsApp integration should not contain the application's core financial logic.

The preferred architecture is:

```text
WhatsApp User
     │
     ▼
WhatsApp Provider
     │
     ▼
WhatsApp Webhook
     │
     ▼
PenniWise API
     │
     ▼
Conversation Engine
     │
     ▼
AI
     │
     ▼
Application Services
     │
     ├── Banking
     ├── Brokerage
     ├── Wallet
     └── Database
     │
     ▼
Response
     │
     ▼
WhatsApp Provider
     │
     ▼
WhatsApp User

This separation allows PenniWise to support additional communication channels later without duplicating the application's business logic.

3. WhatsApp Integration Responsibilities

The WhatsApp layer is responsible for:

Receiving messages.
Verifying webhook requests.
Identifying the sender.
Mapping the sender to a PenniWise account.
Normalizing incoming messages.
Sending messages to the Conversation Engine.
Formatting responses for WhatsApp.
Sending responses through the WhatsApp provider.
Processing delivery events.
Handling provider errors.
Preventing duplicate webhook processing.
4. What WhatsApp Should Not Do

The WhatsApp integration should not directly:

Modify database records without going through application services.
Execute financial transactions.
Access banking credentials.
Access brokerage credentials.
Make authorization decisions independently.
Execute AI tools directly.
Bypass confirmation requirements.
Contain duplicated financial business logic.

Instead:

WhatsApp
   │
   ▼
Conversation Engine
   │
   ▼
Application Services
5. WhatsApp Provider

PenniWise should use an approved WhatsApp Business integration/provider.

The provider is responsible for communication between PenniWise and WhatsApp.

The provider may handle:

Message delivery.
Incoming messages.
Media.
Message IDs.
Delivery status.
Read status.
Webhook events.

The exact provider implementation should be isolated behind the WhatsApp integration layer.

6. Provider Abstraction

The application should avoid tightly coupling the Conversation Engine to a specific WhatsApp provider.

Conceptually:

Conversation Engine
        │
        ▼
Messaging Interface
        │
   ┌────┴────┐
   ▼         ▼
WhatsApp   Future Channel
Provider   Provider

This makes it easier to replace or add communication providers later.

7. Webhook Architecture

Incoming WhatsApp events should enter PenniWise through a webhook endpoint.

Conceptually:

WhatsApp Provider
       │
       ▼
POST /webhooks/whatsapp
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
Conversation Engine

The exact endpoint path should follow the project's API conventions.

8. Webhook Verification

The webhook endpoint must verify that incoming requests originate from the expected WhatsApp provider.

The application should not process arbitrary requests sent to the webhook endpoint.

Verification may involve provider-specific mechanisms such as:

Webhook verification tokens.
Request signatures.
Provider authentication.
Timestamp checks.

The exact mechanism depends on the selected WhatsApp provider.

9. Webhook Payload Validation

Incoming webhook payloads must be validated before processing.

The system should verify:

Expected event structure.
Message type.
Sender identifier.
Message identifier.
Timestamp.
Provider-specific metadata.

Invalid payloads should be rejected safely.

10. Incoming Message Flow

A normal text message should follow this flow:

User
 │
 │ "How much did I spend this month?"
 ▼
WhatsApp
 │
 ▼
Webhook
 │
 ▼
Validate Event
 │
 ▼
Identify User
 │
 ▼
Normalize Message
 │
 ▼
Conversation Engine
 │
 ▼
AI
 │
 ▼
Financial Service
 │
 ▼
Result
 │
 ▼
AI Response
 │
 ▼
WhatsApp Provider
 │
 ▼
User
11. Message Normalization

WhatsApp-specific message structures should be converted into an internal format.

Example:

{
  channel: "whatsapp",
  externalMessageId: "...",
  externalUserId: "...",
  text: "How much did I spend this month?",
  timestamp: "..."
}

The internal conversation system should work with this normalized representation rather than depending on provider-specific payload structures.

12. External User Identity

A WhatsApp user's phone number or provider-specific identifier should not automatically be treated as the PenniWise user's database ID.

The system should maintain a mapping between:

WhatsApp Identity
        │
        ▼
PenniWise User

This mapping should be securely maintained.

13. Account Linking

A user must have a defined process for linking their WhatsApp identity to their PenniWise account.

Conceptually:

WhatsApp User
      │
      ▼
Account Linking
      │
      ▼
PenniWise User ID
      │
      ▼
Authenticated Conversation

The exact account-linking flow should be defined as part of the authentication architecture.

14. Unknown Users

If a WhatsApp number is not associated with a PenniWise account, the system should not expose financial information.

Possible flow:

Unknown WhatsApp User
        │
        ▼
No PenniWise Account
        │
        ▼
Account Registration / Linking

The system should provide a safe onboarding response.

15. User Identification

Once a WhatsApp identity has been successfully linked, incoming messages should be associated with the correct PenniWise user.

Example:

WhatsApp ID
     │
     ▼
Identity Mapping
     │
     ▼
User ID
     │
     ▼
Conversation

The user ID should then be used by application services for authorization and data access.

16. Conversation Context

WhatsApp messages should be connected to a PenniWise conversation.

Example:

User
 │
 ├── Message 1
 ├── Message 2
 ├── Message 3
 └── Message 4
       │
       ▼
Conversation
       │
       ▼
Conversation Engine

Conversation context must remain isolated between users.

17. Conversation Persistence

Where the product requires persistent conversation history, WhatsApp messages should be stored using the project's conversation data model.

Possible information includes:

Conversation ID.
User ID.
Message ID.
Sender type.
Message content.
Channel.
Timestamp.
Processing status.
External provider ID.

The exact schema should follow database.md and schema.md.

18. Message Roles

Messages should distinguish between different participants.

For example:

USER
ASSISTANT
SYSTEM
TOOL

The exact message-role model should remain consistent with the Conversation Engine documentation.

19. Message Direction

Messages should also distinguish direction.

INBOUND
OUTBOUND

Example:

WhatsApp → PenniWise
INBOUND

PenniWise → WhatsApp
OUTBOUND

This is useful for auditing, debugging, and message status tracking.

20. Message IDs

WhatsApp/provider message IDs should be stored when available.

Example:

externalMessageId

These identifiers are useful for:

Duplicate detection.
Delivery tracking.
Debugging.
Provider reconciliation.
21. Idempotency

Webhook events may be delivered more than once.

PenniWise must therefore prevent duplicate processing.

Conceptually:

Webhook Event
      │
      ▼
External Message ID
      │
      ▼
Already Processed?
    /       \
  YES        NO
   │          │
 Ignore     Process

This is particularly important for financial conversations.

22. Duplicate Message Protection

If the same WhatsApp message is received multiple times, the system should not:

Create multiple conversation messages.
Execute the same AI tool multiple times.
Execute the same financial action multiple times.
Send multiple unintended responses.
23. Financial Actions Through WhatsApp

WhatsApp can be used to initiate financial actions if the product supports them.

Example:

User:
Transfer ₦20,000 to John.

        │
        ▼

Conversation Engine

        │
        ▼

AI identifies intended action

        │
        ▼

Application validates request

        │
        ▼

Confirmation

        │
        ▼

Banking Service

        │
        ▼

Transaction Result

        │
        ▼

WhatsApp Response

WhatsApp itself must never bypass the application's financial controls.

24. Financial Confirmation

High-risk financial actions should require explicit confirmation.

Example:

PenniWise:

You're about to transfer ₦20,000 to John Doe.

Do you want to continue?

User:

Yes

Only after the confirmation has been validated should the application execute the operation.

25. Confirmation Security

Confirmation should be associated with:

User ID.
Conversation ID.
Intended action.
Action parameters.
Confirmation state.
Creation time.
Expiration time.

A confirmation should not be reusable for a different action.

26. WhatsApp Message Types

The integration may support different message types depending on the provider and product requirements.

Potential types include:

Text
Image
Document
Audio
Interactive message
Button
List
Location

The first implementation should prioritize the message types required by the product roadmap.

27. Text Messages

Text messages are the primary conversational interface.

Example:

User:
What's my balance?

PenniWise:
Your current balance is ₦XXX.

The response should be generated from verified application data.

28. Interactive Messages

Where supported, interactive WhatsApp messages can be used for structured choices.

Example:

What would you like to do?

[Check Balance]
[View Transactions]
[Track Savings]

Interactive controls can reduce ambiguity for common workflows.

29. Media Messages

If media support is added, the application should validate:

File type.
File size.
Source.
Content.
User permissions.

Media should not be trusted simply because it was received through WhatsApp.

30. Voice Messages

If voice messages are supported, the architecture should be:

WhatsApp Voice Message
        │
        ▼
Audio Retrieval
        │
        ▼
Speech-to-Text
        │
        ▼
Conversation Engine
        │
        ▼
AI

The resulting transcription should still be treated as untrusted user input.

31. Language Handling

The Conversation Engine may support multiple languages if required by the product.

WhatsApp-specific code should not contain language-specific financial logic.

Instead:

WhatsApp
   │
   ▼
Normalized Message
   │
   ▼
Conversation Engine
   │
   ▼
Language / AI Processing
32. Response Formatting

AI responses should be adapted for WhatsApp.

Responses should account for:

Message length.
Readability.
Formatting support.
Interactive message capabilities.
User experience.

Long responses should be structured clearly.

33. Financial Numbers

Financial responses should use consistent formatting.

Example:

₦50,000.00

The exact currency formatting should follow PenniWise's financial formatting rules.

34. Transaction Status Messages

When a transaction is pending, the WhatsApp response must communicate the actual state.

Example:

Your transfer is still being processed.

Transaction reference:
PW-123456

The system must not claim that a transaction succeeded unless the underlying service confirms success.

35. Provider Errors

If the WhatsApp provider is unavailable:

WhatsApp
   │
   X
Provider Failure

The application should log the failure and handle it according to the messaging reliability strategy.

A provider failure should not alter the underlying financial transaction state.

36. Financial Service Failure

A WhatsApp delivery failure must not be interpreted as a financial transaction failure.

For example:

Banking Transaction
       │
       ▼
SUCCESS
       │
       ▼
WhatsApp Delivery
       X

The banking transaction can still be successful even if the notification cannot be delivered.

The transaction status should be stored independently.

37. Message Delivery Status

Where supported, provider events may indicate:

SENT
DELIVERED
READ
FAILED

These statuses should be treated as messaging information and should not be confused with financial transaction status.

38. Webhook Event Processing

Incoming events should be classified.

Example:

Webhook
  │
  ├── Message Received
  │
  ├── Message Delivered
  │
  ├── Message Read
  │
  └── Message Failed

Each event type should have a dedicated processing path where necessary.

39. Webhook Retry Handling

External providers may retry webhook requests when delivery fails.

PenniWise should safely handle repeated events.

The processing system should use event or message identifiers to avoid duplicate side effects.

40. Webhook Response

The webhook endpoint should acknowledge valid events appropriately.

Long-running processing should not unnecessarily block the webhook request.

A preferred architecture is:

Webhook
   │
   ▼
Validate
   │
   ▼
Acknowledge
   │
   ▼
Queue / Process
   │
   ▼
Conversation Engine

The exact implementation depends on the project's infrastructure.

41. Redis and WhatsApp

Redis may be used for temporary WhatsApp-related state where appropriate.

Potential uses include:

Rate limiting.
Temporary conversation state.
Idempotency keys.
Short-lived confirmation state.
Processing locks.

Redis should not become the authoritative source for permanent financial records.

42. WhatsApp Rate Limiting

The system should prevent abuse of the WhatsApp integration.

Potential controls include:

Messages per user
Messages per minute
AI requests
Financial action attempts
Webhook requests

Limits should be designed according to expected usage.

43. Abuse Prevention

Potential abuse patterns include:

Message flooding.
Repeated AI requests.
Repeated financial action attempts.
Prompt injection.
Malicious media.
Account-linking abuse.

The WhatsApp layer should work with the application's general security and rate-limiting systems.

44. Authentication and WhatsApp

WhatsApp identity alone should not be treated as sufficient authorization for sensitive financial operations.

For sensitive workflows, PenniWise may require additional authentication or confirmation depending on the security model.

The exact mechanism should be defined by the authentication architecture.

45. Account Takeover Protection

If an attacker gains access to a user's WhatsApp account, they may attempt to access PenniWise.

Therefore sensitive actions should have appropriate additional protections.

Potential controls include:

Strong account linking.
Authentication.
Transaction confirmation.
Risk checks.
Device/session controls.
Transaction limits.
46. Sensitive Data in WhatsApp

The application should minimize unnecessary sensitive information in WhatsApp messages.

For example, avoid exposing:

Full bank account numbers.
Authentication secrets.
API keys.
Passwords.
Private provider credentials.

Only information required for the user's task should be displayed.

47. Conversation Privacy

WhatsApp conversations may contain sensitive financial information.

PenniWise should therefore treat conversation data as sensitive application data.

Access should be limited to:

Authenticated User
Authorized Internal Services
Authorized Administrative Functions
48. Logging WhatsApp Messages

Logs should not unnecessarily contain complete message content.

Prefer logging metadata such as:

messageId
userId
conversationId
eventType
timestamp
processingStatus

rather than sensitive message contents.

49. WhatsApp Secrets

Provider credentials must be stored as environment variables or an approved secret-management system.

Examples may include:

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=

The exact variables depend on the provider implementation.

These values must never be committed to GitHub.

50. Environment Configuration

The .env.example file should document the required WhatsApp variables without containing real credentials.

Example:

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=

The actual .env file should remain private.

51. Development Environment

During development, the team should avoid accidentally sending test messages to real users.

Recommended separation:

Development
    │
    ├── Test WhatsApp configuration
    ├── Test database
    └── Development secrets

Production
    │
    ├── Production WhatsApp configuration
    ├── Production database
    └── Production secrets
52. Testing

WhatsApp integration tests should cover:

[ ] Webhook verification
[ ] Invalid webhook
[ ] Valid text message
[ ] Unknown user
[ ] Known user
[ ] Duplicate message
[ ] Invalid payload
[ ] Provider failure
[ ] AI failure
[ ] Conversation failure
[ ] Financial action
[ ] Confirmation
[ ] Confirmation expiration
[ ] Transaction status
[ ] Delivery failure
53. Security Testing

Security tests should include:

[ ] Forged webhook
[ ] Invalid signature
[ ] Unauthorized user
[ ] User identity spoofing
[ ] Cross-user conversation access
[ ] Duplicate webhook
[ ] Replay attack
[ ] Prompt injection
[ ] Unauthorized tool execution
[ ] Financial action without confirmation
[ ] Secret exposure
54. Observability

The WhatsApp integration should provide enough logging and monitoring to diagnose failures.

Useful metrics include:

Incoming messages
Messages processed
Processing failures
Webhook failures
Duplicate events
AI processing time
Response delivery failures
Financial workflow failures

Sensitive user content should be excluded or minimized in logs.

55. WhatsApp Integration Directory

A possible backend structure is:

server/
└── src/
    ├── modules/
    │   └── whatsapp/
    │       ├── whatsapp.controller.ts
    │       ├── whatsapp.service.ts
    │       ├── whatsapp.provider.ts
    │       ├── whatsapp.types.ts
    │       ├── whatsapp.validation.ts
    │       └── whatsapp.routes.ts
    │
    ├── conversation/
    ├── ai/
    ├── banking/
    ├── brokerage/
    └── config/

The exact directory structure should follow the project's established architecture.

56. WhatsApp Provider Interface

A provider abstraction may expose operations such as:

interface WhatsAppProvider {
  sendTextMessage(
    recipient: string,
    message: string
  ): Promise<void>;

  sendInteractiveMessage(
    recipient: string,
    message: unknown
  ): Promise<void>;

  verifyWebhook(
    request: unknown
  ): boolean;
}

The exact interface should be defined according to the selected provider.

57. Separation of Concerns

The WhatsApp controller should handle transport-level concerns.

The WhatsApp service should handle WhatsApp-specific logic.

The Conversation Engine should handle conversational processing.

Application services should handle business operations.

Example:

WhatsApp Controller
        │
        ▼
WhatsApp Service
        │
        ▼
Conversation Engine
        │
        ▼
Application Services
58. Error Handling

Errors should be separated into categories.

Provider Errors
WhatsApp provider unavailable
Validation Errors
Invalid webhook payload
Authentication Errors
User cannot be identified
Conversation Errors
Conversation engine unavailable
Financial Errors
Banking or brokerage operation failed

Each error should be handled at the appropriate layer.

59. WhatsApp and AI Safety

The WhatsApp channel does not change PenniWise's AI safety rules.

The same safety architecture applies:

WhatsApp
   │
   ▼
Conversation Engine
   │
   ▼
AI
   │
   ▼
Tool Validation
   │
   ▼
Authorization
   │
   ▼
Confirmation
   │
   ▼
Application Service

The communication channel must never become a way to bypass AI or financial guardrails.

60. Future Channel Support

The WhatsApp integration should be designed so that other channels can be added later.

Potential future channels include:

Web
Mobile App
Telegram
SMS
Other Messaging Platforms

All channels should eventually converge on the same Conversation Engine.

WhatsApp ──────┐
Web ───────────┤
Mobile ────────┤
Other Channels ┘
        │
        ▼
Conversation Engine
        │
        ▼
AI + Application Services
61. Implementation Checklist

Before considering WhatsApp integration complete:

[ ] WhatsApp provider selected
[ ] Developer account configured
[ ] Phone number configured
[ ] Webhook configured
[ ] Webhook verification implemented
[ ] Payload validation implemented
[ ] User identity mapping implemented
[ ] Account linking implemented
[ ] Message normalization implemented
[ ] Conversation integration implemented
[ ] Message persistence implemented where required
[ ] Duplicate message protection implemented
[ ] Rate limiting implemented
[ ] Error handling implemented
[ ] Provider retry handling implemented
[ ] Financial confirmation implemented
[ ] Sensitive data handling reviewed
[ ] Secrets added to environment configuration
[ ] .env.example updated
[ ] Development configuration separated from production
[ ] Tests implemented
[ ] Monitoring/logging implemented
62. Final WhatsApp Architecture

The intended architecture is:

                         WHATSAPP USER
                               │
                               ▼
                     WhatsApp Provider
                               │
                               ▼
                    Webhook / API Layer
                               │
                               ▼
                     Webhook Validation
                               │
                               ▼
                    Identity Resolution
                               │
                               ▼
                    Message Normalization
                               │
                               ▼
                     Conversation Engine
                               │
                               ▼
                              AI
                               │
                       ┌───────┴───────┐
                       ▼               ▼
                  Read Tools      Action Tools
                       │               │
                       ▼               ▼
                 Application     Confirmation
                   Services           │
                       │               ▼
                       │         Application
                       │           Service
                       │               │
                       └───────┬───────┘
                               ▼
                    Verified Application Result
                               │
                               ▼
                     Conversation Response
                               │
                               ▼
                     WhatsApp Provider
                               │
                               ▼
                         WHATSAPP USER

The fundamental WhatsApp architecture principle is:

WhatsApp is a communication channel, not a business-logic or security boundary. All authentication, authorization, AI safety, financial validation, confirmation, and transaction execution must remain inside the PenniWise application.
