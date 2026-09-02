import type { Prisma } from '../../generated/prisma';
import logger from '../../config/logger';
import { usersRepository } from '../users/users.repository';
import { conversationRepository } from './conversation.repository';
import { FLOW_REGISTRY } from './flows';
import { assertTransition } from './conversation.state-machine';
import {
  isSessionStale,
  buildResumePrompt,
  safeFallbackState,
} from './conversation.recovery';
import * as whatsappService from '../whatsapp/whatsapp.service';
import type { WhatsAppInboundMessage } from '../whatsapp/whatsapp.types';

const RESTART_KEYWORD = 'restart';

export async function handleInboundMessage(
  message: WhatsAppInboundMessage,
): Promise<void> {
  logger.info(`Incoming message from ${message.from}, type: ${message.type}`);
  const user = await usersRepository.findOrCreate(message.from);

  const messageText =
    message.text?.body ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    '';

  await conversationRepository.logMessage({
    userId: user.id,
    direction: 'INBOUND',
    messageType: message.type,
    content: message as unknown as Prisma.InputJsonValue,
    whatsappMessageId: message.id,
  });

  if (messageText.trim().toLowerCase() === RESTART_KEYWORD) {
    assertTransition(user.conversationState, 'IDLE');
    await usersRepository.updateConversationState(user.id, 'IDLE', {});
    await sendReply(
      user.id,
      message.from,
      `No problem, let's start fresh. What would you like to do?`,
    );
    return;
  }

  if (isSessionStale(user)) {
    await sendReply(user.id, message.from, buildResumePrompt(user));
    await usersRepository.touchLastInteraction(user.id);
    return;
  }

  const handler = FLOW_REGISTRY[user.conversationState];

  if (!handler) {
    // A state exists in the schema for a phase that isn't built yet.
    // Explain and reset, rather than the bot going silent.
    assertTransition(user.conversationState, 'IDLE');
    await usersRepository.updateConversationState(user.id, 'IDLE', {});
    await sendReply(
      user.id,
      message.from,
      `That part of Penniwise isn't available yet — here's the main menu instead.`,
    );
    return;
  }

  try {
    const interactiveReplyId =
      message.interactive?.button_reply?.id ??
      message.interactive?.list_reply?.id;
    const result = await handler(user, messageText, interactiveReplyId);

    logger.info(
      `User ${user.id} transitioning from ${user.conversationState} to ${result.nextState}`,
    );
    assertTransition(user.conversationState, result.nextState);

    const mergedContext = {
      ...((user.conversationContext as Record<string, unknown>) ?? {}),
      ...result.contextPatch,
    };

    await usersRepository.updateConversationState(
      user.id,
      result.nextState,
      mergedContext as Prisma.InputJsonValue,
    );
    if (result.profilePatch) {
      await usersRepository.updateProfile(user.id, result.profilePatch);
    }

    await sendReply(user.id, message.from, result.reply);
  } catch (err) {
    logger.error(
      `Flow handler error for user ${user.id} in state ${user.conversationState}:`,
      err,
    );
    const fallback = safeFallbackState();
    await usersRepository.updateConversationState(
      user.id,
      fallback.nextState,
      {},
    );
    await sendReply(user.id, message.from, fallback.reply);
  }
}

async function sendReply(
  userId: string,
  whatsappNumber: string,
  replyText: string,
) {
  await whatsappService.sendTextMessage(whatsappNumber, replyText);
  await conversationRepository.logMessage({
    userId,
    direction: 'OUTBOUND',
    messageType: 'text',
    content: { body: replyText },
  });
}
