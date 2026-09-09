import type { ConversationState } from '@prisma/client';
import type { FlowHandler } from '../conversation.types';
import { idleFlow } from './idle.flow';
import { onboardingFlow } from './onboarding.flow';
import { awaitingBvnFlow } from './kyc-bvn.flow';
import { awaitingNinFlow } from './kyc-nin.flow';
import { awaitingLivenessFlow } from './kyc-liveness.flow';
import { awaitingRiskProfileFlow } from './kyc-risk-profile.flow';

export const FLOW_REGISTRY: Partial<Record<ConversationState, FlowHandler>> = {
  IDLE: idleFlow,
  ONBOARDING: onboardingFlow,
  AWAITING_BVN: awaitingBvnFlow,
  AWAITING_NIN: awaitingNinFlow,
  AWAITING_LIVENESS: awaitingLivenessFlow,
  AWAITING_RISK_PROFILE: awaitingRiskProfileFlow,
};
