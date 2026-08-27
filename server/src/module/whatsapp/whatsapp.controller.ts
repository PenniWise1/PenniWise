import { Request, Response, NextFunction } from 'express';
import * as whatsappService from './whatsapp.service';
import type { WhatsAppWebhookPayload } from './whatsapp.types';
import logger from '../../config/logger';
import { catchAsync } from '../../utils/catchAsync';

export const verifyHandler = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  if (whatsappService.verifyWebhookSubscription(mode, token)) {
    logger.info('WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }
  logger.warn('Failed WhatsApp webhook verification attempt');
  res.sendStatus(403);
};

export const receiveHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      whatsappService.verifySignature(
        req.rawBody,
        req.headers['x-hub-signature-256'] as string | undefined,
      );
    } catch (err) {
      logger.warn('WhatsApp signature verification failed', { err });
      return next(err);
    }

    res.sendStatus(200);

    try {
      const payload = req.body as WhatsAppWebhookPayload;
      const message = whatsappService.parseInboundMessage(payload);
      if (!message) return;

      logger.info(`Received WhatsApp message from ${message.from}`);

      // TODO(Phase 9): hand off to the conversation engine's state machine
      // instead of echoing. This confirms the pipe works end to end.
      await whatsappService.sendTextMessage(
        message.from,
        `You said: ${message.text?.body ?? '[non-text message]'}`,
      );
      logger.info(`Sent echo response to ${message.from}`);
    } catch (err) {
      logger.error('Error processing WhatsApp message:', err);
    }
  },
);
