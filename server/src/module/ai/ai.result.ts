import { z } from 'zod';

const requestedToolSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    arguments: z.record(z.string(), z.unknown()),
  })
  .strict();

export const aiResultSchema = z
  .object({
    type: z.enum(['direct_response', 'clarification', 'refusal', 'tool_request']),
    message: z.string().trim().min(1).max(4_000),
    intent: z.string().trim().min(1).max(100).nullable(),
    entities: z.record(z.string(), z.unknown()),
    requestedTool: requestedToolSchema.nullable(),
    confirmationRequired: z.boolean(),
  })
  .strict();

export type AiResult = z.infer<typeof aiResultSchema>;

// This schema is sent to the provider as a formatting instruction. The Zod
// schema above remains the authoritative validation boundary.
export const AI_RESULT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type',
    'message',
    'intent',
    'entities',
    'requestedTool',
    'confirmationRequired',
  ],
  properties: {
    type: {
      type: 'string',
      enum: ['direct_response', 'clarification', 'refusal', 'tool_request'],
    },
    message: { type: 'string', minLength: 1, maxLength: 4000 },
    intent: { type: ['string', 'null'], maxLength: 100 },
    entities: { type: 'object', additionalProperties: true },
    requestedTool: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['name', 'arguments'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        arguments: { type: 'object', additionalProperties: true },
      },
    },
    confirmationRequired: { type: 'boolean' },
  },
};
