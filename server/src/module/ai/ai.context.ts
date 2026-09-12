import { z } from 'zod';
import type { AiUsage } from './ai.types';
import type { AiResult } from './ai.result';

const conversationStateSchema = z.enum([
  'IDLE',
  'ONBOARDING',
  'AWAITING_BVN',
  'AWAITING_NIN',
  'AWAITING_LIVENESS',
  'AWAITING_RISK_PROFILE',
  'TRADING',
  'SAVING',
  'AWAITING_TRADE_CONFIRM',
  'ESCALATED_TO_AGENT',
]);

export const aiPromptTaskSchema = z.enum([
  'general_conversation',
  'intent_classification',
  'entity_extraction',
  'tool_selection',
  'final_response',
  'confirmation_request',
  'safety_response',
]);

export type AiPromptTask = z.infer<typeof aiPromptTaskSchema>;

const recentMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2_000),
  })
  .strict();

export const aiOrchestrationContextSchema = z
  .object({
    // This identity is application-provided and is never accepted from model output.
    userId: z.string().trim().min(1).max(200),
    conversationId: z.string().trim().min(1).max(200).optional(),
    conversationState: conversationStateSchema,
    task: aiPromptTaskSchema.default('general_conversation'),
    availableCapabilities: z
      .array(z.string().trim().min(1).max(100))
      .max(20)
      .default([]),
    recentMessages: z.array(recentMessageSchema).max(10).default([]),
    conversationContext: z.record(z.string(), z.string().max(500)).default({}),
    metadata: z.record(z.string(), z.string().max(500)).default({}),
    userMessage: z.string().trim().min(1).max(4_000),
  })
  .strict();

export type AiOrchestrationContext = z.infer<
  typeof aiOrchestrationContextSchema
>;

export type AiOrchestrationInput = z.input<
  typeof aiOrchestrationContextSchema
>;

export interface AiOrchestrationResponse {
  userId: string;
  conversationId?: string;
  result: AiResult;
  usage?: AiUsage;
}
