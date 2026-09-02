import type { FlowHandler } from '../conversation.types';

export const idleFlow: FlowHandler = async (user) => {
  if (user.status === 'PENDING_KYC' && !user.firstName) {
    return {
      reply: `Welcome to Penniwise! Let's get your account set up.\n\nWhat's your first name?`,
      nextState: 'ONBOARDING',
    };
  }

  return {
    reply: [
      `Hi ${user.firstName ?? 'there'}, what would you like to do?`,
      `1. Trade stocks`,
      `2. Save money`,
      `3. View portfolio`,
    ].join('\n'),
    nextState: 'IDLE',
  };
};
