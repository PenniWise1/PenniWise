export const WA_TEMPLATES = {
  WELCOME: { name: 'hello_world', language: 'en_US' },
  OTP_VERIFICATION: { name: 'otp_verification', language: 'en' },
  TRADE_CONFIRMED: { name: 'trade_confirmed', language: 'en' },
  TRADE_FAILED: { name: 'trade_failed', language: 'en' },
  SAVINGS_GOAL_REMINDER: { name: 'savings_goal_reminder', language: 'en' },
  SAVINGS_GOAL_REACHED: { name: 'savings_goal_reached', language: 'en' },
  KYC_REJECTED: { name: 'kyc_rejected', language: 'en' },
} as const;

export type WaTemplateKey = keyof typeof WA_TEMPLATES;
