import type { FlowHandler } from '../conversation.types';
import { readConversationContext } from '../conversation.context';

export const onboardingFlow: FlowHandler = async (user, messageText) => {
  const context = readConversationContext(user.conversationContext);
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
      clearContext: true,
    profilePatch: {
      firstName: context['firstName'] as string,
      lastName: trimmed,
    },
  };
};
