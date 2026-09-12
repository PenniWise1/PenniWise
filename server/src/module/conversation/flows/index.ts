import type { ConversationState } from '../../../generated/prisma';
import type { FlowHandler } from '../conversation.types';
import { idleFlow } from './idle.flow';
import { onboardingFlow } from './onboarding.flow';

export const FLOW_REGISTRY: Partial<Record<ConversationState, FlowHandler>> = {
  IDLE: idleFlow,
  ONBOARDING: onboardingFlow,
};
