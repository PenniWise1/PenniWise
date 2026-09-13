import type { FlowHandler } from '../conversation.types';
import * as kycService from '../../kyc/kyc.service';
import * as whatsappService from '../../whatsapp/whatsapp.service';

export const awaitingLivenessFlow: FlowHandler = async (user, message) => {
  if (!message.image) {
    return {
      reply: `Please send a clear selfie photo to complete identity verification.`,
      nextState: 'AWAITING_LIVENESS',
    };
  }

  const imageBuffer = await whatsappService.downloadInboundMedia(
    message.image.id,
  );
  const result = await kycService.verifyLiveness(user.id, imageBuffer);

  if (!result.success) {
    return {
      reply: `We couldn't verify that photo: ${result.failureReason}. Please try again with a clear, well-lit selfie.`,
      nextState: 'AWAITING_LIVENESS',
    };
  }

  return {
    reply: [
      `You're verified! Last step — how would you describe your investing style?`,
      `1. Conservative (safety first)`,
      `2. Moderate (balanced)`,
      `3. Aggressive (higher risk, higher reward)`,
    ].join('\n'),
    nextState: 'AWAITING_RISK_PROFILE',
  };
};
