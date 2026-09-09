import type { FlowHandler } from '../conversation.types';

const MENU = (name?: string | null) =>
  [
    `Hi ${name ?? 'there'}, what would you like to do?`,
    `1. Trade stocks`,
    `2. Save money`,
    `3. View portfolio`,
  ].join('\n');

// The default/home state.
export const idleFlow: FlowHandler = async (user, message) => {
  if (user.status === 'PENDING_KYC') {
    if (!user.firstName) {
      return {
        reply: `Welcome to Penniwise! Let's get your account set up.\n\nWhat's your first name?`,
        nextState: 'ONBOARDING',
      };
    }
    return {
      reply: `Let's finish verifying your account. What's your 11-digit BVN (Bank Verification Number)?`,
      nextState: 'AWAITING_BVN',
    };
  }

  const trimmed = (message.text?.body ?? '').trim();
  const menu = MENU(user.firstName);

  if (trimmed === '1')
    return {
      reply: `Trading is coming soon! Here's the menu again.\n\n${menu}`,
      nextState: 'IDLE',
    };
  if (trimmed === '2')
    return {
      reply: `Savings is coming soon! Here's the menu again.\n\n${menu}`,
      nextState: 'IDLE',
    };
  if (trimmed === '3')
    return {
      reply: `Portfolio view is coming soon! Here's the menu again.\n\n${menu}`,
      nextState: 'IDLE',
    };

  // TODO(Phase 10 — AI integration, owned separately): free text that
  // doesn't match a menu number should be routed through the AI intent
  // parser (see src/modules/ai/) instead of just falling back to the menu.
  // The ai/ module is already built (ai.intent-parser.ts, ai.guardrails.ts,
  // etc.) — this is just not wired in here yet, deliberately, until that
  // work is confirmed done.
  return {
    reply: `Sorry, I didn't quite catch that.\n\n${menu}`,
    nextState: 'IDLE',
  };
};
