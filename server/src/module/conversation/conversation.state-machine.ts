import type { ConversationState } from '@prisma/client';
import { ValidationError } from '../../utils/appError';

const TRANSITIONS: Record<ConversationState, ConversationState[]> = {
  IDLE: ['IDLE', 'ONBOARDING', 'TRADING', 'SAVING', 'ESCALATED_TO_AGENT'],
  ONBOARDING: ['ONBOARDING', 'AWAITING_BVN', 'IDLE', 'ESCALATED_TO_AGENT'],
  AWAITING_BVN: ['AWAITING_BVN', 'AWAITING_NIN', 'IDLE', 'ESCALATED_TO_AGENT'],
  AWAITING_NIN: [
    'AWAITING_NIN',
    'AWAITING_LIVENESS',
    'IDLE',
    'ESCALATED_TO_AGENT',
  ],
  AWAITING_LIVENESS: [
    'AWAITING_LIVENESS',
    'AWAITING_RISK_PROFILE',
    'IDLE',
    'ESCALATED_TO_AGENT',
  ],
  AWAITING_RISK_PROFILE: [
    'AWAITING_RISK_PROFILE',
    'IDLE',
    'ESCALATED_TO_AGENT',
  ],
  TRADING: ['TRADING', 'AWAITING_TRADE_CONFIRM', 'IDLE', 'ESCALATED_TO_AGENT'],
  SAVING: ['SAVING', 'IDLE', 'ESCALATED_TO_AGENT'],
  AWAITING_TRADE_CONFIRM: [
    'AWAITING_TRADE_CONFIRM',
    'IDLE',
    'ESCALATED_TO_AGENT',
  ],
  ESCALATED_TO_AGENT: ['ESCALATED_TO_AGENT', 'IDLE'],
};

export function canTransition(
  from: ConversationState,
  to: ConversationState,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ConversationState,
  to: ConversationState,
): void {
  if (!canTransition(from, to)) {
    throw new ValidationError(
      `Illegal conversation transition: ${from} -> ${to}`,
    );
  }
}
