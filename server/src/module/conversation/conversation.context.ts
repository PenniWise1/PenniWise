import { z } from 'zod';
import { normalizedEntitiesSchema } from '../ai/intent/intent.schema';

// Durable conversation context is intentionally small. It must never contain
// credentials, raw KYC data, financial action payloads, or model instructions.
const conversationContextSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    currentIntent: z.string().trim().min(1).max(100).optional(),
    entities: normalizedEntitiesSchema.optional(),
    pendingClarification: z
      .object({
        intent: z.string().trim().min(1).max(100),
        missingEntities: z.array(z.string().trim().min(1).max(100)).max(10),
      })
      .strict()
      .optional(),
    // The complete action payload remains in PendingAiAction, not memory.
    pendingConfirmationId: z.string().uuid().optional(),
  })
  .strict();

export type ConversationContext = z.infer<typeof conversationContextSchema>;

export function readConversationContext(value: unknown): ConversationContext {
  const parsed = conversationContextSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

export function mergeConversationContext(
  current: unknown,
  patch: ConversationContext,
): ConversationContext {
  return conversationContextSchema.parse({
    ...readConversationContext(current),
    ...patch,
  });
}
