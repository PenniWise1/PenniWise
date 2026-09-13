import type { FlowHandler } from '../conversation.types';
import * as kycService from '../../kyc/kyc.service';

export const awaitingBvnFlow: FlowHandler = async (user, message) => {
  const bvn = (message.text?.body ?? '').trim().replace(/\s+/g, '');
  const result = await kycService.verifyBvn(user.id, bvn);

  if (!result.success) {
    return {
      reply: `That didn't work: ${result.failureReason}. Please double-check your 11-digit BVN and try again.`,
      nextState: 'AWAITING_BVN',
    };
  }

  return {
    reply: `BVN verified! Now, what's your 11-digit NIN (National Identification Number)?`,
    nextState: 'AWAITING_NIN',
  };
};
