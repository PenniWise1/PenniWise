import type { FlowHandler } from '../conversation.types';
import { usersRepository } from '../../users/users.repository';
import * as kycService from '../../kyc/kyc.service';

const RISK_MAP: Record<string, 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'> = {
  '1': 'CONSERVATIVE',
  '2': 'MODERATE',
  '3': 'AGGRESSIVE',
};

export const awaitingRiskProfileFlow: FlowHandler = async (user, message) => {
  const choice = (message.text?.body ?? '').trim();
  const riskProfile = RISK_MAP[choice];

  if (!riskProfile) {
    return {
      reply: `Please reply with 1, 2, or 3 to choose your investing style.`,
      nextState: 'AWAITING_RISK_PROFILE',
    };
  }

  await usersRepository.setRiskProfile(user.id, riskProfile);
  const completed = await kycService.completeKycIfEligible(user.id);

  return {
    reply: completed
      ? `You're all set! Your account is now fully verified and active. What would you like to do?\n\n1. Trade stocks\n2. Save money\n3. View portfolio`
      : `Thanks! There's an issue finishing verification — our team will review your account shortly.`,
    nextState: 'IDLE',
  };
};
