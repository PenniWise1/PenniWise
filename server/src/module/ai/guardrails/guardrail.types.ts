import { z } from 'zod';
import type { AiOrchestrationContext } from '../ai.context';
import type { IntentAnalysis } from '../entities/entity-extractor';
import type { AiIntent } from '../intent/intent.types';

export const HIGH_RISK_INTENTS = [
  'deposit_money',
  'withdraw_money',
  'place_order',
  'sell_investment',
  'transfer_money',
] as const satisfies readonly AiIntent[];

export type HighRiskIntent = (typeof HIGH_RISK_INTENTS)[number];

export interface GuardrailContext {
  userId: string;
  conversationState: AiOrchestrationContext['conversationState'];
}

export interface PendingActionDraft {
  userId: string;
  actionType: HighRiskIntent;
  payload: Record<string, unknown>;
}

export interface FinancialServiceResult {
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
}

export const highRiskPayloadSchemas: Record<
  HighRiskIntent,
  z.ZodType<Record<string, unknown>>
> = {
  deposit_money: z.object({ amount: z.number().positive(), currency: z.literal('NGN').optional() }).strict(),
  withdraw_money: z.object({ amount: z.number().positive(), currency: z.literal('NGN').optional() }).strict(),
  transfer_money: z.object({ amount: z.number().positive(), currency: z.literal('NGN').optional(), beneficiaryName: z.string().trim().min(1).max(100) }).strict(),
  place_order: z.object({ symbol: z.string().regex(/^[A-Z0-9.]{1,20}$/), quantity: z.number().positive(), side: z.literal('BUY') }).strict(),
  sell_investment: z.object({ symbol: z.string().regex(/^[A-Z0-9.]{1,20}$/), quantity: z.number().positive(), side: z.literal('SELL') }).strict(),
};

export function isHighRiskIntent(intent: IntentAnalysis['intent']): intent is HighRiskIntent {
  return (HIGH_RISK_INTENTS as readonly string[]).includes(intent);
}
