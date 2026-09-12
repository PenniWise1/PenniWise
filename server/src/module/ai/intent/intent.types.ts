export const INTENT_VALUES = [
  'general_help',
  'greeting',
  'get_user_profile',
  'get_wallet_balance',
  'get_transactions',
  'get_savings_goals',
  'get_portfolio',
  'get_instrument',
  'get_market_data',
  'create_savings_goal',
  'create_price_alert',
  'deposit_money',
  'withdraw_money',
  'place_order',
  'sell_investment',
  'transfer_money',
  'onboarding',
  'unknown',
  'clarification_required',
] as const;

export type AiIntent = (typeof INTENT_VALUES)[number];

export type RequiredEntity =
  | 'amount'
  | 'beneficiaryName'
  | 'quantity'
  | 'side'
  | 'symbol';

export interface IntentPolicy {
  requiresTool: boolean;
  requiresConfirmation: boolean;
  requiredEntities: RequiredEntity[];
}
