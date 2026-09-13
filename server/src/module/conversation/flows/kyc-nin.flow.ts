import type { FlowHandler } from '../conversation.types';
import * as kycService from '../../kyc/kyc.service';

export const awaitingNinFlow: FlowHandler = async (user, message) => {
  const nin = (message.text?.body ?? '').trim().replace(/\s+/g, '');
  const result = await kycService.verifyNin(user.id, nin);

  if (!result.success) {
    return {
      reply: `That didn't work: ${result.failureReason}. Please double-check your 11-digit NIN and try again.`,
      nextState: 'AWAITING_NIN',
    };
  }

  return {
    reply: `NIN verified! Last identity step — please send a clear selfie photo so we can confirm it's really you.`,
    nextState: 'AWAITING_LIVENESS',
  };
};
