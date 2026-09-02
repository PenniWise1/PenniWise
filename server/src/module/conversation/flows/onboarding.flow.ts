import type { FlowHandler } from '../conversation.types';

export const onboardingFlow: FlowHandler = async (user, messageText) => {
  const context = (user.conversationContext as Record<string, unknown>) ?? {};
  const trimmed = messageText.trim();

  if (!trimmed) {
    return {
      reply: `Sorry, I didn't catch that — what's your first name?`,
      nextState: 'ONBOARDING',
    };
  }

  if (!context['firstName']) {
    return {
      reply: `Nice to meet you, ${trimmed}! What's your last name?`,
      nextState: 'ONBOARDING',
      contextPatch: { firstName: trimmed },
    };
  }

  return {
    reply: [
      `Thanks, ${context['firstName']} ${trimmed}!`,
      `Full identity verification (BVN/NIN) is coming in a future update — for now, here's your main menu.`,
    ].join(' '),
    nextState: 'IDLE',
    contextPatch: {}, // clear onboarding progress — it's saved to real profile fields below
    profilePatch: {
      firstName: context['firstName'] as string,
      lastName: trimmed,
    },
  };
};
