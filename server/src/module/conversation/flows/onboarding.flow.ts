import type { FlowHandler } from '../conversation.types';

interface OnboardingContext {
  firstName?: string;
}

export const onboardingFlow: FlowHandler = async (user, message) => {
  const context = (user.conversationContext as OnboardingContext | null) ?? {};
  const trimmed = (message.text?.body ?? '').trim();

  if (!trimmed) {
    return {
      reply: `Sorry, I didn't catch that — what's your first name?`,
      nextState: 'ONBOARDING',
    };
  }

  if (!context.firstName) {
    return {
      reply: `Nice to meet you, ${trimmed}! What's your last name?`,
      nextState: 'ONBOARDING',
      contextPatch: { firstName: trimmed },
    };
  }

  return {
    reply: [
      `Thanks, ${context.firstName} ${trimmed}!`,
      `Now let's verify your identity — what's your 11-digit BVN (Bank Verification Number)?`,
    ].join(' '),
    nextState: 'AWAITING_BVN',
    contextPatch: {}, // clear onboarding progress — it's saved to real profile fields below
    profilePatch: { firstName: context.firstName as string, lastName: trimmed },
  };
};
