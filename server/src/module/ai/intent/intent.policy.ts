import type { AiIntent, IntentPolicy } from './intent.types';

const READ_POLICY: IntentPolicy = {
  requiresTool: true,
  requiresConfirmation: false,
  requiredEntities: [],
};

const SENSITIVE_ACTION_POLICY: IntentPolicy = {
  requiresTool: true,
  requiresConfirmation: true,
  requiredEntities: [],
};

export const INTENT_POLICY: Record<AiIntent, IntentPolicy> = {
  general_help: { requiresTool: false, requiresConfirmation: false, requiredEntities: [] },
  greeting: { requiresTool: false, requiresConfirmation: false, requiredEntities: [] },
  onboarding: { requiresTool: false, requiresConfirmation: false, requiredEntities: [] },
  unknown: { requiresTool: false, requiresConfirmation: false, requiredEntities: [] },
  clarification_required: { requiresTool: false, requiresConfirmation: false, requiredEntities: [] },
  get_user_profile: READ_POLICY,
  get_wallet_balance: READ_POLICY,
  get_transactions: READ_POLICY,
  get_savings_goals: READ_POLICY,
  get_portfolio: READ_POLICY,
  get_instrument: { ...READ_POLICY, requiredEntities: ['symbol'] },
  get_market_data: { ...READ_POLICY, requiredEntities: ['symbol'] },
  create_savings_goal: {
    requiresTool: true,
    requiresConfirmation: false,
    requiredEntities: ['amount'],
  },
  create_price_alert: {
    requiresTool: true,
    requiresConfirmation: false,
    requiredEntities: ['symbol'],
  },
  deposit_money: { ...SENSITIVE_ACTION_POLICY, requiredEntities: ['amount'] },
  withdraw_money: { ...SENSITIVE_ACTION_POLICY, requiredEntities: ['amount'] },
  place_order: {
    ...SENSITIVE_ACTION_POLICY,
    requiredEntities: ['symbol', 'quantity', 'side'],
  },
  sell_investment: {
    ...SENSITIVE_ACTION_POLICY,
    requiredEntities: ['symbol', 'quantity', 'side'],
  },
  transfer_money: {
    ...SENSITIVE_ACTION_POLICY,
    requiredEntities: ['amount', 'beneficiaryName'],
  },
};
