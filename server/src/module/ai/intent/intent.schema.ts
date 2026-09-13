import { z } from 'zod';
import { INTENT_VALUES } from './intent.types';

export const normalizedEntitiesSchema = z
  .object({
    amount: z.number().finite().positive().max(1_000_000_000_000).optional(),
    currency: z.enum(['NGN']).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.]{1,20}$/).optional(),
    quantity: z.number().finite().positive().max(1_000_000_000).optional(),
    side: z.enum(['BUY', 'SELL']).optional(),
    beneficiaryName: z.string().trim().min(1).max(100).optional(),
    goalName: z.string().trim().min(1).max(100).optional(),
    targetPrice: z.number().finite().positive().max(1_000_000_000_000).optional(),
  })
  .strict();

export const rawIntentAnalysisSchema = z
  .object({
    intent: z.enum(INTENT_VALUES),
    confidence: z.number().finite().min(0).max(1),
    requiresTool: z.boolean(),
    requiresConfirmation: z.boolean(),
    entities: normalizedEntitiesSchema,
  })
  .strict();

export type NormalizedEntities = z.infer<typeof normalizedEntitiesSchema>;
export type RawIntentAnalysis = z.infer<typeof rawIntentAnalysisSchema>;

export const INTENT_ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'intent',
    'confidence',
    'requiresTool',
    'requiresConfirmation',
    'entities',
  ],
  properties: {
    intent: { type: 'string', enum: INTENT_VALUES },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    requiresTool: { type: 'boolean' },
    requiresConfirmation: { type: 'boolean' },
    entities: {
      type: 'object',
      additionalProperties: false,
      properties: {
        amount: { type: 'number', exclusiveMinimum: 0 },
        currency: { type: 'string', enum: ['NGN'] },
        frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
        symbol: { type: 'string' },
        quantity: { type: 'number', exclusiveMinimum: 0 },
        side: { type: 'string', enum: ['BUY', 'SELL'] },
        beneficiaryName: { type: 'string' },
        goalName: { type: 'string' },
        targetPrice: { type: 'number', exclusiveMinimum: 0 },
      },
    },
  },
};
